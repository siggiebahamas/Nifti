# U1: one business loads both sides of its data (real accounts) and the demo plays one business.
from patchlib import P

# ---- real account context: same id on both sides, one team, one tax profile
P("""  currentAppRole = myBusiness.type; // 'buyer' or 'supplier' — fixed by the account, not togglable
  currentUserId = tm.id;
  if(myBusiness.type === 'buyer') ME_BUYER = myBusiness.id; else ME_SUPPLIER = myBusiness.id;""",
"""  // One business buys AND sells: the same id on both sides. currentAppRole is only the lens a page
  // looks through (customers vs suppliers); nobody picks a side.
  currentAppRole = 'supplier';
  currentUserId = tm.id;
  ME_BUYER = myBusiness.id; ME_SUPPLIER = myBusiness.id;""")
P("""  taxProfiles[myBusiness.type].businessName = myBusiness.name;
  taxProfiles[myBusiness.type].registeredAddress = '';""",
"""  taxProfiles.supplier.businessName = myBusiness.name;
  taxProfiles.supplier.registeredAddress = '';
  taxProfiles.buyer = taxProfiles.supplier; // one business, one tax registration""")
P("""  if(myBusiness.type === 'supplier') supplierTeamMembers = roster; else teamMembers = roster;""",
"""  supplierTeamMembers = roster; teamMembers = roster; // one team for buying and selling""")
P("""  if(!myBusiness || myBusiness.type !== 'buyer') return; // supplyLocationLabel has no real rows to sync — see loadRealWarehouses""",
"""  if(!myBusiness) return;""")
P("""  if(!myBusiness || myBusiness.type !== 'buyer') return; // supplyLocationLabel has no real rows to load — see syncWarehousesToSupabase""",
"""  if(!myBusiness) return;""")
P("""function subscribeToLocations(){
  if(!myBusiness || myBusiness.type !== 'buyer') return;""",
"""function subscribeToLocations(){
  if(!myBusiness) return;""")
P("""  const myRole = myBusiness.type; // 'buyer' | 'supplier'
  const last = (po.history||[])[po.history.length-1];""",
"""  const myRole = po.supplierId === myBusiness.id ? 'supplier' : 'buyer'; // which side of THIS order we are
  const last = (po.history||[])[po.history.length-1];""")

# ---- connections: customers and suppliers both
P("""async function loadMyConnections(){
  if(!myBusiness) return;
  const isSupplierRole = myBusiness.type === 'supplier';
  const col = isSupplierRole ? 'supplier_business_id' : 'buyer_business_id';
  const { data: relRows, error } = await sb.from('business_relationships').select('*').eq(col, myBusiness.id);
  if(error || !relRows){ console.warn('Could not load connections:', error && error.message); return; }
  const myPOs = isSupplierRole ? getSupplierPOs() : getBuyerPOs();
  const mapped = await Promise.all(relRows.map(async (r) => {
    const counterpartId = isSupplierRole ? r.buyer_business_id : r.supplier_business_id;""",
"""async function loadMyConnections(){
  if(!myBusiness) return;
  // Both directions: rows where we sell (our customers) and rows where we buy (our suppliers).
  const { data: relRows, error } = await sb.from('business_relationships').select('*').or(`buyer_business_id.eq.${myBusiness.id},supplier_business_id.eq.${myBusiness.id}`);
  if(error || !relRows){ console.warn('Could not load connections:', error && error.message); return; }
  const mapSide = (rows, isSupplierRole) => {
  const myPOs = isSupplierRole ? getSupplierPOs() : getBuyerPOs();
  return Promise.all(rows.map(async (r) => {
    const counterpartId = isSupplierRole ? r.buyer_business_id : r.supplier_business_id;""")
P("""      creditLimit: r.credit_limit || null, creditHoldDays: r.credit_hold_days || null, creditMode: r.credit_mode || 'block', country: r.country || '', location: r.location || '',
    };
  }));
  const ids = mapped.map(m => m.id);""",
"""      creditLimit: r.credit_limit || null, creditHoldDays: r.credit_hold_days || null, creditMode: r.credit_mode || 'block', country: r.country || '', location: r.location || '',
    };
  }));
  };
  const asSeller = await mapSide(relRows.filter(r => r.supplier_business_id === myBusiness.id && r.buyer_business_id !== myBusiness.id), true);
  const asBuyer = await mapSide(relRows.filter(r => r.buyer_business_id === myBusiness.id && r.supplier_business_id !== myBusiness.id), false);
  const mapped = asSeller.concat(asBuyer);
  const ids = mapped.map(m => m.id);""")
P("""  const target = isSupplierRole ? buyersData : suppliersData;
  target.length = 0;
  target.push(...mapped);
  if(typeof renderInvitesList === 'function') renderInvitesList();""",
"""  buyersData.length = 0; buyersData.push(...asSeller);
  suppliersData.length = 0; suppliersData.push(...asBuyer);
  if(typeof renderInvitesList === 'function') renderInvitesList();""")

# ---- conversations: one list per side, each knows its side
P("""async function loadMyConversations(){
  if(!myBusiness) return;
  const col = myBusiness.type === 'buyer' ? 'buyer_business_id' : 'supplier_business_id';
  const { data: convRows, error } = await sb.from('conversations').select('*').eq(col, myBusiness.id);
  if(error || !convRows) { console.warn('Could not load conversations:', error && error.message); return; }
  const target = myBusiness.type === 'buyer' ? buyerConversations : supplierConversations;""",
"""async function loadMyConversations(){
  if(!myBusiness) return;
  const { data: allRows, error } = await sb.from('conversations').select('*').or(`buyer_business_id.eq.${myBusiness.id},supplier_business_id.eq.${myBusiness.id}`);
  if(error || !allRows) { console.warn('Could not load conversations:', error && error.message); return; }
  for(const side of ['buyer', 'supplier']){
  const convRows = allRows.filter(c => side === 'buyer' ? (c.buyer_business_id === myBusiness.id && c.supplier_business_id !== myBusiness.id) : (c.supplier_business_id === myBusiness.id && c.buyer_business_id !== myBusiness.id));
  const target = side === 'buyer' ? buyerConversations : supplierConversations;""")
P("""    const counterpartId = myBusiness.type === 'buyer' ? c.supplier_business_id : c.buyer_business_id;
    const name = (await getBusinessName(counterpartId)) || 'Unknown business';
    const { data: msgRows }""",
"""    const counterpartId = side === 'buyer' ? c.supplier_business_id : c.buyer_business_id;
    const name = (await getBusinessName(counterpartId)) || 'Unknown business';
    const { data: msgRows }""")
P("""      unread: myBusiness.type === 'buyer' ? c.buyer_unread_count : c.supplier_unread_count,
      messages: [...messages, ...stillPending],
    };
  }));
  target.length = 0;
  target.push(...mapped);
}""",
"""      unread: side === 'buyer' ? c.buyer_unread_count : c.supplier_unread_count,
      side,
      messages: [...messages, ...stillPending],
    };
  }));
  target.length = 0;
  target.push(...mapped);
  }
}""")
P("""    const target = myBusiness.type === 'buyer' ? 'supplier' : 'buyer';
    await sb.rpc('increment_conversation_unread', { p_conversation_id: conv.conversationRowId, p_target: target });""",
"""    const target = convSide(conv) === 'buyer' ? 'supplier' : 'buyer'; // bump the OTHER party's unread
    await sb.rpc('increment_conversation_unread', { p_conversation_id: conv.conversationRowId, p_target: target });""")
P("""  const col = myBusiness.type === 'buyer' ? 'buyer_unread_count' : 'supplier_unread_count';
  const { error } = await sb.from('conversations').update({ [col]: 0 }).eq('id', conv.conversationRowId);""",
"""  const col = convSide(conv) === 'buyer' ? 'buyer_unread_count' : 'supplier_unread_count';
  const { error } = await sb.from('conversations').update({ [col]: 0 }).eq('id', conv.conversationRowId);""")
P("""    const conv = getConversations().find(c=>c.conversationRowId===row.conversation_id);
    if(!conv) return; // a message for a conversation this business isn't part of — RLS already prevents this, defensive only""",
"""    const conv = allConversations().find(c=>c.conversationRowId===row.conversation_id);
    if(!conv) return; // a message for a conversation this business isn't part of — RLS already prevents this, defensive only""")
P("""    const conv = getConversations().find(c=>c.conversationRowId===row.id);
    if(!conv) { loadMyConversations().then(()=>{ renderConversationList(); }); return; }""",
"""    const conv = allConversations().find(c=>c.conversationRowId===row.id);
    if(!conv) { loadMyConversations().then(()=>{ renderConversationList(); }); return; }""")
P("""      conv.unread = myBusiness.type === 'buyer' ? row.buyer_unread_count : row.supplier_unread_count;""",
"""      conv.unread = convSide(conv) === 'buyer' ? row.buyer_unread_count : row.supplier_unread_count;""")
P("""async function retryPendingMessages(){
  if(!myBusiness || isOffline) return;
  for(const conv of getConversations()){""",
"""async function retryPendingMessages(){
  if(!myBusiness || isOffline) return;
  for(const conv of allConversations()){""")

# ---- other single-side assumptions
P("""    if(taxProfiles[myBusiness.type]) taxProfiles[myBusiness.type].businessName = name;""",
"""    taxProfiles.supplier.businessName = name; taxProfiles.buyer.businessName = name;""")
P("""  if(next && myBusiness.type === 'supplier') await syncCatalogToServer();""",
"""  if(next) await syncCatalogToServer();""")
P("""    <div style="font-size:13.5px;opacity:.7;margin-bottom:10px;">Only this, your business name${myBusiness.type === 'supplier' ? ' and your product list with prices' : ''}. Never who you work with or your orders.</div>
    <div class="row-2">
      <div class="field"><label>What you ${myBusiness.type === 'supplier' ? 'sell' : 'buy'}</label>""",
"""    <div style="font-size:13.5px;opacity:.7;margin-bottom:10px;">Only this, your business name and your product list with prices. Never who you work with or your orders.</div>
    <div class="row-2">
      <div class="field"><label>What you sell</label>""")
P("""function scheduleCatalogServerSync(){
  if(!myBusiness || myBusiness.type !== 'supplier') return;""",
"""function scheduleCatalogServerSync(){
  if(!myBusiness) return;""")
P("""async function syncCatalogToServer(){
  if(!myBusiness || myBusiness.type !== 'supplier') return;""",
"""async function syncCatalogToServer(){
  if(!myBusiness) return;""")
P("""  if(myBusiness.type !== 'supplier' || !Array.isArray(myBusiness.catalog) || !myBusiness.catalog.length) return;""",
"""  if(!Array.isArray(myBusiness.catalog) || !myBusiness.catalog.length) return;""")
P("""    bizRole: myBusiness ? myBusiness.type : currentAppRole};
}
function mapTeamMessageRow(r){""",
"""    bizRole: 'both'};
}
function mapTeamMessageRow(r){""")
P("""    time: d.toLocaleTimeString('en-PH',{hour:'numeric',minute:'2-digit'}), bizRole: myBusiness ? myBusiness.type : currentAppRole};""",
"""    time: d.toLocaleTimeString('en-PH',{hour:'numeric',minute:'2-digit'}), bizRole: 'both'};""")
P("""  const isSupplier = myBusiness ? myBusiness.type === 'supplier' : currentAppRole === 'supplier';
  card.classList.toggle('hidden', !isSupplier);
  if(!isSupplier) return;""",
"""  card.classList.remove('hidden'); // every business gets paid by someone""")
P("""function notifyRfqRealtimeChange(rfq, isNewToMe){
  const myRole = myBusiness.type;""",
"""function notifyRfqRealtimeChange(rfq, isNewToMe){
  const myRole = rfq.supplierId === myBusiness.id ? 'supplier' : 'buyer';""")
P("""  if(myBusiness) taxProfiles[myBusiness.type].businessName = myBusiness.name;""",
"""  if(taxProfiles.supplier && taxProfiles.buyer !== taxProfiles.supplier) taxProfiles.buyer = taxProfiles.supplier; // one business, one tax registration
  if(myBusiness) taxProfiles.supplier.businessName = myBusiness.name;""")
P("""  currentAppRole = s.currentAppRole || currentAppRole;""",
"""  // the lens isn't restored: every visit starts on the combined home""")

# ---- team: one roster, nothing hidden by side
P("""function getActiveTeamMembers(){ return currentAppRole==='supplier' ? supplierTeamMembers : teamMembers; }""",
"""function getActiveTeamMembers(){ return teamMembers; } // one business, one team""")
P("""function teamScoped(x){ return x.bizRole===currentAppRole || !x.bizRole; }""",
"""function teamScoped(x){ return true; } // one team sees all its tasks and chat""")
P("""function teamChatSeenKey(){ return 'nifti-team-chat-seen:' + (myBusiness ? myBusiness.id : 'demo-'+currentAppRole); }""",
"""function teamChatSeenKey(){ return 'nifti-team-chat-seen:' + (myBusiness ? myBusiness.id : 'demo'); }""")
P("""  teamActivityLog.unshift({id:'ta'+Date.now()+Math.floor(Math.random()*1000), actor: me?me.name:'Someone', action, date:APP_TODAY, time:'Just now', kind: kind||'general', bizRole: currentAppRole});""",
"""  teamActivityLog.unshift({id:'ta'+Date.now()+Math.floor(Math.random()*1000), actor: me?me.name:'Someone', action, date:APP_TODAY, time:'Just now', kind: kind||'general', bizRole: 'both'});""")
P("""    if(currentAppRole==='supplier') supplierTeamMembers = supplierTeamMembers.filter(m=>m.id!==id);
    else teamMembers = teamMembers.filter(m=>m.id!==id);""",
"""    teamMembers = teamMembers.filter(m=>m.id!==id);""")
P("""function getMyTaxProfile(){ return taxProfiles[currentAppRole] || taxProfiles.buyer; }""",
"""function getMyTaxProfile(){ return taxProfiles.supplier || taxProfiles.buyer; } // one business, one tax registration""")
