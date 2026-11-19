/* ===== Round 51: the light landing and pricing pages (version A, "Sunlit") ===== */
function nf50Start(plan){
  try{ if(plan && plan !== 'free') localStorage.setItem('nifti-want-plan', plan); }catch(e){}
  navigate('login'); try{ nf20ToSignup(); }catch(e){}
}
function nf51To(el){ const v = el.closest('.marketing-view'), nav = v && v.querySelector('.a-nav'); window.scrollTo({top: el.getBoundingClientRect().top + window.scrollY - (nav ? nav.offsetHeight : 0) + 1, behavior: 'smooth'}); }
document.addEventListener('click', e => {
  const g = e.target.closest('.lp51 [data-go]');
  if(g){ e.preventDefault(); const k = g.getAttribute('data-go');
    if(k === 'start') nf50Start(g.getAttribute('data-plan')); else if(k === 'demo'){ try{ startDemoOrder(); }catch(_){} } else navigate(k); return; }
  const br = e.target.closest('.lp51 .a-nav .brand, .lp51 .a-foot .brand');
  if(br){ e.preventDefault(); navigate('index'); window.scrollTo({top: 0, behavior: 'smooth'}); return; }
  const a = e.target.closest('.lp51 a[href^="#"]');
  if(a){ e.preventDefault(); const id = a.getAttribute('href').slice(1); const t = document.getElementById(id);
    if(!t || t.closest('.marketing-view.hidden')){ navigate('index'); setTimeout(() => { const x = document.getElementById(id); if(x) nf51To(x); }, 80); return; }
    nf51To(t); }
});
