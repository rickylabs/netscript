import { assertEquals } from '@std/assert';
import { getTooltipDataState } from './use-tooltip.ts';

Deno.test('getTooltipDataState returns open when the tooltip is open', () => {
  assertEquals(
    getTooltipDataState(true),
    'open',
    'Tooltip data-state should reflect an open tooltip',
  );
});

Deno.test('getTooltipDataState returns closed when the tooltip is closed', () => {
  assertEquals(
    getTooltipDataState(false),
    'closed',
    'Tooltip data-state should reflect a closed tooltip',
  );
});

