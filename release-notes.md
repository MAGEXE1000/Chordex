# Version 4.5.79

Release Date: 2026-09-08

### Fixed

- Android Display Luminance & Contrast Restoration: Resolved the mobile display dimming problem by restoring canonical zinc text tokens (`--c-text-primary: #fafafa`, `--c-text-secondary: #a1a1aa`, `--c-text-muted: #71717a`) and registering matching `@property` initial values in `tokens.css`.
- AMOLED Surface Contrast & Hierarchy: Elevated AMOLED surface and card background tokens above pure black (`--app-surface-low: #08080a`, `--app-surface: #101014`, `--app-surface-high: #16161c`, `--hub-card-bg: rgba(255, 255, 255, 0.04)`) while preserving pure `#000000` AMOLED panel shutoff, eliminating viewport black crush.
- Early-Boot Inline Style Cleanup: Synchronized early boot head scripts in `apps/studio-android/index.html` and `apps/studio-web/index.html` with explicit text tokens and high-contrast surfaces, and added automatic inline style flushing in `themeEngine.ts`.
- WebView Native Hardware Layer: Removed experimental offscreen Compose `layerBackdrop` wrapping in `MainActivity.kt`, restoring direct hardware layer rendering with native black window background.
- Component Text Hierarchy & Navigation Contrast: Defined `--c-text-tertiary: var(--c-text-muted)` across the design token system and updated navigation icon/label colors to `var(--c-text-secondary)` for WCAG AA compliance.
