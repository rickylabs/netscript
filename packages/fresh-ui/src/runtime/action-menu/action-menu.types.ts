import type {
  FreshUiChildren,
  FreshUiElementProps,
  FreshUiEventHandler,
} from '../_internal/public-props.ts';

/** Visual intents supported by an ActionMenu item. */
export const ACTION_MENU_ITEM_INTENTS = ['default', 'destructive'] as const;

/** Visual intent applied to an ActionMenu item. */
export type ActionMenuItemIntent = typeof ACTION_MENU_ITEM_INTENTS[number];

/** Reasons emitted when ActionMenu controlled open state changes. */
export type ActionMenuOpenChangeReason =
  | 'trigger'
  | 'close-button'
  | 'escape-key'
  | 'interact-outside'
  | 'programmatic';

/** Props for the ActionMenu root. */
export interface ActionMenuRootProps {
  /** Compound menu parts rendered inside the state provider. */
  children: FreshUiChildren;
  /** Whether Escape dismisses an open menu. */
  closeOnEscape?: boolean;
  /** Whether pointer/focus interaction outside dismisses an open menu. */
  closeOnInteractOutside?: boolean;
  /** Initial open state for an uncontrolled menu. */
  defaultOpen?: boolean;
  /** Stable identifier used for trigger/content relationships. */
  id?: string;
  /** Receives every controlled or uncontrolled open-state transition. */
  onOpenChange?: (
    open: boolean,
    details: { reason: ActionMenuOpenChangeReason },
  ) => void;
  /** Controlled open state. */
  open?: boolean;
  /** Popover-compatible collision-aware placement. */
  placement?: string;
}

/** Props for the native button that opens an ActionMenu. */
export type ActionMenuTriggerProps = FreshUiElementProps & {
  children: FreshUiChildren;
  disabled?: boolean;
  onClick?: FreshUiEventHandler<MouseEvent>;
  type?: 'button' | 'submit' | 'reset';
};

/** Props for the menu content surface. */
export type ActionMenuContentProps = FreshUiElementProps & {
  children?: FreshUiChildren;
  onClick?: FreshUiEventHandler<MouseEvent>;
  onKeyDown?: FreshUiEventHandler<KeyboardEvent>;
};

/** Props for an actionable menu item. */
export type ActionMenuItemProps = FreshUiElementProps & {
  children?: FreshUiChildren;
  disabled?: boolean;
  intent?: ActionMenuItemIntent;
  loading?: boolean;
  onClick?: FreshUiEventHandler<MouseEvent>;
  type?: 'button' | 'submit' | 'reset';
};

/** Props for a semantic separator between groups of menu items. */
export type ActionMenuSeparatorProps = FreshUiElementProps;
