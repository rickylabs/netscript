import { assert } from '@std/assert';
import { ChartBlock } from '../../../../registry/components/ui/chart-block.tsx';

interface VNodeLike {
  type: unknown;
  props: Record<string, unknown>;
}

function vnodeProps(value: unknown): Record<string, unknown> {
  assert(value && typeof value === 'object' && 'props' in value, 'expected a vnode');
  return (value as VNodeLike).props;
}

function classes(value: unknown): string[] {
  return typeof value === 'string' ? value.split(' ').filter(Boolean) : [];
}

const DATA = [
  { label: 'VIF', value: 80, tone: 'success' as const },
  { label: 'PROSCO', value: 40, tone: 'warning' as const },
  { label: 'Errors', value: 10, tone: 'destructive' as const },
];

Deno.test('ChartBlock defaults to horizontal bars with tones + values', () => {
  const v = ChartBlock({ data: DATA, title: 'Throughput', unit: '/h' });
  assert(classes(vnodeProps(v).class).includes('ns-chart'), 'bar base class');
  const json = JSON.stringify(v);
  assert(json.includes('Throughput'), 'title');
  assert(json.includes('ns-chart__bar'), 'bars');
  assert(json.includes('success') && json.includes('destructive'), 'tones via data-tone');
  assert(json.includes('80/h'), 'value + unit');
});

Deno.test('ChartBlock column variant renders y-axis ticks and x labels', () => {
  const v = ChartBlock({ data: DATA, variant: 'column' });
  assert(classes(vnodeProps(v).class).includes('ns-colchart'), 'column base class');
  const json = JSON.stringify(v);
  assert(json.includes('ns-colchart__ytick'), 'y-axis ticks');
  assert(json.includes('ns-colchart__bar'), 'column bars');
  assert(json.includes('VIF') && json.includes('PROSCO'), 'x labels');
});

Deno.test('ChartBlock scales bar size to a nice axis maximum (no hardcoded color)', () => {
  // max value 80 → niceMax 100 → tallest bar height 80%
  const json = JSON.stringify(ChartBlock({ data: DATA, variant: 'column' }));
  assert(json.includes('80%'), 'tallest column scaled to nice max');
  assert(!/#[0-9a-fA-F]{3,8}/.test(json), 'no raw hex in output');
});
