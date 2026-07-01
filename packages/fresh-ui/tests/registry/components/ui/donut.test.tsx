import { assert } from '@std/assert';
import { Donut } from '../../../../registry/components/ui/donut.tsx';

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
  { label: 'Opus', value: 60 },
  { label: 'Sonnet', value: 30 },
  { label: 'Haiku', value: 10 },
];

Deno.test('Donut renders rings, center total, and legend', () => {
  const v = Donut({ data: DATA });
  assert(classes(vnodeProps(v).class).includes('ns-donut'), 'base class');
  const json = JSON.stringify(v);
  assert(json.includes('ns-donut__ring'), 'arc rings');
  assert(json.includes('ns-donut__legend'), 'legend');
  assert(json.includes('Opus') && json.includes('Haiku'), 'legend labels');
  assert(json.includes('100'), 'center sum (60+30+10)');
});

Deno.test('Donut cycles semantic tones and honors explicit total', () => {
  const v = Donut({ data: DATA, total: '1.2k' });
  const json = JSON.stringify(v);
  assert(json.includes('1.2k'), 'explicit center total');
  // first three cycle entries: primary, success, warning
  assert(json.includes('success') && json.includes('warning'), 'token-cycle tones');
  assert(!/#[0-9a-fA-F]{3,8}/.test(json), 'no raw hex');
});
