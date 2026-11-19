// fb-page: connect a business's Facebook Page, post a picture to it, disconnect.
// Secrets needed (Supabase dashboard > Edge Functions > Secrets): FB_APP_ID, FB_APP_SECRET.
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided by Supabase.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
const G = "https://graph.facebook.com/v19.0";
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const jwt = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    const { data: u } = await admin.auth.getUser(jwt);
    if (!u?.user) return json({ error: "Please sign in again." }, 401);
    const { data: tm } = await admin.from("team_members").select("business_id, roles, status").eq("auth_user_id", u.user.id).eq("status", "active").single();
    if (!tm) return json({ error: "No business found for this sign-in." }, 403);
    const roles: string[] = tm.roles || [];
    const isAdmin = roles.includes("Owner") || roles.includes("General Manager");
    const body = await req.json();
    const appId = Deno.env.get("FB_APP_ID")!, secret = Deno.env.get("FB_APP_SECRET")!;
    if (body.action === "connect") {
      if (!isAdmin) return json({ error: "Only the owner can connect the Facebook Page." }, 403);
      const t1 = await (await fetch(`${G}/oauth/access_token?client_id=${appId}&client_secret=${secret}&redirect_uri=${encodeURIComponent(body.redirect)}&code=${encodeURIComponent(body.code)}`)).json();
      if (!t1.access_token) return json({ error: t1.error?.message || "Facebook didn't accept the sign-in." });
      const t2 = await (await fetch(`${G}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${secret}&fb_exchange_token=${t1.access_token}`)).json();
      const pages = await (await fetch(`${G}/me/accounts?fields=id,name,access_token,link&access_token=${t2.access_token || t1.access_token}`)).json();
      const p = (pages.data || [])[0];
      if (!p) return json({ error: "No Facebook Page found. Make sure you manage a Page and allowed Nifti to use it." });
      await admin.from("fb_pages").upsert({ business_id: tm.business_id, page_id: p.id, page_name: p.name, page_url: p.link || `https://www.facebook.com/${p.id}`, page_token: p.access_token, connected_by: u.user.id });
      await fetch(`${G}/${p.id}/subscribed_apps?subscribed_fields=feed&access_token=${p.access_token}`, { method: "POST" });
      const { data: biz } = await admin.from("businesses").select("store").eq("id", tm.business_id).single();
      const page = { id: p.id, name: p.name, url: p.link || `https://www.facebook.com/${p.id}` };
      await admin.from("businesses").update({ store: { ...(biz?.store || {}), fb_page: page } }).eq("id", tm.business_id);
      return json({ page });
    }
    const { data: fp } = await admin.from("fb_pages").select("*").eq("business_id", tm.business_id).single();
    if (body.action === "post") {
      if (!fp) return json({ error: "Your Facebook Page isn't connected." });
      if (!(isAdmin || roles.includes("Poster") || roles.includes("Finance"))) return json({ error: "Your role can't post for the shop." }, 403);
      const bin = Uint8Array.from(atob(String(body.image || "")), (c) => c.charCodeAt(0));
      if (bin.length < 1000 || bin.length > 8_000_000) return json({ error: "The picture didn't come through. Try again." });
      const fd = new FormData();
      fd.append("source", new Blob([bin], { type: "image/jpeg" }), "nifti-post.jpg");
      fd.append("caption", String(body.caption || "").slice(0, 5000));
      fd.append("access_token", fp.page_token);
      const r = await (await fetch(`${G}/${fp.page_id}/photos`, { method: "POST", body: fd })).json();
      if (!r.id) return json({ error: r.error?.message || "Facebook didn't take the post." });
      return json({ id: r.id, post_id: r.post_id });
    }
    if (body.action === "disconnect") {
      if (!isAdmin) return json({ error: "Only the owner can disconnect the Page." }, 403);
      await admin.from("fb_pages").delete().eq("business_id", tm.business_id);
      const { data: biz } = await admin.from("businesses").select("store").eq("id", tm.business_id).single();
      const st = { ...(biz?.store || {}) }; delete (st as Record<string, unknown>).fb_page;
      await admin.from("businesses").update({ store: st }).eq("id", tm.business_id);
      return json({ ok: true });
    }
    return json({ error: "Unknown action." }, 400);
  } catch (e) { return json({ error: String((e as Error).message || e) }, 500); }
});
