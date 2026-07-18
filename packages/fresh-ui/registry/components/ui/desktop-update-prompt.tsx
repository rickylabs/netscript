/**
 * @component DesktopUpdatePrompt
 * @layer 2
 * @depends theme-seed
 * @description Exhaustive update-ready UX for automatic relaunch and manual installer paths.
 */

import type { AutoUpdateReadyEvent } from '@netscript/sdk/auto-update';
import type { VNode } from 'preact';

/** Props for the desktop update-ready prompt. */
export interface DesktopUpdatePromptProps {
  /** Discriminated ready event emitted by `@netscript/sdk/auto-update`. */
  readonly event: AutoUpdateReadyEvent;
  /** Optional host callback for an automatic update restart action. */
  readonly onRestart?: () => void;
  /** Additional root class name. */
  readonly class?: string;
}

function classes(...values: Array<string | undefined>): string {
  return values.filter((value): value is string => value !== undefined && value.length > 0).join(
    ' ',
  );
}

function assertNever(value: never): never {
  throw new TypeError(`Unsupported desktop update apply mode: ${String(value)}`);
}

/** Render the exact automatic or manual application path carried by the ready-event contract. */
export function DesktopUpdatePrompt({
  event,
  onRestart,
  class: className,
}: DesktopUpdatePromptProps): VNode {
  switch (event.applyMode) {
    case 'automatic':
      return (
        <aside
          aria-live='polite'
          class={classes('ns-desktop-update-prompt', className)}
          data-part='update-prompt'
          data-state='automatic'
          role='status'
        >
          <div class='ns-desktop-update-prompt__copy' data-part='copy'>
            <strong class='ns-desktop-update-prompt__title'>Update ready — restart to apply</strong>
            <span class='ns-desktop-update-prompt__description'>
              Version {event.version} has been verified and staged.
            </span>
          </div>
          {onRestart === undefined ? null : (
            <button
              type='button'
              class='ns-desktop-update-prompt__action'
              data-part='action'
              onClick={onRestart}
            >
              Restart now
            </button>
          )}
        </aside>
      );
    case 'manual':
      return (
        <aside
          aria-live='polite'
          class={classes('ns-desktop-update-prompt', className)}
          data-part='update-prompt'
          data-state='manual'
          role='status'
        >
          <div class='ns-desktop-update-prompt__copy' data-part='copy'>
            <strong class='ns-desktop-update-prompt__title'>Update ready — install manually</strong>
            <span class='ns-desktop-update-prompt__description'>
              Version {event.version} requires the Windows installer to finish updating.
            </span>
          </div>
          <a
            class='ns-desktop-update-prompt__action'
            data-part='action'
            href={event.manualUpdateUrl}
            rel='noreferrer noopener'
            target='_blank'
          >
            Open installer
          </a>
        </aside>
      );
    default:
      return assertNever(event);
  }
}
