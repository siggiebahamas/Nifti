-- Round 75: announce price changes to the buyers you choose (all, top buyers, or picked).
-- Additive only: two nullable columns on price_changes and a 4-argument overload of announce_price_changes.
-- The existing 3-argument function is unchanged, so older app versions keep working.

alter table public.price_changes add column if not exists audience text;
alter table public.price_changes add column if not exists sent_buyer_ids uuid[];

create or replace function public.announce_price_changes(p_changes jsonb, p_effective date, p_note text, p_buyers uuid[])
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare me uuid := public.nifti_my_business(); who text; c jsonb; oldp numeric; unitv text; msg text := ''; n int := 0; buyers int := 0; rr record; cid uuid;
  eff date := coalesce(p_effective, public.nifti_today()); sent_today int; told uuid[] := '{}';
begin
  if me is null or not public.is_business_admin(me) then raise exception 'Only an Owner or General Manager can announce price changes.'; end if;
  if (select type from businesses where id = me) <> 'supplier' then raise exception 'This is for suppliers.'; end if;
  if not public.has_feature(me, 'price_blast') then raise exception 'Price-change announcements are part of Supplier Pro.'; end if;
  if eff < public.nifti_today() then raise exception 'The date can''t be in the past.'; end if;
  if jsonb_typeof(p_changes) <> 'array' or jsonb_array_length(p_changes) = 0 or jsonb_array_length(p_changes) > 100 then raise exception 'Pick the products that change.'; end if;
  if p_buyers is not null and coalesce(array_length(p_buyers, 1), 0) = 0 then raise exception 'Pick at least one buyer.'; end if;
  if p_buyers is not null and array_length(p_buyers, 1) > 500 then raise exception 'Pick up to 500 buyers.'; end if;
  select count(distinct created_at) into sent_today from price_changes where business_id = me and created_at > now() - interval '1 day';
  if sent_today >= 5 then raise exception 'You''ve sent 5 price announcements today. Try again tomorrow.'; end if;
  select name into who from team_members where auth_user_id = auth.uid() and business_id = me limit 1;
  for c in select value from jsonb_array_elements(p_changes) loop
    if coalesce(c->>'product','') = '' or coalesce(nullif(c->>'new_price','')::numeric, -1) < 0 then continue; end if;
    select (x->>'price')::numeric, x->>'unit' into oldp, unitv from businesses b, jsonb_array_elements(coalesce(b.catalog,'[]'::jsonb)) x
      where b.id = me and public.nifti_norm(x->>'product') = public.nifti_norm(c->>'product') limit 1;
    insert into price_changes(business_id, product, unit, old_price, new_price, effective_date, note, created_by_name)
      values (me, left(c->>'product', 200), coalesce(unitv, left(c->>'unit', 30)), oldp, (c->>'new_price')::numeric, eff, left(p_note, 300), who);
    msg := msg || E'\n• ' || (c->>'product') || ': ' || coalesce(public.nifti_peso(oldp) || ' → ', '') || public.nifti_peso((c->>'new_price')::numeric) || coalesce('/' || unitv, '')
           || case when oldp is not null and (c->>'new_price')::numeric > oldp then ' ▲' when oldp is not null and (c->>'new_price')::numeric < oldp then ' ▼' else '' end;
    n := n + 1;
  end loop;
  if n = 0 then raise exception 'Enter at least one new price.'; end if;
  msg := '📢 Price update from ' || (select name from businesses where id = me) || ', effective ' || case when eff = public.nifti_today() then 'today' else to_char(eff, 'Mon DD') end || ':' || msg
         || coalesce(E'\n\n' || nullif(btrim(p_note), ''), '') || case when eff > public.nifti_today() then E'\n\nOrders sent before then keep the old price.' else '' end;
  -- only buyers this business really sells to; when p_buyers is given, only those
  for rr in select distinct br.buyer_business_id bid from business_relationships br join businesses b on b.id = br.buyer_business_id
            where br.supplier_business_id = me and not b.is_outside and b.paused_at is null
              and (p_buyers is null or br.buyer_business_id = any(p_buyers)) loop
    select id into cid from conversations where buyer_business_id = rr.bid and supplier_business_id = me limit 1;
    if cid is null then insert into conversations(buyer_business_id, supplier_business_id) values (rr.bid, me) returning id into cid; end if;
    insert into conversation_messages(conversation_id, sender_business_id, text) values (cid, me, left(msg, 3000));
    update conversations set buyer_unread_count = coalesce(buyer_unread_count, 0) + 1 where id = cid;
    buyers := buyers + 1; told := told || rr.bid;
  end loop;
  update price_changes set sent_to = buyers, audience = case when p_buyers is null then 'all' else 'picked' end, sent_buyer_ids = told
    where business_id = me and created_at = now();
  if eff <= public.nifti_today() then perform public.nifti_apply_price_changes(me); end if;
  return jsonb_build_object('changes', n, 'buyers', buyers, 'effective', eff);
end $function$;

revoke all on function public.announce_price_changes(jsonb, date, text, uuid[]) from public, anon;
grant execute on function public.announce_price_changes(jsonb, date, text, uuid[]) to authenticated;
