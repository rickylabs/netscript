import { assert, assertEquals, assertStrictEquals } from '@std/assert';
import { h } from 'preact';
import { DataGrid } from '../mod.ts';

type Session = {
  name: string;
  tokens: number;
  status: 'active' | 'idle';
};

interface VNodeLike {
  type: unknown;
  props: Record<string, unknown>;
}

function asVNode(value: unknown): VNodeLike {
  assert(value && typeof value === 'object' && 'props' in value, 'expected vnode');
  return value as VNodeLike;
}

function childrenOf(value: unknown): unknown[] {
  const children = asVNode(value).props.children;
  return Array.isArray(children) ? children : [children];
}

function rowGroupRows(grid: unknown): VNodeLike[] {
  const rootChildren = childrenOf(grid);
  const body = asVNode(rootChildren[1]);
  return childrenOf(body).map(asVNode);
}

function firstRowCells(grid: unknown): VNodeLike[] {
  return childrenOf(rowGroupRows(grid)[0]).map(asVNode);
}

function renderGrid(): unknown {
  return DataGrid<Session>({
    label: 'Sessions',
    columns: [
      { key: 'name', header: 'Session', width: '2fr', cell: 'strong' },
      { key: 'tokens', header: 'Tokens', width: '8rem', cell: 'num' },
      { key: 'status', header: 'Status', render: (row) => h('em', null, row.status) },
    ],
    rows: [
      { id: 'plain', data: { name: 'Plain', tokens: 10, status: 'idle' } },
      {
        id: 'button',
        data: { name: 'Button', tokens: 20, status: 'active' },
        selected: true,
        onSelect: () => undefined,
      },
      { id: 'link', data: { name: 'Link', tokens: 30, status: 'active' }, href: '/docs/link' },
    ],
  });
}

Deno.test('DataGrid renders a plain row with role-grid structure', () => {
  const grid = renderGrid();
  const root = asVNode(grid);
  const row = rowGroupRows(grid)[0];

  assertStrictEquals(root.type, 'div');
  assertStrictEquals(root.props.role, 'grid');
  assertStrictEquals(root.props['aria-label'], 'Sessions');
  assertStrictEquals(row.type, 'div');
  assertStrictEquals(row.props.role, 'row');
});

Deno.test('DataGrid renders an onSelect row as a selected button row', () => {
  const row = rowGroupRows(renderGrid())[1];

  assertStrictEquals(row.type, 'button');
  assertStrictEquals(row.props.type, 'button');
  assertStrictEquals(row.props.role, 'row');
  assertStrictEquals(row.props['aria-selected'], 'true');
  assertEquals(typeof row.props.onClick, 'function');
});

Deno.test('DataGrid renders an href row as a Fresh client-nav link row', () => {
  const row = rowGroupRows(renderGrid())[2];

  assertStrictEquals(row.type, 'a');
  assertStrictEquals(row.props.href, '/docs/link');
  assertStrictEquals(row.props.role, 'row');
  assertStrictEquals(row.props['f-client-nav'], true);
});

Deno.test('DataGrid renders templated columns and built-in strong and num cells', () => {
  const [nameCell, tokensCell, statusCell] = firstRowCells(renderGrid());
  const nameContent = asVNode(nameCell.props.children);
  const tokensContent = asVNode(tokensCell.props.children);
  const statusContent = asVNode(statusCell.props.children);

  assertStrictEquals(nameCell.props.role, 'gridcell');
  assertStrictEquals(nameContent.type, 'strong');
  assertStrictEquals(nameContent.props.children, 'Plain');
  assertStrictEquals(tokensContent.type, 'span');
  assertStrictEquals(tokensContent.props.children, 10);
  assertStrictEquals(statusContent.type, 'em');
  assertStrictEquals(statusContent.props.children, 'idle');
});

Deno.test('DataGrid applies column widths as grid-template-columns', () => {
  const row = rowGroupRows(renderGrid())[0];
  const style = row.props.style as Record<string, unknown>;

  assertEquals(style.gridTemplateColumns, '2fr 8rem minmax(0, 1fr)');
});
