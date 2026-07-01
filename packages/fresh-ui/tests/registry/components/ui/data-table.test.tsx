import { assert, assertEquals } from '@std/assert';
import { DataTable } from '../../../../registry/components/ui/data-table.tsx';

interface VNodeLike {
  type: unknown;
  props: Record<string, unknown>;
}

function vnodeProps(value: unknown): Record<string, unknown> {
  assert(
    value && typeof value === 'object' && 'props' in value,
    'expected a vnode with props',
  );
  return (value as VNodeLike).props;
}

Deno.test('DataTable.Row applies cols as grid-template-columns', () => {
  const row = DataTable.Row({ cols: '2fr 1fr 1fr', children: 'cell' });
  const style = vnodeProps(row).style as Record<string, unknown> | undefined;
  assert(style && typeof style === 'object', 'cols must produce a style object');
  assertEquals(style.gridTemplateColumns, '2fr 1fr 1fr');
  assert(
    String(vnodeProps(row).class).split(' ').includes('grid'),
    'row keeps its grid display class',
  );
});

Deno.test('DataTable.Row merges cols with an incoming style object', () => {
  const row = DataTable.Row({
    cols: 'minmax(0, 1fr) auto',
    style: { opacity: 0.5 },
    children: 'c',
  });
  const style = vnodeProps(row).style as Record<string, unknown>;
  assertEquals(style.gridTemplateColumns, 'minmax(0, 1fr) auto');
  assertEquals(style.opacity, 0.5);
});

Deno.test('DataTable.Row without cols carries no grid template (opt-in, no surprise styling)', () => {
  const row = DataTable.Row({ children: 'cell' });
  assertEquals(vnodeProps(row).style, undefined);
});
