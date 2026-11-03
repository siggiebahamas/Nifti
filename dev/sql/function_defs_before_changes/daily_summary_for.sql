CREATE OR REPLACE FUNCTION public.daily_summary_for(p_business uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with today as (select (now() at time zone 'Asia/Manila')::date d),
  sup as (
    select po.* from purchase_orders po where po.supplier_business_id = p_business and po.status not in ('draft','cancelled')
  ), buy as (
    select po.* from purchase_orders po where po.buyer_business_id = p_business and po.status not in ('draft','cancelled')
  )
  select jsonb_build_object(
    'to_confirm', (select count(*) from sup where status = 'sent'),
    'to_deliver', (select count(*) from sup, today where status in ('confirmed','preparing') and requested_delivery_date <= today.d),
    'payments_to_check', (select count(*) from sup where public.nifti_count_payments(invoice, deposit_payments, 'pending') > 0),
    'owed_to_you', (select coalesce(sum(public.nifti_invoice_balance(invoice)), 0) from sup where invoice is not null and status <> 'paid' and coalesce(invoice->>'status','') <> 'paid'),
    'owed_to_you_overdue', (select coalesce(sum(public.nifti_invoice_balance(invoice)), 0) from sup, today where invoice is not null and status <> 'paid' and coalesce(invoice->>'status','') <> 'paid'
                              and coalesce(invoice->>'dueDate','') ~ '^\d{4}-\d{2}-\d{2}$' and (invoice->>'dueDate')::date < today.d),
    'arriving', (select count(*) from buy, today where status in ('shipped','in_customs') or (status in ('confirmed','preparing') and requested_delivery_date = today.d)),
    'price_changes', (select count(*) from buy where status = 'countered'),
    'bills_due', (select coalesce(sum(public.nifti_invoice_balance(invoice)), 0) from buy, today where invoice is not null and status <> 'paid' and coalesce(invoice->>'status','') <> 'paid'
                   and coalesce(invoice->>'dueDate','') ~ '^\d{4}-\d{2}-\d{2}$' and (invoice->>'dueDate')::date <= today.d + 3),
    'payments_rejected', (select count(*) from buy where public.nifti_count_payments(invoice, deposit_payments, 'rejected') > 0 and status <> 'paid'),
    'unread_messages', (select coalesce(sum(case when c.buyer_business_id = p_business then c.buyer_unread_count else c.supplier_unread_count end), 0)
                        from conversations c where p_business in (c.buyer_business_id, c.supplier_business_id))
  )
$function$


CREATE OR REPLACE FUNCTION public.daily_summary_for(p_business uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with today as (select (now() at time zone 'Asia/Manila')::date d),
  sup as (
    select po.* from purchase_orders po where po.supplier_business_id = p_business and po.status not in ('draft','cancelled')
  ), buy as (
    select po.* from purchase_orders po where po.buyer_business_id = p_business and po.status not in ('draft','cancelled')
  )
  select jsonb_build_object(
    'to_confirm', (select count(*) from sup where status = 'sent'),
    'to_deliver', (select count(*) from sup, today where status in ('confirmed','preparing') and requested_delivery_date <= today.d),
    'payments_to_check', (select count(*) from sup where public.nifti_count_payments(invoice, deposit_payments, 'pending') > 0),
    'owed_to_you', (select coalesce(sum(public.nifti_invoice_balance(invoice)), 0) from sup where invoice is not null and status <> 'paid' and coalesce(invoice->>'status','') <> 'paid'),
    'owed_to_you_overdue', (select coalesce(sum(public.nifti_invoice_balance(invoice)), 0) from sup, today where invoice is not null and status <> 'paid' and coalesce(invoice->>'status','') <> 'paid'
                              and coalesce(invoice->>'dueDate','') ~ '^\d{4}-\d{2}-\d{2}$' and (invoice->>'dueDate')::date < today.d),
    'arriving', (select count(*) from buy, today where status in ('shipped','in_customs') or (status in ('confirmed','preparing') and requested_delivery_date = today.d)),
    'price_changes', (select count(*) from buy where status = 'countered'),
    'bills_due', (select coalesce(sum(public.nifti_invoice_balance(invoice)), 0) from buy, today where invoice is not null and status <> 'paid' and coalesce(invoice->>'status','') <> 'paid'
                   and coalesce(invoice->>'dueDate','') ~ '^\d{4}-\d{2}-\d{2}$' and (invoice->>'dueDate')::date <= today.d + 3),
    'payments_rejected', (select count(*) from buy where public.nifti_count_payments(invoice, deposit_payments, 'rejected') > 0 and status <> 'paid'),
    'unread_messages', (select coalesce(sum(case when c.buyer_business_id = p_business then c.buyer_unread_count else c.supplier_unread_count end), 0)
                        from conversations c where p_business in (c.buyer_business_id, c.supplier_business_id))
  )
$function$


