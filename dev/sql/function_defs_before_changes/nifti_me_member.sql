CREATE OR REPLACE FUNCTION public.nifti_me_member(p_business uuid)
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select id from team_members where business_id = p_business and auth_user_id = auth.uid() and status = 'active' limit 1 $function$


