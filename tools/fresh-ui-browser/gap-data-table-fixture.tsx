import { DataTable } from '../../packages/fresh-ui/registry/components/ui/data-table.tsx';
import { Input } from '../../packages/fresh-ui/registry/components/ui/input.tsx';
import { Button } from '../../packages/fresh-ui/registry/components/ui/button.tsx';
import { Badge } from '../../packages/fresh-ui/registry/components/ui/badge.tsx';
import { ToggleGroup } from '../../packages/fresh-ui/registry/components/ui/toggle-group.tsx';
import { Skeleton } from '../../packages/fresh-ui/registry/components/ui/skeleton.tsx';
import { EmptyState } from '../../packages/fresh-ui/registry/components/ui/empty-state.tsx';
import { Pagination } from '../../packages/fresh-ui/registry/components/ui/pagination.tsx';
import { ActionMenu } from '../../packages/fresh-ui/interactive.ts';
import type { DataGridColumn } from '../../packages/fresh-ui/mod.ts';
import { useState } from 'preact/hooks';
import { DataGrid } from '../../packages/fresh-ui/mod.ts';

/** Existing public DataGrid inputs reproduce native child-key ownership before the audit fix. */
export function DataTableExamples() {
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [opened, setOpened] = useState(0);
  const [actions, setActions] = useState(0);
  const [cellActions, setCellActions] = useState(0);
  const [memo, setMemo] = useState('Editable');
  const [zeroOpened, setZeroOpened] = useState(0);
  const [observedClicks, setObservedClicks] = useState(0);
  return (
    <main id='data-table-examples'>
      <h1>Data table examples</h1>
      <section id='table-keyboard' aria-label='Keyboard ownership checks'>
        <DataGrid
          label='Keyboard ownership'
          onClick={() => setObservedClicks((n) => n + 1)}
          columns={[
            {
              key: 'name',
              header: 'Name',
              render: (row) =>
                row.name === 'Editable row'
                  ? (
                    <span>
                      <label>
                        Memo<input
                          aria-label='Cell memo'
                          value={memo}
                          onInput={(event) => setMemo(event.currentTarget.value)}
                        />
                      </label>
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        onClick={() => setCellActions((n) => n + 1)}
                      >
                        Cell action
                      </Button>
                      <a href='#custom-cell'>Custom cell link</a>
                    </span>
                  )
                  : row.name,
            },
            {
              key: 'link',
              header: 'Details',
              render: () => <a href='#cell-details'>Cell details</a>,
            },
          ]}
          rows={[{
            id: 'one',
            data: { name: 'First row' },
            label: 'Inspect first session',
            onSelect: () => setOpened((n) => n + 1),
          }, {
            id: 'linked',
            data: { name: 'Linked row' },
            label: 'Open linked session',
            href: '/data-table?destination=linked',
          }, {
            id: 'custom',
            data: { name: 'Editable row' },
            label: 'Inspect custom session',
            onSelect: () => setOpened((n) => n + 1),
          }]}
          selectedIds={selected}
          onSelectionChange={setSelected}
          renderRowActions={() => (
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={() => setActions((n) => n + 1)}
            >
              Row action
            </Button>
          )}
        />
        <output aria-label='Rows opened'>{opened}</output>
        <output aria-label='Row actions'>{actions}</output>
        <output aria-label='Cell actions'>{cellActions}</output>
        <output aria-label='Observed grid clicks'>{observedClicks}</output>
      </section>
      <OrdersTable />
      <SharedTrackExamples />
      <FluidTrackExample />
      <section id='table-zero-columns' aria-label='Zero-column grid'>
        <h2>Action-only data</h2>
        <DataGrid
          label='Action-only rows'
          columns={[]}
          rows={[{
            id: 'empty',
            data: {},
            label: 'Inspect empty-column row',
            onSelect: () => setZeroOpened((n) => n + 1),
          }]}
        />
        <output aria-label='Action-only rows opened'>{zeroOpened}</output>
      </section>
    </main>
  );
}

type Order = { id: string; customer: string; status: 'Paid' | 'Pending'; total: string };

/** Fluid tracks must wrap long caller text instead of inheriting a max-content floor. */
function FluidTrackExample() {
  const description = 'A detailed activity record remains readable inside its fluid column. '
    .repeat(8);
  const email = 'customer.with.a.long.address.and.additional.routing.context.'.repeat(4) +
    '@example.test';
  return (
    <section id='table-fluid-tracks'>
      <h2>Wrapping fluid columns</h2>
      <div class='fluid-track-container'>
        <DataGrid
          label='Wrapping fluid columns'
          columns={[
            {
              key: 'description',
              header: 'Description',
              render: (row) => <span class='fluid-long-text'>{row.description}</span>,
            },
            {
              key: 'email',
              header: 'Email',
              width: '2fr',
              render: (row) => <span class='fluid-long-text'>{row.email}</span>,
            },
          ]}
          rows={[
            { id: 'first', data: { description, email } },
            { id: 'second', data: { description: description + 'A second record.', email } },
          ]}
        />
      </div>
    </section>
  );
}

const orders: readonly Order[] = [
  { id: 'SO-10482', customer: 'Maya Rossi', status: 'Paid', total: '$1,284.00' },
  { id: 'SO-10481', customer: 'Jonas Weber', status: 'Pending', total: '$12,640.00' },
  { id: 'SO-10480', customer: 'Aiko Tanaka', status: 'Paid', total: '$342.50' },
  { id: 'SO-10479', customer: 'Lucas Martin', status: 'Pending', total: '$89.90' },
];

/** The host owns filtering, ordering, paging, loading and menu actions. */
function OrdersTable() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [descending, setDescending] = useState(true);
  const [showStatus, setShowStatus] = useState(true);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [refuse, setRefuse] = useState(false);
  const [opened, setOpened] = useState(0);
  const [actionCount, setActionCount] = useState(0);
  const [exports, setExports] = useState(0);
  const filtered = orders.filter((row) =>
    `${row.id} ${row.customer}`.toLowerCase().includes(query.toLowerCase()) &&
    (status === 'all' || row.status.toLowerCase() === status)
  ).toSorted((a, b) => descending ? b.id.localeCompare(a.id) : a.id.localeCompare(b.id));
  const visible = filtered.slice(page * 2, page * 2 + 2);
  const state = loading
    ? 'loading'
    : filtered.length === 0
    ? 'empty'
    : visible.some((row) => selected.has(row.id))
    ? 'selection'
    : 'default';
  const columns: DataGridColumn<Order>[] = [
    {
      key: 'id',
      headerLabel: 'Order',
      cell: 'strong',
      width: 'minmax(0, 1fr)',
      sort: descending ? 'descending' : 'ascending',
      header: (
        <button
          type='button'
          disabled={loading}
          onClick={() => setDescending(!descending)}
          aria-label='Sort orders'
          class='ns-btn'
          data-variant='ghost'
          data-size='sm'
        >
          Order ↕
        </button>
      ),
    },
    { key: 'customer', header: 'Customer', width: 'minmax(0, 1.5fr)' },
    ...(showStatus
      ? [{
        key: 'status',
        header: 'Status',
        render: (row: Order) => (
          <Badge variant={row.status === 'Paid' ? 'success' : 'muted'}>{row.status}</Badge>
        ),
      }]
      : []),
    { key: 'total', header: 'Total', cell: 'num' },
  ];
  return (
    <section id='orders-table' aria-label='Orders composition'>
      <h2>Orders</h2>
      <DataTable state={state}>
        <DataTable.Header>
          <Input
            type='search'
            aria-label='Filter orders'
            placeholder='Filter by order or customer'
            value={query}
            disabled={loading}
            onInput={(event) => {
              setQuery(event.currentTarget.value);
              setPage(0);
            }}
          />
          <ToggleGroup
            label='Order status'
            value={[status]}
            onValueChange={(value) => {
              setStatus(value[0] ?? 'all');
              setPage(0);
            }}
            items={[{ value: 'all', label: 'All' }, { value: 'paid', label: 'Paid' }, {
              value: 'pending',
              label: 'Pending',
            }]}
          />
          <ActionMenu.Root>
            <ActionMenu.Trigger
              class='ns-btn'
              data-variant='outline'
              data-size='sm'
              disabled={loading}
            >
              Columns
            </ActionMenu.Trigger>
            <ActionMenu.Content class='ns-menu-items__content' aria-label='Visible columns'>
              <ActionMenu.Item
                class='ns-menu-items__item'
                role='menuitemcheckbox'
                aria-checked={String(showStatus)}
                closeOnSelect={false}
                onClick={() => setShowStatus(!showStatus)}
              >
                Status column
              </ActionMenu.Item>
            </ActionMenu.Content>
          </ActionMenu.Root>
          <Button variant='outline' disabled={loading} onClick={() => setExports((n) => n + 1)}>
            Export orders
          </Button>
        </DataTable.Header>
        <DataTable.Body>
          <DataGrid<Order>
            label='Orders'
            columns={columns}
            rows={visible.map((row) => ({
              id: row.id,
              data: row,
              label: `Inspect ${row.id}`,
              onSelect: () => setOpened((n) => n + 1),
            }))}
            state={state}
            selectedIds={selected}
            onSelectionChange={(next) => {
              if (!refuse) setSelected(next);
            }}
            renderBulkActions={({ count, clearSelection }) => (
              <>
                <span>{count} selected</span>
                <Button variant='outline' size='sm' onClick={() => setActionCount((n) => n + 1)}>
                  Archive selected
                </Button>
                <Button variant='ghost' size='sm' onClick={clearSelection}>Clear selection</Button>
              </>
            )}
            renderRowActions={(row) => (
              <ActionMenu.Root>
                <ActionMenu.Trigger
                  class='ns-btn'
                  data-variant='ghost'
                  data-size='sm'
                  aria-label={`Actions for ${row.id}`}
                >
                  •••
                </ActionMenu.Trigger>
                <ActionMenu.Content
                  class='ns-menu-items__content'
                  aria-label={`Order ${row.id} actions`}
                >
                  <ActionMenu.Item
                    class='ns-menu-items__item'
                    onClick={() => setActionCount((n) => n + 1)}
                  >
                    Inspect action
                  </ActionMenu.Item>
                </ActionMenu.Content>
              </ActionMenu.Root>
            )}
            empty={
              <EmptyState heading='No matching orders'>
                <p>Try another customer or clear the filters.</p>
                <Button
                  variant='outline'
                  onClick={() => {
                    setQuery('');
                    setStatus('all');
                    setPage(0);
                  }}
                >
                  Clear filters
                </Button>
              </EmptyState>
            }
            loading={
              <>
                <Skeleton variant='table' rows={3} columns={4} />
                <p role='status'>Loading orders…</p>
              </>
            }
          />
        </DataTable.Body>
        <DataTable.Footer>
          <Pagination variant='pager'>
            <Pagination.Meta>
              {filtered.length === 0
                ? '0 of 0 orders'
                : `${page * 2 + 1}–${
                  Math.min(page * 2 + 2, filtered.length)
                } of ${filtered.length} orders`}
            </Pagination.Meta>
            <Pagination.Actions>
              <Pagination.Link
                type='previous'
                href={`#orders-page-${page}`}
                disabled={page === 0 || loading}
                onClick={(event) => {
                  event.preventDefault();
                  setPage(page - 1);
                }}
              >
                Previous
              </Pagination.Link>
              <Pagination.Link
                type='next'
                href={`#orders-page-${page + 2}`}
                disabled={(page + 1) * 2 >= filtered.length || loading}
                onClick={(event) => {
                  event.preventDefault();
                  setPage(page + 1);
                }}
              >
                Next
              </Pagination.Link>
            </Pagination.Actions>
          </Pagination>
        </DataTable.Footer>
      </DataTable>
      <label>
        <input
          type='checkbox'
          checked={refuse}
          onChange={(event) => setRefuse(event.currentTarget.checked)}
        />Refuse selection changes
      </label>
      <Button onClick={() => setLoading(!loading)}>
        {loading ? 'Resolve loading' : 'Load orders'}
      </Button>
      <output aria-label='Orders opened'>{opened}</output>
      <output aria-label='Order action count'>{actionCount}</output>
      <output aria-label='Order export count'>{exports}</output>
    </section>
  );
}

/** Intrinsic and fixed tracks exercise the same native table in every real engine. */
function SharedTrackExamples() {
  return (
    <section id='table-track-examples' aria-label='Shared column geometry'>
      <h2>Shared column geometry</h2>
      {[
        { name: 'plain', selection: false, actions: false, fixed: false },
        { name: 'selection', selection: true, actions: false, fixed: false },
        { name: 'actions', selection: false, actions: true, fixed: false },
        { name: 'both', selection: true, actions: true, fixed: false },
        { name: 'overflow', selection: true, actions: true, fixed: true },
      ].map((example) => (
        <div key={example.name} data-track-case={example.name}>
          <DataGrid
            label={'Tracks ' + example.name}
            columns={[
              {
                key: 'name',
                header: <Button type='button' variant='ghost' size='sm'>Sort name</Button>,
                width: example.fixed ? '420px' : 'minmax(0, 2fr)',
              },
              {
                key: 'detail',
                header: 'Detail',
                width: example.fixed ? '380px' : 'minmax(0, 1fr)',
              },
            ]}
            rows={[
              { id: 'short', data: { name: 'Short', detail: 'One' }, selected: true },
              { id: 'long', data: { name: 'Longer', detail: 'Two' } },
            ]}
            selectedIds={example.selection ? new Set(['short']) : undefined}
            onSelectionChange={example.selection ? () => {} : undefined}
            renderRowActions={example.actions
              ? (_data, { row }) => (
                <Button type='button' variant='outline' size='sm'>
                  {row.id === 'short' ? 'Edit' : 'Inspect the complete activity record'}
                </Button>
              )
              : undefined}
          />
        </div>
      ))}
      {(['loading', 'empty'] as const).map((state) => (
        <div key={state} data-track-state={state}>
          <DataGrid
            label={'Tracks ' + state}
            columns={[{ key: 'name', header: 'Name', width: '420px' }, {
              key: 'detail',
              header: 'Detail',
              width: '380px',
            }]}
            rows={[]}
            state={state}
            loading={<span role='status'>Loading shared tracks</span>}
            empty={<span>No shared rows</span>}
          />
        </div>
      ))}
    </section>
  );
}
