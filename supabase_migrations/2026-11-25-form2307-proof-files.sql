-- Round 75: keep proof for BIR 2307 forms (a photo or PDF of the form given or received), per counterparty and quarter.
-- Additive only: a private storage bucket and one table, both limited to the business that owns the files.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('tax-forms', 'tax-forms', false, 10485760, array['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy taxforms_read on storage.objects for select to authenticated
  using (bucket_id = 'tax-forms' and (storage.foldername(name))[1] in (select b::text from public.my_business_ids() b(b)));
create policy taxforms_write on storage.objects for insert to authenticated
  with check (bucket_id = 'tax-forms' and (storage.foldername(name))[1] in (select b::text from public.my_business_ids() b(b)));
create policy taxforms_delete on storage.objects for delete to authenticated
  using (bucket_id = 'tax-forms' and (storage.foldername(name))[1] in (select b::text from public.my_business_ids() b(b)));

create table if not exists public.form2307_files (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  counterparty_id text not null,
  quarter text not null check (quarter ~ '^\d{4}-Q[1-4]$'),
  side text not null check (side in ('collect', 'give')),
  file_path text not null,
  file_name text,
  mime text,
  uploaded_by_name text,
  created_at timestamptz not null default now()
);
create index if not exists form2307_files_biz on public.form2307_files (business_id, counterparty_id, quarter);
alter table public.form2307_files enable row level security;
create policy f2307_select on public.form2307_files for select to authenticated using (business_id in (select public.my_business_ids()));
create policy f2307_insert on public.form2307_files for insert to authenticated with check (business_id in (select public.my_business_ids()) and file_path like business_id::text || '/%');
create policy f2307_delete on public.form2307_files for delete to authenticated using (business_id in (select public.my_business_ids()));
