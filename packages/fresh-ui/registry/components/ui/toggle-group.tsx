/**
 * @component ToggleGroup
 * @layer 2
 * @depends theme-seed toggle
 * @description Roving toolbar of single- or multiple-selection pressed buttons.
 */
import type { ComponentChildren, JSX, VNode } from 'preact';
import { useState } from 'preact/hooks';
import { cn } from '../../lib/cn.ts';
import { Toggle } from './toggle.tsx';

/** An action's stable value is separate from its accessible label. */
export interface ToggleGroupItem {
  value: string;
  label: ComponentChildren;
  disabled?: boolean;
}

/** Controlled selection can be supplied without changing focus navigation. */
export interface ToggleGroupProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class'> {
  class?: string;
  label: string;
  items: readonly ToggleGroupItem[];
  type?: 'single' | 'multiple';
  variant?: 'default' | 'outline' | 'segmented';
  orientation?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md';
  value?: readonly string[];
  defaultValue?: readonly string[];
  onValueChange?: (value: readonly string[]) => void;
  disabled?: boolean;
}

/**
 * Arrow/Home/End move focus; native Enter/Space activate the focused toggle.
 * Render inside a Fresh island to hydrate selection and focus navigation.
 */
export function ToggleGroup({
  class: className,
  label,
  items,
  type = 'single',
  variant = 'default',
  orientation = 'horizontal',
  size = 'md',
  value,
  defaultValue = [],
  onValueChange,
  disabled = false,
  onKeyDown,
  ...props
}: ToggleGroupProps): VNode {
  const [local, setLocal] = useState(defaultValue);
  const [focused, setFocused] = useState<string | undefined>();
  const selected = value ?? local;
  const enabled = items.filter((item) => !disabled && !item.disabled);
  const tabStop = enabled.some((item) => item.value === focused) ? focused : enabled[0]?.value;
  const toggles = items.map((item) => (
    <Toggle
      key={item.value}
      selected={selected.includes(item.value)}
      disabled={disabled || item.disabled}
      variant={variant === 'outline' ? 'outline' : 'default'}
      size={size}
      tabIndex={item.value === tabStop ? 0 : -1}
      onFocus={() => setFocused(item.value)}
      onSelectedChange={(pressed) => {
        const next = type === 'single'
          ? (pressed ? [item.value] : [])
          : pressed
          ? [...selected.filter((entry) => entry !== item.value), item.value]
          : selected.filter((entry) => entry !== item.value);
        if (value === undefined) setLocal(next);
        onValueChange?.(next);
      }}
    >
      {item.label}
    </Toggle>
  ));
  return (
    <div
      {...props}
      class={cn('ns-toggle-group', className)}
      role='toolbar'
      aria-label={label}
      aria-orientation={orientation}
      aria-disabled={disabled || undefined}
      data-scope='toggle-group'
      data-part='root'
      data-variant={variant}
      data-orientation={orientation}
      data-size={size}
      data-type={type}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented) return;
        const buttons = [...event.currentTarget.querySelectorAll<HTMLButtonElement>(
          '[data-scope="toggle"][data-part="root"]:not(:disabled)',
        )];
        const index = buttons.indexOf(event.target as HTMLButtonElement);
        if (index < 0 || !buttons.length) return;
        const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
        const previous = orientation === 'vertical' ? 'ArrowUp' : rtl ? 'ArrowRight' : 'ArrowLeft';
        const next = orientation === 'vertical' ? 'ArrowDown' : rtl ? 'ArrowLeft' : 'ArrowRight';
        let target: number;
        if (event.key === 'Home') target = 0;
        else if (event.key === 'End') target = buttons.length - 1;
        else if (event.key === previous) target = (index + buttons.length - 1) % buttons.length;
        else if (event.key === next) target = (index + 1) % buttons.length;
        else return;
        event.preventDefault();
        buttons[target].focus();
      }}
    >
      {variant === 'segmented'
        ? <div data-scope='toggle-group' data-part='track'>{toggles}</div>
        : toggles}
    </div>
  );
}
