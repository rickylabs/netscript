import type {
  DESKTOP_CHROME_DISABLED_REASONS,
  DESKTOP_CHROME_STATUSES,
  DESKTOP_MENU_SOURCES,
  DESKTOP_OPERATION_REASONS,
  DESKTOP_OPERATION_STATUSES,
  DESKTOP_WINDOW_ACTIONS,
} from './constants.ts';

/** A clickable native menu declaration. */
export interface DesktopMenuActionItem {
  /** Declaration discriminator. */
  readonly type: 'action';
  /** Stable action identifier delivered to `onAction`. */
  readonly id: string;
  /** Native menu label. */
  readonly label: string;
  /** Optional cross-platform accelerator such as `CmdOrCtrl+S`. */
  readonly accelerator?: string;
  /** Whether the item accepts interaction. Defaults to `true`. */
  readonly enabled?: boolean;
}

/** A nested native menu declaration. */
export interface DesktopMenuSubmenu {
  /** Declaration discriminator. */
  readonly type: 'submenu';
  /** Native submenu label. */
  readonly label: string;
  /** Child declarations. */
  readonly items: readonly DesktopMenuItem[];
}

/** A native menu divider. */
export interface DesktopMenuSeparator {
  /** Declaration discriminator. */
  readonly type: 'separator';
}

/** A native operating-system menu role. */
export interface DesktopMenuRoleItem {
  /** Declaration discriminator. */
  readonly type: 'role';
  /** Role understood by the native desktop runtime, such as `copy` or `quit`. */
  readonly role: string;
}

/** Declarative native menu vocabulary accepted by desktop chrome. */
export type DesktopMenuItem =
  | DesktopMenuActionItem
  | DesktopMenuSubmenu
  | DesktopMenuSeparator
  | DesktopMenuRoleItem;

/** Origin of a declarative menu action. */
export type DesktopMenuSource = (typeof DESKTOP_MENU_SOURCES)[keyof typeof DESKTOP_MENU_SOURCES];

/** Event delivered when a declared action item is selected. */
export interface DesktopMenuActionEvent {
  /** Stable ID from the action declaration. */
  readonly actionId: string;
  /** Native menu surface that dispatched the action. */
  readonly source: DesktopMenuSource;
}

/** Native tagged-union menu shape used by Deno Desktop. */
export type DesktopNativeMenuItem =
  | {
    readonly item: {
      readonly label: string;
      readonly id: string;
      readonly accelerator?: string;
      readonly enabled: boolean;
    };
  }
  | {
    readonly submenu: {
      readonly label: string;
      readonly items: DesktopNativeMenuItem[];
    };
  }
  | 'separator'
  | { readonly role: { readonly role: string } };

/** Narrow event-target surface shared by native trays and windows. */
export interface DesktopEventTargetCapability {
  /** Subscribe to one native event. */
  addEventListener(type: string, listener: (event: Event) => void): void;
  /** Remove one native event subscription. */
  removeEventListener(type: string, listener: (event: Event) => void): void;
}

/** Existing native window controlled by desktop chrome. */
export interface DesktopWindowCapability extends DesktopEventTargetCapability {
  /** Replace or clear the native application menu. */
  setApplicationMenu(menu: DesktopNativeMenuItem[] | null): void;
  /** Show the window. */
  show(): void;
  /** Hide the window. */
  hide(): void;
  /** Focus the window. */
  focus(): void;
  /** Request that the window close. */
  close(): void;
  /** Reload the current webview document. */
  reload(): void;
  /** Replace the native window title. */
  setTitle(title: string): void;
}

/** Native tray instance used by desktop chrome. */
export interface DesktopTrayCapability extends DesktopEventTargetCapability {
  /** Native tray identifier; zero means the platform could not create a tray. */
  readonly trayId: number;
  /** Replace the light/default tray icon with PNG bytes. */
  setIcon(icon: Uint8Array): void;
  /** Replace or clear the dark-mode tray icon. */
  setIconDark(icon: Uint8Array | null): void;
  /** Replace or clear the tray tooltip. */
  setTooltip(tooltip: string | null): void;
  /** Replace or clear the native tray menu. */
  setMenu(menu: DesktopNativeMenuItem[] | null): void;
  /** Destroy the native tray. */
  destroy(): void;
}

/** Constructor for a native tray capability. */
export interface DesktopTrayConstructor {
  /** Construct a native tray without applying host policy. */
  new (): DesktopTrayCapability;
}

/** Desktop-gated native dialog globals. */
export interface DesktopDialogCapability {
  /** Show a native alert. */
  alert(message: string): void;
  /** Show a native confirmation dialog. */
  confirm(message: string): boolean;
  /** Show a native text prompt. */
  prompt(message: string, defaultValue?: string): string | null;
}

/** Options supported by the desktop notification helper. */
export interface DesktopNotificationOptions {
  /** Notification title. */
  readonly title: string;
  /** Optional notification body. */
  readonly body?: string;
  /** Optional data-URL icon. */
  readonly icon?: string;
  /** Replacement tag for an existing notification. */
  readonly tag?: string;
  /** Keep the notification visible until dismissed. */
  readonly requireInteraction?: boolean;
  /** Suppress notification sound. */
  readonly silent?: boolean | null;
  /** Called when the native notification is selected. */
  readonly onClick?: () => void;
}

/** Native notification returned to consumers for explicit dismissal. */
export interface DesktopNotificationHandle extends DesktopEventTargetCapability {
  /** Dismiss the notification. */
  close(): void;
}

/** Structural Web Notification constructor and permission surface. */
export interface DesktopNotificationCapability {
  /** Cached native notification permission. */
  readonly permission: NotificationPermission;
  /** Ask the user for native notification permission. */
  requestPermission(): Promise<NotificationPermission>;
  /** Construct a native notification. */
  new (
    title: string,
    options?: Omit<DesktopNotificationOptions, 'title' | 'onClick'>,
  ): DesktopNotificationHandle;
}

/** Aggregate desktop capability used for feature detection and deterministic tests. */
export interface DesktopChromeCapability {
  /** Marker constructor present only in Deno Desktop runtimes. */
  readonly BrowserWindow?: abstract new (...args: never[]) => object;
  /** Optional native tray constructor. */
  readonly Tray?: DesktopTrayConstructor;
  /** Optional native dialog globals. */
  readonly dialogs?: DesktopDialogCapability;
  /** Optional Web Notification constructor. */
  readonly Notification?: DesktopNotificationCapability;
}

/** Declarative tray configuration. */
export interface DesktopTrayConfig {
  /** PNG bytes for the default tray icon. */
  readonly icon?: Uint8Array;
  /** PNG bytes for dark mode, or `null` to clear a prior dark icon. */
  readonly darkIcon?: Uint8Array | null;
  /** Native tooltip, or `null` to omit it. */
  readonly tooltip?: string | null;
  /** Initial native tray menu. */
  readonly menu?: readonly DesktopMenuItem[];
  /** Called for a primary tray click. */
  readonly onClick?: () => void;
  /** Called for a primary tray double-click. */
  readonly onDoubleClick?: () => void;
}

/** Options for activating desktop chrome around an existing native window. */
export interface CreateDesktopChromeOptions {
  /** Existing native window; desktop chrome never creates one implicitly. */
  readonly window?: DesktopWindowCapability;
  /** Initial native application menu. */
  readonly applicationMenu?: readonly DesktopMenuItem[];
  /** Optional native tray configuration. */
  readonly tray?: DesktopTrayConfig;
  /** Receives action IDs selected from application or tray menus. */
  readonly onAction?: (event: DesktopMenuActionEvent) => void;
  /** Explicit capability seam for tests; omit to feature-detect desktop globals. */
  readonly capability?: DesktopChromeCapability | null;
}

/** Desktop chrome activation status. */
export type DesktopChromeStatus =
  (typeof DESKTOP_CHROME_STATUSES)[keyof typeof DESKTOP_CHROME_STATUSES];

/** Reason desktop chrome activation was disabled. */
export type DesktopChromeDisabledReason =
  (typeof DESKTOP_CHROME_DISABLED_REASONS)[keyof typeof DESKTOP_CHROME_DISABLED_REASONS];

/** Native window action supported by desktop chrome. */
export type DesktopWindowAction =
  (typeof DESKTOP_WINDOW_ACTIONS)[keyof typeof DESKTOP_WINDOW_ACTIONS];

/** Optional native operation result status. */
export type DesktopOperationStatus =
  (typeof DESKTOP_OPERATION_STATUSES)[keyof typeof DESKTOP_OPERATION_STATUSES];

/** Reason an optional native operation was unavailable. */
export type DesktopOperationReason =
  (typeof DESKTOP_OPERATION_REASONS)[keyof typeof DESKTOP_OPERATION_REASONS];

/** Result of a gated native operation. */
export type DesktopOperationResult<T> =
  | { readonly status: 'performed'; readonly value: T }
  | { readonly status: 'unavailable'; readonly reason: DesktopOperationReason };

/** Inert lifecycle returned outside a usable desktop runtime. */
export interface DesktopChromeDisabled {
  /** Disabled lifecycle discriminator. */
  readonly status: 'disabled';
  /** Structural reason activation was disabled. */
  readonly reason: DesktopChromeDisabledReason;
  /** Idempotent no-op for lifecycle symmetry. */
  dispose(): void;
}

/** Active controller for native desktop chrome. */
export interface DesktopChromeActive {
  /** Active lifecycle discriminator. */
  readonly status: 'active';
  /** Replace or clear the application menu. */
  setApplicationMenu(menu: readonly DesktopMenuItem[] | null): void;
  /** Replace or clear the tray menu. */
  setTrayMenu(menu: readonly DesktopMenuItem[] | null): void;
  /** Replace the native window title. */
  setTitle(title: string): void;
  /** Perform one documented native window action. */
  performWindowAction(action: DesktopWindowAction): void;
  /** Show a desktop-gated native alert. */
  alert(message: string): DesktopOperationResult<void>;
  /** Show a desktop-gated native confirmation dialog. */
  confirm(message: string): DesktopOperationResult<boolean>;
  /** Show a desktop-gated native text prompt. */
  prompt(message: string, defaultValue?: string): DesktopOperationResult<string | null>;
  /** Request permission and show a native notification when available. */
  notify(
    options: DesktopNotificationOptions,
  ): Promise<DesktopOperationResult<DesktopNotificationHandle>>;
  /** Remove listeners, menus, and the owned tray exactly once. */
  dispose(): void;
}

/** Active or inert result returned by `createDesktopChrome`. */
export type DesktopChromeLifecycle = DesktopChromeActive | DesktopChromeDisabled;
