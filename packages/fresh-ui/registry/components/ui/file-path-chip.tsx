/**
 * @component FilePathChip
 * @layer 2
 * @depends theme-seed, cn
 * @description Exact copyable path with real clipboard outcomes and stale-result protection.
 */
import type { JSX, VNode } from 'preact';
import { useId, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { Icon } from '@netscript/fresh-ui/primitives';
import { cn } from '../../lib/cn.ts';

const COPY_LABEL = 'Copy path';
const COPIED_LABEL = 'Path copied';
const ERROR_LABEL = 'Could not copy path';
type CopyPhase = 'rest' | 'pending' | 'copied' | 'error';

/** Path is native escaped text; state is derived from the actual copy request. */
export interface FilePathChipProps
  extends Omit<JSX.HTMLAttributes<HTMLSpanElement>, 'class' | 'children'> {
  path: string;
  copy?: boolean;
  copyLabel?: string;
  copiedLabel?: string;
  errorLabel?: string;
  class?: string;
}

/** A stale completion never changes feedback for a different path or a newer request. */
export function FilePathChip({
  path,
  copy = true,
  copyLabel = COPY_LABEL,
  copiedLabel = COPIED_LABEL,
  errorLabel = ERROR_LABEL,
  class: className,
  ...props
}: FilePathChipProps): VNode {
  const id = useId();
  const epoch = useRef(0);
  const input = useRef({ path, copy });
  const mounted = useRef(false);
  const [result, setResult] = useState<{ epoch: number; phase: CopyPhase }>({
    epoch: 0,
    phase: 'rest',
  });
  if (input.current.path !== path || input.current.copy !== copy) {
    input.current = { path, copy };
    epoch.current++;
  }
  useLayoutEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      epoch.current++;
    };
  }, []);
  const phase = copy && result.epoch === epoch.current ? result.phase : 'rest';
  const copyPath = async () => {
    const request = ++epoch.current;
    const exactPath = path;
    const current = () =>
      mounted.current && epoch.current === request && input.current.copy &&
      input.current.path === exactPath;
    setResult({ epoch: request, phase: 'pending' });
    try {
      const clipboard = globalThis.navigator?.clipboard;
      if (!clipboard?.writeText) throw new Error('Clipboard unavailable');
      await clipboard.writeText(exactPath);
    } catch {
      if (current()) setResult({ epoch: request, phase: 'error' });
      return;
    }
    if (current()) setResult({ epoch: request, phase: 'copied' });
  };
  return (
    <span
      {...props}
      class={cn('ns-file-path-chip', className)}
      data-scope='file-path-chip'
      data-part='root'
      data-state={phase === 'copied' ? 'copied' : 'rest'}
      aria-busy={phase === 'pending' ? 'true' : undefined}
    >
      <code id={id + '-path'} data-scope='file-path-chip' data-part='path'>{path}</code>
      {copy && (
        <button
          type='button'
          data-scope='file-path-chip'
          data-part='copy'
          aria-label={copyLabel.trim() ? copyLabel : COPY_LABEL}
          aria-describedby={id + '-path'}
          onClick={() => {
            void copyPath();
          }}
        >
          <Icon name={phase === 'copied' ? 'check' : 'copy'} size={14} />
        </button>
      )}
      <span
        role='status'
        aria-live='polite'
        aria-atomic='true'
        data-scope='file-path-chip'
        data-part='status'
        class={phase === 'error' ? 'ns-file-path-chip__error' : 'ns-file-path-chip__sr'}
      >
        {phase === 'copied'
          ? (copiedLabel.trim() ? copiedLabel : COPIED_LABEL)
          : phase === 'error'
          ? (errorLabel.trim() ? errorLabel : ERROR_LABEL)
          : ''}
      </span>
    </span>
  );
}
