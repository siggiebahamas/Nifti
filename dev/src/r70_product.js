/* Round 70 — practical sales visibility, cash evidence and navigation polish. */
(function(){
 'use strict';
 const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const peso=n=>'₱'+(Math.round((Number(n)||0)*100)/100).toLocaleString('en-PH',{minimumFractionDigits:0,maximumFractionDigits:2});
 const own=row=>{
  if(!row)return false;
  let uid=null;try{uid=typeof currentUserId!=='undefined'?currentUserId:null;}catch(e){}
  if(uid&&row.byId)return String(uid)===String(row.byId);
  let me='';try{me=typeof bkMe==='function'?bkMe():'';}catch(e){}
  return !!(me&&row.by&&String(row.by).trim().toLowerCase()===String(me).trim().toLowerCase());
 };
 function salesVisibility(){try{return bkSettings().sales_visibility==='own'?'own':'business';}catch(e){return 'business';}}
 function salesControl(){
  let owner=false;try{owner=typeof getEffectiveRoles==='function'&&getEffectiveRoles().includes('Owner');}catch(e){}if(!owner)return '';
  const mode=salesVisibility();
  return '<section class="panel-card nf70-sales-control"><div><b>Who can view the sales book?</b><p>Sales are shared business records. Choose whether staff can review the full store or only records entered under their own Nifti account.</p></div><label><span>Staff sales visibility</span><select aria-label="Staff sales visibility" onchange="bkSaveSettings({sales_visibility:this.value}).then(()=>{showToast(this.value===\'business\'?\'Staff can now view business-wide sales.\':\'Staff will see records entered under their own account.\',\'success\');renderSalesBooksPage()})"><option value="business" '+(mode==='business'?'selected':'')+'>Business-wide sales for staff</option><option value="own" '+(mode==='own'?'selected':'')+'>Only their own recorded entries</option></select></label></section>';
 }
 function wrapSales(){
  if(typeof renderSalesBooksPage!=='function'||renderSalesBooksPage._nf70)return;
  const base=renderSalesBooksPage;
  const wrapped=function(){
   const all=BK.sales,priv=typeof booksCanSeeTotals==='function'&&booksCanSeeTotals(),restrict=!priv&&salesVisibility()==='own';
   if(restrict&&Array.isArray(all))BK.sales=all.filter(own);
   try{return base.apply(this,arguments);}finally{BK.sales=all;}
  };
  wrapped._nf70=true;try{renderSalesBooksPage=wrapped;}catch(e){}window.renderSalesBooksPage=wrapped;
  // Add the owner control after the original page has rendered; do not impersonate sales commissions.
  const add=()=>{
   const body=document.getElementById('bkSalesBody'),page=document.getElementById('page-sales');
   if(!body||!page)return;
   const old=page.querySelector('.nf70-sales-control');if(old)old.remove();
   if(typeof booksCanSeeTotals==='function'&&booksCanSeeTotals())body.insertAdjacentHTML('beforebegin',salesControl());
   if(!booksCanSeeTotals()&&salesVisibility()==='own'&&!body.querySelector('.nf70-own-note'))
    body.insertAdjacentHTML('afterbegin','<div class="nf70-own-note">Showing sales entries recorded under your Nifti account. This identifies who entered the transaction—not necessarily which staff member personally served the customer.</div>');
  };
  const original=wrapped;
  const decorated=function(){const r=original.apply(this,arguments);add();return r;};
  decorated._nf70=true;try{renderSalesBooksPage=decorated;}catch(e){}window.renderSalesBooksPage=decorated;
 }
 function lineDetails(day){
  const sales=(BK.sales||[]).filter(s=>s.date===day&&!s.voidedAt);
  const lines=[];
  sales.forEach(s=>(s.lines||[]).filter(l=>!l.totalOnly).forEach(l=>{
   const qty=Number(l.qty)||0,unit=Number(l.unitPrice)||0,cost=Number(l.unitCost)||Number((typeof bkItemCost==='function'&&bkItemCost(l.product))||0),list=Number(l.listPrice)||0;
   lines.push({name:l.product,qty,unit,cost,list,customer:s.customer||'Walk-in',pay:s.paidWith||'—',total:qty*unit,costTotal:qty*cost,discount:Math.max(0,list-unit)});
  }));
  if(!lines.length)return '<section class="panel-card nf70-cash-detail"><div class="panel-head"><h2>Sales and stock detail</h2></div><p>No item-level sales were recorded for this date. Sales entered as “Just the total” cannot be split into individual products.</p></section>';
  const groups={};lines.forEach(l=>{const k=l.name;const x=groups[k]=groups[k]||{qty:0,revenue:0,cost:0,discount:0,list:0};x.qty+=l.qty;x.revenue+=l.total;x.cost+=l.costTotal;x.discount+=l.discount*l.qty;x.list+=(l.list||l.unit)*l.qty;});
  const total=Object.values(groups).reduce((a,x)=>({qty:a.qty+x.qty,revenue:a.revenue+x.revenue,cost:a.cost+x.cost,discount:a.discount+x.discount}),{qty:0,revenue:0,cost:0,discount:0});
  return '<section class="panel-card nf70-cash-detail"><div class="panel-head"><div><h2>Sales and stock detail</h2><p>What sold, what stock moved out, and what each line contributed</p></div><span class="nf70-detail-count">'+lines.length+' line items</span></div><div class="nf70-detail-summary"><div><small>Sales recorded</small><b>'+peso(total.revenue)+'</b></div><div><small>Recorded item cost</small><b>'+peso(total.cost)+'</b></div><div><small>Discounts vs. list price</small><b>'+peso(total.discount)+'</b></div></div><div class="nf70-detail-table"><table><thead><tr><th>Item</th><th>Qty</th><th>Unit sale</th><th>Original price</th><th>Unit cost</th><th>Discount</th><th>Line total</th></tr></thead><tbody>'+lines.map(l=>'<tr><td><b>'+esc(l.name)+'</b><small>'+esc(l.customer)+' · '+esc(l.pay)+'</small></td><td>'+l.qty+'</td><td>'+peso(l.unit)+'</td><td>'+(l.list>l.unit?peso(l.list):'—')+'</td><td>'+(l.cost?peso(l.cost):'—')+'</td><td>'+(l.discount?peso(l.discount*l.qty):'—')+'</td><td><b>'+peso(l.total)+'</b></td></tr>').join('')+'</tbody><tfoot><tr><td>Total</td><td>'+total.qty+'</td><td colspan="4">Recorded item cost: '+peso(total.cost)+'</td><td>'+peso(total.revenue)+'</td></tr></tfoot></table></div><p class="nf70-detail-note">Unit cost comes from the cost saved with the sale or Nifti’s current item cost fallback. A “Just the total” sale has no item breakdown. Discounts are shown only where the original list price was saved.</p></section>';
 }
 function wrapCash(){
  if(typeof renderCashCountPage!=='function'||renderCashCountPage._nf70)return;
  const base=renderCashCountPage;
  const wrapped=function(){const r=base.apply(this,arguments);try{
   const body=document.getElementById('bkCashBody'),day=typeof CC!=='undefined'&&CC?CC.day:APP_TODAY;
   if(body&&typeof booksCanSeeTotals==='function'&&booksCanSeeTotals()&&!body.querySelector('.nf70-cash-detail')){
    const anchor=body.querySelector('.cc-grid')||body.querySelector('.cc-form')||body.firstElementChild;
    if(anchor)anchor.insertAdjacentHTML('afterend',lineDetails(day));
   }
  }catch(e){}return r;};
  wrapped._nf70=true;try{renderCashCountPage=wrapped;}catch(e){}window.renderCashCountPage=wrapped;
 }
 function marketing(){
  const page=document.getElementById('view-index');if(!page)return;
  const hero=page.querySelector('.f4-hero');
  if(hero){
   const tagline=hero.querySelector('.nf66-tagline');
   if(tagline)tagline.classList.add('nf70-hero-type');
   const points=hero.querySelector('.nf64-hero-points');
   if(points)points.classList.add('nf70-hero-benefits');
  }
  const out=page.querySelector('#nf63Outcomes');
  if(out){
   const cards=[...out.querySelectorAll('.nf63-out')];
   cards.forEach(card=>{
    const icon=card.querySelector('.nf63-out-ic'),title=card.querySelector('b');
    if(icon&&title&&!card.querySelector('.nf70-card-head')){
     const head=document.createElement('div');head.className='nf70-card-head';head.append(icon,title);card.insertBefore(head,card.firstChild);
    }
   });
   let preview=out.querySelector('.nf67-control-preview');
   if(preview){
    preview.className='nf70-command-preview';
    preview.innerHTML='<div class="nf70-command-top"><div><span class="nf70-eyebrow">ONE CONNECTED BUSINESS</span><h3>One sale. The whole operation stays in sync.</h3><p>A visual example of how one recorded order can flow through stock, delivery and payment—without re-entering the same details.</p></div><div class="nf70-live-mark"><i></i> CONNECTED WORKFLOW</div></div><div class="nf70-command-board"><div class="nf70-command-order"><small>CUSTOMER ORDER</small><b>20 bags · Cement</b><strong>₱4,560</strong><span>Order confirmed</span></div><div class="nf70-command-arrow">→</div><div class="nf70-command-step"><span class="nf70-step-icon">▦</span><small>INVENTORY</small><b>20 bags reserved</b><span>Stock balance updates</span></div><div class="nf70-command-arrow">→</div><div class="nf70-command-step"><span class="nf70-step-icon">↗</span><small>DELIVERY</small><b>Dispatch prepared</b><span>Customer gets a status link</span></div><div class="nf70-command-arrow">→</div><div class="nf70-command-step"><span class="nf70-step-icon">₱</span><small>BOOKS & CASH</small><b>₱4,560 recorded</b><span>Payment status stays visible</span></div></div><div class="nf70-command-foot"><b>Enter it once.</b><span>Keep the next steps connected.</span></div>';
   }
   const head=out.querySelector('.nf5-head h2,.f5-head h2');
   if(head&&/calmer day|less chasing|stronger business/i.test(head.textContent))head.innerHTML='One clear view. <span>Fewer loose ends.</span>';
  }
 }
 function polishDashboard(){
  const app=document.getElementById('view-app');if(!app)return;
  const home=document.getElementById('mhHome');
  if(home){
   const intel=home.querySelector('.nf67-intel');
   if(intel){const grid=intel.querySelector('.nf67-intel-grid');if(grid){const metrics=[...grid.children];metrics.slice(0,Math.max(0,metrics.length-1)).forEach(n=>n.remove());}const h=intel.querySelector('.nf67-intel-head h4'),p=intel.querySelector('.nf67-intel-head p'),k=intel.querySelector('.nf67-intel-grid>div span');if(h)h.textContent='Profitability check';if(p)p.textContent='One useful signal, without repeating the sales and cost totals already shown above.';if(k)k.textContent='Operating margin';intel.classList.add('nf70-intel-refined');}
   const discover=document.getElementById('page-discover');if(discover)discover.classList.add('nf70-discover-page');
   // Remove duplicate headline tiles only; never remove distinct alerts or their underlying records.
   const seen=new Set();
   home.querySelectorAll('.mosaic .tile').forEach(tile=>{
    const label=(tile.querySelector('.k')?.textContent||'').trim().toLowerCase();
    if(!label)return;if(seen.has(label))tile.remove();else seen.add(label);
   });
   home.querySelectorAll('.lane-h').forEach(h=>{
    const t=h.textContent.toLowerCase();
    h.classList.toggle('nf70-red',/attention|overdue|late|urgent/.test(t));
    h.classList.toggle('nf70-yellow',/coming up|this week|due|pending/.test(t));
    h.classList.toggle('nf70-green',/on track|clear|done|complete/.test(t));
   });
   home.querySelectorAll('.tile .k').forEach(k=>{if(/sales this month/i.test(k.textContent))k.closest('.tile')?.classList.add('nf70-owner-kpi');});
  }
  // AI tools are deliberately hidden from the product navigation; implementation remains untouched.
  app.querySelectorAll('a,button,[role="button"]').forEach(el=>{
   if(el.dataset.nf70AiHidden)return;
   const label=(el.innerText||el.textContent||'').trim().replace(/\s+/g,' ');
   if(/^AI tools?$/i.test(label)||/^AI assistant$/i.test(label)||/^AI notebook$/i.test(label)){
    const nav=el.closest('li,.nav-item,.sidebar-item,.menu-item,.more-item')||el;
    nav.hidden=true;nav.dataset.nf70AiHidden='1';
   }
  });
  // Keep the routes header compact and consistent with other operational pages.
  const routes=document.getElementById('page-routes');
  if(routes){routes.classList.add('nf70-routes-page');routes.querySelectorAll('.page-head .pill,.page-head .badge,.page-head .chip').forEach(p=>p.classList.add('nf70-route-pill'));}
 }
 function run(){wrapSales();wrapCash();marketing();polishDashboard();}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
 // The only observed subtree is the app; a short debounce prevents repeated full-document scans.
 let timer=null, lastPage='';
 const app=document.getElementById('view-app');
 if(app&&window.MutationObserver){
  const mo=new MutationObserver(()=>{
   const active=app.querySelector('.app-page.active');const id=active&&active.id||'';
   if(id===lastPage)return;lastPage=id;clearTimeout(timer);timer=setTimeout(()=>{wrapSales();wrapCash();polishDashboard();},80);
  });
  mo.observe(app,{childList:true,subtree:true});
 }
})();
