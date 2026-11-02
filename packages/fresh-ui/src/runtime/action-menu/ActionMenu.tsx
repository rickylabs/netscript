import { createContext } from 'preact';
import type { ComponentChildren, JSX, VNode } from 'preact';
import { useContext, useLayoutEffect, useRef } from 'preact/hooks';
import { composeEventHandlers } from '../_internal/compose-event-handlers.ts';
import { composeRefs } from '../_internal/compose-refs.ts';
import { requireFreshUiContext } from '../_internal/context-error.ts';
import { getNextCollectionIndex } from '../_internal/collection-navigation.ts';
import type { FreshUiChild } from '../_internal/public-props.ts';
import type { UsePopoverReturn } from '../popover/popover.types.ts';
import { usePopover } from '../popover/use-popover.ts';
import type {
  ActionMenuContentProps,
  ActionMenuItemProps,
  ActionMenuRootProps,
  ActionMenuSeparatorProps,
  ActionMenuTriggerProps,
} from './action-menu.types.ts';

type ActionMenuContextValue = UsePopoverReturn & {
  triggerRef: { current: HTMLButtonElement | null };
};

// App-owned floating.css styles the delegated popover scope.
const ACTION_MENU_SCOPE = 'popover';

const ActionMenuContext = createContext<ActionMenuContextValue | null>(null);

function useActionMenuContext(part: string): ActionMenuContextValue {
  return requireFreshUiContext(useContext(ActionMenuContext), part, 'ActionMenu.Root');
}

/** Provides controlled or uncontrolled state for an action menu. */
export function ActionMenuRoot(
  { children, onOpenChange, ...options }: ActionMenuRootProps,
): VNode {
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const popover = usePopover({
    ...options,
    modal: false,
    onOpenChange,
  });
  return (
    <ActionMenuContext.Provider value={{ ...popover, triggerRef }}>
      {children as ComponentChildren}
    </ActionMenuContext.Provider>
  );
}

/** Renders the native button that opens the action menu. */
export function ActionMenuTrigger(
  { children, onClick, ...props }: ActionMenuTriggerProps,
): VNode {
  const menu = useActionMenuContext('ActionMenu.Trigger');
  const triggerProps = props as JSX.ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button
      {...menu.getTriggerProps({
        ...triggerProps,
        onClick: composeEventHandlers(onClick, (event) => event.stopPropagation()),
        ref: composeRefs(menu.triggerRef),
      })}
      aria-haspopup='menu'
    >
      {children as ComponentChildren}
    </button>
  );
}

function enabledItems(element: HTMLElement): HTMLButtonElement[] {
  return [...element.querySelectorAll<HTMLButtonElement>(
    '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]',
  )].filter(
    (item) =>
      item.closest('[role="menu"]') === element &&
      item.getAttribute('aria-disabled') !== 'true' && !item.disabled,
  );
}

/** Moves focus for ArrowUp/ArrowDown/Home/End and reports whether the key was handled. */
export function navigateActionMenu(event: KeyboardEvent, menu: HTMLElement): boolean {
  const items = enabledItems(menu);
  const currentIndex = items.findIndex((item) => item === event.target);
  let nextIndex = getNextCollectionIndex(event.key, currentIndex, items.length, 'vertical');
  if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
    const query = event.key.toLocaleLowerCase();
    for (let offset = 1; offset <= items.length; offset++) {
      const index = (currentIndex + offset) % items.length;
      if (
        (items[index].getAttribute('aria-label') ?? items[index].textContent)?.trim()
          .toLocaleLowerCase().startsWith(query)
      ) {
        nextIndex = index;
        break;
      }
    }
  }
  if (nextIndex === currentIndex || nextIndex < 0) return false;
  event.preventDefault();
  items[nextIndex]?.focus();
  return true;
}

/** Isolates item activation and closes the owning menu. */
export function activateActionMenuItem(
  event: Pick<Event, 'stopPropagation'>,
  close: () => void,
): void {
  event.stopPropagation();
  close();
}

/** Renders the positioned menu surface and owns collection keyboard navigation. */
export function ActionMenuContent(
  { children, onKeyDown, initialFocus = 'first', ...props }: ActionMenuContentProps,
): VNode {
  const menu = useActionMenuContext('ActionMenu.Content');
  const contentRef = useRef<HTMLDivElement | null>(null);
  const contentProps = props as JSX.HTMLAttributes<HTMLDivElement>;
  useLayoutEffect(() => {
    if (menu.open && contentRef.current) {
      const items = enabledItems(contentRef.current);
      const target = initialFocus === 'last' ? items.at(-1) : items[0];
      // If promotion runs after this child effect, native autofocus enters the same item.
      for (const item of items) item.autofocus = item === target;
      target?.focus();
      return () => {
        for (const item of items) item.autofocus = false;
      };
    }
    return undefined;
  }, [menu.open, initialFocus]);
  return (
    <div
      {...menu.getContentProps({
        ...contentProps,
        'aria-label': contentProps['aria-label'] ?? 'Actions',
        onClick: composeEventHandlers(props.onClick, (event) => event.stopPropagation()),
        onKeyDown: composeEventHandlers(onKeyDown, (event) =>
          navigateActionMenu(event as KeyboardEvent, event.currentTarget as HTMLElement)),
        onToggle: composeEventHandlers(props.onToggle, (event) => {
          if (
            event.currentTarget instanceof HTMLElement &&
            event.currentTarget.matches(':popover-open')
          ) {
            const items = enabledItems(event.currentTarget);
            (initialFocus === 'last' ? items.at(-1) : items[0])?.focus();
          }
        }),
        ref: composeRefs(contentRef),
        role: 'menu',
      })}
    >
      {children as ComponentChildren}
    </div>
  );
}

/** Renders an actionable menu item that closes its menu after activation. */
export function ActionMenuItem(
  {
    children,
    disabled,
    intent = 'default',
    loading = false,
    role = 'menuitem',
    closeOnSelect = true,
    onClick,
    ...props
  }: ActionMenuItemProps,
): VNode {
  const menu = useActionMenuContext('ActionMenu.Item');
  const unavailable = Boolean(disabled || loading);
  return (
    <button
      {...props}
      aria-busy={loading ? 'true' : undefined}
      aria-disabled={unavailable ? 'true' : undefined}
      class={props.class}
      data-intent={intent}
      data-loading={loading ? '' : undefined}
      disabled={unavailable}
      onClick={composeEventHandlers(onClick, (event) =>
        activateActionMenuItem(event, () => {
          if (closeOnSelect) menu.setOpen(false, 'close-button');
        }))}
      data-part='item'
      data-scope={ACTION_MENU_SCOPE}
      role={role}
      tabIndex={props.tabIndex ?? -1}
      type={props.type ?? 'button'}
    >
      {children as ComponentChildren}
    </button>
  );
}

/** Renders a semantic separator between action groups. */
export function ActionMenuSeparator(props: ActionMenuSeparatorProps): VNode {
  return <hr data-part='separator' data-scope={ACTION_MENU_SCOPE} {...props} role='separator' />;
}

/** Public type of the compound ActionMenu namespace. */
export interface ActionMenuNamespace {
  /** Positioned menu surface with collection keyboard navigation. */
  readonly Content: (props: ActionMenuContentProps) => FreshUiChild;
  /** Action that closes the menu after successful activation. */
  readonly Item: (props: ActionMenuItemProps) => FreshUiChild;
  /** Controlled or uncontrolled state provider. */
  readonly Root: (props: ActionMenuRootProps) => FreshUiChild;
  /** Semantic separator between action groups. */
  readonly Separator: (props: ActionMenuSeparatorProps) => FreshUiChild;
  /** Native button that opens the menu. */
  readonly Trigger: (props: ActionMenuTriggerProps) => FreshUiChild;
}

/** Compound action-menu namespace built on the package popover runtime. */
export const ActionMenu: ActionMenuNamespace = {
  Content: ActionMenuContent,
  Item: ActionMenuItem,
  Root: ActionMenuRoot,
  Separator: ActionMenuSeparator,
  Trigger: ActionMenuTrigger,
};
