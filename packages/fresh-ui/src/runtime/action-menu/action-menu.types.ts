import type { JSX } from 'preact';
import type { FreshUiChildren } from '../_internal/public-props.ts';
import type { UsePopoverOptions } from '../popover/popover.types.ts';

/** Visual intents supported by an ActionMenu item. */
export const ACTION_MENU_ITEM_INTENTS = ['default', 'destructive'] as const;

/** Visual intent applied to an ActionMenu item. */
export type ActionMenuItemIntent = typeof ACTION_MENU_ITEM_INTENTS[number];

/** Props for the ActionMenu root. */
export type ActionMenuRootProps = Omit<UsePopoverOptions, 'modal'> & {
  children: FreshUiChildren;
};

/** Props for the native button that opens an ActionMenu. */
export type ActionMenuTriggerProps = JSX.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: FreshUiChildren;
};

/** Props for the menu content surface. */
export type ActionMenuContentProps = JSX.HTMLAttributes<HTMLDivElement> & {
  children?: FreshUiChildren;
};

/** Props for an actionable menu item. */
export type ActionMenuItemProps = JSX.ButtonHTMLAttributes<HTMLButtonElement> & {
  children?: FreshUiChildren;
  intent?: ActionMenuItemIntent;
  loading?: boolean;
};

/** Props for a semantic separator between groups of menu items. */
export type ActionMenuSeparatorProps = JSX.HTMLAttributes<HTMLHRElement>;
