package ph.nifti.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** After a restart or an update, start again by itself. */
public class BootReceiver extends BroadcastReceiver {
    @Override public void onReceive(Context c, Intent i) {
        SyncJob.schedule(c);
        Relay.get(c).start();
    }
}
