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

/**
 * Resolves the initial theme without side effects. Order of authority:
 * an explicit `data-theme` already stamped by the host document, a stored
 * user preference, then the OS preference. Tokens are light-by-default,
 * so light is the fallback.
 */
function getInitialTheme(): ThemeMode {
  if (typeof document === 'undefined') {
    return 'light';
  }

  const stamped = document.documentElement.getAttribute('data-theme');

  if (stamped === 'light' || stamped === 'dark') {
    return stamped;
  }

  const stored = localStorage.getItem(STORAGE_KEY);

  if (stored === 'light' || stored === 'dark') {
    return stored;
  }

  return globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Switches the active document theme and persists explicit selections.
 * @returns A hydrated button that flips the `data-theme` attribute.
 */
export default function ThemeToggle(): VNode {
  const theme = useSignal<ThemeMode>(getInitialTheme());

  useEffect(() => {
    // Reflect the resolved theme on the document, but never persist it:
    // only an explicit user toggle writes to storage.
    document.documentElement.setAttribute('data-theme', theme.value);
  }, []);

  const toggle = () => {
    const next = theme.value === 'dark' ? 'light' : 'dark';
    theme.value = next;
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem(STORAGE_KEY, next);
  };

  return (
    <button
      type='button'
      onClick={toggle}
      class='ns-theme-toggle'
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
