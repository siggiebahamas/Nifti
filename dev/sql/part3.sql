-- ===== Part 3: owner-only money alerts, morning books message, cash in/out, menu & recipes =====

-- 1) Notifications: a row aimed at one person is only theirs; money rows are for books viewers only.
drop policy if exists notification_outbox_select on notification_outbox;
create policy notification_outbox_select on notification_outbox for select using (
  business_id in (select my_business_ids())
  and (only_member is null or only_member = public.nifti_me_member(business_id))
  and (category is distinct from 'money' or public.nifti_books_viewer(business_id))
);

-- send one money alert to each owner / general manager / finance person
create or replace function public.nifti_notify_books(p_business uuid, p_title text, p_body text, p_url text, p_category text default 'money')
 returns void language plpgsql security definer set search_path to 'public' as $$
declare v record;
begin
  for v in select id from team_members where business_id = p_business and status = 'active' and auth_user_id is not null
             and roles && array['Owner','General Manager','Finance'] loop
    perform public.nifti_notify(p_business, p_title, p_body, p_url, p_category, v.id);
  end loop;
end $$;
revoke all on function public.nifti_notify_books(uuid, text, text, text, text) from public, anon, authenticated;

-- 2) cash count: the difference goes to the owner side only, never to the person who counted
create or replace function public.save_cash_count(p_day date, p_drawer text, p_expected jsonb, p_counted jsonb, p_note text)
 returns jsonb language plpgsql security definer set search_path to 'public' as $function$
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
    perform public.nifti_notify_books(me, case when diff < 0 then '🔴 Cash short ' || public.nifti_peso(-diff) else '🟡 Cash over ' || public.nifti_peso(diff) end,
      to_char(p_day, 'Mon DD') || ' · ' || coalesce(nullif(btrim(p_drawer), ''), 'Main') || ' drawer · counted by ' || coalesce(who, 'someone') || '. Expected ' || public.nifti_peso(ex) || ', counted ' || public.nifti_peso(ct) || '.',
      './#cashcount');
  end if;
  return case when boss then jsonb_build_object('saved', true, 'difference', diff, 'expected', ex, 'counted', ct) else jsonb_build_object('saved', true) end;
end $function$;

-- 3) the in-app weekly card: staff don't get the books numbers
create or replace function public.my_weekly_recap(p_offset integer default 1)
 returns jsonb language plpgsql stable security definer set search_path to 'public' as $function$
declare me uuid := public.nifti_my_business(); today date := (now() at time zone 'Asia/Manila')::date; mon date; r jsonb;
begin
  if me is null then return null; end if;
  mon := date_trunc('week', today)::date - 7 * greatest(least(coalesce(p_offset, 1), 8), 0);
  r := public.weekly_recap_for(me, mon, least(mon + 6, today));
  if not public.nifti_books_viewer(me) then r := r - 'books'; end if;
  return r;
end $function$;

-- 4) yesterday's books, for the owner's morning message
create table if not exists books_summary_log (business_id uuid not null references businesses(id) on delete cascade, day date not null, primary key (business_id, day));
alter table books_summary_log enable row level security;

create or replace function public.books_day_for(p_business uuid, p_day date)
 returns jsonb language sql stable security definer set search_path to 'public' as $$
  select jsonb_build_object(
    'sales', (select coalesce(sum(total), 0) from downstream_sales where business_id = p_business and voided_at is null and sale_date = p_day),
    'sales_count', (select count(*) from downstream_sales where business_id = p_business and voided_at is null and sale_date = p_day),
    'utang', (select coalesce(sum(total), 0) from downstream_sales where business_id = p_business and voided_at is null and sale_date = p_day and paid_with = 'credit'),
    'voided', (select count(*) from downstream_sales where business_id = p_business and voided_at is not null and (voided_at at time zone 'Asia/Manila')::date = p_day),
    'expenses', (select coalesce(sum(amount), 0) from expenses where business_id = p_business and deleted_at is null and spent_on = p_day
                  and category not in ('Owner took money', 'Cash to bank', 'Owner put in cash')),
    'expenses_removed', (select count(*) from expenses where business_id = p_business and deleted_at is not null and (deleted_at at time zone 'Asia/Manila')::date = p_day),
    'cash_diff', (select coalesce(sum(difference), 0) from cash_counts where business_id = p_business and count_day = p_day),
    'cash_counted', (select count(*) from cash_counts where business_id = p_business and count_day = p_day),
    'bad_stock', (select coalesce(sum(-qty * coalesce(unit_cost, 0)), 0) from stock_moves where business_id = p_business and kind = 'bad' and moved_on = p_day),
    'missing_stock', (select coalesce(sum(-qty * coalesce(unit_cost, 0)), 0) from stock_moves where business_id = p_business and kind = 'count' and qty < 0 and moved_on = p_day),
    'hand_changes', (select count(*) from stock_moves where business_id = p_business and kind = 'adjust' and moved_on = p_day)
  )
$$;
revoke all on function public.books_day_for(uuid, date) from public, anon, authenticated;

create or replace function public.send_books_summaries()
 returns integer language plpgsql security definer set search_path to 'public' as $$
declare today date := (now() at time zone 'Asia/Manila')::date; y date := today - 1; b record; d jsonb; lines text[]; flags int; title text; sent int := 0; inserted int;
begin
  for b in select biz.id from businesses biz where not biz.is_outside and biz.paused_at is null and biz.banned_at is null
             and (exists (select 1 from downstream_sales s where s.business_id = biz.id and s.sale_date >= today - 30)
               or exists (select 1 from expenses e where e.business_id = biz.id and e.spent_on >= today - 30)
               or exists (select 1 from cash_counts c where c.business_id = biz.id and c.count_day >= today - 30)) loop
    d := public.books_day_for(b.id, y);
    lines := array[]::text[]; flags := 0;
    if (d->>'sales_count')::int > 0 then lines := lines || ('🧾 Sales ' || public.nifti_peso((d->>'sales')::numeric) || ' (' || (d->>'sales_count') || ')'
      || case when (d->>'utang')::numeric >= 1 then ' · utang ' || public.nifti_peso((d->>'utang')::numeric) else '' end); end if;
    if (d->>'expenses')::numeric >= 1 then lines := lines || ('💸 Expenses ' || public.nifti_peso((d->>'expenses')::numeric)); end if;
    if (d->>'cash_counted')::int = 0 then
      -- only a flag for shops that count their drawer
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
end $$;
revoke all on function public.send_books_summaries() from public, anon, authenticated;
select cron.unschedule('nifti-books-summary') where exists (select 1 from cron.job where jobname = 'nifti-books-summary');
select cron.schedule('nifti-books-summary', '5 23 * * *', 'select public.send_books_summaries()');

-- 5) menu items (restaurants, food stalls, any made-to-order item): selling one takes its ingredients out of stock
create table if not exists menu_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text not null check (length(btrim(name)) between 1 and 120),
  price numeric not null default 0 check (price >= 0 and price < 100000000),
  recipe jsonb not null default '[]' check (jsonb_typeof(recipe) = 'array' and jsonb_array_length(recipe) <= 60 and octet_length(recipe::text) <= 20000),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists menu_items_business on menu_items(business_id);
alter table menu_items enable row level security;
drop policy if exists menu_items_select on menu_items;
create policy menu_items_select on menu_items for select using (business_id in (select my_business_ids()));
drop policy if exists menu_items_insert on menu_items;
create policy menu_items_insert on menu_items for insert with check (business_id in (select my_business_ids()) and public.nifti_books_viewer(business_id));
drop policy if exists menu_items_update on menu_items;
create policy menu_items_update on menu_items for update using (business_id in (select my_business_ids()) and public.nifti_books_viewer(business_id))
  with check (business_id in (select my_business_ids()) and public.nifti_books_viewer(business_id));
-- no delete: a menu item is switched off (active = false) so old sales still make sense
create or replace function public.menu_items_touch() returns trigger language plpgsql as $$ begin new.updated_at := now(); return new; end $$;
drop trigger if exists menu_items_touch on menu_items;
create trigger menu_items_touch before update on menu_items for each row execute function public.menu_items_touch();
grant select, insert, update on menu_items to authenticated;
create or replace function public.weekly_recap_for(p_business uuid, p_from date, p_to date)
 returns jsonb language plpgsql stable security definer set search_path to 'public' as $$
declare b businesses; sell jsonb; buy jsonb; books jsonb; tz text := 'Asia/Manila';
begin
  select * into b from businesses where id = p_business;
  if b.id is null then return null; end if;
  with mine as (select * from purchase_orders where supplier_business_id = p_business and status <> 'draft'),
  pays as (
    select po.id po_id, (p->>'amount')::numeric amt, public.nifti_iso_date(p->>'date') d
    from mine po, jsonb_array_elements(coalesce(po.invoice->'payments','[]'::jsonb)) p
    where coalesce(p->>'confirmStatus','confirmed') = 'confirmed' and not (p->>'method' = 'check' and coalesce(p->>'checkStatus','') <> 'cleared')
    union all
    select po.id, (p->>'amount')::numeric, public.nifti_iso_date(p->>'date')
    from mine po, jsonb_array_elements(coalesce(po.deposit_payments,'[]'::jsonb)) p
    where coalesce(p->>'confirmStatus','confirmed') = 'confirmed'
      and not exists (select 1 from jsonb_array_elements(coalesce(po.invoice->'payments','[]'::jsonb)) q where q->>'id' = p->>'id')
  ),
  wk as (select * from pays where d between p_from and p_to)
  select jsonb_build_object(
    'orders', (select count(*) from mine where created_date between p_from and p_to and status not in ('cancelled','quote') and coalesce(invoice->>'opening','') <> 'true'),
    'orders_value', (select coalesce(sum(public.nifti_po_total(m)), 0) from mine m where created_date between p_from and p_to and status not in ('cancelled','quote') and coalesce(invoice->>'opening','') <> 'true'),
    'collected', (select coalesce(sum(amt), 0) from wk),
    'payments', (select count(*) from wk),
    'collected_after_reminder', (select coalesce(sum(amt), 0) from wk where exists (select 1 from payment_reminder_log l where l.po_id = wk.po_id and (l.sent_at at time zone tz)::date <= wk.d)),
    'reminders', (select count(*) from payment_reminder_log l join mine m on m.id = l.po_id where (l.sent_at at time zone tz)::date between p_from and p_to),
    'statements_opened', (select count(distinct buyer_business_id) from statement_links where supplier_business_id = p_business and (first_viewed_at at time zone tz)::date between p_from and p_to),
    'deliveries_confirmed', (select count(*) from mine where public.nifti_iso_date(delivery_confirmation->>'confirmedDate') between p_from and p_to),
    'owed_now', (select coalesce(sum(greatest(public.nifti_invoice_balance(invoice), 0)), 0) from mine where invoice is not null and status not in ('cancelled','paid') and coalesce(invoice->>'status','') <> 'paid'))
  into sell;
  with mine as (select * from purchase_orders where buyer_business_id = p_business and status <> 'draft'),
  pays as (
    select (p->>'amount')::numeric amt, public.nifti_iso_date(p->>'date') d
    from mine po, jsonb_array_elements(coalesce(po.invoice->'payments','[]'::jsonb) || coalesce(po.deposit_payments,'[]'::jsonb)) p
    where coalesce(p->>'confirmStatus','confirmed') = 'confirmed'
  )
  select jsonb_build_object(
    'orders', (select count(*) from mine where created_date between p_from and p_to and status not in ('cancelled')),
    'orders_value', (select coalesce(sum(public.nifti_po_total(m)), 0) from mine m where created_date between p_from and p_to and status not in ('cancelled')),
    'paid', (select coalesce(sum(amt), 0) from pays where d between p_from and p_to),
    'deliveries', (select count(*) from mine where public.nifti_iso_date(delivery_confirmation->>'confirmedDate') between p_from and p_to),
    'late', (select count(*) from mine where requested_delivery_date between p_from and p_to and status not in ('cancelled')
               and (public.nifti_iso_date(delivery_confirmation->>'confirmedDate') is null or public.nifti_iso_date(delivery_confirmation->>'confirmedDate') > requested_delivery_date)),
    'overpay_alerts', (select count(*) from watchdog_alerts where business_id = p_business and (created_at at time zone tz)::date between p_from and p_to),
    'overpay_amount', (select coalesce(sum(amount_at_risk), 0) from watchdog_alerts where business_id = p_business and (created_at at time zone tz)::date between p_from and p_to))
  into buy;
  select jsonb_build_object(
    'counter_sales', (select coalesce(sum(total), 0) from downstream_sales where business_id = p_business and voided_at is null and sale_date between p_from and p_to),
    'counter_count', (select count(*) from downstream_sales where business_id = p_business and voided_at is null and sale_date between p_from and p_to),
    'expenses', (select coalesce(sum(amount), 0) from expenses where business_id = p_business and deleted_at is null and spent_on between p_from and p_to and category not in ('Owner took money', 'Cash to bank', 'Owner put in cash')),
    'cash_short', (select coalesce(sum(-difference), 0) from cash_counts where business_id = p_business and count_day between p_from and p_to and difference < 0),
    'cash_days', (select count(*) from cash_counts where business_id = p_business and count_day between p_from and p_to),
    'bad_stock', (select coalesce(sum(-qty * coalesce(unit_cost, 0)), 0) from stock_moves where business_id = p_business and kind = 'bad' and moved_on between p_from and p_to),
    'missing_stock', (select coalesce(sum(-qty * coalesce(unit_cost, 0)), 0) from stock_moves where business_id = p_business and kind = 'count' and qty < 0 and moved_on between p_from and p_to))
  into books;
  -- keep the old flat keys (selling side) so older screens still read them
  return sell || jsonb_build_object('role', 'both', 'from', p_from, 'to', p_to, 'sell', sell, 'buy', buy, 'books', books,
    'paid', buy->'paid', 'deliveries', buy->'deliveries', 'late', buy->'late', 'overpay_alerts', buy->'overpay_alerts', 'overpay_amount', buy->'overpay_amount');
end $$;

create or replace function public.send_weekly_recaps()
 returns integer language plpgsql security definer set search_path to 'public' as $$
declare today date := (now() at time zone 'Asia/Manila')::date; f date; t date; b record; r jsonb; s jsonb; bu jsonb; bk jsonb;
        title text; body text; sent int := 0; bits text[]; sales numeric; v record;
begin
  f := date_trunc('week', today)::date - 7; t := f + 6;
  for b in select id from businesses where not is_outside and paused_at is null and banned_at is null loop
    r := public.weekly_recap_for(b.id, f, t);
    s := r->'sell'; bu := r->'buy'; bk := r->'books';
    bits := array[]::text[];
    sales := coalesce((s->>'orders_value')::numeric, 0) + coalesce((bk->>'counter_sales')::numeric, 0);
    if sales >= 1 then bits := bits || ('Sales ' || public.nifti_peso(sales)); end if;
    if (s->>'collected')::numeric >= 1 then bits := bits || (public.nifti_peso((s->>'collected')::numeric) || ' collected'
      || case when (s->>'collected_after_reminder')::numeric >= 1 then ' (' || public.nifti_peso((s->>'collected_after_reminder')::numeric) || ' after reminders)' else '' end); end if;
    if (s->>'reminders')::int > 0 then bits := bits || ((s->>'reminders') || ' reminder' || case when (s->>'reminders')::int > 1 then 's' else '' end || ' sent for you'); end if;
    if (bu->>'orders')::int > 0 then bits := bits || ((bu->>'orders') || ' order' || case when (bu->>'orders')::int > 1 then 's' else '' end || ' to suppliers (' || public.nifti_peso((bu->>'orders_value')::numeric) || ')'); end if;
    if (bk->>'expenses')::numeric >= 1 then bits := bits || ('Expenses ' || public.nifti_peso((bk->>'expenses')::numeric)); end if;
    if (bk->>'cash_short')::numeric >= 1 then bits := bits || ('Cash short ' || public.nifti_peso((bk->>'cash_short')::numeric)); end if;
    if (bk->>'missing_stock')::numeric >= 1 then bits := bits || ('Missing stock ' || public.nifti_peso((bk->>'missing_stock')::numeric)); end if;
    if (bu->>'overpay_alerts')::int > 0 then bits := bits || ((bu->>'overpay_alerts') || ' overpayment alert' || case when (bu->>'overpay_alerts')::int > 1 then 's' else '' end); end if;
    continue when coalesce(array_length(bits, 1), 0) = 0;
    if (s->>'owed_now')::numeric >= 1 then bits := bits || ('Still owed to you: ' || public.nifti_peso((s->>'owed_now')::numeric)); end if;
    title := 'Your week with Nifti: ' || case when sales >= 1 then public.nifti_peso(sales) || ' in sales'
                                              when (s->>'collected')::numeric >= 1 then public.nifti_peso((s->>'collected')::numeric) || ' collected'
                                              else bits[1] end;
    body := left(array_to_string(bits, ' · '), 236);
    -- money totals are for the owner, general manager and finance only
    for v in select id from team_members where business_id = b.id and status = 'active' and auth_user_id is not null and roles && array['Owner','General Manager','Finance'] loop
      perform public.nifti_notify(b.id, title, body, './#dashboard', 'weekly', v.id);
    end loop;
    sent := sent + 1;
  end loop;
  return sent;
end $$;
