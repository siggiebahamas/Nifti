-- Round 49: online store checkout, done on the server.
-- 1) set_store keeps (and cleans) the new store settings: checkout (how buyers pay + delivery fee by area), replies, hours.
--    Before this, set_store only kept a fixed list of fields, so these were silently dropped for real accounts.
-- 2) get_store and get_store_checkout give buyers the public part of checkout (only the payment methods that are switched on).
-- 3) submit_store_order_v2 works out the delivery fee itself (never trusts the browser), adds it as a line on the order,
--    and records how the buyer will pay.
-- Safe to run more than once.

create or replace function public.nifti_clean_checkout(c jsonb)
returns jsonb language plpgsql immutable set search_path = public as $$
declare m jsonb; fees jsonb := '[]'::jsonb; f jsonb; n int := 0; other text;
  num_re text := '^\s*\d{1,7}(\.\d{1,2})?\s*$';
begin
  if c is null or jsonb_typeof(c) <> 'object' then return null; end if;
  m := jsonb_build_object(
    'cod',   case when jsonb_typeof(c->'methods'->'cod') = 'boolean' then (c->'methods'->>'cod')::boolean else true end,
    'gcash', case when jsonb_typeof(c->'methods'->'gcash') = 'boolean' then (c->'methods'->>'gcash')::boolean else false end,
    'maya',  case when jsonb_typeof(c->'methods'->'maya') = 'boolean' then (c->'methods'->>'maya')::boolean else false end,
    'bank',  case when jsonb_typeof(c->'methods'->'bank') = 'boolean' then (c->'methods'->>'bank')::boolean else false end);
  if jsonb_typeof(c->'fees') = 'array' then
    for f in select value from jsonb_array_elements(c->'fees') loop
      exit when n >= 40;
      if jsonb_typeof(f) = 'object' and nullif(btrim(regexp_replace(coalesce(f->>'area',''), '[<>"`\[\]]', '', 'g')), '') is not null then
        fees := fees || jsonb_build_array(jsonb_build_object(
          'area', left(btrim(regexp_replace(f->>'area', '[<>"`\[\]]', '', 'g')), 60),
          'fee', case when coalesce(f->>'fee','') ~ num_re then least((f->>'fee')::numeric, 100000) else 0 end));
        n := n + 1;
      end if;
    end loop;
  end if;
  other := coalesce(c->>'other', 'ask'); if other not in ('ask','fee','no') then other := 'ask'; end if;
  return jsonb_strip_nulls(jsonb_build_object(
    'methods', m,
    'gcash', jsonb_strip_nulls(jsonb_build_object(
      'number', nullif(left(regexp_replace(coalesce(c->'gcash'->>'number',''), '[^0-9+ ]', '', 'g'), 20), ''),
      'name', nullif(left(btrim(regexp_replace(coalesce(c->'gcash'->>'name',''), '[<>"`]', '', 'g')), 60), ''),
      'qr', case when coalesce(c->'gcash'->>'qr','') ~ '^data:image/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$' and length(c->'gcash'->>'qr') <= 400000 then c->'gcash'->>'qr' end)),
    'maya', jsonb_strip_nulls(jsonb_build_object(
      'number', nullif(left(regexp_replace(coalesce(c->'maya'->>'number',''), '[^0-9+ ]', '', 'g'), 20), ''),
      'name', nullif(left(btrim(regexp_replace(coalesce(c->'maya'->>'name',''), '[<>"`]', '', 'g')), 60), ''))),
    'bank', jsonb_strip_nulls(jsonb_build_object(
      'bank', nullif(left(btrim(regexp_replace(coalesce(c->'bank'->>'bank',''), '[<>"`]', '', 'g')), 40), ''),
      'number', nullif(left(regexp_replace(coalesce(c->'bank'->>'number',''), '[^0-9 -]', '', 'g'), 30), ''),
      'name', nullif(left(btrim(regexp_replace(coalesce(c->'bank'->>'name',''), '[<>"`]', '', 'g')), 60), ''))),
    'fees', fees,
    'free_over', case when coalesce(c->>'free_over','') ~ num_re and (c->>'free_over')::numeric > 0 then (c->>'free_over')::numeric end,
    'other', other,
    'other_fee', case when other = 'fee' and coalesce(c->>'other_fee','') ~ num_re then least((c->>'other_fee')::numeric, 100000) end));
end $$;

create or replace function public.nifti_clean_replies(r jsonb)
returns jsonb language sql immutable set search_path = public as $$
  select case when r is null or jsonb_typeof(r) <> 'object' then null else jsonb_strip_nulls(jsonb_build_object(
    'lang', case when r->>'lang' in ('tl','en') then r->>'lang' else 'tl' end,
    'withItem', nullif(left(btrim(regexp_replace(coalesce(r->>'withItem',''), '[<>]', '', 'g')), 400), ''),
    'noItem', nullif(left(btrim(regexp_replace(coalesce(r->>'noItem',''), '[<>]', '', 'g')), 400), ''))) end
$$;

-- What a buyer may see: only the payment methods that are on.
create or replace function public.nifti_public_checkout(s jsonb)
returns jsonb language plpgsql immutable set search_path = public as $$
declare c jsonb := coalesce(s->'checkout', '{}'::jsonb); m jsonb;
begin
  m := coalesce(c->'methods', jsonb_build_object('cod', coalesce((s->>'cod')::boolean, true)));
  return jsonb_strip_nulls(jsonb_build_object(
    'methods', m,
    'gcash', case when (m->>'gcash')::boolean then c->'gcash' end,
    'maya',  case when (m->>'maya')::boolean then c->'maya' end,
    'bank',  case when (m->>'bank')::boolean then c->'bank' end,
    'fees', coalesce(c->'fees', '[]'::jsonb), 'free_over', c->'free_over',
    'other', coalesce(c->>'other', 'ask'), 'other_fee', c->'other_fee'));
end $$;

create or replace function public.set_store(p_store jsonb, p_slug text)
 returns jsonb language plpgsql security definer set search_path to 'public' as $function$
declare me uuid := public.nifti_my_business(); slug text := lower(btrim(coalesce(p_slug,''))); clean jsonb; promos jsonb := '{}'::jsonb; k text; v jsonb; mode text; co jsonb;
begin
  if me is null or not public.is_business_admin(me) then raise exception 'Only an Owner or General Manager can change your store.'; end if;
  if slug !~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$' then raise exception 'Your link name can use small letters, numbers and dashes (3–40 characters).'; end if;
  if slug in ('admin','nifti','app','api','store','shop','login','join','www','help','support','pricing','about','s','o','g','st') then raise exception 'That link name is taken. Try another.'; end if;
  if exists (select 1 from businesses where store_slug = slug and id <> me) then raise exception 'That link name is taken. Try another.'; end if;
  mode := coalesce(p_store->>'price_mode', 'public');
  if mode not in ('public','signup','hidden') then mode := 'public'; end if;
  if public.has_feature(me, 'store_promos') and jsonb_typeof(p_store->'promos') = 'object' then
    for k, v in select * from jsonb_each(p_store->'promos') loop
      if (v->>'price')::numeric > 0 and public.nifti_iso_date(v->>'until') >= (now() at time zone 'Asia/Manila')::date then
        promos := promos || jsonb_build_object(left(k, 120), jsonb_build_object('price', round((v->>'price')::numeric, 2), 'until', public.nifti_iso_date(v->>'until')));
      end if;
    end loop;
  end if;
  co := public.nifti_clean_checkout(p_store->'checkout');
  clean := jsonb_strip_nulls(jsonb_build_object(
    'enabled', coalesce((p_store->>'enabled')::boolean, false),
    'headline', nullif(left(btrim(regexp_replace(coalesce(p_store->>'headline',''), '[<>]', '', 'g')), 90), ''),
    'about', nullif(left(btrim(regexp_replace(coalesce(p_store->>'about',''), '[<>]', '', 'g')), 500), ''),
    'delivery_areas', nullif(left(btrim(regexp_replace(coalesce(p_store->>'delivery_areas',''), '[<>]', '', 'g')), 200), ''),
    'delivery_days', nullif(left(btrim(regexp_replace(coalesce(p_store->>'delivery_days',''), '[<>]', '', 'g')), 100), ''),
    'lead_time', nullif(left(btrim(regexp_replace(coalesce(p_store->>'lead_time',''), '[<>]', '', 'g')), 60), ''),
    'hours', nullif(left(btrim(regexp_replace(coalesce(p_store->>'hours',''), '[<>]', '', 'g')), 60), ''),
    'min_order', case when (p_store->>'min_order')::numeric > 0 then round((p_store->>'min_order')::numeric) end,
    'price_mode', mode,
    'cod', case when co is not null then (co->'methods'->>'cod')::boolean else coalesce((p_store->>'cod')::boolean, false) end,
    'show_phone', coalesce((p_store->>'show_phone')::boolean, true),
    'featured', (select jsonb_agg(x) from (select left(value, 120) x from jsonb_array_elements_text(case when jsonb_typeof(p_store->'featured') = 'array' then p_store->'featured' else '[]'::jsonb end) limit 6) f),
    'promos', case when promos = '{}'::jsonb then null else promos end,
    'checkout', co,
    'replies', public.nifti_clean_replies(p_store->'replies')));
  update businesses set store = clean, store_slug = slug where id = me;
  return clean;
end $function$;

create or replace function public.get_store(p_slug text, p_src text default null::text)
 returns jsonb language plpgsql security definer set search_path to 'public' as $function$
declare b businesses; show_prices boolean; today date := (now() at time zone 'Asia/Manila')::date; promos jsonb; is_owner boolean := false; orders90 int;
begin
  select * into b from businesses where store_slug = lower(btrim(coalesce(p_slug,'')));
  if b.id is null or b.is_outside or not public.nifti_listable(b.id) or coalesce((b.store->>'enabled')::boolean, false) = false or b.paused_at is not null then return null; end if;
  if auth.uid() is not null then is_owner := exists (select 1 from team_members where auth_user_id = auth.uid() and business_id = b.id); end if;
  show_prices := case coalesce(b.store->>'price_mode','public') when 'public' then true when 'signup' then auth.uid() is not null else false end;
  promos := case when public.has_feature(b.id, 'store_promos') then coalesce(b.store->'promos', '{}'::jsonb) else '{}'::jsonb end;
  if not is_owner then
    insert into store_events(business_id, kind, src) values (b.id, 'view', left(regexp_replace(coalesce(p_src,''), '[^a-zA-Z0-9_-]', '', 'g'), 20));
  end if;
  select count(*) into orders90 from store_events where business_id = b.id and kind = 'order' and created_at > now() - interval '90 days';
  return jsonb_build_object(
    'id', b.id, 'slug', b.store_slug, 'name', b.name, 'type', b.type, 'is_owner', is_owner,
    'headline', b.store->>'headline', 'about', b.store->>'about', 'category', b.public_profile->>'category', 'location', b.public_profile->>'location',
    'delivery_areas', b.store->>'delivery_areas', 'delivery_days', b.store->>'delivery_days', 'lead_time', b.store->>'lead_time', 'hours', b.store->>'hours',
    'min_order', (b.store->>'min_order')::numeric, 'price_mode', coalesce(b.store->>'price_mode','public'), 'show_prices', show_prices,
    'cod', coalesce((b.store->>'cod')::boolean, false),
    'checkout', public.nifti_public_checkout(b.store),
    'phone', case when coalesce((b.store->>'show_phone')::boolean, true) then b.shared_contact->>'phone' end,
    'contact_name', b.shared_contact->>'name',
    'pay_methods', (select coalesce(jsonb_agg(distinct coalesce(case when a->>'type' = 'bank' then a->>'bankName' end, a->>'type')), '[]'::jsonb) from jsonb_array_elements(coalesce(b.payment_methods,'[]'::jsonb)) a),
    'verified', public.business_is_verified(b.id), 'featured_seller', public.business_plan(b.id) = 'business',
    'since', to_char(b.created_at, 'YYYY'),
    'orders_band', case when orders90 >= 50 then '50+' when orders90 >= 20 then '20+' when orders90 >= 5 then '5+' end,
    'featured', coalesce(b.store->'featured', '[]'::jsonb),
    'items', (select coalesce(jsonb_agg(jsonb_build_object(
        'product', c->>'product', 'unit', c->>'unit', 'moq', c->'moq',
        'price', case when show_prices then (c->>'price')::numeric end,
        'promo_price', case when show_prices and (promos->(c->>'product')->>'until')::date >= today then (promos->(c->>'product')->>'price')::numeric end,
        'promo_until', case when show_prices and (promos->(c->>'product')->>'until')::date >= today then promos->(c->>'product')->>'until' end)
        order by c->>'product'), '[]'::jsonb) from jsonb_array_elements(coalesce(b.catalog,'[]'::jsonb)) c)
  );
end $function$;

-- Lets the store page know the server works out fees (the page then sends the area and payment choice as fields).
create or replace function public.get_store_checkout(p_slug text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare s jsonb;
begin
  select store into s from businesses where store_slug = lower(btrim(coalesce(p_slug, ''))) and not is_outside
    and coalesce((store->>'enabled')::boolean, false) and paused_at is null;
  if s is null then return null; end if;
  return public.nifti_public_checkout(s);
end $$;

create or replace function public.submit_store_order_v2(p_slug text, p_name text, p_business text, p_phone text, p_address text, p_items jsonb,
  p_note text default null, p_src text default null, p_needed_by date default null, p_ref text default null,
  p_area text default null, p_pay text default null, p_pay_ref text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare s jsonb; c jsonb; m jsonb; fee numeric; known boolean := false;
  area text := left(btrim(regexp_replace(coalesce(p_area, ''), '[<>"`\[\]]', '', 'g')), 60);
  pay text := left(btrim(regexp_replace(coalesce(p_pay, ''), '[<>"`\[\]]', '', 'g')), 40);
  pref text := left(btrim(regexp_replace(coalesce(p_pay_ref, ''), '[^A-Za-z0-9 -]', '', 'g')), 40);
  res jsonb; poid uuid; tag text := ''; items_total numeric;
begin
  select store into s from businesses where store_slug = lower(btrim(coalesce(p_slug, '')));
  c := coalesce(s->'checkout', '{}'::jsonb); m := coalesce(c->'methods', '{}'::jsonb);
  -- only a payment method the store has switched on
  if pay <> '' and not (
       (pay = 'Cash on delivery' and coalesce((m->>'cod')::boolean, coalesce((s->>'cod')::boolean, false)))
    or (pay = 'GCash' and coalesce((m->>'gcash')::boolean, false))
    or (pay = 'Maya' and coalesce((m->>'maya')::boolean, false))
    or (pay like 'Bank transfer%' and coalesce((m->>'bank')::boolean, false))) then
    pay := ''; pref := '';
  end if;
  if area <> '' then
    select (f->>'fee')::numeric, true into fee, known from jsonb_array_elements(coalesce(c->'fees', '[]'::jsonb)) f where f->>'area' = area limit 1;
    if not coalesce(known, false) then
      if c->>'other' = 'no' and jsonb_array_length(coalesce(c->'fees', '[]'::jsonb)) > 0 then raise exception 'This store doesn''t deliver to that area yet. Please message them.'; end if;
      area := case when area = 'Other area' then 'Other area' else area end;
      if c->>'other' = 'fee' then fee := (c->>'other_fee')::numeric; end if;
    end if;
  end if;
  if pay <> '' then tag := '[Pay: ' || pay || case when pref <> '' then ' · ref ' || pref else '' end || '] '; end if;
  res := public.submit_store_order(p_slug, p_name, p_business, p_phone, p_address, p_items, null, p_src, p_needed_by, p_ref);
  items_total := coalesce((res->>'total')::numeric, 0);
  if fee is not null and coalesce(c->>'free_over','') <> '' and coalesce((res->>'prices_known')::boolean, false) and items_total >= (c->>'free_over')::numeric then fee := 0; end if;
  if area <> '' then tag := tag || '[Delivery: ' || area || case when fee is null then ' · fee to follow' when fee = 0 then ' ₱0' else ' ₱' || rtrim(to_char(fee, 'FM9999990.99'), '.') end || '] '; end if;
  select po_id into poid from order_links where token = res->>'token';
  if poid is not null then
    update purchase_orders set
      notes = nullif(left(tag || coalesce(nullif(left(btrim(regexp_replace(coalesce(p_note,''), '[<>"`]', '', 'g')), 400), ''), ''), 500), ''),
      line_items = case when fee is not null and fee > 0
        then coalesce(line_items, '[]'::jsonb) || jsonb_build_array(jsonb_build_object('product', 'Delivery fee', 'qty', 1, 'unitPrice', fee, 'unit', 'trip', 'note', area))
        else line_items end
    where id = poid;
  end if;
  return res || jsonb_build_object('delivery_fee', fee, 'grand_total', items_total + coalesce(fee, 0));
end $$;

revoke all on function public.submit_store_order_v2(text, text, text, text, text, jsonb, text, text, date, text, text, text, text) from public;
grant execute on function public.submit_store_order_v2(text, text, text, text, text, jsonb, text, text, date, text, text, text, text) to anon, authenticated;
revoke all on function public.get_store_checkout(text) from public;
grant execute on function public.get_store_checkout(text) to anon, authenticated;
