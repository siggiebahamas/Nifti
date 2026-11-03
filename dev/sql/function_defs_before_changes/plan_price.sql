CREATE OR REPLACE FUNCTION public.plan_price(p_plan text, p_cycle text)
 RETURNS numeric
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  select case when p_plan = 'business' then (case when p_cycle = 'yearly' then 29900 else 2990 end)
              when p_plan in ('supplier_pro','buyer_pro') then (case when p_cycle = 'yearly' then 9900 else 990 end) else 0 end $function$


