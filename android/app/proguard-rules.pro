# The web page calls these by name
-keepclassmembers class ph.nifti.app.Bridge { @android.webkit.JavascriptInterface <methods>; }
-keep class ph.nifti.app.** extends android.app.Service
-keep class ph.nifti.app.** extends android.app.Activity
