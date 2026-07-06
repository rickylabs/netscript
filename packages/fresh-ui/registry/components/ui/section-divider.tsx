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
    <div {...props} class={cn('ns-section-divider', className)}>
      <span class='ns-section-divider__label'>{label}</span>
      <div class={cn('ns-section-divider__line', lineClass)} />
    </div>
  );
}
