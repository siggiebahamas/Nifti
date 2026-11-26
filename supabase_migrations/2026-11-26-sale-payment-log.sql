-- Round 80: a history of payments on a walk-in sale (utang), and only the owner can take a payment back.
-- Additive: one column with a default, one new trigger. Existing triggers are unchanged.
alter table public.downstream_sales add column if not exists payment_log jsonb not null default '[]'::jsonb;

create or replace function public.downstream_sales_payment_guard()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if jsonb_array_length(coalesce(new.payments, '[]'::jsonb)) < jsonb_array_length(coalesce(old.payments, '[]'::jsonb)) then
    if not public.nifti_books_viewer(old.business_id) then
      raise exception 'Only the owner can undo a payment.';
    end if;
    insert into audit_log(business_id, action, entity_type, entity_id, field, old_value, new_value, actor)
      values (old.business_id, 'sale_payment_undone', 'sale', old.id::text, 'payments', old.payments, new.payments, coalesce(public.nifti_member_name(old.business_id), 'someone'));
  end if;
  return new;
end $function$;

drop trigger if exists downstream_sales_payment_guard on public.downstream_sales;
create trigger downstream_sales_payment_guard before update on public.downstream_sales
  for each row execute function public.downstream_sales_payment_guard();
