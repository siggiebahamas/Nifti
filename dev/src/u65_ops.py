# Round 65: daily dashboard priorities and simpler external order progress.
import os
from patchlib import P, S
HERE=os.path.dirname(__file__)
rd=lambda n:open(os.path.join(HERE,n),encoding='utf-8').read()
t=S['text'];k=t.index('</style>')
S['text']=t[:k]+'\n'+rd('r65_ops.css')+'\n'+t[k:]
P("  try{ const wk = document.getElementById('wkCard'); if(wk) wk.remove(); }catch(e){}", """
  try{
    const root=document.getElementById('mhHome'), rows=root && root.querySelector('.rows'), mosaic=root && root.querySelector('.mosaic');
    if(root && rows && mosaic && !root.querySelector('.mh-priority')){
      const priority=document.createElement('div'); priority.className='rows mh-priority';
      rows.querySelectorAll('.alertline').forEach(el=>priority.appendChild(el));
      const tasks=[...rows.querySelectorAll('.sect')].find(el=>{const h=el.querySelector('.sect-h h4');return h && h.textContent.trim()==='What to do';});
      if(tasks){const h=tasks.querySelector('.sect-h h4');if(h)h.textContent='Needs your attention';priority.appendChild(tasks);}
      mosaic.insertAdjacentElement('beforebegin',priority);
    }
    const drawer=root && root.querySelector('#mhDrawer');
    if(drawer && !drawer.closest('.mh-cash-fold')){
      const fold=document.createElement('details');fold.className='mh-cash-fold';
      fold.innerHTML='<summary><span><b>Staff cash accountability</b><small>See who counted, what matched and what needs review</small></span><i>＋</i></summary>';
      drawer.parentNode.insertBefore(fold,drawer);fold.appendChild(drawer);
    }
  }catch(e){console.warn('Home priorities',e);}
""")
P("function renderSidebarForViewAsRole(){",rd('r65_ops.js')+"\nfunction renderSidebarForViewAsRole(){")
