CREATE OR REPLACE FUNCTION public.admin_funnel_data()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with b as (select * from businesses where not is_outside),
  t as (select (now() at time zone 'Asia/Manila')::date d)
  select jsonb_build_object(
    'businesses', (select count(*) from b),
    'buyers', (select count(*) from b where type = 'buyer'), 'suppliers', (select count(*) from b where type = 'supplier'),
    'new_7d', (select count(*) from b where created_at > now() - interval '7 days'),
    'active_7d', (select count(distinct x) from (select buyer_business_id x from purchase_orders where created_at > now() - interval '7 days' and status <> 'draft' union select supplier_business_id from purchase_orders where created_at > now() - interval '7 days' and status <> 'draft') q where x in (select id from b)),
    'orders_7d', (select count(*) from purchase_orders where created_at > now() - interval '7 days' and status <> 'draft'),
    'outside_partners', (select count(*) from businesses where is_outside),
    'claimed_from_links', (select count(*) from b where created_by_business is not null),
    'stores_open', (select count(*) from b where store_slug is not null and coalesce((store->>'enabled')::boolean, false)),
    'store_views_7d', (select count(*) from store_events where kind = 'view' and created_at > now() - interval '7 days'),
    'store_orders_7d', (select count(*) from store_events where kind = 'order' and created_at > now() - interval '7 days'),
    'pro_paying', (select count(*) from subscriptions where plan_id in ('supplier_pro','buyer_pro','business') and (paid_until is null or paid_until >= (select d from t))),
    'upgrade_pending', (select count(*) from upgrade_requests where status = 'pending'),
    'stuck', (select coalesce(jsonb_agg(x order by x->>'created_at' desc), '[]'::jsonb) from (
       select jsonb_build_object('business', b.name, 'type', b.type, 'stage', public.setup_stage(b.id),
         'days', (select d from t) - (b.created_at at time zone 'Asia/Manila')::date, 'created_at', b.created_at,
         'owner', (select name from team_members m where m.business_id = b.id and m.roles && array['Owner'] limit 1),
         'email', (select email from team_members m where m.business_id = b.id and m.roles && array['Owner'] limit 1),
         'phone', b.shared_contact->>'phone') x
       from b where public.setup_stage(b.id) <> 'active' order by b.created_at desc limit 40) s),
    'leads', (select jsonb_build_object('new', count(*) filter (where status = 'new'), 'contacted', count(*) filter (where status = 'contacted'), 'interested', count(*) filter (where status = 'interested'), 'onboarded', count(*) filter (where status = 'onboarded')) from growth_leads)
  )
$function$


