import {
  DESKTOP_CHROME_DISABLED_REASONS,
  DESKTOP_CHROME_STATUSES,
  DESKTOP_MENU_SOURCES,
  DESKTOP_OPERATION_REASONS,
  DESKTOP_OPERATION_STATUSES,
  DESKTOP_WINDOW_ACTIONS,
} from './constants.ts';
import type {
  CreateDesktopChromeOptions,
  DesktopChromeActive,
  DesktopChromeCapability,
  DesktopChromeDisabled,
  DesktopChromeLifecycle,
  DesktopMenuActionEvent,
  DesktopMenuItem,
  DesktopMenuSource,
  DesktopNativeMenuItem,
  DesktopNotificationCapability,
  DesktopNotificationHandle,
  DesktopNotificationOptions,
  DesktopOperationReason,
  DesktopOperationResult,
  DesktopTrayCapability,
  DesktopWindowAction,
} from './types.ts';

function isRecord(value: unknown): value is Readonly<Record<PropertyKey, unknown>> {
  return value !== null && typeof value === 'object';
}

function optionalFunction(
  target: Readonly<Record<PropertyKey, unknown>>,
  key: PropertyKey,
): ((...args: unknown[]) => unknown) | undefined {
  const value = Reflect.get(target, key);
  return typeof value === 'function' ? value.bind(target) : undefined;
}

function resolveDesktopCapability(): DesktopChromeCapability | null {
  const deno = Reflect.get(globalThis, 'Deno');
  if (!isRecord(deno) || typeof Reflect.get(deno, 'BrowserWindow') !== 'function') {
    return null;
  }

  const alert = optionalFunction(globalThis, 'alert');
  const confirm = optionalFunction(globalThis, 'confirm');
  const prompt = optionalFunction(globalThis, 'prompt');
  const notification = Reflect.get(globalThis, 'Notification');

  return {
    BrowserWindow: Reflect.get(deno, 'BrowserWindow') as DesktopChromeCapability['BrowserWindow'],
    Tray: typeof Reflect.get(deno, 'Tray') === 'function'
      ? Reflect.get(deno, 'Tray') as DesktopChromeCapability['Tray']
      : undefined,
    dialogs: alert !== undefined && confirm !== undefined && prompt !== undefined
      ? {
        alert: (message) => void alert(message),
        confirm: (message) => Boolean(confirm(message)),
        prompt: (message, defaultValue) => {
          const value = prompt(message, defaultValue);
          return typeof value === 'string' ? value : null;
        },
      }
      : undefined,
    Notification: typeof notification === 'function'
      ? notification as DesktopNotificationCapability
      : undefined,
  };
}

function disabled(reason: DesktopChromeDisabled['reason']): DesktopChromeDisabled {
  return {
    status: DESKTOP_CHROME_STATUSES.DISABLED,
    reason,
    dispose() {},
  };
}

function validateText(value: string, label: string): string {
  if (value.trim().length === 0) {
    throw new TypeError(`${label} must not be empty`);
  }
  return value;
}

function toNativeMenu(
  declarations: readonly DesktopMenuItem[],
): { readonly items: DesktopNativeMenuItem[]; readonly actionIds: ReadonlySet<string> } {
  const actionIds = new Set<string>();

  const convert = (items: readonly DesktopMenuItem[]): DesktopNativeMenuItem[] =>
    items.map((item): DesktopNativeMenuItem => {
      switch (item.type) {
        case 'action': {
          const id = validateText(item.id, 'Desktop menu action ID');
          if (actionIds.has(id)) {
            throw new TypeError(`Desktop menu action ID must be unique: ${id}`);
          }
          actionIds.add(id);
          return {
            item: {
              label: validateText(item.label, 'Desktop menu action label'),
              id,
              ...(item.accelerator === undefined ? {} : {
                accelerator: validateText(item.accelerator, 'Desktop menu accelerator'),
              }),
              enabled: item.enabled ?? true,
            },
          };
        }
        case 'submenu':
          return {
            submenu: {
              label: validateText(item.label, 'Desktop submenu label'),
              items: convert(item.items),
            },
          };
        case 'separator':
          return 'separator';
        case 'role':
          return { role: { role: validateText(item.role, 'Desktop menu role') } };
      }
    });

  return { items: convert(declarations), actionIds };
}

function menuActionId(event: Event): string | null {
  const detail = Reflect.get(event, 'detail');
  if (!isRecord(detail)) {
    return null;
  }
  const id = Reflect.get(detail, 'id');
  return typeof id === 'string' ? id : null;
}

function performed<T>(value: T): DesktopOperationResult<T> {
  return { status: DESKTOP_OPERATION_STATUSES.PERFORMED, value };
}

function unavailable<T>(reason: DesktopOperationReason): DesktopOperationResult<T> {
  return { status: DESKTOP_OPERATION_STATUSES.UNAVAILABLE, reason };
}

/**
 * Activate native desktop chrome around an existing window, or return an inert browser-safe result.
 *
 * This function does not create a window, bind RPC, start updates, exit the process, or otherwise
 * choose host policy.
 */
export function createDesktopChrome(options: CreateDesktopChromeOptions): DesktopChromeLifecycle {
  const capability = options.capability === undefined
    ? resolveDesktopCapability()
    : options.capability;
  if (capability === null || typeof capability.BrowserWindow !== 'function') {
    return disabled(DESKTOP_CHROME_DISABLED_REASONS.NOT_DESKTOP);
  }
  if (options.window === undefined) {
    return disabled(DESKTOP_CHROME_DISABLED_REASONS.MISSING_WINDOW);
  }
  if (options.tray !== undefined && typeof capability.Tray !== 'function') {
    return disabled(DESKTOP_CHROME_DISABLED_REASONS.MISSING_TRAY);
  }

  const window = options.window;
  let tray: DesktopTrayCapability | undefined;
  if (options.tray !== undefined && capability.Tray !== undefined) {
    tray = new capability.Tray();
    if (tray.trayId === 0) {
      tray.destroy();
      return disabled(DESKTOP_CHROME_DISABLED_REASONS.TRAY_UNAVAILABLE);
    }
  }

  let disposed = false;
  let applicationActionIds: ReadonlySet<string> = new Set();
  let trayActionIds: ReadonlySet<string> = new Set();

  const assertOpen = (): void => {
    if (disposed) {
      throw new Error('Desktop chrome has been disposed');
    }
  };
  const dispatch = (
    source: DesktopMenuSource,
    actionIds: ReadonlySet<string>,
    event: Event,
  ): void => {
    const actionId = menuActionId(event);
    if (actionId === null || !actionIds.has(actionId)) {
      return;
    }
    const action: DesktopMenuActionEvent = { actionId, source };
    options.onAction?.(action);
  };
  const onApplicationMenuClick = (event: Event): void =>
    dispatch(DESKTOP_MENU_SOURCES.APPLICATION_MENU, applicationActionIds, event);
  const onTrayMenuClick = (event: Event): void =>
    dispatch(DESKTOP_MENU_SOURCES.TRAY, trayActionIds, event);
  const onTrayClick = (): void => options.tray?.onClick?.();
  const onTrayDoubleClick = (): void => options.tray?.onDoubleClick?.();

  const setApplicationMenu = (menu: readonly DesktopMenuItem[] | null): void => {
    assertOpen();
    if (menu === null) {
      applicationActionIds = new Set();
      window.setApplicationMenu(null);
      return;
    }
    const native = toNativeMenu(menu);
    applicationActionIds = native.actionIds;
    window.setApplicationMenu(native.items);
  };
  const setTrayMenu = (menu: readonly DesktopMenuItem[] | null): void => {
    assertOpen();
    if (tray === undefined) {
      throw new Error('Desktop chrome was created without a tray');
    }
    if (menu === null) {
      trayActionIds = new Set();
      tray.setMenu(null);
      return;
    }
    const native = toNativeMenu(menu);
    trayActionIds = native.actionIds;
    tray.setMenu(native.items);
  };

  window.addEventListener('menuclick', onApplicationMenuClick);
  if (tray !== undefined) {
    tray.addEventListener('menuclick', onTrayMenuClick);
    tray.addEventListener('click', onTrayClick);
    tray.addEventListener('dblclick', onTrayDoubleClick);
    if (options.tray?.icon !== undefined) {
      tray.setIcon(options.tray.icon);
    }
    if (options.tray?.darkIcon !== undefined) {
      tray.setIconDark(options.tray.darkIcon);
    }
    if (options.tray?.tooltip !== undefined) {
      tray.setTooltip(options.tray.tooltip);
    }
    if (options.tray?.menu !== undefined) {
      setTrayMenu(options.tray.menu);
    }
  }
  if (options.applicationMenu !== undefined) {
    setApplicationMenu(options.applicationMenu);
  }

  const active: DesktopChromeActive = {
    status: DESKTOP_CHROME_STATUSES.ACTIVE,
    setApplicationMenu,
    setTrayMenu,
    setTitle(title): void {
      assertOpen();
      window.setTitle(validateText(title, 'Desktop window title'));
    },
    performWindowAction(action: DesktopWindowAction): void {
      assertOpen();
      switch (action) {
        case DESKTOP_WINDOW_ACTIONS.SHOW:
          window.show();
          return;
        case DESKTOP_WINDOW_ACTIONS.HIDE:
          window.hide();
          return;
        case DESKTOP_WINDOW_ACTIONS.FOCUS:
          window.focus();
          return;
        case DESKTOP_WINDOW_ACTIONS.CLOSE:
          window.close();
          return;
        case DESKTOP_WINDOW_ACTIONS.RELOAD:
          window.reload();
          return;
      }
    },
    alert(message): DesktopOperationResult<void> {
      assertOpen();
      if (capability.dialogs === undefined) {
        return unavailable(DESKTOP_OPERATION_REASONS.MISSING_DIALOG);
      }
      capability.dialogs.alert(message);
      return performed(undefined);
    },
    confirm(message): DesktopOperationResult<boolean> {
      assertOpen();
      if (capability.dialogs === undefined) {
        return unavailable(DESKTOP_OPERATION_REASONS.MISSING_DIALOG);
      }
      return performed(capability.dialogs.confirm(message));
    },
    prompt(message, defaultValue): DesktopOperationResult<string | null> {
      assertOpen();
      if (capability.dialogs === undefined) {
        return unavailable(DESKTOP_OPERATION_REASONS.MISSING_DIALOG);
      }
      return performed(capability.dialogs.prompt(message, defaultValue));
    },
    async notify(
      notificationOptions: DesktopNotificationOptions,
    ): Promise<DesktopOperationResult<DesktopNotificationHandle>> {
      assertOpen();
      const Notification = capability.Notification;
      if (Notification === undefined) {
        return unavailable(DESKTOP_OPERATION_REASONS.MISSING_NOTIFICATION);
      }
      const permission = Notification.permission === 'default'
        ? await Notification.requestPermission()
        : Notification.permission;
      if (permission !== 'granted') {
        return unavailable(DESKTOP_OPERATION_REASONS.NOTIFICATION_PERMISSION_DENIED);
      }
      const { title, onClick, ...nativeOptions } = notificationOptions;
      const notification = new Notification(
        validateText(title, 'Desktop notification title'),
        nativeOptions,
      );
      if (onClick !== undefined) {
        notification.addEventListener('click', onClick);
      }
      return performed(notification);
    },
    dispose(): void {
      if (disposed) {
        return;
      }
      disposed = true;
      window.removeEventListener('menuclick', onApplicationMenuClick);
      window.setApplicationMenu(null);
      if (tray !== undefined) {
        tray.removeEventListener('menuclick', onTrayMenuClick);
        tray.removeEventListener('click', onTrayClick);
        tray.removeEventListener('dblclick', onTrayDoubleClick);
        tray.setMenu(null);
        tray.destroy();
      }
    },
  };
  return active;
}
