/**
 * @component Collapsible
 * @layer 2
 * @depends theme-seed
 * @description Native details disclosure with optional controlled state.
 */
import type { ComponentChildren, JSX, VNode } from 'preact';
import { useState } from 'preact/hooks';
import { cn } from '../../lib/cn.ts';

export interface CollapsibleProps
  extends Omit<JSX.DetailsHTMLAttributes<HTMLDetailsElement>, 'open' | 'class'> {
  label: ComponentChildren;
  children: ComponentChildren;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  class?: string;
}

/** Summary supplies Enter/Space semantics without a custom keyboard handler. */
export function Collapsible({
  label,
  children,
  open,
  defaultOpen = false,
  onOpenChange,
  disabled = false,
  class: className,
  onToggle,
  ...props
}: CollapsibleProps): VNode {
  const [local, setLocal] = useState(defaultOpen);
  const expanded = open ?? local;
  const change = (next: boolean) => {
    if (disabled || next === expanded) return;
    if (open === undefined) setLocal(next);
    onOpenChange?.(next);
  };
  return (
    <details
      {...props}
      class={cn('ns-collapsible', className)}
      open={expanded}
      data-scope='collapsible'
      data-part='root'
      data-open={String(expanded)}
      data-state={disabled ? 'disabled' : 'rest'}
      onToggle={(event) => {
        onToggle?.(event);
        if (event.currentTarget.open !== expanded) {
          change(event.currentTarget.open);
          if (disabled || open !== undefined) event.currentTarget.open = expanded;
        }
      }}
    >
      <summary
        data-scope='collapsible'
        data-part='trigger'
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : 0}
        onClick={(event) => {
          event.preventDefault();
          change(!expanded);
        }}
      >
        <span data-scope='collapsible' data-part='label'>{label}</span>
        <span aria-hidden='true' data-scope='collapsible' data-part='indicator'>
          {expanded ? '⌃' : '⌄'}
        </span>
      </summary>
      <div data-scope='collapsible' data-part='content'>{children}</div>
    </details>
  );
}
