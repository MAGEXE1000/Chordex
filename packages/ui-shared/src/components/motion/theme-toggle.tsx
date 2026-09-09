'use client';
// beui.dev/components/motion/theme-toggle

import { Moon, Sun, Eclipse } from 'lucide-react';
import { useSettingsStore, settingsController } from '@workspace/studio-core';
import { useReducedMotion } from 'motion/react';
import { useEffect, useState, type ComponentPropsWithoutRef } from 'react';
import { ActionSwapIcon } from './action-swap';
import { cn } from '../../lib/utils';

export type ThemeVariant = 'rectangle' | 'circle' | 'circle-blur' | 'blinds';

export type RectStart =
  'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center' | 'bottom-up';

export interface ThemeToggleProps extends Omit<
  ComponentPropsWithoutRef<'button'>,
  'children' | 'onClick'
> {
  /** Animation variant. Default: "rectangle". */
  variant?: ThemeVariant;
  /** Origin direction for the reveal. Default: "bottom-up". */
  start?: RectStart;
  iconClassName?: string;
}

export function useThemeToggle({
  variant = 'rectangle',
  start = 'bottom-up',
}: { variant?: ThemeVariant; start?: RectStart } = {}) {
  const theme = useSettingsStore((s) => s.settings.theme);
  const amoledMode = useSettingsStore((s) => s.settings.amoledMode);
  const reduce = useReducedMotion() ?? false;
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Canonical three-state mode — source of truth for icon + aria label.
  const themeMode: 'light' | 'dark' | 'amoled' = !mounted
    ? 'dark'
    : theme === 'light'
      ? 'light'
      : amoledMode
        ? 'amoled'
        : 'dark';

  const cycleTheme = () => {
    settingsController.cycleNextTheme();
  };

  const toggle = () => {
    if (reduce || !('startViewTransition' in document)) {
      cycleTheme();
      return;
    }

    (
      document as Document & {
        startViewTransition(cb: () => void): { finished: Promise<void> };
      }
    ).startViewTransition(() => cycleTheme());
  };

  return { themeMode, mounted, toggle };
}

export function ThemeToggle({
  variant = 'rectangle',
  start = 'bottom-up',
  className,
  iconClassName,
  ...rest
}: ThemeToggleProps) {
  const { themeMode, mounted, toggle } = useThemeToggle({ variant, start });

  const ariaLabel = mounted
    ? themeMode === 'light'
      ? 'Switch to dark mode'
      : themeMode === 'dark'
        ? 'Switch to AMOLED mode'
        : 'Switch to light mode'
    : 'Switch theme';

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={toggle}
      className={cn('flex items-center justify-center', className)}
      {...rest}
    >
      {mounted ? (
        <ActionSwapIcon value={themeMode} animation="blur" className={iconClassName}>
          {themeMode === 'light' ? (
            <Sun className={iconClassName} />
          ) : themeMode === 'dark' ? (
            <Moon className={iconClassName} />
          ) : (
            <Eclipse className={iconClassName} />
          )}
        </ActionSwapIcon>
      ) : (
        <span className={iconClassName} aria-hidden="true" />
      )}
    </button>
  );
}
