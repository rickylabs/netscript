import { assertEquals } from '@std/assert';
import { getAccordionDataState } from './use-accordion.ts';

Deno.test('getAccordionDataState returns open when the accordion item is expanded', () => {
  assertEquals(
    getAccordionDataState(true),
    'open',
    'Accordion data-state should reflect an expanded item',
  );
});

Deno.test('getAccordionDataState returns closed when the accordion item is collapsed', () => {
  assertEquals(
    getAccordionDataState(false),
    'closed',
    'Accordion data-state should reflect a collapsed item',
  );
});
