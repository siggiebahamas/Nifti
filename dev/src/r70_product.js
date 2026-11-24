/* Round 70 — practical sales visibility, cash evidence and navigation polish. */
(function(){
 'use strict';
 const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const peso=n=>'₱'+(Math.round((Number(n)||0)*100)/100).toLocaleString('en-PH',{minimumFractionDigits:0,maximumFractionDigits:2});




 function lineDetails(day){
  // Round 72 (brief 11): one reconciliation for the day, summary -> every sold line -> stock changes -> what to look at.
  // Neutral words: a difference is a reason to look, never proof of anything. Owner/GM/Finance only (caller checks).
  const sales=(BK.sales||[]).filter(s=>s.date===day&&!s.voidedAt);
  const lines=[];
  sales.forEach(s=>(s.lines||[]).filter(l=>!l.totalOnly).forEach(l=>{
   const qty=Number(l.qty)||0,unit=Number(l.unitPrice)||0,saved=Number(l.unitCost)||0,cur=Number((typeof bkItemCost==='function'&&bkItemCost(l.product))||0),cost=saved||cur,list=Number(l.listPrice)||0;
   lines.push({name:l.product,qty,unit,cost,costEst:!saved&&!!cur,list,customer:s.customer||'Walk-in',pay:s.paidWith||'',by:s.by||'',total:qty*unit,costTotal:qty*cost,discount:list>unit?(list-unit)*qty:0});
  }));
  const payLbl={cash:'Cash',gcash:'GCash',maya:'Maya',credit:'Utang',bank:'Bank',card:'Card',other:'Other'};
  const pays={};sales.forEach(s=>{const k=payLbl[s.paidWith]||s.paidWith||'Other';pays[k]=(pays[k]||0)+(Number(s.total)||0);});
  const unitemized=sales.filter(s=>!Array.isArray(s.lines)||!s.lines.length||(s.lines||[]).some(l=>l.totalOnly));
  const moves=(BK.moves||[]).filter(m=>m.date===day);
  const KIND={sold:'Sold',delivered:'Delivered to a customer',count:'Count difference',bad:'Damaged or expired',adjust:'Changed by hand',returned_in:'Returned to stock',received:'Received from a supplier'};
  const salesMoves=moves.filter(m=>m.kind==='sold'||m.kind==='delivered'),other=moves.filter(m=>!(m.kind==='sold'||m.kind==='delivered'));
  const mv=list=>'<div class="nf70-detail-table"><table><thead><tr><th>Item</th><th>What happened</th><th>Qty</th><th>Unit cost</th><th>Value</th><th>Reason</th><th>By</th></tr></thead><tbody>'+list.map(m=>{const c=m.unitCost!=null?Number(m.unitCost):Number((typeof bkItemCost==='function'&&bkItemCost(m.item))||0);return '<tr><td><b>'+esc(m.item||'—')+'</b></td><td>'+esc(KIND[m.kind]||m.kind||'—')+'</td><td>'+(Number(m.qty)>0?'+':'')+Number(m.qty||0)+'</td><td>'+(c?peso(c):'not saved')+'</td><td>'+(c?peso(Math.abs(Number(m.qty)||0)*c):'—')+'</td><td>'+esc(m.reason||m.ref||'—')+'</td><td>'+esc(m.by||'—')+'</td></tr>';}).join('')+'</tbody></table></div>';
  const tot=lines.reduce((a,l)=>({qty:a.qty+l.qty,revenue:a.revenue+l.total,cost:a.cost+l.costTotal,discount:a.discount+l.discount}),{qty:0,revenue:0,cost:0,discount:0});
  const salesTotal=sales.reduce((a,s)=>a+(Number(s.total)||0),0);
  // what to look at: count differences down, damage, sales without item detail, items with no cost
  const look=[];
  other.filter(m=>m.kind==='count'&&Number(m.qty)<0).forEach(m=>look.push(esc(m.item)+': '+Math.abs(Number(m.qty))+' fewer on the shelf than recorded. Worth a recount, and a look at sales of this item that may not have been entered.'));
  other.filter(m=>m.kind==='bad').forEach(m=>look.push(esc(m.item)+': '+Math.abs(Number(m.qty))+' marked damaged or expired'+(m.by?' by '+esc(m.by):'')+'. Check the photo or note.'));
  if(unitemized.length)look.push(unitemized.length+' sale'+(unitemized.length>1?'s':'')+' recorded as a total only, with no items. Stock could not move for '+(unitemized.length>1?'them':'it')+', so these cannot be matched to stock. Older history like this stays incomplete.');
  const est=lines.filter(l=>l.costEst).length; if(est)look.push(est+' sold line'+(est>1?'s':'')+' had no cost saved at the time; today\'s item cost is used instead.');
  const head='<div class="panel-head"><div><h2>Sales, stock and cash for '+esc(typeof bkDayLabel==='function'?bkDayLabel(day):day)+'</h2><p>What was sold, what left the shelf, and anything worth a second look</p></div><span class="nf70-detail-count">'+lines.length+' item line'+(lines.length===1?'':'s')+'</span></div>';
  const summary='<div class="nf70-detail-summary"><div><small>Sales recorded</small><b>'+peso(salesTotal)+'</b><span>'+sales.length+' sale'+(sales.length===1?'':'s')+'</span></div><div><small>How they paid</small><b class="nf72-pays">'+(Object.keys(pays).length?Object.entries(pays).map(([k,v])=>esc(k)+' '+peso(v)).join(' · '):'—')+'</b></div><div><small>Cost of items sold</small><b>'+peso(tot.cost)+'</b><span>'+(tot.revenue?'kept '+peso(tot.revenue-tot.cost)+' before expenses':'')+'</span></div><div><small>Discounts from the price list</small><b>'+peso(tot.discount)+'</b></div></div>';
  const itemized=lines.length?'<h3 class="nf72-dh">Every item sold</h3><div class="nf70-detail-table"><table><thead><tr><th>Item</th><th>Qty</th><th>Price each</th><th>List price</th><th>Discount</th><th>Cost each</th><th>Line total</th><th>Customer · paid by</th></tr></thead><tbody>'+lines.map(l=>'<tr><td><b>'+esc(l.name)+'</b>'+(l.by?'<small>Entered by '+esc(l.by)+'</small>':'')+'</td><td>'+l.qty+'</td><td>'+peso(l.unit)+'</td><td>'+(l.list?peso(l.list):'not saved')+'</td><td>'+(l.discount?peso(l.discount):'—')+'</td><td>'+(l.cost?peso(l.cost)+(l.costEst?' *':''):'not saved')+'</td><td><b>'+peso(l.total)+'</b></td><td>'+esc(l.customer)+' · '+esc(payLbl[l.pay]||l.pay||'—')+'</td></tr>').join('')+'</tbody><tfoot><tr><td>Total</td><td>'+tot.qty+'</td><td colspan="4">Cost of items sold: '+peso(tot.cost)+'</td><td>'+peso(tot.revenue)+'</td><td></td></tr></tfoot></table></div>':'<p class="nf72-dnone">No item lines were recorded for this day.</p>';
  const stock='<section class="nf70-movement-detail"><h3 class="nf72-dh">Stock that left because of sales</h3>'+(salesMoves.length?mv(salesMoves):'<p class="nf72-dnone">None recorded.</p>')+'<h3 class="nf72-dh">Other stock changes</h3><p class="nf72-dsub">Damage, count differences, returns, deliveries in and changes by hand. Kept apart from sales.</p>'+(other.length?mv(other):'<p class="nf72-dnone">None recorded.</p>')+'</section>';
  const looks='<section class="nf72-look"><h3 class="nf72-dh">Worth a second look</h3>'+(look.length?'<ul>'+look.map(x=>'<li>'+x+'</li>').join('')+'</ul><p class="nf72-dsub">A difference is a reason to check the records and recount. It does not prove that anyone did anything wrong.</p>':'<p class="nf72-dnone">Nothing stands out for this day.</p>')+'</section>';
  return '<section class="panel-card nf70-cash-detail">'+head+summary+itemized+stock+looks+'</section>';
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

 function polishDashboard(){
  // Round 72: Home, AI tools visibility and Deliveries are handled in r72.js. Only the page marker stays.
  const discover=document.getElementById('page-discover');if(discover)discover.classList.add('nf70-discover-page');
 }

 function run(){wrapCash();polishDashboard();}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
 // The only observed subtree is the app; a short debounce prevents repeated full-document scans.
 let timer=null, lastPage='';
 const app=document.getElementById('view-app');
 if(app&&window.MutationObserver){
  const mo=new MutationObserver(()=>{
   const active=app.querySelector('.app-page.active');const id=active&&active.id||'';
   if(id===lastPage)return;lastPage=id;clearTimeout(timer);timer=setTimeout(()=>{wrapCash();polishDashboard();},80);
  });
  mo.observe(app,{childList:true,subtree:true});
 }
})();
