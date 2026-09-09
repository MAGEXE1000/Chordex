# Version 4.5.81

Release Date: 2026-09-09

### Fixed

- Canonical Android Launcher Identity & Architecture: Restored standard, single-activity launcher architecture on \`com.chordex.app.MainActivity\` with direct \`MAIN\`/\`LAUNCHER\` intent filters, completely eliminating the experimental \`MainActivityLivex\` activity alias and runtime component toggles.
- Automated Launcher Icon Synchronization Pipeline: Built and integrated \`scripts/sync-launcher-icons.mjs\` (\`pnpm sync:icons\` / \`pnpm check:icons\`) to automatically derive all 15 Android density mipmaps and public Web/PWA assets with 66dp centered safe zones inside a 108dp adaptive canvas directly from canonical master assets.
