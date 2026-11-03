CREATE OR REPLACE FUNCTION public.my_weekly_recap(p_offset integer DEFAULT 1)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare me uuid := public.nifti_my_business(); today date := (now() at time zone 'Asia/Manila')::date; mon date;
begin
  if me is null then return null; end if;
  mon := date_trunc('week', today)::date - 7 * greatest(least(coalesce(p_offset, 1), 8), 0);
  return public.weekly_recap_for(me, mon, least(mon + 6, today));
end $function$


