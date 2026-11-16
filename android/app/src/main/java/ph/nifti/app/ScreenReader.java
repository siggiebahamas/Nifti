package ph.nifti.app;

import android.accessibilityservice.AccessibilityService;
import android.graphics.Rect;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.DisplayMetrics;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityNodeInfo;

import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Viber shows no notification for the chat you have open, so a message that arrives while you're
 * looking at that chat would never reach Nifti. This reads the open Viber chat instead: new bubbles
 * that appear at the bottom are sent to Nifti. It only looks at Viber (set in screen_reader.xml).
 * It also lets a reply typed in Nifti go out when that same chat is open on the phone.
 */
public class ScreenReader extends AccessibilityService {
    static volatile ScreenReader live;
    private final Handler h = new Handler(Looper.getMainLooper());
    private String curTitle;
    private List<String> snap;
    private volatile String fgPkg = "";
    private volatile String fgTitle;

    @Override protected void onServiceConnected() { live = this; }
    @Override public void onDestroy() { live = null; super.onDestroy(); }
    @Override public void onInterrupt() {}

    @Override public void onAccessibilityEvent(AccessibilityEvent e) {
        if (e == null || e.getPackageName() == null) return;
        fgPkg = e.getPackageName().toString();
        if (!Relay.VIBER.equals(fgPkg)) { fgTitle = null; return; }
        h.removeCallbacks(readNow);
        h.postDelayed(readNow, 450);
    }

    private final Runnable readNow = () -> { try { read(); } catch (Exception ignore) {} };

    static final class Row { String side, text, kind, sig; }
    static final class Screen { String title; List<Row> rows = new ArrayList<>(); AccessibilityNodeInfo input; }

    private Screen scan() {
        AccessibilityNodeInfo root = getRootInActiveWindow();
        if (root == null || root.getPackageName() == null || !Relay.VIBER.equals(root.getPackageName().toString())) return null;
        DisplayMetrics dm = getResources().getDisplayMetrics();
        int W = dm.widthPixels, H = dm.heightPixels;
        AccessibilityNodeInfo list = biggestList(root, W * H);
        AccessibilityNodeInfo input = findInput(root);
        if (list == null || input == null) return null; // not a chat screen
        Rect lr = new Rect();
        list.getBoundsInScreen(lr);
        String title = findTitle(root, lr.top, H);
        if (title == null) return null;
        Screen s = new Screen();
        s.title = title;
        s.input = input;
        for (int i = 0; i < list.getChildCount(); i++) {
            AccessibilityNodeInfo c = list.getChild(i);
            if (c == null) continue;
            Row r = row(c, W);
            if (r != null) s.rows.add(r);
        }
        return s;
    }

    private Row row(AccessibilityNodeInfo c, int W) {
        List<AccessibilityNodeInfo> texts = new ArrayList<>();
        List<AccessibilityNodeInfo> images = new ArrayList<>();
        collect(c, texts, images, 0);
        String best = null; Rect bestR = null;
        for (AccessibilityNodeInfo t : texts) {
            String s = t.getText().toString().trim();
            if (s.isEmpty() || Parse.isTime(s) || Parse.isDateHeader(s) || Parse.isStatusWord(s)) continue;
            if (best == null || s.length() > best.length()) { best = s; bestR = new Rect(); t.getBoundsInScreen(bestR); }
        }
        Row r = new Row();
        if (best != null) {
            r.text = best;
            r.kind = Parse.kind(best, null);
        } else {
            AccessibilityNodeInfo img = null; Rect ir = new Rect();
            for (AccessibilityNodeInfo im : images) { Rect b = new Rect(); im.getBoundsInScreen(b); if (b.width() > W * 0.3) { img = im; ir = b; break; } }
            if (img == null) return null;
            CharSequence d = img.getContentDescription();
            String desc = d == null ? "" : d.toString().toLowerCase(Locale.ROOT);
            r.kind = desc.contains("video") ? "video" : "photo";
            r.text = "";
            bestR = ir;
        }
        int cx = bestR.centerX();
        if (cx < W * 0.45) r.side = "in";
        else if (cx > W * 0.55) r.side = "out";
        else return null; // centered = date or system line
        r.sig = r.side + "|" + r.kind + "|" + r.text;
        return r;
    }

    private void collect(AccessibilityNodeInfo n, List<AccessibilityNodeInfo> texts, List<AccessibilityNodeInfo> images, int depth) {
        if (n == null || depth > 12) return;
        CharSequence cls = n.getClassName();
        String k = cls == null ? "" : cls.toString();
        if (n.getText() != null && n.getText().length() > 0 && !k.contains("EditText") && !k.contains("Button")) texts.add(n);
        if (k.contains("ImageView")) images.add(n);
        for (int i = 0; i < n.getChildCount(); i++) collect(n.getChild(i), texts, images, depth + 1);
    }

    private AccessibilityNodeInfo biggestList(AccessibilityNodeInfo root, int screenArea) {
        AccessibilityNodeInfo[] best = {null};
        int[] bestArea = {0};
        walk(root, 0, n -> {
            CharSequence cls = n.getClassName();
            String k = cls == null ? "" : cls.toString();
            if (n.isScrollable() && (k.contains("RecyclerView") || k.contains("ListView"))) {
                Rect r = new Rect(); n.getBoundsInScreen(r);
                int a = r.width() * r.height();
                if (a > bestArea[0] && a > screenArea * 0.3) { bestArea[0] = a; best[0] = n; }
            }
        });
        return best[0];
    }

    private AccessibilityNodeInfo findInput(AccessibilityNodeInfo root) {
        AccessibilityNodeInfo[] f = {null};
        walk(root, 0, n -> { CharSequence cls = n.getClassName(); if (f[0] == null && cls != null && cls.toString().contains("EditText") && n.isEditable()) f[0] = n; });
        return f[0];
    }

    private String findTitle(AccessibilityNodeInfo root, int listTop, int H) {
        String[] t = {null};
        walk(root, 0, n -> {
            if (t[0] != null || n.getText() == null) return;
            CharSequence cls = n.getClassName();
            if (cls != null && (cls.toString().contains("EditText") || cls.toString().contains("Button"))) return;
            Rect r = new Rect(); n.getBoundsInScreen(r);
            if (r.bottom > listTop + 8 || r.top > H * 0.2) return;
            String s = n.getText().toString().trim();
            String l = s.toLowerCase(Locale.ROOT);
            if (s.length() < 1 || s.length() > 80) return;
            if (l.startsWith("online") || l.startsWith("last seen") || l.contains("typing") || l.startsWith("active") || l.equals("viber") || Parse.isTime(s)) return;
            t[0] = s;
        });
        return t[0];
    }

    interface Visit { void at(AccessibilityNodeInfo n); }
    private void walk(AccessibilityNodeInfo n, int depth, Visit v) {
        if (n == null || depth > 30) return;
        v.at(n);
        for (int i = 0; i < n.getChildCount(); i++) walk(n.getChild(i), depth + 1, v);
    }

    private void read() {
        Screen s = scan();
        if (s == null) { curTitle = null; snap = null; fgTitle = null; return; }
        fgTitle = s.title;
        List<String> now = new ArrayList<>();
        for (Row r : s.rows) now.add(r.sig);
        if (!s.title.equals(curTitle) || snap == null) { curTitle = s.title; snap = now; return; } // just opened: what's already there is old
        if (snap.isEmpty()) { snap = now; return; }
        String lastOld = snap.get(snap.size() - 1);
        String prevOld = snap.size() > 1 ? snap.get(snap.size() - 2) : null;
        int idx = -1;
        for (int i = now.size() - 1; i >= 0; i--) {
            if (now.get(i).equals(lastOld) && (prevOld == null || i == 0 || now.get(i - 1).equals(prevOld))) { idx = i; break; }
        }
        if (idx < 0) { snap = now; return; } // scrolled far or the list changed a lot: start over, send nothing
        for (int i = idx + 1; i < s.rows.size(); i++) emit(s.title, s.rows.get(i));
        snap = now;
    }

    private void emit(String title, Row r) {
        Relay relay = Relay.get(this);
        String key = Parse.chatKey(title);
        if (relay.store.ignored().contains(key)) return;
        long t = System.currentTimeMillis();
        String dkey = Parse.dkey(key, r.side, r.text, t) + "s";
        if (!relay.store.firstTime(dkey)) return;
        try {
            JSONObject it = new JSONObject();
            it.put("key", key);
            it.put("title", title);
            it.put("dir", r.side);
            it.put("sender", "in".equals(r.side) ? title : JSONObject.NULL);
            it.put("body", Parse.body(r.text, r.kind));
            it.put("kind", r.kind);
            it.put("media", Parse.needsMedia(r.kind) && "in".equals(r.side) ? "waiting" : "none");
            it.put("source", "screen");
            it.put("dkey", dkey);
            it.put("at", Relay.iso(t));
            if ("file".equals(r.kind)) { String fn = Parse.fileName(r.text); if (fn != null) it.put("_hint", fn); }
            relay.enqueue(it, null, null, null);
        } catch (Exception ignore) {}
    }

    boolean canSendTo(String title) {
        String f = fgTitle;
        return Relay.VIBER.equals(fgPkg) && f != null && title != null && f.trim().equalsIgnoreCase(title.trim());
    }

    /** Types the reply into the open Viber chat and taps send. Called from the relay thread. */
    boolean sendBlocking(String title, String body, long timeoutMs) {
        CountDownLatch done = new CountDownLatch(1);
        AtomicBoolean ok = new AtomicBoolean(false);
        h.post(() -> {
            try {
                Screen s = scan();
                if (s == null || !s.title.equalsIgnoreCase(title)) { done.countDown(); return; }
                Bundle b = new Bundle();
                b.putCharSequence(AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE, body);
                if (!s.input.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, b)) { done.countDown(); return; }
                h.postDelayed(() -> {
                    try {
                        AccessibilityNodeInfo send = findSend(getRootInActiveWindow());
                        if (send == null) { done.countDown(); return; }
                        AccessibilityNodeInfo target = send;
                        while (target != null && !target.isClickable()) target = target.getParent();
                        if (target == null || !target.performAction(AccessibilityNodeInfo.ACTION_CLICK)) { done.countDown(); return; }
                        h.postDelayed(() -> {
                            AccessibilityNodeInfo in = findInput(getRootInActiveWindow());
                            CharSequence left = in == null ? null : in.getText();
                            ok.set(left == null || left.length() == 0 || !left.toString().contains(body.length() > 20 ? body.substring(0, 20) : body));
                            done.countDown();
                        }, 900);
                    } catch (Exception e) { done.countDown(); }
                }, 350);
            } catch (Exception e) { done.countDown(); }
        });
        try { done.await(timeoutMs, TimeUnit.MILLISECONDS); } catch (InterruptedException ignore) {}
        return ok.get();
    }

    private AccessibilityNodeInfo findSend(AccessibilityNodeInfo root) {
        AccessibilityNodeInfo[] f = {null};
        walk(root, 0, n -> {
            if (f[0] != null) return;
            CharSequence d = n.getContentDescription();
            String id = n.getViewIdResourceName();
            String s = ((d == null ? "" : d.toString()) + " " + (id == null ? "" : id)).toLowerCase(Locale.ROOT);
            if (s.contains("send") || s.contains("ipadala")) f[0] = n;
        });
        return f[0];
    }
}
