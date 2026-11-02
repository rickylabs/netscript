/**
 * @component Menubar
 * @layer 2
 * @depends theme-seed floating-styles menu-items
 * @description Roving application-menu triggers composing package-owned ActionMenu popovers.
 */
import type { JSX, VNode } from 'preact';
import { useId, useRef, useState } from 'preact/hooks';
import { ActionMenu } from '@netscript/fresh-ui/interactive';
import { cn } from '../../lib/cn.ts';
import { type MenuEntry, MenuItems } from './menu-items.tsx';

export interface MenubarMenu {
  id: string;
  label: string;
  disabled?: boolean;
  items: readonly MenuEntry[];
}
export interface MenubarProps
  extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'onChange'> {
  label: string;
  menus: readonly MenubarMenu[];
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (menu: string | null) => void;
  class?: string;
}

/** Hydrate in an island; each popup delegates its native positioning, state and item keys. */
export function Menubar(
  { label, menus, value, defaultValue = null, onValueChange, class: className, ...props }:
    MenubarProps,
): VNode {
  const [local, setLocal] = useState<string | null>(defaultValue);
  const open = value === undefined ? local : value;
  const enabled = menus.filter((menu) => !menu.disabled);
  const [focused, setFocused] = useState(enabled[0]?.id);
  const root = useRef<HTMLDivElement>(null), id = useId();
  const [entryEdge, setEntryEdge] = useState<'first' | 'last'>('first');
  const change = (next: string | null) => {
    if (next === open) return;
    if (value === undefined) setLocal(next);
    onValueChange?.(next);
  };
  const triggers = () => [
    ...root.current?.querySelectorAll<HTMLButtonElement>(
      '[data-scope="menubar"][data-part="trigger"]:enabled',
    ) ?? [],
  ];
  const focusTrigger = (menu: string) =>
    triggers().find((button) => button.value === menu)?.focus();
  const navigate = (
    event: Event,
    current: string,
    inside: boolean,
  ) => {
    if (!(event instanceof KeyboardEvent) || !(event.currentTarget instanceof HTMLElement)) return;
    const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
    let next: number | undefined;
    const index = enabled.findIndex((menu) => menu.id === current);
    if (event.key === 'ArrowRight') {
      next = (index + (rtl ? -1 : 1) + enabled.length) % enabled.length;
    } else if (event.key === 'ArrowLeft') {
      next = (index + (rtl ? 1 : -1) + enabled.length) % enabled.length;
    } else if (!inside && event.key === 'Home') next = 0;
    else if (!inside && event.key === 'End') next = enabled.length - 1;
    if (next !== undefined && enabled[next]) {
      event.preventDefault();
      event.stopPropagation();
      setFocused(enabled[next].id);
      if (inside || open) {
        setEntryEdge('first');
        change(enabled[next].id);
      } else focusTrigger(enabled[next].id);
    } else if (!inside && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      event.preventDefault();
      const edge = event.key === 'ArrowUp' ? 'last' : 'first';
      setEntryEdge(edge);
      if (open === current) {
        const content = [
          ...root.current?.querySelectorAll<HTMLElement>(
            '[data-scope="menubar"][data-part="content"]',
          ) ?? [],
        ]
          .find((element) => element.dataset.menu === current);
        const items = [
          ...content?.querySelectorAll<HTMLButtonElement>('[role^="menuitem"]:enabled') ?? [],
        ]
          .filter((item) => item.closest('[role="menu"]') === content);
        (edge === 'last' ? items.at(-1) : items[0])?.focus();
      } else change(current);
    } else if (inside && event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      change(null);
      focusTrigger(current);
    } else if (inside && event.key === 'Tab') {
      // Native sequential navigation leaves the composite from its roving trigger.
      change(null);
      focusTrigger(current);
    }
  };
  return (
    <div
      {...props}
      ref={root}
      role='menubar'
      aria-label={label}
      class={cn('ns-menubar', className)}
      data-scope='menubar'
      data-part='root'
      onFocusOut={(event) => {
        props.onFocusOut?.(event);
        if (
          !(event.relatedTarget instanceof Node) ||
          !event.currentTarget.contains(event.relatedTarget)
        ) change(null);
      }}
    >
      {menus.map((menu) => (
        <span role='none' key={menu.id}>
          <ActionMenu.Root
            open={open === menu.id}
            closeOnEscape={false}
            closeOnInteractOutside={false}
            placement='bottom-start'
            onOpenChange={(next) => {
              if (next) change(menu.id);
              else if (open === menu.id) change(null);
            }}
          >
            <ActionMenu.Trigger
              id={`${id}-${menu.id}`}
              role='menuitem'
              value={menu.id}
              disabled={menu.disabled}
              data-scope='menubar'
              data-part='trigger'
              tabIndex={menu.id ===
                  (enabled.some((item) => item.id === focused) ? focused : enabled[0]?.id)
                ? 0
                : -1}
              onClick={() => setEntryEdge('first')}
              onFocus={() => setFocused(menu.id)}
              onKeyDown={(event) => navigate(event, menu.id, false)}
            >
              {menu.label}
            </ActionMenu.Trigger>
            <ActionMenu.Content
              initialFocus={entryEdge}
              class='ns-menu-items__content'
              data-scope='menubar'
              data-part='content'
              data-menu={menu.id}
              aria-label={menu.label}
              aria-labelledby={`${id}-${menu.id}`}
              aria-describedby=''
              onKeyDown={(event) => {
                if (
                  event.target instanceof Element &&
                  event.target.closest('[role="menu"]') === event.currentTarget
                ) navigate(event, menu.id, true);
              }}
            >
              <MenuItems
                items={menu.items}
                onClose={() => {
                  change(null);
                  focusTrigger(menu.id);
                }}
              />
            </ActionMenu.Content>
          </ActionMenu.Root>
        </span>
      ))}
    </div>
  );
}
