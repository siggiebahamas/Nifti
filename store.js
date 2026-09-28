/* Nifti online store: the lightweight version buyers get from Facebook, Messenger and Viber links.
   The full Nifti app is ~2MB; this page is a few KB with no libraries, so it opens fast on mobile
   data. It talks to the same database functions (get_store, submit_store_order). Tracking an order
   and signing up open the full app. */
(function(){
  var API = 'https://ctryvcloavfpecbrbzxy.supabase.co/rest/v1/rpc/';
  var KEY = 'sb_publishable_oWW-IMSOeNNFiQDjUnpWdQ_hlezb7wS';
  var script = document.currentScript;
  var BASE = script ? script.src.replace(/store\.js(\?.*)?$/, '') : (location.origin + '/');
  var slugMatch = location.pathname.match(/\/s\/([a-z0-9-]{3,40})\/?$/);
  var SLUG = window.NIFTI_STORE_SLUG || (slugMatch && slugMatch[1]) || '';
  var root = document.getElementById('store-root') || document.body;
  var S = {d: null, cart: {}, q: ''};

  function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
  function peso(n){ return '₱' + Number(n || 0).toLocaleString('en-PH', {minimumFractionDigits: Number(n) % 1 ? 2 : 0, maximumFractionDigits: 2}); }
  function niceDate(d){ var x = new Date(String(d).slice(0,10) + 'T00:00:00'); return isNaN(x) ? esc(d) : x.toLocaleDateString('en-PH', {month:'short', day:'numeric'}); }
  function token(){
    try{
      for(var i = 0; i < localStorage.length; i++){
        var k = localStorage.key(i);
        if(/^sb-.*-auth-token$/.test(k)){ var v = JSON.parse(localStorage.getItem(k)); if(v && v.access_token && v.expires_at * 1000 > Date.now() + 60000) return v.access_token; }
      }
    }catch(e){}
    return null;
  }
  function rpc(fn, body){
    var t = token();
    return fetch(API + fn, {method: 'POST', headers: {'apikey': KEY, 'Authorization': 'Bearer ' + (t || KEY), 'Content-Type': 'application/json'}, body: JSON.stringify(body || {})})
      .then(function(r){ return r.json().then(function(j){ if(!r.ok) throw new Error((j && (j.message || j.hint)) || 'Something went wrong. Please try again.'); return j; }); });
  }
  function src(){
    var q = new URLSearchParams(location.search);
    if(q.get('src')) return q.get('src').slice(0, 20);
    if(q.get('fbclid') || /facebook|messenger/i.test(document.referrer || '')) return 'fb';
    if(/instagram/i.test(document.referrer || '')) return 'ig';
    return '';
  }
  function price(it){ return it.promo_price != null ? Number(it.promo_price) : (it.price != null ? Number(it.price) : null); }
  function totals(){
    var c = 0, t = 0, priced = true;
    Object.keys(S.cart).forEach(function(p){
      var it = S.d.items.filter(function(i){ return i.product === p; })[0], q = S.cart[p];
      if(!it || !(q > 0)) return; c++; var pr = price(it); if(pr == null) priced = false; else t += pr * q;
    });
    return {count: c, total: t, priced: priced};
  }
  function save(){ try{ localStorage.setItem('nifti-cart:' + SLUG, JSON.stringify(S.cart)); }catch(e){} }

  function itemsHtml(){
    var d = S.d, q = S.q.toLowerCase(), feat = d.featured || [];
    var list = d.items.filter(function(i){ return !q || i.product.toLowerCase().indexOf(q) >= 0; })
      .sort(function(a, b){ return (feat.indexOf(b.product) >= 0) - (feat.indexOf(a.product) >= 0) || (b.promo_price != null) - (a.promo_price != null) || a.product.localeCompare(b.product); });
    if(!list.length) return '<div class="ns-empty">No products match.</div>';
    return list.map(function(it){
      var n = S.cart[it.product] || 0, k = esc(JSON.stringify(it.product));
      var p = it.promo_price != null ? '<b class="ns-sale">' + peso(it.promo_price) + '</b> <s>' + peso(it.price) + '</s> <span class="ns-tag">Sale until ' + niceDate(it.promo_until) + '</span>'
        : it.price != null ? '<b>' + peso(it.price) + '</b>' : '<span class="ns-dim">Price on request</span>';
      return '<div class="ns-item"><div class="ns-grow"><div class="ns-name">' + (feat.indexOf(it.product) >= 0 ? '⭐ ' : '') + esc(it.product) + '</div>'
        + '<div class="ns-price">' + p + (it.unit ? ' <span class="ns-dim">/ ' + esc(it.unit) + '</span>' : '') + '</div>'
        + (it.moq > 1 ? '<div class="ns-small">Min. ' + esc(it.moq) + ' ' + esc(it.unit || '') + '</div>' : '') + '</div>'
        + '<div class="ns-qty">' + (n ? '<button onclick=\'NS.step(' + k + ',-1)\'>−</button><input type="number" inputmode="numeric" value="' + n + '" onchange=\'NS.set(' + k + ',this.value)\'><button onclick=\'NS.step(' + k + ',1)\'>+</button>'
          : '<button class="ns-add" onclick=\'NS.step(' + k + ',1)\'>Add</button>') + '</div></div>';
    }).join('');
  }
  function cartBar(){
    var t = totals(), d = S.d, el = document.getElementById('ns-cart');
    if(!el) return;
    el.className = 'ns-cart' + (t.count ? '' : ' ns-hide');
    el.innerHTML = '<div><b>🛒 ' + t.count + ' item' + (t.count === 1 ? '' : 's') + '</b><div class="ns-small">' + (t.priced ? peso(t.total) : 'Price to follow')
      + (d.min_order && t.priced && t.total < d.min_order ? ' · min. ' + peso(d.min_order) : '') + '</div></div><button class="ns-btn" onclick="NS.checkout()">Order now →</button>';
  }
  function render(){
    var d = S.d;
    var pay = {gcash:'GCash', maya:'Maya', grabpay:'GrabPay', shopeepay:'ShopeePay', remittance:'Remittance', check:'Check', bank:'Bank'};
    var chips = [
      d.delivery_areas && '🚚 Delivers to ' + esc(d.delivery_areas), d.delivery_days && '📅 ' + esc(d.delivery_days), d.lead_time && '⏱ ' + esc(d.lead_time),
      d.min_order && 'Min. order ' + peso(d.min_order),
      (d.pay_methods || []).length && '💳 ' + d.pay_methods.map(function(p){ return esc(pay[p] || p); }).join(', ') + (d.cod ? ', COD' : ''),
      !(d.pay_methods || []).length && d.cod && '💵 Cash on delivery'
    ].filter(Boolean);
    var phoneDigits = d.phone ? String(d.phone).replace(/[^0-9]/g, '').replace(/^63/, '').replace(/^0/, '') : '';
    var initials = (d.name || '?').split(/\s+/).map(function(w){ return w[0]; }).slice(0, 2).join('').toUpperCase();
    root.innerHTML = '<div class="ns-wrap">'
      + '<div class="ns-top"><b class="ns-brand">Nifti</b>' + (d.is_owner ? '<span class="ns-small">👀 This is what buyers see</span>' : '') + '</div>'
      + '<div class="ns-card"><div class="ns-row"><div class="ns-av">' + esc(initials) + '</div><div><h1>' + esc(d.name) + (d.verified ? ' <span title="Verified business" class="ns-ok">✔</span>' : '') + '</h1>'
      + '<div class="ns-dim">' + ([d.category, d.location].filter(Boolean).map(esc).join(' · ') || (d.type === 'buyer' ? 'Local store' : 'Wholesale supplier')) + (d.orders_band ? ' · ' + d.orders_band + ' orders lately' : '') + '</div></div></div>'
      + (d.headline ? '<div class="ns-head">' + esc(d.headline) + '</div>' : '') + (d.about ? '<div class="ns-about">' + esc(d.about) + '</div>' : '')
      + (chips.length ? '<div class="ns-chips">' + chips.map(function(c){ return '<span>' + c + '</span>'; }).join('') + '</div>' : '')
      + '<div class="ns-row ns-gap">' + (d.phone ? '<a class="ns-btn2" href="tel:' + esc(String(d.phone).replace(/[^0-9+]/g, '')) + '">📞 Call</a><a class="ns-btn2" href="viber://chat?number=%2B63' + esc(phoneDigits) + '">💬 Viber</a>' : '')
      + '<button class="ns-btn2" onclick="NS.ask()">💬 Ask a question</button><button class="ns-btn2" onclick="NS.share()">↗ Share</button></div></div>'
      + (S.reorder ? '<div class="ns-card ns-green"><b>🔁 Your usual order is ready</b><div class="ns-about">We added what you ordered last time. Change anything, then tap Order now.</div></div>' : '')
      + (d.price_mode === 'signup' && !d.show_prices ? '<div class="ns-card ns-green"><b>Wholesale prices are for registered buyers</b><div class="ns-about">Sign up free in 1 minute to see prices. You can also order now and they\'ll send you the price.</div><button class="ns-btn" onclick="NS.signup()">See prices, sign up free →</button></div>' : '')
      + (d.price_mode === 'hidden' ? '<div class="ns-card ns-about">Pick what you need and send your order. ' + esc(d.name) + ' replies with the price before confirming.</div>' : '')
      + '<div class="ns-card"><input class="ns-search" type="search" placeholder="🔍 Search ' + d.items.length + ' products" value="' + esc(S.q) + '" oninput="NS.search(this.value)"><div id="ns-items">' + itemsHtml() + '</div></div>'
      + '<div class="ns-foot">Online store by <b>Nifti</b> · Free for businesses · <a href="' + BASE + '?src=store">Make your own</a></div>'
      + '<div id="ns-cart"></div></div>';
    cartBar();
  }
  function refreshItems(){ var y = window.scrollY; document.getElementById('ns-items').innerHTML = itemsHtml(); cartBar(); window.scrollTo(0, y); }

  window.NS = {
    search: function(v){ S.q = v; document.getElementById('ns-items').innerHTML = itemsHtml(); },
    step: function(p, dir){
      var it = S.d.items.filter(function(i){ return i.product === p; })[0]; if(!it) return;
      var moq = Math.max(1, Number(it.moq) || 1), cur = S.cart[p] || 0;
      NS.set(p, dir > 0 ? (cur === 0 ? moq : cur + 1) : (cur - 1 < moq ? 0 : cur - 1));
    },
    set: function(p, v){ var n = Math.max(0, Math.min(1000000, Math.round(Number(v) || 0))); if(n) S.cart[p] = n; else delete S.cart[p]; save(); refreshItems(); },
    share: function(){
      var url = BASE + 's/' + SLUG + '/';
      if(navigator.share){ navigator.share({title: S.d.name, text: 'Order from ' + S.d.name + ' online:', url: url}).catch(function(){}); return; }
      try{ navigator.clipboard.writeText(url); alert('Link copied.'); }catch(e){ prompt('Copy this link:', url); }
    },
    ask: function(){
      var saved = {}; try{ saved = JSON.parse(localStorage.getItem('nifti-store-buyer') || '{}') || {}; }catch(e){}
      var m = document.createElement('div'); m.className = 'ns-modal'; m.id = 'ns-modal';
      m.onclick = function(e){ if(e.target === m) m.remove(); };
      m.innerHTML = '<div class="ns-sheet"><h2>Ask ' + esc(S.d.name) + '</h2><div class="ns-small">Price, stock, delivery, anything. They reply by call or Viber.</div>'
        + '<label>Your name</label><input id="ns-qname" maxlength="80" autocomplete="name" value="' + esc(saved.name || '') + '">'
        + '<label>Mobile number</label><input id="ns-qphone" type="tel" inputmode="tel" maxlength="20" placeholder="0917 123 4567" value="' + esc(saved.phone || '') + '">'
        + '<label>Your question</label><input id="ns-qmsg" maxlength="600" placeholder="e.g. Magkano po 100 bags? Pwede i-deliver sa Malabon?">'
        + '<div id="ns-err" class="ns-err"></div><button class="ns-btn ns-big" id="ns-qsend" onclick="NS.sendAsk()">Send question</button></div>';
      document.body.appendChild(m);
    },
    sendAsk: function(){
      function v(id){ var e = document.getElementById(id); return e ? e.value.trim() : ''; }
      var err = document.getElementById('ns-err'), btn = document.getElementById('ns-qsend');
      if(v('ns-qname').length < 2){ err.textContent = 'Please enter your name.'; return; }
      if(v('ns-qphone').replace(/\D/g, '').length < 10){ err.textContent = 'Please enter your mobile number so they can reply.'; return; }
      if(v('ns-qmsg').length < 3){ err.textContent = 'What would you like to ask?'; return; }
      btn.disabled = true; btn.textContent = 'Sending…';
      rpc('submit_store_inquiry', {p_slug: SLUG, p_name: v('ns-qname'), p_phone: v('ns-qphone'), p_message: v('ns-qmsg'), p_src: src() || null}).then(function(){
        try{ var sv = JSON.parse(localStorage.getItem('nifti-store-buyer') || '{}') || {}; sv.name = v('ns-qname'); sv.phone = v('ns-qphone'); localStorage.setItem('nifti-store-buyer', JSON.stringify(sv)); }catch(e){}
        document.querySelector('#ns-modal .ns-sheet').innerHTML = '<div class="ns-center"><div style="font-size:42px">✅</div><h2>Sent to ' + esc(S.d.name) + '</h2><div class="ns-about">They\'ll call or message you soon.</div><button class="ns-btn ns-big" onclick="document.getElementById(\'ns-modal\').remove()">Back to the store</button></div>';
      }).catch(function(e){ btn.disabled = false; btn.textContent = 'Send question'; err.textContent = e.message; });
    },
    signup: function(){ try{ sessionStorage.setItem('nifti-return', '#s/' + SLUG); }catch(e){} location.href = BASE + '#signup'; },
    checkout: function(){
      var d = S.d, t = totals(); if(!t.count) return;
      if(t.priced && d.min_order && t.total < d.min_order && d.price_mode === 'public'){ alert('The minimum order is ' + peso(d.min_order) + '.'); return; }
      var saved = {}; try{ saved = JSON.parse(localStorage.getItem('nifti-store-buyer') || '{}') || {}; }catch(e){}
      var signed = !!token();
      var lines = Object.keys(S.cart).map(function(p){ var it = d.items.filter(function(i){ return i.product === p; })[0], pr = it ? price(it) : null, q = S.cart[p];
        return '<div class="ns-line"><span>' + esc(q) + ' × ' + esc(p) + '</span><span>' + (pr != null ? peso(pr * q) : '—') + '</span></div>'; }).join('');
      var m = document.createElement('div'); m.className = 'ns-modal'; m.id = 'ns-modal';
      m.onclick = function(e){ if(e.target === m) m.remove(); };
      m.innerHTML = '<div class="ns-sheet"><h2>Your order with ' + esc(d.name) + '</h2>' + lines
        + '<div class="ns-line ns-total"><span>Total</span><span>' + (t.priced ? peso(t.total) : 'Price to follow') + '</span></div>'
        + (signed ? '<div class="ns-note">Ordering as your Nifti account. You\'ll see it in your Orders.</div>'
          : '<label>Your name</label><input id="ns-name" maxlength="80" autocomplete="name" value="' + esc(saved.name || '') + '">'
          + '<label>Business name (optional)</label><input id="ns-biz" maxlength="120" autocomplete="organization" value="' + esc(saved.biz || '') + '">'
          + '<label>Mobile number</label><input id="ns-phone" type="tel" inputmode="tel" maxlength="20" placeholder="0917 123 4567" autocomplete="tel" value="' + esc(saved.phone || '') + '">')
        + '<label>Deliver to</label><input id="ns-addr" maxlength="300" placeholder="Street, barangay, city" autocomplete="street-address" value="' + esc(saved.addr || '') + '">'
        + '<label>Needed by (optional)</label><input id="ns-date" type="date">'
        + '<label>Your PO number (optional)</label><input id="ns-ref" maxlength="60" placeholder="e.g. PO-1234">'
        + '<label>Note (optional)</label><input id="ns-note" maxlength="500" placeholder="e.g. Please deliver before 10am">'
        + '<input id="ns-hp" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true">'
        + '<div id="ns-err" class="ns-err"></div><button class="ns-btn ns-big" id="ns-send" onclick="NS.submit()">Send order →</button>'
        + '<div class="ns-small ns-center">No payment now. ' + esc(d.name) + ' confirms your order first, then you pay them directly.</div></div>';
      document.body.appendChild(m);
    },
    submit: function(){
      var d = S.d, err = document.getElementById('ns-err'), btn = document.getElementById('ns-send');
      function v(id){ var e = document.getElementById(id); return e ? e.value.trim() : ''; }
      if(v('ns-hp')) return;
      var who = {name: v('ns-name'), biz: v('ns-biz'), phone: v('ns-phone'), addr: v('ns-addr')};
      if(document.getElementById('ns-name') && who.name.length < 2){ err.textContent = 'Please enter your name.'; return; }
      if(document.getElementById('ns-phone') && who.phone.replace(/\D/g, '').length < 10){ err.textContent = 'Please enter your mobile number so they can reach you.'; return; }
      if(who.addr.length < 4){ err.textContent = 'Where should they deliver?'; return; }
      try{ localStorage.setItem('nifti-store-buyer', JSON.stringify(who)); }catch(e){}
      btn.disabled = true; btn.textContent = 'Sending…';
      rpc('submit_store_order', {p_slug: SLUG, p_name: who.name || null, p_business: who.biz || null, p_phone: who.phone || null, p_address: who.addr,
        p_items: Object.keys(S.cart).map(function(p){ return {product: p, qty: S.cart[p]}; }), p_note: v('ns-note') || null, p_src: src() || null, p_needed_by: v('ns-date') || null, p_ref: v('ns-ref') || null})
      .then(function(r){
        S.cart = {}; save(); document.getElementById('ns-modal').remove();
        root.innerHTML = '<div class="ns-wrap"><div class="ns-card ns-center"><div style="font-size:46px">✅</div><h1>Order sent to ' + esc(d.name) + '</h1>'
          + '<div class="ns-about">' + esc(r.po_number) + (r.prices_known ? ' · ' + peso(r.total) : '') + '. They\'ll confirm it soon' + (d.phone ? ', or call them at ' + esc(d.phone) : '') + '.</div>'
          + '<a class="ns-btn ns-big" href="' + BASE + '#o/' + encodeURIComponent(r.token) + '">Track your order →</a><div class="ns-small">Save this link or screenshot this page. It shows every update.</div></div>'
          + (r.claim_code ? '<div class="ns-card ns-green"><b>Reorder in one tap next time</b><div class="ns-about">Create a free Nifti account. This order and your details will already be there.</div><a class="ns-btn2 ns-big" href="' + BASE + '#join/' + encodeURIComponent(r.claim_code) + '/b">Create free account →</a></div>' : '')
          + '</div>';
        window.scrollTo(0, 0);
      }).catch(function(e){ btn.disabled = false; btn.textContent = 'Send order →'; err.textContent = e.message; });
    }
  };

  var css = document.createElement('style');
  css.textContent = 'body{margin:0;background:#F4F7F5;color:#1B1D21;font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;font-size:16px}'
    + '.ns-wrap{max-width:640px;margin:0 auto;padding:12px 12px 110px}.ns-top{display:flex;justify-content:space-between;align-items:center;padding:4px 4px 10px}.ns-brand{color:#1B6B40;font-size:20px}'
    + '.ns-card{background:#fff;border:1px solid #E1E7E3;border-radius:14px;padding:16px;margin-bottom:12px}.ns-green{background:#E6F2EA;border-color:#1B6B40}.ns-row{display:flex;align-items:center;gap:12px}.ns-gap{gap:8px;margin-top:12px;flex-wrap:wrap}'
    + '.ns-av{width:54px;height:54px;flex:0 0 54px;border-radius:14px;background:#1B6B40;color:#fff;font-weight:800;font-size:21px;display:flex;align-items:center;justify-content:center}'
    + 'h1{font-size:21px;margin:0;line-height:1.25}h2{font-size:19px;margin:0 0 8px}.ns-ok{color:#1B6B40}.ns-dim{opacity:.72;font-size:14px}.ns-small{font-size:12.5px;opacity:.7;margin-top:4px}.ns-center{text-align:center}'
    + '.ns-head{font-weight:700;margin-top:10px}.ns-about{font-size:14.5px;opacity:.85;margin:4px 0 8px;white-space:pre-line}.ns-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}.ns-chips span{font-size:13px;background:#F4F7F5;border:1px solid #E1E7E3;border-radius:999px;padding:4px 10px}'
    + '.ns-btn,.ns-btn2{display:inline-block;border-radius:10px;padding:10px 16px;font-size:15px;font-weight:700;text-decoration:none;cursor:pointer;border:1.5px solid #1B6B40;font-family:inherit}.ns-btn{background:#1B6B40;color:#fff}.ns-btn2{background:#fff;color:#1B1D21;border-color:#D5DDD8}.ns-big{display:block;width:100%;box-sizing:border-box;text-align:center;margin:12px 0 6px;padding:13px}'
    + '.ns-search{width:100%;box-sizing:border-box;padding:11px 12px;border:1px solid #D5DDD8;border-radius:10px;font-size:16px;margin-bottom:6px}.ns-item{display:flex;align-items:center;gap:10px;padding:11px 0;border-bottom:1px solid #EEF2EF}.ns-grow{flex:1;min-width:0}.ns-name{font-weight:700}.ns-price{font-size:14px}.ns-sale{color:#C0392B}.ns-price s{opacity:.55}.ns-tag{font-size:11.5px;font-weight:800;color:#C0392B;background:#FBE6E3;border-radius:6px;padding:1px 6px}'
    + '.ns-qty{display:flex;align-items:center;gap:4px}.ns-qty button{min-width:38px;height:38px;border-radius:10px;border:1px solid #D5DDD8;background:#fff;font-size:19px;font-weight:800;cursor:pointer}.ns-qty input{width:58px;height:38px;text-align:center;border:1px solid #D5DDD8;border-radius:10px;font-size:16px;box-sizing:border-box}.ns-qty .ns-add{padding:0 16px;background:#1B6B40;color:#fff;border-color:#1B6B40;font-size:15px}'
    + '.ns-empty{padding:16px;text-align:center;opacity:.7}.ns-foot{text-align:center;font-size:13px;opacity:.65;margin:14px 0}.ns-foot a{color:#1B6B40}'
    + '.ns-cart{position:fixed;left:0;right:0;bottom:0;background:#fff;border-top:1px solid #E1E7E3;box-shadow:0 -4px 16px rgba(0,0,0,.08);padding:12px 16px calc(12px + env(safe-area-inset-bottom));display:flex;justify-content:space-between;align-items:center;gap:10px}.ns-hide{display:none}'
    + '.ns-modal{position:fixed;inset:0;background:rgba(20,20,20,.45);z-index:10;display:flex;align-items:flex-end;justify-content:center}.ns-sheet{background:#fff;border-radius:16px 16px 0 0;padding:18px 16px 24px;width:100%;max-width:560px;max-height:92vh;overflow-y:auto;box-sizing:border-box}'
    + '.ns-sheet label{display:block;font-size:13.5px;font-weight:700;margin:10px 0 4px}.ns-sheet input{width:100%;box-sizing:border-box;padding:11px 12px;border:1px solid #D5DDD8;border-radius:10px;font-size:16px;font-family:inherit}'
    + '.ns-line{display:flex;justify-content:space-between;gap:8px;font-size:14.5px;padding:3px 0}.ns-total{font-weight:800;border-top:1px solid #E1E7E3;margin-top:6px;padding-top:6px}.ns-note{background:#E6F2EA;border-radius:10px;padding:10px;font-size:14px;margin-top:8px}.ns-err{color:#C0392B;font-weight:600;font-size:14px;margin-top:8px}';
  document.head.appendChild(css);

  if(!SLUG){ root.innerHTML = '<div class="ns-wrap"><div class="ns-card">This store link looks incomplete.</div></div>'; return; }
  try{ S.cart = JSON.parse(localStorage.getItem('nifti-cart:' + SLUG) || '{}') || {}; }catch(e){}
  root.innerHTML = '<div class="ns-wrap"><div class="ns-card">Loading the store…</div></div>';
  rpc('get_store', {p_slug: SLUG, p_src: src() || null}).then(function(d){
    if(!d){ root.innerHTML = '<div class="ns-wrap"><div class="ns-card ns-center"><div style="font-size:40px">🏪</div><h1>This store isn\'t open right now</h1><p class="ns-about">The link may be wrong, or the store is closed for now. Message the seller directly.</p></div></div>'; return; }
    S.d = d; document.title = d.name + ' · Order online';
    Object.keys(S.cart).forEach(function(p){ if(!d.items.some(function(i){ return i.product === p; })) delete S.cart[p]; });
    var re = new URLSearchParams(location.search).get('re');
    if(!re) return render();
    // a reorder link from the seller: their usual order goes in the cart, their details in the form
    rpc('get_reorder_cart', {p_token: re}).then(function(c){
      if(c && c.items && c.items.length){
        S.cart = {}; c.items.forEach(function(it){ if(d.items.some(function(i){ return i.product === it.product; }) && Number(it.qty) > 0) S.cart[it.product] = Number(it.qty); });
        S.reorder = Object.keys(S.cart).length > 0; save();
        if(c.buyer){ try{ var sv = JSON.parse(localStorage.getItem('nifti-store-buyer') || '{}') || {}; ['name', 'biz', 'phone', 'addr'].forEach(function(k){ if(!sv[k] && c.buyer[k]) sv[k] = c.buyer[k]; }); localStorage.setItem('nifti-store-buyer', JSON.stringify(sv)); }catch(e){} }
      }
      render();
    }).catch(function(){ render(); });
  }).catch(function(){ root.innerHTML = '<div class="ns-wrap"><div class="ns-card ns-center"><h1>Couldn\'t load the store</h1><p class="ns-about">Check your connection and try again.</p><button class="ns-btn" onclick="location.reload()">Try again</button></div></div>'; });
})();
