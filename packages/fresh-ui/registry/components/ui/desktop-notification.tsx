/**
 * @component DesktopNotification
 * @layer 2
 * @depends theme-seed
 * @description Notification request surface that stays inert until the user asks the host.
 */

import type { VNode } from 'preact';

/** Copy-owned notification preview/request options. */
export interface DesktopNotificationRequest {
  readonly title: string;
  readonly body?: string;
  readonly icon?: string;
  readonly tag?: string;
  readonly requireInteraction?: boolean;
  readonly silent?: boolean | null;
}

/** Props for the desktop notification request surface. */
export interface DesktopNotificationProps {
  /** Notification options passed unchanged to the desktop controller. */
  readonly notification: DesktopNotificationRequest;
  /** Receives the request after an explicit user action. */
  readonly onRequest?: (notification: DesktopNotificationRequest) => void;
  /** Disable requests when notifications are unavailable. */
  readonly disabled?: boolean;
  /** Additional root class name. */
  readonly class?: string;
}

function classes(...values: Array<string | undefined>): string {
  return values.filter((value): value is string => value !== undefined && value.length > 0).join(
    ' ',
  );
}

/** Render a side-effect-free preview and explicit native-notification intent. */
export function DesktopNotification({
  notification,
  onRequest,
  disabled = false,
  class: className,
}: DesktopNotificationProps): VNode {
  return (
    <section
      aria-label='Desktop notification preview'
      class={classes('ns-desktop-notification', className)}
      data-part='desktop-notification'
      data-state={disabled ? 'disabled' : 'ready'}
    >
      {notification.icon === undefined ? null : (
        <img
          alt=''
          class='ns-desktop-notification__icon'
          data-part='icon'
          height='40'
          src={notification.icon}
          width='40'
        />
      )}
      <div class='ns-desktop-notification__copy' data-part='copy'>
        <strong>{notification.title}</strong>
        {notification.body === undefined ? null : <span>{notification.body}</span>}
      </div>
      <button
        type='button'
        class='ns-desktop-notification__action'
        data-part='action'
        disabled={disabled}
        onClick={() => onRequest?.(notification)}
      >
        Notify me
      </button>
    </section>
  );
}
