package ph.nifti.app;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Xiaomi, OPPO, vivo (and realme, Infinix, Tecno, Huawei) close background apps to save battery,
 * which would stop Viber messages from reaching Nifti. These open the right settings screen on each.
 */
final class Brand {
    private Brand() {}

    static String key() {
        String m = (Build.MANUFACTURER + " " + Build.BRAND).toLowerCase(Locale.ROOT);
        if (m.contains("xiaomi") || m.contains("redmi") || m.contains("poco")) return "xiaomi";
        if (m.contains("oppo") || m.contains("realme") || m.contains("oneplus")) return "oppo";
        if (m.contains("vivo") || m.contains("iqoo")) return "vivo";
        if (m.contains("infinix") || m.contains("tecno") || m.contains("itel")) return "transsion";
        if (m.contains("huawei") || m.contains("honor")) return "huawei";
        if (m.contains("samsung")) return "samsung";
        return "other";
    }

    /** Phones known to close apps unless told not to */
    static boolean strict() {
        String k = key();
        return k.equals("xiaomi") || k.equals("oppo") || k.equals("vivo") || k.equals("transsion") || k.equals("huawei") || k.equals("samsung");
    }

    private static Intent comp(String pkg, String cls) {
        return new Intent().setComponent(new ComponentName(pkg, cls)).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
    }

    static List<Intent> autostart(Context c) {
        List<Intent> l = new ArrayList<>();
        switch (key()) {
            case "xiaomi":
                l.add(comp("com.miui.securitycenter", "com.miui.permcenter.autostart.AutoStartManagementActivity"));
                l.add(comp("com.miui.securitycenter", "com.miui.powercenter.PowerSettings"));
                break;
            case "oppo":
                l.add(comp("com.coloros.safecenter", "com.coloros.safecenter.permission.startup.StartupAppListActivity"));
                l.add(comp("com.coloros.safecenter", "com.coloros.safecenter.startupapp.StartupAppListActivity"));
                l.add(comp("com.oppo.safe", "com.oppo.safe.permission.startup.StartupAppListActivity"));
                l.add(comp("com.coloros.oppoguardelf", "com.coloros.powermanager.fuelgaue.PowerUsageModelActivity"));
                break;
            case "vivo":
                l.add(comp("com.vivo.permissionmanager", "com.vivo.permissionmanager.activity.BgStartUpManagerActivity"));
                l.add(comp("com.iqoo.secure", "com.iqoo.secure.ui.phoneoptimize.BgStartUpManager"));
                l.add(comp("com.iqoo.secure", "com.iqoo.secure.ui.phoneoptimize.AddWhiteListActivity"));
                break;
            case "transsion":
                l.add(comp("com.transsion.phonemaster", "com.cyin.himgr.autostart.AutoStartActivity"));
                break;
            case "huawei":
                l.add(comp("com.huawei.systemmanager", "com.huawei.systemmanager.startupmgr.ui.StartupNormalAppListActivity"));
                l.add(comp("com.huawei.systemmanager", "com.huawei.systemmanager.optimize.process.ProtectActivity"));
                break;
            default:
                break;
        }
        l.add(appInfo(c));
        return l;
    }

    static List<Intent> battery(Context c) {
        List<Intent> l = new ArrayList<>();
        // the standard Android question: "Let Nifti always run in the background?"
        l.add(new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS, Uri.parse("package:" + c.getPackageName())).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
        if (key().equals("xiaomi")) {
            l.add(comp("com.miui.powerkeeper", "com.miui.powerkeeper.ui.HiddenAppsConfigActivity")
                .putExtra("package_name", c.getPackageName()).putExtra("package_label", "Nifti"));
        }
        l.add(new Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
        l.add(appInfo(c));
        return l;
    }

    static Intent appInfo(Context c) {
        return new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + c.getPackageName())).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
    }

    /** Opens the first screen that exists on this phone */
    static boolean open(Context c, List<Intent> list) {
        for (Intent i : list) {
            try { c.startActivity(i); return true; } catch (Exception ignore) {}
        }
        return false;
    }
}
