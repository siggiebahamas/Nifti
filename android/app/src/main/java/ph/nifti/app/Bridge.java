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
                    case "perms": {
                        java.util.List<String> want = new java.util.ArrayList<>();
                        if (Build.VERSION.SDK_INT >= 33) { want.add(Manifest.permission.POST_NOTIFICATIONS); want.add(Manifest.permission.READ_MEDIA_IMAGES); want.add(Manifest.permission.READ_MEDIA_VIDEO); }
                        else want.add(Manifest.permission.READ_EXTERNAL_STORAGE);
                        want.add(Manifest.permission.READ_CONTACTS);
                        a.requestPermissions(want.toArray(new String[0]), MainActivity.REQ_PERM);
                        break;
                    }
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

    @JavascriptInterface public void print(String title) { if (allowed()) a.printPage(title == null || title.isEmpty() ? "Nifti" : title); }

    @JavascriptInterface public void share(String title, String text, String url) {
        if (!allowed()) return;
        a.runOnUiThread(() -> {
            String body = ((text == null ? "" : text) + (url == null || url.isEmpty() ? "" : (text == null || text.isEmpty() ? "" : "\n") + url)).trim();
            Intent i = new Intent(Intent.ACTION_SEND).setType("text/plain").putExtra(Intent.EXTRA_TEXT, body);
            if (title != null && !title.isEmpty()) i.putExtra(Intent.EXTRA_SUBJECT, title);
            try { a.startActivity(Intent.createChooser(i, "Share")); } catch (Exception ignore) {}
        });
    }

    /** A file made in the page (export, statement): saved to the phone's Downloads, then offered to open. */
    @JavascriptInterface public void saveFile(String name, String mime, String base64) {
        if (!allowed() || base64 == null) return;
        try {
            byte[] bytes = android.util.Base64.decode(base64, android.util.Base64.DEFAULT);
            String n = (name == null || name.trim().isEmpty()) ? "nifti-file" : name.replaceAll("[\\\\/:*?\"<>|]+", "_");
            String m = (mime == null || mime.isEmpty()) ? "application/octet-stream" : mime;
            Uri out;
            if (Build.VERSION.SDK_INT >= 29) {
                android.content.ContentValues cv = new android.content.ContentValues();
                cv.put(android.provider.MediaStore.MediaColumns.DISPLAY_NAME, n);
                cv.put(android.provider.MediaStore.MediaColumns.MIME_TYPE, m);
                cv.put(android.provider.MediaStore.MediaColumns.RELATIVE_PATH, android.os.Environment.DIRECTORY_DOWNLOADS);
                out = a.getContentResolver().insert(android.provider.MediaStore.Downloads.EXTERNAL_CONTENT_URI, cv);
                if (out == null) throw new Exception("no space");
                try (java.io.OutputStream os = a.getContentResolver().openOutputStream(out)) { os.write(bytes); }
            } else {
                java.io.File f = new java.io.File(a.getExternalFilesDir(android.os.Environment.DIRECTORY_DOWNLOADS), n);
                try (java.io.FileOutputStream os = new java.io.FileOutputStream(f)) { os.write(bytes); }
                out = Uri.fromFile(f);
            }
            final Uri u = out;
            a.runOnUiThread(() -> {
                Toast.makeText(a, "Saved to Downloads: " + n, Toast.LENGTH_LONG).show();
                try { a.startActivity(new Intent(Intent.ACTION_VIEW).setDataAndType(u, m).addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)); } catch (Exception ignore) {}
            });
        } catch (Exception e) {
            a.runOnUiThread(() -> Toast.makeText(a, "Couldn't save the file.", Toast.LENGTH_LONG).show());
        }
    }

    @JavascriptInterface public void retry() { a.retryLoad(); }

    @JavascriptInterface public void syncNow() {
        if (!allowed()) return;
        Relay.get(a).tickAsync();
    }
}
