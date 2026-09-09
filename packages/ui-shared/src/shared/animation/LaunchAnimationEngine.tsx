import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';
import { StartupCoordinator } from '@workspace/studio-core';
import { triggerIntroReveal } from '../typography/StudioTitleReveal';
import livexSymbolUrl from '../../assets/livex-symbol.png';

// Studio Sine Wave Logo SVG path (retained for backward-compatibility)
export const StudioSinePath = 'M 72 256 C 128 60 192 60 256 256 S 384 452 440 256';

export type LaunchPreset =
  'fluid_surface' | 'liquid_glass' | 'ripple_reveal' | 'layer_expansion' | 'aurora_reveal';

interface LaunchAnimationEngineProps {
  preset?: LaunchPreset;
  onComplete?: () => void;
  isLight?: boolean;
  isAmoled?: boolean;
  loopMode?: boolean;
  scaleFactor?: number;
  skipIntro?: boolean;
}

export function LaunchAnimationEngine({
  onComplete,
  isLight = false,
  isAmoled = false,
  loopMode = false,
  scaleFactor = 1,
  skipIntro = false,
}: LaunchAnimationEngineProps) {
  const [stage, setStage] = useState<'logo' | 'reveal' | 'complete'>(skipIntro ? 'reveal' : 'logo');
  const [canStartReveal, setCanStartReveal] = useState(skipIntro || loopMode);
  const [key, setKey] = useState(0);

  // Telemetry frame tracking
  const frameTimes = useRef<number[]>([]);
  const lastTime = useRef<number>(0);

  useEffect(() => {
    // Dismiss the index.html splash overlay only after React has mounted and drawn the initial overlay frame
    const intro = document.getElementById('intro');
    console.log(`[STARTUP-TRACE] LaunchAnimationEngine: mount effect, #intro exists=${!!intro}`);
    if (intro) {
      intro.style.display = 'none';
      if (intro.parentNode) intro.parentNode.removeChild(intro);
      triggerIntroReveal();
      console.log(
        `[STARTUP-TRACE] LaunchAnimationEngine: triggered intro reveal at ${performance.now().toFixed(0)}ms`
      );
    }
  }, []);

  useEffect(() => {
    if (!skipIntro) {
      setStage('logo');
      setCanStartReveal(loopMode);
    }
    lastTime.current = performance.now();
    let frameId: number;

    const trackFrame = (time: number) => {
      if (lastTime.current > 0) {
        const delta = time - lastTime.current;
        frameTimes.current.push(delta);
        if (frameTimes.current.length > 300) frameTimes.current.shift();
      }
      lastTime.current = time;
      frameId = requestAnimationFrame(trackFrame);
    };

    frameId = requestAnimationFrame(trackFrame);
    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [key, skipIntro, loopMode]);

  // Phase timers and paint state event-driven checks
  useEffect(() => {
    let t1: ReturnType<typeof setTimeout>;
    console.log(
      `[STARTUP-TRACE] LaunchAnimationEngine: stage effect, stage=${stage}, canStartReveal=${canStartReveal}`
    );

    if (stage === 'logo') {
      // Step 1: Emerge & settle brand reveal (550ms reveal + 250ms hold = 800ms total)
      t1 = setTimeout(() => {
        console.log(
          `[STARTUP-TRACE] LaunchAnimationEngine: logo->reveal transition at ${performance.now().toFixed(0)}ms`
        );
        setStage('reveal');
      }, 800);
    } else if (stage === 'reveal') {
      // Step 2: Wait for Hub to mount and paint 2 requestAnimationFrames to prevent flashes
      const isComplete =
        loopMode ||
        (typeof window !== 'undefined' &&
          ((window as any).__studioStartupComplete ||
            !!document.querySelector('[data-livex-hub-root="true"]') ||
            !!document.getElementById('hub-root')));
      if (isComplete) {
        console.log(
          `[STARTUP-TRACE] LaunchAnimationEngine: startup complete or Hub DOM present, setting canStartReveal`
        );
        setCanStartReveal(true);
      } else {
        const unsub = StartupCoordinator.subscribeStartupComplete(() => {
          setCanStartReveal(true);
        });

        // Fail-safe watchdog fallback to guarantee transition out even if event is missed
        const fallbackTimer = setTimeout(() => {
          setCanStartReveal(true);
        }, 2000);

        return () => {
          unsub();
          clearTimeout(fallbackTimer);
        };
      }
    }

    return () => {
      clearTimeout(t1);
    };
  }, [stage, loopMode]);

  // Strict AMOLED pure black (#000000) for uncompromised contrast
  const bgColor = '#000000';

  // Responsive sizing calibrated for mobile viewports (~196px standard, clamped between 160px and 220px)
  const symbolSize = Math.max(160, Math.min(220, Math.round(196 * scaleFactor)));
  const glowSize = Math.round(symbolSize * 1.45);

  // Smoothly dissolve the entire launch overlay when transitioning into the Hub
  const containerAnimate = !canStartReveal ? { opacity: 1 } : { opacity: 0 };

  return (
    <motion.div
      key={key}
      initial={{ opacity: 1 }}
      animate={containerAnimate}
      transition={{ duration: 0.38, ease: [0.4, 0, 0.2, 1] }}
      onAnimationComplete={() => {
        console.log(
          `[STARTUP-TRACE] LaunchAnimationEngine: onAnimationComplete, canStartReveal=${canStartReveal}, stage=${stage}`
        );
        if (canStartReveal && stage === 'reveal') {
          if (loopMode) {
            setKey((prev) => prev + 1);
          } else {
            setStage('complete');
            console.log(
              `[STARTUP-TRACE] LaunchAnimationEngine: calling onComplete(), stage->complete at ${performance.now().toFixed(0)}ms`
            );
            if (onComplete) onComplete();
          }
        }
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        overflow: 'hidden',
        backgroundColor: bgColor,
        pointerEvents: stage === 'complete' ? 'none' : 'auto',
        // GPU Promotion styles for native 90Hz / 120Hz refresh rates
        willChange: 'transform, opacity',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        transformStyle: 'preserve-3d',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Soft luminous ambient glow behind mark */}
        <motion.div
          initial={{ opacity: 0, scale: 0.82 }}
          animate={!canStartReveal ? { opacity: 0.85, scale: 1 } : { opacity: 0, scale: 1.06 }}
          transition={
            !canStartReveal
              ? { duration: 0.65, ease: [0.16, 1, 0.3, 1] }
              : { duration: 0.35, ease: [0.4, 0, 0.2, 1] }
          }
          style={{
            position: 'absolute',
            width: glowSize,
            height: glowSize,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0.04) 45%, transparent 70%)',
            filter: 'blur(24px)',
            pointerEvents: 'none',
            willChange: 'transform, opacity',
            transform: 'translateZ(0)',
          }}
        />

        {/* Sculpted monochrome Livex symbol */}
        <motion.div
          initial={{ opacity: 0, scale: 0.88 }}
          animate={!canStartReveal ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.03 }}
          transition={
            !canStartReveal
              ? { duration: 0.55, ease: [0.16, 1, 0.3, 1] }
              : { duration: 0.38, ease: [0.4, 0, 0.2, 1] }
          }
          style={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: symbolSize,
            height: symbolSize,
            willChange: 'transform, opacity',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transformStyle: 'preserve-3d',
            transform: 'translateZ(0)',
          }}
        >
          <img
            src={livexSymbolUrl}
            alt="Livex"
            width={symbolSize}
            height={symbolSize}
            draggable={false}
            style={{
              display: 'block',
              width: symbolSize,
              height: symbolSize,
              objectFit: 'contain',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              pointerEvents: 'none',
              filter: 'none',
              transform: 'translateZ(0)',
            }}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}
