create or replace function public.nifti_guard_open_month() returns trigger language plpgsql security definer set search_path to 'public' as $$
declare col text := case tg_table_name when 'expenses' then 'spent_on' when 'downstream_sales' then 'sale_date' else 'count_day' end;
  dnew date; dold date; b uuid;
begin
  b := coalesce(new.business_id, old.business_id);
  dnew := (to_jsonb(new)->>col)::date;
  if tg_op = 'UPDATE' then dold := (to_jsonb(old)->>col)::date; end if;
  if public.nifti_month_locked(b, dnew) or (dold is not null and public.nifti_month_locked(b, dold)) then
    raise exception 'That month is closed. Ask the owner to reopen it first.';
  end if;
  return new;
end $$;
