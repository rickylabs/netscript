import type { ContractRenderFixture } from './style-provider.ts';
import { Breadcrumb } from '../../registry/components/ui/breadcrumb.tsx';
import { Pagination } from '../../registry/components/ui/pagination.tsx';
import { SidebarShell } from '../../registry/components/ui/sidebar-shell.tsx';
import { PageHeader } from '../../registry/components/ui/page-header.tsx';
import { StatsGrid } from '../../registry/components/ui/stats-grid.tsx';
import { ResponsiveTable } from '../../registry/components/ui/responsive-table.tsx';
import { DataTable } from '../../registry/components/ui/data-table.tsx';
import { Message } from '../../registry/components/ui/message.tsx';
import { CommandPalette } from '../../registry/components/ui/command-palette.tsx';
import { DesktopDialog } from '../../registry/components/ui/desktop-dialog.tsx';
import { DesktopNotification } from '../../registry/components/ui/desktop-notification.tsx';
import { DesktopUpdatePrompt } from '../../registry/components/ui/desktop-update-prompt.tsx';
import DesktopOnly from '../../registry/islands/DesktopOnly.tsx';
import { DataGrid } from '../../src/presentation/data-grid.tsx';
import { Accordion } from '../../src/runtime/accordion/Accordion.tsx';
import { Tabs } from '../../src/runtime/tabs/Tabs.tsx';
import { Combobox } from '../../src/runtime/combobox/Combobox.tsx';
import { Dialog } from '../../src/runtime/dialog/Dialog.tsx';
import { Sheet } from '../../src/runtime/sheet/Sheet.tsx';
import { Drawer } from '../../src/runtime/drawer/Drawer.tsx';
import { Popover } from '../../src/runtime/popover/Popover.tsx';
import { Tooltip } from '../../src/runtime/tooltip/Tooltip.tsx';
import { ActionMenu } from '../../src/runtime/action-menu/ActionMenu.tsx';

const shell = () => (
  <SidebarShell
    pathname='/example'
    navigation={[{ label: 'Group', items: [{ href: '/example', label: 'Example', icon: '★' }] }]}
    brand='Brand'
    footer='Footer'
    topbarStart='Start'
    topbarEnd='End'
  >
    Content
  </SidebarShell>
);
const grid = () => (
  <DataGrid
    columns={[{ key: 'name', header: 'Name', render: (value: { name: string }) => value.name }]}
    rows={[{ id: 'one', data: { name: 'Ada' } }]}
    selectedIds={new Set(['one'])}
    onSelectionChange={() => {}}
    renderBulkActions={() => 'Archive'}
  />
);
const message = () => (
  <Message
    message={{ role: 'user', author: { name: 'Ada' }, body: 'Hello' }}
  />
);

export const compositeFixtures: readonly ContractRenderFixture[] = [
  {
    component: 'breadcrumb',
    props: [],
    scenario: 'trail',
    render: () => <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Current' }]} />,
    parts: ['item', 'link', 'current', 'separator'],
  },
  {
    component: 'pagination',
    props: [],
    scenario: 'actions',
    render: () => (
      <Pagination>
        <Pagination.Meta>Page 1</Pagination.Meta>
        <Pagination.Actions>Next</Pagination.Actions>
      </Pagination>
    ),
    parts: ['meta', 'actions'],
  },
  {
    component: 'app-shell',
    props: [],
    scenario: 'dashboard',
    render: shell,
    parts: ['main', 'content'],
  },
  {
    component: 'sidebar',
    props: [],
    scenario: 'navigation',
    render: shell,
    parts: [
      'sidebar-header',
      'sidebar-body',
      'nav-group',
      'nav-item',
      'nav-icon',
      'nav-label',
      'sidebar-footer',
    ],
  },
  {
    component: 'top-bar',
    props: [],
    scenario: 'slots',
    render: shell,
    parts: ['topbar-start', 'topbar-end'],
  },
  {
    component: 'page-header',
    props: [],
    scenario: 'sections',
    render: () => (
      <PageHeader>
        <PageHeader.Layout>
          <PageHeader.Main>
            <PageHeader.Intro>Title</PageHeader.Intro>
          </PageHeader.Main>
          <PageHeader.Aside>
            <PageHeader.Badges>Status</PageHeader.Badges>
          </PageHeader.Aside>
        </PageHeader.Layout>
        <PageHeader.Actions>Action</PageHeader.Actions>
        <PageHeader.Status>Status</PageHeader.Status>
      </PageHeader>
    ),
    parts: ['layout', 'main', 'aside', 'badges', 'intro', 'actions', 'status-bar'],
  },
  {
    component: 'stats-grid',
    props: [],
    scenario: 'metric',
    render: () => (
      <StatsGrid>
        <StatsGrid.Card label='Count' value='42' detail='Records' />
      </StatsGrid>
    ),
    parts: ['card', 'label', 'value', 'detail'],
  },
  {
    component: 'table',
    props: [],
    scenario: 'rows',
    render: () => (
      <ResponsiveTable
        columns={[{ key: 'name', label: 'Name', cell: (name: string) => name }]}
        rows={['Ada']}
        getRowKey={(name) => name}
        caption='People'
        summary='1 record'
      />
    ),
    parts: ['caption', 'head', 'body', 'row', 'cell', 'summary'],
  },
  {
    component: 'data-table',
    props: [],
    scenario: 'sections',
    render: () => (
      <DataTable>
        <DataTable.Header>Heading</DataTable.Header>
        <DataTable.Body>
          <DataTable.Row>Row</DataTable.Row>
        </DataTable.Body>
        <DataTable.Footer>Footer</DataTable.Footer>
      </DataTable>
    ),
    parts: ['header', 'body', 'row', 'footer'],
  },
  { component: 'data-table', props: [], scenario: 'selection grid', render: grid },
  {
    component: 'action-bar',
    props: [],
    scenario: 'grid selection',
    render: grid,
    scope: 'action-bar',
  },
  {
    component: 'message',
    props: [],
    scenario: 'user',
    render: message,
    parts: ['main', 'body', 'text', 'actions'],
  },
  { component: 'bubble', props: [], scenario: 'user message', render: message },
  {
    component: 'accordion',
    props: [],
    scenario: 'expanded',
    render: () => (
      <Accordion.Root defaultValue={['one']}>
        <Accordion.Item value='one'>
          <Accordion.ItemTrigger>Title</Accordion.ItemTrigger>
          <Accordion.ItemContent>Content</Accordion.ItemContent>
        </Accordion.Item>
      </Accordion.Root>
    ),
    parts: ['item', 'item-trigger', 'item-content'],
    attributes: ['data-state'],
  },
  {
    component: 'tabs',
    props: [],
    scenario: 'selected',
    render: () => (
      <Tabs.Root defaultValue='one'>
        <Tabs.List>
          <Tabs.Trigger value='one'>One</Tabs.Trigger>
          <Tabs.Trigger value='two'>Two</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value='one'>Content</Tabs.Content>
      </Tabs.Root>
    ),
    parts: ['list', 'trigger', 'content'],
    attributes: ['data-orientation', 'data-state'],
  },
  {
    component: 'combobox',
    props: [],
    scenario: 'open',
    render: () => (
      <Combobox.Root defaultOpen>
        <Combobox.Input />
        <Combobox.Content>
          <Combobox.Item value='one'>One</Combobox.Item>
          <Combobox.Empty>Empty</Combobox.Empty>
        </Combobox.Content>
      </Combobox.Root>
    ),
    parts: ['input', 'content', 'item', 'empty'],
    attributes: ['data-state'],
  },
  {
    component: 'dialog',
    props: [],
    scenario: 'open',
    render: () => (
      <Dialog.Root defaultOpen>
        <Dialog.Trigger>Open</Dialog.Trigger>
        <Dialog.Content>
          <Dialog.Title>Title</Dialog.Title>
          <Dialog.Description>Description</Dialog.Description>
          <Dialog.Close>Close</Dialog.Close>
        </Dialog.Content>
      </Dialog.Root>
    ),
    parts: ['trigger', 'content', 'title', 'description', 'close'],
    attributes: ['data-state'],
  },
  {
    component: 'sheet',
    props: [],
    scenario: 'open',
    render: () => (
      <Sheet.Root defaultOpen>
        <Sheet.Trigger>Open</Sheet.Trigger>
        <Sheet.Content>
          <Sheet.Title>Title</Sheet.Title>
          <Sheet.Description>Description</Sheet.Description>
          <Sheet.Close>Close</Sheet.Close>
        </Sheet.Content>
      </Sheet.Root>
    ),
    parts: ['trigger', 'content', 'title', 'description', 'close'],
    attributes: ['data-state', 'data-side'],
  },
  {
    component: 'drawer',
    props: [],
    scope: 'dialog',
    scenario: 'open',
    render: () => (
      <Drawer.Root defaultOpen>
        <Drawer.Trigger>Open</Drawer.Trigger>
        <Drawer.Content>
          <Drawer.Title>Title</Drawer.Title>
          <Drawer.Description>Description</Drawer.Description>
          <Drawer.Close>Close</Drawer.Close>
        </Drawer.Content>
      </Drawer.Root>
    ),
    parts: ['trigger', 'content', 'title', 'description', 'close'],
    attributes: ['data-state'],
  },
  {
    component: 'popover',
    props: [],
    scenario: 'open',
    render: () => (
      <Popover.Root defaultOpen>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Positioner>
          <Popover.Content>
            <Popover.Title>Title</Popover.Title>
            <Popover.Description>Description</Popover.Description>
            <Popover.Close>Close</Popover.Close>
            <Popover.Arrow>
              <Popover.ArrowTip />
            </Popover.Arrow>
          </Popover.Content>
        </Popover.Positioner>
      </Popover.Root>
    ),
    parts: [
      'trigger',
      'positioner',
      'content',
      'title',
      'description',
      'close',
      'arrow',
      'arrow-tip',
    ],
    attributes: ['data-state', 'data-placement'],
  },
  {
    component: 'tooltip',
    props: [],
    scenario: 'open',
    render: () => (
      <Tooltip.Root defaultOpen>
        <Tooltip.Trigger>Target</Tooltip.Trigger>
        <Tooltip.Positioner>
          <Tooltip.Content>
            Hint<Tooltip.Arrow>
              <Tooltip.ArrowTip />
            </Tooltip.Arrow>
          </Tooltip.Content>
        </Tooltip.Positioner>
      </Tooltip.Root>
    ),
    parts: ['trigger', 'positioner', 'content', 'arrow', 'arrow-tip'],
    attributes: ['data-state', 'data-placement'],
  },
  {
    component: 'dropdown-menu',
    props: [],
    scenario: 'open',
    scope: 'popover',
    render: () => (
      <ActionMenu.Root defaultOpen>
        <ActionMenu.Trigger>Menu</ActionMenu.Trigger>
        <ActionMenu.Content>
          <ActionMenu.Item>Action</ActionMenu.Item>
          <ActionMenu.Separator />
        </ActionMenu.Content>
      </ActionMenu.Root>
    ),
    parts: ['trigger', 'content', 'item', 'separator'],
    attributes: ['data-state'],
  },
  {
    component: 'command-palette',
    props: [],
    scenario: 'results',
    render: () => (
      <CommandPalette
        open
        groups={[{
          id: 'pages',
          label: 'Pages',
          items: [{ id: 'one', label: 'One', icon: '★', kind: 'Page', hash: '/one' }],
        }]}
      />
    ),
    parts: ['backdrop', 'content', 'input', 'list', 'group', 'item'],
  },
  {
    component: 'desktop-dialog',
    props: [],
    scenario: 'intents',
    render: () => <DesktopDialog message='Continue?' />,
    attributes: ['data-state'],
  },
  {
    component: 'desktop-notification',
    props: [],
    scenario: 'preview',
    render: () => <DesktopNotification notification={{ title: 'Complete', body: 'Ready' }} />,
    parts: ['title', 'body', 'action'],
    attributes: ['data-state'],
  },
  {
    component: 'update-prompt',
    props: [],
    scenario: 'automatic',
    render: () => <DesktopUpdatePrompt event={{ applyMode: 'automatic', version: '1.0.0' }} />,
    attributes: ['data-state'],
  },
  {
    component: 'desktop-only',
    props: [],
    scenario: 'browser fallback',
    render: () => <DesktopOnly fallback='Browser'>Desktop</DesktopOnly>,
    contextOnly: true,
    expectedHtml: 'Browser',
  },
];
