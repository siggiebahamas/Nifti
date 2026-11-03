CREATE OR REPLACE FUNCTION public.save_cash_count(p_day date, p_drawer text, p_expected jsonb, p_counted jsonb, p_note text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare me uuid := public.nifti_my_business(); who text; mem uuid; ex numeric; ct numeric; diff numeric; row cash_counts; boss boolean; limit_amt numeric;
begin
  if me is null then raise exception 'Sign in first.'; end if;
  if p_day is null or p_day > public.nifti_today() or p_day < public.nifti_today() - 7 then raise exception 'Pick today or a day this past week.'; end if;
  if jsonb_typeof(coalesce(p_counted,'null')) <> 'object' or octet_length(p_counted::text) > 3000 or octet_length(coalesce(p_expected,'{}')::text) > 3000 then raise exception 'Enter what you counted.'; end if;
  ct := round(coalesce((p_counted->>'cash')::numeric, -1), 2);
  if ct < 0 or ct > 100000000 then raise exception 'Enter the cash you counted.'; end if;
  ex := round(coalesce((p_expected->>'cash')::numeric, 0), 2);
  diff := ct - ex;
  boss := public.nifti_books_viewer(me);
  mem := public.nifti_me_member(me); who := public.nifti_member_name(me);
  select * into row from cash_counts where business_id = me and count_day = p_day and drawer = coalesce(nullif(btrim(p_drawer), ''), 'Main');
  if row.id is not null and row.reopened_at is null and not boss then raise exception 'This day is already closed. Ask the owner to reopen it.'; end if;
  insert into cash_counts(business_id, count_day, drawer, expected, counted, difference, note, closed_by, closed_by_name, closed_at, reopened_at, reopened_by_name)
    values (me, p_day, coalesce(nullif(btrim(p_drawer), ''), 'Main'), coalesce(p_expected, '{}'), p_counted, diff, nullif(left(btrim(coalesce(p_note,'')), 300), ''), mem, who, now(), null, null)
  on conflict (business_id, count_day, drawer) do update set expected = excluded.expected, counted = excluded.counted, difference = excluded.difference,
    note = excluded.note, closed_by = excluded.closed_by, closed_by_name = excluded.closed_by_name, closed_at = now(), reopened_at = null, reopened_by_name = null,
    reviewed_at = null, reviewed_by_name = null, review_note = null;
  insert into audit_log(business_id, action, entity_type, entity_id, field, old_value, new_value, actor)
    values (me, 'cash_counted', 'cash_count', p_day::text, coalesce(nullif(btrim(p_drawer), ''), 'Main'), to_jsonb(ex), to_jsonb(ct), coalesce(who, 'someone'));
  limit_amt := coalesce((select (books_settings->>'cash_alert')::numeric from businesses where id = me), 100);
  if abs(diff) >= greatest(limit_amt, 1) then
    perform public.nifti_notify(me, case when diff < 0 then '🔴 Cash short ' || public.nifti_peso(-diff) else '🟡 Cash over ' || public.nifti_peso(diff) end,
      to_char(p_day, 'Mon DD') || ' · ' || coalesce(nullif(btrim(p_drawer), ''), 'Main') || ' drawer · counted by ' || coalesce(who, 'someone') || '. Expected ' || public.nifti_peso(ex) || ', counted ' || public.nifti_peso(ct) || '.',
      './#cashcount', 'money');
  end if;
  -- staff see only that it saved; the owner sees the difference
  return case when boss then jsonb_build_object('saved', true, 'difference', diff, 'expected', ex, 'counted', ct) else jsonb_build_object('saved', true) end;
end $function$


