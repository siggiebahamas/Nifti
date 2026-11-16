package ph.nifti.app;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Insets;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowInsets;
import android.webkit.CookieManager;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

/** Nifti itself (the same website) inside an app, plus the parts a website can't do. */
public class MainActivity extends Activity {
    static final String HOME = "https://siggiebahamas.github.io/Nifti/?app=android";
    static final int REQ_FILE = 11, REQ_PERM = 12;
    WebView web;
    private ValueCallback<Uri[]> fileCb;
    volatile String currentUrl = HOME;

    static boolean ours(Uri u) {
        if (u == null || !"https".equals(u.getScheme()) || u.getHost() == null) return false;
        String host = u.getHost();
        return host.equals("siggiebahamas.github.io") || host.endsWith(".supabase.co");
    }

    @Override protected void onCreate(Bundle saved) {
        super.onCreate(saved);
        web = new WebView(this);
        setContentView(web);
        web.setOnApplyWindowInsetsListener((v, ins) -> {
            if (Build.VERSION.SDK_INT >= 30) {
                Insets b = ins.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.ime());
                v.setPadding(b.left, b.top, b.right, b.bottom);
            } else {
                v.setPadding(ins.getSystemWindowInsetLeft(), ins.getSystemWindowInsetTop(), ins.getSystemWindowInsetRight(), ins.getSystemWindowInsetBottom());
            }
            return ins;
        });
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(true);
        s.setMediaPlaybackRequiresUserGesture(true);
        s.setUserAgentString(s.getUserAgentString() + " NiftiAndroid/" + BuildConfig.VERSION_CODE);
        CookieManager.getInstance().setAcceptCookie(true);
        web.addJavascriptInterface(new Bridge(this), "NiftiAndroid");
        web.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req) {
                Uri u = req.getUrl();
                if (ours(u)) return false;
                try { startActivity(new Intent(Intent.ACTION_VIEW, u).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)); } catch (Exception ignore) {}
                return true;
            }
            @Override public void onPageStarted(WebView view, String url, android.graphics.Bitmap favicon) { currentUrl = url; }
            @Override public void onPageFinished(WebView view, String url) { currentUrl = url; }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> cb, FileChooserParams p) {
                if (fileCb != null) fileCb.onReceiveValue(null);
                fileCb = cb;
                try {
                    Intent i = p.createIntent();
                    if (p.getMode() == FileChooserParams.MODE_OPEN_MULTIPLE) i.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
                    startActivityForResult(Intent.createChooser(i, "Choose"), REQ_FILE);
                    return true;
                } catch (Exception e) {
                    fileCb = null;
                    return false;
                }
            }
        });
        web.setDownloadListener((url, ua, cd, mime, len) -> {
            try { startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url))); } catch (Exception ignore) {}
        });
        if (saved != null) web.restoreState(saved);
        else web.loadUrl(HOME);

        if (Build.VERSION.SDK_INT >= 33) {
            // back gesture: go back inside Nifti first, then leave the app running in the background
            getOnBackInvokedDispatcher().registerOnBackInvokedCallback(android.window.OnBackInvokedDispatcher.PRIORITY_DEFAULT, () -> {
                if (web != null && web.canGoBack()) web.goBack();
                else moveTaskToBack(true);
            });
        }
        Relay.get(this).start();
        SyncJob.schedule(this);
        if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, REQ_PERM);
        }
    }

    void tellPage(String what) {
        runOnUiThread(() -> { if (web != null) web.evaluateJavascript("window.nf36vNative&&window.nf36vNative('" + what + "')", null); });
    }

    @Override protected void onResume() {
        super.onResume();
        tellPage("resume");
        Relay.get(this).tickAsync();
    }

    @Override protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        if (web != null) web.saveState(out);
    }

    @Override protected void onActivityResult(int req, int res, Intent data) {
        super.onActivityResult(req, res, data);
        if (req == REQ_FILE && fileCb != null) {
            fileCb.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(res, data));
            fileCb = null;
        }
    }

    @Override public void onRequestPermissionsResult(int req, String[] p, int[] r) {
        super.onRequestPermissionsResult(req, p, r);
        tellPage("perm");
        Relay.get(this).tickAsync();
    }

    @android.annotation.SuppressLint("GestureBackNavigation") // Android 13+ uses the callback in onCreate
    @Override public void onBackPressed() {
        if (web != null && web.canGoBack()) web.goBack();
        else super.onBackPressed();
    }

    @Override protected void onDestroy() {
        if (web != null) { web.removeJavascriptInterface("NiftiAndroid"); web.destroy(); web = null; }
        super.onDestroy();
    }

    void hideKeyboard() {
        View v = getCurrentFocus();
        if (v != null) v.clearFocus();
    }
}
