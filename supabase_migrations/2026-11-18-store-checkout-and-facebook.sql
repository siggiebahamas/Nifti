-- Round 48: store checkout (delivery fee by barangay, how buyers pay) and Facebook Page posting + comment replies.
-- Safe to run more than once. Nothing here changes existing functions; it adds new ones next to them.

-- 1) What buyers need at checkout, and nothing else from the store settings.
create or replace function public.get_store_checkout(p_slug text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare s jsonb; c jsonb;
begin
  select store into s from businesses where store_slug = lower(btrim(coalesce(p_slug, ''))) and coalesce((store->>'enabled')::boolean, false) and paused_at is null;
  if s is null then return null; end if;
  c := coalesce(s->'checkout', '{}'::jsonb);
  return jsonb_strip_nulls(jsonb_build_object(
    'methods', coalesce(c->'methods', jsonb_build_object('cod', coalesce((s->>'cod')::boolean, true))),
    'gcash', case when (c->'methods'->>'gcash')::boolean then jsonb_build_object('number', c->'gcash'->>'number', 'name', c->'gcash'->>'name', 'qr', c->'gcash'->>'qr') end,
    'maya',  case when (c->'methods'->>'maya')::boolean then jsonb_build_object('number', c->'maya'->>'number', 'name', c->'maya'->>'name') end,
    'bank',  case when (c->'methods'->>'bank')::boolean then jsonb_build_object('bank', c->'bank'->>'bank', 'number', c->'bank'->>'number', 'name', c->'bank'->>'name') end,
    'fees', coalesce(c->'fees', '[]'::jsonb), 'free_over', c->'free_over', 'other', coalesce(c->>'other', 'ask'), 'other_fee', c->'other_fee'));
end $$;
grant execute on function public.get_store_checkout(text) to anon, authenticated;

-- 2) The same order as before, plus the delivery fee (worked out here, not trusted from the browser) and how they'll pay.
create or replace function public.submit_store_order_v2(p_slug text, p_name text, p_business text, p_phone text, p_address text, p_items jsonb,
  p_note text default null, p_src text default null, p_needed_by date default null, p_ref text default null,
  p_area text default null, p_pay text default null, p_pay_ref text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare s jsonb; c jsonb; fee numeric; area text := left(btrim(regexp_replace(coalesce(p_area, ''), '[<>"`\[\]]', '', 'g')), 60);
  pay text := left(btrim(regexp_replace(coalesce(p_pay, ''), '[<>"`\[\]]', '', 'g')), 40); pref text := left(regexp_replace(coalesce(p_pay_ref, ''), '[^A-Za-z0-9 -]', '', 'g'), 40);
  res jsonb; poid uuid; tag text := ''; items_total numeric;
begin
  select store into s from businesses where store_slug = lower(btrim(coalesce(p_slug, '')));
  c := coalesce(s->'checkout', '{}'::jsonb);
  if area <> '' then
    select (f->>'fee')::numeric into fee from jsonb_array_elements(coalesce(c->'fees', '[]'::jsonb)) f where f->>'area' = area limit 1;
    if fee is null and area = 'Other area' then
      if c->>'other' = 'no' then raise exception 'This store doesn''t deliver to that area yet. Please message them.'; end if;
      if c->>'other' = 'fee' then fee := (c->>'other_fee')::numeric; end if;
    end if;
  end if;
  if pay <> '' then tag := '[Pay: ' || pay || case when pref <> '' then ' · ref ' || pref else '' end || '] '; end if;
  if area <> '' then tag := tag || '[Delivery: ' || area || case when fee is not null then ' ₱' || fee::text else '' end || '] '; end if;
  res := public.submit_store_order(p_slug, p_name, p_business, p_phone, p_address, p_items, left(tag || coalesce(p_note, ''), 500), p_src, p_needed_by, p_ref);
  select po_id into poid from order_links where token = res->>'token';
  items_total := coalesce((res->>'total')::numeric, 0);
  if fee is not null and c->>'free_over' is not null and items_total >= (c->>'free_over')::numeric then fee := 0; end if;
  if poid is not null and fee is not null and fee > 0 then
    update purchase_orders set line_items = coalesce(line_items, '[]'::jsonb) || jsonb_build_array(jsonb_build_object('product', 'Delivery fee', 'qty', 1, 'unitPrice', fee, 'unit', 'trip', 'note', area)) where id = poid;
  end if;
  return res || jsonb_build_object('delivery_fee', fee);
end $$;
grant execute on function public.submit_store_order_v2(text, text, text, text, text, jsonb, text, text, date, text, text, text, text) to anon, authenticated;

-- 3) Facebook Pages: the Page token stays on the server (only the fb-page and fb-webhook functions read it).
create table if not exists public.fb_pages (
  business_id uuid primary key references businesses(id) on delete cascade,
  page_id text not null unique, page_name text, page_url text,
  page_token text not null, connected_by uuid, connected_at timestamptz not null default now());
alter table public.fb_pages enable row level security; -- no policies: the browser can never read tokens
create table if not exists public.fb_reply_log (
  comment_id text primary key, business_id uuid references businesses(id) on delete cascade,
  reply_text text, created_at timestamptz not null default now());
alter table public.fb_reply_log enable row level security;
create policy fb_reply_log_owner_read on public.fb_reply_log for select using (
  business_id in (select tm.business_id from team_members tm where tm.auth_user_id = auth.uid() and tm.status = 'active'));
