package ph.nifti.app;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.provider.ContactsContract;

import java.util.HashMap;
import java.util.Map;

/**
 * Finds the phone number saved for a Viber chat's name in the phone's own contacts, so Nifti can tell
 * that "Kuya Ben" is the same person as the customer with that number. Only the one number is sent.
 */
final class Contacts {
    private static final Map<String, String> cache = new HashMap<>();
    private Contacts() {}

    static boolean allowed(Context c) {
        return c.checkSelfPermission(Manifest.permission.READ_CONTACTS) == PackageManager.PERMISSION_GRANTED;
    }

    static synchronized String phoneFor(Context c, String name) {
        if (name == null || name.trim().isEmpty() || !allowed(c)) return null;
        String k = name.trim().toLowerCase();
        if (cache.containsKey(k)) return cache.get(k);
        String num = null;
        try (Cursor cur = c.getContentResolver().query(ContactsContract.CommonDataKinds.Phone.CONTENT_URI,
                new String[]{ContactsContract.CommonDataKinds.Phone.NUMBER},
                ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME + " = ?", new String[]{name.trim()}, null)) {
            if (cur != null && cur.moveToFirst()) num = cur.getString(0);
        } catch (Exception ignore) {}
        cache.put(k, num);
        if (cache.size() > 500) cache.clear();
        return num;
    }
}
