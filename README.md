# Triple Downloader (TikTok / Instagram / YouTube)

React Native + TypeScript (Expo) app with three tabs. Paste a link, tap
**Get Preview**, then **Download to Gallery**. Videos save into a
"TripleDownloader" album on the device.

## How it fetches videos (read this first)

None of TikTok, Instagram, or YouTube offer an official "download" API, so
this app uses two free, key-free, community-run services under the hood:

- **tikwm.com** — TikTok-only, returns a no-watermark link. Primary path for TikTok.
- **Cobalt** (`api.cobalt.tools`) — open-source downloader supporting TikTok,
  Instagram, and YouTube. Primary path for Instagram/YouTube, fallback for TikTok.

Because these are unofficial third-party services, not run by
TikTok/Instagram/YouTube, expect:
- Private/age-restricted/region-locked content to fail (expected, not a bug).
- Occasional downtime or rate limits on the public Cobalt instance.
- The API shape changing over time — if things stop working, check
  https://github.com/imputnet/cobalt for the current public URL, or self-host
  your own Cobalt instance (one Docker command, see their repo) and swap the
  `COBALT_API` constant in `src/api/downloader.ts` for a much more reliable setup.

Also worth knowing: downloading YouTube videos is against YouTube's Terms of
Service, even though it's technically possible. Use this responsibly (e.g.
your own content, or content you have rights to save).

## Run it locally (dev mode, on your phone)

```bash
npm install
npx expo start
```
Scan the QR code with the **Expo Go** app (App Store / Play Store) on your phone.

## Build a real, installable APK (free, no Mac/Android Studio needed)

This uses Expo's free cloud build service (EAS).

```bash
npm install -g eas-cli
eas login          # free Expo account — sign up if you don't have one
eas build:configure
eas build -p android --profile preview
```

Wait ~10–15 minutes. EAS gives you a link when it's done — open it on your
phone (or scan the QR code it prints) to download and install the APK
directly. You'll need to allow "install from unknown sources" once, since
it's not from the Play Store.

## Project structure

```
App.tsx                        - tab navigation (3 modules)
src/screens/DownloaderScreen.tsx - shared UI for all 3 platforms
src/api/downloader.ts          - fetches preview + resolves download link
src/utils/download.ts          - downloads file, saves to gallery
src/types/index.ts             - shared TS types
```

## Customizing

- Change `android.package` in `app.json` before building (must be unique,
  e.g. `com.yourname.tripledownloader`).
- Add an `assets/icon.png` (1024x1024) for a custom app icon, or remove the
  `icon` line in `app.json` to use Expo's default.
