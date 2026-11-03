import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
// Narrow door for the daily growth routine. With the growth key (app_secrets.growth_key) it can
// only: GET the funnel numbers, lead target, existing lead names and the last brief; POST new
// leads and a brief. Nothing else in the database is reachable through it.
const admin = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
const json = (b, s = 200)=>new Response(JSON.stringify(b), {
    status: s,
    headers: {
      "Content-Type": "application/json"
    }
  });
const clip = (v, n)=>v == null ? null : String(v).replace(/[<>]/g, "").trim().slice(0, n) || null;
Deno.serve(async (req)=>{
  const { data: k } = await admin.from("app_secrets").select("value").eq("name", "growth_key").maybeSingle();
  if (!k?.value || req.headers.get("x-growth-key") !== k.value) return json({
    error: "forbidden"
  }, 403);
  if (req.method === "GET") {
    const [funnel, target, names, brief] = await Promise.all([
      admin.rpc("admin_funnel_data"),
      admin.from("app_secrets").select("value").eq("name", "growth_target").maybeSingle(),
      admin.from("growth_leads").select("name").limit(5000),
      admin.from("growth_briefs").select("body, created_at").order("created_at", {
        ascending: false
      }).limit(1)
    ]);
    return json({
      funnel: funnel.data,
      target: target.data?.value ?? null,
      existing_lead_names: (names.data || []).map((r)=>r.name),
      last_brief: (brief.data || [])[0] ?? null
    });
  }
  if (req.method === "POST") {
    let body = {};
    try {
      body = await req.json();
    } catch (_) {
      return json({
        error: "bad json"
      }, 400);
    }
    const leads = Array.isArray(body.leads) ? body.leads.slice(0, 10) : [];
    let added = 0;
    for (const l of leads){
      const name = clip(l.name, 150);
      if (!name) continue;
      const { error } = await admin.from("growth_leads").insert({
        name,
        kind: l.kind === "buyer" ? "buyer" : "supplier",
        category: clip(l.category, 100),
        area: clip(l.area, 100),
        source_url: /^https?:\/\//.test(String(l.source_url || "")) ? clip(l.source_url, 400) : null,
        contact: clip(l.contact, 200),
        why: clip(l.why, 300),
        opener: clip(l.opener, 400)
      });
      if (!error) added++;
    }
    let briefSaved = false;
    const text = clip(body.brief, 6000);
    if (text) {
      const { error } = await admin.from("growth_briefs").insert({
        body: text
      });
      briefSaved = !error;
    }
    return json({
      ok: true,
      leads_added: added,
      brief_saved: briefSaved
    });
  }
  return json({
    error: "method"
  }, 405);
});