# Round 82 (dashboard): Money/Expenses polish, get-paid-faster tools in Free, onboarding and ease of use,
# operations helpers, offline sales, plan changes.
import os
from patchlib import P, S
HERE = os.path.dirname(__file__)
rd = lambda n: open(os.path.join(HERE, n), encoding='utf-8').read()
CSS = ['r82.css', 'r82p.css', 'r82o.css']
JS = ['r82.js', 'r82p.js', 'r82o.js', 'r82x.js', 'r82f.js']
t = S['text']; k = t.index('</style>')
S['text'] = t[:k] + '\n' + '\n'.join(rd(c) for c in CSS) + '\n' + t[k:]
P("function renderSidebarForViewAsRole(){", '\n'.join(rd(j) for j in JS) + "\nfunction renderSidebarForViewAsRole(){")

# --- utang due dates: read from the server, saved with each utang sale ---
P("payLog: Array.isArray(r.payment_log) ? r.payment_log : []}; }", "payLog: Array.isArray(r.payment_log) ? r.payment_log : [], dueDate: r.due_date || null}; }")
P("  const _nf79Photo = QS.photo || null; if(_nf79Photo) sale.photo = _nf79Photo;",
  "  const _nf79Photo = QS.photo || null; if(_nf79Photo) sale.photo = _nf79Photo;\n  if(QS.paidWith === 'credit' && typeof nf82QsDue === 'function') sale.dueDate = nf82QsDue();")
P("    if(okId) row.price_approval_id = okId;\n    const { data, error } = isOffline ? {error: {message: 'offline'}} : await sb.from('downstream_sales').insert(row).select().single();",
  "    if(okId) row.price_approval_id = okId;\n    if(sale.dueDate) row.due_date = sale.dueDate;\n    const { data, error } = isOffline ? {error: {message: 'offline'}} : await sb.from('downstream_sales').insert(row).select().single();")

# --- user menu: Start here and Pages you use ---
P("""            <div class="notif-item" style="cursor:pointer;" onclick="closeUserMenu(); navigate('settings');"><div><div class="notif-text">Settings</div></div></div>""",
  """            <div class="notif-item" style="cursor:pointer;" onclick="closeUserMenu(); go('dashboard'); setTimeout(() => { try{ localStorage.removeItem('nifti-start-hide:' + (myBusiness ? myBusiness.id : 'demo')); }catch(e){} nf82StartPaint(true); const s = document.getElementById('nf82StartW'); if(s) s.scrollIntoView({behavior: 'smooth', block: 'start'}); }, 300);"><div><div class="notif-text">Start here guide</div></div></div>
            <div class="notif-item" style="cursor:pointer;" onclick="closeUserMenu(); nf82PagesOpen();"><div><div class="notif-text">Pages you use</div></div></div>
            <div class="notif-item" style="cursor:pointer;" onclick="closeUserMenu(); nf82FbOpen();"><div><div class="notif-text">Send feedback</div></div></div>
            <div class="notif-item" style="cursor:pointer;" onclick="closeUserMenu(); navigate('settings');"><div><div class="notif-text">Settings</div></div></div>""")

# --- works without internet: open with the account and books kept on the phone ---
P("""async function loadMyBusinessContext(){
  const { data: { user } } = await sb.auth.getUser();
  if(!user) return false;""", """async function loadMyBusinessContext(){
  let user = null;
  if(typeof nf82Offline === 'function' && nf82Offline() && typeof nf82OffUser === 'function'){ user = nf82OffUser(); if(user) NF82_OFFBOOT = true; }
  if(!user){ try{ const _r = await sb.auth.getUser(); user = _r && _r.data ? _r.data.user : null; }catch(e){ user = null; } }
  if(!user) return false;""")
P("""  const { data: tm, error } = await sb.from('team_members')
    .select('*, businesses(*)')
    .eq('auth_user_id', user.id)
    .single();
  if(error || !tm) return false;""", """  let { data: tm, error } = NF82_OFFBOOT ? {data: null, error: {message: 'offline'}} : await sb.from('team_members')
    .select('*, businesses(*)')
    .eq('auth_user_id', user.id)
    .single();
  if((error || !tm) && typeof nf82Offline === 'function' && (nf82Offline() || NF82_OFFBOOT)){ const _c = nf82OffCtx(user.id); if(_c){ tm = _c; error = null; NF82_OFFBOOT = true; } }
  if(error || !tm) return false;
  if(!NF82_OFFBOOT && typeof nf82OffSaveCtx === 'function') nf82OffSaveCtx(tm);
  if(NF82_OFFBOOT && typeof bkLoad === 'function') setTimeout(() => { try{ BK.loaded = false; BK.loading = null; bkLoad(true).then(() => { try{ bkRefreshViews(); nf82BannerPaint(); }catch(e){} }); }catch(e){} }, 0);""")
P("  if(session) signedIn = await loadMyBusinessContext();", "  if(session || (typeof nf82OffCanBoot === 'function' && nf82OffCanBoot())) signedIn = await loadMyBusinessContext();")
P("""    BK.expenses = (ex.data || []).map(bkRowExpense);
    BK.sales = (sa.data || []).map(bkRowSale);""", """    if(typeof nf82BkOffline === 'function' && nf82BkOffline([ex, sa, mv, ct, cd, mn]) && await nf82BkRestore()){ BK.loaded = true; BK.loading = null; try{ nf82BannerPaint(); }catch(e){} return; }
    BK.expenses = (ex.data || []).map(bkRowExpense);
    BK.sales = (sa.data || []).map(bkRowSale);""")
P("""    BK.loaded = true; BK.loading = null;
    if(typeof bkFlushQueue === 'function') setTimeout(bkFlushQueue, 1500);""", """    BK.loaded = true; BK.loading = null; BK.offlineAt = null;
    if(typeof nf82BkSnap === 'function') setTimeout(nf82BkSnap, 800);
    if(typeof bkFlushQueue === 'function') setTimeout(bkFlushQueue, 1500);""")
P("  const { data: { session } } = await sb.auth.getSession();\n  let signedIn = false;", "  const { data: { session } } = (typeof nf82Offline === 'function' && nf82Offline()) ? await Promise.race([sb.auth.getSession().catch(() => ({data: {session: null}})), new Promise(r => setTimeout(() => r({data: {session: null}}), 1200))]) : await sb.auth.getSession();\n  let signedIn = false;")
P("    const { data: acct } = await sb.rpc('my_account_status');", "    const { data: acct } = NF82_OFFBOOT ? {data: null} : await sb.rpc('my_account_status');")

