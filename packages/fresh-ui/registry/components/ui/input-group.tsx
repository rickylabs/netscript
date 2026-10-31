/**
 * @component InputGroup
 * @layer 2
 * @depends theme-seed
 * @description Native control/addon composition; disabled fieldsets disable child controls.
 */
import type { ComponentChildren, JSX, VNode } from 'preact';
import { cn } from '../../lib/cn.ts';

/** Pass a real Input/Textarea and native addon controls; no key events are intercepted. */
export interface InputGroupProps extends Omit<JSX.HTMLAttributes<HTMLFieldSetElement>, 'class'> {
  control: ComponentChildren;
  addon?: ComponentChildren;
  text?: ComponentChildren;
  align?: 'inline-start' | 'inline-end' | 'block-start' | 'block-end';
  state?: 'rest' | 'focus' | 'disabled' | 'invalid';
  class?: string;
}

/**
 * Group a native editable control with optional surrounding actions or text.
 * For invalid controls, supply aria-invalid/aria-describedby on the control slot itself.
 */
export function InputGroup(
  { control, addon, text, align = 'inline-start', state = 'rest', class: className, ...props }:
    InputGroupProps,
): VNode {
  const addonNode = (addon != null || text != null) && (
    <span data-scope='input-group' data-part='addon'>
      {addon}
      {text != null && <span data-scope='input-group' data-part='text'>{text}</span>}
    </span>
  );
  const controlNode = <span data-scope='input-group' data-part='control'>{control}</span>;
  return (
    <fieldset
      {...props}
      class={cn('ns-input-group', className)}
      disabled={state === 'disabled'}
      data-scope='input-group'
      data-part='root'
      data-align={align}
      data-state={state}
      aria-invalid={state === 'invalid' || undefined}
    >
      {align.endsWith('end') ? <>{controlNode}{addonNode}</> : <>{addonNode}{controlNode}</>}
    </fieldset>
  );
}
