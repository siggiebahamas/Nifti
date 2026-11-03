-- Bookkeeping: expenses, daily cash counts, stock history, quick sales on the server.
-- Who sees what: Owner / General Manager / Finance see every entry and the totals ("books people").
-- Everyone else records (an expense, a sale, a count, a stock change) and sees only their own entries.

create or replace function public.nifti_books_viewer(p_business uuid)
 returns boolean language sql stable security definer set search_path to 'public' as $$
  select exists (select 1 from team_members where business_id = p_business and auth_user_id = auth.uid() and status = 'active'
                 and roles && array['Owner','General Manager','Finance'])
$$;

create or replace function public.nifti_member_name(p_business uuid)
 returns text language sql stable security definer set search_path to 'public' as $$
  select coalesce(nullif(btrim(name), ''), split_part(email, '@', 1)) from team_members
   where business_id = p_business and auth_user_id = auth.uid() and status = 'active' limit 1
$$;

alter table businesses add column if not exists books_settings jsonb not null default '{}'::jsonb;
alter table businesses drop constraint if exists businesses_books_settings_shape;
alter table businesses add constraint businesses_books_settings_shape check (jsonb_typeof(books_settings) = 'object' and octet_length(books_settings::text) <= 4000);

alter table inventory_items add column if not exists unit_cost numeric(14,2);
alter table inventory_items add column if not exists sell_price numeric(14,2);

-- ---------------------------------------------------------------- expenses
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  spent_on date not null default public.nifti_today(),
  category text not null check (length(category) between 1 and 40),
  amount numeric(14,2) not null check (amount > 0 and amount < 100000000),
  paid_from text not null default 'cash' check (paid_from in ('cash','gcash','maya','bank','card','owner','credit')),
  vendor text check (vendor is null or length(vendor) <= 120),
  note text check (note is null or length(note) <= 500),
  staff_name text check (staff_name is null or length(staff_name) <= 80),
  receipt_path text check (receipt_path is null or length(receipt_path) <= 300),
  repeat_monthly boolean not null default false,
  created_by uuid references team_members(id) on delete set null,
  created_by_name text,
  created_at timestamptz not null default now(),
  edited_at timestamptz, edited_by_name text,
  deleted_at timestamptz, deleted_by_name text,
  delete_reason text check (delete_reason is null or length(delete_reason) <= 200)
);
create index if not exists expenses_biz_day on expenses(business_id, spent_on);
alter table expenses enable row level security;
drop policy if exists expenses_select on expenses;
create policy expenses_select on expenses for select using (
  business_id in (select my_business_ids()) and (public.nifti_books_viewer(business_id) or created_by = public.nifti_me_member(business_id)));
drop policy if exists expenses_insert on expenses;
create policy expenses_insert on expenses for insert with check (
  business_id in (select my_business_ids()) and created_by = public.nifti_me_member(business_id) and deleted_at is null);
drop policy if exists expenses_update on expenses;
create policy expenses_update on expenses for update using (
  business_id in (select my_business_ids()) and public.nifti_books_viewer(business_id))
  with check (business_id in (select my_business_ids()) and public.nifti_books_viewer(business_id));
-- no delete policy: entries are never erased, only marked removed (with who and why)

create or replace function public.expenses_stamp() returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := public.nifti_me_member(new.business_id);
    new.created_by_name := coalesce(public.nifti_member_name(new.business_id), new.created_by_name);
    new.created_at := now();
    return new;
  end if;
  -- a books person editing: keep the trail
  new.created_by := old.created_by; new.created_by_name := old.created_by_name; new.created_at := old.created_at; new.business_id := old.business_id;
  if new.deleted_at is not null and old.deleted_at is null then
    new.deleted_at := now(); new.deleted_by_name := public.nifti_member_name(new.business_id);
  elsif (new.amount, new.category, new.spent_on, new.paid_from, coalesce(new.vendor,''), coalesce(new.note,''), coalesce(new.staff_name,''))
        is distinct from (old.amount, old.category, old.spent_on, old.paid_from, coalesce(old.vendor,''), coalesce(old.note,''), coalesce(old.staff_name,'')) then
    new.edited_at := now(); new.edited_by_name := public.nifti_member_name(new.business_id);
    insert into audit_log(business_id, action, entity_type, entity_id, field, old_value, new_value, actor)
      values (new.business_id, 'expense_edited', 'expense', new.id::text, 'expense',
        jsonb_build_object('amount', old.amount, 'category', old.category, 'spent_on', old.spent_on, 'paid_from', old.paid_from),
        jsonb_build_object('amount', new.amount, 'category', new.category, 'spent_on', new.spent_on, 'paid_from', new.paid_from),
        coalesce(new.edited_by_name, 'someone'));
  end if;
  return new;
end $$;
drop trigger if exists expenses_stamp on expenses;
create trigger expenses_stamp before insert or update on expenses for each row execute function public.expenses_stamp();

-- ---------------------------------------------------------------- quick sales (counter / walk-in / own customers)
alter table downstream_sales alter column customer_id drop not null;
alter table downstream_sales add column if not exists customer_name text;
alter table downstream_sales add column if not exists total numeric(14,2);
alter table downstream_sales add column if not exists paid_with text;
alter table downstream_sales add column if not exists note text;
alter table downstream_sales add column if not exists created_by uuid references team_members(id) on delete set null;
alter table downstream_sales add column if not exists created_by_name text;
alter table downstream_sales add column if not exists voided_at timestamptz;
alter table downstream_sales add column if not exists voided_by_name text;
alter table downstream_sales add column if not exists void_reason text;
alter table downstream_sales drop constraint if exists downstream_sales_shape;
alter table downstream_sales add constraint downstream_sales_shape check (jsonb_typeof(line_items) = 'array' and jsonb_array_length(line_items) <= 200
  and jsonb_typeof(payments) = 'array' and jsonb_array_length(payments) <= 50 and octet_length(line_items::text) <= 60000
  and (note is null or length(note) <= 300) and (customer_name is null or length(customer_name) <= 120));
create index if not exists downstream_sales_biz_day on downstream_sales(business_id, sale_date);
drop policy if exists tenant_delete on downstream_sales;
drop policy if exists tenant_update on downstream_sales;
drop policy if exists tenant_select on downstream_sales;
drop policy if exists tenant_insert on downstream_sales;
create policy ds_select on downstream_sales for select using (business_id in (select my_business_ids()));
create policy ds_insert on downstream_sales for insert with check (business_id in (select my_business_ids()) and voided_at is null);
-- Adding a payment later (utang paid) is allowed for anyone on the team; voiding is books people only (checked in the trigger).
create policy ds_update on downstream_sales for update using (business_id in (select my_business_ids())) with check (business_id in (select my_business_ids()));

create or replace function public.downstream_sales_stamp() returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := public.nifti_me_member(new.business_id);
    new.created_by_name := public.nifti_member_name(new.business_id);
    new.created_at := now();
    return new;
  end if;
  new.business_id := old.business_id; new.created_by := old.created_by; new.created_by_name := old.created_by_name; new.created_at := old.created_at;
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
end $$;
drop trigger if exists downstream_sales_stamp on downstream_sales;
create trigger downstream_sales_stamp before insert or update on downstream_sales for each row execute function public.downstream_sales_stamp();

-- ---------------------------------------------------------------- stock history (every change to on hand, by whom and why)
create table if not exists public.stock_moves (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  item_id uuid references inventory_items(id) on delete set null,
  item_name text not null,
  qty numeric(14,3) not null,
  kind text not null check (kind in ('opening','received','sold','delivered','bad','count','adjust','returned_in','returned_out','used','transfer')),
  unit_cost numeric(14,2),
  reason text check (reason is null or length(reason) <= 200),
  ref text check (ref is null or length(ref) <= 80),
  photo_path text check (photo_path is null or length(photo_path) <= 300),
  moved_on date not null default public.nifti_today(),
  created_by uuid references team_members(id) on delete set null,
  created_by_name text,
  created_at timestamptz not null default now()
);
create index if not exists stock_moves_biz_day on stock_moves(business_id, moved_on);
create index if not exists stock_moves_item on stock_moves(item_id);
alter table stock_moves enable row level security;
drop policy if exists stock_moves_select on stock_moves;
create policy stock_moves_select on stock_moves for select using (business_id in (select my_business_ids()));
-- written only by the inventory trigger below, so nobody can add, change or erase history by hand

create or replace function public.inventory_log_move() returns trigger language plpgsql security definer set search_path to 'public' as $$
declare lm jsonb := coalesce(new.meta->'last_move', '{}'::jsonb); k text; fresh boolean;
begin
  -- a label counts only when this very write set it (a later hand edit doesn't inherit the last label)
  fresh := (lm ? 'at') and (lm->>'at') ~ '^\d{4}-' and (lm->>'at')::timestamptz > now() - interval '5 minutes'
           and (tg_op = 'INSERT' or (new.meta->'last_move') is distinct from (old.meta->'last_move'));
  k := case when fresh and coalesce(lm->>'kind','') in ('opening','received','sold','delivered','bad','count','adjust','returned_in','returned_out','used','transfer') then lm->>'kind' end;
  if tg_op = 'INSERT' then
    if coalesce(new.on_hand, 0) <> 0 then
      insert into stock_moves(business_id, item_id, item_name, qty, kind, unit_cost, reason, ref, created_by, created_by_name)
        values (new.business_id, new.id, new.name, new.on_hand, coalesce(k, 'opening'), new.unit_cost,
          case when fresh then left(lm->>'reason', 200) else 'Starting stock' end, case when fresh then left(lm->>'ref', 80) end,
          public.nifti_me_member(new.business_id), public.nifti_member_name(new.business_id));
    end if;
  elsif coalesce(new.on_hand, 0) is distinct from coalesce(old.on_hand, 0) then
    insert into stock_moves(business_id, item_id, item_name, qty, kind, unit_cost, reason, ref, photo_path, created_by, created_by_name)
      values (new.business_id, new.id, new.name, coalesce(new.on_hand,0) - coalesce(old.on_hand,0), coalesce(k, 'adjust'), coalesce(new.unit_cost, old.unit_cost),
        case when fresh then left(lm->>'reason', 200) else 'Changed by hand' end, case when fresh then left(lm->>'ref', 80) end,
        case when fresh then left(lm->>'photo', 300) end,
        public.nifti_me_member(new.business_id), public.nifti_member_name(new.business_id));
  end if;
  return new;
end $$;
drop trigger if exists inventory_log_move on inventory_items;
create trigger inventory_log_move after insert or update on inventory_items for each row execute function public.inventory_log_move();

-- ---------------------------------------------------------------- daily cash count (blind for staff)
create table if not exists public.cash_counts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  count_day date not null,
  drawer text not null default 'Main' check (length(drawer) between 1 and 40),
  expected jsonb not null default '{}'::jsonb,
  counted jsonb not null default '{}'::jsonb,
  difference numeric(14,2) not null default 0,
  note text check (note is null or length(note) <= 300),
  closed_by uuid references team_members(id) on delete set null,
  closed_by_name text,
  closed_at timestamptz not null default now(),
  reopened_at timestamptz, reopened_by_name text,
  reviewed_at timestamptz, reviewed_by_name text, review_note text check (review_note is null or length(review_note) <= 300),
  unique (business_id, count_day, drawer)
);
alter table cash_counts enable row level security;
drop policy if exists cash_counts_select on cash_counts;
-- staff never read counts back (no peeking at what the drawer "should" have)
create policy cash_counts_select on cash_counts for select using (business_id in (select my_business_ids()) and public.nifti_books_viewer(business_id));

create or replace function public.save_cash_count(p_day date, p_drawer text, p_expected jsonb, p_counted jsonb, p_note text)
 returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare me uuid := public.nifti_my_business(); who text; mem uuid; ex numeric; ct numeric; diff numeric; row cash_counts; boss boolean; limit_amt numeric;
begin
  if me is null then raise exception 'Sign in first.'; end if;
  if p_day is null or p_day > public.nifti_today() or p_day < public.nifti_today() - 7 then raise exception 'Pick today or a day this past week.'; end if;
  if jsonb_typeof(coalesce(p_counted,'null')) <> 'object' or octet_length(p_counted::text) > 3000 or octet_length(coalesce(p_expected,'{}')::text) > 3000 then raise exception 'Enter what you counted.'; end if;
  ct := round(coalesce((p_counted->>'cash')::numeric, -1), 2);
  if ct < 0 or ct > 100000000 then raise exception 'Enter the cash you counted.'; end if;
  ex := round(coalesce((p_expected->>'cash')::numeric, 0), 2);
  diff := ct - ex;
  boss := public.nifti_books_viewer(me);
  mem := public.nifti_me_member(me); who := public.nifti_member_name(me);
  select * into row from cash_counts where business_id = me and count_day = p_day and drawer = coalesce(nullif(btrim(p_drawer), ''), 'Main');
  if row.id is not null and row.reopened_at is null and not boss then raise exception 'This day is already closed. Ask the owner to reopen it.'; end if;
  insert into cash_counts(business_id, count_day, drawer, expected, counted, difference, note, closed_by, closed_by_name, closed_at, reopened_at, reopened_by_name)
    values (me, p_day, coalesce(nullif(btrim(p_drawer), ''), 'Main'), coalesce(p_expected, '{}'), p_counted, diff, nullif(left(btrim(coalesce(p_note,'')), 300), ''), mem, who, now(), null, null)
  on conflict (business_id, count_day, drawer) do update set expected = excluded.expected, counted = excluded.counted, difference = excluded.difference,
    note = excluded.note, closed_by = excluded.closed_by, closed_by_name = excluded.closed_by_name, closed_at = now(), reopened_at = null, reopened_by_name = null,
    reviewed_at = null, reviewed_by_name = null, review_note = null;
  insert into audit_log(business_id, action, entity_type, entity_id, field, old_value, new_value, actor)
    values (me, 'cash_counted', 'cash_count', p_day::text, coalesce(nullif(btrim(p_drawer), ''), 'Main'), to_jsonb(ex), to_jsonb(ct), coalesce(who, 'someone'));
  limit_amt := coalesce((select (books_settings->>'cash_alert')::numeric from businesses where id = me), 100);
  if abs(diff) >= greatest(limit_amt, 1) then
    perform public.nifti_notify(me, case when diff < 0 then '🔴 Cash short ' || public.nifti_peso(-diff) else '🟡 Cash over ' || public.nifti_peso(diff) end,
      to_char(p_day, 'Mon DD') || ' · ' || coalesce(nullif(btrim(p_drawer), ''), 'Main') || ' drawer · counted by ' || coalesce(who, 'someone') || '. Expected ' || public.nifti_peso(ex) || ', counted ' || public.nifti_peso(ct) || '.',
      './#cashcount', 'money');
  end if;
  -- staff see only that it saved; the owner sees the difference
  return case when boss then jsonb_build_object('saved', true, 'difference', diff, 'expected', ex, 'counted', ct) else jsonb_build_object('saved', true) end;
end $$;

create or replace function public.reopen_cash_count(p_day date, p_drawer text)
 returns void language plpgsql security definer set search_path to 'public' as $$
declare me uuid := public.nifti_my_business();
begin
  if me is null or not public.nifti_books_viewer(me) then raise exception 'Only the owner can reopen a day.'; end if;
  update cash_counts set reopened_at = now(), reopened_by_name = public.nifti_member_name(me)
   where business_id = me and count_day = p_day and drawer = coalesce(nullif(btrim(p_drawer), ''), 'Main');
  insert into audit_log(business_id, action, entity_type, entity_id, field, actor)
    values (me, 'cash_reopened', 'cash_count', p_day::text, coalesce(nullif(btrim(p_drawer), ''), 'Main'), coalesce(public.nifti_member_name(me), 'owner'));
end $$;

create or replace function public.review_cash_count(p_id uuid, p_note text)
 returns void language plpgsql security definer set search_path to 'public' as $$
declare me uuid := public.nifti_my_business();
begin
  if me is null or not public.nifti_books_viewer(me) then raise exception 'Only the owner can mark a count as checked.'; end if;
  update cash_counts set reviewed_at = now(), reviewed_by_name = public.nifti_member_name(me), review_note = nullif(left(btrim(coalesce(p_note,'')), 300), '')
   where id = p_id and business_id = me;
end $$;

-- Staff: which days are closed (no amounts), so the screen can say "already counted".
create or replace function public.my_cash_count_days(p_days int default 7)
 returns table(count_day date, drawer text, closed_by_name text, reopened boolean) language sql stable security definer set search_path to 'public' as $$
  select count_day, drawer, closed_by_name, reopened_at is not null from cash_counts
   where business_id = public.nifti_my_business() and count_day >= public.nifti_today() - greatest(least(coalesce(p_days, 7), 60), 1)
   order by count_day desc
$$;

-- ---------------------------------------------------------------- receipts & bad-stock photos: private storage, one folder per business
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('receipts', 'receipts', false, 3145728, array['image/jpeg','image/png','image/webp'])
  on conflict (id) do update set public = false, file_size_limit = 3145728, allowed_mime_types = array['image/jpeg','image/png','image/webp'];
drop policy if exists receipts_read on storage.objects;
create policy receipts_read on storage.objects for select to authenticated
  using (bucket_id = 'receipts' and (storage.foldername(name))[1] in (select b::text from my_business_ids() b));
drop policy if exists receipts_write on storage.objects;
create policy receipts_write on storage.objects for insert to authenticated
  with check (bucket_id = 'receipts' and (storage.foldername(name))[1] in (select b::text from my_business_ids() b));

grant execute on function public.save_cash_count(date, text, jsonb, jsonb, text) to authenticated;
grant execute on function public.reopen_cash_count(date, text) to authenticated;
grant execute on function public.review_cash_count(uuid, text) to authenticated;
grant execute on function public.my_cash_count_days(int) to authenticated;
revoke execute on function public.save_cash_count(date, text, jsonb, jsonb, text) from anon;
revoke execute on function public.reopen_cash_count(date, text) from anon;
revoke execute on function public.review_cash_count(uuid, text) from anon;
revoke execute on function public.my_cash_count_days(int) from anon;
revoke execute on function public.expenses_stamp() from anon, authenticated;
revoke execute on function public.downstream_sales_stamp() from anon, authenticated;
revoke execute on function public.inventory_log_move() from anon, authenticated;
grant select, insert, update on expenses to authenticated;
grant select on stock_moves to authenticated;
grant select on cash_counts to authenticated;
grant select, insert, update on downstream_sales to authenticated;
