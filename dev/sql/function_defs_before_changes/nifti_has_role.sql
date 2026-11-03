CREATE OR REPLACE FUNCTION public.nifti_has_role(p_business uuid, p_roles text[])
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (select 1 from team_members where business_id = p_business and auth_user_id = auth.uid() and status = 'active' and roles && p_roles) $function$


