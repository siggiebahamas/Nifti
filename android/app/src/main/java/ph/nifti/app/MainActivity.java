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
import android.widget.Toast;

/** Nifti itself (the same website) inside an app, plus the parts a website can't do. */
public class MainActivity extends Activity {
    static final String HOME = "https://siggiebahamas.github.io/Nifti/?app=android";
    /** What a website can't do inside an app, handed to the phone: print, share, save files, remember download names. */
    static final String APP_JS = "(function(){if(window.__nfApp)return;window.__nfApp=1;"
        + "window.print=function(){try{NiftiAndroid.print(document.title||'Nifti')}catch(e){}};"
        + "navigator.share=function(d){d=d||{};try{NiftiAndroid.share(d.title||'',d.text||'',d.url||'');return Promise.resolve();}catch(e){return Promise.reject(e)}};"
        + "navigator.canShare=function(){return true};"
        + "document.addEventListener('click',function(e){var a=e.target&&e.target.closest&&e.target.closest('a[download]');if(a)window.__nfDl=a.getAttribute('download')||'';},true);"
        + "})();";
    String lastFailed;
    static final int REQ_FILE = 11, REQ_PERM = 12;
    WebView web;
    private ValueCallback<Uri[]> fileCb;
    private Uri cameraUri;
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
                // files (photos, PDFs) open in the phone's own viewer; Nifti pages stay in the app
                boolean file = u.getHost() != null && u.getHost().endsWith(".supabase.co") && u.getPath() != null && u.getPath().contains("/storage/");
                if (ours(u) && !file) return false;
                try {
                    Intent i = "intent".equals(u.getScheme()) ? Intent.parseUri(u.toString(), Intent.URI_INTENT_SCHEME) : new Intent(Intent.ACTION_VIEW, u);
                    i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    startActivity(i);
                } catch (Exception e) {
                    if ("viber".equals(u.getScheme())) Toast.makeText(MainActivity.this, "Viber isn't installed on this phone.", Toast.LENGTH_LONG).show();
                }
                return true;
            }
            @Override public void onReceivedError(WebView view, WebResourceRequest req, android.webkit.WebResourceError err) {
                if (req.isForMainFrame()) { lastFailed = req.getUrl().toString(); view.loadUrl("file:///android_asset/offline.html"); }
            }
            @Override public void onPageStarted(WebView view, String url, android.graphics.Bitmap favicon) { currentUrl = url; }
            @Override public void onPageFinished(WebView view, String url) {
                currentUrl = url;
                if (url.startsWith("http")) view.evaluateJavascript(APP_JS, null);
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> cb, FileChooserParams p) {
                if (fileCb != null) fileCb.onReceiveValue(null);
                fileCb = cb;
                cameraUri = null;
                try {
                    Intent pick = p.createIntent();
                    if (p.getMode() == FileChooserParams.MODE_OPEN_MULTIPLE) pick.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
                    boolean wantsPhoto = false;
                    for (String t : p.getAcceptTypes()) if (t == null || t.isEmpty() || t.startsWith("image")) wantsPhoto = true;
                    Intent chooser = Intent.createChooser(pick, "Choose");
                    // photos: offer the camera right there too (saved to Pictures/Nifti, no extra permission needed)
                    if (wantsPhoto && Build.VERSION.SDK_INT >= 29) {
                        android.content.ContentValues cv = new android.content.ContentValues();
                        cv.put(android.provider.MediaStore.MediaColumns.DISPLAY_NAME, "nifti-" + System.currentTimeMillis() + ".jpg");
                        cv.put(android.provider.MediaStore.MediaColumns.MIME_TYPE, "image/jpeg");
                        cv.put(android.provider.MediaStore.MediaColumns.RELATIVE_PATH, "Pictures/Nifti");
                        cameraUri = getContentResolver().insert(android.provider.MediaStore.Images.Media.EXTERNAL_CONTENT_URI, cv);
                        if (cameraUri != null) {
                            Intent cam = new Intent(android.provider.MediaStore.ACTION_IMAGE_CAPTURE).putExtra(android.provider.MediaStore.EXTRA_OUTPUT, cameraUri)
                                .addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
                            if (p.isCaptureEnabled()) { startActivityForResult(cam, REQ_FILE); return true; }
                            chooser.putExtra(Intent.EXTRA_INITIAL_INTENTS, new Intent[]{cam});
                        }
                    }
                    startActivityForResult(chooser, REQ_FILE);
                    return true;
                } catch (Exception e) {
                    fileCb = null;
                    return false;
                }
            }
        });
        web.setDownloadListener((url, ua, cd, mime, len) -> {
            String name = android.webkit.URLUtil.guessFileName(url, cd, mime);
            if (url.startsWith("blob:") || url.startsWith("data:")) {
                // files made inside the page (exports, statements): read them in the page and save them to Downloads
                String js = "(async function(){try{var r=await fetch('" + url.replace("'", "\\'") + "');var b=await r.blob();var fr=new FileReader();"
                    + "fr.onload=function(){NiftiAndroid.saveFile(window.__nfDl||'" + name.replace("'", "") + "',b.type||'" + (mime == null ? "" : mime) + "',String(fr.result).split(',')[1]);window.__nfDl='';};fr.readAsDataURL(b);}catch(e){}})()";
                web.evaluateJavascript(js, null);
                return;
            }
            try {
                android.app.DownloadManager dm = (android.app.DownloadManager) getSystemService(DOWNLOAD_SERVICE);
                android.app.DownloadManager.Request r = new android.app.DownloadManager.Request(Uri.parse(url));
                r.setMimeType(mime); r.addRequestHeader("User-Agent", ua);
                String cookie = CookieManager.getInstance().getCookie(url); if (cookie != null) r.addRequestHeader("Cookie", cookie);
                r.setNotificationVisibility(android.app.DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                r.setDestinationInExternalPublicDir(android.os.Environment.DIRECTORY_DOWNLOADS, name);
                dm.enqueue(r);
                Toast.makeText(this, "Downloading " + name, Toast.LENGTH_SHORT).show();
            } catch (Exception e) {
                try { startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url))); } catch (Exception ignore) {}
            }
        });
        if (saved != null) web.restoreState(saved);
        else web.loadUrl(HOME);
        if (getIntent() != null && "setup".equals(getIntent().getStringExtra("open"))) openSetupSoon();
        if (saved == null) web.postDelayed(() -> openFromAlert(getIntent()), 1500);

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

    @Override protected void onNewIntent(Intent i) {
        super.onNewIntent(i);
        setIntent(i);
        if ("setup".equals(i.getStringExtra("open"))) openSetupSoon();
        openFromAlert(i);
    }

    /** An alert was tapped: go to the page it's about (only Nifti's own pages). */
    private void openFromAlert(Intent i) {
        String url = i == null ? null : i.getStringExtra("url");
        if (url == null || url.isEmpty() || web == null) return;
        Uri u = Uri.parse(url);
        if (u.getScheme() == null) u = Uri.parse("https://siggiebahamas.github.io/Nifti/" + url.replaceFirst("^/+", ""));
        if (ours(u)) web.loadUrl(u.toString());
    }

    void retryLoad() { runOnUiThread(() -> { if (web != null) web.loadUrl(lastFailed != null ? lastFailed : HOME); }); }

    void printPage(String title) {
        runOnUiThread(() -> {
            try {
                android.print.PrintManager pm = (android.print.PrintManager) getSystemService(PRINT_SERVICE);
                pm.print(title, web.createPrintDocumentAdapter(title), new android.print.PrintAttributes.Builder().build());
            } catch (Exception e) { Toast.makeText(this, "Printing isn't available on this phone.", Toast.LENGTH_LONG).show(); }
        });
    }

    private void openSetupSoon() {
        if (web == null) return;
        web.postDelayed(() -> { if (web != null) web.evaluateJavascript("window.nf36vSetup&&nf36vSetup()", null); }, 2500);
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
            Uri[] picked = WebChromeClient.FileChooserParams.parseResult(res, data);
            if ((picked == null || picked.length == 0) && res == RESULT_OK && cameraUri != null) picked = new Uri[]{cameraUri};
            if ((picked == null || picked.length == 0) && cameraUri != null) { try { getContentResolver().delete(cameraUri, null, null); } catch (Exception ignore) {} }
            fileCb.onReceiveValue(picked);
            fileCb = null;
            cameraUri = null;
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
