CREATE OR REPLACE FUNCTION public.send_reorder_nudges()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare s record; r record; b businesses; conv uuid; link text; msg text; sent int := 0; ch text;
begin
  for s in select * from businesses where not is_outside and type = 'supplier' and paused_at is null and banned_at is null
             and coalesce((collection_settings->>'auto_reorder')::boolean, false) and public.has_feature(id, 'reorder_reminders') loop
    for r in select * from public.reorder_due(s.id) loop
      if exists (select 1 from customer_nudges where business_id = s.id and buyer_business_id = r.buyer_id
                 and (created_at > now() - interval '14 days' or (kind = 'snooze' and snooze_until >= current_date))) then continue; end if;
      select * into b from businesses where id = r.buyer_id;
      link := public.nifti_make_reorder_link(s.id, r.buyer_id);
      msg := 'Hi ' || coalesce(b.outside_contact->>'name', b.name) || '! Kumusta po? It''s been ' || r.days_since || ' days since your last order, so you might be running low. '
        || case when link is not null then 'Your usual order is ready here, just check it and tap Order: ' || link else 'Reply here and we''ll prepare your usual order today.' end
        || ' Salamat! – ' || s.name;
      ch := null;
      select id into conv from conversations where buyer_business_id = r.buyer_id and supplier_business_id = s.id;
      if not b.is_outside and conv is not null then
        insert into conversation_messages(conversation_id, sender_business_id, text) values (conv, s.id, msg);
        update conversations set buyer_unread_count = buyer_unread_count + 1 where id = conv;
        ch := 'chat';
      elsif nullif(b.outside_contact->>'email', '') is not null then
        insert into notification_outbox(business_id, category, title, body, url, to_email)
          values (s.id, 'customer_email', 'Time to restock? Your usual order from ' || s.name, msg, coalesce(link, './'), b.outside_contact->>'email');
        ch := 'email';
      end if;
      if ch is null then continue; end if; -- no automatic channel: it stays on the owner's Sell again list
      insert into customer_nudges(business_id, buyer_business_id, kind, channel, created_by) values (s.id, r.buyer_id, 'auto', ch, 'Automatic');
      sent := sent + 1;
    end loop;
  end loop;
  if sent > 0 then perform public.nifti_kick_dispatch(); end if;
  return sent;
end $function$


