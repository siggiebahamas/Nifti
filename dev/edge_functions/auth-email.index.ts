import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
// Password-reset emails, sent through Nifti's own Gmail sender (app_secrets smtp_user/smtp_pass)
// instead of Supabase's built-in mailer, which only delivers to the Supabase team's own addresses.
// Public (the person is signed out), so it never says whether an account exists and is throttled
// per address and overall. The link is Supabase's normal recovery link; the app already handles it.
// The site address comes from app_secrets.app_url, so a new domain only needs that one value.
const admin = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
const DEFAULT_APP_URL = "https://siggiebahamas.github.io/Nifti/";
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};
function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS,
      "Content-Type": "application/json"
    }
  });
}
async function secret(name) {
  const { data } = await admin.from("app_secrets").select("value").eq("name", name).maybeSingle();
  return data?.value ?? null;
}
Deno.serve(async (req)=>{
  if (req.method === "OPTIONS") return new Response("ok", {
    headers: CORS
  });
  if (req.method !== "POST") return json({
    error: "method"
  }, 405);
  let email = "";
  try {
    email = String((await req.json()).email || "").trim().toLowerCase();
  } catch (_) {}
  if (!/^[^@\s]{1,64}@[^@\s]{1,190}\.[^@\s]{2,}$/.test(email)) return json({
    error: "Enter a valid email."
  }, 400);
  const user = await secret("smtp_user");
  const pass = await secret("smtp_pass");
  if (!user || !pass) return json({
    ok: false,
    fallback: true
  });
  const hourAgo = new Date(Date.now() - 3600_000).toISOString();
  const { count: mine } = await admin.from("password_reset_log").select("id", {
    count: "exact",
    head: true
  }).eq("email", email).gte("created_at", hourAgo);
  const { count: all } = await admin.from("password_reset_log").select("id", {
    count: "exact",
    head: true
  }).gte("created_at", hourAgo);
  if ((mine ?? 0) >= 3 || (all ?? 0) >= 60) return json({
    ok: true
  });
  await admin.from("password_reset_log").insert({
    email
  });
  const appUrl = await secret("app_url") || DEFAULT_APP_URL;
  const { data, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: {
      redirectTo: appUrl
    }
  });
  if (error || !data?.properties?.action_link) return json({
    ok: true
  }); // no such account: same answer
  const from = await secret("email_from") || `Nifti <${user}>`;
  const client = new SMTPClient({
    connection: {
      hostname: await secret("smtp_host") || "smtp.gmail.com",
      port: 465,
      tls: true,
      auth: {
        username: user,
        password: pass
      }
    }
  });
  try {
    await client.send({
      from,
      to: email,
      subject: "Reset your Nifti password",
      content: `Someone (hopefully you) asked to reset your Nifti password.\n\nTap this link to set a new one. It works once, for 1 hour:\n${data.properties.action_link}\n\nDidn't ask for this? Ignore this email. Your password stays the same.`
    });
  } catch (e) {
    console.error("reset email failed", e);
    return json({
      ok: false,
      error: "Couldn't send the email right now. Try again in a few minutes."
    }, 502);
  } finally{
    try {
      await client.close();
    } catch (_) {}
  }
  return json({
    ok: true
  });
});