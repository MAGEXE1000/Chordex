# Version 4.5.80

Release Date: 2026-09-09

### Fixed

- Android Launcher Icon Cache Invalidation via Activity-Alias: Implemented MainActivityLivex activity alias with component rotation to bypass persistent OEM launcher icon caching (Samsung One UI, Pixel Launcher, etc.), forcing Android launchers to invalidate cached legacy icons and load the new metallic Livex logo fresh from the APK.
- Adaptive Icon Monochrome Material You Theming: Added monochrome drawable bindings to ic_launcher.xml and ic_launcher_round.xml in mipmap-anydpi-v26 for Android 13+ themed icon support.
- Runtime Component Assurance: Added ensureLauncherAliasActive() in MainActivity.kt to programmatically confirm that the new launcher alias component is in an enabled state.
