import { assertEquals, assertRejects, assertThrows } from '@std/assert';
import {
  createDesktopChrome,
  DESKTOP_CHROME_DISABLED_REASONS,
  DESKTOP_MENU_SOURCES,
  DESKTOP_OPERATION_REASONS,
  DESKTOP_WINDOW_ACTIONS,
  type DesktopChromeCapability,
  type DesktopEventTargetCapability,
  type DesktopNativeMenuItem,
  type DesktopNotificationHandle,
  type DesktopTrayCapability,
  type DesktopTrayConstructor,
  type DesktopWindowCapability,
} from '../../desktop.ts';

class FakeEventTarget implements DesktopEventTargetCapability {
  readonly listeners = new Map<string, Set<(event: Event) => void>>();

  addEventListener(type: string, listener: (event: Event) => void): void {
    const listeners = this.listeners.get(type) ?? new Set();
    listeners.add(listener);
    this.listeners.set(type, listeners);
  }

  removeEventListener(type: string, listener: (event: Event) => void): void {
    this.listeners.get(type)?.delete(listener);
  }

  emit(type: string, event: Event = new Event(type)): void {
    for (const listener of this.listeners.get(type) ?? []) {
      listener(event);
    }
  }
}

class FakeMenuEvent extends Event {
  constructor(readonly detail: { readonly id: string }) {
    super('menuclick');
  }
}

class FakeWindow extends FakeEventTarget implements DesktopWindowCapability {
  menu: DesktopNativeMenuItem[] | null = null;
  readonly calls: string[] = [];

  setApplicationMenu(menu: DesktopNativeMenuItem[] | null): void {
    this.menu = menu;
  }

  show(): void {
    this.calls.push('show');
  }

  hide(): void {
    this.calls.push('hide');
  }

  focus(): void {
    this.calls.push('focus');
  }

  close(): void {
    this.calls.push('close');
  }

  reload(): void {
    this.calls.push('reload');
  }

  setTitle(title: string): void {
    this.calls.push(`title:${title}`);
  }
}

class FakeTray extends FakeEventTarget implements DesktopTrayCapability {
  menu: DesktopNativeMenuItem[] | null = null;
  icon?: Uint8Array;
  darkIcon?: Uint8Array | null;
  tooltip?: string | null;
  destroyed = false;

  constructor(readonly trayId: number) {
    super();
  }

  setIcon(icon: Uint8Array): void {
    this.icon = icon;
  }

  setIconDark(icon: Uint8Array | null): void {
    this.darkIcon = icon;
  }

  setTooltip(tooltip: string | null): void {
    this.tooltip = tooltip;
  }

  setMenu(menu: DesktopNativeMenuItem[] | null): void {
    this.menu = menu;
  }

  destroy(): void {
    this.destroyed = true;
  }
}

function trayConstructor(tray: FakeTray): DesktopTrayConstructor {
  return class {
    constructor() {
      return tray;
    }
  } as DesktopTrayConstructor;
}

class DesktopMarker {}

function capability(overrides: Partial<DesktopChromeCapability> = {}): DesktopChromeCapability {
  return { BrowserWindow: DesktopMarker, ...overrides };
}

Deno.test('createDesktopChrome no-ops cleanly outside desktop and for partial capabilities', () => {
  const window = new FakeWindow();

  const browser = createDesktopChrome({ window, capability: null });
  assertEquals(browser.status, 'disabled');
  if (browser.status === 'disabled') {
    assertEquals(browser.reason, DESKTOP_CHROME_DISABLED_REASONS.NOT_DESKTOP);
  }
  assertEquals(createDesktopChrome({ window }).status, 'disabled');
  assertEquals(createDesktopChrome({ capability: capability() }).status, 'disabled');
  assertEquals(
    createDesktopChrome({ window, capability: capability(), tray: {} }).status,
    'disabled',
  );

  const unavailableTray = new FakeTray(0);
  const unavailable = createDesktopChrome({
    window,
    tray: {},
    capability: capability({ Tray: trayConstructor(unavailableTray) }),
  });
  assertEquals(unavailable.status, 'disabled');
  if (unavailable.status === 'disabled') {
    assertEquals(unavailable.reason, DESKTOP_CHROME_DISABLED_REASONS.TRAY_UNAVAILABLE);
  }
  assertEquals(unavailableTray.destroyed, true);
  unavailable.dispose();
});

Deno.test('createDesktopChrome wires declarative tray and application menu events', () => {
  const window = new FakeWindow();
  const tray = new FakeTray(7);
  const actions: Array<{ actionId: string; source: string }> = [];
  let clicks = 0;
  let doubleClicks = 0;
  const icon = new Uint8Array([1, 2, 3]);
  const darkIcon = new Uint8Array([4, 5, 6]);

  const chrome = createDesktopChrome({
    window,
    capability: capability({ Tray: trayConstructor(tray) }),
    applicationMenu: [
      {
        type: 'submenu',
        label: 'File',
        items: [
          { type: 'action', id: 'open', label: 'Open', accelerator: 'CmdOrCtrl+O' },
          { type: 'separator' },
          { type: 'role', role: 'quit' },
        ],
      },
    ],
    tray: {
      icon,
      darkIcon,
      tooltip: 'NetScript',
      menu: [{ type: 'action', id: 'show', label: 'Show', enabled: false }],
      onClick: () => clicks++,
      onDoubleClick: () => doubleClicks++,
    },
    onAction: (event) => actions.push(event),
  });

  assertEquals(chrome.status, 'active');
  assertEquals(tray.icon, icon);
  assertEquals(tray.darkIcon, darkIcon);
  assertEquals(tray.tooltip, 'NetScript');
  assertEquals(window.menu, [{
    submenu: {
      label: 'File',
      items: [
        { item: { label: 'Open', id: 'open', accelerator: 'CmdOrCtrl+O', enabled: true } },
        'separator',
        { role: { role: 'quit' } },
      ],
    },
  }]);
  assertEquals(tray.menu, [{ item: { label: 'Show', id: 'show', enabled: false } }]);

  window.emit('menuclick', new FakeMenuEvent({ id: 'open' }));
  window.emit('menuclick', new FakeMenuEvent({ id: 'unknown' }));
  tray.emit('menuclick', new FakeMenuEvent({ id: 'show' }));
  tray.emit('click');
  tray.emit('dblclick');
  assertEquals(actions, [
    { actionId: 'open', source: DESKTOP_MENU_SOURCES.APPLICATION_MENU },
    { actionId: 'show', source: DESKTOP_MENU_SOURCES.TRAY },
  ]);
  assertEquals([clicks, doubleClicks], [1, 1]);

  if (chrome.status === 'active') {
    chrome.setApplicationMenu([{ type: 'action', id: 'save', label: 'Save' }]);
    chrome.setTrayMenu(null);
  }
  window.emit('menuclick', new FakeMenuEvent({ id: 'open' }));
  window.emit('menuclick', new FakeMenuEvent({ id: 'save' }));
  tray.emit('menuclick', new FakeMenuEvent({ id: 'show' }));
  assertEquals(actions.at(-1), {
    actionId: 'save',
    source: DESKTOP_MENU_SOURCES.APPLICATION_MENU,
  });

  chrome.dispose();
  chrome.dispose();
  assertEquals(window.menu, null);
  assertEquals(tray.menu, null);
  assertEquals(tray.destroyed, true);
  assertEquals(window.listeners.get('menuclick')?.size, 0);
  assertEquals(tray.listeners.get('menuclick')?.size, 0);
});

Deno.test('createDesktopChrome validates menu vocabulary before applying it', () => {
  const chrome = createDesktopChrome({
    window: new FakeWindow(),
    capability: capability(),
  });
  if (chrome.status !== 'active') {
    throw new Error('Expected active desktop chrome');
  }

  assertThrows(
    () => chrome.setApplicationMenu([{ type: 'action', id: '', label: 'Open' }]),
    TypeError,
    'action ID must not be empty',
  );
  assertThrows(
    () =>
      chrome.setApplicationMenu([
        { type: 'action', id: 'save', label: 'Save' },
        {
          type: 'submenu',
          label: 'More',
          items: [{ type: 'action', id: 'save', label: 'Save again' }],
        },
      ]),
    TypeError,
    'must be unique',
  );
});

Deno.test('active desktop chrome exposes only documented window operations', () => {
  const window = new FakeWindow();
  const chrome = createDesktopChrome({ window, capability: capability() });
  if (chrome.status !== 'active') {
    throw new Error('Expected active desktop chrome');
  }

  chrome.setTitle('NetScript Desktop');
  chrome.performWindowAction(DESKTOP_WINDOW_ACTIONS.SHOW);
  chrome.performWindowAction(DESKTOP_WINDOW_ACTIONS.HIDE);
  chrome.performWindowAction(DESKTOP_WINDOW_ACTIONS.FOCUS);
  chrome.performWindowAction(DESKTOP_WINDOW_ACTIONS.RELOAD);
  chrome.performWindowAction(DESKTOP_WINDOW_ACTIONS.CLOSE);
  assertEquals(window.calls, [
    'title:NetScript Desktop',
    'show',
    'hide',
    'focus',
    'reload',
    'close',
  ]);

  chrome.dispose();
  assertThrows(() => chrome.performWindowAction(DESKTOP_WINDOW_ACTIONS.SHOW), Error, 'disposed');
});

Deno.test('desktop dialogs are gated and preserve native results', () => {
  const withoutDialogs = createDesktopChrome({
    window: new FakeWindow(),
    capability: capability(),
  });
  if (withoutDialogs.status !== 'active') {
    throw new Error('Expected active desktop chrome');
  }
  assertEquals(withoutDialogs.alert('Saved'), {
    status: 'unavailable',
    reason: DESKTOP_OPERATION_REASONS.MISSING_DIALOG,
  });

  const calls: string[] = [];
  const chrome = createDesktopChrome({
    window: new FakeWindow(),
    capability: capability({
      dialogs: {
        alert: (message) => calls.push(`alert:${message}`),
        confirm: (message) => {
          calls.push(`confirm:${message}`);
          return true;
        },
        prompt: (message, defaultValue) => {
          calls.push(`prompt:${message}:${defaultValue}`);
          return 'renamed';
        },
      },
    }),
  });
  if (chrome.status !== 'active') {
    throw new Error('Expected active desktop chrome');
  }
  assertEquals(chrome.alert('Saved'), { status: 'performed', value: undefined });
  assertEquals(chrome.confirm('Discard?'), { status: 'performed', value: true });
  assertEquals(chrome.prompt('Name?', 'Untitled'), { status: 'performed', value: 'renamed' });
  assertEquals(calls, ['alert:Saved', 'confirm:Discard?', 'prompt:Name?:Untitled']);
});

class FakeNotification extends FakeEventTarget implements DesktopNotificationHandle {
  static permission: NotificationPermission = 'default';
  static requestedPermission: NotificationPermission = 'granted';
  static instances: FakeNotification[] = [];
  static requests = 0;

  static requestPermission(): Promise<NotificationPermission> {
    FakeNotification.requests++;
    FakeNotification.permission = FakeNotification.requestedPermission;
    return Promise.resolve(FakeNotification.requestedPermission);
  }

  closed = false;

  constructor(
    readonly title: string,
    readonly options: unknown = {},
  ) {
    super();
    FakeNotification.instances.push(this);
  }

  close(): void {
    this.closed = true;
  }
}

Deno.test('desktop notifications request permission, dispatch clicks, and no-op when unavailable', async () => {
  const unavailable = createDesktopChrome({
    window: new FakeWindow(),
    capability: capability(),
  });
  if (unavailable.status !== 'active') {
    throw new Error('Expected active desktop chrome');
  }
  assertEquals(await unavailable.notify({ title: 'Ready' }), {
    status: 'unavailable',
    reason: DESKTOP_OPERATION_REASONS.MISSING_NOTIFICATION,
  });

  FakeNotification.permission = 'default';
  FakeNotification.requestedPermission = 'granted';
  FakeNotification.instances = [];
  FakeNotification.requests = 0;
  let clicks = 0;
  const chrome = createDesktopChrome({
    window: new FakeWindow(),
    capability: capability({ Notification: FakeNotification }),
  });
  if (chrome.status !== 'active') {
    throw new Error('Expected active desktop chrome');
  }
  const result = await chrome.notify({
    title: 'Build complete',
    body: 'Your binary is ready.',
    tag: 'build',
    onClick: () => clicks++,
  });
  assertEquals(FakeNotification.requests, 1);
  assertEquals(FakeNotification.instances[0].title, 'Build complete');
  assertEquals(FakeNotification.instances[0].options, {
    body: 'Your binary is ready.',
    tag: 'build',
  });
  FakeNotification.instances[0].emit('click');
  assertEquals(clicks, 1);
  assertEquals(result.status, 'performed');

  FakeNotification.permission = 'denied';
  assertEquals(await chrome.notify({ title: 'Denied' }), {
    status: 'unavailable',
    reason: DESKTOP_OPERATION_REASONS.NOTIFICATION_PERMISSION_DENIED,
  });

  chrome.dispose();
  await assertRejects(() => chrome.notify({ title: 'Disposed' }), Error, 'disposed');
});
