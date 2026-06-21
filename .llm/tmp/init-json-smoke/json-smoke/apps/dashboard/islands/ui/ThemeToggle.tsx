/**
 * @component ThemeToggle
 * @layer 2
 * @depends theme-seed
 * @description Generic Fresh island for dark/light theme switching.
 */

import { useSignal } from '@preact/signals';
import type { VNode } from 'preact';
import { useEffect } from 'preact/hooks';

type ThemeMode = 'dark' | 'light';

const STORAGE_KEY = 'ns-theme';

function getInitialTheme(): ThemeMode {
  if (typeof document === 'undefined') {
    return 'dark';
  }

  const stored = localStorage.getItem(STORAGE_KEY);

  if (stored === 'light' || stored === 'dark') {
    return stored;
  }

  return globalThis.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function applyTheme(theme: ThemeMode) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(STORAGE_KEY, theme);
}

/**
 * Switches the active document theme and persists the selection locally.
 * @returns A hydrated button that flips the `data-theme` attribute.
 */
export default function ThemeToggle(): VNode {
  const theme = useSignal<ThemeMode>(getInitialTheme());

  useEffect(() => {
    applyTheme(theme.value);
  }, []);

  const toggle = () => {
    const next = theme.value === 'dark' ? 'light' : 'dark';
    theme.value = next;
    applyTheme(next);
  };

  return (
    <button
      type='button'
      onClick={toggle}
      class='inline-flex h-9 w-9 items-center justify-center rounded-md border border-ns-border bg-transparent text-ns-muted-fg transition-colors duration-150 hover:border-ns-border-hover hover:bg-ns-surface-raised hover:text-ns-fg'
      aria-label={`Switch to ${theme.value === 'dark' ? 'light' : 'dark'} mode`}
      title={`Switch to ${theme.value === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme.value === 'dark'
        ? (
          <svg
            width='16'
            height='16'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          >
            <circle cx='12' cy='12' r='5' />
            <line x1='12' y1='1' x2='12' y2='3' />
            <line x1='12' y1='21' x2='12' y2='23' />
            <line x1='4.22' y1='4.22' x2='5.64' y2='5.64' />
            <line x1='18.36' y1='18.36' x2='19.78' y2='19.78' />
            <line x1='1' y1='12' x2='3' y2='12' />
            <line x1='21' y1='12' x2='23' y2='12' />
            <line x1='4.22' y1='19.78' x2='5.64' y2='18.36' />
            <line x1='18.36' y1='5.64' x2='19.78' y2='4.22' />
          </svg>
        )
        : (
          <svg
            width='16'
            height='16'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          >
            <path d='M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z' />
          </svg>
        )}
    </button>
  );
}
