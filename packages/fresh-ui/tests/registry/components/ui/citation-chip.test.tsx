import { assert, assertEquals } from '@std/assert';
import { render } from 'npm:preact-render-to-string@^6.7.0';
import { CitationChip } from '../../../../registry/components/ui/citation-chip.tsx';

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

Deno.test('CitationChip renders the index as a button with a labelled source', () => {
  const p = vnodeProps(CitationChip({ index: 3, source: 'VIF spec §4' }));
  assertEquals(p.type, 'button');
  assertEquals(p.title, 'VIF spec §4');
  assertEquals(p['aria-label'], 'Source 3: VIF spec §4');
  assertEquals(p['aria-pressed'], 'false');
  assert(classes(p.class).includes('ns-citation'));
  assert(render(CitationChip({ index: 3 })).includes('>3</span>'));
});

Deno.test('CitationChip active exposes data-state + aria-pressed', () => {
  const p = vnodeProps(CitationChip({ index: 1, active: true }));
  assertEquals(p['data-state'], 'active');
  assertEquals(p['aria-pressed'], 'true');
  assertEquals(p['aria-label'], 'Source 1');
});
