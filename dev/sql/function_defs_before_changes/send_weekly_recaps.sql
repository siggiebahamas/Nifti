CREATE OR REPLACE FUNCTION public.send_weekly_recaps()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare today date := (now() at time zone 'Asia/Manila')::date; f date; t date; b record; r jsonb; title text; body text; sent int := 0; bits text[];
begin
  f := date_trunc('week', today)::date - 7; t := f + 6;
  for b in select id, type from businesses where not is_outside and paused_at is null and banned_at is null loop
    r := public.weekly_recap_for(b.id, f, t);
    bits := array[]::text[];
    if b.type = 'supplier' then
      if (r->>'collected')::numeric >= 1 then bits := bits || (public.nifti_peso((r->>'collected')::numeric) || ' collected'
        || case when (r->>'collected_after_reminder')::numeric >= 1 then ' (' || public.nifti_peso((r->>'collected_after_reminder')::numeric) || ' after reminders)' else '' end); end if;
      if (r->>'orders')::int > 0 then bits := bits || ((r->>'orders') || ' order' || case when (r->>'orders')::int > 1 then 's' else '' end || ' (' || public.nifti_peso((r->>'orders_value')::numeric) || ')'); end if;
      if (r->>'reminders')::int > 0 then bits := bits || ((r->>'reminders') || ' reminder' || case when (r->>'reminders')::int > 1 then 's' else '' end || ' sent for you'); end if;
      if (r->>'deliveries_confirmed')::int > 0 then bits := bits || ((r->>'deliveries_confirmed') || ' deliver' || case when (r->>'deliveries_confirmed')::int > 1 then 'ies' else 'y' end || ' confirmed by the receiver'); end if;
      continue when coalesce(array_length(bits, 1), 0) = 0;
      title := 'Your week with Nifti: ' || case when (r->>'collected')::numeric >= 1 then public.nifti_peso((r->>'collected')::numeric) || ' collected' else (r->>'orders') || ' orders' end;
      if (r->>'owed_now')::numeric >= 1 then bits := bits || ('Still owed: ' || public.nifti_peso((r->>'owed_now')::numeric)); end if;
    else
      if (r->>'orders')::int > 0 then bits := bits || ((r->>'orders') || ' order' || case when (r->>'orders')::int > 1 then 's' else '' end || ' placed (' || public.nifti_peso((r->>'orders_value')::numeric) || ')'); end if;
      if (r->>'paid')::numeric >= 1 then bits := bits || (public.nifti_peso((r->>'paid')::numeric) || ' paid, all on record'); end if;
      if (r->>'deliveries')::int > 0 then bits := bits || ((r->>'deliveries') || ' deliver' || case when (r->>'deliveries')::int > 1 then 'ies' else 'y' end || ' received'); end if;
      if (r->>'late')::int > 0 then bits := bits || ((r->>'late') || ' late deliver' || case when (r->>'late')::int > 1 then 'ies' else 'y' end || ' flagged'); end if;
      if (r->>'overpay_alerts')::int > 0 then bits := bits || ((r->>'overpay_alerts') || ' overpayment alert' || case when (r->>'overpay_alerts')::int > 1 then 's' else '' end
        || case when (r->>'overpay_amount')::numeric >= 1 then ' (' || public.nifti_peso((r->>'overpay_amount')::numeric) || ')' else '' end); end if;
      continue when coalesce(array_length(bits, 1), 0) = 0;
      title := 'Your week with Nifti: ' || case when (r->>'orders')::int > 0 then (r->>'orders') || ' order' || case when (r->>'orders')::int > 1 then 's' else '' end else public.nifti_peso((r->>'paid')::numeric) || ' paid' end;
    end if;
    body := left(array_to_string(bits, ' · '), 236);
    perform public.nifti_notify(b.id, title, body, './#dashboard', 'weekly');
    sent := sent + 1;
  end loop;
  return sent;
end $function$


