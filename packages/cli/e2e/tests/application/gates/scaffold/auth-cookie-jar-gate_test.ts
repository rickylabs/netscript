import { assert, assertEquals } from '@std/assert';
import { resolveSuite } from '../../../../src/presentation/cli/suites/registry.ts';
import { SCAFFOLD } from '../../../../src/domain/cli-surface.ts';
import { PACKAGE_SOURCE } from '../../../../src/domain/extension-axes.ts';

Deno.test('runtime suites require the generated cookie-jar proof for local and published consumers', () => {
  for (const suiteId of [SCAFFOLD.RUNTIME, SCAFFOLD.RUNTIME_SQLITE]) {
    for (const packageSource of [PACKAGE_SOURCE.LOCAL, PACKAGE_SOURCE.JSR]) {
      const suite = resolveSuite(suiteId, { packageSource });
      const gate = suite.gates.find((gate) => gate.id === 'behavior.auth-cookie-jar');
      assert(gate, 'Missing generated-project consumer proof');
      assert(gate.kind === 'command');
      assertEquals(gate.critical, true);
      assertEquals(gate.skip, undefined, 'Published consumer proof must never silently skip');
      const ids = suite.gates.map((gate) => gate.id);
      assert(ids.indexOf(gate.id) > ids.indexOf('scaffold.plugin.auth'));
      assert(ids.indexOf(gate.id) < ids.indexOf('cleanup.aspire-stop'));
    }
  }
});
