/**
 * @component Alert
 * @layer 2
 * @depends theme-seed
 * @description Persistent feedback banner with optional native dismissal and controlled visibility.
 */

import type { JSX, VNode } from 'preact';
import { useState } from 'preact/hooks';
import { Icon, type IconName } from '@netscript/fresh-ui/primitives';
import { cn } from '../../lib/cn.ts';
import type { Renderable } from '../../lib/public-types.ts';

/** Semantic feedback tones; the original four names remain supported. */
export type AlertVariant = 'neutral' | 'info' | 'success' | 'warning' | 'destructive' | 'important';
/** Strong emphasis replaces the box edge with a leading rule on the neutral surface. */
export type AlertEmphasis = 'subtle' | 'strong';

type AlertProps = Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'children' | 'title'> & {
  children?: Renderable;
  class?: string;
  /** False hides the decorative glyph; custom content replaces the default. */
  icon?: Renderable;
  /** Omitted uses the localized tone label; false/null keeps it visually hidden. */
  title?: Renderable;
  /** Localized default tone name, including the visually hidden fallback. */
  toneLabel?: string;
  /** Explicit description takes precedence over legacy children. */
  description?: Renderable;
  action?: Renderable;
  variant?: AlertVariant;
  emphasis?: AlertEmphasis;
  close?: boolean;
  closeLabel?: string;
  open?: boolean;
  defaultOpen?: boolean;
  /** A dismissal request; a controlled owner may refuse by leaving open unchanged. */
  onOpenChange?: (open: boolean) => void;
};

const DEFAULT_ICONS: Record<AlertVariant, IconName> = {
  neutral: 'info',
  info: 'info',
  success: 'circle-check',
  warning: 'alert-triangle',
  destructive: 'circle-alert',
  important: 'bell',
};

const DEFAULT_LABELS: Record<AlertVariant, string> = {
  neutral: 'Note',
  info: 'Info',
  success: 'Success',
  warning: 'Warning',
  destructive: 'Error',
  important: 'Important',
};

/**
 * Renders feedback without moving focus on mount. Native hidden removes closed
 * content from layout, keyboard traversal and the accessibility tree.
 */
export function Alert({
  children,
  class: className,
  icon,
  role,
  title,
  toneLabel,
  description,
  action,
  variant = 'info',
  emphasis = 'subtle',
  close = false,
  closeLabel = 'Dismiss notification',
  open,
  defaultOpen = true,
  onOpenChange,
  hidden,
  ...props
}: AlertProps): VNode {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const visible = open ?? internalOpen;
  const resolvedRole = role ??
    (variant === 'warning' || variant === 'destructive' ? 'alert' : 'status');
  const content = description ?? children;
  const label = toneLabel?.trim() || DEFAULT_LABELS[variant];
  const hideLabel = title === false || title === null;

  return (
    <div
      {...props}
      role={resolvedRole}
      hidden={!visible || hidden}
      class={cn('ns-alert', className)}
      data-variant={variant}
      data-emphasis={emphasis}
      data-state={visible ? 'open' : 'closed'}
      data-part='root'
      data-scope='alert'
    >
      {icon !== false && (
        <span aria-hidden='true' class='ns-alert__icon' data-part='icon' data-scope='alert'>
          {icon == null || icon === true ? <Icon name={DEFAULT_ICONS[variant]} /> : icon}
        </span>
      )}
      <div class='ns-alert__body' data-part='body' data-scope='alert'>
        <div
          class={hideLabel ? 'ns-alert__sr-label' : 'ns-alert__title'}
          data-part='title'
          data-scope='alert'
        >
          {hideLabel || title === undefined ? label : title}
        </div>
        {content != null && content !== false && (
          <div class='ns-alert__description' data-part='description' data-scope='alert'>
            {content}
          </div>
        )}
        {action != null && action !== false && (
          <div class='ns-alert__actions' data-part='actions' data-scope='alert'>{action}</div>
        )}
      </div>
      {close && (
        <button
          type='button'
          aria-label={closeLabel}
          class='ns-alert__close'
          data-part='close'
          data-scope='alert'
          onClick={() => {
            if (open === undefined) setInternalOpen(false);
            onOpenChange?.(false);
          }}
        >
          <Icon name='x' />
        </button>
      )}
    </div>
  );
}
