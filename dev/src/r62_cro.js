/* Round 62: CRO, honest customer-link demo, quick start and Home priorities.
   Keeps the existing marketing design system; changes copy and sample behaviour only. */
(function(){
  'use strict';
  function ready(fn){ if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, {once:true}); else fn(); }
  function txt(el, value){ if(el) el.textContent = value; }
  function html(el, value){ if(el) el.innerHTML = value; }
  function safe(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }





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
            '<button type="button" class="nf26-way" onclick="nf26CloseStart(); go(\'collections\'); setTimeout(function(){ if(typeof openAddCustomerForm===\'function\') openAddCustomerForm(); },250)"><span class="n">2</span><span class="ic">' + (typeof nf26Svg === 'function' ? nf26Svg('people') : '') + '</span><span class="tx"><b>Add your first customer</b><span>Save one customer contact. Add suppliers whenever you need them; they can respond to links without registering.</span><em>About 1 minute</em></span><span class="go">›</span></button>' +
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
    // Round 73: the Home start-card rewrite was removed. It replaced the card's HTML on every repaint pass, which
    // triggered another pass: an endless loop (~150 rewrites a second) that made every page click lag.
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

  function dashboard(){
    if(typeof window.renderMistHome === 'function' && !window.renderMistHome._nf62){
      const base = window.renderMistHome;
      const wrapped = function(){
        const result = base.apply(this, arguments);
        setTimeout(prioritizeHome, 0);
        return result;
      };
      wrapped._nf62 = true; window.renderMistHome = wrapped;
      try{ renderMistHome = wrapped; }catch(e){}
      try{ window.renderHomeV2 = wrapped; renderHomeV2 = wrapped; }catch(e){}
    }
  }
  function prioritizeHome(){
    const home = document.getElementById('mhHome'); if(!home) return;
    const rows = home.querySelector('.rows'), mosaic = home.querySelector('.mosaic'); if(!rows) return;
    const sections = Array.from(rows.querySelectorAll(':scope > .sect'));
    const what = sections.find(el => /What to do/i.test((el.querySelector('h4') || {}).textContent || ''));
    const order = sections.find(el => /Where every order is/i.test((el.querySelector('h4') || {}).textContent || ''));
    const stock = document.getElementById('srCard');
    const alerts = Array.from(rows.children).filter(el => el.classList && el.classList.contains('alertline'));
    if(what) rows.insertBefore(what, rows.firstChild);
    let anchor = what || rows.firstChild;
    alerts.forEach(el => { rows.insertBefore(el, anchor ? anchor.nextSibling : rows.firstChild); anchor = el; });
    if(mosaic) rows.insertBefore(mosaic, anchor ? anchor.nextSibling : rows.firstChild);
    if(stock && order) rows.insertBefore(stock, order);
    // Show the three most urgent actions first, with an explicit way to expand the rest.
    if(what){
      const urgent = what.querySelector('.lane');
      if(urgent){
        const tasks = Array.from(urgent.querySelectorAll('.task'));
        if(tasks.length > 3){
          let more = urgent.querySelector('.nf62-more');
          if(!more){ more = document.createElement('button'); more.type = 'button'; more.className = 'more nf62-more'; urgent.appendChild(more); }
          let expanded = false; try{ expanded = !!MH.open.laner; }catch(e){}
          tasks.forEach((task,i) => { task.hidden = !expanded && i >= 3; });
          more.textContent = expanded ? 'Show fewer' : '+ ' + (tasks.length - 3) + ' more urgent tasks';
          more.onclick = function(){ try{ MH.open.laner = !MH.open.laner; renderMistHome(); }catch(e){} };
        }
      }
    }
  }

  ready(function(){
    // Round 72: the landing page is handled by r72_site.js; only onboarding stays here.
    onboarding();
    // Existing Home renderer and all role permissions remain intact; the source module
    // moves the first-action lane above metrics and limits the collapsed urgent lane to 3.
  });
})();