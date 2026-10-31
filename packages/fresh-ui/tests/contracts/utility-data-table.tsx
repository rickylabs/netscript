import { DataGrid } from '../../mod.ts';
import { DataTable } from '../../registry/components/ui/data-table.tsx';
import type { ContractKeyboardFixture, ContractRenderFixture } from './style-provider.ts';

export const dataTableFixtures: readonly ContractRenderFixture[] = [
  ...(['default', 'selection', 'empty', 'loading'] as const).map((state) => ({
    component: 'data-table',
    scenario: `native/${state}`,
    props: [
      'columns',
      'rows',
      'label',
      'state',
      'selectedIds',
      'onSelectionChange',
      'renderBulkActions',
      'renderRowActions',
      'empty',
      'loading',
    ],
    parts: [
      'table',
      'head',
      'header-cell',
      'body',
      'row',
      ...(state === 'empty' || state === 'loading'
        ? [state]
        : ['cell', 'cell-label', 'cell-strong', 'cell-num', 'selection', 'row-action', 'actions']),
      ...(state === 'selection' ? ['bulk-actions'] : []),
    ],
    attributes: ['data-state', 'data-type'],
    render: () => (
      <DataGrid
        label='Orders'
        columns={[{
          key: 'name',
          header: <button type='button'>Sort name</button>,
          headerLabel: 'Name',
          sort: 'ascending',
          cell: 'strong',
        }, { key: 'total', header: 'Total', cell: 'num' }]}
        rows={[{
          id: 'one',
          data: { name: 'First order', total: '$42' },
          label: 'Inspect first order',
          onSelect: () => {},
        }]}
        state={state}
        selectedIds={new Set(state === 'selection' ? ['one'] : [])}
        onSelectionChange={() => {}}
        renderBulkActions={({ count }) => <button type='button'>Archive {count}</button>}
        renderRowActions={() => <button type='button'>Actions</button>}
        empty={<button type='button'>Clear filters</button>}
        loading='Loading orders'
      />
    ),
  })),
  {
    component: 'data-table',
    scenario: 'copied-frame-with-package-content',
    props: ['children', 'state', 'interactive', 'columns', 'rows'],
    parts: ['header', 'body', 'footer', 'table', 'row-link'],
    render: () => (
      <DataTable interactive state='default'>
        <DataTable.Header>
          <input aria-label='Filter orders' />
        </DataTable.Header>
        <DataTable.Body>
          <DataGrid
            label='Orders'
            columns={[{ key: 'name', header: 'Name' }]}
            rows={[{
              id: 'one',
              data: { name: 'First order' },
              href: '/orders/one',
              label: 'Read first order',
            }]}
          />
        </DataTable.Body>
        <DataTable.Footer>
          <a href='#next-orders'>Next orders</a>
        </DataTable.Footer>
      </DataTable>
    ),
  },
  {
    component: 'data-table',
    scenario: 'compound-row-style',
    props: ['children', 'Row.cols'],
    parts: ['row'],
    render: () => (
      <DataTable>
        <DataTable.Row cols='1fr 1fr' style='opacity:0.5'>Custom content</DataTable.Row>
      </DataTable>
    ),
  },
];

export const dataTableKeyboard: readonly ContractKeyboardFixture[] = [{
  component: 'data-table',
  scenario: 'data-table/child-checkbox-space-isolation',
  keys: ['Space'],
  expectation: 'Native selection changes its checkbox and never calls row activation.',
}, {
  component: 'data-table',
  scenario: 'data-table/child-action-and-link-keys-remain-native',
  keys: ['Enter'],
  expectation: 'Child buttons and links activate independently of row activation.',
}, {
  component: 'data-table',
  scenario: 'data-table/native-table-tab-order',
  keys: ['Tab/Shift+Tab'],
  expectation:
    'Native independent controls receive focus in DOM order; static table rows/cells do not.',
}];
