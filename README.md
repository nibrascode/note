# Nibras Note

Paper-style notebook app for Android by **Nibras Code**. Lined, grid, dotted, Cornell, list, journal, planner and coloured papers; text, pens, shapes, images; PDF export and JSON backup. Interface in Azerbaijani, Turkish, English, Russian and Arabic.

Everything stays on the device — no account, no server, no ads, no tracking, no internet permission.

- Package: `com.nibras.note` · version 1.0.0 (1)
- Stack: Vite + React + zustand (localStorage) wrapped with Capacitor 7
- Privacy: [PRIVACY.md](PRIVACY.md) · https://nibrascode.com/privacy/nibras-note

## Build

```bash
npm install
npm run android                     # vite build + cap sync
cd android && JAVA_HOME=<jdk21> ./gradlew bundleRelease
# -> android/app/build/outputs/bundle/release/app-release.aab
```

Release signing reads `/home/box/keys/nibras-note-upload.properties` (not in repo).

Store listing material: [store/PLAY_STORE_GUIDE.md](store/PLAY_STORE_GUIDE.md).
