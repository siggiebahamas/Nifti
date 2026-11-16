package ph.nifti.app;

import android.Manifest;
import android.content.ContentResolver;
import android.content.Context;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.provider.MediaStore;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.Locale;
import java.util.Set;

/**
 * When a Viber notification only says "Photo", the picture itself is saved by Viber into its own
 * folder on the phone a moment later (when auto-download is on). This finds it. Only files inside a
 * folder with "Viber" in its path are ever taken, so the person's own camera photos are never picked up.
 */
final class MediaFinder {
    static final class Found { Uri uri; String name; String mime; long size; }

    static boolean allowed(Context c) {
        if (Build.VERSION.SDK_INT >= 33) return c.checkSelfPermission(Manifest.permission.READ_MEDIA_IMAGES) == PackageManager.PERMISSION_GRANTED;
        return c.checkSelfPermission(Manifest.permission.READ_EXTERNAL_STORAGE) == PackageManager.PERMISSION_GRANTED;
    }

    static Found find(Context c, String kind, long atMs, Set<String> used) {
        Uri base = "video".equals(kind) ? MediaStore.Video.Media.EXTERNAL_CONTENT_URI : MediaStore.Images.Media.EXTERNAL_CONTENT_URI;
        String pathCol = Build.VERSION.SDK_INT >= 29 ? MediaStore.MediaColumns.RELATIVE_PATH : MediaStore.MediaColumns.DATA;
        String[] proj = {MediaStore.MediaColumns._ID, MediaStore.MediaColumns.DISPLAY_NAME, MediaStore.MediaColumns.MIME_TYPE,
            MediaStore.MediaColumns.DATE_ADDED, MediaStore.MediaColumns.SIZE, pathCol};
        String sel = MediaStore.MediaColumns.DATE_ADDED + " >= ?";
        String[] args = {String.valueOf(atMs / 1000L - 180)};
        Found best = null;
        long bestGap = Long.MAX_VALUE;
        try (Cursor cur = c.getContentResolver().query(base, proj, sel, args, MediaStore.MediaColumns.DATE_ADDED + " DESC")) {
            if (cur == null) return null;
            int n = 0;
            while (cur.moveToNext() && n++ < 40) {
                String path = cur.getString(5);
                if (path == null || !path.toLowerCase(Locale.ROOT).contains("viber")) continue;
                Uri u = Uri.withAppendedPath(base, String.valueOf(cur.getLong(0)));
                if (used.contains(u.toString())) continue;
                long gap = Math.abs(cur.getLong(3) * 1000L - atMs);
                if (gap < bestGap) {
                    bestGap = gap;
                    best = new Found();
                    best.uri = u; best.name = cur.getString(1); best.mime = cur.getString(2); best.size = cur.getLong(4);
                }
            }
        } catch (Exception e) {
            return null;
        }
        return best;
    }

    /** A file Viber downloaded, matched by its exact name from the notification. */
    static Found findFile(Context c, String name, long atMs, Set<String> used) {
        if (name == null || name.isEmpty() || Build.VERSION.SDK_INT < 29) return null;
        Uri base = MediaStore.Files.getContentUri("external");
        String[] proj = {MediaStore.MediaColumns._ID, MediaStore.MediaColumns.DISPLAY_NAME, MediaStore.MediaColumns.MIME_TYPE, MediaStore.MediaColumns.SIZE};
        String sel = MediaStore.MediaColumns.DISPLAY_NAME + " = ? AND " + MediaStore.MediaColumns.DATE_ADDED + " >= ?";
        String[] args = {name, String.valueOf(atMs / 1000L - 1800)};
        try (Cursor cur = c.getContentResolver().query(base, proj, sel, args, MediaStore.MediaColumns.DATE_ADDED + " DESC")) {
            if (cur == null || !cur.moveToFirst()) return null;
            Uri u = Uri.withAppendedPath(base, String.valueOf(cur.getLong(0)));
            if (used.contains(u.toString())) return null;
            Found f = new Found();
            f.uri = u; f.name = cur.getString(1); f.mime = cur.getString(2); f.size = cur.getLong(3);
            return f;
        } catch (Exception e) {
            return null;
        }
    }

    static boolean copy(Context c, Uri from, File to) {
        ContentResolver cr = c.getContentResolver();
        try (InputStream in = cr.openInputStream(from); OutputStream out = new FileOutputStream(to)) {
            if (in == null) return false;
            byte[] b = new byte[64 * 1024];
            int n;
            long total = 0;
            while ((n = in.read(b)) > 0) {
                out.write(b, 0, n);
                total += n;
                if (total > 25L * 1024 * 1024) { out.close(); to.delete(); return false; }
            }
            return true;
        } catch (Exception e) {
            to.delete();
            return false;
        }
    }

    static String safe(String name) {
        String s = name == null ? "file" : name.replaceAll("[^\\w.\\-]+", "_");
        return s.length() > 80 ? s.substring(s.length() - 80) : s;
    }
}
