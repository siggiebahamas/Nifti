# U3: the demo is one business (Dela Cruz Hardware: buys from Metro Steel & others, sells to contractors),
# and stock is one list that sales, deliveries and supplier receipts all move.
from patchlib import P, S
import re

# ---- one demo business: our sales and our purchases share one id
P("""let ME_SUPPLIER = 'metro';       // the persona when Viewing as: Supplier (Metro Steel Co.)""",
  """let ME_SUPPLIER = 'me_buyer';    // one business: the same id sells (to customers) and buys (from suppliers)""")
# Metro Steel is now just one of our suppliers: these three are purchases from them
for po in ['po13', 'po14', 'po15']:
    P("{id:'%s', poNumber:" % po, "{id:'%s', poNumber:" % po)  # existence check
    t = S['text']
    i = t.index("{id:'%s', poNumber:" % po)
    j = t.index("supplierId:ME_SUPPLIER, supplierName:'Metro Steel Co.'", i)
    S['text'] = t[:j] + "supplierId:'metro', supplierName:'Metro Steel Co.'" + t[j + len("supplierId:ME_SUPPLIER, supplierName:'Metro Steel Co.'"):]
P("""  // ---- Overlap: Dela Cruz Hardware ↔ Metro Steel Co. — appears on BOTH sides, the sync demo ----""",
  """  // ---- Purchases from Metro Steel Co. (one of our suppliers) ----""")
# our own sales to customers carry our name
P("supplierId:ME_SUPPLIER, supplierName:'Metro Steel Co.',", "supplierId:ME_SUPPLIER, supplierName:'Dela Cruz Hardware',", 8)
P("""  supplier: {businessName:'Metro Steel Co.', tin:'', rdoCode:'',""", """  supplier: {businessName:'Dela Cruz Hardware', tin:'', rdoCode:'',""")
P("""  {id:'tm1', name:'Metro Steel Co. (You)', email:'you@metrosteelco.ph', roles:['Owner']},""",
  """  {id:'tm1', name:'Dela Cruz Hardware (You)', email:'you@delacruzhardware.ph', roles:['Owner']},""")
# we don't sell to ourselves
P("""  {id:'me_buyer', name:'Dela Cruz Hardware', category:'Hardware', score:96, tier:'good', orders:18, lastOrder:'2 days ago', since:'2024-11-02', preferredContact:'In-app chat', paymentTerms:'Net 30', creditLimit:100000},\n""", "")
t = S['text']
i = t.index("const supplierConversations = [\n  {id:'me_buyer', name:'Dela Cruz Hardware'")
j = t.index("  {id:'buy_bayview', name:'Bayview Construction Co.'", i)
S['text'] = t[:i] + "const supplierConversations = [\n" + t[j:]
P("""  {id:'inbox1', type:'purchase', pillLabel:'New', pillClass:'pill-warn', title:'New purchase request — Galvanized Wire 12ga', meta:'Qty: 44 · From: Dela Cruz Hardware', time:'2h ago', resolved:false},\n""", "")

# every place that printed the old seller persona's name now prints the one business's name
SELF = [
  ("  const me = myBusiness ? myBusiness.name : 'Metro Steel Co.';", "  const me = selfName();", 2),
  ("    supplier: {name: myBusiness ? myBusiness.name : (tp.businessName || 'Metro Steel Co.'),", "    supplier: {name: myBusiness ? myBusiness.name : (tp.businessName || selfName()),", 1),
  ("  const name = myBusiness ? myBusiness.name : (currentAppRole === 'supplier' ? 'Metro Steel Co.' : 'Dela Cruz Hardware');", "  const name = selfName();", 2),
  ("  return {isSup, name: myBusiness ? myBusiness.name : (isSup ? 'Metro Steel Co.' : 'Dela Cruz Hardware'),", "  return {isSup, name: selfName(),", 1),
  ("  const name = myBusiness ? myBusiness.name : 'Metro Steel Co.';", "  const name = selfName();", 2),
  ("  const who = l.name.split(' ')[0], biz = myBusiness ? myBusiness.name : 'Metro Steel Co.';", "  const who = l.name.split(' ')[0], biz = selfName();", 1),
  ("supplierId: ME_SUPPLIER, supplierName: 'Metro Steel Co.',", "supplierId: ME_SUPPLIER, supplierName: selfName(),", 3),
  ("  const me = myBusiness || {name: 'Metro Steel Co.', shared_contact: {phone: '0917 555 1234', address: 'Valenzuela City'}};", "  const me = myBusiness || {name: selfName(), shared_contact: {phone: '0917 555 1234', address: 'Marikina City'}};", 1),
  ("  const name = myBusiness ? myBusiness.name : (role === 'supplier' ? 'Metro Steel Co.' : 'Dela Cruz Hardware');", "  const name = selfName();", 1),
  ("function inviteSelfName(){ return myBusiness ? myBusiness.name : (currentAppRole==='buyer' ? 'Dela Cruz Hardware' : 'Metro Steel Co.'); }", "function inviteSelfName(){ return selfName(); }", 1),
  ("    return (typeof currentAppRole!=='undefined' && currentAppRole==='buyer') ? 'Dela Cruz Hardware' : 'Metro Steel Co.';", "    return selfName();", 1),
  ("    createdBy: (currentAppRole==='buyer') ? 'Dela Cruz Hardware' : 'Metro Steel Co.',", "    createdBy: selfName(),", 1),
  ("  sku.criticalityOverriddenBy = actor || (currentAppRole==='buyer' ? 'Dela Cruz Hardware' : 'Metro Steel Co.');", "  sku.criticalityOverriddenBy = actor || selfName();", 1),
  ("    actor: actor || (currentAppRole==='buyer' ? 'Dela Cruz Hardware' : 'Metro Steel Co.'),", "    actor: actor || selfName(),", 1),
  ("|| (currentAppRole==='buyer' ? 'Dela Cruz Hardware' : 'Metro Steel Co.'),", "|| selfName(),", 1),
  ("business: currentAppRole==='buyer'?'Dela Cruz Hardware':'Metro Steel Co.'});", "business: selfName()});", 1),
]
for a, b, n in SELF:
    P(a, b, n)

# ---- one stock list: what we sell comes out of the same stock we buy into
P("""const supplyData = [
  {code:'PROD-100', name:'Rebar 10mm', location:'main', onHand:850, committed:620, restockLevel:150},""",
"""const supplyData = [
  {code:'PROD-100', name:'Rebar 10mm', location:'main', onHand:850, committed:620, restockLevel:150},""")
P("""supplyData.forEach(item=>assignBarcodeIfMissing(item, '48'));""",
"""supplyData.forEach(item=>assignBarcodeIfMissing(item, '48'));
// Demo: what Dela Cruz sells to contractors (steel from Metro) sits in the same stock as everything else.
supplyData.forEach(s => {
  if(inventoryData.some(i => i.name.toLowerCase() === s.name.toLowerCase())) return;
  const item = {code: s.code.replace('PROD', 'SKU'), name: s.name, warehouse: 'main', onHand: s.onHand, rop: s.restockLevel, maxLevel: s.restockLevel * 4, lot: null, exp: null,
    status: s.onHand <= s.restockLevel ? 'critical' : s.onHand <= s.restockLevel * 1.5 ? 'warning' : 'healthy', supplier: 'Metro Steel Co.', daysLeft: null, leadTime: 5};
  assignBarcodeIfMissing(item, '48');
  inventoryData.push(item);
});""")
# a customer delivery takes the stock out of the one list too (by product name, from the location holding the most)
P("""function applyDeliveryToSupplierStock(po, receivedQuantities){
  if(po.supplierId !== ME_SUPPLIER) return;
  const touched = [];""",
"""function applyDeliveryToSupplierStock(po, receivedQuantities){
  if(po.supplierId !== ME_SUPPLIER) return;
  if(typeof stockOut === 'function') stockOut(po.lineItems.map((li, i) => ({product: li.product, qty: receivedQuantities ? (receivedQuantities[i] ? receivedQuantities[i].received : li.qty) : li.qty})), 'delivered', 'Delivered to ' + (po.buyerName || 'a customer'), po.poNumber);
  const touched = [];""")
# receiving from a supplier labels the stock move, and records the cost
P("""    match.onHand += receivedQty;
    if(match.onHand <= match.rop) match.status = 'critical';""",
"""    match.onHand += receivedQty;
    if(typeof stockLabel === 'function') stockLabel(match, {kind: 'received', reason: 'Received from ' + (po.supplierName || 'a supplier'), ref: po.poNumber, unitCost: li.unitPrice, qty: receivedQty});
    if(match.onHand <= match.rop) match.status = 'critical';""")

# inventory rows carry cost, selling price and the reason for the last stock change
P("""    meta: item._meta || null, rop_enabled: item.ropEnabled !== false, max_level_enabled: item.maxLevelEnabled !== false,
    batch_tracking_enabled: item.batchTrackingEnabled === true,
  };
}""",
"""    meta: Object.assign({}, item._meta || {}, item._lastMove ? {last_move: item._lastMove} : {}), rop_enabled: item.ropEnabled !== false, max_level_enabled: item.maxLevelEnabled !== false,
    batch_tracking_enabled: item.batchTrackingEnabled === true,
    unit_cost: item.unitCost != null && item.unitCost !== '' ? Number(item.unitCost) : null,
    sell_price: item.sellPrice != null && item.sellPrice !== '' ? Number(item.sellPrice) : null,
  };
}""")
P("""    _meta: row.meta || undefined, ropEnabled: row.rop_enabled !== false, maxLevelEnabled: row.max_level_enabled !== false,
    batchTrackingEnabled: row.batch_tracking_enabled === true,
  };
}""",
"""    _meta: row.meta ? Object.assign({}, row.meta, {last_move: undefined}) : undefined, ropEnabled: row.rop_enabled !== false, maxLevelEnabled: row.max_level_enabled !== false,
    batchTrackingEnabled: row.batch_tracking_enabled === true,
    unitCost: row.unit_cost != null ? Number(row.unit_cost) : undefined, sellPrice: row.sell_price != null ? Number(row.sell_price) : undefined,
  };
}""")
