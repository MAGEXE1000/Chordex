import { useT, resolveAccent, useSettingsStore } from '@workspace/studio-core';
import { useState } from 'react';
import PitchPanel from './PitchPanel';
import PracticePanel from './PracticePanel';

export default function CoachPanel({ active = true }: { active?: boolean }) {
  const t = useT();
  const settings = useSettingsStore((s) => s.settings);
  const activeVis = settings.perApp?.vocalex ?? { theme: 'dark', amoledMode: false };
  const acc = resolveAccent(settings.accentColor);
  const isLight =
    activeVis.theme === 'light' ||
    (activeVis.theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: light)').matches);

  const [subView, setSubView] = useState<'pitch' | 'practice'>('pitch');
  const vt = t.vocalex as any;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Sub-tab segment selector */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          padding:
            'calc(var(--safe-area-inset-top, env(safe-area-inset-top, 0px)) + 12px) var(--page-header-inset-h, var(--page-inset-h, 24px)) 10px',
        }}
      >
        <div
          style={{
            position: 'relative',
            display: 'flex',
            width: '100%',
            maxWidth: 360,
            background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)',
            padding: 4,
            borderRadius: 9999,
            border: '1px solid var(--c-border, rgba(128,128,128,0.15))',
            userSelect: 'none',
            boxSizing: 'border-box',
          }}
        >
          {/* Sliding Pill Indicator */}
          <div
            style={{
              position: 'absolute',
              left: 4,
              top: 4,
              bottom: 4,
              width: 'calc(50% - 4px)',
              transform: subView === 'pitch' ? 'translateX(0)' : 'translateX(100%)',
              background: isLight
                ? '#ffffff'
                : activeVis.amoledMode
                  ? '#18181b'
                  : 'rgba(255,255,255,0.12)',
              borderRadius: 9999,
              transition: 'transform 260ms cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.08)' : '0 2px 8px rgba(0,0,0,0.3)',
              zIndex: 0,
            }}
          />

          <button
            type="button"
            onClick={() => setSubView('pitch')}
            style={{
              position: 'relative',
              zIndex: 1,
              flex: 1,
              height: 38,
              borderRadius: 9999,
              fontWeight: 700,
              fontSize: 13.5,
              fontFamily: 'var(--studio-font-display)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              cursor: 'pointer',
              border: 'none',
              background: 'transparent',
              color: subView === 'pitch' ? 'var(--c-text-primary)' : 'var(--c-text-secondary)',
              transition: 'color 200ms ease',
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: 18,
                color: subView === 'pitch' ? acc.from : 'inherit',
                transition: 'color 200ms ease',
              }}
            >
              query_stats
            </span>
            <span>
              {vt.tabMonitor || (settings.language === 'es' ? 'Monitor de Voz' : 'Vocal Monitor')}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSubView('practice')}
            style={{
              position: 'relative',
              zIndex: 1,
              flex: 1,
              height: 38,
              borderRadius: 9999,
              fontWeight: 700,
              fontSize: 13.5,
              fontFamily: 'var(--studio-font-display)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              cursor: 'pointer',
              border: 'none',
              background: 'transparent',
              color: subView === 'practice' ? 'var(--c-text-primary)' : 'var(--c-text-secondary)',
              transition: 'color 200ms ease',
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: 18,
                color: subView === 'practice' ? acc.from : 'inherit',
                transition: 'color 200ms ease',
              }}
            >
              school
            </span>
            <span>
              {vt.tabExercises ||
                (settings.language === 'es' ? 'Ejercicios Vocales' : 'Vocal Exercises')}
            </span>
          </button>
        </div>
      </div>

      {/* View Content */}
      <div style={{ flex: 1, position: 'relative' }}>
        <div
          style={{
            display: subView === 'pitch' ? 'block' : 'none',
            height: '100%',
          }}
        >
          <PitchPanel active={active && subView === 'pitch'} />
        </div>
        <div
          style={{
            display: subView === 'practice' ? 'block' : 'none',
            height: '100%',
          }}
        >
          <PracticePanel />
        </div>
      </div>
    </div>
  );
}
