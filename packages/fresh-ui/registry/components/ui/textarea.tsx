/**
 * @component Textarea
 * @layer 2
 * @depends theme-seed
 * @description Generic multi-line text input with semantic token-driven states.
 */

import type { JSX, VNode } from 'preact';
import { cn } from '../../lib/cn.ts';

interface TextareaProps extends Omit<JSX.TextareaHTMLAttributes<HTMLTextAreaElement>, 'class'> {
  class?: string;
  error?: boolean;
}

/**
 * Renders a token-aware multiline text input.
 */
export function Textarea({ class: className, error = false, ...props }: TextareaProps): VNode {
  return (
    <textarea
      {...props}
      class={cn('ns-textarea', className)}
      data-invalid={error ? 'true' : undefined}
      data-state={error ? 'invalid' : props.disabled ? 'disabled' : 'rest'}
      data-part='root'
      data-scope='textarea'
      data-content={props.value !== undefined || props.defaultValue !== undefined
        ? 'value'
        : 'placeholder'}
    />
  );
}
