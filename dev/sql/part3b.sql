alter function public.menu_items_touch() set search_path = public;
revoke execute on function public.save_cash_count(date, text, jsonb, jsonb, text) from public, anon;
grant execute on function public.save_cash_count(date, text, jsonb, jsonb, text) to authenticated;
select has_function_privilege('anon', 'public.save_cash_count(date,text,jsonb,jsonb,text)', 'execute') anon_can, has_function_privilege('authenticated', 'public.save_cash_count(date,text,jsonb,jsonb,text)', 'execute') auth_can;
