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
  // Keep the plan display honest: Business feature access is temporary beta access, not a paid subscription.
  function patchBetaPlanUi() {
    if (typeof window.nf26PlanNow === "function" && !window.nf26PlanNow._niftiBeta) {
      const baseNow = window.nf26PlanNow;
      const wrappedNow = function () {
        const state = baseNow.apply(this, arguments) || {};
        try {
          const info = typeof myPlanInfo !== "undefined" && myPlanInfo ? myPlanInfo : {};
          if (state.pilot) {
            state.plan = "business";
            state.assignedPlan = info.assigned_plan || state.assignedPlan || "free";
            state.billingStatus = info.billing_status || "Beta — Free";
          }
        } catch (_) {}
        return state;
      };
      wrappedNow._niftiBeta = true;
      window.nf26PlanNow = wrappedNow;
    }
    if (typeof window.nf26PlanLine === "function" && !window.nf26PlanLine._niftiBeta) {
      const baseLine = window.nf26PlanLine;
      const wrappedLine = function () {
        const state = typeof window.nf26PlanNow === "function" ? window.nf26PlanNow() : {};
        return state && state.pilot ? "Business access · Beta — Free" : baseLine.apply(this, arguments);
      };
      wrappedLine._niftiBeta = true;
      window.nf26PlanLine = wrappedLine;
    }
    if (typeof window.nf26PaintPlans === "function" && !window.nf26PaintPlans._niftiBeta) {
      const basePaint = window.nf26PaintPlans;
      const wrappedPaint = function () {
        const result = basePaint.apply(this, arguments);
        try {
          const state = typeof window.nf26PlanNow === "function" ? window.nf26PlanNow() : {};
          if (!state || !state.pilot) return result;
          const assigned = String(state.assignedPlan || "free");
          const banner = document.querySelector("#nf26Plans .nf26-pbanner");
          if (banner) {
            banner.className = "nf26-pbanner good";
            banner.innerHTML = "<b>Business access is active during beta — ₱0.</b> Your assigned plan remains " + assigned + ". Your subscription and payment records have not been changed.";
          }
          const freeLabel = document.querySelector("#nf26Plans .nf26-pc.free .nf26-cur");
          if (freeLabel) freeLabel.textContent = "Assigned plan: " + assigned;
          document.querySelectorAll("#nf26Plans .nf26-pcards .btn").forEach(function (button) {
            const label = document.createElement("span");
            label.className = "nf26-cur soft";
            label.textContent = "Included during beta · ₱0";
            button.replaceWith(label);
          });
          const businessLabel = document.querySelector("#nf26Plans .nf26-pc.business h3 em");
          if (businessLabel) businessLabel.textContent = "Beta access";
          const how = document.querySelector("#nf26Plans .nf26-how");
          if (how) how.innerHTML = "<b>During beta</b><p>Business-level features are enabled at no charge. No payment is due and no subscription record is changed. Your assigned plan is retained for billing after the beta period.</p>";
        } catch (_) {}
        return result;
      };
      wrappedPaint._niftiBeta = true;
      window.nf26PaintPlans = wrappedPaint;
    }
  }
  patchBetaPlanUi();
  // Replace the entry point, not the reader implementation. This prevents uploads/queueing
  // from the UI until the owner explicitly approves reactivation.
  window.nf22NbOpen = openReaderPause;
  window.nf22NbClose = closeReaderPause;
})();