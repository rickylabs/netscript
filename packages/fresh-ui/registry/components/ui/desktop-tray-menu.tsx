/**
 * @component DesktopTrayMenu
 * @layer 2
 * @depends theme-seed
 * @description Declarative tray and application-menu preview that emits stable action IDs.
 */

import type { VNode } from 'preact';

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

/** Props for the declarative desktop tray/menu component. */
export interface DesktopTrayMenuProps {
  /** Whether these declarations target the tray or application menu. */
  readonly source: DesktopTrayMenuSource;
  /** Menu declarations accepted by `createDesktopChrome`. */
  readonly items: readonly DesktopTrayMenuItem[];
  /** Receives the stable ID of an action declaration. */
  readonly onAction?: (actionId: string) => void;
  /** Disable action declarations while the desktop host is unavailable. */
  readonly disabled?: boolean;
  /** Additional root class name. */
  readonly class?: string;
}

function classes(...values: Array<string | undefined>): string {
  return values.filter((value): value is string => value !== undefined && value.length > 0).join(
    ' ',
  );
}

function renderItems(
  items: readonly DesktopTrayMenuItem[],
  onAction: ((actionId: string) => void) | undefined,
  disabled: boolean,
): VNode[] {
  return items.map((item, index) => {
    switch (item.type) {
      case 'separator':
        return (
          <li
            key={`separator-${index}`}
            aria-hidden='true'
            class='ns-desktop-tray-menu__separator'
            data-part='separator'
            role='separator'
          />
        );
      case 'role':
        return (
          <li key={`role-${item.role}-${index}`} data-part='role-item'>
            <span class='ns-desktop-tray-menu__role'>{item.role}</span>
          </li>
        );
      case 'submenu':
        return (
          <li key={`${item.label}-${index}`} data-part='submenu'>
            <span class='ns-desktop-tray-menu__label'>{item.label}</span>
            <ul class='ns-desktop-tray-menu__items' role='menu'>
              {renderItems(item.items, onAction, disabled)}
            </ul>
          </li>
        );
      case 'action':
        return (
          <li key={item.id} data-part='action-item' role='none'>
            <button
              type='button'
              class='ns-desktop-tray-menu__action'
              data-action-id={item.id}
              data-part='action'
              data-state={disabled || item.enabled === false ? 'disabled' : 'enabled'}
              disabled={disabled || item.enabled === false}
              onClick={() => onAction?.(item.id)}
              role='menuitem'
            >
              <span>{item.label}</span>
              {item.accelerator === undefined
                ? null
                : <kbd class='ns-desktop-tray-menu__accelerator'>{item.accelerator}</kbd>}
            </button>
          </li>
        );
    }
  });
}

/** Render tray or application-menu declarations without invoking native host operations. */
export function DesktopTrayMenu({
  source,
  items,
  onAction,
  disabled = false,
  class: className,
}: DesktopTrayMenuProps): VNode {
  return (
    <nav
      aria-label={source === 'tray' ? 'Tray menu' : 'Application menu'}
      class={classes('ns-desktop-tray-menu', className)}
      data-part='desktop-menu'
      data-source={source}
      data-state={disabled ? 'disabled' : 'active'}
    >
      <span class='ns-desktop-tray-menu__source' data-part='source'>
        {source === 'tray' ? 'Tray' : 'Application'}
      </span>
      <ul class='ns-desktop-tray-menu__items' data-part='items' role='menu'>
        {renderItems(items, onAction, disabled)}
      </ul>
    </nav>
  );
}
