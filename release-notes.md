# Version 4.5.72

Release Date: 2026-09-06

### Added

- Drumex 3-State Exclusive Audio Volume Mode: Introduced a 3-state volume controller (Normal -> Exclusive -> Mute -> Normal) accessible via a compact morphing dock in the bottom navigation area, supporting hardware volume key interception and background audio management.
- Direct BPM Input with Viewport Stability: Native Android soft keyboard integration with clamped [40, 280] range, enterKeyHint="done", and zero layout reflow via adjustNothing window mode.

### Fixed & Improved

- Chordex Library Android Vertical Touch Scrolling: Resolved vertical scrolling lockout across the entire Chordex Library page on Android. Enclosed LibraryMainView in a canonical flex container and configured its scroll container with hardware-accelerated momentum touch scrolling, overscroll containment, and explicit pan-y touch action.
- Android Motion Transition Containment: Enforced strict flex column layout on StudioPageTransition wrappers in LibraryPanel, preventing block-flow height expansion and ancestor viewport clipping.
- Touch Action Alignment Across Views: Standardized min-h-0, touch-action pan-y, and overscroll-behavior-y contain across CategoryScreenView and LibraryChordDetail, while assigning pan-x pan-y to horizontal carousels to eliminate gesture conflicts.
