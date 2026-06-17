import { assert, assertEquals } from 'jsr:@std/assert@^1';
import { triggersPlugin } from '../../mod.ts';

Deno.test('triggersPlugin manifest declares the triggers health E2E gate', () => {
  assertEquals(triggersPlugin.contributions.e2e, [{
    name: 'triggers-health',
    command: 'deno task triggers:e2e',
  }]);
  assert(
    triggersPlugin.contributions.e2e?.some((gate) =>
      gate.name === 'triggers-health' && gate.command === 'deno task triggers:e2e'
    ),
  );
});
