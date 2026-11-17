/**
 * @module
 *
 * Runtime interactive seams for `@netscript/fresh-ui`.
 *
 * These exports intentionally stay separate from the copy-based
 * registry contract. They are package-owned interactive namespaces
 * for stateful accessibility primitives.
 */

export type {
  FreshUiAttributeValue,
  FreshUiChild,
  FreshUiChildren,
  FreshUiElementProps,
  FreshUiEventHandler,
  FreshUiStyle,
} from './src/runtime/_internal/public-props.ts';

export type { MachineDataAttributes } from './src/runtime/_internal/dom-types.ts';

export { ActionMenu } from './src/runtime/action-menu/ActionMenu.tsx';
export type { ActionMenuNamespace } from './src/runtime/action-menu/ActionMenu.tsx';
export {
  ACTION_MENU_ITEM_INTENTS,
  ACTION_MENU_ITEM_ROLES,
  type ActionMenuContentProps,
  type ActionMenuItemIntent,
  type ActionMenuItemProps,
  type ActionMenuItemRole,
  type ActionMenuOpenChangeReason,
  type ActionMenuRootProps,
  type ActionMenuSeparatorProps,
  type ActionMenuTriggerProps,
} from './src/runtime/action-menu/action-menu.types.ts';

export { Accordion } from './src/runtime/accordion/Accordion.tsx';
export type { AccordionNamespace } from './src/runtime/accordion/Accordion.tsx';
export type {
  AccordionItemContentElementProps,
  AccordionItemContentProps,
  AccordionItemElementProps,
  AccordionItemIndicatorElementProps,
  AccordionItemIndicatorProps,
  AccordionItemProps,
  AccordionItemTriggerElementProps,
  AccordionItemTriggerProps,
  AccordionRootProps,
  UseAccordionOptions,
} from './src/runtime/accordion/accordion.types.ts';
export { Combobox } from './src/runtime/combobox/Combobox.tsx';
export type { ComboboxNamespace } from './src/runtime/combobox/Combobox.tsx';
export type {
  ComboboxContentElementProps,
  ComboboxContentProps,
  ComboboxEmptyProps,
  ComboboxInputElementProps,
  ComboboxInputProps,
  ComboboxItemElementProps,
  ComboboxItemProps,
  ComboboxRootElementProps,
  ComboboxRootProps,
  UseComboboxOptions,
  UseComboboxReturn,
} from './src/runtime/combobox/combobox.types.ts';
export { Dialog } from './src/runtime/dialog/Dialog.tsx';
export type { DialogNamespace } from './src/runtime/dialog/Dialog.tsx';
export type {
  DialogCloseElementProps,
  DialogCloseProps,
  DialogContentElementProps,
  DialogContentProps,
  DialogDescriptionElementProps,
  DialogDescriptionProps,
  DialogRootProps,
  DialogTitleElementProps,
  DialogTitleProps,
  DialogTriggerElementProps,
  DialogTriggerProps,
  UseDialogOptions,
} from './src/runtime/dialog/dialog.types.ts';
export { Drawer } from './src/runtime/drawer/Drawer.tsx';
export type { DrawerNamespace } from './src/runtime/drawer/Drawer.tsx';
export type {
  DrawerCloseProps,
  DrawerContentProps,
  DrawerDescriptionProps,
  DrawerRootProps,
  DrawerTitleProps,
  DrawerTriggerProps,
} from './src/runtime/drawer/drawer.types.ts';
export { Popover } from './src/runtime/popover/Popover.tsx';
export type { PopoverNamespace } from './src/runtime/popover/Popover.tsx';
export type {
  PopoverAnchorElementProps,
  PopoverAnchorProps,
  PopoverArrowElementProps,
  PopoverArrowProps,
  PopoverArrowTipElementProps,
  PopoverArrowTipProps,
  PopoverCloseElementProps,
  PopoverCloseProps,
  PopoverContentElementProps,
  PopoverContentProps,
  PopoverDescriptionElementProps,
  PopoverDescriptionProps,
  PopoverPositionerElementProps,
  PopoverPositionerProps,
  PopoverRootProps,
  PopoverTitleElementProps,
  PopoverTitleProps,
  PopoverTriggerElementProps,
  PopoverTriggerProps,
  UsePopoverOptions,
} from './src/runtime/popover/popover.types.ts';
export { Sheet } from './src/runtime/sheet/Sheet.tsx';
export type { SheetNamespace } from './src/runtime/sheet/Sheet.tsx';
export type {
  SheetCloseElementProps,
  SheetCloseProps,
  SheetContentElementProps,
  SheetContentProps,
  SheetDescriptionElementProps,
  SheetDescriptionProps,
  SheetOpenChangeDetails,
  SheetOpenChangeReason,
  SheetRootProps,
  SheetSide,
  SheetTitleElementProps,
  SheetTitleProps,
  SheetTriggerElementProps,
  SheetTriggerProps,
  UseSheetOptions,
} from './src/runtime/sheet/sheet.types.ts';
export { Tabs } from './src/runtime/tabs/Tabs.tsx';
export type { TabsNamespace } from './src/runtime/tabs/Tabs.tsx';
export type {
  TabsContentElementProps,
  TabsContentProps,
  TabsListElementProps,
  TabsListProps,
  TabsRootProps,
  TabsTriggerElementProps,
  TabsTriggerProps,
  UseTabsOptions,
} from './src/runtime/tabs/tabs.types.ts';
export { Tooltip } from './src/runtime/tooltip/Tooltip.tsx';
export type { TooltipNamespace } from './src/runtime/tooltip/Tooltip.tsx';
export type {
  TooltipArrowElementProps,
  TooltipArrowProps,
  TooltipArrowTipElementProps,
  TooltipArrowTipProps,
  TooltipContentElementProps,
  TooltipContentProps,
  TooltipPositionerElementProps,
  TooltipPositionerProps,
  TooltipRootProps,
  TooltipTriggerElementProps,
  TooltipTriggerProps,
  UseTooltipOptions,
} from './src/runtime/tooltip/tooltip.types.ts';
