/**
 * @component AttributeChip
 * @layer 2
 * @depends theme-seed, cn
 * @description Escaped textual attribute example in two presentation sizes.
 */
import type { JSX, VNode } from 'preact';
import { cn } from '../../lib/cn.ts';

/** Scalar values are stringified as native escaped text, never inserted as HTML. */
export interface AttributeChipProps
  extends Omit<JSX.HTMLAttributes<HTMLSpanElement>, 'class' | 'children'> {
  name: string;
  value: string | number | boolean | null;
  size?: 'sm' | 'md';
  class?: string;
}

/** Display code rather than editing or applying an attribute to the document. */
export function AttributeChip(
  { name, value, size = 'md', class: className, ...props }: AttributeChipProps,
): VNode {
  return (
    <span
      {...props}
      class={cn('ns-attribute-chip', className)}
      data-scope='attribute-chip'
      data-part='root'
      data-size={size}
    >
      <span data-scope='attribute-chip' data-part='name'>{name + '='}</span>
      <span data-scope='attribute-chip' data-part='value'>{JSON.stringify(String(value))}</span>
    </span>
  );
}
