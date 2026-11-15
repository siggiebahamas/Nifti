import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import Anthropic from "npm:@anthropic-ai/sdk";
// Reads one file sent in a Nifti chat (PDF invoice, price list, delivery receipt photo) and says what it is.
// The file is fetched with the caller's own sign-in, so storage rules only hand over files from chats
// that person's business is part of. Each read counts against the business's monthly AI pages
// (the same allowance as the notebook reader). The AI key never reaches the browser.
const SB_URL = Deno.env.get("SUPABASE_URL")!;
const admin = createClient(SB_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
const str = { type: "string" }, num = { type: "number" };
const KINDS = ["quote", "invoice", "statement", "confirm", "priceup", "pricedown", "delivered", "shipped", "delay", "doc"];
const SCHEMA = {
  type: "object", additionalProperties: false,
  required: ["kind", "doc_number", "po_number", "doc_date", "due_date", "party_name", "total", "items", "summary"],
  properties: {
    kind: { type: "string", enum: KINDS }, doc_number: str, po_number: str, doc_date: str, due_date: str, party_name: str, total: num, summary: str,
    items: { type: "array", items: { type: "object", additionalProperties: false, required: ["name", "qty", "unit", "unit_price", "amount"],
      properties: { name: str, qty: num, unit: str, unit_price: num, amount: num } } },
  },
};
const SYSTEM = `You read business papers that suppliers and customers of small Philippine shops send in chat: invoices, sales invoices, statements of account, quotations and price lists, delivery receipts (DR), purchase order confirmations, and photos of these. Text may be English, Tagalog or Taglish.

Say what the paper is and copy its key facts exactly. Never guess numbers you cannot see.
- kind: quote (quotation or price list), invoice, statement (statement of account), confirm (order confirmation), priceup / pricedown (a notice that prices change), delivered (delivery receipt or proof of delivery), shipped, delay, doc (anything else, e.g. certificates).
- doc_number: the paper's own number (e.g. INV-2026-0398, SI 1234, DR-0412), else "".
- po_number: a purchase order number written on it, else "".
- doc_date / due_date: YYYY-MM-DD when shown, else "".
- party_name: the business that issued the paper, else "".
- total: the grand total amount due as a plain number, else 0.
- items: each line with name (use the shop's item name when it is clearly the same item), qty, unit, unit_price, amount; 0 or "" when not shown. At most 40 lines.
- summary: one short plain sentence a busy shop owner understands.`;

function b64(buf: ArrayBuffer) { let s = ""; const b = new Uint8Array(buf); for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000)); return btoa(s); }

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Use POST." }, 405);
  const auth = req.headers.get("Authorization") || "";
  if (!auth.startsWith("Bearer ")) return json({ error: "Sign in first." }, 401);
  let body: any; try { body = await req.json(); } catch (_) { return json({ error: "Nothing to read." }, 400); }
  const path = String(body?.path || "");
  if (!path || path.length > 400 || path.includes("..")) return json({ error: "Nothing to read." }, 400);
  const user = createClient(SB_URL, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
  // storage rules decide: only files from this person's own chats come back
  const { data: file, error: dlErr } = await user.storage.from("chat-files").download(path);
  if (dlErr || !file) return json({ error: "You can only read files from your own chats." }, 403);
  const name = String(body?.name || path.split("/").pop() || "").slice(0, 160);
  const type = (file.type || "").toLowerCase();
  const isPdf = type === "application/pdf" || /\.pdf$/i.test(name);
  const imgType = ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(type) ? type : /\.(jpe?g)$/i.test(name) ? "image/jpeg" : /\.png$/i.test(name) ? "image/png" : /\.webp$/i.test(name) ? "image/webp" : "";
  if (!isPdf && !imgType) return json({ error: "Nifti reads PDFs and photos." }, 415);
  if (file.size > 12 * 1024 * 1024) return json({ error: "That file is too big to read (12 MB most)." }, 413);
  const { data: ctx, error: startErr } = await user.rpc("nb_read_start", { p_kind: "chat", p_page: null });
  if (startErr || !ctx) return json({ error: startErr?.message || "Sign in first.", code: "limit" }, 402);
  const finish = (ok: boolean, lines: number, err: string | null) => admin.rpc("nb_read_finish", { p_read: ctx.read_id, p_lines: lines, p_ok: ok, p_error: err });
  const { data: keyRow } = await admin.from("app_secrets").select("value").eq("name", "anthropic_api_key").maybeSingle();
  if (!keyRow?.value) { await finish(false, 0, "reader not switched on"); return json({ error: "File reading is not switched on yet. The Nifti team turns it on.", code: "off" }, 503); }
  const data = b64(await file.arrayBuffer());
  const block = isPdf ? { type: "document", source: { type: "base64", media_type: "application/pdf", data } } : { type: "image", source: { type: "base64", media_type: imgType, data } };
  const items = (Array.isArray(ctx.items) ? ctx.items : []).slice(0, 300).map((x: unknown) => String(x).slice(0, 80));
  const context = `File name: ${name}\nSent in a chat with: ${String(body?.party || "").slice(0, 120)}\nShop's items: ${items.join("; ") || "(none yet)"}\nToday is ${new Date().toISOString().slice(0, 10)}.`;
  try {
    const msg: any = await new Anthropic({ apiKey: keyRow.value }).beta.messages.create({
      model: "claude-opus-5-5", max_tokens: 8000,
      betas: ["server-side-fallback-2026-07-01"], fallbacks: "default",
      output_config: { effort: "low", format: { type: "json_schema", schema: SCHEMA } },
      system: SYSTEM,
      messages: [{ role: "user", content: [block, { type: "text", text: context }] }],
    } as any);
    if (msg.stop_reason === "refusal") { await finish(false, 0, "refusal"); return json({ error: "Nifti could not read this file." }, 422); }
    if (msg.stop_reason === "max_tokens") { await finish(false, 0, "too long"); return json({ error: "This file is too long to read at once." }, 422); }
    const text = (msg.content || []).filter((b: any) => b.type === "text").map((b: any) => b.text).join("");
    let out: any; try { out = JSON.parse(text); } catch (_) { await finish(false, 0, "bad output"); return json({ error: "Nifti could not read this file. Try again." }, 502); }
    await finish(true, Array.isArray(out.items) ? out.items.length : 0, null);
    return json({ ok: true, result: out });
  } catch (e) {
    let msg = "Nifti could not reach the reading service. Try again in a minute.", code = 502;
    if (e instanceof Anthropic.RateLimitError) { msg = "Lots of files are being read right now. Try again in a minute."; code = 429; }
    else if (e instanceof Anthropic.AuthenticationError) { msg = "File reading is switched off right now. The Nifti team has been told."; code = 503; }
    else if (e instanceof Anthropic.BadRequestError) { msg = "Nifti could not open this file."; code = 400; }
    console.error("chat-read", e instanceof Anthropic.APIError ? `${e.status} ${e.message}` : String(e));
    await finish(false, 0, String((e as any)?.status || "") + " " + String((e as any)?.message || e).slice(0, 200));
    return json({ error: msg, code: "api" }, code);
  }
});
