import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { h } from 'preact';
import { render } from 'npm:preact-render-to-string@^6.7.0';
import { DataGrid } from '../mod.ts';
import type { DataGridColumn, DataGridProps, DataGridState } from '../mod.ts';

type Session = { name: string; tokens: number; status: 'active' | 'idle' };
interface NodeLike {
  type: unknown;
  props: Record<string, unknown>;
  ref?: unknown;
}
function node(value: unknown): NodeLike {
  assert(value && typeof value === 'object' && 'props' in value);
  return value as NodeLike;
}
function descendants(value: unknown): NodeLike[] {
  if (Array.isArray(value)) return value.flatMap(descendants);
  if (!value || typeof value !== 'object' || !('props' in value)) return [];
  const current = node(value);
  return [current, ...descendants(current.props.children)];
}
function part(value: unknown, name: string): NodeLike[] {
  return descendants(value).filter((n) =>
    n.props['data-scope'] === 'data-table' && n.props['data-part'] === name
  );
}
const columns: readonly DataGridColumn<Session>[] = [
  { key: 'name', header: 'Session', width: '2fr', cell: 'strong' },
  { key: 'tokens', header: 'Tokens', width: '8rem', cell: 'num' },
  { key: 'status', header: 'Status', render: (row) => h('em', null, row.status) },
];
const data: Session = { name: 'One', tokens: 10, status: 'active' };
function props(): DataGridProps<Session> {
  return {
    columns,
    label: 'Sessions',
    rows: [
      { id: 'plain', data },
      { id: 'button', data, selected: true, label: 'Inspect session', onSelect: () => {} },
      { id: 'link', data, href: '/sessions/one', label: 'Read session' },
    ],
  };
}
interface InputSnapshot {
  checked: boolean;
  indeterminate: boolean;
}
function change(input: NodeLike): InputSnapshot {
  const target = { checked: !input.props.checked, indeterminate: false };
  (input.props.onChange as (event: { currentTarget: InputSnapshot }) => void)({
    currentTarget: target,
  });
  return target;
}

Deno.test('DataGrid uses native table rows and independent native actions with no grid keyboard claim', () => {
  const grid = DataGrid(props());
  assertEquals(part(grid, 'table').map((n) => [n.type, n.props.role, n.props['aria-label']]), [[
    'table',
    'table',
    'Sessions',
  ]]);
  const rows = part(grid, 'row');
  assertEquals(rows.map((n) => n.type), ['tr', 'tr', 'tr', 'tr']);
  assertEquals(
    rows.every((n) =>
      n.props.tabIndex === undefined && n.props.onKeyDown === undefined &&
      n.props['aria-selected'] === undefined
    ),
    true,
  );
  const button = part(grid, 'row-action')[0];
  const link = part(grid, 'row-link')[0];
  assertEquals([button.type, button.props.type, button.props['aria-label']], [
    'button',
    'button',
    'Inspect session',
  ]);
  assertEquals([link.type, link.props.href, link.props['f-client-nav'], link.props['aria-label']], [
    'a',
    '/sessions/one',
    true,
    'Read session',
  ]);
  assertEquals(rows[2].props['data-state'], 'selected');
  assertEquals(node(grid).props['data-state'], 'selection');
});

Deno.test('DataGrid retains cell rendering, widths and treatments for linked and ordinary rows', () => {
  const grid = DataGrid(props());
  assertEquals(part(grid, 'row')[1].props.style, {
    gridTemplateColumns: '2fr 8rem minmax(0, 1fr)',
  });
  assertEquals(part(grid, 'cell-strong').length, 3);
  assertEquals(part(grid, 'cell-num').length, 3);
  assertEquals(part(grid, 'cell').filter((n) => n.props['data-variant'] === 'num').length, 3);
  assertEquals(descendants(grid).filter((n) => n.type === 'em').map((n) => n.props.children), [
    'active',
    'active',
    'active',
  ]);
});

Deno.test('DataGrid controlled row and select-all proposals retain physical refusal and mixed state', () => {
  const changes: ReadonlySet<string>[] = [];
  const selected = new Set(['one', 'stale']);
  const grid = DataGrid<Session>({
    columns,
    rows: [{ id: 'one', data }, { id: 'two', data }],
    selectedIds: selected,
    onSelectionChange: (ids) => changes.push(ids),
  });
  const inputs = descendants(grid).filter((n) => n.type === 'input');
  assertEquals(inputs[0].props['aria-checked'], 'mixed');
  const mounted = { indeterminate: false };
  (inputs[0].ref as (element: { indeterminate: boolean }) => void)(mounted);
  assertEquals(mounted.indeterminate, true);
  assertEquals(change(inputs[0]), { checked: false, indeterminate: true });
  assertEquals([...changes[0]], ['one', 'two']);
  assertEquals(change(inputs[2]), { checked: false, indeterminate: false });
  assertEquals([...changes[1]], ['one', 'stale', 'two']);
  assertEquals([...selected], ['one', 'stale']);
  assertEquals(change(inputs[1]), { checked: true, indeterminate: false });
  assertEquals([...changes[2]], ['stale']);
});

Deno.test('DataGrid bulk and row action contexts count visible IDs and preserve clear callbacks', () => {
  const clears: ReadonlySet<string>[] = [];
  const seen: unknown[] = [];
  const grid = DataGrid<Session>({
    columns,
    rows: [{ id: 'one', data }],
    selectedIds: new Set(['one', 'stale']),
    onSelectionChange: (ids) => clears.push(ids),
    renderBulkActions: (context) => {
      assertEquals(context.count, 1);
      assertEquals([...context.selectedIds], ['one', 'stale']);
      context.clearSelection();
      return h('button', null, 'Archive');
    },
    renderRowActions: (value, context) => {
      seen.push([value, context.row.id, context.selected]);
      return h('button', null, 'Actions');
    },
  });
  assertEquals([...clears[0]], []);
  assertEquals(seen, [[data, 'one', true]]);
  assertEquals(part(grid, 'bulk-actions')[0].props.role, 'group');
  assertEquals(part(grid, 'bulk-actions')[0].props['aria-label'], '1 selected');
  const table = part(grid, 'table')[0];
  assertEquals(part(table, 'bulk-actions'), []);
  const stale = DataGrid<Session>({
    columns,
    rows: [{ id: 'one', data }],
    selectedIds: new Set(['stale']),
    renderBulkActions: () => {
      throw new Error('Stale selection must not show bulk actions.');
    },
  });
  assertEquals(part(stale, 'bulk-actions').length, 0);
  assertEquals(node(stale).props['data-state'], 'default');
});

Deno.test('DataGrid caller-owned empty/loading cells keep controls and callbacks out of hidden data', () => {
  for (const state of ['empty', 'loading'] satisfies DataGridState[]) {
    const grid = DataGrid<Session>({
      columns,
      rows: [{ id: 'one', data }],
      selectedIds: new Set(['one']),
      state,
      empty: 'No sessions',
      loading: 'Loading sessions',
      renderBulkActions: () => {
        throw new Error('No bulk actions in a status body.');
      },
      renderRowActions: () => {
        throw new Error('No row action callbacks in a status body.');
      },
    });
    assertEquals(part(grid, state)[0].props.colSpan, 5);
    assertEquals(
      part(grid, state)[0].props.children,
      state === 'empty' ? 'No sessions' : 'Loading sessions',
    );
    assertEquals(
      part(grid, 'table')[0].props['aria-busy'],
      state === 'loading' ? 'true' : undefined,
    );
    assertEquals(descendants(grid).filter((n) => n.type === 'input')[0].props.disabled, true);
  }
  const empty = DataGrid<Session>({ columns, rows: [] });
  assertEquals(node(empty).props['data-state'], 'empty');
  assertEquals(part(empty, 'empty')[0].props.children, undefined);
});

Deno.test('DataGrid Renderable headers carry native sort and separate plain mobile labels', () => {
  const grid = DataGrid<Session>({
    columns: [{
      key: 'name',
      header: h('button', null, 'Sort session'),
      headerLabel: 'Session name',
      sort: 'ascending',
    }],
    rows: [{ id: 'one', data }],
  });
  const head = part(grid, 'header-cell')[0];
  assertEquals([head.type, head.props.role, head.props.scope, head.props['aria-sort']], [
    'th',
    'columnheader',
    'col',
    'ascending',
  ]);
  assertEquals(part(grid, 'cell-label')[0].props.children, 'Session name');
  assertEquals(part(grid, 'cell-label')[0].props['aria-hidden'], 'true');
  assertEquals(descendants(grid).filter((n) => n.type === 'button').length, 1);
});

Deno.test('DataGrid zero-column actions remain native and root attributes/styles survive SSR', () => {
  let opened = 0;
  const grid = DataGrid<Session>({
    columns: [],
    rows: [{ id: 'zero', data, onSelect: () => opened++ }],
    class: 'host-grid',
    style: 'max-width:320px',
    id: 'sessions',
  });
  assertEquals(part(grid, 'cell').length, 1);
  const action = part(grid, 'row-action')[0];
  (action.props.onClick as () => void)();
  assertEquals(opened, 1);
  assertEquals(action.props['aria-label'], 'Open row zero');
  const html = render(
    <DataGrid {...props()} class='host-grid' style='max-width:320px' id='sessions' />,
  );
  assertStringIncludes(html, 'ns-data-grid host-grid');
  assertStringIncludes(html, 'max-width:320px');
  assertStringIncludes(html, 'id="sessions"');
  assertEquals(html.includes('role="grid"'), false);
});
