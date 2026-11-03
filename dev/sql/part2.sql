-- One Pro plan covers buying, selling and the owner's books. Old Supplier Pro / Buyer Pro keep working and get everything.
alter table upgrade_requests drop constraint if exists upgrade_requests_plan_check;
alter table upgrade_requests add constraint upgrade_requests_plan_check check (plan in ('pro','supplier_pro','buyer_pro','business'));

create or replace function public.plan_features(p_plan text)
 returns text[] language sql immutable set search_path to 'public' as $$
  select case
    when p_plan in ('pro','supplier_pro','buyer_pro') then array['statements','bir2307','store_insights','store_promos','auto_reminders','late_payers','full_history','credit_limits',
         'cheques','routes','price_blast','credit_memos','reorder_reminders','vat_books','reconcile','watchdog','market_price','price_alerts','spending_caps','scorecard','owner_books']
    when p_plan = 'business' then array['statements','bir2307','store_insights','store_promos','auto_reminders','late_payers','full_history','credit_limits',
         'watchdog','market_price','price_alerts','verified_badge','priority_support','featured_listing','setup_service',
         'cheques','routes','price_blast','credit_memos','reorder_reminders','vat_books','spending_caps','scorecard','reconcile','owner_books']
    else array[]::text[] end
$$;
create or replace function public.plan_price(p_plan text, p_cycle text)
 returns numeric language sql immutable set search_path to 'public' as $$
  select case when p_plan = 'business' then (case when p_cycle = 'yearly' then 29900 else 2990 end)
              when p_plan in ('pro','supplier_pro','buyer_pro') then (case when p_cycle = 'yearly' then 9900 else 990 end) else 0 end
$$;
create or replace function public.plan_label(p text)
 returns text language sql immutable set search_path to 'public' as $$
  select case when p in ('pro','supplier_pro','buyer_pro') then 'Pro' when p = 'business' then 'Business' else 'Free' end
$$;
create or replace function public.plan_seat_limit(p_plan text)
 returns integer language sql immutable set search_path to 'public' as $$
  select case when p_plan = 'business' then 50 when p_plan in ('pro','supplier_pro','buyer_pro') then 15 else 3 end
$$;
create or replace function public.business_plan(p_business uuid)
 returns text language sql stable security definer set search_path to 'public' as $$
  select coalesce((
    select case when s.plan_id = 'business' then 'business' else 'pro' end from subscriptions s
    where s.business_id = p_business and s.plan_id in ('pro','supplier_pro','buyer_pro','business') and s.status = 'active'
      and (s.paid_until is null or s.paid_until >= (now() at time zone 'Asia/Manila')::date)
  ), 'free')
$$;

-- Weekly recap: one business, both sides, plus the books.
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
    'expenses', (select coalesce(sum(amount), 0) from expenses where business_id = p_business and deleted_at is null and spent_on between p_from and p_to and category <> 'Owner took money'),
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
        title text; body text; sent int := 0; bits text[]; sales numeric;
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
    perform public.nifti_notify(b.id, title, body, './#dashboard', 'weekly');
    sent := sent + 1;
  end loop;
  return sent;
end $$;
