import { assertEquals } from '@std/assert';
import { getDrawerDataState } from './use-drawer.ts';

Deno.test('getDrawerDataState returns open when the drawer is open', () => {
  assertEquals(getDrawerDataState(true), 'open', 'Drawer data-state should reflect an open drawer');
});

Deno.test('getDrawerDataState returns closed when the drawer is closed', () => {
  assertEquals(
    getDrawerDataState(false),
    'closed',
    'Drawer data-state should reflect a closed drawer',
  );
});
