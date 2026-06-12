/**
 * Consumer-shaped JSX render typecheck for the package-owned runtime.
 *
 * Run 1's no-slow-types pass once stamped `: unknown` returns on runtime
 * components; that only breaks at a consumer's JSX call site, which the
 * package's own gates never exercised (drift D-5c2-2). This fixture
 * constructs every interactive namespace and L0 primitive exactly the way
 * a consumer would, so `deno task check` fails if any export stops being a
 * valid JSX component type.
 */

import { assert } from '@std/assert';
import type { VNode } from 'preact';
import { Accordion, Dialog, Drawer, Popover, Sheet, Tabs, Tooltip } from './interactive.ts';
import { Show, SrOnly, VisuallyHidden } from './primitives.tsx';

const accordion: VNode = (
  <Accordion.Root>
    <Accordion.Item value='first'>
      <Accordion.ItemTrigger>
        Trigger
        <Accordion.ItemIndicator>▾</Accordion.ItemIndicator>
      </Accordion.ItemTrigger>
      <Accordion.ItemContent>Content</Accordion.ItemContent>
    </Accordion.Item>
  </Accordion.Root>
);

const dialog: VNode = (
  <Dialog.Root>
    <Dialog.Trigger>Open</Dialog.Trigger>
    <Dialog.Content>
      <Dialog.Title>Title</Dialog.Title>
      <Dialog.Description>Description</Dialog.Description>
      <Dialog.Close>Close</Dialog.Close>
    </Dialog.Content>
  </Dialog.Root>
);

const drawer: VNode = (
  <Drawer.Root>
    <Drawer.Trigger>Open</Drawer.Trigger>
    <Drawer.Content>
      <Drawer.Title>Title</Drawer.Title>
      <Drawer.Description>Description</Drawer.Description>
      <Drawer.Close>Close</Drawer.Close>
    </Drawer.Content>
  </Drawer.Root>
);

const popover: VNode = (
  <Popover.Root>
    <Popover.Trigger>Open</Popover.Trigger>
    <Popover.Positioner>
      <Popover.Content>
        <Popover.Arrow>
          <Popover.ArrowTip />
        </Popover.Arrow>
        <Popover.Title>Title</Popover.Title>
        <Popover.Description>Description</Popover.Description>
        <Popover.Close>Close</Popover.Close>
      </Popover.Content>
    </Popover.Positioner>
  </Popover.Root>
);

const sheet: VNode = (
  <Sheet.Root>
    <Sheet.Trigger>Open</Sheet.Trigger>
    <Sheet.Content>
      <Sheet.Title>Title</Sheet.Title>
      <Sheet.Description>Description</Sheet.Description>
      <Sheet.Close>Close</Sheet.Close>
    </Sheet.Content>
  </Sheet.Root>
);

const tabs: VNode = (
  <Tabs.Root>
    <Tabs.List>
      <Tabs.Trigger value='one'>One</Tabs.Trigger>
      <Tabs.Trigger value='two'>Two</Tabs.Trigger>
    </Tabs.List>
    <Tabs.Content value='one'>First</Tabs.Content>
    <Tabs.Content value='two'>Second</Tabs.Content>
  </Tabs.Root>
);

const tooltip: VNode = (
  <Tooltip.Root>
    <Tooltip.Trigger>Hover</Tooltip.Trigger>
    <Tooltip.Positioner>
      <Tooltip.Content>
        <Tooltip.Arrow>
          <Tooltip.ArrowTip />
        </Tooltip.Arrow>
        Help text
      </Tooltip.Content>
    </Tooltip.Positioner>
  </Tooltip.Root>
);

const primitives: VNode = (
  <Show when>
    <VisuallyHidden>hidden</VisuallyHidden>
    <SrOnly>screen-reader only</SrOnly>
  </Show>
);

Deno.test('runtime namespaces construct consumer-shaped JSX trees', () => {
  for (
    const tree of [accordion, dialog, drawer, popover, sheet, tabs, tooltip, primitives]
  ) {
    assert(tree && typeof tree === 'object' && 'type' in tree);
  }
});
