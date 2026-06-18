/**
 * @module
 *
 * Runtime interactive seams for `@netscript/fresh-ui`.
 *
 * These exports intentionally stay separate from the copy-based
 * registry contract. They are package-owned interactive namespaces
 * for stateful accessibility primitives.
 */

export { Accordion } from './src/runtime/accordion/Accordion.tsx';
export type { AccordionNamespace } from './src/runtime/accordion/Accordion.tsx';
export { Dialog } from './src/runtime/dialog/Dialog.tsx';
export type { DialogNamespace } from './src/runtime/dialog/Dialog.tsx';
export { Drawer } from './src/runtime/drawer/Drawer.tsx';
export type { DrawerNamespace } from './src/runtime/drawer/Drawer.tsx';
export { Popover } from './src/runtime/popover/Popover.tsx';
export type { PopoverNamespace } from './src/runtime/popover/Popover.tsx';
export { Sheet } from './src/runtime/sheet/Sheet.tsx';
export type { SheetNamespace } from './src/runtime/sheet/Sheet.tsx';
export { Tabs } from './src/runtime/tabs/Tabs.tsx';
export type { TabsNamespace } from './src/runtime/tabs/Tabs.tsx';
export { Tooltip } from './src/runtime/tooltip/Tooltip.tsx';
export type { TooltipNamespace } from './src/runtime/tooltip/Tooltip.tsx';
