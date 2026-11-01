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
import { useEffect, useState } from 'preact/hooks';
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
  const [query, setQuery] = useState('');
  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);
  const search = query.trim().toLocaleLowerCase();
  const visibleGroups = groups.map((group) => ({
    ...group,
    items: group.items.filter((item) =>
      `${item.label} ${item.hash ?? ''}`.toLocaleLowerCase().includes(search)
    ),
  })).filter((group) => group.items.length > 0);
  const select = (item: CommandItem) => {
    item.onSelect?.();
    onOpenChange?.(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={(next) => onOpenChange?.(next)} modal>
      <Dialog.Content
        class='ns-cmdk__backdrop'
        data-part='backdrop'
        data-scope='command-palette'
        aria-label='Command palette'
      >
        <Combobox.Root
          key={open ? 'open' : 'closed'}
          inputValue={query}
          onInputValueChange={setQuery}
          onValueChange={(value) => {
            const item = groups.flatMap((group) => group.items).find((item) => item.id === value);
            if (item) select(item);
          }}
          defaultOpen
        >
          <div class={cn('ns-cmdk', className)} data-part='root' data-scope='command-palette'>
            <div data-part='content' data-scope='command-palette' style={{ display: 'contents' }}>
              <div class='ns-cmdk__input-row' data-part='input-row' data-scope='command-palette'>
                <span
                  class='ns-cmdk__search-icon'
                  data-part='search-icon'
                  data-scope='command-palette'
                  aria-hidden='true'
                >
                  <svg
                    width='16'
                    height='16'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    stroke-width='1.75'
                    aria-hidden='true'
                  >
                    <circle cx='10.5' cy='10.5' r='6.5' />
                    <path d='m16 16 5 5' />
                  </svg>
                </span>
                <Combobox.Input
                  class='ns-cmdk__input'
                  data-part='input'
                  data-scope='command-palette'
                  placeholder={placeholder}
                />
                <Dialog.Close class='ns-cmdk__close' aria-label='Close command palette'>
                  <span class='ns-cmdk__close-key'>esc</span>
                  <span class='ns-cmdk__close-label'>Close</span>
                </Dialog.Close>
              </div>
              <Combobox.Content
                class='ns-cmdk__list'
                data-part='list'
                data-scope='command-palette'
              >
                {visibleGroups.map((group) => (
                  <div
                    key={group.id}
                    class='ns-cmdk__group'
                    data-part='group'
                    data-scope='command-palette'
                    role='group'
                  >
                    {group.label
                      ? (
                        <div
                          class='ns-cmdk__group-label'
                          data-part='group-label'
                          data-scope='command-palette'
                        >
                          {group.label}
                        </div>
                      )
                      : null}
                    {group.items.map((item) => (
                      <Combobox.Item
                        key={item.id}
                        value={item.id}
                        class='ns-cmdk__item'
                        data-part='item'
                        data-scope='command-palette'
                      >
                        {item.icon
                          ? (
                            <span
                              class='ns-cmdk__item-icon'
                              data-part='item-icon'
                              data-scope='command-palette'
                              aria-hidden='true'
                            >
                              {item.icon}
                            </span>
                          )
                          : null}
                        <span
                          class='ns-cmdk__item-label'
                          data-part='item-label'
                          data-scope='command-palette'
                        >
                          {item.label}
                        </span>
                        {item.hash
                          ? (
                            <span
                              class='ns-cmdk__item-hash'
                              data-part='item-hash'
                              data-scope='command-palette'
                            >
                              {item.hash}
                            </span>
                          )
                          : null}
                        {item.kind
                          ? (
                            <span
                              class='ns-cmdk__item-kind'
                              data-part='item-kind'
                              data-scope='command-palette'
                            >
                              {item.kind}
                            </span>
                          )
                          : null}
                      </Combobox.Item>
                    ))}
                  </div>
                ))}
                {visibleGroups.length === 0 && (
                  <Combobox.Empty
                    class='ns-cmdk__empty'
                    data-part='empty'
                    data-scope='command-palette'
                  >
                    {emptyLabel}
                  </Combobox.Empty>
                )}
              </Combobox.Content>
              <footer class='ns-cmdk__footer' aria-label='Command keyboard help'>
                <span>
                  <kbd>↑↓</kbd> to navigate
                </span>
                <span>
                  <kbd>↵</kbd> to open
                </span>
                <span>
                  <kbd>esc</kbd> to close
                </span>
              </footer>
            </div>
          </div>
        </Combobox.Root>
      </Dialog.Content>
    </Dialog.Root>
  );
}
