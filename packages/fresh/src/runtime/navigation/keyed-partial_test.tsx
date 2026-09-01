import { assert, assertEquals, assertNotEquals } from '@std/assert';
import { Partial } from 'fresh/runtime';
import type { VNode } from 'preact';
import { KeyedPartial } from './keyed-partial.tsx';

function renderBoundary(name: string): VNode<{ readonly name: string }> {
  return KeyedPartial({ name, mode: 'replace', children: name }) as VNode<{
    readonly name: string;
  }>;
}

Deno.test('KeyedPartial delegates to Fresh with name-owned native VNode identity', () => {
  const firstA = renderBoundary('region-a');
  const boundaryB = renderBoundary('region-b');
  const finalA = renderBoundary('region-a');

  assert(firstA.type === Partial);
  assertEquals(firstA.props.name, 'region-a');
  assertEquals(firstA.key, 'region-a');
  assertEquals(boundaryB.key, 'region-b');
  assertEquals(finalA.key, 'region-a');
  assertNotEquals(firstA.key, boundaryB.key);
});

Deno.test('colon-bearing names retain VNode identity and document Fresh marker normalization', () => {
  const boundary = renderBoundary('order:summary');

  assertEquals(boundary.key, 'order:summary');
  assertEquals(String(boundary.key).replaceAll(':', '_'), 'order_summary');
});
