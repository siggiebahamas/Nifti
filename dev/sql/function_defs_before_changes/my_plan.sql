CREATE OR REPLACE FUNCTION public.my_plan()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with me as (select public.nifti_my_business() id)
  select jsonb_build_object(
    'plan', public.business_plan(me.id),
    'pilot', public.nifti_pilot_free(),
    'paid_until', (select paid_until from subscriptions where business_id = me.id),
    'features', to_jsonb(public.plan_features(public.business_plan(me.id))),
    'seat_limit', public.plan_seat_limit(public.business_plan(me.id)),
    'seats_used', (select count(*) from team_members where business_id = me.id and status in ('active','invited')),
    'pending_request', (select jsonb_build_object('plan', plan, 'cycle', cycle, 'created_at', created_at) from upgrade_requests where business_id = me.id and status = 'pending' order by created_at desc limit 1)
  ) from me where me.id is not null
$function$


