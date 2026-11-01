/**
 * @component DesktopWindowChrome
 * @layer 2
 * @depends theme-seed
 * @description Accessible title-bar actions for documented Deno Desktop window operations.
 */

import type { ComponentChildren, VNode } from 'preact';
import { cn } from '../../lib/cn.ts';

/** Window operations that can be represented by desktop chrome controls. */
export type DesktopWindowChromeAction = 'show' | 'hide' | 'focus' | 'reload' | 'close';

/** Caller-selected platform presentation; it does not detect a native host. */
export type DesktopWindowChromePlatform = 'macos' | 'windows' | 'linux';

/** Focus snapshots preserve both the published blurred and ledger unfocused spelling. */
export type DesktopWindowChromeState = 'focused' | 'blurred' | 'hover' | 'unfocused' | 'disabled';

/** Props for the desktop window chrome component. */
export interface DesktopWindowChromeProps {
  /** Optional platform presentation; omission preserves the legacy action order. */
  readonly platform?: DesktopWindowChromePlatform;
  /** Controlled presentation snapshot; focus changes never invoke a native operation. */
  readonly state?: DesktopWindowChromeState;
  /** Window title or app identity. */
  readonly title: ComponentChildren;
  /** Optional content rendered before the action group. */
  readonly leading?: ComponentChildren;
  /** Documented native actions to render. Defaults depend on platform; explicit arrays preserve caller order. */
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
const PLATFORM_ACTIONS: Readonly<
  Record<DesktopWindowChromePlatform, readonly DesktopWindowChromeAction[]>
> = {
  macos: ['close', 'hide', 'reload'],
  windows: ['hide', 'reload', 'close'],
  linux: ['hide', 'reload', 'close'],
};

const ACTION_PRESENTATION: Readonly<Record<DesktopWindowChromeAction, ActionPresentation>> = {
  show: { label: 'Show window', symbol: '□' },
  hide: { label: 'Hide window', symbol: '−' },
  focus: { label: 'Focus window', symbol: '◉' },
  reload: { label: 'Reload window', symbol: '↻' },
  close: { label: 'Close window', symbol: '×' },
};

/** Render a draggable-looking title bar whose controls emit only documented window operations. */
export function DesktopWindowChrome({
  title,
  leading,
  platform,
  state,
  actions = platform === undefined ? DEFAULT_ACTIONS : PLATFORM_ACTIONS[platform],
  onAction,
  disabled = false,
  class: className,
}: DesktopWindowChromeProps): VNode {
  const unavailable = disabled || state === 'disabled';
  return (
    <header
      class={cn('ns-desktop-window-chrome', className)}
      data-scope='window-chrome'
      data-part='root'
      data-platform={platform}
      data-state={unavailable ? 'disabled' : state ?? 'active'}
      style={{ '--ns-window-action-count': actions.length }}
    >
      <div
        class='ns-desktop-window-chrome__identity'
        data-scope='window-chrome'
        data-part='identity'
      >
        {leading === undefined ? null : (
          <span
            class='ns-desktop-window-chrome__leading'
            data-part='leading'
            data-scope='window-chrome'
          >
            {leading}
          </span>
        )}
        <span
          class='ns-desktop-window-chrome__title'
          data-part='title'
          data-scope='window-chrome'
        >
          {title}
        </span>
      </div>
      <div
        aria-label='Window controls'
        class='ns-desktop-window-chrome__actions'
        data-scope='window-chrome'
        data-part='actions'
        role='group'
      >
        {actions.map((action) => {
          const presentation = ACTION_PRESENTATION[action];
          return (
            <button
              type='button'
              aria-label={presentation.label}
              class={cn('ns-desktop-window-chrome__action')}
              data-action={action}
              data-scope='window-chrome'
              data-desktop-action={action}
              data-part='action'
              data-state={unavailable ? 'disabled' : state ?? 'enabled'}
              disabled={unavailable}
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
