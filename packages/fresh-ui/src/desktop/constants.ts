/** Public lifecycle statuses returned by `createDesktopChrome`. */
export const DESKTOP_CHROME_STATUSES = {
  ACTIVE: 'active',
  DISABLED: 'disabled',
} as const;

/** Structural reasons desktop chrome could not be activated. */
export const DESKTOP_CHROME_DISABLED_REASONS = {
  NOT_DESKTOP: 'not-desktop',
  MISSING_WINDOW: 'missing-window',
  MISSING_TRAY: 'missing-tray',
  TRAY_UNAVAILABLE: 'tray-unavailable',
} as const;

/** Sources that can dispatch declarative menu actions. */
export const DESKTOP_MENU_SOURCES = {
  APPLICATION_MENU: 'application-menu',
  TRAY: 'tray',
} as const;

/** Native window operations exposed by the desktop chrome controller. */
export const DESKTOP_WINDOW_ACTIONS = {
  SHOW: 'show',
  HIDE: 'hide',
  FOCUS: 'focus',
  CLOSE: 'close',
  RELOAD: 'reload',
} as const;

/** Status vocabulary for optional native operations. */
export const DESKTOP_OPERATION_STATUSES = {
  PERFORMED: 'performed',
  UNAVAILABLE: 'unavailable',
} as const;

/** Reasons an optional native operation could not run. */
export const DESKTOP_OPERATION_REASONS = {
  MISSING_DIALOG: 'missing-dialog',
  MISSING_NOTIFICATION: 'missing-notification',
  NOTIFICATION_PERMISSION_DENIED: 'notification-permission-denied',
} as const;
