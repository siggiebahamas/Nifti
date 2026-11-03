-- Price lock, discounts per cashier on the morning message, receipts by default.
-- books_settings keys (owner-only): price_lock (bool, default true), max_discount (percent, default 5), receipt_auto (bool, default true).

-- ---------- prices ----------
create or replace function public.nifti_list_price(p_business uuid, p_name text)
returns numeric language sql stable security definer set search_path to 'public' as $$
  select coalesce(
    (select m.price from menu_items m where m.business_id = p_business and m.active and lower(m.name) = lower(trim(p_name)) and m.price > 0 limit 1),
    (select i.sell_price from inventory_items i where i.business_id = p_business and lower(i.name) = lower(trim(p_name)) and i.sell_price > 0 limit 1),
    (select (c->>'price')::numeric from businesses b, jsonb_array_elements(coalesce(b.catalog, '[]'::jsonb)) c
       where b.id = p_business and lower(c->>'product') = lower(trim(p_name)) and coalesce(c->>'price', '') ~ '^[0-9]+(\.[0-9]+)?$' and (c->>'price')::numeric > 0 limit 1),
    0)
$$;

create or replace function public.nifti_price_lock(p_business uuid)
returns jsonb language sql stable security definer set search_path to 'public' as $$
  select jsonb_build_object(
    'on', coalesce((books_settings->>'price_lock')::boolean, true),
    'max_discount', greatest(0, least(100, coalesce(nullif(books_settings->>'max_discount', '')::numeric, 5))))
  from businesses where id = p_business
$$;

-- adds listPrice to every line (the real price-list price at the time of the sale)
create or replace function public.nifti_stamp_list_prices(p_business uuid, p_lines jsonb)
returns jsonb language sql stable security definer set search_path to 'public' as $$
  select coalesce(jsonb_agg(case when coalesce((l->>'totalOnly')::boolean, false) then l
    else l || jsonb_build_object('listPrice', public.nifti_list_price(p_business, l->>'product')) end order by o), '[]'::jsonb)
  from jsonb_array_elements(coalesce(p_lines, '[]'::jsonb)) with ordinality t(l, o)
$$;

-- lines priced under what staff may charge on their own
create or replace function public.nifti_sale_price_issues(p_business uuid, p_lines jsonb)
returns jsonb language plpgsql stable security definer set search_path to 'public' as $$
declare cfg jsonb := public.nifti_price_lock(p_business); l jsonb; list numeric; cost numeric; minp numeric; price numeric; out jsonb := '[]'::jsonb;
begin
  for l in select * from jsonb_array_elements(coalesce(p_lines, '[]'::jsonb)) loop
    if coalesce((l->>'totalOnly')::boolean, false) then
      out := out || jsonb_build_array(jsonb_build_object('product', l->>'product', 'unitPrice', coalesce((l->>'unitPrice')::numeric, 0), 'totalOnly', true));
      continue;
    end if;
    price := coalesce(nullif(l->>'unitPrice', '')::numeric, 0);
    list := public.nifti_list_price(p_business, l->>'product');
    if list > 0 then minp := round(list * (1 - (cfg->>'max_discount')::numeric / 100), 2);
    else
      select i.unit_cost into cost from inventory_items i where i.business_id = p_business and lower(i.name) = lower(trim(l->>'product')) and i.unit_cost > 0 limit 1;
      minp := coalesce(cost, 0);
    end if;
    if minp > 0 and price < minp - 0.005 then
      out := out || jsonb_build_array(jsonb_build_object('product', l->>'product', 'qty', l->'qty', 'unitPrice', price, 'listPrice', list, 'minPrice', minp));
    end if;
  end loop;
  return out;
end $$;

-- ---------- approvals ----------
create table if not exists public.price_approvals (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  requested_by uuid,
  requested_by_name text,
  lines jsonb not null default '[]'::jsonb,
  total numeric,
  customer_name text,
  note text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined', 'used', 'cancelled')),
  decided_by_name text,
  decided_at timestamptz,
  decline_note text,
  sale_id uuid,
  created_at timestamptz not null default now()
);
create index if not exists price_approvals_biz on public.price_approvals(business_id, status, created_at desc);
alter table public.price_approvals enable row level security;
drop policy if exists pa_select on public.price_approvals;
create policy pa_select on public.price_approvals for select using (
  business_id in (select my_business_ids()) and (public.nifti_books_viewer(business_id) or requested_by = public.nifti_me_member(business_id)));
-- no insert/update/delete policies: everything goes through the functions below

alter table public.downstream_sales add column if not exists price_approval_id uuid;

create or replace function public.request_price_ok(p_business uuid, p_lines jsonb, p_customer text default null, p_note text default null)
returns uuid language plpgsql security definer set search_path to 'public' as $$
declare me uuid := public.nifti_me_member(p_business); who text := public.nifti_member_name(p_business); v_id uuid; lines jsonb; tot numeric; body text;
begin
  if me is null then raise exception 'Not a member of this business.'; end if;
  lines := public.nifti_stamp_list_prices(p_business, p_lines);
  select coalesce(sum(coalesce((l->>'qty')::numeric, 1) * coalesce((l->>'unitPrice')::numeric, 0)), 0) into tot from jsonb_array_elements(lines) l;
  update price_approvals set status = 'cancelled' where business_id = p_business and requested_by = me and status = 'pending';
  insert into price_approvals(business_id, requested_by, requested_by_name, lines, total, customer_name, note)
    values (p_business, me, who, lines, round(tot, 2), left(p_customer, 120), left(p_note, 300)) returning price_approvals.id into v_id;
  select string_agg(coalesce(l->>'product', 'Item') || ' ' || coalesce(l->>'qty', '1') || ' × ' || public.nifti_peso(coalesce((l->>'unitPrice')::numeric, 0))
      || case when coalesce((l->>'listPrice')::numeric, 0) > 0 then ' (list ' || public.nifti_peso((l->>'listPrice')::numeric) || ')' else '' end, ', ')
    into body from jsonb_array_elements(public.nifti_sale_price_issues(p_business, lines)) l;
  perform public.nifti_notify_books(p_business, '🏷 ' || coalesce(who, 'Staff') || ' needs your OK on a price',
    coalesce(body, 'Below your price list') || '. Tap to answer.', './#sales', 'money');
  return v_id;
end $$;

create or replace function public.decide_price_ok(p_id uuid, p_ok boolean, p_note text default null)
returns void language plpgsql security definer set search_path to 'public' as $$
declare a price_approvals;
begin
  select * into a from price_approvals where id = p_id for update;
  if not found then raise exception 'Request not found.'; end if;
  if not public.nifti_books_viewer(a.business_id) then raise exception 'Only the owner can answer this.'; end if;
  if a.status <> 'pending' then raise exception 'Already answered.'; end if;
  update price_approvals set status = case when p_ok then 'approved' else 'declined' end, decided_by_name = public.nifti_member_name(a.business_id),
    decided_at = now(), decline_note = case when p_ok then null else left(p_note, 200) end where id = p_id;
  insert into audit_log(business_id, action, entity_type, entity_id, field, old_value, new_value, actor)
    values (a.business_id, case when p_ok then 'price_ok' else 'price_declined' end, 'price_approval', a.id::text, 'price', a.lines, to_jsonb(coalesce(p_note, '')), coalesce(public.nifti_member_name(a.business_id), 'owner'));
  if a.requested_by is not null then
    perform public.nifti_notify(a.business_id, case when p_ok then '✅ Price OK''d. Save the sale now.' else '✋ Price not OK''d' end,
      case when p_ok then 'Open the sale and tap Save.' else coalesce(nullif(p_note, ''), 'Use the price list price.') end, './#sales', 'team', a.requested_by);
  end if;
end $$;

create or replace function public.cancel_price_ok(p_id uuid)
returns void language sql security definer set search_path to 'public' as $$
  update price_approvals set status = 'cancelled' where id = p_id and status = 'pending' and requested_by = public.nifti_me_member(business_id)
$$;

grant execute on function public.request_price_ok(uuid, jsonb, text, text), public.decide_price_ok(uuid, boolean, text), public.cancel_price_ok(uuid),
  public.nifti_sale_price_issues(uuid, jsonb), public.nifti_list_price(uuid, text), public.nifti_price_lock(uuid) to authenticated;

-- ---------- the lock itself: the server refuses a staff sale under the limit without an OK ----------
create or replace function public.downstream_sales_stamp()
returns trigger language plpgsql security definer set search_path to 'public' as $function$
declare issues jsonb; a price_approvals; i jsonb;
begin
  if tg_op = 'INSERT' then
    new.created_by := public.nifti_me_member(new.business_id);
    new.created_by_name := public.nifti_member_name(new.business_id);
    new.created_at := now();
    new.line_items := public.nifti_stamp_list_prices(new.business_id, new.line_items);
    if auth.uid() is not null and (public.nifti_price_lock(new.business_id)->>'on')::boolean and not public.nifti_books_viewer(new.business_id) then
      issues := public.nifti_sale_price_issues(new.business_id, new.line_items);
      if jsonb_array_length(issues) > 0 then
        if new.price_approval_id is null then raise exception 'PRICE_LOCK: This price is below your price list. Ask the owner to OK it.'; end if;
        select * into a from price_approvals where id = new.price_approval_id and business_id = new.business_id for update;
        if not found or a.status <> 'approved' or a.requested_by is distinct from new.created_by or a.decided_at < now() - interval '12 hours' then
          raise exception 'PRICE_LOCK: The owner''s OK is missing, used or expired. Ask again.';
        end if;
        for i in select * from jsonb_array_elements(issues) loop
          if not exists (select 1 from jsonb_array_elements(a.lines) x where lower(x->>'product') = lower(i->>'product')
                           and coalesce((x->>'unitPrice')::numeric, 0) <= (i->>'unitPrice')::numeric + 0.005) then
            raise exception 'PRICE_LOCK: % is lower than the price the owner OK''d.', i->>'product';
          end if;
        end loop;
        update price_approvals set status = 'used', sale_id = new.id where id = a.id;
      end if;
    elsif new.price_approval_id is not null then
      update price_approvals set status = 'used', sale_id = new.id where id = new.price_approval_id and business_id = new.business_id and status = 'approved';
    end if;
    return new;
  end if;
  new.business_id := old.business_id; new.created_by := old.created_by; new.created_by_name := old.created_by_name; new.created_at := old.created_at;
  new.price_approval_id := old.price_approval_id;
  if old.voided_at is not null then raise exception 'This sale was already voided.'; end if;
  if new.voided_at is not null then
    if not public.nifti_books_viewer(old.business_id) then raise exception 'Only the owner can void a sale.'; end if;
    new.voided_at := now(); new.voided_by_name := public.nifti_member_name(old.business_id);
    insert into audit_log(business_id, action, entity_type, entity_id, field, old_value, new_value, actor)
      values (old.business_id, 'sale_voided', 'sale', old.id::text, 'sale', to_jsonb(old.total), to_jsonb(coalesce(new.void_reason,'')), coalesce(new.voided_by_name,'someone'));
    return new;
  end if;
  -- anyone else may only add payments; items, totals and the date stay as recorded
  if not public.nifti_books_viewer(old.business_id) and (new.line_items is distinct from old.line_items or new.total is distinct from old.total or new.sale_date is distinct from old.sale_date) then
    raise exception 'Only the owner can change a recorded sale.';
  end if;
  return new;
end $function$;

-- ---------- staff can't loosen the lock by editing settings or lowering prices ----------
create or replace function public.guard_price_lock_settings()
returns trigger language plpgsql security definer set search_path to 'public' as $$
declare k text; locked boolean;
begin
  if auth.uid() is null or public.nifti_books_viewer(old.id) then return new; end if;
  foreach k in array array['price_lock', 'max_discount', 'receipt_auto'] loop
    if (coalesce(new.books_settings, '{}'::jsonb)->k) is distinct from (coalesce(old.books_settings, '{}'::jsonb)->k) then
      raise exception 'Only the owner can change the price lock and receipt settings.';
    end if;
  end loop;
  locked := coalesce((old.books_settings->>'price_lock')::boolean, true);
  if locked and new.catalog is distinct from old.catalog and exists (
      select 1 from jsonb_array_elements(coalesce(old.catalog, '[]'::jsonb)) o join jsonb_array_elements(coalesce(new.catalog, '[]'::jsonb)) n
        on lower(o->>'product') = lower(n->>'product')
      where coalesce(o->>'price', '') ~ '^[0-9]+(\.[0-9]+)?$' and coalesce(n->>'price', '') ~ '^[0-9]+(\.[0-9]+)?$' and (n->>'price')::numeric < (o->>'price')::numeric) then
    raise exception 'Price lock is on: only the owner can lower a price on the price list.';
  end if;
  return new;
end $$;
drop trigger if exists guard_price_lock_settings on public.businesses;
create trigger guard_price_lock_settings before update on public.businesses for each row execute function public.guard_price_lock_settings();

create or replace function public.guard_price_lock_items()
returns trigger language plpgsql security definer set search_path to 'public' as $$
declare newp numeric; oldp numeric;
begin
  if auth.uid() is null or public.nifti_books_viewer(old.business_id) then return new; end if;
  if not coalesce((public.nifti_price_lock(old.business_id)->>'on')::boolean, true) then return new; end if;
  if tg_table_name = 'menu_items' then newp := new.price; oldp := old.price; else newp := new.sell_price; oldp := old.sell_price; end if;
  if oldp is not null and oldp > 0 and (newp is null or newp < oldp) then
    raise exception 'Price lock is on: only the owner can lower a selling price.';
  end if;
  return new;
end $$;
drop trigger if exists guard_price_lock_items on public.inventory_items;
create trigger guard_price_lock_items before update on public.inventory_items for each row execute function public.guard_price_lock_items();
drop trigger if exists guard_price_lock_items on public.menu_items;
create trigger guard_price_lock_items before update on public.menu_items for each row execute function public.guard_price_lock_items();

-- ---------- discounts per cashier ----------
create or replace function public.books_discounts_for(p_business uuid, p_day date)
returns jsonb language sql stable security definer set search_path to 'public' as $$
  with d as (
    select coalesce(nullif(s.created_by_name, ''), 'Someone') who,
      greatest(0, coalesce(nullif(l->>'listPrice', '')::numeric, public.nifti_list_price(p_business, l->>'product')) - coalesce(nullif(l->>'unitPrice', '')::numeric, 0))
        * coalesce(nullif(l->>'qty', '')::numeric, 0) amt
    from downstream_sales s, jsonb_array_elements(s.line_items) l
    where s.business_id = p_business and s.sale_date = p_day and s.voided_at is null and not coalesce((l->>'totalOnly')::boolean, false))
  select coalesce(jsonb_agg(jsonb_build_object('who', who, 'amount', amt) order by amt desc), '[]'::jsonb)
  from (select who, round(sum(amt), 2) amt from d group by who having sum(amt) >= 1) x
$$;

create or replace function public.send_books_summaries()
returns integer language plpgsql security definer set search_path to 'public' as $function$
declare today date := (now() at time zone 'Asia/Manila')::date; y date := today - 1; b record; d jsonb; lines text[]; flags int; title text; sent int := 0; inserted int;
  disc jsonb; disc_line text; disc_tot numeric;
begin
  for b in select biz.id from businesses biz where not biz.is_outside and biz.paused_at is null and biz.banned_at is null
             and (exists (select 1 from downstream_sales s where s.business_id = biz.id and s.sale_date >= today - 30)
               or exists (select 1 from expenses e where e.business_id = biz.id and e.spent_on >= today - 30)
               or exists (select 1 from cash_counts c where c.business_id = biz.id and c.count_day >= today - 30)) loop
    d := public.books_day_for(b.id, y);
    lines := array[]::text[]; flags := 0;
    if (d->>'sales_count')::int > 0 then lines := lines || ('🧾 Sales ' || public.nifti_peso((d->>'sales')::numeric) || ' (' || (d->>'sales_count') || ')'
      || case when (d->>'utang')::numeric >= 1 then ' · utang ' || public.nifti_peso((d->>'utang')::numeric) else '' end); end if;
    -- discounts given under the price list, by cashier (top 3)
    disc := public.books_discounts_for(b.id, y);
    if jsonb_array_length(disc) > 0 then
      select sum((x->>'amount')::numeric) into disc_tot from jsonb_array_elements(disc) x;
      select string_agg((x->>'who') || ' ' || public.nifti_peso((x->>'amount')::numeric), ', ') into disc_line
        from (select x from jsonb_array_elements(disc) x limit 3) t;
      lines := lines || ('🏷 Discounts ' || public.nifti_peso(disc_tot) || ': ' || disc_line || case when jsonb_array_length(disc) > 3 then ' +' || (jsonb_array_length(disc) - 3) else '' end);
    end if;
    if (d->>'expenses')::numeric >= 1 then lines := lines || ('💸 Expenses ' || public.nifti_peso((d->>'expenses')::numeric)); end if;
    if (d->>'cash_counted')::int = 0 then
      if exists (select 1 from cash_counts c where c.business_id = b.id and c.count_day >= today - 30) then lines := lines || '🔴 Cash not counted'::text; flags := flags + 1; end if;
    elsif (d->>'cash_diff')::numeric <= -1 then lines := lines || ('🔴 Cash short ' || public.nifti_peso(-(d->>'cash_diff')::numeric)); flags := flags + 1;
    elsif (d->>'cash_diff')::numeric >= 1 then lines := lines || ('🟡 Cash over ' || public.nifti_peso((d->>'cash_diff')::numeric)); flags := flags + 1;
    else lines := lines || '✅ Cash matched'::text; end if;
    if (d->>'bad_stock')::numeric >= 1 then lines := lines || ('🗑 Bad stock ' || public.nifti_peso((d->>'bad_stock')::numeric)); flags := flags + 1; end if;
    if (d->>'missing_stock')::numeric >= 1 then lines := lines || ('🔍 Missing stock ' || public.nifti_peso((d->>'missing_stock')::numeric)); flags := flags + 1; end if;
    if (d->>'voided')::int > 0 then lines := lines || ('↩️ ' || (d->>'voided') || ' sale' || case when (d->>'voided')::int > 1 then 's' else '' end || ' removed'); flags := flags + 1; end if;
    if (d->>'expenses_removed')::int > 0 then lines := lines || ('↩️ ' || (d->>'expenses_removed') || ' expense' || case when (d->>'expenses_removed')::int > 1 then 's' else '' end || ' removed'); end if;
    if (d->>'hand_changes')::int > 0 then lines := lines || ('✏️ Stock changed by hand ' || (d->>'hand_changes') || '×'); end if;
    insert into books_summary_log(business_id, day) values (b.id, today) on conflict do nothing;
    get diagnostics inserted = row_count;
    if inserted = 0 then continue; end if;
    title := '📒 Yesterday: ' || case when (d->>'sales_count')::int > 0 then public.nifti_peso((d->>'sales')::numeric) || ' sales' else 'no sales recorded' end
      || case when flags > 0 then ' · ' || flags || ' to check' else ' · all good' end;
    perform public.nifti_notify_books(b.id, title, array_to_string(lines, E'\n'), './#money');
    sent := sent + 1;
  end loop;
  return sent;
end $function$;
