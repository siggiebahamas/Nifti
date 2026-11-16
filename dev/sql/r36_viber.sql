-- Round 36: Viber on your own number, relayed by the Nifti Android app (option B) or added by hand on iPhone (option A).
-- Privacy rules:
--   * a business only ever sees its own rows (my_business_ids)
--   * a chat the phone picks up stays private to the phone's owner until they link it to a customer or supplier
--   * the phone never holds the person's login. It holds a random device key (only its hash is stored here),
--     which can only call the viber_dev_* functions below, only for that person's own chats, and can be switched off anytime
--   * nothing here can be written directly from the app; every write goes through a checked function

create table if not exists public.viber_devices(
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null,
  user_name text,
  secret_hash text not null,
  name text, brand text, model text, app_version int,
  flags jsonb not null default '{}'::jsonb,
  last_seen_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists viber_devices_biz on public.viber_devices(business_id);

create table if not exists public.viber_threads(
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  owner_user_id uuid not null,
  owner_name text,
  device_id uuid references public.viber_devices(id) on delete set null,
  chat_key text not null,
  title text not null,
  is_group boolean not null default false,
  phone text,
  status text not null default 'new' check (status in ('new','linked','ignored')),
  party_kind text check (party_kind in ('customer','supplier')),
  party_id text,
  party_name text,
  last_text text, last_at timestamptz,
  unread int not null default 0,
  created_at timestamptz not null default now(),
  unique (business_id, owner_user_id, chat_key)
);
create index if not exists viber_threads_biz on public.viber_threads(business_id, status);

create table if not exists public.viber_messages(
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.viber_threads(id) on delete cascade,
  business_id uuid not null,
  dir text not null check (dir in ('in','out')),
  sender text,
  body text,
  kind text not null default 'text' check (kind in ('text','photo','video','file','voice','sticker','other')),
  media_path text, media_name text, media_mime text, media_size int,
  media_status text not null default 'none' check (media_status in ('none','waiting','ok','missing')),
  ack boolean not null default false,
  source text not null default 'notif' check (source in ('notif','screen','share','nifti','manual','paste')),
  status text not null default 'done' check (status in ('done','queued','sending','sent','failed')),
  fail_reason text,
  claimed_at timestamptz,
  by_user uuid, by_name text,
  dkey text,
  at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (thread_id, dkey)
);
create index if not exists viber_messages_thread on public.viber_messages(thread_id, at);
create index if not exists viber_messages_queue on public.viber_messages(status) where status in ('queued','sending');

alter table public.viber_devices enable row level security;
alter table public.viber_threads enable row level security;
alter table public.viber_messages enable row level security;

-- can this signed-in person see this chat? (their own, or linked inside their business)
create or replace function public.viber_can_see_thread(p text) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare t uuid;
begin
  begin t := p::uuid; exception when others then return false; end;
  return exists(select 1 from viber_threads v where v.id = t and v.business_id in (select my_business_ids())
    and (v.owner_user_id = auth.uid() or v.status = 'linked'));
end $$;

drop policy if exists viber_devices_sel on public.viber_devices;
create policy viber_devices_sel on public.viber_devices for select using (business_id in (select my_business_ids()));
drop policy if exists viber_threads_sel on public.viber_threads;
create policy viber_threads_sel on public.viber_threads for select using (business_id in (select my_business_ids()) and (owner_user_id = auth.uid() or status = 'linked'));
drop policy if exists viber_messages_sel on public.viber_messages;
create policy viber_messages_sel on public.viber_messages for select using (public.viber_can_see_thread(thread_id::text));

-- no direct writes, and the device key hash is never readable
revoke all on public.viber_devices, public.viber_threads, public.viber_messages from anon, authenticated;
grant select (id, business_id, user_id, user_name, name, brand, model, app_version, flags, last_seen_at, revoked_at, created_at) on public.viber_devices to authenticated;
grant select on public.viber_threads, public.viber_messages to authenticated;

-- files: viber-media/<business>/<thread>/<file>
insert into storage.buckets(id, name, public, file_size_limit) values ('viber-media', 'viber-media', false, 26214400)
  on conflict (id) do update set public = false, file_size_limit = 26214400;
drop policy if exists viber_media_read on storage.objects;
create policy viber_media_read on storage.objects for select using (bucket_id = 'viber-media' and public.viber_can_see_thread((storage.foldername(name))[2]));
drop policy if exists viber_media_insert on storage.objects;
create policy viber_media_insert on storage.objects for insert with check (bucket_id = 'viber-media'
  and (storage.foldername(name))[1] in (select b::text from public.my_business_ids() b) and public.viber_can_see_thread((storage.foldername(name))[2]));

-- ===== the web app (signed in) =====
create or replace function public.viber_me_name(p_business uuid) returns text language sql stable security definer set search_path = public as $$
  select coalesce((select name from team_members where business_id = p_business and auth_user_id = auth.uid() limit 1), 'You') $$;

-- the Nifti Android app asks for a device key once, right after you sign in inside it
create or replace function public.viber_device_register(p_business uuid, p_name text, p_brand text, p_model text, p_version int)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare s text := encode(gen_random_bytes(32), 'hex'); d uuid;
begin
  if auth.uid() is null or p_business not in (select my_business_ids()) then raise exception 'not allowed'; end if;
  update viber_devices set revoked_at = now() where business_id = p_business and user_id = auth.uid() and revoked_at is null;
  insert into viber_devices(business_id, user_id, user_name, secret_hash, name, brand, model, app_version, last_seen_at)
    values (p_business, auth.uid(), viber_me_name(p_business), encode(digest(s, 'sha256'), 'hex'), left(p_name, 80), left(p_brand, 40), left(p_model, 60), p_version, now())
    returning id into d;
  update viber_threads set device_id = d where business_id = p_business and owner_user_id = auth.uid();
  return json_build_object('id', d, 'secret', s);
end $$;

create or replace function public.viber_device_revoke(p_device uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update viber_devices v set revoked_at = now() where v.id = p_device and v.business_id in (select my_business_ids())
    and (v.user_id = auth.uid() or exists(select 1 from team_members t where t.business_id = v.business_id and t.auth_user_id = auth.uid() and 'Owner' = any(t.roles)));
end $$;

create or replace function public.viber_link(p_thread uuid, p_kind text, p_party_id text, p_party_name text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_kind not in ('customer','supplier') then raise exception 'pick customer or supplier'; end if;
  update viber_threads v set status = 'linked', party_kind = p_kind, party_id = nullif(p_party_id, ''), party_name = left(p_party_name, 120)
   where v.id = p_thread and v.business_id in (select my_business_ids()) and (v.owner_user_id = auth.uid() or v.status = 'linked');
  if not found then raise exception 'chat not found'; end if;
end $$;

create or replace function public.viber_read(p_thread uuid) returns void
language sql security definer set search_path = public as $$
  update viber_threads v set unread = 0 where v.id = p_thread and public.viber_can_see_thread(p_thread::text) $$;

-- reply from Nifti. With the Android app it goes out from your own Viber; without it (iPhone) you send it yourself and we keep a copy
create or replace function public.viber_send(p_thread uuid, p_text text, p_manual boolean default false) returns json
language plpgsql security definer set search_path = public as $$
declare v viber_threads; r viber_messages; live boolean;
begin
  select * into v from viber_threads where id = p_thread;
  if v.id is null or not viber_can_see_thread(p_thread::text) then raise exception 'chat not found'; end if;
  if coalesce(trim(p_text), '') = '' then raise exception 'type a message first'; end if;
  live := exists(select 1 from viber_devices d where d.id = v.device_id and d.revoked_at is null);
  insert into viber_messages(thread_id, business_id, dir, sender, body, kind, source, status, by_user, by_name, dkey, at)
    values (v.id, v.business_id, 'out', viber_me_name(v.business_id), left(p_text, 4000), 'text',
      case when p_manual or not live then 'manual' else 'nifti' end,
      case when p_manual or not live then 'sent' else 'queued' end,
      auth.uid(), viber_me_name(v.business_id), 'nifti:' || gen_random_uuid(), now())
    returning * into r;
  update viber_threads set last_text = left(p_text, 200), last_at = now() where id = v.id;
  return row_to_json(r);
end $$;

create or replace function public.viber_retry(p_msg uuid, p_manual boolean default false) returns void
language plpgsql security definer set search_path = public as $$
begin
  update viber_messages m set status = case when p_manual then 'sent' else 'queued' end, source = case when p_manual then 'manual' else m.source end, fail_reason = null, claimed_at = null
   where m.id = p_msg and m.dir = 'out' and m.status = 'failed' and viber_can_see_thread(m.thread_id::text);
end $$;

create or replace function public.viber_ack(p_msg uuid) returns void
language sql security definer set search_path = public as $$
  update viber_messages m set ack = true where m.id = p_msg and viber_can_see_thread(m.thread_id::text) $$;

-- option A (iPhone / computer): bring a Viber message in by hand, optionally with a file already uploaded to viber-media
create or replace function public.viber_web_add(p_business uuid, p_kind text, p_party_id text, p_party_name text, p_dir text, p_text text,
  p_media_kind text default 'text', p_media_path text default null, p_media_name text default null, p_media_mime text default null, p_media_size int default null)
returns json language plpgsql security definer set search_path = public as $$
declare t uuid; r viber_messages; k text := 'manual:' || p_kind || ':' || coalesce(nullif(p_party_id, ''), lower(p_party_name));
begin
  if auth.uid() is null or p_business not in (select my_business_ids()) then raise exception 'not allowed'; end if;
  if p_dir not in ('in','out') or p_kind not in ('customer','supplier') then raise exception 'bad input'; end if;
  insert into viber_threads(business_id, owner_user_id, owner_name, chat_key, title, status, party_kind, party_id, party_name)
    values (p_business, auth.uid(), viber_me_name(p_business), k, left(p_party_name, 120), 'linked', p_kind, nullif(p_party_id, ''), left(p_party_name, 120))
    on conflict (business_id, owner_user_id, chat_key) do update set status = 'linked'
    returning id into t;
  if p_media_path is not null and split_part(p_media_path, '/', 1) <> p_business::text then raise exception 'bad file'; end if;
  insert into viber_messages(thread_id, business_id, dir, sender, body, kind, media_path, media_name, media_mime, media_size, media_status, source, status, by_user, by_name, dkey, at)
    values (t, p_business, p_dir, case when p_dir = 'out' then viber_me_name(p_business) else left(p_party_name, 120) end, left(p_text, 4000),
      coalesce(p_media_kind, 'text'), p_media_path, p_media_name, p_media_mime, p_media_size, case when p_media_path is null then 'none' else 'ok' end,
      'paste', 'done', auth.uid(), viber_me_name(p_business), 'paste:' || gen_random_uuid(), now())
    returning * into r;
  update viber_threads set last_text = coalesce(left(p_text, 200), p_media_name), last_at = now() where id = t;
  return json_build_object('thread', t, 'message', row_to_json(r));
end $$;

-- fill a missing photo or file from the computer (file already uploaded to viber-media/<business>/<thread>/...)
create or replace function public.viber_media_set(p_msg uuid, p_path text, p_name text, p_mime text, p_size int) returns void
language plpgsql security definer set search_path = public as $$
begin
  update viber_messages m set media_path = p_path, media_name = left(p_name, 200), media_mime = left(p_mime, 100), media_size = p_size, media_status = 'ok', ack = false
   where m.id = p_msg and viber_can_see_thread(m.thread_id::text) and split_part(p_path, '/', 2) = m.thread_id::text and split_part(p_path, '/', 1) = m.business_id::text;
end $$;

-- ===== the phone (device key, no login) =====
create or replace function public.viber_dev_auth(p_device uuid, p_secret text) returns public.viber_devices
language plpgsql stable security definer set search_path = public, extensions as $$
declare d viber_devices;
begin
  select * into d from viber_devices where id = p_device and revoked_at is null and secret_hash = encode(digest(coalesce(p_secret, ''), 'sha256'), 'hex');
  if d.id is null then raise exception 'device not connected' using errcode = '28000'; end if;
  if not exists(select 1 from team_members t join businesses b on b.id = t.business_id where t.business_id = d.business_id and t.auth_user_id = d.user_id and b.banned_at is null and coalesce(t.status, 'active') <> 'removed') then
    raise exception 'device not connected' using errcode = '28000'; end if;
  return d;
end $$;

create or replace function public.viber_dev_heartbeat(p_device uuid, p_secret text, p_flags jsonb, p_version int) returns json
language plpgsql security definer set search_path = public as $$
declare d viber_devices := viber_dev_auth(p_device, p_secret);
begin
  update viber_devices set last_seen_at = now(), flags = coalesce(p_flags, '{}'::jsonb), app_version = p_version where id = d.id;
  return json_build_object('ok', true,
    'business', (select name from businesses where id = d.business_id),
    'ignored', coalesce((select json_agg(chat_key) from viber_threads where business_id = d.business_id and owner_user_id = d.user_id and status = 'ignored'), '[]'::json),
    'chats', coalesce((select json_agg(json_build_object('id', id, 'key', chat_key, 'title', title, 'party', party_name) order by last_at desc nulls last)
       from (select * from viber_threads where business_id = d.business_id and owner_user_id = d.user_id and status <> 'ignored' order by last_at desc nulls last limit 40) x), '[]'::json));
end $$;

-- items: [{key,title,group,dir,sender,body,kind,media,source,dkey,at,fill}]
create or replace function public.viber_dev_ingest(p_device uuid, p_secret text, p_items jsonb) returns json
language plpgsql security definer set search_path = public as $$
declare d viber_devices := viber_dev_auth(p_device, p_secret); it jsonb; v viber_threads; mid uuid; out jsonb := '[]'::jsonb; ts timestamptz; k text; src text;
begin
  if jsonb_array_length(coalesce(p_items, '[]'::jsonb)) > 200 then raise exception 'too many at once'; end if;
  for it in select * from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) loop
    k := left(coalesce(it->>'key', ''), 200); if k = '' then continue; end if;
    ts := coalesce(nullif(it->>'at', '')::timestamptz, now()); if ts > now() + interval '5 minutes' then ts := now(); end if;
    src := coalesce(it->>'source', 'notif'); if src not in ('notif','screen','share') then src := 'notif'; end if;
    select * into v from viber_threads where business_id = d.business_id and owner_user_id = d.user_id and chat_key = k;
    if v.id is not null and v.status = 'ignored' then out := out || jsonb_build_object('dkey', it->>'dkey', 'skipped', 'ignored'); continue; end if;
    if v.id is null then
      insert into viber_threads(business_id, owner_user_id, owner_name, device_id, chat_key, title, is_group)
        values (d.business_id, d.user_id, d.user_name, d.id, k, left(coalesce(nullif(it->>'title', ''), 'Viber chat'), 120), coalesce((it->>'group')::boolean, false))
        returning * into v;
    elsif coalesce(it->>'title', '') <> '' and it->>'title' <> v.title then
      update viber_threads set title = left(it->>'title', 120) where id = v.id;
    end if;
    mid := null;
    if coalesce((it->>'fill')::boolean, false) then
      -- a photo or file shared into Nifti from Viber fills the newest one that didn't come through
      select id into mid from viber_messages where thread_id = v.id and dir = 'in' and media_status in ('missing','waiting')
        and kind = coalesce(it->>'kind', 'photo') and at > now() - interval '7 days' order by at desc limit 1;
      if mid is not null then update viber_messages set media_status = 'waiting' where id = mid; out := out || jsonb_build_object('dkey', it->>'dkey', 'id', mid, 'thread', v.id, 'filled', true); continue; end if;
    end if;
    -- the same message seen twice (once from the notification, once from the open chat) is kept once
    if coalesce(it->>'body', '') <> '' and exists(select 1 from viber_messages m where m.thread_id = v.id and m.dir = coalesce(it->>'dir', 'in') and m.body = it->>'body'
         and m.source <> src and abs(extract(epoch from (m.at - ts))) < 180) then
      out := out || jsonb_build_object('dkey', it->>'dkey', 'skipped', 'dupe'); continue; end if;
    insert into viber_messages(thread_id, business_id, dir, sender, body, kind, media_status, source, status, dkey, at)
      values (v.id, d.business_id, case when it->>'dir' = 'out' then 'out' else 'in' end, left(it->>'sender', 120), left(it->>'body', 4000),
        case when it->>'kind' in ('text','photo','video','file','voice','sticker','other') then it->>'kind' else 'text' end,
        case when it->>'media' in ('none','waiting','ok','missing') then it->>'media' else 'none' end,
        src, 'done', left(it->>'dkey', 120), ts)
      on conflict (thread_id, dkey) do nothing returning id into mid;
    if mid is null then out := out || jsonb_build_object('dkey', it->>'dkey', 'skipped', 'seen'); continue; end if;
    update viber_threads set last_text = left(coalesce(nullif(it->>'body', ''), initcap(coalesce(it->>'kind', 'message'))), 200), last_at = greatest(coalesce(last_at, ts), ts),
      unread = unread + case when it->>'dir' = 'out' then 0 else 1 end where id = v.id;
    out := out || jsonb_build_object('dkey', it->>'dkey', 'id', mid, 'thread', v.id);
  end loop;
  return out;
end $$;

create or replace function public.viber_dev_media(p_device uuid, p_secret text, p_msg uuid, p_status text) returns void
language plpgsql security definer set search_path = public as $$
declare d viber_devices := viber_dev_auth(p_device, p_secret);
begin
  if p_status not in ('missing','waiting') then raise exception 'bad status'; end if;
  update viber_messages m set media_status = p_status, ack = false from viber_threads v
   where m.id = p_msg and v.id = m.thread_id and v.business_id = d.business_id and v.owner_user_id = d.user_id and m.media_status <> 'ok';
end $$;

-- replies typed in Nifti that this phone should send from Viber
create or replace function public.viber_dev_outbox(p_device uuid, p_secret text) returns json
language plpgsql security definer set search_path = public as $$
declare d viber_devices := viber_dev_auth(p_device, p_secret); res json;
begin
  update viber_messages m set status = 'failed', fail_reason = 'Your phone didn''t confirm it was sent'
    from viber_threads v where v.id = m.thread_id and v.business_id = d.business_id and v.owner_user_id = d.user_id and m.status = 'sending' and m.claimed_at < now() - interval '3 minutes';
  with q as (
    update viber_messages m set status = 'sending', claimed_at = now()
      from viber_threads v where v.id = m.thread_id and v.business_id = d.business_id and v.owner_user_id = d.user_id and m.status = 'queued' and m.dir = 'out'
      returning m.id, m.body, v.chat_key, v.title, v.phone, m.at)
  select coalesce(json_agg(json_build_object('id', id, 'body', body, 'key', chat_key, 'title', title, 'phone', phone) order by at), '[]'::json) into res from q;
  return res;
end $$;

create or replace function public.viber_dev_mark(p_device uuid, p_secret text, p_msg uuid, p_ok boolean, p_reason text) returns void
language plpgsql security definer set search_path = public as $$
declare d viber_devices := viber_dev_auth(p_device, p_secret);
begin
  update viber_messages m set status = case when p_ok then 'sent' else 'failed' end, fail_reason = case when p_ok then null else left(p_reason, 300) end, ack = false
    from viber_threads v where m.id = p_msg and v.id = m.thread_id and v.business_id = d.business_id and v.owner_user_id = d.user_id and m.dir = 'out';
end $$;

-- used only by the viber-media edge function (service role)
create or replace function public.viber_dev_check(p_device uuid, p_secret text) returns json
language plpgsql stable security definer set search_path = public as $$
declare d viber_devices := viber_dev_auth(p_device, p_secret);
begin return json_build_object('business_id', d.business_id, 'user_id', d.user_id); end $$;

revoke all on function public.viber_can_see_thread(text), public.viber_me_name(uuid), public.viber_device_register(uuid, text, text, text, int), public.viber_device_revoke(uuid),
  public.viber_link(uuid, text, text, text), public.viber_read(uuid), public.viber_send(uuid, text, boolean), public.viber_retry(uuid, boolean), public.viber_ack(uuid),
  public.viber_web_add(uuid, text, text, text, text, text, text, text, text, text, int), public.viber_media_set(uuid, text, text, text, int),
  public.viber_dev_auth(uuid, text), public.viber_dev_heartbeat(uuid, text, jsonb, int), public.viber_dev_ingest(uuid, text, jsonb), public.viber_dev_media(uuid, text, uuid, text),
  public.viber_dev_outbox(uuid, text), public.viber_dev_mark(uuid, text, uuid, boolean, text), public.viber_dev_check(uuid, text) from public, anon, authenticated;
grant execute on function public.viber_can_see_thread(text), public.viber_device_register(uuid, text, text, text, int), public.viber_device_revoke(uuid),
  public.viber_link(uuid, text, text, text), public.viber_read(uuid), public.viber_send(uuid, text, boolean), public.viber_retry(uuid, boolean), public.viber_ack(uuid),
  public.viber_web_add(uuid, text, text, text, text, text, text, text, text, text, int), public.viber_media_set(uuid, text, text, text, int) to authenticated;
grant execute on function public.viber_dev_heartbeat(uuid, text, jsonb, int), public.viber_dev_ingest(uuid, text, jsonb), public.viber_dev_media(uuid, text, uuid, text),
  public.viber_dev_outbox(uuid, text), public.viber_dev_mark(uuid, text, uuid, boolean, text) to anon, authenticated;
grant execute on function public.viber_dev_check(uuid, text) to service_role;
