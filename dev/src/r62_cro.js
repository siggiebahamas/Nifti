/* Round 62: CRO, honest customer-link demo, quick start and Home priorities.
   Keeps the existing marketing design system; changes copy and sample behaviour only. */
(function(){
  'use strict';
  function ready(fn){ if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, {once:true}); else fn(); }
  function txt(el, value){ if(el) el.textContent = value; }
  function html(el, value){ if(el) el.innerHTML = value; }
  function safe(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

  function marketing(){
    const page = document.getElementById('view-index'); if(!page) return;
    const hero = page.querySelector('.f4-hero');
    if(hero){
      const h = hero.querySelector('h1');
      if(h) h.innerHTML = 'Keep every order <span>moving.</span>';
      const p = hero.querySelector('p');
      if(p) p.textContent = 'Run customer orders, supplier purchases, stock, deliveries, collections and your books in one place. Your team uses Nifti. Customers and suppliers handle their part through simple links.';
      let promise = hero.querySelector('.nf62-link-promise');
      if(!promise){
        promise = document.createElement('p'); promise.className = 'nf62-link-promise';
        promise.innerHTML = '<strong>One business runs Nifti. Everyone else just taps a link.</strong> No account or download is required for the basic customer and supplier actions. Joining Nifti is optional for a richer, connected experience.';
        const cta = hero.querySelector('.f4-hero-cta');
        if(cta && cta.parentNode) cta.parentNode.insertBefore(promise, cta.nextSibling);
        else hero.appendChild(promise);
      }
    }
    const tryHead = page.querySelector('#mkTry .f5-head h2');
    if(tryHead) tryHead.innerHTML = 'A customer sends a message. <span>Your team takes it from there.</span>';
    const tryP = page.querySelector('#mkTry .f5-head p');
    if(tryP) tryP.textContent = 'Nifti helps your team turn incoming messages and purchase orders into a clear draft. Your team checks it, then shares a link for the customer to confirm or request a change.';
    const send = page.querySelector('#mkTry .mk-try-send');
    if(send){
      txt(send.querySelector('b'), 'You review the order, then share a secure link');
      txt(send.querySelector('small'), 'The customer can confirm, decline or request a change in their browser. A Nifti account is not required; joining is optional.');
    }
    // The final call-to-action keeps the existing section class and typography.
    let cta = page.querySelector('.cta-band');
    if(!cta){ cta = document.createElement('section'); cta.className = 'cta-band'; page.appendChild(cta); }
    html(cta, '<div class="wrap"><h2>Keep your whole operation in view.</h2><p>Your team works in Nifti. Customers and suppliers respond through simple links—and can join Nifti whenever they want a more connected experience.</p><div class="f4-hero-cta"><button type="button" class="btn btn-hero-primary mk-big" onclick="mk52Start()">Start free</button><button type="button" class="btn btn-hero-outline mk-big" onclick="startDemoOrder()">Try the demo</button></div></div>');

    // Rebind the demo button so the sample never claims to send or save a real order.
    const oldGo = document.getElementById('mkTryGo');
    if(oldGo){
      const go = oldGo.cloneNode(true); oldGo.parentNode.replaceChild(go, oldGo);
      go.addEventListener('click', runOrderPreview);
    }
    const input = document.getElementById('mkTryIn');
    if(input && !input.dataset.nf62Bound){
      input.dataset.nf62Bound = '1';
      input.addEventListener('keydown', e => { if(e.key === 'Enter' && (e.ctrlKey || e.metaKey)){ e.preventDefault(); runOrderPreview(); } });
    }
  }

  function runOrderPreview(){
    const input = document.getElementById('mkTryIn'), out = document.getElementById('mkTryOut');
    if(!input || !out) return;
    const message = input.value.trim();
    if(!message){ out.innerHTML = '<p class="mk-try-note">Type a sample order message first.</p>'; return; }
    let parsed = {lines:[], ask:[], when:''};
    try{ if(typeof mk52Parse === 'function') parsed = mk52Parse(message); }catch(e){}
    const lines = parsed.lines || [], ask = parsed.ask || [];
    if(!lines.length && !ask.length){
      out.innerHTML = '<div class="mk-try-order"><b>Nifti needs a little more detail</b><p class="mk-try-note">Try something like “10 sako semento, 5 rolls of wire, deliver tomorrow”. In a real account, the item list and prices come from that business.</p></div>';
      return;
    }
    const peso = n => typeof mk52Peso === 'function' ? mk52Peso(n) : '₱' + Math.round(n).toLocaleString('en-PH');
    const esc = s => typeof mk52Esc === 'function' ? mk52Esc(s) : safe(s);
    const total = lines.reduce((n,l)=>n + (Number(l.q)||0) * Number(l.item && l.item.price || 0),0);
    out.innerHTML = '<div class="mk-try-order"><div class="mk-try-oh"><span class="spark">✦</span><b>Draft order · Bayview Construction</b><small>' + (lines.length + ask.length) + ' line(s)</small></div>' +
      lines.map(l => '<div class="mk-try-row"><span>' + esc(l.item.name) + ' × ' + (Number(l.q)||1) + (l.guessed ? ' (check quantity)' : '') + '</span><b>' + peso((Number(l.q)||1) * Number(l.item.price)) + '</b></div>').join('') +
      ask.map(a => '<div class="mk-try-row q"><span>' + esc(a.name) + (a.q ? ' × ' + a.q : '') + '</span><b>Needs review</b></div>').join('') +
      (lines.length ? '<div class="mk-try-tot"><span>Sample total</span><b>' + peso(total) + '</b></div>' : '') +
      '<p class="mk-try-note">' + (parsed.when ? esc(parsed.when) + ' · ' : '') + 'Illustrative draft only. Your team reviews all quantities, items and prices.</p>' +
      '<div class="mk-try-send"><span class="ok">✓</span><div><b>Next: share a customer link</b><small>They can confirm, decline or request a change without creating a Nifti account. Joining Nifti is optional.</small></div><button type="button" class="btn btn-outline" onclick="nf62PreviewCustomer()">Preview customer link →</button></div></div>' +
      '<p class="mk-try-note">Sample only. No real order is created, sent, saved or charged.</p>';
  }

  window.nf62PreviewCustomer = function(){
    const out = document.getElementById('mkTryOut'); if(!out) return;
    let panel = document.getElementById('nf62CustomerPreview');
    if(!panel){
      panel = document.createElement('div'); panel.id = 'nf62CustomerPreview'; panel.className = 'mk-try-order';
      out.appendChild(panel);
    }
    html(panel, '<div class="mk-try-oh"><span class="spark">↗</span><b>Customer view · sample link</b><small>Browser preview</small></div><p>Bayview Construction Co. has an order to review.</p><p class="mk-try-note">The customer sees the order details and can choose an action. No account is needed for this basic response.</p><div class="mk-try-send"><button type="button" class="btn btn-primary" onclick="nf62CustomerResponse(\'confirmed\')">Confirm order</button><button type="button" class="btn btn-outline" onclick="nf62CustomerResponse(\'change\')">Request a change</button><button type="button" class="btn btn-outline" onclick="nf62CustomerResponse(\'declined\')">Decline</button></div><p class="mk-try-note">Demonstration only. This does not contact Bayview or change a real order.</p>');
  };
  window.nf62CustomerResponse = function(kind){
    const panel = document.getElementById('nf62CustomerPreview'); if(!panel) return;
    const label = kind === 'confirmed' ? 'Confirmed in this sample' : kind === 'change' ? 'Change requested in this sample' : 'Declined in this sample';
    const note = document.createElement('p'); note.className = 'mk-try-note'; note.textContent = label + ' — in a real workflow, the Nifti business user sees this response on the order.';
    const prior = panel.querySelector('.nf62-response'); if(prior) prior.remove();
    note.classList.add('nf62-response'); panel.appendChild(note);
  };

  function onboarding(){
    if(typeof window.nf26PaintStart === 'function' && !window.nf26PaintStart._nf62){
      const base = window.nf26PaintStart;
      const wrapped = function(){
        const r = base.apply(this, arguments);
        const ov = document.getElementById('nf26StartOv');
        if(!ov || ov.hidden) return r;
        let view = ''; try{ view = NF26S.view; }catch(e){}
        if(view === 'home'){
          txt(ov.querySelector('h2'), 'Get your first workflow running');
          const p = ov.querySelector('.nf20-sh p');
          txt(p, 'Start with three small steps. You can finish the rest later; customers and suppliers do not need Nifti accounts to respond to your links.');
          const ways = ov.querySelector('.nf26-ways');
          if(ways) html(ways,
            '<button type="button" class="nf26-way" onclick="nf26CloseStart(); go(\'inventory\')"><span class="n">1</span><span class="ic">' + (typeof nf26Svg === 'function' ? nf26Svg('shop') : '') + '</span><span class="tx"><b>Add or import one item</b><span>Start with one product and its price. Excel/CSV import is available too.</span><em>About 1 minute</em></span><span class="go">›</span></button>' +
            '<button type="button" class="nf26-way" onclick="nf26CloseStart(); go(\'collections\'); setTimeout(function(){ if(typeof openAddCustomerForm===\'function\') openAddCustomerForm(); },250)"><span class="n">2</span><span class="ic">' + (typeof nf26Svg === 'function' ? nf26Svg('people') : '') + '</span><span class="tx"><b>Add one customer or supplier</b><span>Save the contact you deal with most. They can respond to links without registering.</span><em>About 1 minute</em></span><span class="go">›</span></button>' +
            '<button type="button" class="nf26-way" onclick="nf26CloseStart(); go(\'orders\'); setTimeout(function(){ if(typeof openCustomerPoImport===\'function\') openCustomerPoImport(); },250)"><span class="n">3</span><span class="ic">' + (typeof nf26Svg === 'function' ? nf26Svg('file') : '') + '</span><span class="tx"><b>Create and share your first order</b><span>Review the order, then send the customer a link to confirm or request a change.</span><em>About 1 minute</em></span><span class="go">›</span></button>');
          const foot = ov.querySelector('.nf26-startfoot span');
          if(foot) foot.textContent = 'You can add more people and products whenever you are ready.';
        } else if(view === 'snap'){
          const sheet = ov.querySelector('.nf20-sheet');
          if(sheet) html(sheet, '<div class="nf20-sh"><div><h2>Notebook import is paused during beta</h2><p>The notebook-reading feature is being held back for now. Your existing records are safe. Use manual entry or Excel/CSV import instead.</p></div><button type="button" class="nf20-x" onclick="nf26CloseStart()" aria-label="Close">✕</button></div><div class="nf26-sgrid two"><div class="nf26-scard"><b>Enter items manually</b><p>Add products and prices directly in Stock.</p><button type="button" class="btn btn-primary" onclick="nf26CloseStart(); go(\'inventory\')">Open Stock</button></div><div class="nf26-scard"><b>Import Excel or CSV</b><p>Bring in your existing item list without using the notebook reader.</p><button type="button" class="btn btn-outline" onclick="nf26CloseStart(); go(\'inventory\'); setTimeout(function(){try{openImportInventoryModal()}catch(e){}},300)">Import item list</button></div></div>');
        } else if(view === 'invite'){
          txt(ov.querySelector('h2'), 'Invite them to Nifti (optional)');
          txt(ov.querySelector('.nf20-sh p'), 'Customers and suppliers can already respond to relevant order, purchase-order and delivery links without registering. Invite them to Nifti only if they want a richer connected experience.');
          const cards = ov.querySelectorAll('.nf26-scard');
          cards.forEach(card => {
            const title = card.querySelector('b'); const desc = card.querySelector('p');
            if(title && /suppliers/i.test(title.textContent)){ txt(title, 'Invite a supplier to Nifti'); txt(desc, 'Optional: a supplier who joins can share a richer catalogue and manage connected transactions. Your purchase-order links still work without an account.'); }
            if(title && /customers/i.test(title.textContent)){ txt(title, 'Invite a customer to Nifti'); txt(desc, 'Optional: a customer who joins can enjoy a more connected ordering experience. They can still confirm, decline or request changes through a link without registering.'); }
            card.querySelectorAll('.nf26-prog,.nf26-offer').forEach(el => el.remove());
            const b = card.querySelector('button'); if(b) txt(b, 'Optional Nifti invitation');
          });
        } else if(view === 'file'){
          ov.querySelectorAll('.nf26-scard').forEach(card => {
            if(/Only on paper|snap a photo/i.test(card.textContent)){
              html(card, '<b>Manual entry</b><p>Notebook reading is paused during beta. Enter the information directly or use an Excel/CSV file.</p><button type="button" class="btn btn-outline" onclick="nf26CloseStart(); go(\'inventory\')">Enter items in Stock</button>');
            }
          });
        }
        return r;
      };
      wrapped._nf62 = true; window.nf26PaintStart = wrapped;
      try{ nf26PaintStart = wrapped; }catch(e){}
    }
    if(typeof window.nf26StartCard === 'function' && !window.nf26StartCard._nf62){
      const base = window.nf26StartCard;
      const wrapped = function(){ const r = base.apply(this, arguments); const card = document.getElementById('nf26Start'); if(card){
        html(card, '<div class="nf26-sch"><div><b>Get your first workflow running</b><span>Three small steps. Everyone outside your business can respond through links without registering.</span></div><button type="button" class="nf26-link" onclick="nf26StartSet(\'hide\',1); document.getElementById(\'nf26Start\').remove()">Hide</button></div><div class="nf26-scb"><button type="button" onclick="go(\'inventory\')"><b>Add one item</b><span>Enter a product and price</span></button><button type="button" onclick="go(\'collections\'); setTimeout(()=>{if(typeof openAddCustomerForm===\'function\')openAddCustomerForm()},200)"><b>Add a customer or supplier</b><span>Save one key contact</span></button><button type="button" onclick="go(\'orders\'); setTimeout(()=>{if(typeof openCustomerPoImport===\'function\')openCustomerPoImport()},200)"><b>Create and share an order</b><span>Send a link for confirmation</span></button></div>');
      } return r; };
      wrapped._nf62 = true; window.nf26StartCard = wrapped;
      try{ nf26StartCard = wrapped; }catch(e){}
    }
    if(typeof window.nf55Paint === 'function' && !window.nf55Paint._nf62){
      const base = window.nf55Paint;
      const wrapped = function(){ const r = base.apply(this, arguments); const dock = document.getElementById('nf55Dock'); if(dock){
        const b = dock.querySelector('.nf55-pill span small'); if(b) txt(b, 'Optional setup checklist');
        const h = dock.querySelector('.nf55-ph b'); if(h) txt(h, 'Optional setup checklist');
        const sub = dock.querySelector('.nf55-ph small'); if(sub && !sub.dataset.nf62) { sub.textContent = 'Start with the 3-minute quick start. These extra tasks can be done anytime.'; sub.dataset.nf62 = '1'; }
      } return r; };
      wrapped._nf62 = true; window.nf55Paint = wrapped;
      try{ nf55Paint = wrapped; }catch(e){}
    }
  }

  ready(function(){
    marketing();
    onboarding();
    // Existing Home renderer and all role permissions remain intact; the source module
    // moves the first-action lane above metrics and limits the collapsed urgent lane to 3.
  });
})();