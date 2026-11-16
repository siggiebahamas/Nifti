package ph.nifti.app;

import android.app.job.JobInfo;
import android.app.job.JobParameters;
import android.app.job.JobScheduler;
import android.app.job.JobService;
import android.content.ComponentName;
import android.content.Context;

/** Every 15 minutes, even if the phone killed the app: send anything waiting, pick up replies, say "still here". */
public class SyncJob extends JobService {
    static void schedule(Context c) {
        JobScheduler js = c.getSystemService(JobScheduler.class);
        if (js == null) return;
        for (JobInfo j : js.getAllPendingJobs()) if (j.getId() == 4711) return;
        js.schedule(new JobInfo.Builder(4711, new ComponentName(c, SyncJob.class))
            .setRequiredNetworkType(JobInfo.NETWORK_TYPE_ANY)
            .setPeriodic(15 * 60 * 1000L)
            .setPersisted(true)
            .build());
    }

    @Override public boolean onStartJob(JobParameters p) {
        Relay r = Relay.get(this);
        r.start();
        r.h.post(() -> {
            try {
                r.tick(true);
                if (r.store.connected() && !Status.listenerOn(this)) Notify.listenerOff(this);
            } catch (Throwable ignore) {}
            jobFinished(p, false);
        });
        return true;
    }

    @Override public boolean onStopJob(JobParameters p) { return true; }
}
