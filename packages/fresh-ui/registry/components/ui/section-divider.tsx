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
    <div {...props} class={cn('flex items-baseline gap-4', className)}>
      <span class='text-[0.65rem] font-mono uppercase tracking-[0.12em] text-ns-muted-fg'>
        {label}
      </span>
      <div class={cn('h-px flex-1 bg-ns-border', lineClass)} />
    </div>
  );
}
