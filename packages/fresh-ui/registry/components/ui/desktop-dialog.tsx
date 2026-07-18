/**
 * @component DesktopDialog
 * @layer 2
 * @depends theme-seed
 * @description Native-dialog request controls that keep browser rendering side-effect free.
 */

import type { VNode } from 'preact';

/** Native dialog operations exposed by `createDesktopChrome`. */
export type DesktopDialogKind = 'alert' | 'confirm' | 'prompt';

/** A declarative request for the host-owned desktop controller. */
export interface DesktopDialogRequest {
  readonly kind: DesktopDialogKind;
  readonly message: string;
  readonly defaultValue?: string;
}

/** Props for desktop dialog request controls. */
export interface DesktopDialogProps {
  /** Dialog message passed to the native controller. */
  readonly message: string;
  /** Initial prompt value when the prompt action is chosen. */
  readonly defaultValue?: string;
  /** Receives a request; rendering never invokes a native dialog itself. */
  readonly onRequest?: (request: DesktopDialogRequest) => void;
  /** Disable requests when no desktop controller is active. */
  readonly disabled?: boolean;
  /** Additional root class name. */
  readonly class?: string;
}

const DIALOG_KINDS: readonly DesktopDialogKind[] = ['alert', 'confirm', 'prompt'];

function classes(...values: Array<string | undefined>): string {
  return values.filter((value): value is string => value !== undefined && value.length > 0).join(
    ' ',
  );
}

/** Render explicit native-dialog intents for a desktop host to execute. */
export function DesktopDialog({
  message,
  defaultValue,
  onRequest,
  disabled = false,
  class: className,
}: DesktopDialogProps): VNode {
  return (
    <section
      class={classes('ns-desktop-dialog', className)}
      data-part='desktop-dialog'
      data-state={disabled ? 'disabled' : 'ready'}
    >
      <div class='ns-desktop-dialog__copy' data-part='copy'>
        <strong>Native dialogs</strong>
        <span>{message}</span>
      </div>
      <div class='ns-desktop-dialog__actions' data-part='actions' role='group'>
        {DIALOG_KINDS.map((kind) => (
          <button
            type='button'
            class='ns-desktop-dialog__action'
            data-dialog-kind={kind}
            data-part='action'
            disabled={disabled}
            onClick={() => onRequest?.({ kind, message, defaultValue })}
          >
            {kind}
          </button>
        ))}
      </div>
    </section>
  );
}
