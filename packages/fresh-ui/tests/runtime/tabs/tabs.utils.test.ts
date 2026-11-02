import { assertEquals } from '@std/assert';
import { getNextTabsIndex } from '../../../src/runtime/tabs/tabs.utils.ts';

Deno.test('getNextTabsIndex advances horizontally with looping', () => {
  assertEquals(
    getNextTabsIndex('ArrowRight', 2, 3, 'horizontal', true),
    0,
    'Horizontal navigation should wrap',
  );
});

Deno.test('getNextTabsIndex clamps vertically without looping', () => {
  assertEquals(
    getNextTabsIndex('ArrowUp', 0, 4, 'vertical', false),
    0,
    'Vertical navigation should clamp at the start',
  );
});

Deno.test('getNextTabsIndex handles Home and End keys', () => {
  assertEquals(
    getNextTabsIndex('Home', 2, 5, 'horizontal', true),
    0,
    'Home should jump to the first tab',
  );
  assertEquals(
    getNextTabsIndex('End', 1, 5, 'horizontal', true),
    4,
    'End should jump to the last tab',
  );
});

Deno.test('RTL reverses only horizontal arrows, preserving endpoints and vertical navigation', () => {
  assertEquals(getNextTabsIndex('ArrowLeft', 0, 3, 'horizontal', true, 'rtl'), 1);
  assertEquals(getNextTabsIndex('ArrowRight', 0, 3, 'horizontal', true, 'rtl'), 2);
  assertEquals(getNextTabsIndex('Home', 2, 3, 'horizontal', true, 'rtl'), 0);
  assertEquals(getNextTabsIndex('End', 0, 3, 'horizontal', true, 'rtl'), 2);
  assertEquals(getNextTabsIndex('ArrowDown', 0, 3, 'vertical', true, 'rtl'), 1);
  assertEquals(getNextTabsIndex('ArrowUp', 0, 3, 'vertical', true, 'rtl'), 2);
});
