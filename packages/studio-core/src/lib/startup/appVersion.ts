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

export const NATIVE_VERSION = '4.5.82';
export const NATIVE_VERSION_CODE = 40582;
export const WEB_VERSION = '4.5.82';
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
export const APP_COMMIT_SHA = '2733b7a9';

/**
 * Unix epoch timestamp this build was generated.
 * Stamped by `scripts/sync-versions.mjs` on build.
 */
export const APP_BUILD_TIMESTAMP = '9/9/2026, 1:29:00 PM CST';

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
      'Three-State Startup Animation Engine: Engineered an appearance-aware launch sequence in `LaunchAnimationEngine.tsx` that dynamically adapts canvas background and branding elements across Light (`#ffffff`), Dark (`#141418`), and AMOLED (`#000000`) appearance modes.',
    ],
  },
  {
    heading: 'Improved',
    items: [
      'Adaptive Livex Logo & Luminous Atmosphere: Implemented high-contrast dark Livex mark styling (`brightness(0)` at `0.90` opacity) with preserved specular sheen sweep in Light mode; calibrated subtle ambient bloom across all appearance states.',
    ],
  },
  {
    heading: 'Fixed',
    items: [
      'Startup Background Flash Elimination: Removed hardcoded `#000000` canvas background from launch animation; synchronized frame-0 early boot CSS tokens (`html.dark`, `html.amoled`, `html.light`) and Android Day theme `styles.xml` to eliminate pre-mount visual flashes.',
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
    version: '4.5.82',
    date: '2026-09-09',
    highlights: [
      'Three-State Startup Animation Engine: Engineered an appearance-aware launch sequence in `LaunchAnimationEngine.tsx` that dynamically adapts canvas background and branding elements across Light (`#ffffff`), Dark (`#141418`), and AMOLED (`#000000`) appearance modes.',
      'Adaptive Livex Logo & Luminous Atmosphere: Implemented high-contrast dark Livex mark styling (`brightness(0)` at `0.90` opacity) with preserved specular sheen sweep in Light mode; calibrated subtle ambient bloom across all appearance states.',
      'Startup Background Flash Elimination: Removed hardcoded `#000000` canvas background from launch animation; synchronized frame-0 early boot CSS tokens (`html.dark`, `html.amoled`, `html.light`) and Android Day theme `styles.xml` to eliminate pre-mount visual flashes.',
    ],
  },
  {
    version: '4.5.81',
    date: '2026-09-09',
    highlights: [
      'Canonical Android Launcher Identity & Architecture: Restored standard, single-activity launcher architecture on \\`com.chordex.app.MainActivity\\` with direct \\`MAIN\\`/\\`LAUNCHER\\` intent filters, completely eliminating the experimental \\`MainActivityLivex\\` activity alias and runtime component toggles.',
      'Automated Launcher Icon Synchronization Pipeline: Built and integrated \\`scripts/sync-launcher-icons.mjs\\` (\\`pnpm sync:icons\\` / \\`pnpm check:icons\\`) to automatically derive all 15 Android density mipmaps and public Web/PWA assets with 66dp centered safe zones inside a 108dp adaptive canvas directly from canonical master assets.',
    ],
  },
  {
    version: '4.5.80',
    date: '2026-09-09',
    highlights: [
      'Android Launcher Icon Cache Invalidation via Activity-Alias: Implemented MainActivityLivex activity alias with component rotation to bypass persistent OEM launcher icon caching (Samsung One UI, Pixel Launcher, etc.), forcing Android launchers to invalidate cached legacy icons and load the new metallic Livex logo fresh from the APK.',
      'Adaptive Icon Monochrome Material You Theming: Added monochrome drawable bindings to ic_launcher.xml and ic_launcher_round.xml in mipmap-anydpi-v26 for Android 13+ themed icon support.',
      'Runtime Component Assurance: Added ensureLauncherAliasActive() in MainActivity.kt to programmatically confirm that the new launcher alias component is in an enabled state.',
    ],
  },
  {
    version: '4.5.79',
    date: '2026-09-08',
    highlights: [
      'Android Display Luminance & Contrast Restoration: Resolved the mobile display dimming problem by restoring canonical zinc text tokens (`--c-text-primary: #fafafa`, `--c-text-secondary: #a1a1aa`, `--c-text-muted: #71717a`) and registering matching `@property` initial values in `tokens.css`.',
      'AMOLED Surface Contrast & Hierarchy: Elevated AMOLED surface and card background tokens above pure black (`--app-surface-low: #08080a`, `--app-surface: #101014`, `--app-surface-high: #16161c`, `--hub-card-bg: rgba(255, 255, 255, 0.04)`) while preserving pure `#000000` AMOLED panel shutoff, eliminating viewport black crush.',
      'Early-Boot Inline Style Cleanup: Synchronized early boot head scripts in `apps/studio-android/index.html` and `apps/studio-web/index.html` with explicit text tokens and high-contrast surfaces, and added automatic inline style flushing in `themeEngine.ts`.',
      'WebView Native Hardware Layer: Removed experimental offscreen Compose `layerBackdrop` wrapping in `MainActivity.kt`, restoring direct hardware layer rendering with native black window background.',
      'Component Text Hierarchy & Navigation Contrast: Defined `--c-text-tertiary: var(--c-text-muted)` across the design token system and updated navigation icon/label colors to `var(--c-text-secondary)` for WCAG AA compliance.',
    ],
  },
  {
    version: '4.5.78',
    date: '2026-09-08',
    highlights: [
      'Complex Motion Brand Reveal Animation: Overhauled LaunchAnimationEngine into a fluid 6-phase brand reveal sequence featuring 65° diagonal anticipation glow, non-linear petal trajectories (Form 1 ascending stem and Form 2 curved wing swoop), seam union lock-in micro-settle impulse, specular sheen ribbon sweep masked strictly to the emblem, and a serene breathing hold before dissolving into the pre-mounted Hub.',
      'High-Contrast Launcher Icon Mipmaps: Completely regenerated Android launcher density assets (mdpi through xxxhdpi) using an optimized tone curve that lifts deep petal shadows from RGB 21 to ~75 RGB and midtones to 215 RGB, eliminating the dark silhouette/murky appearance against pure AMOLED black backgrounds and resolving perceived launcher icon caching issues.',
      'Round Icon Squircle Elimination: Replaced round launcher mipmap assets with seamless AMOLED black circles with anti-aliased perimeter, eliminating the legacy nested squircle boundary defect.',
    ],
  },
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
