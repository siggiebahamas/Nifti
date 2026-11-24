/* Round 63: strengthen the connected-operations story without changing Nifti's visual identity.
   No AI claims, no new services, no external data collection, no permission changes. */
(function(){
  'use strict';
  const ready = fn => document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn, {once:true}) : fn();
  const esc = s => String(s || '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));



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
    if(intro.dataset.mode===mode) return; intro.dataset.mode=mode;
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
      const wrapped=function(){const r=base.apply(this,arguments);setTimeout(()=>{paintDiscoverGuide();try{const supplier=page.querySelector('.nfx-switch button:nth-child(2) small');if(supplier)supplier.textContent='Suppliers who choose to be found';}catch(e){}},0);return r;};
      wrapped._nf63=true;window.nfDiscoverLayout=wrapped;
      try{nfDiscoverLayout=wrapped;}catch(e){}
    }
    paintDiscoverGuide();
  }
  function run(){
    dashboardOnlySetup(); wording(); // Round 72: Find customers guidance now comes from r72.js (nf72Discover)
  }
  ready(run);
})();
