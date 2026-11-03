CREATE OR REPLACE FUNCTION public.nifti_my_business()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select t.business_id from team_members t join businesses b on b.id = t.business_id where t.auth_user_id = auth.uid() and t.status = 'active' and b.banned_at is null limit 1 $function$


CREATE OR REPLACE FUNCTION public.nifti_my_business()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select t.business_id from team_members t join businesses b on b.id = t.business_id where t.auth_user_id = auth.uid() and t.status = 'active' and b.banned_at is null limit 1 $function$


