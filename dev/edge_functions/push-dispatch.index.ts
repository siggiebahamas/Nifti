import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import webpush from "npm:web-push@3";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
// Delivers queued notifications (public.notification_outbox) to phones via Web Push, and by
// email when email is configured: either Resend (resend_api_key + email_from, needs a domain) or
// a Gmail account's app password (smtp_user + smtp_pass, no domain needed). Called only by the
// database itself (pg_net from nifti_notify(), plus a 2-minute retry cron) with a shared secret
// stored in public.app_secrets -- verify_jwt is off because there is no user session on those
// calls, and the secret header is the authorization boundary instead.
// Category 'support' rows are Help-form messages: emailed to the support inbox, never pushed.
// Rows with to_email are messages from a business to its own customer who isn't on Nifti
// (payment reminders, reorder reminders): emailed to that address only, never pushed.
// Rows with only_member go to that one person's phones and nobody else's (money alerts are sent
// as one row per owner / manager, so a phone that isn't linked to a person never gets them).
// The same alert sent to several people is emailed to the business inbox once.
// The site address comes from app_secrets.app_url, so a new domain only needs that one value.
const admin = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
const DEFAULT_APP_URL = "https://siggiebahamas.github.io/Nifti/";
const PREF = {
  orders: "order_updates",
  messages: "new_messages",
  leads: "lead_alerts",
  summary: "daily_summary",
  weekly: "weekly_summary"
};
function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}
async function secret(name) {
  const { data } = await admin.from("app_secrets").select("value").eq("name", name).maybeSingle();
  return data?.value ?? null;
}
async function ensureVapid() {
  let pub = await secret("vapid_public");
  let priv = await secret("vapid_private");
  if (pub && priv) return {
    pub,
    priv
  };
  const k = webpush.generateVAPIDKeys();
  await admin.from("app_secrets").upsert([
    {
      name: "vapid_public",
      value: k.publicKey
    },
    {
      name: "vapid_private",
      value: k.privateKey
    }
  ], {
    onConflict: "name",
    ignoreDuplicates: true
  });
  pub = await secret("vapid_public");
  priv = await secret("vapid_private");
  return {
    pub: pub,
    priv: priv
  };
}
async function makeMailer() {
  const resendKey = await secret("resend_api_key");
  const emailFrom = await secret("email_from");
  if (resendKey && emailFrom) {
    return {
      send: async (to, subject, text)=>{
        const r = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: "Bearer " + resendKey,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            from: emailFrom,
            to: [
              to
            ],
            subject,
            text
          })
        });
        if (!r.ok) throw new Error("resend " + r.status);
      },
      close: async ()=>{}
    };
  }
  const user = await secret("smtp_user");
  const pass = await secret("smtp_pass");
  if (!user || !pass) return null;
  const host = await secret("smtp_host") || "smtp.gmail.com";
  const from = emailFrom || `Nifti <${user}>`;
  let client = null;
  return {
    send: async (to, subject, text)=>{
      if (!client) client = new SMTPClient({
        connection: {
          hostname: host,
          port: 465,
          tls: true,
          auth: {
            username: user,
            password: pass
          }
        }
      });
      await client.send({
        from,
        to,
        subject,
        content: text
      });
    },
    close: async ()=>{
      if (client) await client.close();
    }
  };
}
Deno.serve(async (req)=>{
  const expected = await secret("dispatch_secret");
  if (!expected || req.headers.get("x-dispatch-secret") !== expected) return json({
    error: "forbidden"
  }, 403);
  let mailer = null;
  try {
    const { pub, priv } = await ensureVapid();
    webpush.setVapidDetails("mailto:support@nifti.app", pub, priv);
    mailer = await makeMailer();
    const supportInbox = await secret("support_inbox") || await secret("smtp_user");
    const APP_URL = await secret("app_url") || DEFAULT_APP_URL;
    const { data: batch, error } = await admin.rpc("claim_notifications", {
      p_limit: 100
    });
    if (error) return json({
      error: error.message
    }, 500);
    const prefsCache = new Map();
    const emailed = new Set();
    let sent = 0;
    for (const n of batch || []){
      const errors = [];
      const link = APP_URL + (String(n.url || "").startsWith("./") ? String(n.url).slice(2) : "");
      if (n.to_email) {
        if (mailer) {
          try {
            await mailer.send(String(n.to_email), n.title, n.body || "");
            sent++;
          } catch (e) {
            errors.push("email " + String(e).slice(0, 80));
          }
        } else errors.push("email not set up");
        await admin.from("notification_outbox").update({
          sent_at: new Date().toISOString(),
          error: errors.length ? errors.join("; ") : null
        }).eq("id", n.id);
        continue;
      }
      if (n.category === "support") {
        if (mailer && supportInbox) {
          try {
            await mailer.send(supportInbox, n.title, n.body || "");
            sent++;
          } catch (e) {
            errors.push("email " + String(e).slice(0, 80));
          }
        } else errors.push("no support inbox configured");
        await admin.from("notification_outbox").update({
          sent_at: new Date().toISOString(),
          error: errors.length ? errors.join("; ") : null
        }).eq("id", n.id);
        continue;
      }
      let prefs = prefsCache.get(n.business_id);
      if (prefs === undefined) {
        const { data } = await admin.from("notification_settings").select("*").eq("business_id", n.business_id).maybeSingle();
        prefs = data ?? null;
        prefsCache.set(n.business_id, prefs);
      }
      const col = PREF[n.category];
      const wanted = !prefs || !col || prefs[col] !== false;
      if (wanted) {
        const { data: subs } = await admin.from("push_subscriptions").select("id, subscription, team_member_id").eq("business_id", n.business_id);
        for (const s of subs || []){
          if (n.only_member && s.team_member_id !== n.only_member) continue;
          if (n.exclude_member && s.team_member_id === n.exclude_member) continue;
          try {
            await webpush.sendNotification(s.subscription, JSON.stringify({
              title: n.title,
              body: n.body,
              url: n.url
            }));
            sent++;
          } catch (err) {
            const code = err.statusCode;
            if (code === 404 || code === 410) await admin.from("push_subscriptions").delete().eq("id", s.id);
            else errors.push("push " + String(code ?? err));
          }
        }
        const key = n.business_id + "|" + n.title + "|" + (n.body || "");
        if (mailer && prefs && prefs.channel_email && prefs.email_address && n.category !== "team" && !emailed.has(key)) {
          emailed.add(key);
          try {
            await mailer.send(String(prefs.email_address), n.title, (n.body ? n.body + "\n\n" : "") + "Open Nifti: " + link);
          } catch (e) {
            errors.push("email " + String(e).slice(0, 80));
          }
        }
      }
      await admin.from("notification_outbox").update({
        sent_at: new Date().toISOString(),
        error: errors.length ? errors.join("; ").slice(0, 300) : null
      }).eq("id", n.id);
    }
    return json({
      ok: true,
      processed: (batch || []).length,
      sent
    });
  } catch (e) {
    console.error(e);
    return json({
      error: "Unexpected error"
    }, 500);
  } finally{
    if (mailer) {
      try {
        await mailer.close();
      } catch (_) {}
    }
  }
});