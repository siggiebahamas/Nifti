package ph.nifti.app;

import android.app.Activity;
import android.content.Intent;
import android.database.Cursor;
import android.graphics.Color;
import android.graphics.Typeface;
import android.net.Uri;
import android.os.Bundle;
import android.provider.OpenableColumns;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Viber: hold a photo or file, tap Share, pick Nifti. You choose which chat it came from and it lands
 * in that chat in Nifti, filling in the photo or file that didn't come through on its own.
 */
public class ShareActivity extends Activity {
    private final List<Uri> uris = new ArrayList<>();
    private String sharedText;

    @Override protected void onCreate(Bundle b) {
        super.onCreate(b);
        Relay relay = Relay.get(this);
        if (!relay.store.connected() || relay.store.revoked()) {
            Toast.makeText(this, "Open Nifti and sign in first, then share again.", Toast.LENGTH_LONG).show();
            startActivity(new Intent(this, MainActivity.class));
            finish();
            return;
        }
        Intent in = getIntent();
        try {
            if (Intent.ACTION_SEND.equals(in.getAction())) {
                Uri u = in.getParcelableExtra(Intent.EXTRA_STREAM);
                if (u != null) uris.add(u);
            } else if (Intent.ACTION_SEND_MULTIPLE.equals(in.getAction())) {
                ArrayList<Uri> l = in.getParcelableArrayListExtra(Intent.EXTRA_STREAM);
                if (l != null) uris.addAll(l);
            }
            CharSequence t = in.getCharSequenceExtra(Intent.EXTRA_TEXT);
            if (t != null) sharedText = t.toString();
        } catch (Exception ignore) {}
        if (uris.isEmpty() && (sharedText == null || sharedText.trim().isEmpty())) { finish(); return; }

        // chats: the ones Nifti already has, newest first, plus any just seen on this phone
        Map<String, String> chats = new LinkedHashMap<>();
        JSONArray a = relay.store.chats();
        for (int i = 0; i < a.length(); i++) {
            JSONObject c = a.optJSONObject(i);
            if (c != null) chats.put(c.optString("key"), c.optString("party", "").isEmpty() ? c.optString("title") : c.optString("title") + "  ·  " + c.optString("party"));
        }
        for (Map.Entry<String, String> e : relay.titles.entrySet()) if (!chats.containsKey(e.getKey())) chats.put(e.getKey(), e.getValue());

        int pad = dp(18);
        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setPadding(pad, pad, pad, pad);
        TextView h = new TextView(this);
        h.setText(uris.size() > 1 ? "Which Viber chat are these " + uris.size() + " from?" : "Which Viber chat is this from?");
        h.setTextSize(TypedValue.COMPLEX_UNIT_SP, 19);
        h.setTypeface(Typeface.DEFAULT_BOLD);
        h.setTextColor(Color.parseColor("#0B0F14"));
        box.addView(h);
        TextView sub = new TextView(this);
        sub.setText("It goes into that chat in Nifti.");
        sub.setTextSize(TypedValue.COMPLEX_UNIT_SP, 15);
        sub.setTextColor(Color.parseColor("#0B0F14"));
        sub.setPadding(0, dp(4), 0, dp(12));
        box.addView(sub);
        int shown = 0;
        for (Map.Entry<String, String> e : chats.entrySet()) {
            if (shown++ >= 12) break;
            box.addView(choice(e.getValue(), v -> send(e.getKey(), plainTitle(e.getValue()))));
        }
        box.addView(choice(chats.isEmpty() ? "Send to Nifti" : "Not in this list", v -> send(Parse.chatKey("Shared from Viber"), "Shared from Viber")));
        ScrollView sv = new ScrollView(this);
        sv.addView(box);
        setContentView(sv);
    }

    private static String plainTitle(String s) { int i = s.indexOf("  ·  "); return i > 0 ? s.substring(0, i) : s; }

    private View choice(String label, View.OnClickListener l) {
        Button b = new Button(this);
        b.setText(label);
        b.setAllCaps(false);
        b.setGravity(Gravity.START | Gravity.CENTER_VERTICAL);
        b.setTextSize(TypedValue.COMPLEX_UNIT_SP, 16);
        b.setOnClickListener(l);
        return b;
    }

    private void send(String key, String title) {
        Relay relay = Relay.get(this);
        final List<Uri> list = new ArrayList<>(uris);
        final String text = sharedText;
        new Thread(() -> {
            int ok = 0;
            try {
                if (list.isEmpty() && text != null) {
                    JSONObject it = item(key, title, "text", text, false);
                    relay.enqueue(it, null, null, null);
                    ok++;
                }
                for (Uri u : list) {
                    String mime = getContentResolver().getType(u);
                    String name = name(u);
                    String kind = Parse.kind(null, mime == null ? "application/octet-stream" : mime);
                    if ("voice".equals(kind)) kind = "file";
                    File dst = new File(relay.store.mediaDir(), UUID.randomUUID() + "-" + MediaFinder.safe(name));
                    if (!MediaFinder.copy(this, u, dst)) continue;
                    JSONObject it = item(key, title, kind, list.size() == 1 && text != null ? text : "", true);
                    relay.enqueue(it, dst, mime, name);
                    ok++;
                }
            } catch (Exception ignore) {}
            final int n = ok;
            runOnUiThread(() -> {
                Toast.makeText(this, n > 0 ? "Sent to Nifti ✓" : "Couldn't read that file. Save it to the phone first, then share it.", Toast.LENGTH_LONG).show();
                finish();
            });
        }).start();
    }

    private JSONObject item(String key, String title, String kind, String body, boolean media) throws Exception {
        JSONObject it = new JSONObject();
        it.put("key", key);
        it.put("title", title);
        it.put("dir", "in");
        it.put("sender", title);
        it.put("body", body == null ? "" : body);
        it.put("kind", kind);
        it.put("media", media ? "waiting" : "none");
        it.put("source", "share");
        it.put("fill", media);
        it.put("dkey", "share:" + UUID.randomUUID());
        it.put("at", Relay.iso(System.currentTimeMillis()));
        return it;
    }

    private String name(Uri u) {
        try (Cursor c = getContentResolver().query(u, new String[]{OpenableColumns.DISPLAY_NAME}, null, null, null)) {
            if (c != null && c.moveToFirst()) { String n = c.getString(0); if (n != null) return n; }
        } catch (Exception ignore) {}
        String last = u.getLastPathSegment();
        return last == null ? "file" : last;
    }

    private int dp(int v) { return (int) TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, v, getResources().getDisplayMetrics()); }
}
