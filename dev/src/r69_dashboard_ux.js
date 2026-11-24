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
    let mid = null;
    try { mid = typeof myTeamMember !== 'undefined' && myTeamMember ? myTeamMember.id : null; } catch(e){}
    if(mid && row.byId) return String(mid) === String(row.byId);   // created_by on sales/expenses = team_members.id
    let me = '';
    try { me = typeof bkMe === 'function' ? bkMe() : ''; } catch(e){}
    return !!(me && row.by && String(row.by).trim().toLowerCase() === String(me).trim().toLowerCase());
  };
  function actionAllowed(action){
    if(!action) return true;
    const guarded = [
      ['collections', /(?:go|pickLens)\(['"]collections/],
      ['money', /go\(['"]money/],
      ['expenses', /go\(['"]expenses/],
      ['cashcount', /go\(['"]cashcount/],
      ['profit', /go\(['"]profit/],
      ['ledger', /go\(['"]ledger/],
      ['issues', /go\(['"]issues/],
      ['payroll', /go\(['"]payroll/],
      ['close', /go\(['"]close/],
      ['inventory', /go\(['"]inventory/],
      ['routes', /go\(['"]routes/],
      ['messages', /go\(['"]messages/]
    ];
    return !guarded.some(([page,pattern])=>pattern.test(String(action)) && !can(page));
  }
  function wrapLanes(){
    if(typeof mhLanes !== 'function' || mhLanes._nf69) return;
    const base = mhLanes;
    const wrapped = function(items, privileged){
      return base.call(this, (items || []).filter(item => actionAllowed(item && item.a)), privileged);
    };
    wrapped._nf69 = true;
    try { mhLanes = wrapped; } catch(e){}
    window.mhLanes = wrapped;
  }
  function decorateHome(){
    const root = document.getElementById('mhHome'); if(!root || root.dataset.nf69Role === '1') return;
    root.dataset.nf69Role = '1';
    const orderAccess = can('orders');
    if(!boss() && !( !can('orders') && can('routes'))){
      const actions = [];
      if(can('sales')) actions.push(['Record a sale',"openQuickSale()"]);
      if(can('cashcount')) actions.push(['Count cash',"ccStart(APP_TODAY); go('cashcount')"]);
      if(can('inventory')) actions.push(['Check stock',"go('inventory')"]);
      if(can('orders')) actions.push(['Manage orders',"go('orders')"]);
      if(can('routes')) actions.push(['My routes',"go('routes')"]);
      if(can('expenses')) actions.push(['Add expense',"openExpenseForm()"]);
      if(can('messages')) actions.push(['Messages',"go('messages')"]);
      const selected = actions.slice(0,3);
      const hero = root.querySelector('.hero');
      if(hero && selected.length && !root.querySelector('.nf69-shortcuts')){
        const strip = document.createElement('section');
        strip.className = 'nf69-shortcuts';
        strip.innerHTML = '<div><small>QUICK ACTIONS</small><b>Start with what you need to do</b></div><div class="nf69-shortcut-buttons">'+selected.map(([label,action])=>'<button type="button" onclick="'+action.replace(/"/g,'&quot;')+'">'+label+'</button>').join('')+'</div>';
        hero.insertAdjacentElement('afterend',strip);
      }
    }
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
    tabs.querySelectorAll('[role="tab"]').forEach(tab=>{
      const active = tab.classList.contains('on');
      tab.setAttribute('aria-selected', active ? 'true' : 'false');
      tab.tabIndex = active ? 0 : -1;
    });
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
  wrapLanes(); wrapHome(); wrapExpenses(); wrapLedger(); // Round 72: sales visibility follows the owner's setting (r72.js)
  if(!document.documentElement.dataset.nf69Keyboard){
    document.documentElement.dataset.nf69Keyboard = '1';
    document.addEventListener('keydown', event=>{
      if(event.key !== 'Enter' && event.key !== ' ') return;
      const target = event.target && event.target.closest && event.target.closest('[role="button"][tabindex="0"]');
      if(!target || target.matches('button,a,input,select,textarea')) return;
      event.preventDefault(); target.click();
    });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ()=>{wrapLanes();wrapHome();wrapExpenses();wrapLedger();decorateHome();});
  else setTimeout(()=>{wrapLanes();wrapHome();wrapExpenses();wrapLedger();decorateHome();},0);
})();