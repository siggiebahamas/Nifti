CREATE OR REPLACE FUNCTION public.plan_features(p_plan text)
 RETURNS text[]
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  select case p_plan
    when 'supplier_pro' then array['statements','bir2307','store_insights','store_promos','auto_reminders','late_payers','full_history','credit_limits',
                                   'cheques','routes','price_blast','credit_memos','reorder_reminders','vat_books','reconcile']
    when 'buyer_pro'    then array['watchdog','market_price','price_alerts','bir2307','full_history','store_insights','store_promos',
                                   'cheques','spending_caps','scorecard','vat_books','credit_memos']
    when 'business'     then array['statements','bir2307','store_insights','store_promos','auto_reminders','late_payers','full_history','credit_limits',
                                   'watchdog','market_price','price_alerts','verified_badge','priority_support','featured_listing','setup_service',
                                   'cheques','routes','price_blast','credit_memos','reorder_reminders','vat_books','spending_caps','scorecard','reconcile']
    else array[]::text[] end $function$


