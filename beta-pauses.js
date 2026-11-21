/* Nifti beta safeguard: the AI notebook reader is temporarily paused. */
(function () {
  function closeReaderPause() {
    const overlay = document.getElementById("niftiReaderPaused");
    if (overlay) overlay.remove();
  }
  function openReaderPause() {
    closeReaderPause();
    const overlay = document.createElement("div");
    overlay.id = "niftiReaderPaused";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "niftiReaderPausedTitle");
    overlay.style.cssText = "position:fixed;inset:0;z-index:100000;background:rgba(16,24,40,.58);display:grid;place-items:center;padding:18px";
    const card = document.createElement("section");
    card.style.cssText = "width:min(520px,100%);background:#fff;color:#101828;border-radius:18px;padding:26px;box-shadow:0 18px 60px rgba(0,0,0,.22);font:16px/1.55 system-ui,-apple-system,Segoe UI,sans-serif";
    card.innerHTML = '<div style="font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#667085;margin-bottom:8px">Nifti beta</div><h2 id="niftiReaderPausedTitle" style="font-size:23px;line-height:1.2;margin:0 0 12px">AI notebook reading is temporarily paused</h2><p style="margin:0 0 10px">We are keeping this feature on hold while Nifti is in beta. Your notebook photo will not be sent for AI processing, and no AI processing or AI API charges will occur.</p><p style="margin:0 0 18px">You can continue recording sales, expenses, customer balances and stock manually, or use the existing spreadsheet import tools. The AI reader implementation is being retained for a later release.</p><button type="button" id="niftiReaderPausedClose" style="border:0;border-radius:10px;background:#176b4b;color:#fff;font-weight:700;padding:11px 18px;min-height:44px;cursor:pointer">Back to Nifti</button>';
    overlay.appendChild(card);
    overlay.addEventListener("click", function (event) {
      if (event.target === overlay || event.target.id === "niftiReaderPausedClose") closeReaderPause();
    });
    document.addEventListener("keydown", function escClose(event) {
      if (event.key === "Escape") {
        closeReaderPause();
        document.removeEventListener("keydown", escClose);
      }
    });
    document.body.appendChild(overlay);
    document.getElementById("niftiReaderPausedClose").focus();
  }
  // Do not market the paused AI reader as available during beta.
  function replaceMarketingTeaser() {
    const section = document.getElementById("mkNotebook");
    if (!section) return;
    section.setAttribute("aria-label", "AI notebook reader temporarily paused");
    section.innerHTML = '<div class="wrap"><div class="f5-head"><div class="p2-burst">COMING LATER</div><h2>Manual records and Excel import, <span>available today.</span></h2><p>AI notebook reading is temporarily paused during beta. The implementation is being retained for a later release. Notebook photos will not be sent for AI processing, and no AI API charges will occur.</p></div></div>';
  }
  replaceMarketingTeaser();
  // Replace the entry point, not the reader implementation. This prevents uploads/queueing
  // from the UI until the owner explicitly approves reactivation.
  window.nf22NbOpen = openReaderPause;
  window.nf22NbClose = closeReaderPause;
})();