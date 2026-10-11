import { assertEquals, assertThrows } from '@std/assert';
import { KV_BACKGROUND_RUNTIME_RESOURCES, SCAFFOLD } from '../../../src/domain/cli-surface.ts';
import type { RunContext } from '../../../src/domain/run-context.ts';
import { parseHttpExchangeContract } from '../../../src/domain/http-contract.ts';
import { resolveSuite } from '../../../src/presentation/cli/suites/registry.ts';
import { parseResourceUpdateLine } from '../../../src/application/gates/scaffold/runtime/resource-state-stream.ts';
import { resourceUrlsFromDescribeOutput } from '../../../src/application/gates/scaffold/generated-app-endpoint.ts';
const CONTEXT = {
  project: { repoRoot: '/repo', appHost: '/workspace/aspire/apphost.mts' },
} as RunContext;
function assertCoverage(ids: readonly string[]): void {
  assertEquals(ids.includes('behavior.background-children-health'), true, 'child probe missing');
  assertEquals(ids.includes('behavior.streams-health'), true, 'streams probe missing');
}

Deno.test('both runtime suites require child and streams probes; removed streams probe turns coverage red', () => {
  for (const suiteId of [SCAFFOLD.RUNTIME, SCAFFOLD.RUNTIME_SQLITE]) {
    const gates = resolveSuite(suiteId).gates.filter((gate) =>
      String(gate.id) === 'behavior.background-children-health' ||
      String(gate.id) === 'behavior.streams-health'
    );
    assertCoverage(gates.map((gate) => gate.id));
    assertEquals(gates.every((gate) => gate.critical), true);
    assertThrows(
      () =>
        assertCoverage(
          gates.filter((gate) => String(gate.id) !== 'behavior.streams-health').map((gate) =>
            gate.id
          ),
        ),
      Error,
      'streams probe missing',
    );
    const stream = gates.find((gate) => String(gate.id) === 'behavior.streams-health');
    if (stream?.kind !== 'command') throw new Error('streams command gate missing');
    const command = stream.command(CONTEXT);
    assertEquals(command.slice(-4, -1), ['streams', 'exchange', '/health/ready']);
    assertEquals(command.includes('--no-lock'), false);
    assertEquals(parseHttpExchangeContract(command.at(-1)!), {
      method: 'GET',
      expectStatus: 200,
      expectBody: { kind: 'json-equals', value: { ready: true } },
    });
  }
});

Deno.test('endpoint resolution rejects prefix siblings even when their API or CLI health is green', () => {
  for (const resource of [...KV_BACKGROUND_RUNTIME_RESOURCES, 'streams', 'postgres']) {
    const sibling = {
      name: `${resource}-api-instance`,
      displayName: `${resource}-api`,
      urls: ['http://sibling.test'],
    };
    assertThrows(
      () => parseResourceUpdateLine(JSON.stringify(sibling), resource),
      Error,
      'Unrecognized',
    );
    assertThrows(
      () => resourceUrlsFromDescribeOutput(JSON.stringify({ resources: [sibling] }), resource),
      Error,
      'was not present',
    );
    assertThrows(
      () =>
        parseResourceUpdateLine(JSON.stringify({ ...sibling, displayName: undefined }), resource),
      Error,
      'Unrecognized',
    );
  }
  assertThrows(
    () =>
      parseResourceUpdateLine(
        JSON.stringify({ name: 'postgres-cli', displayName: 'postgres-cli' }),
        'postgres',
      ),
    Error,
    'Unrecognized',
  );
});
