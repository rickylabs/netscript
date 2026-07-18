/**
 * Native desktop chrome contracts and browser-safe activation.
 *
 * @module
 */

export {
  DESKTOP_CHROME_DISABLED_REASONS,
  DESKTOP_CHROME_STATUSES,
  DESKTOP_MENU_SOURCES,
  DESKTOP_OPERATION_REASONS,
  DESKTOP_OPERATION_STATUSES,
  DESKTOP_WINDOW_ACTIONS,
} from './constants.ts';
export { createDesktopChrome } from './create-desktop-chrome.ts';
export type {
  CreateDesktopChromeOptions,
  DesktopChromeActive,
  DesktopChromeCapability,
  DesktopChromeDisabled,
  DesktopChromeDisabledReason,
  DesktopChromeLifecycle,
  DesktopChromeStatus,
  DesktopDialogCapability,
  DesktopEventTargetCapability,
  DesktopMenuActionEvent,
  DesktopMenuActionItem,
  DesktopMenuItem,
  DesktopMenuRoleItem,
  DesktopMenuSeparator,
  DesktopMenuSource,
  DesktopMenuSubmenu,
  DesktopNativeMenuItem,
  DesktopNotificationCapability,
  DesktopNotificationHandle,
  DesktopNotificationOptions,
  DesktopOperationReason,
  DesktopOperationResult,
  DesktopOperationStatus,
  DesktopTrayCapability,
  DesktopTrayConfig,
  DesktopTrayConstructor,
  DesktopWindowAction,
  DesktopWindowCapability,
} from './types.ts';
