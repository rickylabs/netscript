import { assertEquals } from '@std/assert';
import { getDocsLane, navLanes } from '../../docs/site/_data.ts';

Deno.test('lane identity survives navigation reordering', () => {
  const original = [...navLanes];
  try {
    navLanes.reverse();
    assertEquals(getDocsLane('/cli-reference/').id, 'reference');
    assertEquals(getDocsLane('/unlisted/').id, 'start');
    assertEquals(getDocsLane('/design-system/themes/studio/').id, 'design-system');
    assertEquals(getDocsLane('/how-to/').id, 'build');
    assertEquals(getDocsLane('/glossary/').id, 'reference');
    assertEquals(getDocsLane('/comparisons/backend/').id, 'concepts');
    assertEquals(getDocsLane('/quickstart/').id, 'start');
  } finally {
    navLanes.splice(0, navLanes.length, ...original);
  }
});
