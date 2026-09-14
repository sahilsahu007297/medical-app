# Activate your Rest account and cloud storage

The app is ready to use Supabase Auth, Postgres and a private Storage bucket. No cloud project has been created or provisioned. Until you add configuration, the Google-only sign-in screen offers a clearly labeled local preview. Preview records never automatically upload to someone else's Google account.

1. Create a **Free** Supabase project. Run `supabase/migrations/202609140001_wellness.sql` once in its SQL editor. It creates daily records, workouts, owner-only row policies, a conflict-safe merge trigger, and the private `health-records` bucket.
2. Copy `.env.example` to `.env.local`. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` from the project settings. A legacy public anon key can be supplied as `VITE_SUPABASE_ANON_KEY` instead. Never use a service-role key, Supabase secret key, or Google client secret in frontend environment variables.
3. In Google Cloud Console, configure an OAuth consent screen and a Web application OAuth client. Add your app origin (for example `http://localhost:5173` and your deployed HTTPS domain) as authorized JavaScript origins. Add `https://YOUR_PROJECT.supabase.co/auth/v1/callback` as an authorized redirect URI. If the Google app is in testing mode, add your Google account as a test user.
4. In Supabase → Authentication → Providers → Google, enable Google and paste the Google client ID and secret. The secret belongs here, not in this repo. Disable other providers if Google must be the only provider.
5. In Supabase → Authentication → URL Configuration, set **Site URL** to your deployed app. Add `http://localhost:5173/` and your exact deployed `https://your-domain/` to allowed redirect URLs. The browser client uses the root URL for its PKCE callback and automatically restores the session.
6. Restart `npm run dev`, or set the same `VITE_` variables in your host and rebuild/redeploy. These values are compiled at build time. Sign in using **Login with Google**.

## How records work

- Daily step totals are stored separately per user, device and local calendar day. Steps from different devices are summed; use one tracking device at a time to avoid overlapping counts.
- Check-ins and hydration use the most recent field timestamp. The database merges retries without decreasing step counts or rolling back newer check-ins. The device clock must be correct for timestamps.
- Changes are saved immediately to an account-specific browser journal. Online changes sync in batches, with retries on reconnect. The UI reports offline, pending, synced, and failure states. Signing out stops the sensor; cached records stay isolated by account.
- A wellness streak counts consecutive days with a check-in, any logged hydration, at least 100 steps, or a finished workout of at least 60 seconds. A workout streak counts completed workouts. Yesterday keeps a streak alive until you record today; missed calendar days break it.
- Workout timers are resumable in this browser; finished workouts are saved to the day you finish. Starting a workout does not fabricate steps or automatically enable a sensor.
- Reports are private PDFs/JPGs/PNGs up to 10 MB. Authenticated users may only access files inside their own user-ID folder. The UI lists the latest 100 uploads.
- Browser data is not encrypted at rest. Use sign-out and normal device access protections on shared devices. RLS protects access through Supabase, including direct API calls.

## Phone motion sensor

Use HTTPS (or localhost for development), open the app on a physical phone, choose **Movement → Steps → Start tracking**, and grant Motion & Orientation access if prompted. Walk normally with the phone in your pocket. Three plausible motion peaks confirm a walking sequence; isolated bumps are filtered. The character stops after about 1.8 seconds without a confirmed step. Pick Quiet garden, By the coast, or Calm studio.

This is an accelerometer-based estimate, not the operating system's pedometer or HealthKit/Health Connect. It requires the app to stay visible and the screen awake. Tracking automatically pauses when hidden; it cannot count with the screen locked, in the background, or when the app is closed. Desktop and unsupported browsers show an explanatory state rather than fake steps. Accuracy varies by phone, carrying position, and movement. Real-device calibration is still required before relying on the count.

## Heart-rate hardware

The Heart rate page uses Web Bluetooth with the standard Heart Rate Service and Heart Rate Measurement characteristic. It parses 8/16-bit values, contact flags, energy-field offsets and RR intervals according to the Bluetooth SIG spec. Packets with missing contact, zero readings or truncated fields are rejected; a signal older than 10 seconds is not shown as live. Disconnecting clears the live display. One actual sensor reading per minute is retained in the daily journal, up to 1,440 per device/day, and syncs with the other daily fields. The graph is a heart-rate trend, **not ECG**. No heart rhythm, blood pressure, oxygen, or stress diagnosis is inferred.

Use a supported Android/desktop Chromium browser over HTTPS and a monitor that advertises the standard Heart Rate Service. Apple Watch generally does not broadcast this service directly; iPhone Safari does not support this Web Bluetooth flow. Continuous background steps and HealthKit/Health Connect would need a separately built native app with platform permissions. No browser library can guarantee sensor accuracy, manufacture physiological readings, or remove these platform limits. See [Web Bluetooth compatibility](https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API) and the [Bluetooth Heart Rate Service specification](https://www.bluetooth.com/wp-content/uploads/Files/Specification/HTML/HRS_v1.0/out/en/index-en.html).

## Cost and verification

This implementation needs no paid Supabase feature. Free-plan database/storage/bandwidth quotas and project-pausing rules still apply; it is not unlimited free storage. Review the [current Supabase pricing](https://supabase.com/pricing) before adding many reports.

Run `npm run build` and `npm test`. Apply and run `supabase/tests/wellness_rls.sql` in a test Supabase database to verify account isolation. Google login, live cloud syncing and uploads require your project credentials and cannot be verified until activation. The browser checks use synthetic motion events; they do not certify physical step accuracy.

References: [Supabase Google auth](https://supabase.com/docs/guides/auth/social-login/auth-google), [redirect configuration](https://supabase.com/docs/guides/auth/redirect-urls), [row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security), [private storage policies](https://supabase.com/docs/guides/storage/security/access-control), [browser motion permissions](https://developer.mozilla.org/en-US/docs/Web/API/DeviceMotionEvent/requestPermission_static).
