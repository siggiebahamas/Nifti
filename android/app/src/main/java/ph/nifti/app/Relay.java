package ph.nifti.app;

import android.app.Notification;
import android.app.PendingIntent;
import android.app.RemoteInput;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.HandlerThread;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.TimeZone;
import java.util.concurrent.ConcurrentHashMap;

/**
 * The heart of the app. Keeps a list of Viber messages on the phone until the server has them
 * (so no signal never loses a message), finds photos and files, sends replies typed in Nifti
 * from the person's own Viber, and raises a warning the moment something can't go through.
 * Everything runs on one background thread, in order.
 */
public final class Relay {
    public static final String VIBER = "com.viber.voip";
    private static Relay inst;

    public static synchronized Relay get(Context c) {
        if (inst == null) inst = new Relay(c.getApplicationContext());
        return inst;
    }

    final Context ctx;
    final Store store;
    final Api api;
    final Handler h;
    /** From the newest Viber notification of each chat: its reply button and the "open this chat" link. Phone memory only. */
    final Map<String, Notification.Action> replies = new ConcurrentHashMap<>();
    final Map<String, PendingIntent> opens = new ConcurrentHashMap<>();
    final Map<String, String> titles = new ConcurrentHashMap<>();
    private final Set<String> usedMedia = new HashSet<>();
    private boolean loopOn;
    private long backoff, nextFlushAt, lastHeartbeat;

    private Relay(Context c) {
        ctx = c;
        store = new Store(c);
        api = new Api(store);
        HandlerThread t = new HandlerThread("nifti-relay");
        t.start();
        h = new Handler(t.getLooper());
        Notify.channels(c);
    }

    public void start() {
        h.post(() -> {
            if (loopOn) return;
            loopOn = true;
            h.post(loop);
        });
    }

    private final Runnable loop = new Runnable() {
        @Override public void run() {
            try { tick(false); } catch (Throwable ignore) {}
            h.postDelayed(this, store.connected() ? 20000 : 60000);
        }
    };

    private final Runnable flushSoon = () -> { try { flush(); media(); } catch (Throwable ignore) {} };

    public void tickAsync() { h.post(() -> { try { tick(true); } catch (Throwable ignore) {} }); }

    /** Runs on the relay thread. */
    void tick(boolean heartbeatNow) {
        if (!store.connected() || store.revoked()) return;
        flush();
        media();
        outbox();
        if (heartbeatNow || System.currentTimeMillis() - lastHeartbeat > 10 * 60 * 1000L) heartbeat();
    }

    // ---------- incoming messages ----------

    /** Adds one message to the phone's list and sends it within a second. A file the phone already has goes along with it. */
    public void enqueue(JSONObject item, File local, String mime, String name) {
        h.post(() -> {
            try {
                if (store.ignored().contains(item.optString("key"))) return;
                titles.put(item.optString("key"), item.optString("title"));
                if (local != null) {
                    item.put("_local", local.getAbsolutePath());
                    item.put("_mime", mime == null ? "" : mime);
                    item.put("_name", name == null ? local.getName() : name);
                }
                store.add("queue.json", item);
                store.putLong("lastIn", System.currentTimeMillis());
            } catch (Exception ignore) {}
            h.removeCallbacks(flushSoon);
            h.postDelayed(flushSoon, 600);
        });
    }

    void flush() {
        if (!store.connected() || store.revoked()) return;
        List<JSONObject> q = store.list("queue.json");
        if (q.isEmpty()) return;
        long now = System.currentTimeMillis();
        if (backoff > 0 && now < nextFlushAt) return;
        int n = Math.min(100, q.size());
        List<JSONObject> batch = new ArrayList<>(q.subList(0, n));
        JSONArray items = new JSONArray();
        try {
            for (JSONObject it : batch) {
                JSONObject clean = new JSONObject(it.toString());
                clean.remove("_local"); clean.remove("_mime"); clean.remove("_name");
                items.put(clean);
            }
            JSONObject args = new JSONObject();
            args.put("p_items", items);
            JSONArray res = new JSONArray(api.rpc("viber_dev_ingest", args));
            Map<String, JSONObject> byKey = new HashMap<>();
            for (int i = 0; i < res.length(); i++) { JSONObject r = res.getJSONObject(i); byKey.put(r.optString("dkey"), r); }
            for (JSONObject it : batch) {
                JSONObject r = byKey.get(it.optString("dkey"));
                if (r == null || !r.has("id")) continue;
                if (!Parse.needsMedia(it.optString("kind")) || !"waiting".equals(it.optString("media"))) continue;
                JSONObject task = new JSONObject();
                task.put("id", r.getString("id"));
                task.put("kind", it.optString("kind"));
                task.put("key", it.optString("key"));
                task.put("title", it.optString("title"));
                task.put("at", parseIso(it.optString("at")));
                task.put("created", now);
                task.put("hint", it.optString("_hint", ""));
                if (it.has("_local")) { task.put("local", it.getString("_local")); task.put("mime", it.optString("_mime")); task.put("name", it.optString("_name")); }
                store.add("media.json", task);
                // look for the file again a few times in the first minute
                h.postDelayed(this::media, 8000);
                h.postDelayed(this::media, 25000);
                h.postDelayed(this::media, 50000);
                h.postDelayed(this::media, 80000);
            }
            List<JSONObject> rest = store.list("queue.json");
            store.saveList("queue.json", rest.size() >= n ? new ArrayList<>(rest.subList(n, rest.size())) : new ArrayList<>());
            store.putLong("lastSent", now);
            backoff = 0;
            if (rest.size() > n) h.post(this::flush);
        } catch (Api.Fail f) {
            if (f.disconnected) disconnected();
            else retryLater();
        } catch (Exception e) {
            retryLater();
        }
    }

    private void retryLater() {
        backoff = Math.min(Math.max(30000L, backoff * 2), 15 * 60 * 1000L);
        nextFlushAt = System.currentTimeMillis() + backoff;
    }

    // ---------- photos and files ----------

    void media() {
        if (!store.connected() || store.revoked()) return;
        List<JSONObject> tasks = store.list("media.json");
        if (tasks.isEmpty()) return;
        List<JSONObject> keep = new ArrayList<>();
        long now = System.currentTimeMillis();
        for (JSONObject t : tasks) {
            try {
                String kind = t.optString("kind");
                String local = t.optString("local", "");
                if (local.isEmpty()) {
                    MediaFinder.Found f = null;
                    if (MediaFinder.allowed(ctx)) {
                        f = "file".equals(kind)
                            ? MediaFinder.findFile(ctx, t.optString("hint"), t.optLong("at"), usedMedia)
                            : MediaFinder.find(ctx, kind, t.optLong("at"), usedMedia);
                    }
                    if (f != null) {
                        File dst = new File(store.mediaDir(), t.getString("id") + "-" + MediaFinder.safe(f.name));
                        if (MediaFinder.copy(ctx, f.uri, dst)) {
                            usedMedia.add(f.uri.toString());
                            t.put("local", dst.getAbsolutePath()); t.put("mime", f.mime); t.put("name", f.name);
                            local = dst.getAbsolutePath();
                        }
                    }
                }
                if (!local.isEmpty()) {
                    File file = new File(local);
                    if (!file.exists()) { t.remove("local"); keep.add(t); continue; }
                    try {
                        api.upload(t.getString("id"), file, t.optString("mime"), t.optString("name"));
                        file.delete();
                        Notify.clearMissing(ctx, t.optString("key"), kind);
                    } catch (Api.Fail f) {
                        if (f.disconnected) { disconnected(); keep.add(t); }
                        else if (f.code == 404 || f.code == 413 || f.code == 400) {
                            file.delete();
                            markMissing(t, f.code == 413 ? "too big" : null);
                        } else keep.add(t);
                    } catch (IOException e) {
                        keep.add(t); // no signal: try again on the next round
                    }
                    continue;
                }
                long age = now - t.optLong("created", now);
                // a photo usually appears on the phone within seconds when Viber auto-downloads it; a file almost never does
                long wait = "file".equals(kind) ? 20000L : 75000L;
                if (age > wait) markMissing(t, null);
                else keep.add(t);
            } catch (Exception e) {
                keep.add(t);
            }
        }
        // anything still waiting after a day is dropped from the phone (it was already marked missing on the server)
        List<JSONObject> fresh = new ArrayList<>();
        for (JSONObject t : keep) if (now - t.optLong("created", now) < 24 * 3600 * 1000L) fresh.add(t);
        store.saveList("media.json", fresh);
    }

    private void markMissing(JSONObject t, String why) {
        try {
            JSONObject a = new JSONObject();
            a.put("p_msg", t.getString("id"));
            a.put("p_status", "missing");
            api.rpc("viber_dev_media", a);
        } catch (Exception ignore) {}
        Notify.missing(ctx, t.optString("key"), t.optString("title"), t.optString("kind"), t.optString("hint"), why);
    }

    // ---------- replies typed in Nifti ----------

    void outbox() {
        if (!store.connected() || store.revoked()) return;
        try {
            JSONArray a = new JSONArray(api.rpc("viber_dev_outbox", new JSONObject()));
            for (int i = 0; i < a.length(); i++) {
                JSONObject o = a.getJSONObject(i);
                String reason = send(o);
                JSONObject m = new JSONObject();
                m.put("p_msg", o.getString("id"));
                m.put("p_ok", reason == null);
                m.put("p_reason", reason == null ? JSONObject.NULL : reason);
                try { api.rpc("viber_dev_mark", m); } catch (Exception ignore) {}
                if (reason != null) Notify.notSent(ctx, o.optString("key"), o.optString("title"), o.optString("body"), o.getString("id"));
            }
        } catch (Api.Fail f) {
            if (f.disconnected) disconnected();
        } catch (Exception ignore) {}
    }

    /** null when sent, otherwise the reason in plain words */
    private String send(JSONObject o) {
        String key = o.optString("key"), title = o.optString("title"), body = o.optString("body");
        Notification.Action a = replies.get(key);
        if (a != null && a.getRemoteInputs() != null && a.getRemoteInputs().length > 0) {
            try {
                Intent fill = new Intent();
                Bundle b = new Bundle();
                for (RemoteInput ri : a.getRemoteInputs()) b.putCharSequence(ri.getResultKey(), body);
                RemoteInput.addResultsToIntent(a.getRemoteInputs(), fill, b);
                a.actionIntent.send(ctx, 0, fill);
                return null;
            } catch (PendingIntent.CanceledException e) {
                replies.remove(key);
            } catch (Exception e) {
                replies.remove(key);
            }
        }
        ScreenReader sr = ScreenReader.live;
        if (sr != null && sr.canSendTo(title)) {
            if (sr.sendBlocking(title, body, 12000)) return null;
            return "Viber was open on " + title + " but the message box didn't respond";
        }
        if (!Status.listenerOn(ctx)) return "Nifti can't see Viber on your phone right now (notification access is off)";
        return "Viber's reply button for " + (title.isEmpty() ? "this chat" : title) + " had closed, so it couldn't be sent from your phone automatically";
    }

    // ---------- keep-alive ----------

    void heartbeat() {
        if (!store.connected()) return;
        try {
            JSONObject a = new JSONObject();
            a.put("p_flags", Status.flags(ctx));
            a.put("p_version", BuildConfig.VERSION_CODE);
            JSONObject r = new JSONObject(api.rpc("viber_dev_heartbeat", a));
            store.setIgnored(r.optJSONArray("ignored") == null ? new JSONArray() : r.getJSONArray("ignored"));
            store.setChats(r.optJSONArray("chats") == null ? new JSONArray() : r.getJSONArray("chats"));
            store.putString("businessName", r.optString("business"));
            store.setRevoked(false);
            lastHeartbeat = System.currentTimeMillis();
            store.putLong("hb", lastHeartbeat);
        } catch (Api.Fail f) {
            if (f.disconnected) disconnected();
        } catch (Exception ignore) {}
    }

    private void disconnected() {
        if (!store.revoked()) Notify.disconnected(ctx);
        store.setRevoked(true);
    }

    // ---------- helpers ----------
    static String iso(long ms) {
        SimpleDateFormat f = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
        f.setTimeZone(TimeZone.getTimeZone("UTC"));
        return f.format(new Date(ms));
    }

    static long parseIso(String s) {
        try {
            SimpleDateFormat f = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
            f.setTimeZone(TimeZone.getTimeZone("UTC"));
            Date d = f.parse(s);
            return d == null ? System.currentTimeMillis() : d.getTime();
        } catch (Exception e) { return System.currentTimeMillis(); }
    }
}
