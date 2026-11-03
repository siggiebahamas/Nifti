import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
// Stores the caller's browser push subscription for their own business (RLS-scoped client, so it
// can only ever write a row for the caller's own business), tagged with which teammate owns the
// device so a notification can skip the person who caused it, or go only to an assignee.
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};
function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...CORS_HEADERS
    }
  });
}
Deno.serve(async (req)=>{
  if (req.method === "OPTIONS") return new Response("ok", {
    headers: CORS_HEADERS
  });
  if (req.method !== "POST") return json({
    error: "POST only"
  }, 405);
  try {
    const { subscription, unsubscribe } = await req.json();
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY"), {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({
      error: "Not signed in"
    }, 401);
    const { data: tm, error: tmError } = await supabase.from("team_members").select("id, business_id").eq("auth_user_id", user.id).single();
    if (tmError || !tm) return json({
      error: "Couldn't find your business account"
    }, 403);
    if (!subscription || !subscription.endpoint) return json({
      error: "subscription is required"
    }, 400);
    if (unsubscribe) {
      await supabase.from("push_subscriptions").delete().eq("business_id", tm.business_id).eq("endpoint", subscription.endpoint);
      return json({
        ok: true
      });
    }
    const { error: upsertError } = await supabase.from("push_subscriptions").upsert({
      business_id: tm.business_id,
      endpoint: subscription.endpoint,
      subscription,
      team_member_id: tm.id
    }, {
      onConflict: "business_id,endpoint"
    });
    if (upsertError) {
      console.error(upsertError);
      return json({
        error: "Could not save subscription"
      }, 500);
    }
    return json({
      ok: true
    });
  } catch (e) {
    console.error(e);
    return json({
      error: "Unexpected error"
    }, 500);
  }
});