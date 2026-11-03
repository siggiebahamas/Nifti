CREATE OR REPLACE FUNCTION public.is_business_admin(biz_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists(
    select 1 from team_members
    where business_id = biz_id and auth_user_id = auth.uid() and roles && array['Owner','General Manager']
  )
$function$


