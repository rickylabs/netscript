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

export { Accordion } from './src/runtime/accordion/Accordion.tsx';
export type { AccordionNamespace } from './src/runtime/accordion/Accordion.tsx';
export type {
  AccordionItemContentProps,
  AccordionItemIndicatorProps,
  AccordionItemProps,
  AccordionItemTriggerProps,
  AccordionRootProps,
} from './src/runtime/accordion/accordion.types.ts';
export { Dialog } from './src/runtime/dialog/Dialog.tsx';
export type { DialogNamespace } from './src/runtime/dialog/Dialog.tsx';
export type {
  DialogCloseProps,
  DialogContentProps,
  DialogDescriptionProps,
  DialogRootProps,
  DialogTitleProps,
  DialogTriggerProps,
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
  PopoverAnchorProps,
  PopoverArrowProps,
  PopoverArrowTipProps,
  PopoverCloseProps,
  PopoverContentProps,
  PopoverDescriptionProps,
  PopoverPositionerProps,
  PopoverRootProps,
  PopoverTitleProps,
  PopoverTriggerProps,
} from './src/runtime/popover/popover.types.ts';
export { Sheet } from './src/runtime/sheet/Sheet.tsx';
export type { SheetNamespace } from './src/runtime/sheet/Sheet.tsx';
export type {
  SheetCloseProps,
  SheetContentProps,
  SheetDescriptionProps,
  SheetRootProps,
  SheetTitleProps,
  SheetTriggerProps,
} from './src/runtime/sheet/sheet.types.ts';
export { Tabs } from './src/runtime/tabs/Tabs.tsx';
export type { TabsNamespace } from './src/runtime/tabs/Tabs.tsx';
export type {
  TabsContentProps,
  TabsListProps,
  TabsRootProps,
  TabsTriggerProps,
} from './src/runtime/tabs/tabs.types.ts';
export { Tooltip } from './src/runtime/tooltip/Tooltip.tsx';
export type { TooltipNamespace } from './src/runtime/tooltip/Tooltip.tsx';
export type {
  TooltipArrowProps,
  TooltipArrowTipProps,
  TooltipContentProps,
  TooltipPositionerProps,
  TooltipRootProps,
  TooltipTriggerProps,
} from './src/runtime/tooltip/tooltip.types.ts';
