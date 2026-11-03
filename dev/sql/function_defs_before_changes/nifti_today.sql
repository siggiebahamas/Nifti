CREATE OR REPLACE FUNCTION public.nifti_today()
 RETURNS date
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$ select (now() at time zone 'Asia/Manila')::date $function$


