# Version 4.5.84

Release Date: 2026-09-09

### Fixed

- Android OEM Launcher Icon Cache Invalidation: Implemented non-destructive launcher icon cache refresh in `MainActivity.kt` via `PackageManager.setComponentEnabledSetting` with `DONT_KILL_APP`. Broadcasts `ACTION_PACKAGE_CHANGED` on upgrade to force OEM launchers (Samsung One UI Home, Pixel Launcher) to flush stale SQLite bitmap caches for `com.chordex.app.MainActivity` without breaking user desktop shortcuts or requiring activity aliases.
- Canonical Launcher Icon Synchronization Pipeline: Extended `scripts/sync-launcher-icons.mjs` to automatically mirror all 15 density mipmaps and master Livex assets directly to secondary Capacitor directories (`resources/` and `apps/studio-android/resources/`), eliminating source drift.
- CI Preflight Launcher Icon Quality Gate: Integrated `pnpm check:icons` directly into Preflight Job 1 of `.github/workflows/release.yml` to enforce launcher icon dimension and file integrity before initiating release builds.
- Capacitor Cordova Build Configuration Guard: Safely guarded `cordova.variables.gradle` inclusion in `capacitor.build.gradle` to ensure clean local and CI Gradle builds.
