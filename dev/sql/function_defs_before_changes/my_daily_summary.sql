CREATE OR REPLACE FUNCTION public.my_daily_summary()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select public.daily_summary_for(public.nifti_my_business()) where public.nifti_my_business() is not null
$function$


