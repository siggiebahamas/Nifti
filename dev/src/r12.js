/* ===== Round 12 =====
   Stock: an order already on the way shows in the Status column ("200 on the way · arrives Aug 29")
   instead of a crowded "+200 inbound" line under the bar, and the action opens that order. */
function nfInboundInfo(name, qty){
  const open = ['sent', 'confirmed', 'preparing', 'shipped', 'in_customs'];
  let pos = [];
  try{ pos = purchaseOrders.filter(po => po.buyerId === ME_BUYER && open.includes(po.status) && (po.lineItems || []).some(l => resolveSkuId(l.product) === resolveSkuId(name))); }catch(e){}
  const when = po => (po.shipping && po.shipping.eta) || po.requestedDeliveryDate || '';
  pos.sort((a, b) => String(when(a) || '9999').localeCompare(String(when(b) || '9999')));
  const po = pos[0], d = po ? when(po) : '';
  const day = d ? new Date(String(d).slice(0, 10) + 'T00:00:00').toLocaleDateString('en-PH', {month: 'short', day: 'numeric'}) : '';
  const late = d && String(d).slice(0, 10) < APP_TODAY;
  const sub = po ? (po.status === 'shipped' || po.status === 'in_customs' ? (late ? 'late, was due ' + day : 'arrives ' + day) : po.status === 'sent' ? 'ordered, not confirmed yet' : 'confirmed' + (day ? ', due ' + day : '')) : '';
  return {
    pill: `<span class="nf-inb${late ? ' late' : ''}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M1 6h13v10H1zM14 10h4l3 3v3h-7z"/><circle cx="5.5" cy="17.5" r="1.8"/><circle cx="17.5" cy="17.5" r="1.8"/></svg>${qty} on the way</span>${sub ? `<small class="nf-inb-d">${escapeHtml(sub)}</small>` : ''}`,
    action: po ? `<span class="row-action" onclick="openOrderDetailModal('${po.id}', false)">See the order</span>` : ''
  };
}
