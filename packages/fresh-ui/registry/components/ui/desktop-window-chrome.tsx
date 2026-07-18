/**
 * @component DesktopWindowChrome
 * @layer 2
 * @depends theme-seed
 * @description Accessible title-bar actions for documented Deno Desktop window operations.
 */

import type { ComponentChildren, VNode } from 'preact';

/** Window operations that can be represented by desktop chrome controls. */
export type DesktopWindowChromeAction = 'show' | 'hide' | 'focus' | 'reload' | 'close';

/** Props for the desktop window chrome component. */
export interface DesktopWindowChromeProps {
  /** Window title or app identity. */
  readonly title: ComponentChildren;
  /** Optional content rendered before the action group. */
  readonly leading?: ComponentChildren;
  /** Documented native actions to render. Defaults to reload, hide, and close. */
  readonly actions?: readonly DesktopWindowChromeAction[];
  /** Receives the selected documented action. */
  readonly onAction?: (action: DesktopWindowChromeAction) => void;
  /** Disable every action while the host is unavailable or busy. */
  readonly disabled?: boolean;
  /** Additional root class name. */
  readonly class?: string;
}

interface ActionPresentation {
  readonly label: string;
  readonly symbol: string;
}

const DEFAULT_ACTIONS: readonly DesktopWindowChromeAction[] = ['reload', 'hide', 'close'];

const ACTION_PRESENTATION: Readonly<Record<DesktopWindowChromeAction, ActionPresentation>> = {
  show: { label: 'Show window', symbol: '□' },
  hide: { label: 'Hide window', symbol: '−' },
  focus: { label: 'Focus window', symbol: '◉' },
  reload: { label: 'Reload window', symbol: '↻' },
  close: { label: 'Close window', symbol: '×' },
};

function classes(...values: Array<string | undefined>): string {
  return values.filter((value): value is string => value !== undefined && value.length > 0).join(
    ' ',
  );
}

/** Render a draggable-looking title bar whose controls emit only documented window operations. */
export function DesktopWindowChrome({
  title,
  leading,
  actions = DEFAULT_ACTIONS,
  onAction,
  disabled = false,
  class: className,
}: DesktopWindowChromeProps): VNode {
  return (
    <header
      class={classes('ns-desktop-window-chrome', className)}
      data-part='window-chrome'
      data-state={disabled ? 'disabled' : 'active'}
    >
      <div class='ns-desktop-window-chrome__identity' data-part='identity'>
        {leading === undefined
          ? null
          : <span class='ns-desktop-window-chrome__leading'>{leading}</span>}
        <span class='ns-desktop-window-chrome__title'>{title}</span>
      </div>
      <div
        aria-label='Window controls'
        class='ns-desktop-window-chrome__actions'
        data-part='actions'
        role='group'
      >
        {actions.map((action) => {
          const presentation = ACTION_PRESENTATION[action];
          return (
            <button
              type='button'
              aria-label={presentation.label}
              class={classes(
                'ns-desktop-window-chrome__action',
                action === 'close' ? 'ns-desktop-window-chrome__action--close' : undefined,
              )}
              data-desktop-action={action}
              data-part='action'
              data-state={disabled ? 'disabled' : 'enabled'}
              disabled={disabled}
              onClick={() => onAction?.(action)}
            >
              <span aria-hidden='true'>{presentation.symbol}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
