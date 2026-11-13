import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
// The Nifti Telegram bot. Two kinds of calls reach it:
// 1. Telegram itself, for every message someone sends the bot. Telegram signs each call with the
//    secret header we gave it in setWebhook (app_secrets.telegram_webhook_secret), so nobody else
//    can pretend to be Telegram. verify_jwt is off for that reason.
// 2. The Nifti owner, from the admin screen, right after pasting the BotFather token: {action:"setup"}
//    with their own sign-in. We check they are the platform admin, then ask Telegram who the bot is,
//    point its webhook here and set its command menu.
// People link their own Telegram by tapping a one-time link in Nifti (t.me/<bot>?start=<code>).
// Sending alerts happens in push-dispatch, not here.
const SB_URL = Deno.env.get("SUPABASE_URL")!;
const admin = createClient(SB_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
const esc = (s: unknown) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const peso = (n: unknown) => "₱" + Math.round(Number(n) || 0).toLocaleString("en-US");

async function secret(name: string) {
  const { data } = await admin.from("app_secrets").select("value").eq("name", name).maybeSingle();
  return data?.value ?? null;
}
async function tg(token: string, method: string, payload: unknown) {
  const r = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return await r.json().catch(() => ({ ok: false }));
}

async function setup(req: Request) {
  const auth = req.headers.get("Authorization") || "";
  const user = createClient(SB_URL, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
  const { data: isAdmin } = await user.rpc("is_platform_admin");
  if (isAdmin !== true) return json({ error: "Only the Nifti owner can do this." }, 403);
  const token = await secret("telegram_bot_token");
  const hook = await secret("telegram_webhook_secret");
  if (!token || !hook) return json({ error: "Paste the bot token first." }, 400);
  const me = await tg(token, "getMe", {});
  if (!me.ok) return json({ error: "Telegram did not accept that token. Copy it again from BotFather." }, 400);
  const username = me.result.username;
  await admin.from("app_secrets").upsert({ name: "telegram_bot_username", value: username }, { onConflict: "name" });
  const wh = await tg(token, "setWebhook", {
    url: `${SB_URL}/functions/v1/telegram-bot`,
    secret_token: hook,
    allowed_updates: ["message"],
    drop_pending_updates: true,
  });
  if (!wh.ok) return json({ error: "Telegram would not connect: " + (wh.description || "unknown") }, 502);
  await tg(token, "setMyCommands", {
    commands: [
      { command: "today", description: "Today at a glance" },
      { command: "utang", description: "Magkano ang sinisingil mo" },
      { command: "benta", description: "Benta ngayong araw" },
      { command: "stock", description: "Ilang item ang paubos na" },
      { command: "help", description: "Ano ang kaya ng Nifti" },
      { command: "stop", description: "Stop alerts on this phone" },
    ],
  });
  await tg(token, "setMyDescription", {
    description: "Nifti alerts for your shop: new orders, payments, low stock and your daily summary, with a button that opens the right page.",
  });
  return json({ ok: true, bot: username });
}

// /help: what Nifti can do, in Taglish, with buttons that open the right page
const HELP = "<b>Ako si Nifti.</b> Dito ko ipapadala ang alerts ng tindahan mo: bagong order, bayad, paubos na stock, at buod ng araw. May button ang bawat alert para buksan agad ang tamang page.\n\n" +
  "<b>Ano ang kaya ng Nifti:</b>\n" +
  "• <b>Orders</b>: order ng customer at order mo sa supplier, iisang listahan\n" +
  "• <b>Utang</b>: sino ang may utang, at kusang paalala sa kanila\n" +
  "• <b>Benta</b>: benta sa tindahan (cash, GCash, utang) at bilang ng kaha\n" +
  "• <b>Stock</b>: ano ang paubos na, bago ka pa maubusan\n" +
  "• <b>Gastos at sahod</b>: resibo, vale at payroll\n" +
  "• <b>Notebook</b>: picture-an ang lumang listahan, si Nifti ang magta-type\n" +
  "• <b>Online store</b>: sariling link at ready na Facebook post\n\n" +
  "<b>Mga utos dito:</b>\n/today  buod ng araw\n/utang  magkano ang sinisingil mo\n/benta  benta ngayong araw\n/stock  ilang item ang paubos na\n/stop  itigil ang alerts sa phone na ito\n\n" +
  "Puwede ring i-type lang ang salita, gaya ng <i>utang</i> o <i>benta</i>. May tanong? Sa Nifti, i-tap ang <b>Need help?</b> at sasagutin ka ng tao.";
const NOT_LINKED = "Hindi pa naka-link ang phone na ito. Buksan ang Nifti, pumunta sa <b>Settings → Telegram alerts</b>, tapos i-tap ang <b>Link my Telegram</b>.";

async function onMessage(token: string, msg: any) {
  const chat = msg?.chat?.id;
  if (!chat || msg.chat.type !== "private") return;
  const text = String(msg.text || "").trim();
  const name = [msg.from?.first_name, msg.from?.last_name].filter(Boolean).join(" ") || msg.from?.username || "Telegram";
  const reply = (t: string, extra: Record<string, unknown> = {}) =>
    tg(token, "sendMessage", { chat_id: chat, text: t, parse_mode: "HTML", disable_web_page_preview: true, ...extra });
  const appUrl = (await secret("app_url")) || "https://siggiebahamas.github.io/Nifti/";
  const open = { reply_markup: { inline_keyboard: [[{ text: "Open Nifti", url: appUrl }]] } };

  if (text.startsWith("/start")) {
    const code = text.split(/\s+/)[1] || "";
    if (!code) {
      await reply("Hi! To get alerts here, open Nifti, go to <b>Settings → Telegram alerts</b> and tap <b>Link my Telegram</b>. It takes one tap.", open);
      return;
    }
    const { data } = await admin.rpc("telegram_consume_code", { p_code: code.slice(0, 64), p_chat: chat, p_name: name });
    if (!data?.ok) {
      await reply("That link has expired or was already used. Open Nifti and tap <b>Link my Telegram</b> again.", open);
      return;
    }
    await reply(`Linked. <b>${esc(data.member)}</b>, you will get <b>${esc(data.business)}</b> alerts here.\n\nTry /today to see today at a glance, or /help to see what Nifti can do. Send /stop any time to turn alerts off.`, open);
    return;
  }
  if (text.startsWith("/stop")) {
    const { data } = await admin.rpc("telegram_unlink_chat", { p_chat: chat });
    await reply(data ? "Done. No more Nifti alerts on this phone. Link again any time from Nifti Settings." : "This phone was not linked to Nifti.");
    return;
  }
  if (text.startsWith("/today")) {
    const { data: b } = await admin.rpc("telegram_brief", { p_chat: chat });
    if (!b) {
      await reply("This phone is not linked yet. Open Nifti, go to <b>Settings → Telegram alerts</b> and tap <b>Link my Telegram</b>.", open);
      return;
    }
    const rows = [
      `<b>${esc(b.business)} today</b>`,
      "",
      `Orders to confirm: <b>${b.to_confirm}</b>`,
      `Orders to deliver: <b>${b.to_deliver}</b>`,
      `Orders arriving for you: <b>${b.arriving}</b>`,
      `Sold in the shop today: <b>${peso(b.sales_today)}</b>`,
      `Customers owe you: <b>${peso(b.owed_to_you)}</b>`,
      `You owe suppliers: <b>${peso(b.you_owe)}</b>`,
      `Items running low: <b>${b.low_stock}</b>`,
    ];
    await reply(rows.join("\n"), open);
    return;
  }
  // one number at a time, by command or by a plain shop word
  const word = text.toLowerCase();
  const base = appUrl.replace(/#.*$/, "");
  const ask = /^\/utang|\butang\b|\bsingil|\bowe/.test(word) ? "utang" : /^\/benta|\bbenta\b|\bsales?\b/.test(word) ? "benta" : /^\/stock|\bstock\b|\bubos|\bpaubos/.test(word) ? "stock" : "";
  if (ask) {
    const { data: b } = await admin.rpc("telegram_brief", { p_chat: chat });
    if (!b) { await reply(NOT_LINKED, open); return; }
    const page = (hash: string, label: string) => ({ reply_markup: { inline_keyboard: [[{ text: label, url: base + hash }]] } });
    if (ask === "utang") await reply(`<b>${esc(b.business)}</b>\nSinisingil mo sa customers: <b>${peso(b.owed_to_you)}</b>\nUtang mo sa suppliers: <b>${peso(b.you_owe)}</b>`, page("#collections", "Buksan ang Getting paid"));
    else if (ask === "benta") await reply(`<b>${esc(b.business)}</b>\nBenta sa tindahan ngayong araw: <b>${peso(b.sales_today)}</b>`, page("#sales", "Buksan ang Sales"));
    else await reply(`<b>${esc(b.business)}</b>\nItems na paubos na: <b>${b.low_stock}</b>`, page("#inventory", "Buksan ang Stock"));
    return;
  }
  const pages = { reply_markup: { inline_keyboard: [
    [{ text: "Orders", url: base + "#orders" }, { text: "Utang", url: base + "#collections" }],
    [{ text: "Benta", url: base + "#sales" }, { text: "Stock", url: base + "#inventory" }],
    [{ text: "Need help? Kausapin ang Nifti team", url: base + "#help" }],
  ] } };
  await reply(HELP, pages);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Use POST." }, 405);
  const tgSecret = req.headers.get("X-Telegram-Bot-Api-Secret-Token");
  if (tgSecret) {
    const expected = await secret("telegram_webhook_secret");
    const token = await secret("telegram_bot_token");
    if (!expected || tgSecret !== expected || !token) return json({ error: "forbidden" }, 403);
    try {
      const update = await req.json();
      if (update?.message) await onMessage(token, update.message);
    } catch (e) {
      console.error("telegram-bot", String(e).slice(0, 200));
    }
    return json({ ok: true }); // always 200 to Telegram so it does not retry forever
  }
  let body: any = {};
  try { body = await req.json(); } catch (_) {}
  if (body?.action === "setup") return await setup(req);
  return json({ error: "forbidden" }, 403);
});
