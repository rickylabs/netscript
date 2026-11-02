import { assertEquals } from '@std/assert';
import { renderedOrderActivity } from './probe-showcase.ts';
import { createShowcaseSuite } from '../../../../../suites/scaffold/showcase-suite.ts';
import { GATE } from '../../../../domain/cli-surface.ts';

Deno.test('showcase requires its order in the ready stream panel, excluding scripts and unrelated rows', () => {
  const panel =
    '<section data-capability="streams" data-capability-state="ready"><li>Anonymous updated SO-10482</li></section>';
  assertEquals(renderedOrderActivity(panel, 'SO-10482'), true);
  assertEquals(renderedOrderActivity(panel, 'SO-10481'), false);
  assertEquals(renderedOrderActivity('<script>' + panel + '</script>', 'SO-10482'), false);
  assertEquals(renderedOrderActivity(panel.replace('ready', 'unavailable'), 'SO-10482'), false);
  assertEquals(
    renderedOrderActivity('<table><tr>SO-10481 updated</tr></table>' + panel, 'SO-10481'),
    false,
  );
  assertEquals(
    renderedOrderActivity(
      '<section data-capability="streams" data-capability-state="ready"><li>Maya created SO-10482</li><li>Anonymous updated SO-10481</li></section>',
      'SO-10482',
    ),
    false,
  );
});

Deno.test('showcase suite follows init/setup/start without background wiring fixtures', () => {
  assertEquals(createShowcaseSuite().gates.map((gate) => gate.id), [
    GATE.SHOWCASE_INIT,
    GATE.SHOWCASE_SETUP,
    GATE.SHOWCASE_CHECK,
    GATE.SHOWCASE_BUILD,
    GATE.SHOWCASE_START,
    GATE.SHOWCASE_WALKTHROUGH,
    GATE.CLEANUP_ASPIRE_STOP,
  ]);
});
