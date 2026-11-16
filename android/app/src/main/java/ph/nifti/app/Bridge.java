package ph.nifti.app;

import android.Manifest;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.webkit.JavascriptInterface;
import android.widget.Toast;

import org.json.JSONObject;

/**
 * What the Nifti page can ask the app to do. Only the Nifti website can call these (checked on every call).
 * The page never hands over the person's login: it only passes the phone's own device key, made for this phone.
 */
final class Bridge {
    private final MainActivity a;
    Bridge(MainActivity a) { this.a = a; }

    private boolean allowed() { return MainActivity.ours(Uri.parse(a.currentUrl == null ? "" : a.currentUrl)); }

    @JavascriptInterface public String info() {
        if (!allowed()) return "{}";
        return Status.info(a).toString();
    }

    @JavascriptInterface public void connect(String json) {
        if (!allowed()) return;
        try {
            JSONObject j = new JSONObject(json);
            if (j.optString("device").isEmpty() || j.optString("secret").isEmpty()) return;
            Relay r = Relay.get(a);
            r.store.connect(j);
            r.start();
            r.tickAsync();
            a.tellPage("connected");
        } catch (Exception ignore) {}
    }

    @JavascriptInterface public void disconnect() {
        if (!allowed()) return;
        Relay.get(a).store.disconnect();
        a.tellPage("disconnected");
    }

    /** Opens one of the phone's settings screens */
    @JavascriptInterface public void open(String what) {
        if (!allowed()) return;
        a.runOnUiThread(() -> {
            try {
                switch (what) {
                    case "notif":
                        if (Build.VERSION.SDK_INT >= 30) {
                            Intent i = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_DETAIL_SETTINGS)
                                .putExtra(Settings.EXTRA_NOTIFICATION_LISTENER_COMPONENT_NAME, new android.content.ComponentName(a, ViberListener.class).flattenToString());
                            try { a.startActivity(i); break; } catch (Exception ignore) {}
                        }
                        a.startActivity(new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS));
                        break;
                    case "screen":
                        a.startActivity(new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS));
                        break;
                    case "battery":
                        Brand.open(a, Brand.battery(a));
                        break;
                    case "autostart":
                        Relay.get(a).store.putBool("autostartDone", true);
                        Brand.open(a, Brand.autostart(a));
                        break;
                    case "appinfo":
                        a.startActivity(Brand.appInfo(a));
                        break;
                    case "alerts":
                        if (Build.VERSION.SDK_INT >= 33 && a.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != android.content.pm.PackageManager.PERMISSION_GRANTED) {
                            a.requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, MainActivity.REQ_PERM);
                        } else {
                            a.startActivity(new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).putExtra(Settings.EXTRA_APP_PACKAGE, a.getPackageName()));
                        }
                        break;
                    case "photos":
                        if (Build.VERSION.SDK_INT >= 33) a.requestPermissions(new String[]{Manifest.permission.READ_MEDIA_IMAGES, Manifest.permission.READ_MEDIA_VIDEO}, MainActivity.REQ_PERM);
                        else a.requestPermissions(new String[]{Manifest.permission.READ_EXTERNAL_STORAGE}, MainActivity.REQ_PERM);
                        break;
                    case "viber":
                        Intent v = a.getPackageManager().getLaunchIntentForPackage(Relay.VIBER);
                        if (v != null) a.startActivity(v);
                        else a.startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=" + Relay.VIBER)));
                        break;
                    default:
                        break;
                }
            } catch (Exception e) {
                Toast.makeText(a, "Couldn't open that screen on this phone. Open Settings → Apps → Nifti.", Toast.LENGTH_LONG).show();
            }
        });
    }

    @JavascriptInterface public void markDone(String what) {
        if (!allowed()) return;
        Relay.get(a).store.putBool(what + "Done", true);
    }

    /** Option A inside the app: copy the reply and open their Viber chat */
    @JavascriptInterface public void viber(String phone, String text) {
        if (!allowed()) return;
        a.runOnUiThread(() -> {
            try {
                if (text != null && !text.isEmpty()) {
                    ClipboardManager cm = (ClipboardManager) a.getSystemService(Context.CLIPBOARD_SERVICE);
                    if (cm != null) cm.setPrimaryClip(ClipData.newPlainText("Nifti reply", text));
                }
                Intent i;
                String num = phone == null ? "" : phone.replaceAll("[^0-9+]", "");
                if (!num.isEmpty()) i = new Intent(Intent.ACTION_VIEW, Uri.parse("viber://chat?number=" + Uri.encode(num)));
                else i = a.getPackageManager().getLaunchIntentForPackage(Relay.VIBER);
                if (i == null) i = new Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=" + Relay.VIBER));
                a.startActivity(i);
                if (text != null && !text.isEmpty()) Toast.makeText(a, "Copied. Paste it in Viber and tap send.", Toast.LENGTH_LONG).show();
            } catch (Exception e) {
                Toast.makeText(a, "Viber isn't installed on this phone.", Toast.LENGTH_LONG).show();
            }
        });
    }

    @JavascriptInterface public void syncNow() {
        if (!allowed()) return;
        Relay.get(a).tickAsync();
    }
}
