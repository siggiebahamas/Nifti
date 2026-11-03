CREATE OR REPLACE FUNCTION public.admin_overview()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.is_platform_admin() then raise exception 'Only the Nifti owner can see this.'; end if;
  return jsonb_build_object(
    'businesses', (select count(*) from businesses where not is_outside),
    'suppliers', (select count(*) from businesses where not is_outside and type = 'supplier'),
    'buyers', (select count(*) from businesses where not is_outside and type = 'buyer'),
    'outside', (select count(*) from businesses where is_outside),
    'people', (select count(*) from auth.users),
    'new_7d', (select count(*) from businesses where not is_outside and created_at > now() - interval '7 days'),
    'new_30d', (select count(*) from businesses where not is_outside and created_at > now() - interval '30 days'),
    'active_7d', (select count(distinct b) from (select buyer_business_id b from purchase_orders where updated_at > now() - interval '7 days' union select supplier_business_id from purchase_orders where updated_at > now() - interval '7 days'
                  union select sender_business_id from conversation_messages where sent_at > now() - interval '7 days') x join businesses z on z.id = x.b and not z.is_outside),
    'orders_7d', (select count(*) from purchase_orders where created_at > now() - interval '7 days' and status <> 'draft'),
    'gmv_30d', (select coalesce(sum(public.nifti_po_total(po)), 0) from purchase_orders po where created_at > now() - interval '30 days' and status not in ('draft','cancelled')),
    'paying', (select count(*) from subscriptions where plan_id in ('supplier_pro','buyer_pro','business') and status = 'active' and (paid_until is null or paid_until >= public.nifti_today())),
    'mrr', (select coalesce(sum(case plan_id when 'business' then 2990 else 990 end), 0) from subscriptions where plan_id in ('supplier_pro','buyer_pro','business') and status = 'active' and paid_until >= public.nifti_today()),
    'banned', (select count(*) from businesses where banned_at is not null),
    'unreviewed', (select count(*) from businesses where not is_outside and reviewed_at is null and banned_at is null),
    'pending_payments', (select count(*) from upgrade_requests where status = 'pending'),
    'open_services', (select count(*) from service_requests where status in ('pending','in_progress')),
    'support_7d', (select count(*) from support_messages where created_at > now() - interval '7 days'),
    'errors_24h', (select count(*) from client_error_log where created_at > now() - interval '1 day'),
    'push_errors_24h', (select count(*) from notification_outbox where error is not null and created_at > now() - interval '1 day'),
    'require_review', public.nifti_require_review(),
    'pilot', public.nifti_pilot_free());
end $function$


