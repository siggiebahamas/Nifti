CREATE OR REPLACE FUNCTION public.weekly_recap_for(p_business uuid, p_from date, p_to date)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare b businesses; r jsonb; tz text := 'Asia/Manila';
begin
  select * into b from businesses where id = p_business;
  if b.id is null then return null; end if;
  if b.type = 'supplier' then
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
    select jsonb_build_object('role', 'supplier', 'from', p_from, 'to', p_to,
      'orders', (select count(*) from mine where created_date between p_from and p_to and status not in ('cancelled','quote') and coalesce(invoice->>'opening','') <> 'true'),
      'orders_value', (select coalesce(sum(public.nifti_po_total(m)), 0) from mine m where created_date between p_from and p_to and status not in ('cancelled','quote') and coalesce(invoice->>'opening','') <> 'true'),
      'collected', (select coalesce(sum(amt), 0) from wk),
      'payments', (select count(*) from wk),
      'collected_after_reminder', (select coalesce(sum(amt), 0) from wk where exists (select 1 from payment_reminder_log l where l.po_id = wk.po_id and (l.sent_at at time zone tz)::date <= wk.d)),
      'reminders', (select count(*) from payment_reminder_log l join mine m on m.id = l.po_id where (l.sent_at at time zone tz)::date between p_from and p_to),
      'statements_opened', (select count(distinct buyer_business_id) from statement_links where supplier_business_id = p_business and (first_viewed_at at time zone tz)::date between p_from and p_to),
      'deliveries_confirmed', (select count(*) from mine where public.nifti_iso_date(delivery_confirmation->>'confirmedDate') between p_from and p_to),
      'owed_now', (select coalesce(sum(greatest(public.nifti_invoice_balance(invoice), 0)), 0) from mine where invoice is not null and status not in ('cancelled','paid') and coalesce(invoice->>'status','') <> 'paid'))
    into r;
  else
    with mine as (select * from purchase_orders where buyer_business_id = p_business and status <> 'draft'),
    pays as (
      select (p->>'amount')::numeric amt, public.nifti_iso_date(p->>'date') d
      from mine po, jsonb_array_elements(coalesce(po.invoice->'payments','[]'::jsonb) || coalesce(po.deposit_payments,'[]'::jsonb)) p
      where coalesce(p->>'confirmStatus','confirmed') = 'confirmed'
    )
    select jsonb_build_object('role', 'buyer', 'from', p_from, 'to', p_to,
      'orders', (select count(*) from mine where created_date between p_from and p_to and status not in ('cancelled')),
      'orders_value', (select coalesce(sum(public.nifti_po_total(m)), 0) from mine m where created_date between p_from and p_to and status not in ('cancelled')),
      'paid', (select coalesce(sum(amt), 0) from pays where d between p_from and p_to),
      'deliveries', (select count(*) from mine where public.nifti_iso_date(delivery_confirmation->>'confirmedDate') between p_from and p_to),
      'late', (select count(*) from mine where requested_delivery_date between p_from and p_to and status not in ('cancelled')
                 and (public.nifti_iso_date(delivery_confirmation->>'confirmedDate') is null or public.nifti_iso_date(delivery_confirmation->>'confirmedDate') > requested_delivery_date)),
      'overpay_alerts', (select count(*) from watchdog_alerts where business_id = p_business and (created_at at time zone tz)::date between p_from and p_to),
      'overpay_amount', (select coalesce(sum(amount_at_risk), 0) from watchdog_alerts where business_id = p_business and (created_at at time zone tz)::date between p_from and p_to))
    into r;
  end if;
  return r;
end $function$


