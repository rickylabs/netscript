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
import { cloneElement, isValidElement, toChildArray } from 'preact';
import type { JSX, VNode } from 'preact';
import { DataGrid } from '../mod.ts';
import {
  Accordion,
  Combobox,
  type ComboboxInputProps,
  Dialog,
  Drawer,
  Popover,
  Sheet,
  Tabs,
  Tooltip,
} from '../interactive.ts';
import { Icon, Show, SrOnly, VisuallyHidden } from '../primitives.tsx';

// Every compound member retains its original concrete VNode result.
const vnodeFactories: readonly ((props: never) => VNode)[] = [
  ...Object.values(Accordion),
  ...Object.values(Combobox),
  ...Object.values(Dialog),
  ...Object.values(Drawer),
  ...Object.values(Popover),
  ...Object.values(Sheet),
  ...Object.values(Tabs),
  ...Object.values(Tooltip),
];

// Type-check direct call results against VNode-specific APIs without calling hooks outside render.
function preserveVNode(factory: (props: never) => VNode, props: never): VNode {
  const node = factory(props);
  const started: number | undefined = node.startTime;
  const ended: number | undefined = node.endTime;
  const ref: VNode['ref'] = node.ref;
  const clone: VNode = cloneElement(node, { ref });
  assert(isValidElement(clone));
  assert(Array.isArray(toChildArray(clone.props.children)));
  assert(started === undefined || typeof started === 'number');
  assert(ended === undefined || typeof ended === 'number');
  return clone;
}

// Both assignment directions preserve the upstream input attribute and targeted-event contract.
const inputAttributes: JSX.InputHTMLAttributes<HTMLInputElement> = {
  'aria-label': 'Search records',
  onInput: (event) => {
    event.currentTarget.value.trim();
  },
  onKeyDown: (event) => {
    if (event.key === 'Escape') event.currentTarget.blur();
  },
  ref: (element) => {
    element?.setSelectionRange(0, 0);
  },
};
const publicInputAttributes: ComboboxInputProps = inputAttributes;
const upstreamInputAttributes: JSX.InputHTMLAttributes<HTMLInputElement> = publicInputAttributes;

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

const combobox: VNode = (
  <Combobox.Root defaultInputValue=''>
    <Combobox.Input {...upstreamInputAttributes} placeholder='Search…' />
    <Combobox.Content>
      <Combobox.Item value='one'>One</Combobox.Item>
      <Combobox.Item value='two'>Two</Combobox.Item>
      <Combobox.Empty>No matches</Combobox.Empty>
    </Combobox.Content>
  </Combobox.Root>
);

const primitives: VNode = (
  <Show when>
    <Icon name='check' title='Complete' />
    <VisuallyHidden>hidden</VisuallyHidden>
    <SrOnly>screen-reader only</SrOnly>
  </Show>
);

type SessionRow = {
  name: string;
  tokens: number;
  status: 'active' | 'idle';
};

const dataGrid: VNode = (
  <DataGrid<SessionRow>
    label='Sessions'
    columns={[
      { key: 'name', header: 'Session', cell: 'strong' },
      { key: 'tokens', header: 'Tokens', width: '8rem', cell: 'num' },
      { key: 'status', header: 'Status', render: (row) => <span>{row.status}</span> },
    ]}
    rows={[
      {
        id: 'session-1',
        data: { name: 'VS3', tokens: 1280, status: 'active' },
        href: '/sessions/session-1',
      },
    ]}
  />
);

Deno.test('runtime namespaces construct consumer-shaped JSX trees', () => {
  for (const factory of vnodeFactories) assert(typeof factory === 'function');
  assert(typeof preserveVNode === 'function');
  for (
    const tree of [
      accordion,
      combobox,
      dataGrid,
      dialog,
      drawer,
      popover,
      sheet,
      tabs,
      tooltip,
      primitives,
    ]
  ) {
    assert(tree && typeof tree === 'object' && 'type' in tree);
  }
});
