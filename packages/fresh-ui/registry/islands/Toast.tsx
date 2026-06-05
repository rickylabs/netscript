/**
 * @component Toast
 * @layer 2
 * @depends theme-seed, toast-support
 * @description Redirect-flash notification island for Fresh applications.
 */

import { useEffect, useRef, useState } from 'preact/hooks';
import type { VNode } from 'preact';
import {
  type RegistryToast,
  type RegistryToastType,
  stripToastFromUrl,
} from '../lib/toast.ts';

interface ToastIslandProps extends Partial<RegistryToast> {
  cleanUrl?: string;
  duration?: number;
}

const TOAST_SYMBOLS: Record<RegistryToastType, string> = {
  success: '◎',
  error: '≠',
  warning: '⟳',
  info: '⊕',
};

const TOAST_LABELS: Record<RegistryToastType, string> = {
  success: 'Success',
  error: 'Error',
  warning: 'Warning',
  info: 'Notice',
};

/**
 * Renders a redirect-flash toast and cleans toast query params from the URL.
 * @param props Toast payload and timing overrides.
 * @returns A hydrated toast notification or `null` when inactive.
 */
export default function Toast(
  { message, title, type = 'info', duration = 4200, cleanUrl }: ToastIslandProps,
): VNode | null {
  const exitTimeoutRef = useRef<number>();
  const hideTimeoutRef = useRef<number>();
  const urlCleanupTimeoutRef = useRef<number>();
  const countdownStartedAtRef = useRef<number>(0);
  const remainingTimeRef = useRef<number>(duration);
  const [visible, setVisible] = useState(Boolean(message));
  const [exiting, setExiting] = useState(false);
  const [instanceKey, setInstanceKey] = useState('');
  const [paused, setPaused] = useState(false);

  const cleanup = () => {
    if (exitTimeoutRef.current) {
      window.clearTimeout(exitTimeoutRef.current);
    }

    if (hideTimeoutRef.current) {
      window.clearTimeout(hideTimeoutRef.current);
    }

    if (urlCleanupTimeoutRef.current) {
      window.clearTimeout(urlCleanupTimeoutRef.current);
    }
  };

  const normalizeBrowserUrl = () => {
    const targetUrl = cleanUrl ?? stripToastFromUrl(new URL(window.location.href));
    let attempts = 0;

    const applyCleanUrl = () => {
      const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;

      if (currentUrl !== targetUrl) {
        window.history.replaceState(window.history.state, '', targetUrl);
      }

      attempts += 1;

      if (attempts < 10) {
        urlCleanupTimeoutRef.current = window.setTimeout(applyCleanUrl, 50);
      }
    };

    applyCleanUrl();
  };

  const dismiss = () => {
    cleanup();
    setExiting(true);
    hideTimeoutRef.current = window.setTimeout(() => setVisible(false), 220);
  };

  const scheduleDismiss = (delay: number) => {
    if (delay <= 0) {
      dismiss();
      return;
    }

    countdownStartedAtRef.current = Date.now();
    exitTimeoutRef.current = window.setTimeout(() => dismiss(), delay);
  };

  const pauseDismiss = () => {
    if (paused || exiting) {
      return;
    }

    if (exitTimeoutRef.current) {
      const elapsed = Date.now() - countdownStartedAtRef.current;
      remainingTimeRef.current = Math.max(remainingTimeRef.current - elapsed, 0);
      window.clearTimeout(exitTimeoutRef.current);
      exitTimeoutRef.current = undefined;
    }

    setPaused(true);
  };

  const resumeDismiss = () => {
    if (!paused || exiting) {
      return;
    }

    setPaused(false);
    scheduleDismiss(remainingTimeRef.current);
  };

  useEffect(() => {
    if (!message) {
      cleanup();
      setVisible(false);
      return;
    }

    cleanup();
    setVisible(true);
    setExiting(false);
    setPaused(false);
    setInstanceKey(globalThis.crypto.randomUUID());
    remainingTimeRef.current = duration;
    normalizeBrowserUrl();
    scheduleDismiss(duration);

    return () => cleanup();
  }, [cleanUrl, duration, message, title, type]);

  if (!message || !visible) {
    return null;
  }

  return (
    <div key={instanceKey} class={`ns-toast-wrapper ${exiting ? 'ns-toast-exit' : 'ns-toast-enter'}`}>
      <div class={`ns-toast ns-toast--${type}`} onMouseEnter={pauseDismiss} onMouseLeave={resumeDismiss}>
        <div class='ns-toast__progress-track'>
          <div
            class='ns-toast__progress-bar'
            style={{
              animation: `ns-toast-progress ${duration}ms linear forwards`,
              animationPlayState: paused ? 'paused' : 'running',
            }}
          />
        </div>

        <div class='ns-toast__panel'>
          <div class='ns-toast__header'>
            <div class='ns-toast__title-row'>
              <div class='ns-toast__symbol'>{TOAST_SYMBOLS[type]}</div>
              <div class='min-w-0'>
                <p class='ns-toast__eyebrow'>{TOAST_LABELS[type]}</p>
                <p class='ns-toast__title'>{title ?? TOAST_LABELS[type]}</p>
              </div>
            </div>

            <button
              type='button'
              aria-label='Dismiss notification'
              class='ns-toast__dismiss'
              onClick={dismiss}
            >
              ×
            </button>
          </div>

          <p class='ns-toast__message'>{message}</p>
        </div>
      </div>
    </div>
  );
}
