import { createContext } from 'preact';
import type { ComponentChildren, VNode } from 'preact';
import { useContext, useEffect, useRef } from 'preact/hooks';
import { composeEventHandlers } from '../_internal/compose-event-handlers.ts';
import { composeRefs } from '../_internal/compose-refs.ts';
import { requireFreshUiContext } from '../_internal/context-error.ts';
import { getNextCollectionIndex } from '../_internal/collection-navigation.ts';
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

const ActionMenuContext = createContext<ActionMenuContextValue | null>(null);

function useActionMenuContext(part: string): ActionMenuContextValue {
  return requireFreshUiContext(useContext(ActionMenuContext), part, 'ActionMenu.Root');
}

function ActionMenuRoot({ children, onOpenChange, ...options }: ActionMenuRootProps): VNode {
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

function ActionMenuTrigger({ children, onClick, ref, ...props }: ActionMenuTriggerProps): VNode {
  const menu = useActionMenuContext('ActionMenu.Trigger');
  return (
    <button
      {...menu.getTriggerProps({
        ...props,
        onClick: composeEventHandlers(onClick, (event) => event.stopPropagation()),
        ref: composeRefs(ref, menu.triggerRef),
      })}
      aria-haspopup='menu'
    >
      {children as ComponentChildren}
    </button>
  );
}

function enabledItems(element: HTMLElement): HTMLButtonElement[] {
  return [...element.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')].filter(
    (item) => item.getAttribute('aria-disabled') !== 'true',
  );
}

/** Moves focus for ArrowUp/ArrowDown/Home/End and reports whether the key was handled. */
export function navigateActionMenu(event: KeyboardEvent, menu: HTMLElement): boolean {
  const items = enabledItems(menu);
  const currentIndex = items.findIndex((item) => item === event.target);
  const nextIndex = getNextCollectionIndex(event.key, currentIndex, items.length, 'vertical');
  if (nextIndex === currentIndex || nextIndex < 0) return false;
  event.preventDefault();
  items[nextIndex]?.focus();
  return true;
}

function ActionMenuContent({ children, onKeyDown, ref, ...props }: ActionMenuContentProps): VNode {
  const menu = useActionMenuContext('ActionMenu.Content');
  const contentRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (menu.open) enabledItems(contentRef.current as HTMLElement)[0]?.focus();
  }, [menu.open]);
  return (
    <div
      {...menu.getContentProps({
        ...props,
        'aria-label': props['aria-label'] ?? 'Actions',
        onClick: composeEventHandlers(props.onClick, (event) => event.stopPropagation()),
        onKeyDown: composeEventHandlers(onKeyDown, (event) =>
          navigateActionMenu(event as KeyboardEvent, event.currentTarget as HTMLElement)),
        ref: composeRefs(ref, contentRef),
        role: 'menu',
      })}
    >
      {children as ComponentChildren}
    </div>
  );
}

function ActionMenuItem(
  {
    children,
    disabled,
    intent = 'default',
    loading = false,
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
      onClick={composeEventHandlers(onClick, (event) => {
        event.stopPropagation();
        menu.setOpen(false, 'close-button');
      })}
      role='menuitem'
      tabIndex={props.tabIndex ?? -1}
      type={props.type ?? 'button'}
    >
      {children as ComponentChildren}
    </button>
  );
}

function ActionMenuSeparator(props: ActionMenuSeparatorProps): VNode {
  return <hr {...props} role='separator' />;
}

/** Public type of the compound ActionMenu namespace. */
export interface ActionMenuNamespace {
  readonly Content: typeof ActionMenuContent;
  readonly Item: typeof ActionMenuItem;
  readonly Root: typeof ActionMenuRoot;
  readonly Separator: typeof ActionMenuSeparator;
  readonly Trigger: typeof ActionMenuTrigger;
}

/** Compound action-menu namespace built on the package popover runtime. */
export const ActionMenu: ActionMenuNamespace = {
  Content: ActionMenuContent,
  Item: ActionMenuItem,
  Root: ActionMenuRoot,
  Separator: ActionMenuSeparator,
  Trigger: ActionMenuTrigger,
};
