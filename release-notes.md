# Version 4.5.73

Release Date: 2026-09-07

### Added

- Vocalex In-Project Recording Studio: Integrated empty-project recording workspace directly inside TakeDetailView. Creating a new take initializes an empty project with durationMs 0 and opens its detail workspace equipped with a real-time 48-band frequency visualizer, count-in countdown respecting user preferences, active timer, stop action, and live hardware DSP status badges (48kHz Lossless, Noise Filter, Auto Gain).
- Vocalex Take Project Management & Re-recording: Added in-project re-recording support and inline project title renaming with automatic persistence to vocalexRepository.
- Vocalex Take List Ready Badge: Empty takes in the takes list render a dedicated microphone icon and "READY TO RECORD" badge, guiding users directly into recording without zero-duration errors.

### Removed & Streamlined

- Standalone Vocalex Recorder Section Removed: Streamlined Vocalex top-level navigation to three focused, canonical sections: Coach, Takes, and Preferences. Deprecated and removed all standalone recorder references across navigation registries, search index, session state stores, app dock, and preferences panel.
