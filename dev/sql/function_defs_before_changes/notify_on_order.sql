CREATE OR REPLACE FUNCTION public.notify_on_order()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  buyer_name text; supplier_name text; actor text; target uuid;
  last_action text; msg text; url text := './#orders';
  old_status text := case when tg_op = 'UPDATE' then old.status else null end;
  old_hist int := case when tg_op = 'UPDATE' then jsonb_array_length(coalesce(old.history, '[]'::jsonb)) else 0 end;
  n_pending int; o_pending int; n_conf int; o_conf int; n_rej int; o_rej int;
begin
  select name into buyer_name from businesses where id = new.buyer_business_id;
  select name into supplier_name from businesses where id = new.supplier_business_id;
  -- a buyer business selling to its own customers through its shop: open the shop page, not Orders
  if exists (select 1 from businesses where id = new.supplier_business_id and type = 'buyer') then url := './#store'; end if;
  actor := coalesce(new.history->-1->>'actor', 'buyer');
  last_action := coalesce(new.history->-1->>'action', '');
  if last_action like '↩ Route stop undone%' then return new; end if; -- a driver fixing a wrong tap: nothing new for anyone
  if new.status is distinct from old_status and new.status <> 'draft' then
    target := case when actor = 'supplier' then new.buyer_business_id else new.supplier_business_id end;
    msg := case new.status
      when 'sent' then '📦 New order ' || new.po_number || ' from ' || buyer_name
      when 'confirmed' then case when actor = 'buyer' then '🎉 ' || buyer_name || ' confirmed ' || new.po_number else '✅ ' || supplier_name || ' confirmed ' || new.po_number end
      when 'quote' then '📝 ' || supplier_name || ' sent order ' || new.po_number || ' for your OK'
      when 'countered' then '💬 ' || case when actor = 'supplier' then supplier_name else buyer_name end || ' proposed a new price on ' || new.po_number
      when 'preparing' then '📦 ' || supplier_name || ' is preparing ' || new.po_number
      when 'shipped' then '🚚 ' || new.po_number || ' is on the way'
      when 'in_customs' then '🚢 ' || new.po_number || ' is at customs'
      when 'delivered' then '📬 ' || new.po_number || ' was delivered'
      when 'partially_delivered' then '⚠ ' || new.po_number || ' was partly delivered'
      when 'invoiced' then '🧾 ' || supplier_name || ' sent the invoice for ' || new.po_number
      when 'paid' then '💰 ' || new.po_number || ' is fully paid'
      when 'cancelled' then '✕ ' || new.po_number || ' was cancelled'
      else new.po_number || ' was updated' end;
    perform public.nifti_notify(target, msg, left(last_action, 200), url, 'orders', null, null);
    if new.status = 'shipped' and last_action like '🚚 Picked up by%' then
      perform public.nifti_notify(new.supplier_business_id, msg, left(last_action, 200), url, 'orders', null, null);
    end if;
    return new;
  end if;
  if tg_op = 'UPDATE' then
    n_pending := public.nifti_count_payments(new.invoice, new.deposit_payments, 'pending');
    o_pending := public.nifti_count_payments(old.invoice, old.deposit_payments, 'pending');
    n_conf := public.nifti_count_payments(new.invoice, new.deposit_payments, 'confirmed');
    o_conf := public.nifti_count_payments(old.invoice, old.deposit_payments, 'confirmed');
    n_rej := public.nifti_count_payments(new.invoice, new.deposit_payments, 'rejected');
    o_rej := public.nifti_count_payments(old.invoice, old.deposit_payments, 'rejected');
    if n_pending > o_pending and coalesce(new.invoice->'payments'->-1->>'submittedBy', '') = 'supplier' then
      null; -- the supplier's own staff recorded it (e.g. a cheque collected on a route)
    elsif n_pending > o_pending then
      perform public.nifti_notify(new.supplier_business_id, '💳 ' || buyer_name || ' says they paid for ' || new.po_number, 'Check your account, then confirm it in Nifti.', url, 'orders');
    elsif n_conf > o_conf then
      perform public.nifti_notify(new.buyer_business_id, '✅ ' || supplier_name || ' confirmed your payment', new.po_number, url, 'orders');
    elsif n_rej > o_rej then
      perform public.nifti_notify(new.buyer_business_id, '⚠ ' || supplier_name || ' says a payment didn''t arrive', new.po_number || ': ' || left(last_action, 160), url, 'orders');
    elsif jsonb_array_length(coalesce(new.history, '[]'::jsonb)) > old_hist then
      if last_action like '🕒 Not yet%' then
        perform public.nifti_notify(new.supplier_business_id, '🕒 ' || buyer_name || ' isn''t ready yet', left(last_action, 200), './#followups', 'orders');
      elsif last_action like '💬 Buyer note%' then
        perform public.nifti_notify(new.supplier_business_id, '💬 ' || buyer_name || ' about ' || new.po_number, left(last_action, 200), url, 'orders');
      elsif last_action like '👀%' or last_action like '💬 Note from%' then
        perform public.nifti_notify(new.buyer_business_id, case when last_action like '👀%' then supplier_name || ' opened ' || new.po_number else '💬 ' || supplier_name || ' about ' || new.po_number end, left(last_action, 200), url, 'orders');
      elsif last_action like '📦 Delivered by%' or last_action like '💬 Delivery note%' then
        perform public.nifti_notify(new.buyer_business_id, '📦 ' || new.po_number || ' delivery update', left(last_action, 200), url, 'orders');
        perform public.nifti_notify(new.supplier_business_id, '📦 ' || new.po_number || ' delivery update', left(last_action, 200), url, 'orders');
      end if;
    end if;
  end if;
  return new;
end $function$


