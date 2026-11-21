-- Beta entitlement consistency: keep the assigned plan intact while exposing
-- Business-level entitlements during the global free pilot.
-- Safe to apply repeatedly; no customer or subscription rows are rewritten.

CREATE OR REPLACE FUNCTION public.my_plan()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with me as (select public.nifti_my_business() id),
       plans as (
         select me.id,
                public.business_plan(me.id) as assigned_plan,
                case when public.nifti_pilot_free() then 'business'
                     else public.business_plan(me.id) end as effective_plan
         from me
       )
  select jsonb_build_object(
    'plan', plans.effective_plan,
    'assigned_plan', plans.assigned_plan,
    'effective_plan', plans.effective_plan,
    'pilot', public.nifti_pilot_free(),
    'paid_until', (select paid_until from subscriptions where business_id = plans.id),
    'features', to_jsonb(public.plan_features(plans.effective_plan)),
    'seat_limit', public.plan_seat_limit(plans.effective_plan),
    'seats_used', (select count(*) from team_members where business_id = plans.id and status in ('active','invited')),
    'pending_request', (select jsonb_build_object('plan', plan, 'cycle', cycle, 'created_at', created_at)
                        from upgrade_requests where business_id = plans.id and status = 'pending'
                        order by created_at desc limit 1)
  )
  from plans where plans.id is not null
$function$;

CREATE OR REPLACE FUNCTION public.nb_quota(p_business uuid)
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select
    (case
       when public.nifti_pilot_free() then 400
       when public.business_plan(p_business) = 'business' then 400
       when public.business_plan(p_business) = 'pro' then 100
       else 10
     end)
    + (case when (select b.created_at from businesses b where b.id = p_business) > now() - interval '30 days'
            then 300 else 0 end)
$function$;
