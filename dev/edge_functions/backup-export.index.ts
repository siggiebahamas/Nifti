import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
// Weekly backup: saves everything businesses put into Nifti (backup_snapshot()) as a gzipped JSON
// file in the private "backups" storage bucket, and keeps the newest 10. Called only by the
// database (pg_cron weekly, or the owner's "Back up now" button) with the shared dispatch secret.
const admin = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
const KEEP = 10;
function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}
Deno.serve(async (req)=>{
  const { data: sec } = await admin.from("app_secrets").select("value").eq("name", "dispatch_secret").maybeSingle();
  if (!sec?.value || req.headers.get("x-dispatch-secret") !== sec.value) return json({
    error: "forbidden"
  }, 403);
  try {
    const { data, error } = await admin.rpc("backup_snapshot");
    if (error) return json({
      error: error.message
    }, 500);
    const text = JSON.stringify(data);
    const gz = await new Response(new Blob([
      text
    ]).stream().pipeThrough(new CompressionStream("gzip"))).arrayBuffer();
    const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const name = `nifti-backup-${stamp}.json.gz`;
    const up = await admin.storage.from("backups").upload(name, new Uint8Array(gz), {
      contentType: "application/gzip",
      upsert: true
    });
    if (up.error) return json({
      error: up.error.message
    }, 500);
    const { data: files } = await admin.storage.from("backups").list("", {
      limit: 100,
      sortBy: {
        column: "name",
        order: "desc"
      }
    });
    const old = (files || []).filter((f)=>f.name.startsWith("nifti-backup-")).slice(KEEP).map((f)=>f.name);
    if (old.length) await admin.storage.from("backups").remove(old);
    return json({
      ok: true,
      file: name,
      bytes: gz.byteLength,
      raw_bytes: text.length,
      removed: old.length
    });
  } catch (e) {
    console.error(e);
    return json({
      error: "Unexpected error"
    }, 500);
  }
});