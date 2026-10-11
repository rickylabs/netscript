import { assert, assertEquals } from '@std/assert';
import { resolveSuite } from '../../../src/presentation/cli/suites/registry.ts';

const EXPECTED_CASES = [
  'behavior.auth-session-unauthenticated',
  'behavior.auth-me-unauthenticated',
  'behavior.auth-session-authenticated',
  'behavior.auth-signout-unauthenticated',
  'behavior.auth-rpc-unauthenticated',
  'behavior.service-api-unauthenticated',
  'behavior.service-api-authenticated',
  'behavior.auth-signout-foreign-session',
];

for (const suiteId of ['scaffold.runtime', 'scaffold.runtime.sqlite'] as const) {
  Deno.test(`${suiteId} selects every exact generated-auth runtime case`, () => {
    const gates = resolveSuite(suiteId).gates;
    for (const id of EXPECTED_CASES) {
      const matches = gates.filter((gate) => gate.id === id);
      assertEquals(matches.length, 1, suiteId + ': missing or duplicated ' + id);
      assert(matches[0].critical, id + ' must block acceptance on failure');
    }
    assertEquals(gates.some((gate) => String(gate.id) === 'behavior.auth-session'), false);
  });
}
