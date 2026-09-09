# Version 4.5.76

Release Date: 2026-09-08

### Added

- Livex Branding & Adaptive Android Launcher: Updated application launcher icons across all density buckets (mdpi to xxxhdpi) and startup animation to the approved 2026 Livex visual identity.

### Fixed

- Firebase Firestore Persistence Modernization: Migrated deprecated enableMultiTabIndexedDbPersistence to FirestoreSettings.localCache with persistentLocalCache and persistentMultipleTabManager, eliminating startup deprecation warnings while maintaining multi-tab persistence.
- Vocalex Monitor Scale, Layout Rhythm & Typography: Calibrated pitch monitor scale and vertical composition rhythm to eliminate viewport clipping, and harmonized Preferences typography hierarchy.
- Drumex Pattern Card Typography: Restored compact pattern card title typography hierarchy and visual weight alignment across pattern library views.
- Startup Regression Verification: Restored studio-intro-done event dispatching and listener alignment in App.tsx, ensuring automated regression suites validate cleanly.
