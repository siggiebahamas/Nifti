import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import Anthropic from "npm:@anthropic-ai/sdk";
// Reads one photo of a handwritten notebook page and returns the lines it finds, matched to the
// shop's own customers, suppliers and items. Called by the app with the person's own sign-in, so the
// database (nb_read_start) only ever hands over that person's business names and counts the page
// against that business's monthly allowance. The AI key lives in app_secrets (set by the Nifti owner
// in the admin screen); it never reaches the browser. Nothing is written to the books here: the app
// shows every line for a person to check first.
const SB_URL = Deno.env.get("SUPABASE_URL")!;
const admin = createClient(SB_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const KINDS = ["sales", "utang", "bills", "stock", "exp", "unsure"];
const COLS = ["date", "who", "what", "qty", "amt", "skip"];
const str = { type: "string" };
const num = { type: "number" };
const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["page_kind", "columns", "page_date", "lines", "written_total", "summary"],
  properties: {
    page_kind: { type: "string", enum: KINDS },
    columns: { type: "array", items: { type: "string", enum: COLS } },
    page_date: str,
    written_total: num,
    summary: str,
    lines: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["date_raw", "who_raw", "item_raw", "qty_raw", "amount_raw", "date", "who", "who_known", "item", "item_known",
          "qty", "unit_price", "amount", "paid", "readable", "sure", "note"],
        properties: {
          date_raw: str, who_raw: str, item_raw: str, qty_raw: str, amount_raw: str,
          date: str, who: str, who_known: { type: "boolean" }, item: str, item_known: { type: "boolean" },
          qty: num, unit_price: num, amount: num,
          paid: { type: "string", enum: ["paid", "credit", "unknown"] },
          readable: { type: "boolean" }, sure: { type: "boolean" }, note: str,
        },
      },
    },
  },
};

const SYSTEM = `You read photos of handwritten business notebooks from small Philippine shops (hardware stores, distributors, sari-sari stores). Owners write fast, in English, Tagalog or Taglish, with their own shorthand and nicknames.

Your job: copy every written line exactly as written, then say what it most likely means using the shop's own lists.

Rules:
- One output line per written line, top to bottom. Skip headings, page numbers, doodles and crossed-out lines.
- *_raw fields: exactly what is written, even if misspelled. Use "" when a column is empty.
- who / item: the matching name from the shop's lists when you are confident it is the same person or item (nicknames, short forms and the shop's learned words count). Otherwise a clean version of what is written. Set who_known / item_known true only when it matches a list name.
- Numbers: qty, unit_price and amount as plain numbers (no commas, no peso sign). "1.2k" = 1200. If only a total is written, put it in amount and leave unit_price 0. If qty and amount are written, unit_price = amount / qty.
- date: YYYY-MM-DD when you can tell (Philippine order is day/month only if the page makes that clear; most notebooks write month/day). Use the page date or the last date above when a line has none. "" if unknown.
- paid: "paid" for words like bayad, pd, paid, cash, GCash/GC; "credit" for utang, c/o, charge, "sa susunod", or anything on an utang or bills page; "unknown" otherwise.
- readable: false when you truly cannot read the line. Never guess numbers you cannot see.
- sure: true only when the line is readable, who and item match the lists (or are walk-in / not needed), and qty x unit_price equals the written amount (or there is nothing to check). Otherwise false, so a person checks it.
- note: one short plain sentence a 65-year-old shop owner understands, e.g. "10 x P228 = P2,280, same as written" or "The amount looks like 1,950 or 1,350". "" if nothing to say.
- columns: what each written column is, left to right (date, who, what, qty, amt, or skip for anything else).
- page_kind: sales (what was sold), utang (customers who owe), bills (what the shop owes suppliers), stock (counts of items), exp (expenses), unsure.
- written_total: a total written on the page, else 0.
- summary: one plain sentence about the page.`;

function clip(list: unknown, n: number) {
  return (Array.isArray(list) ? list : []).slice(0, n).map((x) => String(x).slice(0, 80));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Use POST." }, 405);
  const auth = req.headers.get("Authorization") || "";
  if (!auth.startsWith("Bearer ")) return json({ error: "Sign in first." }, 401);
  let body: any;
  try { body = await req.json(); } catch (_) { return json({ error: "Send a photo." }, 400); }
  let data = String(body?.image || "");
  let mediaType = String(body?.media_type || "image/jpeg");
  const m = data.match(/^data:(image\/(?:jpeg|png|webp|gif));base64,(.*)$/s);
  if (m) { mediaType = m[1]; data = m[2]; }
  if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(mediaType)) return json({ error: "Send a JPG or PNG photo." }, 400);
  if (data.length < 200) return json({ error: "Send a photo." }, 400);
  if (data.length > 7_000_000) return json({ error: "That photo is too big. Try again; Nifti shrinks it for you." }, 413);
  const kind = KINDS.includes(String(body?.kind)) ? String(body.kind) : "unsure";
  const pageId = typeof body?.page_id === "string" && /^[0-9a-f-]{36}$/i.test(body.page_id) ? body.page_id : null;

  const user = createClient(SB_URL, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
  const { data: ctx, error: startErr } = await user.rpc("nb_read_start", { p_kind: kind, p_page: pageId });
  if (startErr || !ctx) return json({ error: startErr?.message || "Sign in first.", code: "limit" }, 402);
  const readId = ctx.read_id;
  const finish = (ok: boolean, lines: number, err: string | null) =>
    admin.rpc("nb_read_finish", { p_read: readId, p_lines: lines, p_ok: ok, p_error: err });

  const { data: keyRow } = await admin.from("app_secrets").select("value").eq("name", "anthropic_api_key").maybeSingle();
  const apiKey = keyRow?.value;
  if (!apiKey) {
    await finish(false, 0, "reader not switched on");
    return json({ error: "Notebook reading is not switched on yet. The Nifti team turns it on.", code: "off" }, 503);
  }

  const words = (Array.isArray(ctx.words) ? ctx.words : []).slice(0, 300)
    .map((w: any) => `"${String(w.raw).slice(0, 40)}" means ${w.kind === "who" ? "the customer/supplier" : "the item"} "${String(w.meaning).slice(0, 80)}"`);
  const context = [
    `The person says this page is: ${kind}.`,
    `Shop's customers: ${clip(ctx.customers, 300).join("; ") || "(none yet)"}`,
    `Shop's suppliers: ${clip(ctx.suppliers, 200).join("; ") || "(none yet)"}`,
    `Shop's items: ${clip(ctx.items, 400).join("; ") || "(none yet)"}`,
    `Words this shop taught Nifti: ${words.join("; ") || "(none yet)"}`,
    `Today is ${new Date().toISOString().slice(0, 10)}. Read the page in the photo.`,
  ].join("\n");

  const client = new Anthropic({ apiKey });
  try {
    const msg: any = await client.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "medium", format: { type: "json_schema", schema: SCHEMA } },
      system: SYSTEM,
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data } },
          { type: "text", text: context },
        ],
      }],
    } as any);
    if (msg.stop_reason === "refusal") {
      await finish(false, 0, "refusal");
      return json({ error: "Nifti could not read this photo. Try a clearer photo of just the notebook page.", code: "refusal" }, 422);
    }
    if (msg.stop_reason === "max_tokens") {
      await finish(false, 0, "too long");
      return json({ error: "This page has too many lines to read at once. Take two photos, top half and bottom half.", code: "long" }, 422);
    }
    const text = (msg.content || []).filter((b: any) => b.type === "text").map((b: any) => b.text).join("");
    let out: any;
    try { out = JSON.parse(text); } catch (_) {
      await finish(false, 0, "bad output");
      return json({ error: "Nifti could not read this photo. Try again.", code: "bad" }, 502);
    }
    const lines = Array.isArray(out.lines) ? out.lines : [];
    await finish(true, lines.length, null);
    return json({ ok: true, result: out, used: Number(ctx.used || 0) + 1, limit: ctx.limit });
  } catch (e) {
    let msg = "Nifti could not reach the reading service. Try again in a minute.";
    let code = 502;
    if (e instanceof Anthropic.RateLimitError) { msg = "Lots of pages are being read right now. Try again in a minute."; code = 429; }
    else if (e instanceof Anthropic.AuthenticationError) { msg = "Notebook reading is switched off right now. The Nifti team has been told."; code = 503; }
    else if (e instanceof Anthropic.BadRequestError) { msg = "Nifti could not open this photo. Try another photo."; code = 400; }
    console.error("nb-read", e instanceof Anthropic.APIError ? `${e.status} ${e.message}` : String(e));
    await finish(false, 0, String((e as any)?.status || "") + " " + String((e as any)?.message || e).slice(0, 200));
    return json({ error: msg, code: "api" }, code);
  }
});
