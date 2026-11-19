-- Round 49: product photos for the online store. Applied to the live project on 2026-11-19. Safe to run more than once.
-- Photos live in the public 'store-photos' bucket under <business id>/<item>.jpg so the whole team (owner, poster)
-- and the buyer's store page see the same photo. Only the business's own team can write in its folder.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('store-photos', 'store-photos', true, 2097152, array['image/jpeg','image/webp','image/png'])
on conflict (id) do update set public = true, file_size_limit = 2097152, allowed_mime_types = array['image/jpeg','image/webp','image/png'];

drop policy if exists store_photos_insert on storage.objects;
create policy store_photos_insert on storage.objects for insert to authenticated with check (
  bucket_id = 'store-photos' and (storage.foldername(name))[1] in (select b::text from my_business_ids() b(b)));
drop policy if exists store_photos_update on storage.objects;
create policy store_photos_update on storage.objects for update to authenticated using (
  bucket_id = 'store-photos' and (storage.foldername(name))[1] in (select b::text from my_business_ids() b(b)))
  with check (bucket_id = 'store-photos' and (storage.foldername(name))[1] in (select b::text from my_business_ids() b(b)));
drop policy if exists store_photos_delete on storage.objects;
create policy store_photos_delete on storage.objects for delete to authenticated using (
  bucket_id = 'store-photos' and (storage.foldername(name))[1] in (select b::text from my_business_ids() b(b)));

create or replace function public.set_store_photo(p_item text, p_path text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare me uuid := public.nifti_my_business(); item text := left(btrim(regexp_replace(coalesce(p_item,''), '[<>"`]', '', 'g')), 120); cur jsonb;
begin
  if me is null then raise exception 'Sign in first.'; end if;
  if not exists (select 1 from team_members where auth_user_id = auth.uid() and business_id = me and status = 'active'
                 and roles && array['Owner','General Manager','Poster']) then
    raise exception 'Only the Owner, General Manager or Poster can change store photos.';
  end if;
  if item = '' then raise exception 'Pick an item first.'; end if;
  if p_path is not null and p_path !~ ('^' || me::text || '/[a-z0-9-]{1,90}\.(jpg|webp|png)$') then raise exception 'That photo is not in your store folder.'; end if;
  select coalesce(store->'photos', '{}'::jsonb) into cur from businesses where id = me;
  if p_path is null then cur := cur - item;
  else
    if not (cur ? item) and (select count(*) from jsonb_object_keys(cur)) >= 300 then raise exception 'You have 300 item photos already. Remove one first.'; end if;
    cur := cur || jsonb_build_object(item, p_path);
  end if;
  update businesses set store = jsonb_set(coalesce(store, '{}'::jsonb), '{photos}', cur, true) where id = me;
  return cur;
end $$;
revoke all on function public.set_store_photo(text, text) from public, anon;
grant execute on function public.set_store_photo(text, text) to authenticated;

-- set_store rebuilds the store settings from a fixed list; keep the photo list when it does.
create or replace function public.nifti_keep_store_photos() returns trigger language plpgsql set search_path = public as $$
begin
  if new.store is distinct from old.store and old.store ? 'photos' and not (new.store ? 'photos') then
    new.store := jsonb_set(coalesce(new.store, '{}'::jsonb), '{photos}', old.store->'photos', true);
  end if;
  return new;
end $$;
drop trigger if exists keep_store_photos on public.businesses;
create trigger keep_store_photos before update of store on public.businesses for each row execute function public.nifti_keep_store_photos();

-- The buyer's store page gets the photo list too.
do $$
declare d text;
begin
  d := pg_get_functiondef('public.get_store(text,text)'::regprocedure);
  if position('''photos''' in d) = 0 then
    d := replace(d, '''featured'', coalesce(b.store->''featured'', ''[]''::jsonb),',
      '''featured'', coalesce(b.store->''featured'', ''[]''::jsonb), ''photos'', coalesce(b.store->''photos'', ''{}''::jsonb),');
    execute d;
  end if;
end $$;
