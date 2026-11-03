CREATE OR REPLACE FUNCTION public.my_business_ids()
 RETURNS SETOF uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select t.business_id from team_members t join businesses b on b.id = t.business_id where t.auth_user_id = auth.uid() and b.banned_at is null $function$


CREATE OR REPLACE FUNCTION public.my_business_ids()
 RETURNS SETOF uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select t.business_id from team_members t join businesses b on b.id = t.business_id where t.auth_user_id = auth.uid() and b.banned_at is null $function$


CREATE OR REPLACE FUNCTION public.my_business_ids()
 RETURNS SETOF uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select t.business_id from team_members t join businesses b on b.id = t.business_id where t.auth_user_id = auth.uid() and b.banned_at is null $function$


