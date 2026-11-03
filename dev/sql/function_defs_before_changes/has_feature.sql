CREATE OR REPLACE FUNCTION public.has_feature(p_business uuid, p_feature text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select public.nifti_pilot_free() or p_feature = any(public.plan_features(public.business_plan(p_business)))
$function$


