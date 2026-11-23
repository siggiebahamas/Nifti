/* Round 63: strengthen the connected-operations story without changing Nifti's visual identity.
   No AI claims, no new services, no external data collection, no permission changes. */
(function(){
  'use strict';
  const ready = fn => document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn, {once:true}) : fn();
  const esc = s => String(s || '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  function addHow(){
    const page = document.getElementById('view-index'), hero = page && page.querySelector('.f4-hero');
    if(!page || !hero || page.querySelector('#nf63How')) return;
    const section = document.createElement('section');
    section.id = 'nf63How'; section.className = 'nf63-how';
    section.innerHTML = '<div class="wrap"><div class="f5-head"><div class="p2-burst">HOW IT WORKS</div><h2>One business. <span>One connected way to work.</span></h2><p>Nifti keeps the moving parts of your business connected—while the people you work with use the simple links they already understand.</p></div><div class="nf63-flow"><article class="nf63-step"><div class="nf63-num">01</div><div class="nf63-visual nf63-v1"><span class="nf63-bubble">New order received</span><span class="nf63-bubble alt">Viber · Call · Store</span><span class="nf63-visual-icon">↗</span></div><h3>Orders come in</h3><p>Record customer orders and supplier purchases in one clear place. Review the details before anything is confirmed.</p></article><article class="nf63-step"><div class="nf63-num">02</div><div class="nf63-visual nf63-v2"><span class="nf63-node">Orders</span><i>↔</i><span class="nf63-node">Stock</span><i>↔</i><span class="nf63-node">Delivery</span><span class="nf63-node wide">Collections · Books</span></div><h3>One action updates the work around it</h3><p>Orders connect to stock, purchasing, delivery, collections and your records—so your team spends less time copying information between places.</p></article><article class="nf63-step"><div class="nf63-num">03</div><div class="nf63-visual nf63-v3"><span class="nf63-link">Secure link ↗</span><span class="nf63-check">✓</span><span class="nf63-small">Customer confirmed</span></div><h3>Everyone stays in sync</h3><p>Your team uses Nifti. Customers and suppliers can confirm, respond and follow their part through a browser link—no Nifti account or download required for basic actions.</p></article></div><div class="nf63-foot"><b>One business runs Nifti. Everyone else just taps a link.</b><span>Joining Nifti is always optional for a richer connected experience.</span></div></div>';
    hero.insertAdjacentElement('afterend', section);
  }
  function addOutcomes(){
    const page = document.getElementById('view-index');
    if(!page || page.querySelector('#nf63Outcomes')) return;
    const anchor = page.querySelector('#mkHow') || page.querySelector('#mkCalc') || page.querySelector('#mkPlans');
    if(!anchor) return;
    const section = document.createElement('section'); section.id = 'nf63Outcomes'; section.className = 'nf63-outcomes';
    section.innerHTML = '<div class="wrap"><div class="f5-head"><div class="p2-burst">WHAT CHANGES FOR YOU</div><h2>Less chasing. <span>More control.</span></h2><p>Imagine knowing what is happening across your business—without having to ask five people or search through yesterday’s messages.</p></div><div class="nf63-out-grid"><button type="button" class="nf63-out on" aria-expanded="true"><span class="nf63-out-ic">↗</span><b>Orders don’t get lost in chat</b><small>See what came in, what needs confirming and what is already moving.</small><em>See your order flow ↓</em></button><button type="button" class="nf63-out" aria-expanded="false"><span class="nf63-out-ic">₱</span><b>You know who still owes you</b><small>Keep balances, promises and follow-ups visible instead of relying on memory.</small><em>Stay on top of collections ↓</em></button><button type="button" class="nf63-out" aria-expanded="false"><span class="nf63-out-ic">▦</span><b>Stock and purchasing stay connected</b><small>See what is available, what is running low and what is on the way.</small><em>Keep stock moving ↓</em></button><button type="button" class="nf63-out" aria-expanded="false"><span class="nf63-out-ic">✓</span><b>Your team works with clearer ownership</b><small>Assigned work, confirmations and recorded activity make it easier to follow up.</small><em>Know what’s happening ↓</em></button></div><div class="nf63-out-detail" aria-live="polite"><div><small>THE DIFFERENCE</small><b>One order becomes one connected workflow.</b><p>When an order is updated, the relevant people and next steps are easier to see—without re-entering the same information in several places.</p></div><div class="nf63-out-art"><span>ORDER</span><i>→</i><span>STOCK</span><i>→</i><span>DELIVERY</span><i>→</i><span>PAYMENT</span></div></div></div></section>';
    anchor.insertAdjacentElement('beforebegin', section);
    const cards = [...section.querySelectorAll('.nf63-out')], detail = section.querySelector('.nf63-out-detail');
    const copy = [
      ['One order becomes one connected workflow.','When an order is updated, the relevant people and next steps are easier to see—without re-entering the same information in several places.','ORDER → STOCK → DELIVERY → PAYMENT'],
      ['Collections become easier to follow.','Keep customer balances, payment promises and reminders visible to the people responsible for following up.','BILL → REMINDER → PAYMENT → RECORD'],
      ['Purchasing responds to what stock needs.','Use your existing stock and purchase records to see what needs attention before a shortage disrupts an order.','STOCK → REORDER → SUPPLIER → RECEIPT'],
      ['The owner gets a clearer view of the day.','See what is pending, what has been completed and which exceptions need your attention—while staff focus on their assigned work.','ASSIGN → ACT → CONFIRM → REVIEW']
    ];
    cards.forEach((card,i)=>card.addEventListener('click',()=>{
      cards.forEach((c,j)=>{c.classList.toggle('on',i===j);c.setAttribute('aria-expanded',String(i===j));});
      const [h,p,flow]=copy[i]; detail.querySelector('b').textContent=h; detail.querySelector('p').textContent=p;
      detail.querySelector('.nf63-out-art').textContent=flow;
    }));
  }
  function cleanMarketing(){
    const page=document.getElementById('view-index'); if(!page) return;
    // Remove the two public demonstrations that imply AI notebook/order-reading capability.
    page.querySelectorAll('#mkTry, #mkNotebook, .mk-try, .mk-nbsec').forEach(el=>el.remove());
    // Remove any remaining marketing copy that advertises AI order-reading or notebook extraction.
    page.querySelectorAll('h1,h2,h3,p,li,small,b,strong').forEach(el=>{
      if(el.closest('#view-app')) return;
      if(/AI notebook reader|read your notebook|turns? .*message into (?:a )?draft|orders? from chat/i.test(el.textContent||'')){
        const section=el.closest('section'); if(section && !section.id.startsWith('nf63')) section.remove();
      }
    });
    page.querySelectorAll('a,button').forEach(el=>{
      if(/notebook reader|try the order reader|orders from chat/i.test(el.textContent||'')) el.remove();
    });
    addHow(); addOutcomes();
    const h=page.querySelector('#nf63Outcomes .f5-head h2');
    if(h) h.innerHTML='Less chasing. <span>More control.</span>';
    const old=page.querySelector('#mkHow .f5-head h2');
    if(old && /what this means for you/i.test(old.textContent)) old.innerHTML='A calmer day. <span>A business you can see.</span>';
  }
  function dashboardOnlySetup(){
    const dock=document.getElementById('nf55Dock'); if(!dock) return;
    const app=document.getElementById('view-app'), active=app && app.querySelector('.app-page.active');
    const dash=!!(active && active.id==='page-dashboard');
    if(dock.hidden === dash) dock.hidden=!dash;
    const aria=String(!dash); if(dock.getAttribute('aria-hidden') !== aria) dock.setAttribute('aria-hidden',aria);
  }
  function wording(){
    const root=document.getElementById('page-payroll') || document.getElementById('view-app');
    if(!root) return;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT); let n;
    while((n=walker.nextNode())) if(n.nodeValue && /\bVale to collect\b/.test(n.nodeValue)) n.nodeValue=n.nodeValue.replace(/\bVale to collect\b/g,'Value to collect');
  }
  function paintDiscoverGuide(){
    const page=document.getElementById('page-discover'), intro=page && page.querySelector('#nf63DiscoverIntro'); if(!intro) return;
    let mode='suppliers'; try{ mode=typeof NFX!=='undefined' ? NFX.mode : 'suppliers'; }catch(e){}
    const title=intro.querySelector('b'), p=intro.querySelector('p'), actions=intro.querySelector('.nf63-discover-actions');
    if(mode==='customers'){
      if(title) title.textContent='Find businesses that buy what you sell';
      if(p) p.textContent='Search businesses that have chosen to be discoverable. Match what they buy with your products, send a personal introduction or price list, and save promising contacts as leads. You can also search Google Maps for businesses outside Nifti.';
      if(actions) actions.innerHTML='<button type="button" class="btn btn-primary" id="nf63Browse">Explore potential customers</button><button type="button" class="btn btn-outline" id="nf63Lead">Add a lead manually</button>';
    }else{
      if(title) title.textContent='Find suppliers who choose to be discovered';
      if(p) p.textContent='Browse supplier profiles and catalogues that businesses have chosen to share. Review what they offer, then request a connection if it looks relevant. Your existing suppliers, prices and order history remain private.';
      if(actions) actions.innerHTML='<button type="button" class="btn btn-primary" id="nf63Browse">Browse supplier listings</button><button type="button" class="btn btn-outline" id="nf63Profile">Review my public profile</button>';
    }
    const browse=intro.querySelector('#nf63Browse');
    if(browse) browse.addEventListener('click',()=>{
      const target=mode==='customers' ? page.querySelector('#nfFind .nf36f-tools, #nfFind .nf36f-grid, #nfFind') : page.querySelector('#discCategoryChips, #discGrid');
      if(target) target.scrollIntoView({behavior:'smooth',block:'center'});
    });
    const lead=intro.querySelector('#nf63Lead');
    if(lead) lead.addEventListener('click',()=>{try{go('followups');setTimeout(()=>{if(typeof fuAddLead==='function')fuAddLead()},180)}catch(e){}});
    const profile=intro.querySelector('#nf63Profile');
    if(profile) profile.addEventListener('click',()=>{const target=page.querySelector('#discPublicToggle');if(target)target.scrollIntoView({behavior:'smooth',block:'center'});});
  }
  function discoverGuard(){
    const page=document.getElementById('page-discover'); if(!page) return;
    if(!page.querySelector('#nf63DiscoverIntro')){
      const head=page.querySelector(':scope > .page-head'); if(!head) return;
      const intro=document.createElement('section'); intro.id='nf63DiscoverIntro'; intro.className='nf63-discover';
      intro.innerHTML='<div><b>Find customers and suppliers on your terms</b><p>Explore businesses that choose to be discoverable. Your existing relationships and private business information stay protected.</p></div><div class="nf63-discover-actions"></div>';
      head.insertAdjacentElement('afterend',intro);
    }
    if(typeof window.nfDiscoverLayout==='function' && !window.nfDiscoverLayout._nf63){
      const base=window.nfDiscoverLayout;
      const wrapped=function(){const r=base.apply(this,arguments);setTimeout(paintDiscoverGuide,0);return r;};
      wrapped._nf63=true;window.nfDiscoverLayout=wrapped;
      try{nfDiscoverLayout=wrapped;}catch(e){}
    }
    paintDiscoverGuide();
  }
  function run(){
    cleanMarketing(); dashboardOnlySetup(); wording(); discoverGuard();
  }
  ready(run);
  const mo=new MutationObserver(()=>{clearTimeout(window.__nf63t);window.__nf63t=setTimeout(run,180);});
  ready(()=>mo.observe(document.body,{subtree:true,childList:true,characterData:true}));
})();
