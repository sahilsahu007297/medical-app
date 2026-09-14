
# Rest — Personal health space

A mobile-first health dashboard with interactive anatomy, motion-based step estimates, Bluetooth heart-rate monitoring, three walking scenes, workouts, daily records, and streaks.

```sh
npm install
npm run dev
npm test
npm run build
```

Google-only authentication, owner-scoped Supabase database syncing, and private report uploads are ready to configure. Follow [SUPABASE_SETUP.md](./SUPABASE_SETUP.md), copy `.env.example` to `.env.local`, and apply the included migration. Until configured, the sign-in page offers a separate local preview.

Browser tracking needs a supported phone, HTTPS, motion permission, and a visible page. Step counts are estimates. Heart rate comes only from a compatible Bluetooth monitor; oxygen, blood pressure and ECG are not fabricated. Google/cloud/hardware integration needs verification on your own project and device.

The original project was based on [Medical App in Figma](https://www.figma.com/design/yZo4QvjAHfhbRbWMBs90FP/Medical-App). Illustration source and generation prompt: [asset notes](src/assets/ASSET_NOTES.md).
