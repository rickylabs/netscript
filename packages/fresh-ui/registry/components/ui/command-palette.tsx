/**
 * @component CommandPalette
 * @layer 2
 * @depends theme-seed
 * @description Modal command palette (⌘K surface). Composes the L1 Dialog
 * (native <dialog> backdrop/overlay) wrapping the L1 Combobox (ARIA combobox +
 * roving keys). Groups of selectable commands render as combobox items with an
 * optional icon, hash, and kind tag. Native-first: Dialog owns open/close +
 * Esc + backdrop dismiss; Combobox owns the input, listbox, and keyboard nav.
 */

import type { VNode } from 'preact';
import { cn } from '../../lib/cn.ts';
import { Combobox } from '@netscript/fresh-ui/interactive';
import { Dialog } from '@netscript/fresh-ui/interactive';

/**
 * A single selectable command in the palette.
 */
export interface CommandItem {
  /** Stable id; also the combobox option value. */
  id: string;
  /** Human-readable command label. */
  label: string;
  /** Optional leading glyph (emoji or single character). */
  icon?: string;
  /** Optional trailing hash/shortcut hint, e.g. a route or `⌘P`. */
  hash?: string;
  /** Optional kind tag, e.g. `Page`, `Action`, `Agent`. */
  kind?: string;
  /** Invoked when the command is chosen. */
  onSelect?: () => void;
}

/**
 * A labeled group of commands.
 */
export interface CommandGroup {
  /** Stable group id. */
  id: string;
  /** Optional group heading rendered above its items. */
  label?: string;
  /** Commands in this group. */
  items: CommandItem[];
}

interface CommandPaletteProps {
  /** Whether the palette is open (controlled). */
  open?: boolean;
  /** Notified when the open state should change. */
  onOpenChange?: (open: boolean) => void;
  /** Grouped commands to display. */
  groups: CommandGroup[];
  /** Input placeholder copy. */
  placeholder?: string;
  /** Empty-state copy shown when no command matches. */
  emptyLabel?: string;
  /** Extra class on the panel. */
  class?: string;
}

/**
 * Renders the modal command palette.
 */
export function CommandPalette(
  {
    open,
    onOpenChange,
    groups,
    placeholder = 'Type a command or search…',
    emptyLabel = 'No matching commands',
    class: className,
  }: CommandPaletteProps,
): VNode {
  const select = (item: CommandItem) => {
    item.onSelect?.();
    onOpenChange?.(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={(next) => onOpenChange?.(next)} modal>
      <Dialog.Content class='ns-cmdk__backdrop' aria-label='Command palette'>
        <Combobox.Root onValueChange={() => {}} defaultOpen>
          <div class={cn('ns-cmdk', className)}>
            <div class='ns-cmdk__input-row'>
              <span class='ns-cmdk__search-icon' aria-hidden='true'>⌕</span>
              <Combobox.Input class='ns-cmdk__input' placeholder={placeholder} />
            </div>
            <Combobox.Content class='ns-cmdk__list'>
              {groups.map((group) => (
                <div key={group.id} class='ns-cmdk__group' role='group'>
                  {group.label ? <div class='ns-cmdk__group-label'>{group.label}</div> : null}
                  {group.items.map((item) => (
                    <Combobox.Item
                      key={item.id}
                      value={item.id}
                      class='ns-cmdk__item'
                      onClick={() => select(item)}
                    >
                      {item.icon
                        ? <span class='ns-cmdk__item-icon' aria-hidden='true'>{item.icon}</span>
                        : null}
                      <span class='ns-cmdk__item-label'>{item.label}</span>
                      {item.hash ? <span class='ns-cmdk__item-hash'>{item.hash}</span> : null}
                      {item.kind ? <span class='ns-cmdk__item-kind'>{item.kind}</span> : null}
                    </Combobox.Item>
                  ))}
                </div>
              ))}
              <Combobox.Empty class='ns-cmdk__empty'>{emptyLabel}</Combobox.Empty>
            </Combobox.Content>
          </div>
        </Combobox.Root>
      </Dialog.Content>
    </Dialog.Root>
  );
}
