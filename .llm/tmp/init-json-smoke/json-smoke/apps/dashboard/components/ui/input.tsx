/**
 * @component Input
 * @layer 2
 * @depends theme-seed
 * @description Generic text input with semantic token-driven states.
 */

import type { JSX, VNode } from 'preact';
import { cn } from '../../lib/cn.ts';

interface InputProps extends Omit<JSX.InputHTMLAttributes<HTMLInputElement>, 'type' | 'class'> {
  type?: JSX.HTMLInputTypeAttribute;
  class?: string;
  error?: boolean;
  readonly [key: `data-${string}`]: string | number | boolean | undefined;
}

/**
 * Renders a token-aware text input.
 */
export function Input(
  { type = 'text', class: className, error = false, ...props }: InputProps,
): VNode {
  return (
    <input
      {...props}
      type={type}
      class={cn('ns-input', error && 'ns-input--error', className)}
    />
  );
}
