/**
 * @component ToolCallCard
 * @layer 2
 * @depends theme-seed
 * @description Inline MCP/tool invocation + result as a native <details>
 * disclosure: name, status badge, and an args/result panel.
 */

import type { JSX, VNode } from 'preact';
import { cn } from '../../lib/cn.ts';
import { Badge, type BadgeVariant } from './badge.tsx';
import { Spinner } from './spinner.tsx';

/**
 * Lifecycle state of a tool call.
 */
export type ToolCallStatus = 'running' | 'done' | 'error';

interface ToolCallCardProps extends Omit<JSX.HTMLAttributes<HTMLDetailsElement>, 'class'> {
  /** Fully-qualified tool name, e.g. `pkg.fn`. */
  name: string;
  /** Serialized invocation arguments. */
  args?: string;
  /** Serialized result payload. */
  result?: string;
  /** Lifecycle status. */
  status: ToolCallStatus;
  /** Open the disclosure by default. */
  defaultOpen?: boolean;
  class?: string;
}

const STATUS_VARIANT: Record<ToolCallStatus, BadgeVariant> = {
  running: 'warning',
  done: 'success',
  error: 'destructive',
};

const STATUS_LABEL: Record<ToolCallStatus, string> = {
  running: 'Running',
  done: 'Done',
  error: 'Error',
};

/**
 * Renders a collapsible tool-call card with status and IO panel.
 */
export function ToolCallCard(
  { name, args, result, status, defaultOpen, class: className, ...props }: ToolCallCardProps,
): VNode {
  return (
    <details
      {...props}
      open={defaultOpen}
      class={cn('ns-tool-call', className)}
      data-part='root'
      data-scope='tool-call-card'
      data-status={status}
    >
      <summary data-part='summary' data-scope='tool-call-card'>
        <span
          class='ns-tool-call__icon'
          data-part='icon'
          data-scope='tool-call-card'
          aria-hidden='true'
        >
          ƒ
        </span>
        <span class='ns-tool-call__name' data-part='name' data-scope='tool-call-card'>{name}</span>
        {status === 'running' ? <Spinner size='sm' /> : null}
        <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>
        <span
          class='ns-tool-call__chevron'
          data-part='chevron'
          data-scope='tool-call-card'
          aria-hidden='true'
        >
          ▾
        </span>
      </summary>
      <div class='ns-tool-call__panel' data-part='panel' data-scope='tool-call-card'>
        {args
          ? (
            <div class='ns-tool-call__io' data-part='io' data-scope='tool-call-card'>
              <span class='ns-tool-call__io-label' data-part='io-label' data-scope='tool-call-card'>
                args
              </span>
              <pre data-part='pre' data-scope='tool-call-card'>{args}</pre>
            </div>
          )
          : null}
        {result
          ? (
            <div class='ns-tool-call__io' data-part='io' data-scope='tool-call-card'>
              <span class='ns-tool-call__io-label' data-part='io-label' data-scope='tool-call-card'>
                result
              </span>
              <pre data-part='pre' data-scope='tool-call-card'>{result}</pre>
            </div>
          )
          : null}
      </div>
    </details>
  );
}
