# Version 4.5.70

Release Date: 2026-09-06

### Fixed & Improved

- Drumex Metronome True AMOLED Mode: Pure black (#000000) and elevated (#0a0a0c) surfaces across Beat Tracker, BPM Hero card, rhythm metrics, audio controls, floating dock, preset drawer, and all configuration modals.
- Dynamic Preset Identity Tracking: Active preset selection immediately clears (activePresetId: null) when any defining parameter (BPM, time signature, subdivision, sound, accent, count-in, tempo ramp) is modified, and automatically restores when parameters match the saved preset definition.
- Startup Preset Isolation: Clean default startup state on application restart with activePresetId: null while keeping saved presets library fully persistent.
- Android Media Player Notification Metadata: Track title displays active preset name when a preset is active, or "Drumex Metronome" as fallback, with secondary metadata displaying BPM and time signature.
- Android Media Notification Artwork Scaling: Reduced badge content scale to a compact 220x220 inner card centered on 512x512 canvas with generous black margins, preventing SystemUI notification shade crowding and control clipping.
