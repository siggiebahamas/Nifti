CREATE OR REPLACE FUNCTION public.nudge_buyer_restock()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if new.status = 'delivered' and old.status is distinct from 'delivered'
     and exists (select 1 from businesses where id = new.buyer_business_id and type = 'buyer' and not is_outside)
     and not exists (select 1 from notification_outbox where business_id = new.buyer_business_id and title like '📣%' and created_at > now() - interval '20 hours') then
    perform public.nifti_notify(new.buyer_business_id, '📣 New stock in? Tell your customers',
      'Your post for ' || new.po_number || ' is ready. Open the order and tap "Tell your customers" to share it on FB or Viber.', './#orders', 'orders');
  end if;
  return new;
end $function$


