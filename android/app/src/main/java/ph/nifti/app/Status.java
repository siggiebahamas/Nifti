package ph.nifti.app;

import android.Manifest;
import android.app.NotificationManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;

import org.json.JSONObject;

/** What's switched on, for the setup screen in Nifti and for the warnings on your computer. */
final class Status {
    private Status() {}

    static boolean listenerOn(Context c) {
        ComponentName cn = new ComponentName(c, ViberListener.class);
        if (Build.VERSION.SDK_INT >= 27) {
            NotificationManager nm = c.getSystemService(NotificationManager.class);
            if (nm != null) return nm.isNotificationListenerAccessGranted(cn);
        }
        String s = Settings.Secure.getString(c.getContentResolver(), "enabled_notification_listeners");
        return s != null && s.contains(cn.flattenToString());
    }

    static boolean screenOn(Context c) {
        String s = Settings.Secure.getString(c.getContentResolver(), Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES);
        return s != null && s.contains(new ComponentName(c, ScreenReader.class).flattenToString());
    }

    static boolean batteryOk(Context c) {
        PowerManager pm = c.getSystemService(PowerManager.class);
        return pm != null && pm.isIgnoringBatteryOptimizations(c.getPackageName());
    }

    static boolean alertsOn(Context c) {
        NotificationManager nm = c.getSystemService(NotificationManager.class);
        return nm != null && nm.areNotificationsEnabled();
    }

    static boolean viberInstalled(Context c) {
        try { c.getPackageManager().getPackageInfo(Relay.VIBER, 0); return true; } catch (PackageManager.NameNotFoundException e) { return false; }
    }

    static JSONObject flags(Context c) {
        JSONObject j = new JSONObject();
        try {
            Store s = Relay.get(c).store;
            j.put("notif", listenerOn(c));
            j.put("listener", ViberListener.live != null);
            j.put("screen", screenOn(c));
            j.put("battery", batteryOk(c));
            j.put("photos", MediaFinder.allowed(c));
            j.put("alerts", alertsOn(c));
            j.put("viber", viberInstalled(c));
            j.put("previewOff", s.getBool("previewOff"));
            j.put("brand", Brand.key());
            j.put("maker", Build.MANUFACTURER);
            j.put("model", Build.MODEL);
            j.put("sdk", Build.VERSION.SDK_INT);
            j.put("queue", s.list("queue.json").size());
            j.put("pendingMedia", s.list("media.json").size());
            j.put("lastIn", s.getLong("lastIn"));
            j.put("lastSent", s.getLong("lastSent"));
            Boolean auto = Brand.autostartOn(c);
            j.put("autostartDone", auto != null ? auto : s.getBool("autostartDone"));
            j.put("autostartKnown", auto != null);
            j.put("contacts", Contacts.allowed(c));
            j.put("viberPhotos", s.getLong("viberPhotoSeen") > 0);
        } catch (Exception ignore) {}
        return j;
    }

    static JSONObject info(Context c) {
        JSONObject j = flags(c);
        try {
            Store s = Relay.get(c).store;
            j.put("app", true);
            j.put("version", BuildConfig.VERSION_NAME);
            j.put("versionCode", BuildConfig.VERSION_CODE);
            j.put("connected", s.connected() && !s.revoked());
            j.put("revoked", s.revoked());
            j.put("device", s.device());
            j.put("business", s.business());
            j.put("needsBattery", Brand.strict());
            j.put("restrictedSettings", Build.VERSION.SDK_INT >= 33);
        } catch (Exception ignore) {}
        return j;
    }
}
