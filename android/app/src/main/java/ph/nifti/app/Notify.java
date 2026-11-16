package ph.nifti.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.provider.Settings;

/** The warnings on the phone, shown the moment something can't come through. */
final class Notify {
    static final String WARN = "warn";
    private Notify() {}

    static void channels(Context c) {
        NotificationManager nm = c.getSystemService(NotificationManager.class);
        if (nm == null) return;
        NotificationChannel ch = new NotificationChannel(WARN, "Didn't come through", NotificationManager.IMPORTANCE_HIGH);
        ch.setDescription("A Viber photo, file or reply that needs one tap from you");
        nm.createNotificationChannel(ch);
    }

    private static Notification.Builder base(Context c, String title, String text) {
        return new Notification.Builder(c, WARN)
            .setSmallIcon(R.drawable.ic_stat)
            .setColor(0xFF1F6B45)
            .setContentTitle(title)
            .setContentText(text)
            .setStyle(new Notification.BigTextStyle().bigText(text))
            .setCategory(Notification.CATEGORY_ERROR)
            .setAutoCancel(true);
    }

    private static PendingIntent openChat(Context c, String key) {
        PendingIntent p = key == null ? null : Relay.get(c).opens.get(key);
        if (p != null) return p;
        Intent i = c.getPackageManager().getLaunchIntentForPackage(Relay.VIBER);
        if (i == null) i = new Intent(c, MainActivity.class);
        return PendingIntent.getActivity(c, 1, i, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    }

    private static PendingIntent openNifti(Context c) {
        return PendingIntent.getActivity(c, 2, new Intent(c, MainActivity.class), PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    }

    private static void show(Context c, int id, Notification.Builder b) {
        NotificationManager nm = c.getSystemService(NotificationManager.class);
        if (nm != null) try { nm.notify(id, b.build()); } catch (SecurityException ignore) {}
    }

    static void missing(Context c, String key, String chat, String kind, String fileName, String why) {
        String what = "photo".equals(kind) ? "A photo" : "video".equals(kind) ? "A video" : (fileName != null && !fileName.isEmpty() ? fileName : "A file");
        String thing = "photo".equals(kind) ? "photo" : "video".equals(kind) ? "video" : "file";
        String text = "too big".equals(why)
            ? "It's over 25 MB. Ask them to send a smaller one, or save it on the phone."
            : "Tap to open the chat. Hold the " + thing + ", tap Share, then pick Nifti.";
        show(c, ("m" + key + kind).hashCode(), base(c, what + " from " + chat + " didn't reach Nifti", text).setContentIntent(openChat(c, key)));
    }

    static void clearMissing(Context c, String key, String kind) {
        NotificationManager nm = c.getSystemService(NotificationManager.class);
        if (nm != null) nm.cancel(("m" + key + kind).hashCode());
    }

    static void notSent(Context c, String key, String chat, String body, String msgId) {
        Intent i = new Intent(c, SendNowActivity.class)
            .putExtra("key", key).putExtra("title", chat).putExtra("body", body).putExtra("msg", msgId)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        PendingIntent p = PendingIntent.getActivity(c, msgId.hashCode(), i, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        Notification.Builder b = base(c, "Your reply to " + chat + " wasn't sent", "“" + body + "”\nTap to send it: Nifti copies it and opens the chat, then paste and send.")
            .setContentIntent(p)
            .addAction(new Notification.Action.Builder(null, "Send now", p).build());
        show(c, ("s" + msgId).hashCode(), b);
    }

    static void disconnected(Context c) {
        show(c, 9001, base(c, "Nifti stopped bringing in Viber", "This phone was disconnected from your business. Open Nifti to connect it again.").setContentIntent(openNifti(c)));
    }

    static void previewOff(Context c) {
        show(c, 9002, base(c, "Turn on message previews in Viber", "Viber is hiding message text, so Nifti only sees “New message”. In Viber: More → Settings → Notifications → turn on Show message preview.")
            .setContentIntent(openChat(c, null)));
    }

    static void saveToGallery(Context c) {
        show(c, 9004, base(c, "Let Viber photos come into Nifti by themselves",
            "In Viber: More \u2192 Settings \u2192 Media \u2192 turn on Save to gallery and Auto-download. Then every photo lands in Nifti on its own.")
            .setContentIntent(openChat(c, null)));
    }

    /** Xiaomi, OPPO, vivo and similar: one tap back to the setting that keeps Nifti running */
    static void keepRunning(Context c, String brandName) {
        Intent i = new Intent(c, MainActivity.class).putExtra("open", "setup").addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent p = PendingIntent.getActivity(c, 4, i, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        show(c, 9005, base(c, "Keep Nifti on, so no customer message is missed",
            brandName + " phones switch apps off to save battery. Tap to allow Nifti to keep running. It takes 20 seconds.")
            .setContentIntent(p).addAction(new Notification.Action.Builder(null, "Fix it now", p).build()));
    }

    static void listenerOff(Context c) {
        Intent i = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        show(c, 9003, base(c, "Nifti can't see Viber messages", "Notification access for Nifti is off. Tap to turn it back on.")
            .setContentIntent(PendingIntent.getActivity(c, 3, i, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT)));
    }
}
