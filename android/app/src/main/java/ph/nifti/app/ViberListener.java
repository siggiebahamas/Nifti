package ph.nifti.app;

import android.app.Notification;
import android.app.Person;
import android.content.ComponentName;
import android.graphics.Bitmap;
import android.graphics.drawable.Icon;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Parcelable;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;

import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;

/**
 * Reads Viber's own notifications on this phone, the way a smartwatch does. It never logs in to Viber
 * and never talks to Viber's servers, so Viber sees nothing unusual.
 * Only notifications from the Viber app are looked at; everything else is ignored.
 */
public class ViberListener extends NotificationListenerService {
    static volatile ViberListener live;

    @Override public void onListenerConnected() {
        live = this;
        Relay.get(this).start();
        try {
            StatusBarNotification[] all = getActiveNotifications();
            if (all != null) for (StatusBarNotification s : all) handle(s);
        } catch (Exception ignore) {}
    }

    @Override public void onListenerDisconnected() {
        live = null;
        // some phones unbind us after an update or a cleanup; ask Android to bring us back
        try { requestRebind(new ComponentName(this, ViberListener.class)); } catch (Exception ignore) {}
    }

    @Override public void onNotificationPosted(StatusBarNotification sbn) {
        try { handle(sbn); } catch (Exception ignore) {}
    }

    private void handle(StatusBarNotification sbn) {
        if (sbn == null || !Relay.VIBER.equals(sbn.getPackageName())) return;
        Notification n = sbn.getNotification();
        if (n == null) return;
        if ((n.flags & Notification.FLAG_GROUP_SUMMARY) != 0) return;
        if ((n.flags & Notification.FLAG_ONGOING_EVENT) != 0) return;
        if (Notification.CATEGORY_CALL.equals(n.category) || Notification.CATEGORY_MISSED_CALL.equals(n.category)) return;
        Bundle ex = n.extras;
        if (ex == null) return;
        Relay relay = Relay.get(this);
        Store store = relay.store;

        CharSequence conv = ex.getCharSequence(Notification.EXTRA_CONVERSATION_TITLE);
        CharSequence ttl = ex.getCharSequence(Notification.EXTRA_TITLE);
        boolean group = (Build.VERSION.SDK_INT >= 28 && ex.getBoolean(Notification.EXTRA_IS_GROUP_CONVERSATION)) || conv != null;
        String chat = conv != null ? conv.toString() : (ttl == null ? "" : ttl.toString());
        chat = chat.replaceAll("\\s*\\(\\d+ (?:new )?messages?\\)$", "").trim();
        if (chat.isEmpty() || chat.equalsIgnoreCase("Viber")) return;
        String key = Parse.chatKey(chat);

        // keep this chat's reply button and "open chat" link so replies from Nifti can go out from this phone
        if (n.actions != null) for (Notification.Action a : n.actions) {
            if (a != null && a.getRemoteInputs() != null && a.getRemoteInputs().length > 0) { relay.replies.put(key, a); relay.retryFor(key); break; }
        }
        if (n.contentIntent != null) relay.opens.put(key, n.contentIntent);
        relay.titles.put(key, chat);
        if (store.ignored().contains(key)) return;

        boolean any = false;
        Parcelable[] msgs = ex.getParcelableArray(Notification.EXTRA_MESSAGES);
        if (msgs != null && msgs.length > 0) {
            for (Parcelable p : msgs) {
                if (!(p instanceof Bundle)) continue;
                Bundle b = (Bundle) p;
                CharSequence text = b.getCharSequence("text");
                long time = b.getLong("time", n.when);
                String sender = null;
                Object sp = b.get("sender_person");
                if (Build.VERSION.SDK_INT >= 28 && sp instanceof Person && ((Person) sp).getName() != null) sender = ((Person) sp).getName().toString();
                if (sender == null && b.getCharSequence("sender") != null) sender = b.getCharSequence("sender").toString();
                String mime = b.getString("type");
                Uri uri = b.getParcelable("uri");
                // no sender = the phone's owner wrote it (a reply sent from the notification)
                boolean mine = sender == null && sp == null;
                if (take(relay, store, n, key, chat, group, mine ? "out" : "in", sender, text == null ? "" : text.toString(), time, mime, uri)) any = true;
            }
        } else {
            CharSequence[] lines = ex.getCharSequenceArray(Notification.EXTRA_TEXT_LINES);
            if (lines != null && lines.length > 0) {
                for (CharSequence l : lines) if (l != null) {
                    String[] ss = group ? Parse.splitSender(l.toString()) : new String[]{null, l.toString()};
                    if (take(relay, store, n, key, chat, group, "in", ss[0], ss[1], n.when, null, null)) any = true;
                }
            } else {
                CharSequence t = ex.getCharSequence(Notification.EXTRA_BIG_TEXT);
                if (t == null) t = ex.getCharSequence(Notification.EXTRA_TEXT);
                if (t != null) {
                    String[] ss = group ? Parse.splitSender(t.toString()) : new String[]{null, t.toString()};
                    if (take(relay, store, n, key, chat, group, "in", ss[0], ss[1], n.when, null, null)) any = true;
                }
            }
        }
        if (any) store.putBool("previewOff", false);
    }

    private boolean take(Relay relay, Store store, Notification n, String key, String chat, boolean group, String dir,
                         String sender, String text, long time, String mime, Uri uri) {
        String t = text == null ? "" : text.trim();
        if (t.isEmpty() && mime == null) return false;
        if (Parse.isSummary(t)) return false;
        if (Parse.isNoPreview(t) && mime == null) {
            // Viber is set to hide message text, so Nifti only sees "New message"
            if (!store.getBool("previewOff")) Notify.previewOff(this);
            store.putBool("previewOff", true);
            return false;
        }
        String kind = Parse.kind(t, mime);
        String dkey = Parse.dkey(key, dir, t + (mime == null ? "" : "|" + mime), time);
        if (!store.firstTime(dkey)) return true;
        try {
            JSONObject it = new JSONObject();
            it.put("key", key);
            it.put("title", chat);
            it.put("group", group);
            if (!group) { String ph = Contacts.phoneFor(this, chat); if (ph != null) it.put("phone", ph); }
            it.put("dir", dir);
            it.put("sender", sender == null ? (dir.equals("in") && !group ? chat : JSONObject.NULL) : sender);
            it.put("body", Parse.body(t, kind));
            it.put("kind", kind);
            it.put("media", Parse.needsMedia(kind) ? "waiting" : "none");
            it.put("source", "notif");
            it.put("dkey", dkey);
            it.put("at", Relay.iso(time > 0 ? time : System.currentTimeMillis()));
            if ("file".equals(kind)) { String fn = Parse.fileName(t); if (fn != null) it.put("_hint", fn); }
            File local = null; String lmime = null, lname = null;
            if (Parse.needsMedia(kind) && "in".equals(dir)) {
                // best case: the picture is inside the notification itself
                if (uri != null) {
                    File f = new File(relay.store.mediaDir(), dkey + ".bin");
                    if (MediaFinder.copy(this, uri, f)) { local = f; lmime = mime; lname = "viber-" + dkey.substring(0, 8) + ext(mime); }
                }
                if (local == null && "photo".equals(kind)) {
                    Bitmap bm = picture(n);
                    if (bm != null) {
                        File f = new File(relay.store.mediaDir(), dkey + ".jpg");
                        try (FileOutputStream out = new FileOutputStream(f)) {
                            bm.compress(Bitmap.CompressFormat.JPEG, 90, out);
                            local = f; lmime = "image/jpeg"; lname = "viber-photo.jpg";
                        } catch (Exception ignore) {}
                    }
                }
            }
            relay.enqueue(it, local, lmime, lname);
        } catch (Exception ignore) {}
        return true;
    }

    private Bitmap picture(Notification n) {
        try {
            Object o = n.extras.get(Notification.EXTRA_PICTURE);
            if (o instanceof Bitmap) return (Bitmap) o;
            if (Build.VERSION.SDK_INT >= 31) {
                Object ic = n.extras.get(Notification.EXTRA_PICTURE_ICON);
                if (ic instanceof Icon) {
                    android.graphics.drawable.Drawable d = ((Icon) ic).loadDrawable(this);
                    if (d instanceof android.graphics.drawable.BitmapDrawable) return ((android.graphics.drawable.BitmapDrawable) d).getBitmap();
                }
            }
        } catch (Exception ignore) {}
        return null;
    }

    private static String ext(String mime) {
        if (mime == null) return "";
        if (mime.contains("jpeg")) return ".jpg";
        if (mime.contains("png")) return ".png";
        if (mime.contains("webp")) return ".webp";
        if (mime.contains("mp4")) return ".mp4";
        if (mime.contains("pdf")) return ".pdf";
        return "";
    }
}
