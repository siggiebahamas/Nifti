# Putting Nifti on the Google Play Store

**You don't need this for the pilot.** Pilot users install from https://siggiebahamas.github.io/Nifti/app/ (Android download, iPhone home screen, computer). Do Play in parallel; it takes 3 to 4 weeks because of Google's testing rule.

Everything you upload is in this repo:
- App bundle: `android/release/nifti-1.2-play.aab`
- Listing text, graphics, screenshots: `android/store/`
- Answers to Google's forms: `android/store/data-safety.md`, `android/store/permissions-declarations.md`
- Signing key: the zip you already have. **Keep two copies. Lose it and you can never update the app.**

## Step 1. Developer account (day 1, about 30 min + 1 to 3 days waiting)
1. Go to play.google.com/console, sign in with the Google account that will own Nifti.
2. Pick **Yourself** (personal) unless you already have a registered business with a D-U-N-S number. Organization accounts skip the 12-tester rule in step 5, so pick it if you have the papers.
3. Pay the **US$25** one-time fee.
4. Verify your identity (government ID) and your phone. Google also asks you to confirm you own an Android phone using the Play Console app.

## Step 2. Create the app (10 min)
1. **Create app** → name `Nifti: Orders, Stock & Books`, language English (US), **App**, **Free**.
2. Tick the declarations, **Create app**.

## Step 3. App content (the forms, 45 min)
Left menu → **Policy and programs → App content**. Fill each one:
1. **Privacy policy**: `https://siggiebahamas.github.io/Nifti/privacy.html`
2. **App access**: "All or some functionality is restricted" → add a demo login (make a test business in Nifti for Google, with email + password).
3. **Ads**: No ads.
4. **Content rating**: fill the questionnaire, category **Utility, productivity, communication**; answer No to everything → rated Everyone.
5. **Target audience**: 18 and over only.
6. **Data safety**: copy `data-safety.md` row by row.
7. **Government app**: No. **Financial features**: "None of the above" (Nifti records payments but never moves money).
8. **Accessibility API**: paste from `permissions-declarations.md` and add the video link.

## Step 4. Store listing (20 min)
**Grow users → Store presence → Main store listing**. Paste from `listing.md`, upload `icon-512.png`, `feature-graphic.png` and the 6 screenshots in `screens/`.

## Step 5. Testing, then production
**Internal testing (same day, optional):** Test and release → Testing → Internal testing → Create release → upload `nifti-1.2-play.aab` → add your own email as tester → roll out. Usually live in minutes.

**Closed testing (required for personal accounts):**
1. Testing → Closed testing → Create track → upload the same `.aab` → roll out.
2. Testers → create an email list with **at least 12 people** (pilot users are perfect) → copy the opt-in link and send it to them.
3. Each tester opens the link, taps **Become a tester**, installs from Play.
4. **12 or more testers must stay opted in for 14 days in a row.** Ask them to open Nifti a few times a week; Google checks that it's actually used.
5. After 14 days: Dashboard → **Apply for production**, answer the short questions about your test (what feedback you got, what you changed).

**Production:** Google reviews it (usually 1 to 7 days; the Accessibility part can add a few days). Once approved: Production → Create release → same bundle → roll out.

## Step 6. After it's live
1. Send me the Play link. I put it in `NF37_PLAY_URL` so every "Get the app" button goes to Play, and Play updates the app by itself from then on.
2. Pilot users who installed the direct download: Play updates them in place, because both are signed with the same key. No uninstall needed.

## If Google rejects it
Almost always the Accessibility declaration. Fixes, in order:
1. Re-record the video showing the disclosure screen before the setting.
2. Reply in the Policy inbox quoting `permissions-declarations.md`.
3. Last resort: ship the Play version without the open-chat reader (notifications still bring in every chat that isn't on screen) and keep the full version on the direct download.
