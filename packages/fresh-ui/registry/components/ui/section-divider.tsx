import type { JSX, VNode } from 'preact';
import { cn } from '../../lib/cn.ts';
import type { Renderable } from '../../lib/public-types.ts';

interface SectionDividerProps
  extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'children'> {
  label: Renderable;
  class?: string;
  lineClass?: string;
}

/**
 * Renders a labeled divider for detail and form sections.
 */
export function SectionDivider(
  { label, class: className, lineClass, ...props }: SectionDividerProps,
): VNode {
  return (
    <div
      {...props}
      class={cn('ns-section-divider', className)}
      data-part='root'
      data-scope='section-divider'
    >
      <span class='ns-section-divider__label' data-part='label' data-scope='section-divider'>
        {label}
      </span>
      <div
        class={cn('ns-section-divider__line', lineClass)}
        data-part='line'
        data-scope='section-divider'
      />
    </div>
  );
}
