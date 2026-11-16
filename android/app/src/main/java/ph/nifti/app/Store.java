package ph.nifti.app;

import android.content.Context;
import android.content.SharedPreferences;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

/**
 * Everything the phone keeps. The device key is locked with a key that never leaves the phone's
 * secure chip (Android Keystore), and nothing here is included in phone backups.
 */
public final class Store {
    private static final String ALIAS = "nifti_device_key";
    private final Context ctx;
    private final SharedPreferences p;

    public Store(Context c) {
        ctx = c.getApplicationContext();
        p = ctx.getSharedPreferences("nifti", Context.MODE_PRIVATE);
    }

    // ---- connection ----
    public boolean connected() { return !p.getString("device", "").isEmpty() && secret() != null; }
    public String url() { return p.getString("url", "https://ctryvcloavfpecbrbzxy.supabase.co"); }
    public String key() { return p.getString("key", ""); }
    public String device() { return p.getString("device", ""); }
    public String business() { return p.getString("business", ""); }
    public String userName() { return p.getString("user", ""); }

    public synchronized void connect(JSONObject j) {
        p.edit()
            .putString("url", j.optString("url", url()))
            .putString("key", j.optString("key", ""))
            .putString("device", j.optString("device", ""))
            .putString("secret", lock(j.optString("secret", "")))
            .putString("business", j.optString("business", ""))
            .putString("user", j.optString("user", ""))
            .putBoolean("revoked", false)
            .apply();
    }

    public synchronized void disconnect() {
        p.edit().remove("device").remove("secret").remove("business").remove("user").remove("chats").apply();
        writeFile("queue.json", "[]");
        writeFile("media.json", "[]");
    }

    public String secret() {
        String s = p.getString("secret", "");
        if (s.isEmpty()) return null;
        return unlock(s);
    }

    public void setRevoked(boolean v) { p.edit().putBoolean("revoked", v).apply(); }
    public boolean revoked() { return p.getBoolean("revoked", false); }

    // ---- small values ----
    public long getLong(String k) { return p.getLong(k, 0L); }
    public void putLong(String k, long v) { p.edit().putLong(k, v).apply(); }
    public String getString(String k) { return p.getString(k, ""); }
    public void putString(String k, String v) { p.edit().putString(k, v).apply(); }
    public boolean getBool(String k) { return p.getBoolean(k, false); }
    public void putBool(String k, boolean v) { p.edit().putBoolean(k, v).apply(); }

    // ---- chats the server knows (for the Share picker) and chats it was told to skip ----
    public JSONArray chats() { try { return new JSONArray(p.getString("chats", "[]")); } catch (Exception e) { return new JSONArray(); } }
    public void setChats(JSONArray a) { p.edit().putString("chats", a.toString()).apply(); }
    public LinkedHashSet<String> ignored() {
        LinkedHashSet<String> s = new LinkedHashSet<>();
        try { JSONArray a = new JSONArray(p.getString("ignored", "[]")); for (int i = 0; i < a.length(); i++) s.add(a.getString(i)); } catch (Exception ignore) {}
        return s;
    }
    public void setIgnored(JSONArray a) { p.edit().putString("ignored", a.toString()).apply(); }

    // ---- recently seen messages, so one message is sent once ----
    private LinkedHashSet<String> seen;
    public synchronized boolean firstTime(String dkey) {
        if (seen == null) {
            seen = new LinkedHashSet<>();
            try { JSONArray a = new JSONArray(readFile("seen.json", "[]")); for (int i = 0; i < a.length(); i++) seen.add(a.getString(i)); } catch (Exception ignore) {}
        }
        if (seen.contains(dkey)) return false;
        seen.add(dkey);
        while (seen.size() > 4000) { String first = seen.iterator().next(); seen.remove(first); }
        writeFile("seen.json", new JSONArray(seen).toString());
        return true;
    }

    // ---- lists kept as files (survive restarts and no-signal hours) ----
    public synchronized List<JSONObject> list(String name) {
        List<JSONObject> out = new ArrayList<>();
        try { JSONArray a = new JSONArray(readFile(name, "[]")); for (int i = 0; i < a.length(); i++) out.add(a.getJSONObject(i)); } catch (Exception ignore) {}
        return out;
    }
    public synchronized void saveList(String name, List<JSONObject> items) {
        JSONArray a = new JSONArray();
        int from = Math.max(0, items.size() - 1500); // never let a dead connection fill the phone
        for (int i = from; i < items.size(); i++) a.put(items.get(i));
        writeFile(name, a.toString());
    }
    public synchronized void add(String name, JSONObject item) {
        List<JSONObject> l = list(name);
        l.add(item);
        saveList(name, l);
    }

    public File mediaDir() {
        File d = new File(ctx.getFilesDir(), "media");
        if (!d.exists()) d.mkdirs();
        return d;
    }

    private String readFile(String name, String def) {
        File f = new File(ctx.getFilesDir(), name);
        if (!f.exists()) return def;
        try (FileInputStream in = new FileInputStream(f)) {
            byte[] b = new byte[(int) f.length()];
            int off = 0, n;
            while (off < b.length && (n = in.read(b, off, b.length - off)) > 0) off += n;
            return new String(b, 0, off, StandardCharsets.UTF_8);
        } catch (Exception e) { return def; }
    }

    private void writeFile(String name, String s) {
        File tmp = new File(ctx.getFilesDir(), name + ".tmp");
        try (FileOutputStream out = new FileOutputStream(tmp)) {
            out.write(s.getBytes(StandardCharsets.UTF_8));
            out.getFD().sync();
        } catch (Exception e) { return; }
        tmp.renameTo(new File(ctx.getFilesDir(), name));
    }

    // ---- Android Keystore lock ----
    private static SecretKey keystoreKey() throws Exception {
        KeyStore ks = KeyStore.getInstance("AndroidKeyStore");
        ks.load(null);
        if (ks.containsAlias(ALIAS)) return ((KeyStore.SecretKeyEntry) ks.getEntry(ALIAS, null)).getSecretKey();
        KeyGenerator g = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore");
        g.init(new KeyGenParameterSpec.Builder(ALIAS, KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
            .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
            .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
            .setKeySize(256)
            .build());
        return g.generateKey();
    }

    private static String lock(String plain) {
        if (plain == null || plain.isEmpty()) return "";
        try {
            Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
            c.init(Cipher.ENCRYPT_MODE, keystoreKey());
            byte[] iv = c.getIV();
            byte[] enc = c.doFinal(plain.getBytes(StandardCharsets.UTF_8));
            return Base64.encodeToString(iv, Base64.NO_WRAP) + ":" + Base64.encodeToString(enc, Base64.NO_WRAP);
        } catch (Exception e) {
            return "";
        }
    }

    private static String unlock(String stored) {
        try {
            String[] parts = stored.split(":", 2);
            Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
            c.init(Cipher.DECRYPT_MODE, keystoreKey(), new GCMParameterSpec(128, Base64.decode(parts[0], Base64.NO_WRAP)));
            return new String(c.doFinal(Base64.decode(parts[1], Base64.NO_WRAP)), StandardCharsets.UTF_8);
        } catch (Exception e) {
            return null;
        }
    }
}
