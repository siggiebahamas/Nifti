CREATE OR REPLACE FUNCTION public.plan_seat_limit(p_plan text)
 RETURNS integer
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  select case when p_plan = 'business' then 50 when p_plan in ('supplier_pro','buyer_pro') then 15 else 3 end $function$


CREATE OR REPLACE FUNCTION public.plan_seat_limit(p_plan text)
 RETURNS integer
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  select case when p_plan = 'business' then 50 when p_plan in ('supplier_pro','buyer_pro') then 15 else 3 end $function$


