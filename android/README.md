# Nifti for Android

Nifti itself (the website) inside an app, plus what a website can't do: bring the owner's own Viber chats, photos and files into Nifti, and send replies typed in Nifti out from their Viber.

- `ViberListener` reads Viber's notifications on the phone (like a smartwatch). It never logs in to Viber.
- `ScreenReader` (optional, accessibility) catches messages in the Viber chat that's open on screen, because Viber shows no notification for it. Only looks at Viber.
- `Relay` keeps everything in a file queue until the server has it, finds photos Viber saved (only in Viber's own folder), sends replies, and shows a warning on the phone right away when something can't get through.
- `ShareActivity`: in Viber, hold a photo or file, Share, Nifti.

Build (needs the signing key, see NIFTI_HANDOVER_FOR_NEW_CHAT.md, "Viber bridge"):

```
ANDROID_HOME=/opt/android-sdk NIFTI_KEYSTORE=/path/nifti-release.jks NIFTI_KEYSTORE_PASS=... gradle assembleRelease
```

Tests: `gradle testDebugUnitTest` (message rules in `Parse`).
