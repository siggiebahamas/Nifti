CREATE OR REPLACE FUNCTION public.send_daily_summaries()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  b record; s jsonb; f jsonb; parts text[]; lines text[]; sent int := 0; today date := (now() at time zone 'Asia/Manila')::date; inserted int;
begin
  for b in
    select biz.id from businesses biz
    left join notification_settings ns on ns.business_id = biz.id
    where not biz.is_outside and biz.paused_at is null and coalesce(ns.daily_summary, true)
      and exists (select 1 from team_members t where t.business_id = biz.id and t.auth_user_id is not null and t.status = 'active')
  loop
    s := public.daily_summary_for(b.id);
    parts := array[]::text[]; lines := array[]::text[];
    if (s->>'to_confirm')::int > 0 then parts := parts || ((s->>'to_confirm') || ' to confirm'); lines := lines || ('📦 ' || (s->>'to_confirm') || ' new order' || case when (s->>'to_confirm')::int > 1 then 's' else '' end || ' waiting for you to confirm'); end if;
    if (s->>'to_deliver')::int > 0 then parts := parts || ((s->>'to_deliver') || ' to deliver'); lines := lines || ('🚚 ' || (s->>'to_deliver') || ' order' || case when (s->>'to_deliver')::int > 1 then 's' else '' end || ' due out today or late'); end if;
    if (s->>'payments_to_check')::int > 0 then parts := parts || ((s->>'payments_to_check') || ' payment' || case when (s->>'payments_to_check')::int > 1 then 's' else '' end || ' to check'); lines := lines || ('💳 ' || (s->>'payments_to_check') || ' payment' || case when (s->>'payments_to_check')::int > 1 then 's' else '' end || ' to check in your account'); end if;
    if (s->>'owed_to_you')::numeric >= 1 then parts := parts || (public.nifti_peso((s->>'owed_to_you')::numeric) || ' owed to you'); lines := lines || ('💰 ' || public.nifti_peso((s->>'owed_to_you')::numeric) || ' owed to you' || case when (s->>'owed_to_you_overdue')::numeric >= 1 then ' (' || public.nifti_peso((s->>'owed_to_you_overdue')::numeric) || ' overdue)' else '' end); end if;
    if (s->>'arriving')::int > 0 then parts := parts || ((s->>'arriving') || ' arriving'); lines := lines || ('📬 ' || (s->>'arriving') || ' deliver' || case when (s->>'arriving')::int > 1 then 'ies' else 'y' end || ' on the way or due today'); end if;
    if (s->>'price_changes')::int > 0 then parts := parts || ((s->>'price_changes') || ' price change' || case when (s->>'price_changes')::int > 1 then 's' else '' end); lines := lines || ('💬 ' || (s->>'price_changes') || ' price change' || case when (s->>'price_changes')::int > 1 then 's' else '' end || ' to review'); end if;
    if (s->>'bills_due')::numeric >= 1 then parts := parts || (public.nifti_peso((s->>'bills_due')::numeric) || ' to pay'); lines := lines || ('🧾 ' || public.nifti_peso((s->>'bills_due')::numeric) || ' in bills due within 3 days or overdue'); end if;
    if (s->>'payments_rejected')::int > 0 then lines := lines || ('⚠ ' || (s->>'payments_rejected') || ' payment' || case when (s->>'payments_rejected')::int > 1 then 's' else '' end || ' a supplier says didn''t arrive'); end if;
    if (s->>'unread_messages')::int > 0 then lines := lines || ('✉️ ' || (s->>'unread_messages') || ' unread message' || case when (s->>'unread_messages')::int > 1 then 's' else '' end); end if;
    if public.has_feature(b.id, 'bir2307') then
      f := public.forms_2307_pending(b.id);
      if (f->>'to_send')::int > 0 then lines := lines || ('📄 ' || (f->>'to_send') || ' BIR 2307 certificate' || case when (f->>'to_send')::int > 1 then 's' else '' end || ' to send to suppliers'); end if;
      if (f->>'missing')::int > 0 then lines := lines || ('📄 ' || (f->>'missing') || ' BIR 2307 certificate' || case when (f->>'missing')::int > 1 then 's' else '' end || ' buyers still owe you (' || public.nifti_peso((f->>'missing_tax')::numeric) || ' in tax credits)'); end if;
    end if;
    lines := lines || public.pro_summary_lines(b.id);
    if array_length(lines, 1) is null then continue; end if;
    insert into daily_summary_log(business_id, day) values (b.id, today) on conflict do nothing;
    get diagnostics inserted = row_count;
    if inserted = 0 then continue; end if;
    insert into notification_outbox(business_id, title, body, url, category)
      values (b.id, left('☀️ Today: ' || coalesce(array_to_string(parts[1:3], ' · '), 'a few things need you'), 120), left(array_to_string(lines, E'\n'), 1000), './#dashboard', 'summary');
    sent := sent + 1;
  end loop;
  if sent > 0 then perform public.nifti_kick_dispatch(); end if;
  return sent;
end $function$


CREATE OR REPLACE FUNCTION public.send_daily_summaries()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  b record; s jsonb; f jsonb; parts text[]; lines text[]; sent int := 0; today date := (now() at time zone 'Asia/Manila')::date; inserted int;
begin
  for b in
    select biz.id from businesses biz
    left join notification_settings ns on ns.business_id = biz.id
    where not biz.is_outside and biz.paused_at is null and coalesce(ns.daily_summary, true)
      and exists (select 1 from team_members t where t.business_id = biz.id and t.auth_user_id is not null and t.status = 'active')
  loop
    s := public.daily_summary_for(b.id);
    parts := array[]::text[]; lines := array[]::text[];
    if (s->>'to_confirm')::int > 0 then parts := parts || ((s->>'to_confirm') || ' to confirm'); lines := lines || ('📦 ' || (s->>'to_confirm') || ' new order' || case when (s->>'to_confirm')::int > 1 then 's' else '' end || ' waiting for you to confirm'); end if;
    if (s->>'to_deliver')::int > 0 then parts := parts || ((s->>'to_deliver') || ' to deliver'); lines := lines || ('🚚 ' || (s->>'to_deliver') || ' order' || case when (s->>'to_deliver')::int > 1 then 's' else '' end || ' due out today or late'); end if;
    if (s->>'payments_to_check')::int > 0 then parts := parts || ((s->>'payments_to_check') || ' payment' || case when (s->>'payments_to_check')::int > 1 then 's' else '' end || ' to check'); lines := lines || ('💳 ' || (s->>'payments_to_check') || ' payment' || case when (s->>'payments_to_check')::int > 1 then 's' else '' end || ' to check in your account'); end if;
    if (s->>'owed_to_you')::numeric >= 1 then parts := parts || (public.nifti_peso((s->>'owed_to_you')::numeric) || ' owed to you'); lines := lines || ('💰 ' || public.nifti_peso((s->>'owed_to_you')::numeric) || ' owed to you' || case when (s->>'owed_to_you_overdue')::numeric >= 1 then ' (' || public.nifti_peso((s->>'owed_to_you_overdue')::numeric) || ' overdue)' else '' end); end if;
    if (s->>'arriving')::int > 0 then parts := parts || ((s->>'arriving') || ' arriving'); lines := lines || ('📬 ' || (s->>'arriving') || ' deliver' || case when (s->>'arriving')::int > 1 then 'ies' else 'y' end || ' on the way or due today'); end if;
    if (s->>'price_changes')::int > 0 then parts := parts || ((s->>'price_changes') || ' price change' || case when (s->>'price_changes')::int > 1 then 's' else '' end); lines := lines || ('💬 ' || (s->>'price_changes') || ' price change' || case when (s->>'price_changes')::int > 1 then 's' else '' end || ' to review'); end if;
    if (s->>'bills_due')::numeric >= 1 then parts := parts || (public.nifti_peso((s->>'bills_due')::numeric) || ' to pay'); lines := lines || ('🧾 ' || public.nifti_peso((s->>'bills_due')::numeric) || ' in bills due within 3 days or overdue'); end if;
    if (s->>'payments_rejected')::int > 0 then lines := lines || ('⚠ ' || (s->>'payments_rejected') || ' payment' || case when (s->>'payments_rejected')::int > 1 then 's' else '' end || ' a supplier says didn''t arrive'); end if;
    if (s->>'unread_messages')::int > 0 then lines := lines || ('✉️ ' || (s->>'unread_messages') || ' unread message' || case when (s->>'unread_messages')::int > 1 then 's' else '' end); end if;
    if public.has_feature(b.id, 'bir2307') then
      f := public.forms_2307_pending(b.id);
      if (f->>'to_send')::int > 0 then lines := lines || ('📄 ' || (f->>'to_send') || ' BIR 2307 certificate' || case when (f->>'to_send')::int > 1 then 's' else '' end || ' to send to suppliers'); end if;
      if (f->>'missing')::int > 0 then lines := lines || ('📄 ' || (f->>'missing') || ' BIR 2307 certificate' || case when (f->>'missing')::int > 1 then 's' else '' end || ' buyers still owe you (' || public.nifti_peso((f->>'missing_tax')::numeric) || ' in tax credits)'); end if;
    end if;
    lines := lines || public.pro_summary_lines(b.id);
    if array_length(lines, 1) is null then continue; end if;
    insert into daily_summary_log(business_id, day) values (b.id, today) on conflict do nothing;
    get diagnostics inserted = row_count;
    if inserted = 0 then continue; end if;
    insert into notification_outbox(business_id, title, body, url, category)
      values (b.id, left('☀️ Today: ' || coalesce(array_to_string(parts[1:3], ' · '), 'a few things need you'), 120), left(array_to_string(lines, E'\n'), 1000), './#dashboard', 'summary');
    sent := sent + 1;
  end loop;
  if sent > 0 then perform public.nifti_kick_dispatch(); end if;
  return sent;
end $function$


