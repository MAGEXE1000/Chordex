# Version 4.5.77

Release Date: 2026-09-08

### Added

- Livex Brand Reveal Launch Animation: Engineered a genuine brand-building intro sequence where the Livex mark is physically constructed from its two organic geometric shapes (ascending stem petal and converging wing petal) with staggered cubic-bezier interpolation ([0.16, 1, 0.3, 1]), luminous ambient white bloom, authoritative settle hold, and seamless dissolve into the pre-mounted Hub DOM.

### Fixed

- Android Adaptive Launcher Icon Safe-Zone Compliance: Replaced all launcher icon density mipmaps (mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi) ensuring the mark is strictly contained within the 66dp safe zone on a 108dp canvas with pure AMOLED black (#000000) background. Completely eliminated the legacy double-squircle clipping defect in round icons and added transparent corner margins to legacy squircle badges.
- AndroidManifest Activity Icon Bindings: Explicitly bound android:icon and android:roundIcon attributes to MainActivity in AndroidManifest.xml to prevent OEM launcher caching fallbacks to stale application icons.
