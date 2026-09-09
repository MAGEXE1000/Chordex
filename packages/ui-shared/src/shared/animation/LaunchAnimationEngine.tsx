import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';
import { StartupCoordinator } from '@workspace/studio-core';
import { triggerIntroReveal } from '../typography/StudioTitleReveal';
import livexForm1Url from '../../assets/livex-form1.png';
import livexForm2Url from '../../assets/livex-form2.png';
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
  // Determine start delay from app launch time (T+0.65s target)
  const getInitialDelay = () => {
    if (skipIntro) return 0;
    const htmlStart =
      typeof window !== 'undefined' ? (window as any).__bootTimings?.htmlStart || 0 : 0;
    const elapsed = htmlStart > 0 ? performance.now() - htmlStart : 0;
    const targetDelay = 650; // 0.65s intentional start delay
    return Math.max(0, Math.round(targetDelay - elapsed));
  };

  const initialDelay = useRef<number>(getInitialDelay());
  const [stage, setStage] = useState<'delay' | 'forming' | 'settle' | 'reveal' | 'complete'>(
    skipIntro ? 'reveal' : initialDelay.current > 0 ? 'delay' : 'forming'
  );
  const [canStartReveal, setCanStartReveal] = useState(skipIntro || loopMode);
  const [key, setKey] = useState(0);

  // Telemetry frame tracking
  const frameTimes = useRef<number[]>([]);
  const lastTime = useRef<number>(0);

  useEffect(() => {
    // Dismiss index.html splash overlay immediately once React mounts to prevent duplicate presentation
    const intro = document.getElementById('intro');
    console.log(`[STARTUP-TRACE] LaunchAnimationEngine: mount effect, #intro exists=${!!intro}`);
    if (intro) {
      intro.style.display = 'none';
      if (intro.parentNode) intro.parentNode.removeChild(intro);
      triggerIntroReveal();
      console.log(
        `[STARTUP-TRACE] LaunchAnimationEngine: removed #intro, triggered intro reveal at ${performance.now().toFixed(0)}ms`
      );
    }
  }, []);

  // Frame telemetry tracking
  useEffect(() => {
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
  }, [key]);

  // Stage transition orchestration: Delay -> Forming -> Settle -> Reveal -> Complete
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;

    if (stage === 'delay') {
      const waitMs = initialDelay.current;
      console.log(`[STARTUP-TRACE] LaunchAnimationEngine: waiting ${waitMs}ms start delay`);
      t = setTimeout(() => {
        console.log(
          `[STARTUP-TRACE] LaunchAnimationEngine: delay->forming transition at ${performance.now().toFixed(0)}ms`
        );
        setStage('forming');
      }, waitMs);
    } else if (stage === 'forming') {
      // Formation duration: 580ms
      t = setTimeout(() => {
        console.log(
          `[STARTUP-TRACE] LaunchAnimationEngine: forming->settle transition at ${performance.now().toFixed(0)}ms`
        );
        setStage('settle');
      }, 580);
    } else if (stage === 'settle') {
      // Settle hold duration: 220ms
      t = setTimeout(() => {
        console.log(
          `[STARTUP-TRACE] LaunchAnimationEngine: settle->reveal transition at ${performance.now().toFixed(0)}ms`
        );
        setStage('reveal');
      }, 220);
    } else if (stage === 'reveal') {
      // Wait for Hub to mount and paint before dissolving overlay
      const isComplete =
        loopMode ||
        (typeof window !== 'undefined' &&
          ((window as any).__studioStartupComplete ||
            !!document.querySelector('[data-livex-hub-root="true"]') ||
            !!document.getElementById('hub-root')));

      if (isComplete) {
        console.log(`[STARTUP-TRACE] LaunchAnimationEngine: Hub ready, dissolving overlay`);
        setCanStartReveal(true);
      } else {
        const unsub = StartupCoordinator.subscribeStartupComplete(() => {
          console.log(
            `[STARTUP-TRACE] LaunchAnimationEngine: received startup complete, dissolving overlay`
          );
          setCanStartReveal(true);
        });

        // Fail-safe watchdog fallback to guarantee transition out even if event is missed
        const fallbackTimer = setTimeout(() => {
          console.log(
            `[STARTUP-TRACE] LaunchAnimationEngine: watchdog triggered, dissolving overlay`
          );
          setCanStartReveal(true);
        }, 2000);

        return () => {
          unsub();
          clearTimeout(fallbackTimer);
        };
      }
    }

    return () => {
      clearTimeout(t);
    };
  }, [stage, loopMode]);

  // Strict AMOLED pure black (#000000)
  const bgColor = '#000000';

  // Sizing calibrated for mobile viewports (~196px standard, clamped between 160px and 220px)
  const symbolSize = Math.max(160, Math.min(220, Math.round(196 * scaleFactor)));
  const glowSize = Math.round(symbolSize * 1.5);

  // Motion states
  const isFormed =
    stage === 'forming' || stage === 'settle' || stage === 'reveal' || stage === 'complete';
  const containerAnimate = !canStartReveal ? { opacity: 1 } : { opacity: 0 };

  return (
    <motion.div
      key={key}
      initial={{ opacity: 1 }}
      animate={containerAnimate}
      transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
      onAnimationComplete={() => {
        if (canStartReveal && (stage === 'reveal' || stage === 'complete')) {
          if (loopMode) {
            setKey((prev) => prev + 1);
            setStage('forming');
            setCanStartReveal(false);
          } else {
            setStage('complete');
            console.log(
              `[STARTUP-TRACE] LaunchAnimationEngine: onComplete at ${performance.now().toFixed(0)}ms`
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
        willChange: 'transform, opacity',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        transformStyle: 'preserve-3d',
        transform: 'translateZ(0)',
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
        {/* Soft luminous ambient white glow behind mark */}
        <motion.div
          initial={{ opacity: 0, scale: 0.82 }}
          animate={
            canStartReveal
              ? { opacity: 0, scale: 1.05 }
              : isFormed
                ? { opacity: 0.8, scale: 1.0 }
                : { opacity: 0, scale: 0.82 }
          }
          transition={
            canStartReveal
              ? { duration: 0.32, ease: [0.4, 0, 0.2, 1] }
              : { duration: 0.58, ease: [0.16, 1, 0.3, 1] }
          }
          style={{
            position: 'absolute',
            width: glowSize,
            height: glowSize,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.03) 45%, transparent 70%)',
            filter: 'blur(24px)',
            pointerEvents: 'none',
            willChange: 'transform, opacity',
            transform: 'translateZ(0)',
          }}
        />

        {/* The Livex Logo Stage: Constructed from Form 1 and Form 2 */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            width: symbolSize,
            height: symbolSize,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            willChange: 'transform, opacity',
            transform: 'translateZ(0)',
          }}
        >
          {/* Form 1: Ascending Stem / Left Petal */}
          <motion.div
            initial={{ opacity: 0, x: -22, y: 32, scale: 0.94 }}
            animate={
              isFormed
                ? { opacity: 1, x: 0, y: 0, scale: 1 }
                : { opacity: 0, x: -22, y: 32, scale: 0.94 }
            }
            transition={{
              duration: 0.56,
              ease: [0.16, 1, 0.3, 1],
            }}
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              willChange: 'transform, opacity',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'translateZ(0)',
            }}
          >
            <img
              src={livexForm1Url}
              alt=""
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
                transform: 'translateZ(0)',
              }}
            />
          </motion.div>

          {/* Form 2: Lower Right Wing / Leaf Petal (converges with 50ms organic stagger) */}
          <motion.div
            initial={{ opacity: 0, x: 32, y: 16, scale: 0.92 }}
            animate={
              isFormed
                ? { opacity: 1, x: 0, y: 0, scale: 1 }
                : { opacity: 0, x: 32, y: 16, scale: 0.92 }
            }
            transition={{
              duration: 0.52,
              delay: 0.05,
              ease: [0.16, 1, 0.3, 1],
            }}
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              willChange: 'transform, opacity',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'translateZ(0)',
            }}
          >
            <img
              src={livexForm2Url}
              alt=""
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
                transform: 'translateZ(0)',
              }}
            />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
