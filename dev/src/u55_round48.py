# Round 48: voice to post, Post to Facebook, Monday price list, photo cleanup, "how much?" replies, Poster role,
# checkout payments and delivery fees, and pages that open beside you instead of replacing what you were doing
import os
from patchlib import P, S
HERE = os.path.dirname(__file__)
rd = lambda n: open(os.path.join(HERE, n), encoding='utf-8').read()
P("function renderSidebarForViewAsRole(){", rd('r48.js') + "\nfunction renderSidebarForViewAsRole(){")
t = S['text']; i = t.rindex('  .settings-card:empty{display:none;}')
S['text'] = t[:i] + '\n/* ===== Round 48 css ===== */\n' + rd('r48.css') + '\n' + t[i:]
# saving Store settings keeps what the newer tools stored with the store (checkout, replies, Facebook Page)
P("show_phone: document.getElementById('stPhone').classList.contains('on'), featured, promos};",
  "show_phone: document.getElementById('stPhone').classList.contains('on'), featured, promos};\n  { const prev = (typeof myBusiness !== 'undefined' && myBusiness ? myBusiness.store : window._demoStore) || {}; ['checkout', 'replies', 'fb_page', 'hours'].forEach(k => { if(prev[k] !== undefined) store[k] = prev[k]; }); if(store.checkout && store.checkout.methods) store.checkout.methods.cod = store.cod; }")
