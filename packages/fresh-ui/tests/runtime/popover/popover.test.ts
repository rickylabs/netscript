import { assertEquals } from '@std/assert';
import { getPopoverDataState } from '../../../runtime/popover/use-popover.ts';

Deno.test('getPopoverDataState returns open when the popover is open', () => {
  assertEquals(
    getPopoverDataState(true),
    'open',
    'Popover data-state should reflect an open popover',
  );
});

Deno.test('getPopoverDataState returns closed when the popover is closed', () => {
  assertEquals(
    getPopoverDataState(false),
    'closed',
    'Popover data-state should reflect a closed popover',
  );
});
