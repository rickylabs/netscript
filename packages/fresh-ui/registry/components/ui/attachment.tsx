/**
 * @component Attachment
 * @layer 2
 * @depends theme-seed
 * @description Media and caller-owned transfer state with independent native actions.
 */
import type { ComponentChildren, JSX, VNode } from 'preact';
import { Icon } from '@netscript/fresh-ui/primitives';
import { cn } from '../../lib/cn.ts';

/** Transfer state is supplied by the application, never inferred or fetched. */
export type AttachmentState = 'idle' | 'uploading' | 'processing' | 'error' | 'done';
/** Ledger sizes control padding and media geometry. */
export type AttachmentSize = 'default' | 'sm' | 'xs';
const STATE_LABELS: Readonly<Record<Exclude<AttachmentState, 'idle'>, string>> = {
  uploading: 'Uploading',
  processing: 'Processing',
  error: 'Error',
  done: 'Done',
};

/** Media alt text, progress and action handlers belong to the caller. */
export interface AttachmentProps
  extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'title' | 'size' | 'class' | 'children'> {
  title: ComponentChildren;
  description?: ComponentChildren;
  media?: ComponentChildren;
  actions?: ComponentChildren;
  progress?: ComponentChildren;
  state?: AttachmentState;
  stateLabel?: string;
  size?: AttachmentSize;
  orientation?: 'horizontal' | 'vertical';
  class?: string;
}

/** Compact visual descriptions remain readable by assistive technology. */
export function Attachment({
  title,
  description,
  media,
  actions,
  progress,
  state = 'idle',
  stateLabel,
  size = 'default',
  orientation = 'horizontal',
  class: className,
  ...props
}: AttachmentProps): VNode {
  const compact = size === 'xs' && orientation === 'horizontal';
  const stateIcon = state !== 'idle'
    ? (
      <span
        class='ns-attachment__state'
        data-scope='attachment'
        data-part='state-icon'
        aria-hidden='true'
      >
        {state === 'error'
          ? <Icon name='circle-alert' size={14} />
          : state === 'done'
          ? <Icon name='check' size={14} />
          : <span />}
      </span>
    )
    : null;
  return (
    <div
      {...props}
      class={cn('ns-attachment', className)}
      data-scope='attachment'
      data-part='root'
      data-state={state}
      data-size={size}
      data-orientation={orientation}
    >
      {media != null && <div data-scope='attachment' data-part='media'>{media}</div>}
      <div data-scope='attachment' data-part='content'>
        <div data-scope='attachment' data-part='title'>{title}</div>
        <div class='ns-attachment__description'>
          {!compact && stateIcon}
          {description != null && (
            <div
              class={compact ? 'ns-attachment__sr' : undefined}
              data-scope='attachment'
              data-part='description'
            >
              {description}
            </div>
          )}
        </div>
        {!compact && progress != null && (
          <div data-scope='attachment' data-part='progress'>{progress}</div>
        )}
      </div>
      {state !== 'idle' && (
        <span class='ns-attachment__sr' data-scope='attachment' data-part='state-label'>
          {stateLabel?.trim() ? stateLabel : STATE_LABELS[state]}
        </span>
      )}
      {compact && stateIcon}
      {actions != null && <div data-scope='attachment' data-part='actions'>{actions}</div>}
    </div>
  );
}
