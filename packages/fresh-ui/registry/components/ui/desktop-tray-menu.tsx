/**
 * @component DesktopTrayMenu
 * @layer 2
 * @depends theme-seed
 * @description Declarative tray and application-menu preview that emits stable action IDs.
 */

import type { VNode } from 'preact';
import { useLayoutEffect, useRef, useState } from 'preact/hooks';
import { cn } from '../../lib/cn.ts';

/** Copy-owned declaration vocabulary accepted by the desktop tray/menu preview. */
export type DesktopTrayMenuItem =
  | {
    readonly type: 'action';
    readonly id: string;
    readonly label: string;
    readonly accelerator?: string;
    readonly enabled?: boolean;
  }
  | {
    readonly type: 'submenu';
    readonly label: string;
    readonly items: readonly DesktopTrayMenuItem[];
  }
  | { readonly type: 'separator' }
  | { readonly type: 'role'; readonly role: string };

/** Native menu surface represented by the preview. */
export type DesktopTrayMenuSource = 'tray' | 'application-menu';

/** Caller-controlled visual snapshot, independent of native hover and focus. */
export type DesktopTrayMenuState = 'rest' | 'hover' | 'disabled';

/** Props for the declarative desktop tray/menu component. */
export interface DesktopTrayMenuProps {
  /** Whether these declarations target the tray or application menu. */
  readonly source: DesktopTrayMenuSource;
  /** Optional declaration-kind snapshot; never filters or rewrites items. */
  readonly type?: DesktopTrayMenuItem['type'];
  /** Optional presentation state; omission preserves the legacy active marker. */
  readonly state?: DesktopTrayMenuState;
  /** Show caller-supplied shortcut labels, without executing shortcuts. Defaults to true. */
  readonly accelerator?: boolean;
  /** Menu declarations accepted by `createDesktopChrome`. */
  readonly items: readonly DesktopTrayMenuItem[];
  /** Receives the stable ID of an action declaration. */
  readonly onAction?: (actionId: string) => void;
  /** Disable action declarations while the desktop host is unavailable. */
  readonly disabled?: boolean;
  /** Additional root class name. */
  readonly class?: string;
}

interface ItemPresentation {
  readonly disabled: boolean;
  readonly accelerator: boolean;
  readonly state: DesktopTrayMenuState | undefined;
  readonly onAction: ((actionId: string) => void) | undefined;
  firstEnabled: boolean;
}

/** The recursive declaration tree preserves order, including duplicate semantic action IDs. */
function renderItems(
  items: readonly DesktopTrayMenuItem[],
  presentation: ItemPresentation,
): VNode[] {
  return items.map((item, index) => {
    switch (item.type) {
      case 'separator':
        return (
          <li
            key={index}
            class='ns-desktop-tray-menu__separator'
            data-scope='tray-menu'
            data-part='separator'
            data-type='separator'
            role='separator'
          />
        );
      case 'role':
        return (
          <li key={index} data-part='role-item' data-scope='tray-menu' data-type='role' role='none'>
            <span
              aria-disabled='true'
              class='ns-desktop-tray-menu__role'
              data-part='role'
              data-scope='tray-menu'
              role='menuitem'
            >
              {item.role}
            </span>
          </li>
        );
      case 'submenu':
        return (
          <li
            key={index}
            data-part='submenu'
            data-scope='tray-menu'
            data-type='submenu'
            role='none'
          >
            <span class='ns-desktop-tray-menu__label' data-part='label' data-scope='tray-menu'>
              {item.label}
            </span>
            <ul
              aria-label={item.label}
              class='ns-desktop-tray-menu__items ns-desktop-tray-menu__group'
              data-part='items'
              data-scope='tray-menu'
              role='group'
            >
              {renderItems(item.items, presentation)}
            </ul>
          </li>
        );
      case 'action': {
        const unavailable = presentation.disabled || item.enabled === false;
        const highlighted = presentation.firstEnabled && !unavailable &&
          presentation.state === 'hover';
        if (!unavailable) presentation.firstEnabled = false;
        return (
          <li
            key={index}
            data-part='action-item'
            data-scope='tray-menu'
            data-type='action'
            role='none'
          >
            <button
              type='button'
              class='ns-desktop-tray-menu__action'
              data-scope='tray-menu'
              data-action-id={item.id}
              data-part='action'
              data-state={unavailable
                ? 'disabled'
                : presentation.state === 'hover'
                ? highlighted ? 'hover' : 'rest'
                : presentation.state ?? 'enabled'}
              disabled={unavailable}
              onClick={() => presentation.onAction?.(item.id)}
              role='menuitem'
            >
              <span data-scope='tray-menu' data-part='label'>{item.label}</span>
              {!presentation.accelerator || item.accelerator === undefined ? null : (
                <kbd
                  class='ns-desktop-tray-menu__accelerator'
                  data-part='accelerator'
                  data-scope='tray-menu'
                >
                  {item.accelerator}
                </kbd>
              )}
            </button>
          </li>
        );
      }
    }
  });
}

/** Render native disclosure and menu declarations; island hydration adds scoped arrow-key roving. */
export function DesktopTrayMenu({
  source,
  type,
  state,
  accelerator = true,
  items,
  onAction,
  disabled = false,
  class: className,
}: DesktopTrayMenuProps): VNode {
  const root = useRef<HTMLElement>(null);
  const disclosure = useRef<HTMLDetailsElement>(null);
  const invoker = useRef<HTMLElement>(null);
  const entered = useRef(false);
  const [open, setOpen] = useState(true);
  const unavailable = disabled || state === 'disabled';

  // SSR leaves every native action tabbable. Only a hydrated caller island enables roving.
  function enabledActions(): HTMLButtonElement[] {
    return Array.from(
      root.current?.querySelectorAll<HTMLButtonElement>(
        'button[data-scope="tray-menu"][data-part="action"]:not(:disabled)',
      ) ?? [],
    );
  }
  function reconcileTabStops(preferred?: HTMLButtonElement): void {
    const buttons = enabledActions();
    const selected = preferred ??
      buttons.find((button) => button === button.ownerDocument.activeElement) ??
      buttons.find((button) => button.tabIndex === 0) ?? buttons[0];
    for (const button of buttons) button.tabIndex = button === selected ? 0 : -1;
  }
  useLayoutEffect(() => reconcileTabStops());

  function changeOpen(next: boolean): void {
    if (disclosure.current) disclosure.current.open = next;
    setOpen(next);
    if (!next) entered.current = false;
  }
  function moveFocus(last: boolean): void {
    changeOpen(true);
    const buttons = enabledActions();
    const button = last ? buttons.at(-1) : buttons[0];
    if (button) {
      reconcileTabStops(button);
      button.focus();
    }
  }

  return (
    <nav
      ref={root}
      aria-label={source === 'tray' ? 'Tray menu' : 'Application menu'}
      class={cn('ns-desktop-tray-menu', className)}
      data-scope='tray-menu'
      data-part='root'
      data-type={type}
      data-source={source}
      data-state={unavailable ? 'disabled' : state ?? 'active'}
      onFocusIn={(event) => {
        if (event.target instanceof HTMLButtonElement && enabledActions().includes(event.target)) {
          entered.current = true;
          reconcileTabStops(event.target);
        }
      }}
      onFocusOut={(event) => {
        const next = event.relatedTarget;
        if (entered.current && (!(next instanceof Node) || !event.currentTarget.contains(next))) {
          changeOpen(false);
        }
      }}
      onKeyDown={(event) => {
        if (unavailable) return;
        if (event.key === 'Escape' && disclosure.current?.open) {
          event.preventDefault();
          event.stopPropagation();
          changeOpen(false);
          invoker.current?.focus();
          return;
        }
        if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
        const buttons = enabledActions();
        const index = buttons.findIndex((button) => button === event.target);
        if (event.target === invoker.current) {
          event.preventDefault();
          event.stopPropagation();
          moveFocus(event.key === 'ArrowUp');
        } else if (index >= 0) {
          event.preventDefault();
          event.stopPropagation();
          const next = buttons[
            (index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length
          ];
          reconcileTabStops(next);
          next?.focus();
        }
      }}
    >
      <details
        ref={disclosure}
        open={open}
        data-scope='tray-menu'
        data-part='desktop-menu'
        onToggle={(event) => {
          const next = event.currentTarget.open;
          if (next !== open) setOpen(next);
          if (!next) entered.current = false;
        }}
      >
        <summary
          ref={invoker}
          aria-disabled={unavailable || undefined}
          class='ns-desktop-tray-menu__source'
          data-scope='tray-menu'
          data-part='source'
          tabIndex={unavailable ? -1 : undefined}
          onClick={(event) => {
            event.preventDefault();
            if (!unavailable) changeOpen(!disclosure.current?.open);
          }}
        >
          {source === 'tray' ? 'Tray' : 'Application'}
        </summary>
        <ul
          aria-label={source === 'tray' ? 'Tray commands' : 'Application commands'}
          class='ns-desktop-tray-menu__items'
          data-scope='tray-menu'
          data-part='items'
          role='menu'
        >
          {renderItems(items, {
            disabled: unavailable,
            accelerator,
            state,
            onAction,
            firstEnabled: true,
          })}
        </ul>
      </details>
    </nav>
  );
}
