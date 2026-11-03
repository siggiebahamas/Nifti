CREATE OR REPLACE FUNCTION public.nifti_current_member()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select id from team_members where auth_user_id = auth.uid() limit 1
$function$


