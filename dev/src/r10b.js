/* ===== Round 10b: one camera button and one upload button, never two of the same ===== */
function nfPhotoLabels(){
  document.querySelectorAll('.nf-take').forEach(b => {
    const lab = b.nextElementSibling; if(!lab || lab.tagName !== 'LABEL' || lab.dataset.nfRelab) return; lab.dataset.nfRelab = '1';
    const w = document.createTreeWalker(lab, NodeFilter.SHOW_TEXT); let n;
    while((n = w.nextNode())){ if(/take (or choose )?a photo|choose a photo|attach a photo/i.test(n.nodeValue)) n.nodeValue = n.nodeValue.replace(/take or choose a photo|take a photo|choose a photo|attach a photo/i, 'Upload a photo'); }
  });
}
(function(){ let raf = 0; const run = () => { raf = 0; try{ nfPhotoLabels(); }catch(e){} };
  new MutationObserver(() => { if(!raf) raf = requestAnimationFrame(run); }).observe(document.body, {childList: true, subtree: true}); })();
