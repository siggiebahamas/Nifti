CREATE OR REPLACE FUNCTION public.business_plan(p_business uuid)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select coalesce((
    select s.plan_id from subscriptions s
    where s.business_id = p_business and s.plan_id in ('supplier_pro','buyer_pro','business') and s.status = 'active'
      and (s.paid_until is null or s.paid_until >= (now() at time zone 'Asia/Manila')::date)
  ), 'free') $function$


