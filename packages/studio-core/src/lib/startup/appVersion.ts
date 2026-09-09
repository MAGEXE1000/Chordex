/**
 * Single source of truth for the Studio app version.
 *
 * Every consumer (Settings UI, Updater checker, debug tools, analytics)
 * MUST import from this module. Never hardcode a version string
 * elsewhere — duplication leads to settings showing one version while
 * the Updater system compares against another, which silently breaks
 * update notifications.
 *
 * The `public/version.json` file shipped alongside the bundle is
 * generated from `APP_VERSION` at build time by
 * `scripts/sync-versions.mjs` (wired in via the `prebuild` npm hook),
 * so the freshly-deployed bundle and its companion manifest are
 * always in lockstep.
 *
 * Bump `APP_VERSION` on every release. Bump `APP_CHANGELOG` to describe
 * what the user just received — that's the text shown in the
 * post-update modal on the first launch after the bundle is updated.
 *
 * Version format: strict semver (`MAJOR.MINOR.PATCH[-PRERELEASE]`).
 * The "Beta" label is presentation only — `APP_VERSION` itself stays
 * pure semver so comparisons are unambiguous.
 */

/**
 * Normalizes Mojibake corrupted character sequences resulting from double-encoding or Windows-1252/ANSI interpretation of UTF-8 strings.
 */
export function sanitizeUTF8String(str: string | null | undefined): string {
  if (!str) return '';
  return String(str)
    .replace(/â€¢/g, '•')
    .replace(/â€‹/g, '')
    .replace(/â€¦/g, '…')
    .replace(/â€”/g, '—')
    .replace(/â€“/g, '–')
    .replace(/â€™/g, "'")
    .replace(/â€\x9d/g, '"')
    .replace(/â€\x9c/g, '"')
    .replace(/Ã¡/g, 'á')
    .replace(/Ã©/g, 'é')
    .replace(/Ã­/g, 'í')
    .replace(/Ã³/g, 'ó')
    .replace(/Ãº/g, 'ú')
    .replace(/Ã±/g, 'ñ');
}

import React from 'react';
import { Capacitor } from '@capacitor/core';
import { logVersionTransformation } from '../updater/versionLogger';

export const NATIVE_VERSION = '4.5.77';
export const NATIVE_VERSION_CODE = 40577;
export const WEB_VERSION = '4.5.77';
const cap =
  (typeof window !== 'undefined' && (window as any).Capacitor) ||
  (typeof globalThis !== 'undefined' && (globalThis as any).Capacitor) ||
  Capacitor;
export const APP_VERSION = cap.isNativePlatform() ? NATIVE_VERSION : WEB_VERSION;

/** Optional pre-release tag rendered in the UI (e.g. "Beta", "RC"). */
export const APP_VERSION_TAG = '';

/** Human-readable label rendered in Settings → About. */
export const APP_VERSION_LABEL = APP_VERSION;

/**
 * Local date this build was stamped (e.g. "July 24, 2026").
 * Stamped by `scripts/sync-versions.mjs` on build.
 */
export const APP_VERSION_DATE = '8/12/2026';

/**
 * Git commit hash this build was generated from.
 * Stamped by `scripts/sync-versions.mjs` on build.
 */
export const APP_COMMIT_SHA = 'cdf00746';

/**
 * Unix epoch timestamp this build was generated.
 * Stamped by `scripts/sync-versions.mjs` on build.
 */
export const APP_BUILD_TIMESTAMP = '9/8/2026, 9:15:21 PM CST';

/**
 * Changelog for the CURRENT release — shown to the user the first
 * time they launch the app after pulling this bundle, and from the
 * Settings → About → Changelog row at any time. Each section is a
 * heading + bullet list rendered Metrolist-style in `ChangelogSheet`.
 */
export interface ChangelogSection {
  /** Short uppercase header (e.g. "What's new", "Fixes"). */
  heading: string;
  /** Plain user-facing bullets. Keep each line short. */
  items: string[];
}

export const APP_CHANGELOG_SECTIONS: ChangelogSection[] = [
  {
    heading: 'Added',
    items: [
      'Livex Brand Reveal Launch Animation: Engineered a genuine brand-building intro sequence where the Livex mark is physically constructed from its two organic geometric shapes (ascending stem petal and converging wing petal) with staggered cubic-bezier interpolation ([0.16, 1, 0.3, 1]), luminous ambient white bloom, authoritative settle hold, and seamless dissolve into the pre-mounted Hub DOM.',
    ],
  },
  {
    heading: 'Fixed',
    items: [
      'Android Adaptive Launcher Icon Safe-Zone Compliance: Replaced all launcher icon density mipmaps (mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi) ensuring the mark is strictly contained within the 66dp safe zone on a 108dp canvas with pure AMOLED black (#000000) background. Completely eliminated the legacy double-squircle clipping defect in round icons and added transparent corner margins to legacy squircle badges.',
      'AndroidManifest Activity Icon Bindings: Explicitly bound android:icon and android:roundIcon attributes to MainActivity in AndroidManifest.xml to prevent OEM launcher caching fallbacks to stale application icons.',
    ],
  },
];

export interface ReleaseHistoryItem {
  version: string;
  date: string;
  highlights: string[];
}

export const RELEASE_HISTORY: ReleaseHistoryItem[] = [
  {
    version: '4.5.77',
    date: '2026-09-08',
    highlights: [
      'Livex Brand Reveal Launch Animation: Engineered a genuine brand-building intro sequence where the Livex mark is physically constructed from its two organic geometric shapes (ascending stem petal and converging wing petal) with staggered cubic-bezier interpolation ([0.16, 1, 0.3, 1]), luminous ambient white bloom, authoritative settle hold, and seamless dissolve into the pre-mounted Hub DOM.',
      'Android Adaptive Launcher Icon Safe-Zone Compliance: Replaced all launcher icon density mipmaps (mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi) ensuring the mark is strictly contained within the 66dp safe zone on a 108dp canvas with pure AMOLED black (#000000) background. Completely eliminated the legacy double-squircle clipping defect in round icons and added transparent corner margins to legacy squircle badges.',
      'AndroidManifest Activity Icon Bindings: Explicitly bound android:icon and android:roundIcon attributes to MainActivity in AndroidManifest.xml to prevent OEM launcher caching fallbacks to stale application icons.',
    ],
  },
  {
    version: '4.5.76',
    date: '2026-09-08',
    highlights: [
      'Livex Branding & Adaptive Android Launcher: Updated application launcher icons across all density buckets (mdpi to xxxhdpi) and startup animation to the approved 2026 Livex visual identity.',
      'Firebase Firestore Persistence Modernization: Migrated deprecated enableMultiTabIndexedDbPersistence to FirestoreSettings.localCache with persistentLocalCache and persistentMultipleTabManager, eliminating startup deprecation warnings while maintaining multi-tab persistence.',
      'Vocalex Monitor Scale, Layout Rhythm & Typography: Calibrated pitch monitor scale and vertical composition rhythm to eliminate viewport clipping, and harmonized Preferences typography hierarchy.',
      'Drumex Pattern Card Typography: Restored compact pattern card title typography hierarchy and visual weight alignment across pattern library views.',
      'Startup Regression Verification: Restored studio-intro-done event dispatching and listener alignment in App.tsx, ensuring automated regression suites validate cleanly.',
    ],
  },
  {
    version: '4.5.75',
    date: '2026-09-08',
    highlights: [
      'Livex Visual Identity & AMOLED Logo Replacement: Upgraded app branding across all surfaces to the approved 2026 Livex logo treatment. Features pure AMOLED #000000 background integration, authentic 3D petal depth with luminous ambient white emission, and Android adaptive launcher icons with safe-zone compliance (66dp within 108dp canvas) across all density buckets (mdpi to xxxhdpi) to prevent double-squircle clipping on OEM launchers.',
      'Universal Soft-Pill Design System: Standardized soft-pill visual system and ambient elevations across all Livex apps (Chordex, Drumex, Stagex, Groovex, and Vocalex).',
      'Vocalex Vertical Rhythm & Centered Composition: Refined Vocal Monitor layout composition to match Stitch reference, balancing upper metadata, central pitch monitor, and primary action controls within the active viewport without dead-space voids.',
    ],
  },
  {
    version: '4.5.74',
    date: '2026-09-07',
    highlights: [
      'Global Heading & Header Typography Hierarchy: Restored canonical typography hierarchy across all Studio/Livex applications (Studio Hub, Chordex, Drumex, Stagex, Groovex, Vocalex, and Preferences) ensuring consistent weight, tracking, and line-height scaling across mobile viewports.',
      'Vocalex Vertical Rhythm, Viewport Elevation & Header Composition: Eliminated stacked bottom clearance voids (saving >100px of dead space) and competing nested scroll containers. Reordered CoachPanel with compact top pill switcher, followed by context-aware StudioHeader with zero collision or title duplication. Elevated main pitch monitor card and action controls, guaranteeing full viewport visibility without scrolling.',
    ],
  },
  {
    version: '4.5.73',
    date: '2026-09-07',
    highlights: [
      'Vocalex In-Project Recording Studio: Integrated empty-project recording workspace directly inside TakeDetailView. Creating a new take initializes an empty project with durationMs 0 and opens its detail workspace equipped with a real-time 48-band frequency visualizer, count-in countdown respecting user preferences, active timer, stop action, and live hardware DSP status badges (48kHz Lossless, Noise Filter, Auto Gain).',
      'Vocalex Take Project Management & Re-recording: Added in-project re-recording support and inline project title renaming with automatic persistence to vocalexRepository.',
      'Vocalex Take List Ready Badge: Empty takes in the takes list render a dedicated microphone icon and "READY TO RECORD" badge, guiding users directly into recording without zero-duration errors.',
      'Standalone Vocalex Recorder Section Removed: Streamlined Vocalex top-level navigation to three focused, canonical sections: Coach, Takes, and Preferences. Deprecated and removed all standalone recorder references across navigation registries, search index, session state stores, app dock, and preferences panel.',
    ],
  },
  {
    version: '4.5.72',
    date: '2026-09-06',
    highlights: [
      'Drumex 3-State Exclusive Audio Volume Mode: Introduced a 3-state volume controller (Normal -> Exclusive -> Mute -> Normal) accessible via a compact morphing dock in the bottom navigation area, supporting hardware volume key interception and background audio management.',
      'Direct BPM Input with Viewport Stability: Native Android soft keyboard integration with clamped [40, 280] range, enterKeyHint="done", and zero layout reflow via adjustNothing window mode.',
      'Chordex Library Android Vertical Touch Scrolling: Resolved vertical scrolling lockout across the entire Chordex Library page on Android. Enclosed LibraryMainView in a canonical flex container and configured its scroll container with hardware-accelerated momentum touch scrolling, overscroll containment, and explicit pan-y touch action.',
      'Android Motion Transition Containment: Enforced strict flex column layout on StudioPageTransition wrappers in LibraryPanel, preventing block-flow height expansion and ancestor viewport clipping.',
      'Touch Action Alignment Across Views: Standardized min-h-0, touch-action pan-y, and overscroll-behavior-y contain across CategoryScreenView and LibraryChordDetail, while assigning pan-x pan-y to horizontal carousels to eliminate gesture conflicts.',
    ],
  },
  {
    version: '4.5.71',
    date: '2026-09-06',
    highlights: [
      'Drumex Metronome Direct BPM Entry: Tapping the giant BPM hero display transitions into an inline editable numeric input state with the native Android keyboard (`inputMode="numeric"`, `pattern="[0-9]*"`), automatic text selection, integer validation clamped strictly to 40-280 BPM, commit on Enter / "Set BPM", and clean cancellation on Escape / "Cancel" / empty input / Android Back gesture.',
      'Multi-Accent & Multi-Tier Beat Pattern System: Full support for multiple accented beats across any time signature (4/4, 3/4, 5/4, 7/8, 9/8, 12/8) with three distinct accent tiers: strong, accent, and normal. Tapping any beat in the visual Beat Tracker strip cycles normal -> accent -> strong -> normal.',
      'Physical AudioBuffer Waveform Synthesis for All Accent Tiers: Synthesized distinct acoustic and electronic waveforms for all 4 sound buffers (strong, accent, normal, sub) across all 13 metronome sounds, featuring tuned resonant cavity frequencies, transient noise bursts, and distinct velocity gains.',
      'Robust Rapid Tap Tempo Engine: Eliminated the 4-tap requirement. Two taps immediately calculate an authoritative tempo, with subsequent taps refining the estimate via a recency-weighted rolling average of up to 6 intervals. Includes a 70ms touch-noise debounce (< 857 BPM) removing any artificial tempo ceiling up to canonical 280 BPM, and automatic sequence reset after a > 2000ms pause.',
      'Beat Tracker Summary Badge: Real-time dynamic accent summary in the tracker strip header (e.g. 1 Strong • 2 Accent) with visual accent indicators.',
      'Tap Tempo Helper Label: Updated helper text from (Tap 4 times) to (Tap to set tempo).',
    ],
  },
  {
    version: '4.5.70',
    date: '2026-09-06',
    highlights: [
      'Drumex Metronome True AMOLED Mode: Pure black (#000000) and elevated (#0a0a0c) surfaces across Beat Tracker, BPM Hero card, rhythm metrics, audio controls, floating dock, preset drawer, and all configuration modals.',
      'Dynamic Preset Identity Tracking: Active preset selection immediately clears (activePresetId: null) when any defining parameter (BPM, time signature, subdivision, sound, accent, count-in, tempo ramp) is modified, and automatically restores when parameters match the saved preset definition.',
      'Startup Preset Isolation: Clean default startup state on application restart with activePresetId: null while keeping saved presets library fully persistent.',
      'Android Media Player Notification Metadata: Track title displays active preset name when a preset is active, or "Drumex Metronome" as fallback, with secondary metadata displaying BPM and time signature.',
      'Android Media Notification Artwork Scaling: Reduced badge content scale to a compact 220x220 inner card centered on 512x512 canvas with generous black margins, preventing SystemUI notification shade crowding and control clipping.',
    ],
  },
  {
    version: '4.5.69',
    date: '2026-09-06',
    highlights: [
      'Restored GrooveX Vinyl Turntable Audio Feedback: Restored authentic vinyl turntable scratch and platter brake audio feedback on pause and resume, operating via an independent dedicated turntableBus connected to masterGain without modifying stem playback rates.',
      'Pre-Synthesized Analytical Turntable AudioBuffers: Mathematically pre-synthesized 520ms vinyl platter deceleration stop and 260ms needle cue direct-drive spin-up AudioBuffers with anti-click zero-crossing envelopes, zero network latency, and zero decoding overhead.',
      'Drumex Metronome User-First Presets: Replaced factory presets with an intentional "MY PRESETS" empty state and full CRUD workflow (create, in-place edit, duplicate with unique copy names, rename, delete).',
      'Dual-Mode Incremental Tempo Progression: Implemented deterministic tempo progression engine supporting both By Bars (evaluated strictly at bar boundaries) and By Time (on the monotonic Web Audio clock) with live summary cards.',
      'Synchronized Visual Count-In Countdown: Added floating 4-3-2-1 countdown overlay locked to Web Audio beat schedule events, unmounting cleanly at the exact instant performance begins.',
      'Transposition & Stem Synchronization Preservation: All stem buffer sources remain locked to an invariant 1.0000x playback rate, guaranteeing 100% time and tempo preservation across -12 to +12 semitones with zero cumulative drift and bit-exact drum alignment.',
    ],
  },
  {
    version: '4.5.68',
    date: '2026-09-06',
    highlights: [
      'Studio/Livex Android System Updater Redesign: Implemented the new flagship Android updater dialog matching the approved design system specifications with 400px width constraint, rounded-28 perimeter, micro scrollbar, and hardware-accelerated CSS state morphing transitions.',
      'Tactile Interaction & Visual Indicators: Added tactile button feedback (.livex-tap-press scale down on active touch), continuous scanning beam animations for package verification, and real-time download metrics (transferred MB, speed, ETA).',
      'Full Theme Parity: Engineered pixel-perfect support for Light (#ffffff / #f8fafc), Dark (#0c0d10 / #16171b), and AMOLED (true #000000 / #08080a) themes with canonical surface blur tokens.',
      'Categorized Release Notes Engine: Release changelogs are dynamically classified into distinct, color-coded badges (NEW in emerald, AUDIO ENGINE in blue, FIXED & IMPROVED in amber) with automatic fallback for single-version manifests.',
      'End-to-End Pipeline Wiring: Connected real-time download progress events, graceful download cancellation, cryptographic SHA-256 verification, and native Android PackageInstaller handoff.',
    ],
  },
];

/** Native English version of the current changelog for Android. */
export const APP_CHANGELOG_SECTIONS_NATIVE: ChangelogSection[] = [
  {
    heading: 'Added',
    items: [
      'Chordex Library Bento Redesign: Completely overhauled the Chordex Library section with a modern Bento card layout and ambient glowing accents.',
      'Dynamic Mini Fretboard Recesses: Introduced high-fidelity 6-string dynamic fretboard recess components with realistic gauge lines and glowing finger dots.',
      'Interactive Chord Preview Section: Integrated rich multi-instrument visualizers supporting instant toggles across Guitar, Bass, and Piano.',
      'Harmonic Categories Grid: Expanded category browser to 31 distinct harmonic flavors with signature 3-string mini recesses.',
      'Universal Theme Parity: Full adaptive styling across Dark, Light, and AMOLED modes.',
    ],
  },
];

/** Spanish version of the current changelog — picked at render time
 *  by `ChangelogSheet` based on `settings.language`. */
export const APP_CHANGELOG_SECTIONS_ES: ChangelogSection[] = [
  {
    heading: 'Añadido',
    items: [
      'Rediseño Bento de la Biblioteca Chordex: Renovación completa de la biblioteca con diseño Bento moderno, acentos luminosos y experiencia adaptable.',
      'Cavidades dinámicas de diapasón: Nuevos componentes dinámicos de 6 cuerdas con líneas realistas de calibre y puntos guía luminosos.',
      'Visualizador interactivo de acordes: Visualizadores multi-instrumento para Guitarra, Bajo y Piano con reproducción de audio y acordes sugeridos.',
      'Cuadrícula de categorías armónicas: 31 estilos armónicos con mini cavidades de 3 cuerdas y filtros rápidos por nota fundamental.',
      'Paridad universal de temas: Adaptación visual completa en modos Oscuro, Claro y AMOLED.',
    ],
  },
];

/** German version of the current changelog. */
export const APP_CHANGELOG_SECTIONS_DE: ChangelogSection[] = [
  {
    heading: 'Hinzugefügt',
    items: [
      'Chordex Bibliothek Bento-Neugestaltung: Vollständige Überarbeitung mit modernem Bento-Kartenlayout und responsiver Ansicht.',
      'Dynamische Mini-Griffbrett-Aussparungen: Hochpräzise 6-Saiten-Griffbrettkomponenten mit Bundlinien und leuchtenden Griffpunkten.',
      'Interaktive Akkord-Vorschau: Multi-Instrument-Visualisierungen für Gitarre, Bass und Klavier mit Audio-Wiedergabe.',
      'Harmonisches Kategoriengitter: Erweiterte Kategorieübersicht mit 31 harmonischen Varianten.',
      'Universelle Theme-Parität: Vollständige visuelle Anpassung für Dark-, Light- und AMOLED-Modi.',
    ],
  },
];

/** Returns the changelog sections for the requested language, falling
 *  back to English when no localized version is available. */
export function getChangelogSections(lang: string | undefined | null): ChangelogSection[] {
  if (lang === 'es' && APP_CHANGELOG_SECTIONS_ES && APP_CHANGELOG_SECTIONS_ES.length > 0)
    return APP_CHANGELOG_SECTIONS_ES;
  if (lang === 'de' && APP_CHANGELOG_SECTIONS_DE && APP_CHANGELOG_SECTIONS_DE.length > 0)
    return APP_CHANGELOG_SECTIONS_DE;
  return APP_CHANGELOG_SECTIONS;
}

/** Backwards-compatible flat bullet list (kept so any old caller still
 *  works). New UI should use `APP_CHANGELOG_SECTIONS`. */
export const APP_CHANGELOG = APP_CHANGELOG_SECTIONS.flatMap((s) => s.items);

/**
 * Parsed semver shape. Build metadata (everything after `+`) is
 * discarded — semver §10 says it has no precedence — but pre-release
 * identifiers are preserved so they can be compared per §11.
 */
interface ParsedSemver {
  major: number;
  minor: number;
  patch: number;
  /** `null` for a release, e.g. "3.0.0". String for a prerelease, e.g. "beta.2". */
  prerelease: string | null;
}

/**
 * STRICT semver parser. Rejects leading zeros, missing parts, and
 * malformed input. Accepts a leading `v` (common in tag names) and
 * strips any `+build` metadata. Returns `null` on any parse failure
 * so callers can treat un-parseable input as "no comparison possible".
 *
 * Examples:
 *   "3.0.0"      → { 3, 0, 0, null }
 *   "v3.0.0"     → { 3, 0, 0, null }
 *   "3.0.0-beta" → { 3, 0, 0, "beta" }
 *   "3.0.0+abc"  → { 3, 0, 0, null }   (build metadata stripped)
 *   "01.2.3"     → null                 (leading zero)
 *   "3"          → null                 (incomplete)
 *   "3.0"        → null                 (incomplete)
 *   "garbage"    → null
 */
export function parseAndNormalizeVersion(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== 'string') {
    logVersionTransformation('parseAndNormalizeVersion', raw, null);
    return null;
  }
  const match = raw.match(
    /[vV]?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?/
  );
  if (!match) {
    logVersionTransformation('parseAndNormalizeVersion', raw, null);
    return null;
  }
  let clean = match[0];
  if (clean.startsWith('v') || clean.startsWith('V')) {
    clean = clean.slice(1);
  }
  logVersionTransformation('parseAndNormalizeVersion', raw, clean);
  return clean;
}

export function parseSemver(raw: string | null | undefined): ParsedSemver | null {
  const clean = parseAndNormalizeVersion(raw);
  if (!clean) {
    logVersionTransformation('parseSemver', raw, null);
    return null;
  }

  const m = clean.match(
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/
  );
  if (!m) {
    logVersionTransformation('parseSemver', raw, null);
    return null;
  }
  // Per semver §9: a pre-release numeric identifier MUST NOT include
  // leading zeros. Reject e.g. "1.2.3-01" or "1.2.3-alpha.001".
  if (m[4]) {
    for (const id of m[4].split('.')) {
      if (/^\d+$/.test(id) && id.length > 1 && id.startsWith('0')) {
        logVersionTransformation('parseSemver', raw, null);
        return null;
      }
    }
  }
  const resultObj = {
    major: Number(m[1]),
    minor: Number(m[2]),
    patch: Number(m[3]),
    prerelease: m[4] ?? null,
  };
  logVersionTransformation('parseSemver', raw, JSON.stringify(resultObj));
  return resultObj;
}

/**
 * Convenience: returns just the [major, minor, patch] tuple, or `null`.
 * Pre-release info is dropped — callers that care about prerelease
 * precedence should use `parseSemver` + `compareSemver` directly.
 */
export function normalizeSemver(raw: string | null | undefined): [number, number, number] | null {
  const p = parseSemver(raw);
  const resultObj = p ? ([p.major, p.minor, p.patch] as [number, number, number]) : null;
  logVersionTransformation('normalizeSemver', raw, resultObj ? JSON.stringify(resultObj) : null);
  return resultObj;
}

/**
 * Compare two semver strings. Returns -1 / 0 / +1 like Array.sort.
 * Returns 0 if either side fails to parse — i.e. an un-parseable
 * remote version is treated as "no update", never as a downgrade.
 *
 * Pre-release precedence per semver §11:
 *   - A version WITHOUT prerelease has HIGHER precedence than one WITH.
 *     ("3.0.0" > "3.0.0-beta" — the release supersedes the beta.)
 *   - Two prereleases compare identifier-by-identifier:
 *     numeric vs numeric → numeric;
 *     numeric vs alphanumeric → numeric is lower;
 *     alphanumeric vs alphanumeric → ASCII;
 *     fewer fields → lower precedence (when all prior fields equal).
 */
export function compareSemver(a: string, b: string): -1 | 0 | 1 {
  const pa = parseSemver(a);
  const pb = parseSemver(b);
  if (!pa || !pb) {
    logVersionTransformation('compareSemver', `${a} vs ${b}`, '0 (unparseable)');
    return 0;
  }
  let res: -1 | 0 | 1 = 0;
  if (pa.major !== pb.major) {
    res = pa.major > pb.major ? 1 : -1;
  } else if (pa.minor !== pb.minor) {
    res = pa.minor > pb.minor ? 1 : -1;
  } else if (pa.patch !== pb.patch) {
    res = pa.patch > pb.patch ? 1 : -1;
  } else if (pa.prerelease === null && pb.prerelease === null) {
    res = 0;
  } else if (pa.prerelease === null) {
    res = 1; // release > prerelease
  } else if (pb.prerelease === null) {
    res = -1;
  } else {
    res = comparePrerelease(pa.prerelease, pb.prerelease);
  }
  logVersionTransformation('compareSemver', `${a} vs ${b}`, String(res));
  return res;
}

function comparePrerelease(a: string, b: string): -1 | 0 | 1 {
  const ai = a.split('.');
  const bi = b.split('.');
  const len = Math.max(ai.length, bi.length);
  for (let i = 0; i < len; i++) {
    const xa = ai[i];
    const xb = bi[i];
    // Fewer fields = lower precedence (semver §11.4.4).
    if (xa === undefined) return -1;
    if (xb === undefined) return 1;
    const na = /^\d+$/.test(xa) ? Number(xa) : null;
    const nb = /^\d+$/.test(xb) ? Number(xb) : null;
    if (na !== null && nb !== null) {
      if (na !== nb) return na > nb ? 1 : -1;
    } else if (na !== null) {
      return -1; // numeric identifier always < alphanumeric
    } else if (nb !== null) {
      return 1;
    } else {
      if (xa !== xb) return xa > xb ? 1 : -1;
    }
  }
  return 0;
}

/**
 * React hook returning the current app version. Memoised because the
 * version is constant for the lifetime of the page — we never want a
 * re-render to look like "the version changed".
 */
export function useAppVersion(): {
  version: string;
  label: string;
  tag: string;
  date: string;
  changelog: string[];
  sections: ChangelogSection[];
} {
  return React.useMemo(
    () => ({
      version: APP_VERSION,
      label: APP_VERSION_LABEL,
      tag: APP_VERSION_TAG,
      date: APP_VERSION_DATE,
      changelog: APP_CHANGELOG,
      sections: APP_CHANGELOG_SECTIONS,
    }),
    []
  );
}

/** Authoritative expected production signing certificate SHA-256 fingerprint. */
export const PRODUCTION_SIGNING_SHA256 =
  (typeof process !== 'undefined' && process.env?.EXPECTED_SIGNATURE_SHA256) ||
  '900cf259185c81100cda8bb08571fa23552e9789131cf07a8f4056e4d4129206';
