/**
 * @module
 *
 * Runtime interactive seams for `@netscript/fresh-ui`.
 *
 * These exports intentionally stay separate from the copy-based
 * registry contract. They are package-owned interactive namespaces
 * for stateful accessibility primitives.
 */

export {
  Accordion,
  AccordionItem,
  AccordionItemContent,
  AccordionItemIndicator,
  AccordionItemTrigger,
  AccordionRoot,
} from './src/runtime/accordion/Accordion.tsx';
export type { AccordionNamespace } from './src/runtime/accordion/Accordion.tsx';
export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from './src/runtime/dialog/Dialog.tsx';
export type { DialogNamespace } from './src/runtime/dialog/Dialog.tsx';
export {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerRoot,
  DrawerTitle,
  DrawerTrigger,
} from './src/runtime/drawer/Drawer.tsx';
export type { DrawerNamespace } from './src/runtime/drawer/Drawer.tsx';
export {
  Popover,
  PopoverAnchor,
  PopoverArrow,
  PopoverArrowTip,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverPositioner,
  PopoverRoot,
  PopoverTitle,
  PopoverTrigger,
} from './src/runtime/popover/Popover.tsx';
export type { PopoverNamespace } from './src/runtime/popover/Popover.tsx';
export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetRoot,
  SheetTitle,
  SheetTrigger,
} from './src/runtime/sheet/Sheet.tsx';
export type { SheetNamespace } from './src/runtime/sheet/Sheet.tsx';
export {
  Tabs,
  TabsContent,
  TabsList,
  TabsRoot,
  TabsTrigger,
} from './src/runtime/tabs/Tabs.tsx';
export type { TabsNamespace } from './src/runtime/tabs/Tabs.tsx';
export {
  Tooltip,
  TooltipArrow,
  TooltipArrowTip,
  TooltipContent,
  TooltipPositioner,
  TooltipRoot,
  TooltipTrigger,
} from './src/runtime/tooltip/Tooltip.tsx';
export type { TooltipNamespace } from './src/runtime/tooltip/Tooltip.tsx';
