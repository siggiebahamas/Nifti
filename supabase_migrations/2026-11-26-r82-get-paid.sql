-- Round 82: get paid faster (free for everyone)
-- 1) due dates on shop utang, 2) a statement link per shop customer (no account needed),
-- 3) "I paid" reports with a screenshot that wait for the shop's OK, 4) a log of reminders sent.

alter table public.downstream_sales add column if not exists due_date date;

create table if not exists public.utang_links(
  token text primary key,
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_name text not null,
  created_by_name text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '45 days',
  first_viewed_at timestamptz,
  last_viewed_at timestamptz,
  view_count int not null default 0
);
create index if not exists utang_links_biz_cust on public.utang_links(business_id, lower(customer_name));
alter table public.utang_links enable row level security;
drop policy if exists utang_links_member_read on public.utang_links;
create policy utang_links_member_read on public.utang_links for select to authenticated using (business_id in (select public.my_business_ids()));

create table if not exists public.utang_claims(
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_name text not null,
  amount numeric(14,2) not null check (amount > 0),
  method text not null,
  reference text,
  payer_name text,
  proof_path text,
  status text not null default 'pending' check (status in ('pending','confirmed','rejected')),
  reason text,
  token text,
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by text
);
create index if not exists utang_claims_biz on public.utang_claims(business_id, status, created_at desc);
alter table public.utang_claims enable row level security;
drop policy if exists utang_claims_member_read on public.utang_claims;
create policy utang_claims_member_read on public.utang_claims for select to authenticated using (business_id in (select public.my_business_ids()));
drop policy if exists utang_claims_member_update on public.utang_claims;
create policy utang_claims_member_update on public.utang_claims for update to authenticated
  using (business_id in (select public.my_business_ids())) with check (business_id in (select public.my_business_ids()));

-- the shop can only decide on a report (confirm / not received), never change what the customer sent
create or replace function public.utang_claims_guard() returns trigger language plpgsql set search_path = public as $$
begin
  if new.amount is distinct from old.amount or new.customer_name is distinct from old.customer_name or new.method is distinct from old.method
     or new.reference is distinct from old.reference or new.proof_path is distinct from old.proof_path or new.business_id is distinct from old.business_id
     or new.token is distinct from old.token or new.created_at is distinct from old.created_at then
    raise exception 'A payment report can only be confirmed or marked not received.';
  end if;
  if old.status <> 'pending' and new.status is distinct from old.status then raise exception 'This report was already decided.'; end if;
  if new.status <> old.status then new.decided_at := now(); end if;
  return new;
end $$;
drop trigger if exists utang_claims_guard on public.utang_claims;
create trigger utang_claims_guard before update on public.utang_claims for each row execute function public.utang_claims_guard();

create table if not exists public.utang_reminder_log(
  id bigserial primary key,
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_name text not null,
  stage text not null,
  channel text,
  sent_by text,
  sent_at timestamptz not null default now()
);
create index if not exists utang_reminder_log_biz on public.utang_reminder_log(business_id, sent_at desc);
alter table public.utang_reminder_log enable row level security;
drop policy if exists utang_reminder_log_read on public.utang_reminder_log;
create policy utang_reminder_log_read on public.utang_reminder_log for select to authenticated using (business_id in (select public.my_business_ids()));
drop policy if exists utang_reminder_log_insert on public.utang_reminder_log;
create policy utang_reminder_log_insert on public.utang_reminder_log for insert to authenticated with check (business_id in (select public.my_business_ids()));

-- statement data in the same shape as statement_data(), so the same page shows it
create or replace function public.utang_statement_data(p_business uuid, p_name text) returns jsonb
language sql stable security definer set search_path = public as $$
  with t as (select (now() at time zone 'Asia/Manila')::date d),
  terms as (select coalesce(nullif(b.books_settings->>'utang_terms_days','')::int, 15) days from businesses b where b.id = p_business),
  s as (
    select ds.id, ds.sale_date, coalesce(ds.due_date, ds.sale_date + (select days from terms)) due, ds.total,
      coalesce((select sum((p->>'amount')::numeric) from jsonb_array_elements(coalesce(ds.payments,'[]'::jsonb)) p), 0) paid,
      coalesce(ds.payments,'[]'::jsonb) payments,
      (select string_agg(coalesce(x.li->>'qty','1') || ' × ' || coalesce(x.li->>'product',''), ', ') from (select li from jsonb_array_elements(coalesce(ds.line_items,'[]'::jsonb)) li limit 3) x) items
    from downstream_sales ds
    where ds.business_id = p_business and lower(btrim(ds.customer_name)) = lower(btrim(p_name)) and ds.voided_at is null
  ),
  s2 as (select s.*, greatest(round(s.total - s.paid, 2), 0) balance from s),
  shown as (select s2.* from s2, t where s2.balance >= 1 or s2.sale_date >= t.d - 60),
  pays as (
    select s2.sale_date, public.nifti_iso_date(p->>'date') pdate, p->>'method' method, (p->>'amount')::numeric amount
    from s2, jsonb_array_elements(s2.payments) p, t
    where coalesce(public.nifti_iso_date(p->>'date'), t.d) >= t.d - 60
  ),
  cl as (select * from utang_claims c where c.business_id = p_business and lower(btrim(c.customer_name)) = lower(btrim(p_name)) and c.status = 'pending')
  select jsonb_build_object(
    'kind', 'utang',
    'as_of', (select d from t),
    'supplier', (select jsonb_build_object('name', b.name, 'tin', tp.tin, 'address', tp.registered_address, 'contact', b.shared_contact,
                   'pay_to', (select coalesce(jsonb_agg(a - 'id'), '[]'::jsonb) from jsonb_array_elements(coalesce(b.payment_methods,'[]'::jsonb)) a))
                 from businesses b left join tax_profiles tp on tp.business_id = b.id where b.id = p_business),
    'buyer', jsonb_build_object('name', btrim(p_name)),
    'invoices', (select coalesce(jsonb_agg(jsonb_build_object('po_number', coalesce(items, ''), 'invoice_number', 'Utang · ' || to_char(sale_date, 'Mon FMDD'),
                   'date', sale_date, 'due', due, 'amount', total, 'balance', balance, 'pending', 0,
                   'days_overdue', case when balance >= 1 then greatest((select d from t) - due, 0) else 0 end) order by due, sale_date), '[]'::jsonb) from shown),
    'payments', (select coalesce(jsonb_agg(jsonb_build_object('date', pdate, 'invoice_number', 'Utang · ' || to_char(sale_date, 'Mon FMDD'), 'po_number', '', 'method', method,
                   'reference', null, 'amount', amount, 'status', 'confirmed') order by pdate desc nulls last), '[]'::jsonb) from pays),
    'aging', (select jsonb_build_object(
        'current', coalesce(sum(balance) filter (where due >= t.d), 0),
        'd1_30', coalesce(sum(balance) filter (where t.d - due between 1 and 30), 0),
        'd31_60', coalesce(sum(balance) filter (where t.d - due between 31 and 60), 0),
        'd61_90', coalesce(sum(balance) filter (where t.d - due between 61 and 90), 0),
        'd90p', coalesce(sum(balance) filter (where t.d - due > 90), 0)) from s2, t),
    'totals', (select jsonb_build_object('balance', coalesce(sum(balance), 0), 'pending', (select coalesce(sum(amount), 0) from cl), 'open_count', count(*) filter (where balance >= 1)) from s2),
    'claims', (select coalesce(jsonb_agg(jsonb_build_object('amount', amount, 'method', method, 'reference', reference, 'at', created_at) order by created_at desc), '[]'::jsonb) from cl)
  )
$$;
revoke all on function public.utang_statement_data(uuid, text) from public, anon, authenticated;

create or replace function public.create_utang_link(p_customer text) returns text
language plpgsql security definer set search_path = public as $$
declare me uuid := public.nifti_my_business(); tok text; who text; nm text := left(btrim(coalesce(p_customer, '')), 120);
begin
  if me is null then raise exception 'Sign in first.'; end if;
  if nm = '' or lower(nm) = 'walk-in' then raise exception 'Pick the customer first.'; end if;
  if not exists (select 1 from downstream_sales where business_id = me and lower(btrim(customer_name)) = lower(nm) and voided_at is null) then
    raise exception 'There are no sales to % yet.', nm;
  end if;
  select token into tok from utang_links where business_id = me and lower(customer_name) = lower(nm) and expires_at > now() + interval '7 days' order by created_at desc limit 1;
  if tok is not null then return tok; end if;
  select name into who from team_members where auth_user_id = auth.uid() and business_id = me limit 1;
  tok := public.nifti_random_token(24);
  insert into utang_links(token, business_id, customer_name, created_by_name) values (tok, me, nm, who);
  return tok;
end $$;
revoke all on function public.create_utang_link(text) from public, anon;
grant execute on function public.create_utang_link(text) to authenticated;

create or replace function public.get_utang_statement(p_token text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare l utang_links; is_member boolean := false;
begin
  if p_token is null or length(p_token) < 20 then return null; end if;
  select * into l from utang_links where token = p_token;
  if l.token is null or l.expires_at < now() then return null; end if;
  if auth.uid() is not null then
    is_member := exists (select 1 from team_members where auth_user_id = auth.uid() and business_id = l.business_id);
  end if;
  if not is_member then
    update utang_links set view_count = view_count + 1, first_viewed_at = coalesce(first_viewed_at, now()), last_viewed_at = now() where token = p_token;
    if l.first_viewed_at is null then
      perform public.nifti_notify(l.business_id, '👀 ' || l.customer_name || ' opened their utang statement', null, './#collections', 'orders');
    end if;
  end if;
  return public.utang_statement_data(l.business_id, l.customer_name);
end $$;
grant execute on function public.get_utang_statement(text) to anon, authenticated;

create or replace function public.report_utang_payment(p_token text, p_amount numeric, p_method text, p_reference text, p_name text default null, p_proof text default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare l utang_links; ref text; who text; proof text; d jsonb; bal numeric; pend numeric; n int; cid uuid; amt numeric;
begin
  select * into l from utang_links where token = p_token and expires_at > now();
  if l.token is null then raise exception 'This link has expired. Ask the shop for a new one.'; end if;
  if p_method not in ('gcash','maya','bank_transfer','bank_deposit','cash','grabpay','shopeepay','remittance') then raise exception 'Pick how you paid.'; end if;
  amt := round(coalesce(p_amount, 0), 2);
  if amt <= 0 then raise exception 'Enter the amount you paid.'; end if;
  ref := nullif(left(btrim(regexp_replace(coalesce(p_reference, ''), '[<>"`]', '', 'g')), 64), '');
  who := nullif(left(btrim(regexp_replace(coalesce(p_name, ''), '[<>"`]', '', 'g')), 60), '');
  proof := nullif(left(btrim(coalesce(p_proof, '')), 200), '');
  if proof is not null and split_part(proof, '/', 1) <> p_token then raise exception 'Please add the screenshot again.'; end if;
  if p_method <> 'cash' and ref is null and proof is null then raise exception 'Add the reference number or a screenshot so they can find it.'; end if;
  select count(*) into n from utang_claims where token = p_token and created_at > now() - interval '1 day';
  if n >= 6 then raise exception 'You''ve reported several payments today. Please message them directly.'; end if;
  d := public.utang_statement_data(l.business_id, l.customer_name);
  bal := coalesce((d->'totals'->>'balance')::numeric, 0); pend := coalesce((d->'totals'->>'pending')::numeric, 0);
  if bal - pend < 1 then raise exception 'There''s nothing left to pay. If you paid something else, message them directly.'; end if;
  insert into utang_claims(business_id, customer_name, amount, method, reference, payer_name, proof_path, token)
    values (l.business_id, l.customer_name, amt, p_method, ref, who, proof, p_token) returning id into cid;
  perform public.nifti_notify(l.business_id, '💸 ' || l.customer_name || ' says they paid ' || public.nifti_peso(amt),
    p_method || coalesce(' ref ' || ref, '') || case when proof is not null then ' · screenshot attached' else '' end || '. Check your account, then confirm it in Getting paid.', './#collections', 'orders');
  return jsonb_build_object('id', cid, 'applied', least(amt, bal - pend), 'extra', greatest(amt - (bal - pend), 0));
end $$;
grant execute on function public.report_utang_payment(text, numeric, text, text, text, text) to anon, authenticated;

-- payment screenshots from statement links (shop utang or delivery orders)
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('pay-proofs', 'pay-proofs', false, 6291456, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create or replace function public.pay_link_ok(p_token text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from utang_links where token = p_token and expires_at > now())
      or exists (select 1 from statement_links where token = p_token and expires_at > now())
$$;
grant execute on function public.pay_link_ok(text) to anon, authenticated;
create or replace function public.pay_proof_mine(p_token text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from utang_links where token = p_token and business_id in (select public.my_business_ids()))
      or exists (select 1 from statement_links where token = p_token and supplier_business_id in (select public.my_business_ids()))
$$;
grant execute on function public.pay_proof_mine(text) to authenticated;

drop policy if exists pay_proofs_insert on storage.objects;
create policy pay_proofs_insert on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'pay-proofs' and public.pay_link_ok((storage.foldername(name))[1]));
drop policy if exists pay_proofs_read on storage.objects;
create policy pay_proofs_read on storage.objects for select to authenticated
  using (bucket_id = 'pay-proofs' and public.pay_proof_mine((storage.foldername(name))[1]));

-- delivery-order statements: the same report, with an optional screenshot
create or replace function public.report_payment_by_link_v2(p_token text, p_amount numeric, p_method text, p_reference text, p_name text default null, p_proof text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r jsonb; proof text := nullif(left(btrim(coalesce(p_proof, '')), 200), ''); l statement_links;
begin
  if proof is not null and split_part(proof, '/', 1) <> p_token then raise exception 'Please add the screenshot again.'; end if;
  if proof is not null and p_method <> 'cash' and nullif(btrim(coalesce(p_reference, '')), '') is null then
    r := public.report_payment_by_link(p_token, p_amount, p_method, 'see screenshot', p_name);
  else
    r := public.report_payment_by_link(p_token, p_amount, p_method, p_reference, p_name);
  end if;
  if proof is not null then
    select * into l from statement_links where token = p_token;
    update purchase_orders po set invoice = jsonb_set(po.invoice, '{payments}', (
        select jsonb_agg(case when p->>'via' = 'link' and p->>'confirmStatus' = 'pending' and p->>'date' = public.nifti_today_ph()::text and p->>'proofPath' is null
                              then p || jsonb_build_object('proofPath', proof) else p end)
        from jsonb_array_elements(po.invoice->'payments') p))
    where po.supplier_business_id = l.supplier_business_id and po.buyer_business_id = l.buyer_business_id and po.invoice ? 'payments' and jsonb_array_length(po.invoice->'payments') > 0;
  end if;
  return r;
end $$;
grant execute on function public.report_payment_by_link_v2(text, numeric, text, text, text, text) to anon, authenticated;
