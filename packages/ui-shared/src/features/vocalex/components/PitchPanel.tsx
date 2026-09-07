import { useT, createAudioContext, useSettingsStore, resolveAccent } from '@workspace/studio-core';
import { Capacitor } from '@capacitor/core';
import { useState, useRef, useEffect, useCallback } from 'react';
import { detectPitch, type PitchResult } from '../services/pitchYin';

const HISTORY_LEN = 24;
const SMOOTHING = 0.3;
const SOLFEGE_NAMES = [
  'Do',
  'Do#',
  'Re',
  'Re#',
  'Mi',
  'Fa',
  'Fa#',
  'Sol',
  'Sol#',
  'La',
  'La#',
  'Si',
];

function centsToColor(cents: number, tolerance: number = 5): string {
  const abs = Math.abs(cents);
  if (abs <= tolerance) return '#10b981';
  if (abs <= tolerance * 2.5) return '#f59e0b';
  return '#ef4444';
}

function centsToLabel(
  cents: number,
  labels: { inTune?: string; close?: string; offKey?: string },
  tolerance: number = 5
): string {
  const abs = Math.abs(cents);
  if (abs <= tolerance) return labels.inTune || 'IN TUNE';
  if (abs <= tolerance * 2.5) return labels.close || 'CLOSE';
  return labels.offKey || 'OFF KEY';
}

function centsToNeedleRotation(cents: number): number {
  return Math.max(-50, Math.min(50, cents)) * 1.6;
}

export default function PitchPanel({ active: panelActive = true }: { active?: boolean }) {
  const t = useT();
  const settings = useSettingsStore((s) => s.settings);
  const language = settings.language;
  const accent = resolveAccent(settings.accentColor);
  const activeVis = settings.perApp?.vocalex ?? { theme: 'dark', amoledMode: false };
  const isLight =
    activeVis.theme === 'light' ||
    (activeVis.theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: light)').matches);
  const [listening, setListening] = useState(false);
  const [result, setResult] = useState<PitchResult | null>(null);
  const [history, setHistory] = useState<PitchResult[]>([]);
  const [permError, setPermError] = useState<string | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const smoothedFreqRef = useRef<number>(0);
  const activeRef = useRef<boolean>(panelActive);
  const startingRef = useRef<boolean>(false);
  const wasListeningBeforeBackground = useRef<boolean>(false);

  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const detectLoop = useCallback(() => {
    const analyser = analyserRef.current;
    const ctx = audioCtxRef.current;
    if (!analyser || !ctx) return;

    const buf = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(buf);

    let maxAmp = 0;
    for (let i = 0; i < buf.length; i++) {
      const a = Math.abs(buf[i]);
      if (a > maxAmp) maxAmp = a;
    }

    if (maxAmp < 0.01) {
      setResult(null);
      rafRef.current = requestAnimationFrame(detectLoop);
      return;
    }

    const s = settingsRef.current;
    const sensitivity = s.vocalexSensitivity ?? 'normal';
    const smoothing = sensitivity === 'smooth' ? 0.15 : sensitivity === 'fast' ? 0.55 : 0.3;
    const clarityThresh = sensitivity === 'smooth' ? 0.85 : sensitivity === 'fast' ? 0.7 : 0.8;
    const refPitch = s.vocalexReferencePitch ?? 440;

    const raw = detectPitch(buf, ctx.sampleRate, clarityThresh);
    if (raw) {
      if (smoothedFreqRef.current === 0) {
        smoothedFreqRef.current = raw.frequency;
      } else {
        smoothedFreqRef.current =
          smoothing * raw.frequency + (1 - smoothing) * smoothedFreqRef.current;
      }
      const smoothed = { ...raw };
      smoothed.frequency = smoothedFreqRef.current;
      const midiNote = 12 * Math.log2(smoothed.frequency / refPitch) + 69;
      const roundedMidi = Math.round(midiNote);
      smoothed.cents = (midiNote - roundedMidi) * 100;
      smoothed.midiNote = roundedMidi;

      setResult(smoothed);
      setHistory((prev) => {
        const next = [...prev, smoothed];
        return next.length > HISTORY_LEN * 3 ? next.slice(-HISTORY_LEN * 2) : next;
      });
    } else {
      setResult(null);
    }
    rafRef.current = requestAnimationFrame(detectLoop);
  }, []);

  const startListening = useCallback(async () => {
    if (audioCtxRef.current || startingRef.current) return;
    startingRef.current = true;
    try {
      setPermError(null);

      // Check and request native permission if running on Capacitor (Android/iOS)
      if (Capacitor.isNativePlatform()) {
        const { AppInstaller } = await import('@workspace/studio-core');
        const check = await AppInstaller.checkPermissions();
        if (check.microphone !== 'granted') {
          const req = await AppInstaller.requestPermissions({ aliases: ['microphone'] });
          if (req.microphone !== 'granted') {
            throw new Error('microphone_permission_denied');
          }
        }
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Microphone API is not supported in this browser context.');
      }
      const noiseSuppression = settingsRef.current.vocalexNoiseSuppression ?? false;
      const autoGainControl = settingsRef.current.vocalexAutoGainControl ?? false;
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: false, noiseSuppression, autoGainControl },
        });
      } catch (constraintsErr) {
        console.debug(
          '[PitchPanel] getUserMedia with constraints failed, falling back to simple audio:',
          constraintsErr
        );
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      if (!activeRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;
      const ctx = createAudioContext();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;
      setListening(true);
      smoothedFreqRef.current = 0;
      rafRef.current = requestAnimationFrame(detectLoop);
    } catch (err: unknown) {
      if (
        err instanceof Error &&
        (err.name === 'NotAllowedError' ||
          err.name === 'PermissionDeniedError' ||
          err.message === 'microphone_permission_denied')
      ) {
        console.debug('[PitchPanel] startListening: Microphone permission was denied by user.');
        setPermError('microphone_permission_denied');
      } else {
        console.debug('[PitchPanel] startListening failed:', err);
        setPermError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      startingRef.current = false;
    }
  }, [detectLoop]);

  const stopListening = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
    analyserRef.current = null;
    streamRef.current = null;
    setListening(false);
    setResult(null);
  }, []);

  useEffect(() => {
    activeRef.current = panelActive;
    if (!panelActive) {
      stopListening();
    }
  }, [panelActive, stopListening]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let appStateListener: any;
    import('@capacitor/app')
      .then(({ App }) => {
        appStateListener = App.addListener('appStateChange', ({ isActive }) => {
          console.log(`[PitchPanel] App state changed. isActive: ${isActive}`);
          if (!isActive) {
            wasListeningBeforeBackground.current = !!audioCtxRef.current;
            stopListening();
          } else {
            if (activeRef.current && wasListeningBeforeBackground.current) {
              startListening();
            }
          }
        });
      })
      .catch((err) => {
        console.info('[PitchPanel] Capacitor App plugin not available:', err);
      });

    return () => {
      if (appStateListener) {
        appStateListener.then((l: any) => l.remove()).catch(() => {});
      }
    };
  }, [startListening, stopListening]);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      audioCtxRef.current?.close();
    };
  }, []);

  const handleReset = () => {
    setHistory([]);
    smoothedFreqRef.current = 0;
  };

  const tolerance = settings.vocalexTolerance ?? 5;
  const noteNaming = settings.vocalexNoteNaming ?? 'standard';

  const active = listening && result !== null;
  const needleRot = centsToNeedleRotation(active ? result!.cents : 0);
  const statusColor = active
    ? centsToColor(result!.cents, tolerance)
    : listening
      ? accent.from
      : isLight
        ? 'rgba(0,0,0,0.2)'
        : 'rgba(255,255,255,0.2)';
  const statusLabel = active ? centsToLabel(result!.cents, t.vocalex, tolerance) : '';

  const displayNoteName = (() => {
    if (!active || !result) return '—';
    if (noteNaming === 'solfege') {
      const idx = ((result.midiNote % 12) + 12) % 12;
      return SOLFEGE_NAMES[idx] || result.noteName;
    }
    return result.noteName;
  })();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding:
          '0 20px calc(var(--bottom-nav-height, 68px) + env(safe-area-inset-bottom, 16px) + 24px)',
        gap: 0,
        minHeight: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* ── Main Tuner Card ── */}
      <div
        style={{
          width: '100%',
          maxWidth: 360,
          background: isLight
            ? '#ffffff'
            : activeVis.amoledMode
              ? '#000000'
              : 'var(--app-surface-low, rgba(255,255,255,0.04))',
          border: '1px solid var(--c-border, rgba(128,128,128,0.15))',
          borderRadius: 24,
          padding: '24px 20px 20px',
          boxShadow: isLight ? '0 10px 30px -5px rgba(0,0,0,0.05)' : 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          boxSizing: 'border-box',
          position: 'relative',
        }}
      >
        {/* Gauge Dial Presentation */}
        <div
          style={{
            position: 'relative',
            width: 270,
            height: 270,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto',
          }}
        >
          {/* Circular Arc & Cent Scale SVG Gauge */}
          <svg
            viewBox="0 0 240 240"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              transform: 'rotate(-90deg)',
            }}
          >
            {/* Background Track Arc */}
            <circle
              cx="120"
              cy="120"
              r="102"
              fill="none"
              stroke={isLight ? '#E5E7EB' : 'rgba(255,255,255,0.08)'}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray="480 640"
              strokeDashoffset="-80"
            />
            {/* In-Tune Sweet Spot Arc */}
            <circle
              cx="120"
              cy="120"
              r="102"
              fill="none"
              stroke="#10B981"
              strokeWidth="8.5"
              strokeLinecap="round"
              strokeDasharray="75 640"
              strokeDashoffset="-282"
            />
          </svg>

          {/* Cent Scale Marks */}
          <div
            style={{
              position: 'absolute',
              top: 20,
              left: 20,
              right: 20,
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 11,
              fontFamily: 'var(--studio-font-mono)',
              fontWeight: 600,
              color: 'var(--c-text-secondary)',
              pointerEvents: 'none',
            }}
          >
            <span style={{ opacity: 0.55 }}>-50</span>
            <span style={{ opacity: 0.55, transform: 'translateX(-3px)' }}>-20</span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 800,
                color:
                  active && Math.abs(result!.cents) <= tolerance
                    ? '#10B981'
                    : 'var(--c-text-secondary)',
                transform: 'translateY(-2px)',
                transition: 'color 150ms ease',
              }}
            >
              0
            </span>
            <span style={{ opacity: 0.55, transform: 'translateX(3px)' }}>+20</span>
            <span style={{ opacity: 0.55 }}>+50</span>
          </div>

          {/* Needle / Indicator Pointing Along Arc */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-start',
              transform: `rotate(${needleRot}deg)`,
              transformOrigin: '50% 50%',
              pointerEvents: 'none',
              transition: 'transform 90ms cubic-bezier(0.16, 1, 0.3, 1)',
              zIndex: 2,
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                marginTop: 8,
              }}
            >
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: statusColor,
                  boxShadow: `0 0 0 4px ${statusColor}26`,
                  transition: 'background 150ms ease, box-shadow 150ms ease',
                }}
              />
              <div
                style={{
                  width: 2.5,
                  height: 14,
                  borderRadius: 2,
                  background: statusColor,
                  marginTop: 2,
                  transition: 'background 150ms ease',
                }}
              />
            </div>
          </div>

          {/* Central Note Display Hub */}
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              marginTop: 18,
            }}
          >
            <span
              style={{
                fontFamily: 'var(--studio-font-mono)',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--c-text-secondary)',
                marginBottom: 2,
              }}
            >
              {t.vocalex.currentNote || (language === 'es' ? 'NOTA ACTUAL' : 'CURRENT NOTE')}
            </span>

            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center' }}>
              <span
                style={{
                  fontFamily: 'var(--studio-font-display)',
                  fontSize: 72,
                  fontWeight: 800,
                  lineHeight: 1,
                  letterSpacing: '-0.04em',
                  color: active ? 'var(--c-text-primary)' : 'var(--c-text-secondary)',
                  opacity: active ? 1 : 0.35,
                  transition: 'color 180ms ease, opacity 180ms ease',
                }}
              >
                {displayNoteName}
              </span>
              {active && (
                <span
                  style={{
                    fontFamily: 'var(--studio-font-mono)',
                    fontSize: 34,
                    fontWeight: 700,
                    color: accent.from,
                    marginLeft: 3,
                    lineHeight: 1,
                  }}
                >
                  {result!.octave}
                </span>
              )}
            </div>

            {/* Status Pill */}
            <div style={{ marginTop: 10, display: 'flex', justifyContent: 'center' }}>
              {active ? (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 14px',
                    borderRadius: 9999,
                    background: `${statusColor}18`,
                    border: `1px solid ${statusColor}33`,
                    color: statusColor,
                    fontFamily: 'var(--studio-font-mono)',
                    fontSize: 11.5,
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: statusColor,
                    }}
                  />
                  <span>
                    {statusLabel} • {result!.cents >= 0 ? '+' : ''}
                    {result!.cents.toFixed(1)} ct
                  </span>
                </div>
              ) : listening ? (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 14px',
                    borderRadius: 9999,
                    background: 'var(--app-surface-low, rgba(255,255,255,0.04))',
                    border: '1px solid var(--c-border, rgba(128,128,128,0.12))',
                    color: 'var(--c-text-secondary)',
                    fontFamily: 'var(--studio-font-mono)',
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: accent.from,
                    }}
                  />
                  <span>{language === 'es' ? 'ESCUCHANDO...' : 'LISTENING...'}</span>
                </div>
              ) : (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 14px',
                    borderRadius: 9999,
                    background: 'var(--app-surface-low, rgba(255,255,255,0.04))',
                    border: '1px solid var(--c-border, rgba(128,128,128,0.12))',
                    color: 'var(--c-text-secondary)',
                    fontFamily: 'var(--studio-font-mono)',
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    opacity: 0.65,
                  }}
                >
                  <span>{language === 'es' ? 'LISTO' : 'READY'}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Core Readouts (Frequency & Deviation) ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
            width: '100%',
            marginTop: 14,
            paddingTop: 16,
            borderTop: '1px solid var(--c-border, rgba(128,128,128,0.12))',
          }}
        >
          <div
            style={{
              background: 'var(--app-surface-low, rgba(128,128,128,0.04))',
              border: '1px solid var(--c-border, rgba(128,128,128,0.12))',
              borderRadius: 16,
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--studio-font-mono)',
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--c-text-secondary)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              {t.vocalex.frequency || (language === 'es' ? 'Frecuencia' : 'Frequency')}
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, marginTop: 4 }}>
              <span
                style={{
                  fontFamily: 'var(--studio-font-mono)',
                  fontSize: 20,
                  fontWeight: 700,
                  color: active ? 'var(--c-text-primary)' : 'var(--c-text-secondary)',
                  opacity: active ? 1 : 0.4,
                }}
              >
                {active ? result!.frequency.toFixed(2) : '—'}
              </span>
              <span
                style={{
                  fontFamily: 'var(--studio-font-mono)',
                  fontSize: 12,
                  fontWeight: 500,
                  color: 'var(--c-text-secondary)',
                  opacity: active ? 0.8 : 0.4,
                  marginLeft: 2,
                }}
              >
                Hz
              </span>
            </div>
          </div>

          <div
            style={{
              background: 'var(--app-surface-low, rgba(128,128,128,0.04))',
              border: '1px solid var(--c-border, rgba(128,128,128,0.12))',
              borderRadius: 16,
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--studio-font-mono)',
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--c-text-secondary)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              {t.vocalex.precision || (language === 'es' ? 'Precisión' : 'Accuracy')}
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, marginTop: 4 }}>
              <span
                style={{
                  fontFamily: 'var(--studio-font-mono)',
                  fontSize: 20,
                  fontWeight: 700,
                  color: active ? statusColor : 'var(--c-text-secondary)',
                  opacity: active ? 1 : 0.4,
                }}
              >
                {active
                  ? `${Math.max(0, Math.min(100, 100 - (Math.abs(result!.cents) / 50) * 100)).toFixed(1)}`
                  : '—'}
              </span>
              <span
                style={{
                  fontFamily: 'var(--studio-font-mono)',
                  fontSize: 12,
                  fontWeight: 500,
                  color: active ? statusColor : 'var(--c-text-secondary)',
                  opacity: active ? 0.8 : 0.4,
                  marginLeft: 2,
                }}
              >
                %
              </span>
            </div>
          </div>
        </div>

        {/* ── Real Pitch History / Stability Strip ── */}
        <div
          style={{
            width: '100%',
            marginTop: 14,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--studio-font-mono)',
                fontSize: 10,
                fontWeight: 700,
                color: 'var(--c-text-secondary)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              {language === 'es' ? 'Estabilidad de Tono' : 'Pitch Stability'}
            </span>
            <span
              style={{
                fontFamily: 'var(--studio-font-mono)',
                fontSize: 10,
                fontWeight: 600,
                color: 'var(--c-text-secondary)',
                opacity: 0.6,
              }}
            >
              {active ? `${history.length} pts` : '—'}
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              height: 28,
              gap: 4,
            }}
          >
            {Array.from({ length: 24 }, (_, i) => {
              const entry = history.length > 0 ? history[history.length - 24 + i] : undefined;
              let barH = 4;
              let barBg = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)';

              if (entry) {
                const absCents = Math.abs(entry.cents);
                barH = Math.max(12, Math.min(100, (1 - absCents / 50) * 100));
                barBg = centsToColor(entry.cents, tolerance);
              }

              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: `${barH}%`,
                    borderRadius: 2,
                    background: barBg,
                    transition: 'height 100ms ease, background 100ms ease',
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Primary Action Controls ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '4fr 8fr',
          gap: 12,
          width: '100%',
          maxWidth: 360,
          marginTop: 16,
        }}
      >
        {/* Reset Button */}
        <button
          type="button"
          onClick={handleReset}
          disabled={history.length === 0 && !result}
          style={{
            height: 54,
            borderRadius: 16,
            background: isLight
              ? '#ffffff'
              : activeVis.amoledMode
                ? '#000000'
                : 'var(--app-surface-low, rgba(255,255,255,0.04))',
            border: '1px solid var(--c-border, rgba(128,128,128,0.18))',
            color: 'var(--c-text-primary)',
            fontFamily: 'var(--studio-font-display)',
            fontWeight: 600,
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            cursor: history.length === 0 && !result ? 'default' : 'pointer',
            opacity: history.length === 0 && !result ? 0.45 : 1,
            boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.04)' : 'none',
            transition: 'all 150ms ease',
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 20, color: 'var(--c-text-secondary)' }}
          >
            restart_alt
          </span>
          <span>{t.vocalex.reset || (language === 'es' ? 'Restablecer' : 'Reset')}</span>
        </button>

        {/* Primary Stop/Start Monitoring Button */}
        <button
          type="button"
          onClick={listening ? stopListening : startListening}
          style={{
            height: 54,
            borderRadius: 16,
            background: listening ? '#ef4444' : accent.from,
            border: 'none',
            color: '#ffffff',
            fontFamily: 'var(--studio-font-display)',
            fontWeight: 700,
            fontSize: 15,
            letterSpacing: '-0.01em',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            cursor: 'pointer',
            boxShadow: listening
              ? '0 4px 16px rgba(239, 68, 68, 0.28)'
              : `0 4px 16px ${accent.from}33`,
            transition: 'all 180ms ease',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
            {listening ? 'mic_off' : 'mic'}
          </span>
          <span>
            {listening
              ? t.vocalex.tunerStop || (language === 'es' ? 'Detener Monitor' : 'Stop Monitoring')
              : t.vocalex.tunerStart ||
                (language === 'es' ? 'Iniciar Monitor' : 'Start Monitoring')}
          </span>
        </button>
      </div>

      {permError && (
        <div
          style={{
            padding: '14px 16px',
            borderRadius: 16,
            marginTop: 16,
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            color: '#ef4444',
            fontSize: 12.5,
            fontFamily: 'var(--studio-font-body)',
            textAlign: 'center',
            maxWidth: 360,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
            boxSizing: 'border-box',
          }}
        >
          <span style={{ fontWeight: 500, lineHeight: 1.4 }}>
            {permError.includes('NotAllowedError') ||
            permError.includes('Permission denied') ||
            permError.includes('denied')
              ? t.vocalex.tunerMicRequired
              : permError}
          </span>
          {Capacitor.isNativePlatform() ? (
            <button
              type="button"
              onClick={async () => {
                try {
                  const { AppInstaller } = await import('@workspace/studio-core');
                  await AppInstaller.openAppSettings();
                } catch (e) {
                  console.error('Failed to open app settings:', e);
                }
              }}
              style={{
                background: '#ef4444',
                color: '#ffffff',
                border: 'none',
                borderRadius: 10,
                padding: '8px 16px',
                fontSize: 12,
                fontWeight: 600,
                fontFamily: 'var(--studio-font-display)',
                cursor: 'pointer',
              }}
            >
              {language === 'es' ? 'Abrir Ajustes de la App' : 'Open App Settings'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setPermError(null);
                startListening();
              }}
              style={{
                background: '#ef4444',
                color: '#ffffff',
                border: 'none',
                borderRadius: 10,
                padding: '8px 16px',
                fontSize: 12,
                fontWeight: 600,
                fontFamily: 'var(--studio-font-display)',
                cursor: 'pointer',
              }}
            >
              {t.vocalex.tunerGrantStart}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
