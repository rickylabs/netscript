/**
 * @component Trace
 * @layer 2
 * @depends theme-seed
 * @description Caller-owned run status with native ordered step disclosures.
 */
import type { ComponentChildren, JSX, VNode } from 'preact';
import { useLayoutEffect, useRef, useState } from 'preact/hooks';
import { Icon } from '@netscript/fresh-ui/primitives';
import { cn } from '../../lib/cn.ts';

/** A step may wait; the aggregate reports running, done or error. */
export type TraceLineStatus = 'done' | 'running' | 'pending' | 'error';
/** Aggregate run statuses from the completed Figma ledger. */
export type TraceStatus = Exclude<TraceLineStatus, 'pending'>;
const STATUS_LABELS: Readonly<Record<TraceLineStatus, string>> = {
  done: 'Done',
  running: 'Running',
  pending: 'Pending',
  error: 'Error',
};

/** Trace groups LI children without owning an agent or asynchronous work. */
export interface TraceProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'title' | 'class'> {
  status?: TraceStatus;
  statusLabel?: string;
  title?: ComponentChildren;
  duration?: ComponentChildren;
  class?: string;
}

/** Line is an LI: place it in Trace or a native list, with presentation-only title content. */
export interface TraceLineProps extends Omit<JSX.HTMLAttributes<HTMLLIElement>, 'title' | 'class'> {
  title: ComponentChildren;
  description?: ComponentChildren;
  duration?: ComponentChildren;
  status?: TraceLineStatus;
  statusLabel?: string;
  collapsible?: boolean;
  connector?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  class?: string;
}

/** A plain ordered list preserves useful server-rendered content. */
function TraceRoot({
  status = 'running',
  statusLabel,
  title,
  duration,
  children,
  class: className,
  ...props
}: TraceProps): VNode {
  return (
    <div
      {...props}
      class={cn('ns-trace', className)}
      data-scope='trace'
      data-part='root'
      data-status={status}
    >
      <span class='ns-trace__sr' data-scope='trace' data-part='status-label'>
        {statusLabel?.trim() ? statusLabel : STATUS_LABELS[status]}
      </span>
      {(title != null || duration != null) && (
        <div class='ns-trace__header' data-scope='trace' data-part='header'>
          {title != null && <span data-scope='trace' data-part='title'>{title}</span>}
          {duration != null && <span data-scope='trace' data-part='duration'>{duration}</span>}
        </div>
      )}
      <ol data-scope='trace' data-part='list'>{children}</ol>
    </div>
  );
}

/** Native summary handles Enter/Space; controlled proposals never leave refused physical state. */
function TraceLine({
  title,
  description,
  duration,
  status = 'pending',
  statusLabel,
  collapsible = false,
  connector = true,
  open,
  defaultOpen = false,
  onOpenChange,
  children,
  class: className,
  ...props
}: TraceLineProps): VNode {
  const [local, setLocal] = useState(defaultOpen);
  const details = useRef<HTMLDetailsElement>(null);
  const expanded = collapsible && (open ?? local);
  // Preact can skip an unchanged open prop after an external native mutation.
  useLayoutEffect(() => {
    if (details.current && details.current.open !== expanded) details.current.open = expanded;
  });
  const change = (next: boolean) => {
    if (next === expanded) return;
    if (open === undefined) setLocal(next);
    onOpenChange?.(next);
  };
  const summary = (
    <>
      <span class='ns-trace__status' data-scope='trace' data-part='icon' aria-hidden='true'>
        {status === 'done'
          ? <Icon name='check' size={14} />
          : status === 'error'
          ? <Icon name='circle-alert' size={14} />
          : <span />}
      </span>
      <span data-scope='trace' data-part='title'>{title}</span>
      <span class='ns-trace__sr' data-scope='trace' data-part='status-label'>
        {statusLabel?.trim() ? statusLabel : STATUS_LABELS[status]}
      </span>
      {duration != null && <span data-scope='trace' data-part='duration'>{duration}</span>}
      {collapsible && <Icon name={expanded ? 'chevron-up' : 'chevron-down'} size={14} />}
      {description != null && <span data-scope='trace' data-part='description'>{description}</span>}
    </>
  );
  return (
    <li
      {...props}
      class={cn('ns-trace__line', className)}
      data-scope='trace'
      data-part='line'
      data-status={status}
      data-open={String(expanded)}
      data-collapsible={String(collapsible)}
      data-connector={String(connector)}
    >
      {connector && (
        <span
          class='ns-trace__connector'
          data-scope='trace'
          data-part='connector'
          aria-hidden='true'
        />
      )}
      {collapsible
        ? (
          <details
            ref={details}
            open={expanded}
            data-scope='trace'
            data-part='disclosure'
            onToggle={(event) => {
              const next = event.currentTarget.open;
              if (next === expanded) return;
              // Restore before invoking the owner so refusal never leaves native state detached.
              if (open !== undefined) event.currentTarget.open = expanded;
              change(next);
            }}
          >
            <summary
              class='ns-trace__summary'
              data-scope='trace'
              data-part='collapsible-trigger'
              onClick={(event) => {
                if (event.defaultPrevented) return;
                event.preventDefault();
                change(!expanded);
              }}
            >
              {summary}
            </summary>
            <div data-scope='trace' data-part='collapsible-content'>{children}</div>
          </details>
        )
        : (
          <>
            <div class='ns-trace__summary'>{summary}</div>
            {children != null && (
              <div data-scope='trace' data-part='collapsible-content'>{children}</div>
            )}
          </>
        )}
    </li>
  );
}

/** Caller-owned ordered steps with optional native disclosure output. */
export const Trace: ((props: TraceProps) => VNode) & { Line: typeof TraceLine } = Object.assign(
  TraceRoot,
  { Line: TraceLine },
);
