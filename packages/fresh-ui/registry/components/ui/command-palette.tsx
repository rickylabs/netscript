/**
 * @component CommandPalette
 * @layer 2
 * @depends theme-seed, kbd, spinner
 * @description Local grouped command search composed from native Dialog and the existing Combobox.
 */
import type { VNode } from 'preact';
import { useEffect, useId, useState } from 'preact/hooks';
import { Combobox, Dialog } from '@netscript/fresh-ui/interactive';
import { Icon } from '@netscript/fresh-ui/primitives';
import { Kbd } from './kbd.tsx';
import { Spinner } from './spinner.tsx';
import { cn } from '../../lib/cn.ts';
import type { Renderable } from '../../lib/public-types.ts';

/** Semantic result kinds; section results are indented under their parent page. */
export type CommandItemType = 'page' | 'section' | 'action';

/** A command keeps its caller-owned action, including navigation. */
export interface CommandItem {
  /** Globally unique, nonblank identifier; arbitrary characters are preserved. */
  id: string;
  /** Visible label, also included in local search. */
  label: string;
  /** Optional legacy text glyph. */
  icon?: string;
  /** Optional trailing path/hash hint. */
  hash?: string;
  /** Optional informational kind tag. */
  kind?: string;
  /** One callback for native pointer or keyboard selection. */
  onSelect?: () => void;
  /** Optional result kind. */
  type?: CommandItemType;
  /** Excludes this visible result from navigation and activation. */
  disabled?: boolean;
  /** Display-only URL; onSelect owns actual navigation. */
  url?: string;
  /** Plain text, never injected HTML. */
  excerpt?: string;
  /** Native key notation, independent of the legacy hash hint. */
  shortcut?: string;
}

/** An ordered, optionally labeled group. */
export interface CommandGroup {
  /** Unique, nonblank group identifier. */
  id: string;
  /** Accessible group heading. */
  label?: string;
  /** Items retain their source order during filtering. */
  items: CommandItem[];
}

interface CommandPaletteProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  groups: CommandGroup[];
  placeholder?: string;
  emptyLabel?: string;
  class?: string;
  loading?: boolean;
  loadingLabel?: string;
  searchLabel?: string;
  /** Localized accessible name of the modal. */
  dialogLabel?: string;
  /** User edits only; async search and its results remain caller-owned. */
  onQueryChange?: (query: string) => void;
  /** False renders an inline surface without modal focus capture. */
  scrim?: boolean;
  filters?: Renderable;
  footer?: Renderable;
}

/** Plain text matching keeps markup escaped and only changes the matching type weight. */
function queryExcerpt(text: string, query: string): Renderable {
  if (!query.trim()) return text;
  // Keep copied browser code usable before RegExp.escape is available.
  const literal = typeof RegExp.escape === 'function'
    ? RegExp.escape(query.trim())
    : query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const matches = text.matchAll(new RegExp(literal, 'giu'));
  const parts: Renderable[] = [];
  let offset = 0;
  for (const match of matches) {
    parts.push(text.slice(offset, match.index));
    parts.push(<strong key={match.index}>{match[0]}</strong>);
    offset = match.index + match[0].length;
  }
  parts.push(text.slice(offset));
  return parts;
}

/** Native-first grouped search; the caller controls modal visibility and business effects. */
export function CommandPalette({
  open,
  onOpenChange,
  groups,
  placeholder = 'Type a command or search…',
  emptyLabel = 'No matching commands',
  class: className,
  loading = false,
  loadingLabel = 'Searching…',
  searchLabel = 'Search commands',
  dialogLabel = 'Command palette',
  onQueryChange,
  scrim = true,
  filters,
  footer,
}: CommandPaletteProps): VNode {
  const [query, setQuery] = useState('');
  const id = useId();
  const groupIds = new Set<string>();
  const itemsByValue = new Map<string, CommandItem>();
  for (const group of groups) {
    if (!group.id.trim() || groupIds.has(group.id)) {
      throw new RangeError('Command group IDs must be unique and nonblank.');
    }
    groupIds.add(group.id);
    for (const item of group.items) {
      const value = encodeURIComponent(item.id);
      if (!item.id.trim() || itemsByValue.has(value)) {
        throw new RangeError('Command item IDs must be globally unique and nonblank.');
      }
      itemsByValue.set(value, item);
    }
  }
  useEffect(() => {
    if (scrim && open) setQuery('');
  }, [open, scrim]);
  const normalizedQuery = query.trim().toLowerCase();
  const visibleGroups = loading ? [] : groups.map((group) => ({
    ...group,
    items: group.items.filter((item) =>
      [item.label, item.url, item.excerpt, item.hash, item.kind].some((text) =>
        text?.toLowerCase().includes(normalizedQuery)
      )
    ),
  })).filter((group) => group.items.length);
  const visibleValues = new Set(
    visibleGroups.flatMap((group) =>
      group.items.filter((item) => !item.disabled).map((item) => encodeURIComponent(item.id))
    ),
  );
  const content = loading ? 'loading' : visibleGroups.length ? 'results' : 'empty';

  const panel = (
    <Combobox.Root
      value=''
      open={!scrim || !!open}
      inputValue={query}
      onInputValueChange={(next) => {
        setQuery(next);
        onQueryChange?.(next);
      }}
      onValueChange={(value) => {
        const item = itemsByValue.get(value);
        if (!item || !visibleValues.has(value)) return;
        item.onSelect?.();
        if (scrim) onOpenChange?.(false);
      }}
    >
      <div
        class={cn('ns-cmdk', className)}
        hidden={!scrim && open === false}
        data-part='root'
        data-scope='command-palette'
        data-content={content}
        data-scrim={String(scrim)}
      >
        <div class='ns-cmdk__content' data-part='content' data-scope='command-palette'>
          <div class='ns-cmdk__input-row' data-part='input-row' data-scope='command-palette'>
            <span
              class='ns-cmdk__search-icon'
              data-part='search-icon'
              data-scope='command-palette'
              aria-hidden='true'
            >
              <Icon name='search' />
            </span>
            <Combobox.Input
              class='ns-cmdk__input'
              data-part='input'
              data-scope='command-palette'
              placeholder={placeholder}
              aria-label={searchLabel}
              onKeyDown={(event) => {
                if (event.key !== 'Escape' || event.isComposing) return;
                event.preventDefault();
                event.stopPropagation();
                if (scrim) onOpenChange?.(false);
                else {
                  setQuery('');
                  onQueryChange?.('');
                }
              }}
            />
            <span data-part='kbd' data-scope='command-palette'>
              <Kbd size='sm'>Esc</Kbd>
            </span>
          </div>
          {filters != null && filters !== false && (
            <div class='ns-cmdk__filters' data-part='filters' data-scope='command-palette'>
              {filters}
            </div>
          )}
          <Combobox.Content
            class='ns-cmdk__list'
            data-part='list'
            data-scope='command-palette'
            aria-label={searchLabel}
            aria-busy={loading}
          >
            {visibleGroups.map((group) => {
              const labelId = `${id}-group-${encodeURIComponent(group.id)}`;
              return (
                <div
                  key={group.id}
                  class='ns-cmdk__group'
                  data-part='group'
                  data-scope='command-palette'
                  role='group'
                  aria-labelledby={group.label ? labelId : undefined}
                  aria-label={group.label ? undefined : searchLabel}
                >
                  {group.label && (
                    <div
                      id={labelId}
                      class='ns-cmdk__group-label'
                      data-part='group-label'
                      data-scope='command-palette'
                    >
                      {group.label}
                    </div>
                  )}
                  {group.items.map((item) => {
                    const parts = (
                      <>
                        {(item.icon || item.type === 'section' || item.type === 'page') && (
                          <span
                            class='ns-cmdk__item-icon'
                            data-part='item-icon'
                            data-scope='command-palette'
                            aria-hidden='true'
                          >
                            {item.icon ?? (item.type === 'page' ? <Icon name='file-text' /> : '#')}
                          </span>
                        )}
                        <span
                          class='ns-cmdk__item-copy'
                          data-part='item-copy'
                          data-scope='command-palette'
                        >
                          <span class='ns-cmdk__item-heading'>
                            <span
                              class='ns-cmdk__item-label'
                              data-part='item-label'
                              data-scope='command-palette'
                            >
                              {item.label}
                            </span>
                            {item.url && (
                              <span
                                class='ns-cmdk__item-url'
                                data-part='item-url'
                                data-scope='command-palette'
                              >
                                {item.url}
                              </span>
                            )}
                            {item.hash && (
                              <span
                                class='ns-cmdk__item-hash'
                                data-part='item-hash'
                                data-scope='command-palette'
                              >
                                {item.hash}
                              </span>
                            )}
                          </span>
                          {item.excerpt && (
                            <span
                              class='ns-cmdk__item-excerpt'
                              data-part='item-excerpt'
                              data-scope='command-palette'
                            >
                              {queryExcerpt(item.excerpt, query)}
                            </span>
                          )}
                        </span>
                        {item.kind && (
                          <span
                            class='ns-cmdk__item-kind'
                            data-part='item-kind'
                            data-scope='command-palette'
                          >
                            {item.kind}
                          </span>
                        )}
                        {item.shortcut && (
                          <span data-part='item-shortcut' data-scope='command-palette'>
                            <Kbd size='sm'>{item.shortcut}</Kbd>
                          </span>
                        )}
                        {!item.disabled && (
                          <span
                            class='ns-cmdk__item-return'
                            data-part='item-return'
                            data-scope='command-palette'
                            aria-hidden='true'
                          >
                            <Icon name='corner-down-left' />
                          </span>
                        )}
                      </>
                    );
                    const attributes = {
                      class: 'ns-cmdk__item',
                      'data-part': 'item',
                      'data-scope': 'command-palette',
                      'data-type': item.type ?? 'action',
                    };
                    return item.disabled
                      ? (
                        <div
                          {...attributes}
                          key={item.id}
                          role='option'
                          onMouseDown={(event) => {
                            if (event.button === 0) event.preventDefault();
                          }}
                          aria-disabled='true'
                          aria-selected='false'
                          data-state='disabled'
                        >
                          {parts}
                        </div>
                      )
                      : (
                        <Combobox.Item
                          {...attributes}
                          key={item.id}
                          value={encodeURIComponent(item.id)}
                        >
                          {parts}
                        </Combobox.Item>
                      );
                  })}
                </div>
              );
            })}
          </Combobox.Content>
          {content !== 'results' && (
            <div
              class='ns-cmdk__empty'
              data-part={content}
              data-scope='command-palette'
              role='status'
            >
              {loading ? <Spinner size='sm' /> : <Icon name='search' aria-hidden='true' />}
              <span>{loading ? loadingLabel : emptyLabel}</span>
            </div>
          )}
          {footer != null && footer !== false && (
            <div class='ns-cmdk__footer' data-part='footer' data-scope='command-palette'>
              {footer}
            </div>
          )}
        </div>
      </div>
    </Combobox.Root>
  );
  return scrim
    ? (
      <Dialog.Root
        open={open}
        onOpenChange={(next, details) => {
          if (details.reason === 'native-close' && open === false) return;
          onOpenChange?.(next);
        }}
        modal
      >
        <Dialog.Content
          class='ns-cmdk__backdrop'
          data-part='backdrop'
          data-scope='command-palette'
          aria-label={dialogLabel}
          onCancel={(event) => {
            event.preventDefault();
            onOpenChange?.(false);
          }}
        >
          <Dialog.Title class='ns-cmdk__sr-only'>{dialogLabel}</Dialog.Title>
          <Dialog.Description class='ns-cmdk__sr-only'>{searchLabel}</Dialog.Description>
          {panel}
        </Dialog.Content>
      </Dialog.Root>
    )
    : panel;
}
