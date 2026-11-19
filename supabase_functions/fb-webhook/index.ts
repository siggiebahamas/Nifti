// fb-webhook: answers "how much?" comments on a connected Page with the item price and the store link.
// Deploy with verify_jwt = false (Facebook calls it). Secrets: FB_APP_SECRET, FB_VERIFY_TOKEN.
// In the Meta app: Webhooks > Page > subscribe to "feed", callback = this function's URL, verify token = FB_VERIFY_TOKEN.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
const G = "https://graph.facebook.com/v19.0";
const ASK = /(how\s*much|\bhm+\b|hmp|magkano|mag\s*kano|presyo|price|\bpm\b|pm\s*po|ilan po|available|avail|meron po ba|mayroon po ba|order|bili|bibili)/i;
const SYN: Record<string, string> = { semento: "cement", buhangin: "sand", pako: "nail", alambre: "wire", bakal: "steel", graba: "gravel", kahoy: "lumber", tubo: "pipe", pintura: "paint", yero: "roofing", bareta: "rebar", varilla: "rebar", kawad: "wire", plywud: "plywood" };
const norm = (s: string) => " " + String(s || "").toLowerCase().replace(/[^a-z0-9 ]+/g, " ").split(/\s+/).map((w) => SYN[w] || w).join(" ") + " ";
async function hmac(secret: string, body: string) {
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(body));
  return "sha256=" + [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
Deno.serve(async (req) => {
  const url = new URL(req.url);
  if (req.method === "GET") {
    if (url.searchParams.get("hub.mode") === "subscribe" && url.searchParams.get("hub.verify_token") === Deno.env.get("FB_VERIFY_TOKEN")) return new Response(url.searchParams.get("hub.challenge") || "");
    return new Response("no", { status: 403 });
  }
  const raw = await req.text();
  if ((req.headers.get("X-Hub-Signature-256") || "") !== await hmac(Deno.env.get("FB_APP_SECRET")!, raw)) return new Response("bad signature", { status: 401 });
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const body = JSON.parse(raw);
  for (const entry of body.entry || []) {
    const { data: fp } = await admin.from("fb_pages").select("*").eq("page_id", entry.id).single();
    if (!fp) continue;
    const { data: biz } = await admin.from("businesses").select("name, store, store_slug, catalog").eq("id", fp.business_id).single();
    const cfg = biz?.store?.replies || {};
    if (!cfg.on) continue;
    for (const ch of entry.changes || []) {
      const v = ch.value || {};
      if (ch.field !== "feed" || v.item !== "comment" || v.verb !== "add" || !v.message || v.from?.id === fp.page_id) continue;
      if (!ASK.test(v.message)) continue;
      const { error: dup } = await admin.from("fb_reply_log").insert({ comment_id: v.comment_id, business_id: fp.business_id });
      if (dup) continue; // already answered
      const said = norm(v.message);
      let best: { product: string; price: number; unit: string } | null = null, bs = 0;
      for (const c of biz?.catalog || []) { let s = 0; for (const t of norm(c.product).trim().split(" ")) if (t.length > 1 && said.includes(" " + t + " ")) s += /\d/.test(t) ? 2 : 3; if (s > bs) { bs = s; best = c; } }
      const link = `${Deno.env.get("STORE_BASE") || "https://siggiebahamas.github.io/Nifti"}/s/${biz?.store_slug}/?src=fbcomment`;
      const first = String(v.from?.name || "").split(" ")[0] || "po";
      const tpl: string = best ? (cfg.withItem || "Hi {name}! Ang {item} po ay {price} per {unit}. Order dito: {link}") : (cfg.noItem || "Hi {name}! Nandito po lahat ng presyo namin: {link}");
      const peso = (n: number) => "₱" + Math.round(Number(n) || 0).toLocaleString("en-PH");
      const text = tpl.replace(/\{name\}/g, first).replace(/\{item\}/g, best?.product || "").replace(/\{price\}/g, best ? peso(best.price) : "").replace(/\{unit\}/g, best?.unit || "pc").replace(/\{link\}/g, link).replace(/\{shop\}/g, biz?.name || "");
      await fetch(`${G}/${v.comment_id}/comments`, { method: "POST", body: new URLSearchParams({ message: text, access_token: fp.page_token }) });
      await admin.from("fb_reply_log").update({ reply_text: text }).eq("comment_id", v.comment_id);
    }
  }
  return new Response("ok");
});
