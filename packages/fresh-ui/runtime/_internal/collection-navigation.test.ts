import { assertEquals } from '@std/assert';
import { getNextCollectionIndex } from './collection-navigation.ts';

Deno.test('getNextCollectionIndex wraps forward navigation when looping', () => {
  assertEquals(
    getNextCollectionIndex('ArrowDown', 2, 3, 'vertical', true),
    0,
    'Vertical navigation should wrap when looping is enabled',
  );
});

Deno.test('getNextCollectionIndex clamps backward navigation when looping is disabled', () => {
  assertEquals(
    getNextCollectionIndex('ArrowLeft', 0, 4, 'horizontal', false),
    0,
    'Horizontal navigation should clamp at the start when looping is disabled',
  );
});

Deno.test('getNextCollectionIndex supports Home and End keys', () => {
  assertEquals(
    getNextCollectionIndex('Home', 2, 5, 'vertical', true),
    0,
    'Home should jump to the first item',
  );
  assertEquals(
    getNextCollectionIndex('End', 1, 5, 'vertical', true),
    4,
    'End should jump to the last item',
  );
});
