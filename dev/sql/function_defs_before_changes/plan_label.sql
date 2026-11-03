CREATE OR REPLACE FUNCTION public.plan_label(p text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  select case p when 'supplier_pro' then 'Supplier Pro' when 'buyer_pro' then 'Buyer Pro' when 'business' then 'Business' else 'Free' end $function$


