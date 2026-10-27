# Nibras Note — Google Play / Huawei AppGallery guide (v1.0.0)

## Files
| Item | Path |
|---|---|
| Signed AAB | GitHub release `v1.0.0` → `NibrasNote-1.0.0.aab` (built at `android/app/build/outputs/bundle/release/app-release.aab`) |
| App icon 512×512 | `store/icon-512.png` |
| Feature graphic 1024×500 | `store/feature-graphic-1024x500.png` |
| Phone screenshots 1080×1920 | `store/screenshot-1-shelf.png`, `screenshot-2-editor.png`, `screenshot-3-editor-cornell.png`, `screenshot-4-settings.png` |
| Listing text (EN) | `store/huawei-listing-en.txt` |
| Privacy policy | https://nibrascode.com/privacy/nibras-note (mirror: `docs/privacy-policy.html` on GitHub Pages) |

## App details
- Package: `com.nibras.note` · versionName 1.0.0 · versionCode 1 · minSdk 24 · targetSdk 36
- Upload key: alias `nibras-note`, keystore kept off-repo. Enrol in Play App Signing.
- Category: Productivity · Free · No ads · Contains no in-app purchases

## Play Console answers
- **Ads:** No
- **Data safety:** No data collected, no data shared. Data is not transmitted off device (app has no INTERNET permission).
- **Account required / login:** No (no account creation, no deletion URL needed — state "app does not create accounts").
- **Target audience:** 13+ recommended (general productivity; not designed for children).
- **Content rating (IARC):** utility/productivity, no user interaction/sharing, no violence → Everyone / 3+.
- **Government / financial / health features:** None.

## Steps
1. Create app "Nibras Note" (default language en-US or az-AZ), free.
2. Fill store listing using `huawei-listing-en.txt` + assets above.
3. Upload `NibrasNote-1.0.0.aab` to **Internal testing** first; check on a device.
4. Promote to production only after testing.

## Huawei AppGallery
Upload the same AAB (AppGallery accepts AAB), use the listing text, privacy URL, and "Permissions: none".
