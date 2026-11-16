import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
// Viber photos and files for Nifti.
//  op=upload  The Nifti Android app sends a photo or file it picked up from Viber. It proves who it is with its
//             device key (never the person's login). The file can only land in a chat that belongs to that
//             person's own business and phone, under viber-media/<business>/<chat>/...
//  op=ignore  The phone's owner says a chat is personal ("Not business"). Everything stored for that chat,
//             messages and files, is deleted, and the phone stops sending it.
const SB_URL = Deno.env.get("SUPABASE_URL")!;
const admin = createClient(SB_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-nifti-device, x-nifti-secret, x-nifti-name",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
const MAX = 25 * 1024 * 1024;
const safeName = (s: string) => (s || "file").normalize("NFKD").replace(/[^\w.\- ]+/g, "").replace(/\s+/g, "_").slice(-80) || "file";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  const u = new URL(req.url), op = u.searchParams.get("op");
  try {
    if (op === "upload") {
      const device = req.headers.get("x-nifti-device") || "", secret = req.headers.get("x-nifti-secret") || "";
      const msgId = u.searchParams.get("m") || "";
      if (!/^[0-9a-f-]{36}$/i.test(device) || !/^[0-9a-f-]{36}$/i.test(msgId)) return json({ error: "bad request" }, 400);
      const { data: dev, error: de } = await admin.rpc("viber_dev_check", { p_device: device, p_secret: secret });
      if (de || !dev) return json({ error: "device not connected" }, 401);
      const { data: msg } = await admin.from("viber_messages").select("id, thread_id, business_id, viber_threads!inner(owner_user_id, business_id)").eq("id", msgId).maybeSingle();
      // deno-lint-ignore no-explicit-any
      const th: any = msg && (msg as any).viber_threads;
      if (!msg || msg.business_id !== dev.business_id || !th || th.owner_user_id !== dev.user_id || th.business_id !== dev.business_id) return json({ error: "chat not found" }, 404);
      const len = Number(req.headers.get("content-length") || "0");
      if (len > MAX) return json({ error: "too big", max: MAX }, 413);
      const bytes = new Uint8Array(await req.arrayBuffer());
      if (!bytes.length) return json({ error: "empty file" }, 400);
      if (bytes.length > MAX) return json({ error: "too big", max: MAX }, 413);
      const mime = (req.headers.get("content-type") || "application/octet-stream").split(";")[0].slice(0, 100);
      const name = safeName(decodeURIComponent(req.headers.get("x-nifti-name") || "") || ("viber." + (mime.split("/")[1] || "bin")));
      const path = `${dev.business_id}/${msg.thread_id}/${msg.id}-${name}`;
      const { error: ue } = await admin.storage.from("viber-media").upload(path, bytes, { contentType: mime, upsert: true });
      if (ue) return json({ error: "upload failed", detail: ue.message }, 500);
      const { error: me } = await admin.from("viber_messages").update({ media_path: path, media_name: name, media_mime: mime, media_size: bytes.length, media_status: "ok", ack: false }).eq("id", msg.id);
      if (me) return json({ error: "save failed" }, 500);
      return json({ ok: true, path });
    }
    if (op === "ignore") {
      const jwt = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
      const { data: who } = await admin.auth.getUser(jwt);
      const uid = who && who.user && who.user.id;
      if (!uid) return json({ error: "sign in first" }, 401);
      const t = u.searchParams.get("t") || "";
      if (!/^[0-9a-f-]{36}$/i.test(t)) return json({ error: "bad request" }, 400);
      const { data: th } = await admin.from("viber_threads").select("id, business_id, owner_user_id").eq("id", t).maybeSingle();
      if (!th || th.owner_user_id !== uid) return json({ error: "only the phone's owner can do this" }, 403);
      const { data: tm } = await admin.from("team_members").select("id").eq("business_id", th.business_id).eq("auth_user_id", uid).limit(1);
      if (!tm || !tm.length) return json({ error: "not allowed" }, 403);
      const folder = `${th.business_id}/${th.id}`;
      for (let i = 0; i < 20; i++) {
        const { data: files } = await admin.storage.from("viber-media").list(folder, { limit: 100 });
        if (!files || !files.length) break;
        await admin.storage.from("viber-media").remove(files.map((f) => `${folder}/${f.name}`));
        if (files.length < 100) break;
      }
      await admin.from("viber_messages").delete().eq("thread_id", th.id);
      await admin.from("viber_threads").update({ status: "ignored", last_text: null, unread: 0, party_id: null, party_name: null, party_kind: null }).eq("id", th.id);
      return json({ ok: true });
    }
    return json({ error: "unknown op" }, 400);
  } catch (e) {
    return json({ error: "server error", detail: String((e as Error).message || e).slice(0, 200) }, 500);
  }
});
