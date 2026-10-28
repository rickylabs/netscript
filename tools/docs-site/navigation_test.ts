import { assertEquals } from '@std/assert';
import { getDocsLane, navLanes } from '../../docs/site/_data.ts';

Deno.test('lane identity survives navigation reordering', () => {
  const original = [...navLanes];
  try {
    navLanes.reverse();
    assertEquals(getDocsLane('/cli-reference/').id, 'reference');
    assertEquals(getDocsLane('/unlisted/').id, 'start');
    assertEquals(getDocsLane('/design-system/themes/studio/').id, 'design-system');
  } finally {
    navLanes.splice(0, navLanes.length, ...original);
  }
});
