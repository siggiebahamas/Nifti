-- Round 73 (applied live 24 Nov 2026 as migration r73_sales_visibility_enforced).
-- "Who can see sales" is enforced by the database, not only by the screen.
-- Owner, General Manager and Finance always see every sale. Other team members see every sale only when the owner's
-- setting allows it (books_settings.sales_visibility, or a per-role choice in books_settings.sales_visibility_roles);
-- otherwise they see only the sales they recorded themselves. Only the Owner can change the setting.
-- Tested rollback-only: business mode 2/2, own mode 1/2, cashier can't flip the setting, can't edit a total,
-- can't update someone else's sale; per-role "business" override 2/2; owner 2/2 and may change the setting.
create or replace function public.nifti_sales_see_all(p_business uuid)
returns boolean language plpgsql stable security definer set search_path to 'public' as $$
declare r text[]; s jsonb; per jsonb; picks text[] := '{}'; x text; v text;
begin
  if public.nifti_books_viewer(p_business) then return true; end if;
  select roles into r from team_members where business_id = p_business and auth_user_id = auth.uid() and status = 'active' limit 1;
  if r is null then return false; end if;
  select coalesce(books_settings, '{}'::jsonb) into s from businesses where id = p_business;
  per := coalesce(s->'sales_visibility_roles', '{}'::jsonb);
  if jsonb_typeof(per) = 'object' then
    foreach x in array r loop v := per->>x; if v in ('own', 'business') then picks := picks || v; end if; end loop;
  end if;
  if 'business' = any(picks) then return true; end if;
  if coalesce(array_length(picks, 1), 0) > 0 then return false; end if;
  return coalesce(s->>'sales_visibility', 'business') <> 'own';
end $$;
revoke all on function public.nifti_sales_see_all(uuid) from public;
grant execute on function public.nifti_sales_see_all(uuid) to authenticated;

drop policy if exists ds_select on public.downstream_sales;
create policy ds_select on public.downstream_sales for select
  using (business_id in (select public.my_business_ids()) and (public.nifti_sales_see_all(business_id) or created_by = public.nifti_me_member(business_id)));
drop policy if exists ds_update on public.downstream_sales;
create policy ds_update on public.downstream_sales for update
  using (business_id in (select public.my_business_ids()) and (public.nifti_sales_see_all(business_id) or created_by = public.nifti_me_member(business_id)))
  with check (business_id in (select public.my_business_ids()));

create or replace function public.guard_sales_visibility_settings()
returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  if auth.uid() is null then return new; end if;
  if ((coalesce(new.books_settings, '{}'::jsonb)->'sales_visibility') is distinct from (coalesce(old.books_settings, '{}'::jsonb)->'sales_visibility')
      or (coalesce(new.books_settings, '{}'::jsonb)->'sales_visibility_roles') is distinct from (coalesce(old.books_settings, '{}'::jsonb)->'sales_visibility_roles'))
     and not exists (select 1 from team_members where business_id = old.id and auth_user_id = auth.uid() and status = 'active' and 'Owner' = any(roles)) then
    raise exception 'Only the owner can change who sees sales.';
  end if;
  return new;
end $$;
drop trigger if exists guard_sales_visibility_settings on public.businesses;
create trigger guard_sales_visibility_settings before update on public.businesses for each row execute function public.guard_sales_visibility_settings();
