package ph.nifti.app;

import android.app.Activity;
import android.app.PendingIntent;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.widget.Toast;

import org.json.JSONObject;

/** "Send now" on a warning: copies the reply, opens that Viber chat, and marks it sent in Nifti. */
public class SendNowActivity extends Activity {
    @Override protected void onCreate(Bundle b) {
        super.onCreate(b);
        Intent in = getIntent();
        String key = in.getStringExtra("key"), body = in.getStringExtra("body"), msg = in.getStringExtra("msg");
        Relay relay = Relay.get(this);
        try {
            ClipboardManager cm = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
            if (cm != null && body != null) cm.setPrimaryClip(ClipData.newPlainText("Nifti reply", body));
            PendingIntent open = key == null ? null : relay.opens.get(key);
            boolean opened = false;
            if (open != null) { try { open.send(); opened = true; } catch (Exception ignore) {} }
            if (!opened) {
                Intent v = getPackageManager().getLaunchIntentForPackage(Relay.VIBER);
                if (v != null) startActivity(v);
            }
            Toast.makeText(this, "Copied. Paste it in the chat and tap send.", Toast.LENGTH_LONG).show();
        } catch (Exception ignore) {}
        if (msg != null) relay.h.post(() -> {
            try {
                JSONObject a = new JSONObject();
                a.put("p_msg", msg); a.put("p_ok", true); a.put("p_reason", JSONObject.NULL);
                relay.api.rpc("viber_dev_mark", a);
            } catch (Exception ignore) {}
        });
        finish();
    }
}
