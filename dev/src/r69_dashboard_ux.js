/* Round 69 — role-aware dashboard journeys and operational clarity. No backend, billing or auth changes. */
(function(){
  'use strict';
  const can = page => {
    try { return typeof isPageAllowedForViewAsRole === 'function' ? !!isPageAllowedForViewAsRole(page) : true; }
    catch(e){ return false; }
  };
  const boss = () => {
    try { return typeof booksCanSeeTotals === 'function' && booksCanSeeTotals(); }
    catch(e){ return false; }
  };
  const own = row => {
    if(!row) return false;
    let uid = null;
    try { uid = typeof currentUserId !== 'undefined' ? currentUserId : null; } catch(e){}
    if(uid && row.byId) return String(uid) === String(row.byId);
    let me = '';
    try { me = typeof bkMe === 'function' ? bkMe() : ''; } catch(e){}
    return !!(me && row.by && String(row.by).trim().toLowerCase() === String(me).trim().toLowerCase());
  };
  function decorateHome(){
    const root = document.getElementById('mhHome'); if(!root || root.dataset.nf69Role === '1') return;
    root.dataset.nf69Role = '1';
    const orderAccess = can('orders');
    if(!orderAccess){
      root.querySelectorAll('.sect').forEach(section=>{
        const h = section.querySelector('.sect-h h4');
        if(h && ['What to do','Where every order is'].includes(h.textContent.trim())) section.remove();
      });
    }
    const finance = boss();
    root.querySelectorAll('.mosaic .tile').forEach(tile=>{
      const label = (tile.querySelector('.k')?.textContent || '').trim();
      if(['Owed to you','You owe suppliers'].includes(label)){
        if(!can('collections')){ tile.remove(); return; }
        if(!finance){
          const side = label === 'Owed to you' ? 'supplier' : 'buyer';
          let count = 0; try { count = unpaidInvoicesFor(side).length; } catch(e){}
          const value = tile.querySelector('.v'), sub = tile.querySelector('.s');
          if(value) value.textContent = count ? count + ' open' : 'All clear';
          if(sub) sub.textContent = count ? 'Open items · totals restricted' : 'No open balances';
        }
      }
      if(!orderAccess && ['Customer orders','From suppliers','Coming from suppliers'].includes(label)) tile.remove();
    });
    const mosaic = root.querySelector('.mosaic');
    if(mosaic && !mosaic.children.length) mosaic.remove();
    if(orderAccess){
      const board = [...root.querySelectorAll('.sect')].find(section=>{
        const h = section.querySelector('.sect-h h4'); return h && h.textContent.trim() === 'Where every order is';
      });
      try{
        if(board && typeof mhOrderRows === 'function' && mhOrderRows().length === 0){
          const host = board.querySelector('.num');
          if(host) host.innerHTML = '<div class="nf69-empty"><span class="nf69-empty-mark">↗</span><b>No active orders yet</b><p>New customer orders and supplier purchases will appear here as they move through each stage.</p><button type="button" onclick="go(\'orders\')">Open orders</button></div>';
        }
      }catch(e){}
    }
    root.querySelectorAll('.lane').forEach(lane=>{
      const task = lane.querySelector('.task');
      if(task && task.textContent.trim() === 'Nothing here.'){
        const head = lane.querySelector('.lane-h');
        const key = head && head.classList.contains('r') ? 'urgent' : head && head.classList.contains('y') ? 'week' : 'fine';
        const copy = key === 'urgent' ? ['You’re clear for now','Urgent actions will appear here when something needs attention.'] :
          key === 'week' ? ['Nothing scheduled this week','Upcoming work will appear here as dates and commitments approach.'] :
          ['Looking good','No additional follow-up is needed in this area right now.'];
        task.innerHTML = '<div class="nf69-lane-empty"><b>'+copy[0]+'</b><p>'+copy[1]+'</p></div>';
      }
    });
    if(!orderAccess && can('routes')){
      const card = document.createElement('section');
      card.className = 'sect glass nf69-role-work';
      card.innerHTML = '<div><small>YOUR WORKSPACE</small><h4>Keep today’s deliveries moving</h4><p>Open your assigned routes to review stops and update delivery progress. Use Messages if you need to contact the team.</p></div><div class="nf69-role-actions"><button type="button" onclick="go(\'routes\')">Open my routes</button>'+(can('messages')?'<button type="button" class="secondary" onclick="go(\'messages\')">Open messages</button>':'')+'</div>';
      root.querySelector('.rows')?.prepend(card);
    }
  }
  function wrapHome(){
    if(typeof renderOneHome !== 'function' || renderOneHome._nf69) return;
    const base = renderOneHome;
    const wrapped = function(){
      const result = base.apply(this, arguments);
      setTimeout(decorateHome, 0);
      return result;
    };
    wrapped._nf69 = true;
    try { renderOneHome = wrapped; } catch(e){}
    try { renderMistHome = wrapped; } catch(e){}
    try { renderHomeV2 = wrapped; } catch(e){}
    window.renderOneHome = wrapped; window.renderMistHome = wrapped; window.renderHomeV2 = wrapped;
  }
  function wrapSales(){
    if(typeof renderSalesBooksPage !== 'function' || renderSalesBooksPage._nf69) return;
    const base = renderSalesBooksPage;
    const wrapped = function(){
      const privileged = boss(), all = BK.sales;
      if(!privileged && Array.isArray(all)) BK.sales = all.filter(own);
      let result;
      try { result = base.apply(this, arguments); }
      finally { BK.sales = all; }
      if(!privileged) setTimeout(()=>{
        const body = document.getElementById('bkSalesBody'); if(!body) return;
        const day = (typeof bkSalesDay !== 'undefined' && bkSalesDay) || APP_TODAY;
        const mine = (all || []).filter(s => s.date === day && !s.voidedAt && own(s)).length;
        const tiles = body.querySelector('.bk-tiles');
        if(tiles) tiles.outerHTML = '<section class="panel-card nf69-own-summary"><small>YOUR SALES</small><b>'+mine+' recorded '+(mine === 1 ? 'sale' : 'sales')+'</b><span>These are your own transaction records. Business-wide sales and payment totals are reserved for authorized owner and finance roles.</span></section>';
        const bar = body.querySelector('.bk-daybar');
        if(bar && !body.querySelector('.nf69-role-note')) bar.insertAdjacentHTML('afterend','<div class="nf69-role-note">Showing transactions recorded under your account. Open a sale to view its receipt or payment details.</div>');
      },0);
      return result;
    };
    wrapped._nf69 = true;
    try { renderSalesBooksPage = wrapped; } catch(e){}
    window.renderSalesBooksPage = wrapped;
  }
  function wrapExpenses(){
    if(typeof renderExpensesPage !== 'function' || renderExpensesPage._nf69) return;
    const base = renderExpensesPage;
    const wrapped = function(){
      const privileged = boss(), all = BK.expenses;
      if(!privileged && Array.isArray(all)) BK.expenses = all.filter(own);
      let result;
      try { result = base.apply(this, arguments); }
      finally { BK.expenses = all; }
      if(!privileged) setTimeout(()=>{
        const body = document.getElementById('bkExpBody'); if(!body) return;
        const bar = body.querySelector('.bk-toolbar');
        if(bar && !body.querySelector('.nf69-role-note')) bar.insertAdjacentHTML('afterend','<div class="nf69-role-note">Showing expenses submitted under your account. Authorized owner and finance roles can review the business-wide list and approval queue.</div>');
      },0);
      return result;
    };
    wrapped._nf69 = true;
    try { renderExpensesPage = wrapped; } catch(e){}
    window.renderExpensesPage = wrapped;
  }
  function ledgerHelp(){
    const body = document.getElementById('lgBody'); if(!body) return;
    const tabs = body.querySelector('.lg-tabs'); if(!tabs) return;
    let help = body.querySelector('.nf69-tab-help');
    if(!help){ help = document.createElement('div'); help.className='nf69-tab-help'; tabs.insertAdjacentElement('afterend',help); }
    const copy = {
      summary:'Start here. Review the key numbers, what changed, and what still needs checking.',
      pnl:'Profit and loss: sales minus the cost of goods sold and operating expenses for the selected period.',
      bs:'Balance sheet: what the business owns, what it owes, and the owner’s recorded equity on a selected date.',
      cash:'Cash flow: money moving through recorded cash, GCash and bank accounts. This is not a live bank connection.',
      tb:'Trial balance: an accounting check that total debits and credits agree before reports are relied on.',
      gl:'General ledger: the full transaction history behind one selected account. Click a line to inspect its source.',
      journal:'Journal: the detailed accounting entries that make up the reports.',
      accounts:'Accounts: the categories Nifti uses to organize assets, liabilities, income and expenses.'
    };
    help.textContent = copy[(typeof LGV !== 'undefined' && LGV.tab) || 'summary'] || copy.summary;
  }
  function wrapLedger(){
    if(typeof renderLedgerPage !== 'function' || renderLedgerPage._nf69) return;
    const base = renderLedgerPage;
    const wrapped = async function(){
      const result = await base.apply(this, arguments);
      ledgerHelp();
      return result;
    };
    wrapped._nf69 = true;
    try { renderLedgerPage = wrapped; } catch(e){}
    window.renderLedgerPage = wrapped;
  }
  wrapHome(); wrapSales(); wrapExpenses(); wrapLedger();
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ()=>{wrapHome();wrapSales();wrapExpenses();wrapLedger();decorateHome();});
  else setTimeout(()=>{wrapHome();wrapSales();wrapExpenses();wrapLedger();decorateHome();},0);
})();