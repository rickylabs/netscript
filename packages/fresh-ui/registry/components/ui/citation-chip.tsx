/**
 * @component CitationChip
 * @layer 2
 * @depends theme-seed
 * @description Inline per-claim source marker [n] that pairs with a sources list —
 * the grounded-agent citation UX.
 */

import type { JSX, VNode } from 'preact';
import { cn } from '../../lib/cn.ts';

interface CitationChipProps
  extends Omit<JSX.HTMLAttributes<HTMLButtonElement>, 'class' | 'onClick'> {
  /** 1-based citation number rendered in the chip. */
  index: number;
  /** Source label, surfaced as the hover title + accessible name. */
  source?: string;
  /** Active when its matching source row is selected. */
  active?: boolean;
  /** Invoked with the citation index on activation. */
  onClick?: (index: number) => void;
  class?: string;
}

/**
 * Renders a clickable superscript citation chip.
 */
export function CitationChip(
  { index, source, active, onClick, class: className, ...props }: CitationChipProps,
): VNode {
  return (
    <button
      {...props}
      type='button'
      title={source}
      aria-pressed={active ? 'true' : 'false'}
      aria-label={source ? `Source ${index}: ${source}` : `Source ${index}`}
      class={cn('ns-citation', active && 'is-active', className)}
      onClick={() => onClick?.(index)}
    >
      {index}
    </button>
  );
}
