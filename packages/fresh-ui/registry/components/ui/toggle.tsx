/**
 * @component Toggle
 * @layer 2
 * @depends theme-seed
 * @description Native pressed button with controlled or local selection.
 */
import type { ComponentChildren, JSX, VNode } from 'preact';
import { useState } from 'preact/hooks';
import { cn } from '../../lib/cn.ts';

/** A toggle uses native Enter/Space activation and announces aria-pressed. */
export interface ToggleProps
  extends Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, 'class' | 'size'> {
  class?: string;
  variant?: 'default' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  selected?: boolean;
  defaultSelected?: boolean;
  onSelectedChange?: (selected: boolean) => void;
  state?: 'rest' | 'hover' | 'focus' | 'disabled';
  label?: boolean;
  iconStart?: boolean;
  iconEnd?: boolean;
  iconStartGlyph?: ComponentChildren;
  iconEndGlyph?: ComponentChildren;
}

/** Render a pressed button; app islands hydrate the optional local state. */
export function Toggle({
  class: className,
  variant = 'default',
  size = 'md',
  selected,
  defaultSelected = false,
  onSelectedChange,
  state = 'rest',
  label = true,
  iconStart = true,
  iconEnd = true,
  iconStartGlyph,
  iconEndGlyph,
  children,
  disabled = false,
  onClick,
  ...props
}: ToggleProps): VNode {
  const [local, setLocal] = useState(defaultSelected);
  const pressed = selected ?? local;
  const unavailable = disabled || state === 'disabled';
  return (
    <button
      {...props}
      type={props.type ?? 'button'}
      class={cn('ns-toggle', className)}
      disabled={unavailable}
      aria-pressed={pressed}
      data-part='root'
      data-scope='toggle'
      data-variant={variant}
      data-size={size}
      data-selected={String(pressed)}
      data-state={unavailable ? 'disabled' : state}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented || unavailable) return;
        if (selected === undefined) setLocal(!pressed);
        onSelectedChange?.(!pressed);
      }}
    >
      {iconStart && iconStartGlyph != null && (
        <span data-scope='toggle' data-part='icon-start' aria-hidden='true'>{iconStartGlyph}</span>
      )}
      {label && <span data-scope='toggle' data-part='label'>{children}</span>}
      {iconEnd && iconEndGlyph != null && (
        <span data-scope='toggle' data-part='icon-end' aria-hidden='true'>{iconEndGlyph}</span>
      )}
    </button>
  );
}
