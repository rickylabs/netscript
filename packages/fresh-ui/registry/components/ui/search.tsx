/**
 * @component Search
 * @layer 2
 * @depends theme-seed
 * @description Compact nav search affordance: a button styled as an input that
 * opens the command palette, with a leading search glyph and a trailing ⌘K
 * keyboard hint. Presentational — the consumer wires onOpen to its palette
 * (and any global ⌘K listener lives in an app island).
 */

import type { JSX, VNode } from 'preact';
import { cn } from '../../lib/cn.ts';

interface SearchProps extends Omit<JSX.HTMLAttributes<HTMLButtonElement>, 'class' | 'onClick'> {
  /** Placeholder/label copy shown inside the field. */
  placeholder?: string;
  /** Keyboard hint glyphs, e.g. `⌘K`. Hidden when empty. */
  shortcut?: string;
  /** Invoked when the field is activated (opens the palette). */
  onOpen?: () => void;
  class?: string;
}

/**
 * Renders the compact nav search trigger.
 */
export function Search(
  { placeholder = 'Search…', shortcut = '⌘K', onOpen, class: className, ...props }: SearchProps,
): VNode {
  return (
    <button
      {...props}
      type='button'
      class={cn('ns-search', className)}
      onClick={() => onOpen?.()}
    >
      <span class='ns-search__icon' aria-hidden='true'>⌕</span>
      <span class='ns-search__label'>{placeholder}</span>
      {shortcut ? <kbd class='ns-kbd ns-search__kbd'>{shortcut}</kbd> : null}
    </button>
  );
}
