import { Dialog } from '../../../shared/design-system/dialogs';
import {
  useT,
  useNavigationStore,
  NavigationDispatcher,
  useBackHandler,
  useSettingsStore,
  blobToAudioBuffer,
  type TakeRecord,
} from '@workspace/studio-core';
import { useShallow } from 'zustand/react/shallow';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Loader } from '../../../components/motion/loader';
import { analyzeAudio, type VocalAnalysis, type AnalysisLabels } from '../services/vocalAnalysis';
import HarmonizerSheet from './HarmonizerSheet';
import { Button } from '../../../shared/design-system/StudioDesignSystem';
import { SharedFloatingHeader } from '../../../shared/layout/StudioLayoutSystem';

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatDateI18n(
  ts: number,
  t: { today: string; yesterday: string; daysAgo: (n: number) => string }
): string {
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - ts;
  if (diff < 86400000) {
    return `${t.today}, ${d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  }
  if (diff < 172800000) {
    return `${t.yesterday}, ${d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  }
  if (diff < 604800000) {
    return t.daysAgo(Math.floor(diff / 86400000));
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function TakeDetailView({
  take,
  onBack,
  onDelete,
  onSaveBounce,
}: {
  take: TakeRecord;
  onBack: () => void;
  onDelete: (id: string) => void;
  onSaveBounce: (newTake: TakeRecord) => Promise<void>;
}) {
  const t = useT();
  const settings = useSettingsStore(useShallow((s) => s.settings));
  const activeVis = settings.perApp?.vocalex ?? { theme: 'dark', amoledMode: false };
  const isLight =
    activeVis.theme === 'light' ||
    (activeVis.theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: light)').matches);
  const isAmoled = !!activeVis.amoledMode;

  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analysis, setAnalysis] = useState<VocalAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showHarmonizer, setShowHarmonizer] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);
  const rafRef = useRef<number>(0);

  useBackHandler(
    'nested',
    () => {
      onBack();
      return true;
    },
    [onBack]
  );

  useEffect(() => {
    const url = URL.createObjectURL(take.audioBlob);
    urlRef.current = url;
    const audio = new Audio(url);
    audioRef.current = audio;

    audio.onended = () => {
      setPlaying(false);
      setProgress(0);
    };

    return () => {
      audio.pause();
      URL.revokeObjectURL(url);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [take]);

  useEffect(() => {
    (async () => {
      try {
        const audioBuffer = await blobToAudioBuffer(take.audioBlob);
        const labels: AnalysisLabels = {
          noPitchTitle: t.vocalex.noPitchTitle,
          noPitchDetail: t.vocalex.noPitchDetail,
          pitchStability: t.vocalex.pitchStabilityTitle,
          stabilityExcellent: t.vocalex.stabilityExcellent,
          stabilityGood: t.vocalex.stabilityGood,
          stabilityPractice: t.vocalex.stabilityPractice,
          vocalRange: t.vocalex.vocalRangeTitle,
          semitones: t.vocalex.semitonesUnit,
          rangeWide: t.vocalex.rangeWide,
          rangeModerate: t.vocalex.rangeModerate,
          rangeNarrow: t.vocalex.rangeNarrow,
          rangeTo: t.vocalex.rangeTo,
          pitchTrend: t.vocalex.pitchTrendTitle,
          driftingFlat: t.vocalex.driftingFlat,
          driftingFlatDetail: t.vocalex.driftingFlatDetail,
          driftingSharp: t.vocalex.driftingSharp,
          driftingSharpDetail: t.vocalex.driftingSharpDetail,
          stableTrend: t.vocalex.stableTrend,
          stableTrendDetail: t.vocalex.stableTrendDetail,
          breathGaps: t.vocalex.breathGapsTitle,
          breathGapsDetail: t.vocalex.breathGapsDetail,
          inTuneRate: t.vocalex.inTuneRateTitle,
          inTuneExcellent: t.vocalex.inTuneExcellent,
          inTuneDecent: t.vocalex.inTuneDecent,
          inTunePractice: t.vocalex.inTunePractice,
        };
        const result = analyzeAudio(audioBuffer, labels);
        setAnalysis(result);
      } catch {
        /* empty */
      }
      setAnalyzing(false);
    })();
  }, [take]);

  const updateProgress = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.duration && isFinite(audio.duration)) {
      setProgress((audio.currentTime / audio.duration) * 100);
    }
    rafRef.current = requestAnimationFrame(updateProgress);
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      setPlaying(false);
    } else {
      audio.play();
      rafRef.current = requestAnimationFrame(updateProgress);
      setPlaying(true);
    }
  }, [playing, updateProgress]);

  const seekTo = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration || !isFinite(audio.duration)) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = x * audio.duration;
    setProgress(x * 100);
  };

  const handleDelete = () => {
    if (audioRef.current) audioRef.current.pause();
    onDelete(take.id);
  };

  const currentTimeSec = audioRef.current?.currentTime ?? 0;
  const totalTimeSec = take.durationMs / 1000;

  const cardBg = isLight
    ? '#ffffff'
    : isAmoled
      ? '#000000'
      : 'var(--app-surface-low, rgba(255,255,255,0.04))';
  const cardBorder = '1px solid var(--c-border, rgba(128,128,128,0.18))';
  const cardShadow = isLight ? '0 1px 4px rgba(0,0,0,0.03)' : 'none';

  return (
    <div
      className="relative"
      style={{
        padding:
          '16px 20px calc(var(--bottom-nav-height, 68px) + env(safe-area-inset-bottom, 16px) + 24px)',
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 78px)',
        minHeight: '100%',
        boxSizing: 'border-box',
      }}
    >
      <SharedFloatingHeader
        title={take.name || 'Take Details'}
        onBack={onBack}
        toolbarActions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              data-testid="open-harmonizer-btn"
              onClick={() => {
                if (audioRef.current && !audioRef.current.paused) {
                  audioRef.current.pause();
                  if (rafRef.current) cancelAnimationFrame(rafRef.current);
                  setPlaying(false);
                }
                setShowHarmonizer(true);
              }}
              style={{
                background: 'rgba(var(--studio-accent-rgb, 0,122,255), 0.12)',
                border: '1px solid var(--studio-accent, #007aff)',
                cursor: 'pointer',
                color: 'var(--studio-accent, #007aff)',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 10px',
                borderRadius: 9999,
                fontFamily: 'var(--studio-font-display)',
                fontSize: 11.5,
                fontWeight: 700,
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 15, fontVariationSettings: "'FILL' 1" }}
              >
                graphic_eq
              </span>
              Harmonize
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 4,
              }}
              title={t.vocalex.deleteTake}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                delete
              </span>
            </button>
          </div>
        }
      />

      {showHarmonizer && (
        <HarmonizerSheet
          take={take}
          accent="var(--studio-accent, #007aff)"
          onClose={() => setShowHarmonizer(false)}
          onBounce={async (newTake) => {
            await onSaveBounce(newTake);
            setShowHarmonizer(false);
            onBack();
          }}
        />
      )}

      {/* Delete confirmation */}
      <Dialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title={t.vocalex.deleteConfirmTitle}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p
            style={{
              fontFamily: 'var(--studio-font-body)',
              fontSize: 13,
              color: 'var(--c-text-secondary)',
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            {t.vocalex.deleteConfirmBody}
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <Button onClick={() => setShowDeleteConfirm(false)} style={{ flex: 1 }}>
              {t.vocalex.cancelAction}
            </Button>
            <Button
              variant="primary"
              onClick={handleDelete}
              style={{ flex: 1, background: 'var(--c-error, #ef4444)', color: '#fff' }}
            >
              {t.vocalex.deleteTake}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Take info */}
      <div style={{ marginBottom: 20 }}>
        <h2
          style={{
            fontFamily: 'var(--studio-font-display)',
            fontWeight: 800,
            fontSize: 22,
            color: 'var(--c-text-primary)',
            margin: '0 0 4px',
            lineHeight: 1.2,
            wordBreak: 'break-word',
            letterSpacing: '-0.02em',
          }}
        >
          {take.name}
        </h2>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontFamily: 'var(--studio-font-body)',
            fontSize: 12,
            color: 'var(--c-text-secondary)',
          }}
        >
          <span>{formatDateI18n(take.createdAt, t.vocalex)}</span>
          <span
            style={{
              width: 3,
              height: 3,
              borderRadius: '50%',
              background: 'var(--c-text-secondary)',
              opacity: 0.5,
            }}
          />
          <span style={{ fontFamily: 'var(--studio-font-mono)', fontWeight: 600 }}>
            {formatDuration(take.durationMs)}
          </span>
        </div>
      </div>

      {/* Player card */}
      <div
        style={{
          background: cardBg,
          border: cardBorder,
          boxShadow: cardShadow,
          borderRadius: 16,
          padding: 20,
          marginBottom: 24,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 3,
            background: playing ? 'var(--studio-accent, #007aff)' : 'transparent',
            transition: 'background 200ms ease',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <button
            onClick={togglePlay}
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: 'var(--studio-accent, #007aff)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px 0 rgba(0, 122, 255, 0.25)',
              flexShrink: 0,
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: 26,
                color: '#fff',
                fontVariationSettings: "'FILL' 1",
              }}
            >
              {playing ? 'pause' : 'play_arrow'}
            </span>
          </button>
          <div>
            <p
              style={{
                fontFamily: 'var(--studio-font-display)',
                fontWeight: 700,
                fontSize: 14,
                color: playing ? 'var(--studio-accent, #007aff)' : 'var(--c-text-secondary)',
                margin: 0,
                transition: 'color 200ms ease',
              }}
            >
              {playing ? t.vocalex.playing : t.vocalex.tapToPlay}
            </p>
          </div>
        </div>

        {/* Waveform / scrubber */}
        <div
          onClick={seekTo}
          style={{
            height: 72,
            background: isLight ? '#f1f5f9' : 'rgba(0,0,0,0.2)',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            padding: '0 10px',
            gap: 1.5,
            position: 'relative',
            overflow: 'hidden',
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: `${progress}%`,
              background: 'rgba(var(--studio-accent-rgb, 0,122,255), 0.08)',
              borderRight: '2px solid var(--studio-accent, #007aff)',
              transition: playing ? 'none' : 'width 100ms ease',
            }}
          />
          {take.waveformPeaks.map((h, i) => {
            const isPlayed = (i / take.waveformPeaks.length) * 100 < progress;
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: `${Math.max(8, h)}%`,
                  borderRadius: 9999,
                  background: isPlayed
                    ? 'var(--studio-accent, #007aff)'
                    : isLight
                      ? '#cbd5e1'
                      : 'rgba(255,255,255,0.2)',
                  position: 'relative',
                  zIndex: 1,
                  minWidth: 1.5,
                }}
              />
            );
          })}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '6px 2px 0',
            fontFamily: 'var(--studio-font-mono)',
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--c-text-secondary)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          <span>{formatDuration(currentTimeSec * 1000)}</span>
          <span>-{formatDuration((totalTimeSec - currentTimeSec) * 1000)}</span>
        </div>
      </div>

      {/* Analysis section */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 20, color: 'var(--studio-accent, #007aff)' }}
          >
            insights
          </span>
          <h3
            style={{
              fontFamily: 'var(--studio-font-display)',
              fontWeight: 800,
              fontSize: 18,
              color: 'var(--c-text-primary)',
              margin: 0,
              letterSpacing: '-0.02em',
            }}
          >
            {t.vocalex.vocalAnalysis}
          </h3>
        </div>

        {analyzing ? (
          <div
            style={{
              padding: 32,
              textAlign: 'center',
              background: cardBg,
              border: cardBorder,
              boxShadow: cardShadow,
              borderRadius: 14,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <Loader variant="metaballs" size={32} />
            <p
              style={{
                fontFamily: 'var(--studio-font-body)',
                fontSize: 13,
                color: 'var(--c-text-secondary)',
                margin: 0,
              }}
            >
              {t.vocalex.analyzing}
            </p>
          </div>
        ) : analysis ? (
          <>
            {/* Stats grid */}
            <div
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}
            >
              <StatCard
                label={t.vocalex.avgFrequency}
                value={analysis.avgFrequency > 0 ? `${analysis.avgFrequency.toFixed(0)} Hz` : '—'}
                cardBg={cardBg}
                cardBorder={cardBorder}
                cardShadow={cardShadow}
              />
              <StatCard
                label={t.vocalex.stability}
                value={`${analysis.stabilityPercent}%`}
                cardBg={cardBg}
                cardBorder={cardBorder}
                cardShadow={cardShadow}
                color={
                  analysis.stabilityPercent >= 80
                    ? '#34d399'
                    : analysis.stabilityPercent >= 60
                      ? '#eab308'
                      : '#ef4444'
                }
              />
              <StatCard
                label={t.vocalex.lowest}
                value={analysis.lowestNote}
                cardBg={cardBg}
                cardBorder={cardBorder}
                cardShadow={cardShadow}
              />
              <StatCard
                label={t.vocalex.highest}
                value={analysis.highestNote}
                cardBg={cardBg}
                cardBorder={cardBorder}
                cardShadow={cardShadow}
              />
            </div>

            {/* Pitch timeline */}
            {analysis.pitchTimeline.length > 0 && (
              <div
                style={{
                  background: cardBg,
                  border: cardBorder,
                  boxShadow: cardShadow,
                  borderRadius: 14,
                  padding: 16,
                  marginBottom: 16,
                  height: 100,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <p
                  style={{
                    fontFamily: 'var(--studio-font-body)',
                    fontSize: 10,
                    fontWeight: 700,
                    color: 'var(--c-text-secondary)',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    margin: '0 0 8px',
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  {t.vocalex.pitchTimeline}
                </p>
                <svg
                  viewBox={`0 0 ${analysis.pitchTimeline.length} 60`}
                  style={{
                    width: '100%',
                    height: 56,
                    display: 'block',
                  }}
                  preserveAspectRatio="none"
                >
                  {(() => {
                    const pts = analysis.pitchTimeline;
                    const minF = Math.min(...pts.map((p) => p.frequency));
                    const maxF = Math.max(...pts.map((p) => p.frequency));
                    const range = maxF - minF || 1;
                    const path = pts
                      .map((p, i) => {
                        const y = 56 - ((p.frequency - minF) / range) * 50 - 3;
                        return `${i === 0 ? 'M' : 'L'} ${i} ${y}`;
                      })
                      .join(' ');
                    return (
                      <>
                        <path
                          d={path}
                          fill="none"
                          stroke="var(--studio-accent, #007aff)"
                          strokeWidth="1.5"
                          vectorEffect="non-scaling-stroke"
                        />
                        <path
                          d={`${path} L ${pts.length - 1} 60 L 0 60 Z`}
                          fill="url(#pitchGrad)"
                          opacity="0.3"
                        />
                        <defs>
                          <linearGradient id="pitchGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--studio-accent, #007aff)" />
                            <stop
                              offset="100%"
                              stopColor="var(--studio-accent, #007aff)"
                              stopOpacity="0"
                            />
                          </linearGradient>
                        </defs>
                      </>
                    );
                  })()}
                </svg>
              </div>
            )}

            {/* Insights */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {analysis.insights.map((insight, i) => (
                <div
                  key={i}
                  style={{
                    background: cardBg,
                    border: cardBorder,
                    boxShadow: cardShadow,
                    borderRadius: 14,
                    padding: '16px 18px',
                    borderLeft: `3px solid ${insight.color}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span
                      className="material-symbols-outlined"
                      style={{
                        fontSize: 20,
                        color: insight.color,
                        fontVariationSettings: "'FILL' 1",
                      }}
                    >
                      {insight.icon}
                    </span>
                    <div
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span
                        style={{
                          fontFamily: 'var(--studio-font-display)',
                          fontWeight: 700,
                          fontSize: 14,
                          color: 'var(--c-text-primary)',
                        }}
                      >
                        {insight.title}
                      </span>
                      {insight.value && (
                        <span
                          style={{
                            fontFamily: 'var(--studio-font-mono)',
                            fontWeight: 800,
                            fontSize: 14,
                            color: insight.color,
                          }}
                        >
                          {insight.value}
                        </span>
                      )}
                    </div>
                  </div>
                  <p
                    style={{
                      fontFamily: 'var(--studio-font-body)',
                      fontSize: 12.5,
                      color: 'var(--c-text-secondary)',
                      margin: 0,
                      lineHeight: 1.6,
                    }}
                  >
                    {insight.detail}
                  </p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div
            style={{
              padding: 24,
              textAlign: 'center',
              background: cardBg,
              border: cardBorder,
              boxShadow: cardShadow,
              borderRadius: 14,
            }}
          >
            <p
              style={{
                fontFamily: 'var(--studio-font-body)',
                fontSize: 13,
                color: 'var(--c-text-secondary)',
                margin: 0,
              }}
            >
              {t.vocalex.analysisError}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
  cardBg,
  cardBorder,
  cardShadow,
}: {
  label: string;
  value: string;
  color?: string;
  cardBg: string;
  cardBorder: string;
  cardShadow: string;
}) {
  return (
    <div
      style={{
        background: cardBg,
        border: cardBorder,
        boxShadow: cardShadow,
        borderRadius: 12,
        padding: '14px 16px',
      }}
    >
      <p
        style={{
          fontFamily: 'var(--studio-font-body)',
          fontSize: 10,
          fontWeight: 700,
          color: 'var(--c-text-secondary)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          margin: '0 0 4px',
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontFamily: 'var(--studio-font-mono)',
          fontSize: 20,
          fontWeight: 700,
          color: color ?? 'var(--c-text-primary)',
          margin: 0,
        }}
      >
        {value}
      </p>
    </div>
  );
}
