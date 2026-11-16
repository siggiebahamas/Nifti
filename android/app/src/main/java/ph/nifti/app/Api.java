package ph.nifti.app;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/** Talks to the Nifti server with the phone's device key. Never with the person's login. */
public final class Api {
    public static final class Fail extends IOException {
        public final int code; public final boolean disconnected;
        Fail(int code, String body) {
            super("HTTP " + code + ": " + (body == null ? "" : body.length() > 300 ? body.substring(0, 300) : body));
            this.code = code;
            this.disconnected = body != null && (body.contains("device not connected") || body.contains("28000"));
        }
    }

    private final Store s;
    public Api(Store s) { this.s = s; }

    /** Calls one of the viber_dev_* functions. The device id and key are added here. */
    public String rpc(String fn, JSONObject args) throws IOException {
        try {
            args.put("p_device", s.device());
            args.put("p_secret", s.secret());
        } catch (Exception e) { throw new IOException(e); }
        HttpURLConnection c = (HttpURLConnection) new URL(s.url() + "/rest/v1/rpc/" + fn).openConnection();
        c.setConnectTimeout(15000);
        c.setReadTimeout(30000);
        c.setRequestMethod("POST");
        c.setDoOutput(true);
        c.setRequestProperty("apikey", s.key());
        c.setRequestProperty("Content-Type", "application/json");
        c.setRequestProperty("Accept", "application/json");
        try (OutputStream o = c.getOutputStream()) { o.write(args.toString().getBytes(StandardCharsets.UTF_8)); }
        return read(c);
    }

    /** Sends a photo or file for a message that is already saved. */
    public String upload(String messageId, File f, String mime, String name) throws IOException {
        HttpURLConnection c = (HttpURLConnection) new URL(s.url() + "/functions/v1/viber-media?op=upload&m=" + messageId).openConnection();
        c.setConnectTimeout(15000);
        c.setReadTimeout(120000);
        c.setRequestMethod("POST");
        c.setDoOutput(true);
        c.setFixedLengthStreamingMode(f.length());
        c.setRequestProperty("apikey", s.key());
        c.setRequestProperty("Content-Type", mime == null || mime.isEmpty() ? "application/octet-stream" : mime);
        c.setRequestProperty("x-nifti-device", s.device());
        c.setRequestProperty("x-nifti-secret", s.secret());
        c.setRequestProperty("x-nifti-name", URLEncoder.encode(name == null ? f.getName() : name, "UTF-8"));
        try (OutputStream o = c.getOutputStream(); InputStream in = new FileInputStream(f)) {
            byte[] b = new byte[64 * 1024];
            int n;
            while ((n = in.read(b)) > 0) o.write(b, 0, n);
        }
        return read(c);
    }

    private static String read(HttpURLConnection c) throws IOException {
        int code = c.getResponseCode();
        InputStream in = code >= 400 ? c.getErrorStream() : c.getInputStream();
        String body = "";
        if (in != null) {
            ByteArrayOutputStream bo = new ByteArrayOutputStream();
            byte[] b = new byte[8192];
            int n;
            while ((n = in.read(b)) > 0) bo.write(b, 0, n);
            in.close();
            body = bo.toString("UTF-8");
        }
        c.disconnect();
        if (code >= 400) throw new Fail(code, body);
        return body;
    }
}
