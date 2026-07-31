import { assertEquals } from '@std/assert';
import {
  getPopoverDataState,
  restorePopoverTriggerFocus,
} from '../../../src/runtime/popover/use-popover.ts';

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

Deno.test('popover dismissal restores focus to its trigger', () => {
  let focused = false;
  restorePopoverTriggerFocus({ focus: () => focused = true });
  assertEquals(focused, true);
});
