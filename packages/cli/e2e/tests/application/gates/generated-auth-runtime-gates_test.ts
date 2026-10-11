import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { GATE } from '../../../src/domain/cli-surface.ts';
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

Deno.test('resident anonymous auth gates use the AppHost POST exchange and credentialed gates precede start', () => {
  const gates = resolveSuite('scaffold.runtime').gates;
  const start = gates.findIndex((gate) => gate.id === GATE.RUNTIME_ASPIRE_START);
  assert(start >= 0);
  const context = {
    request: {
      suiteId: 'scaffold.runtime',
      options: {
        repoRoot: '.',
        cliEntrypoint: './packages/cli/bin/netscript.ts',
        smokeRoot: '.llm/tmp/cli-e2e',
        projectName: 'auth-gate-test',
        database: 'postgres',
        packageSource: 'local',
        plugins: [],
        samples: true,
        cache: true,
        cleanup: true,
        format: 'json',
        commandTimeoutMs: 30000,
        httpTimeoutMs: 30000,
      },
    },
    project: {
      repoRoot: '.',
      cliEntrypoint: './packages/cli/bin/netscript.ts',
      smokeRoot: '.llm/tmp/cli-e2e',
      projectName: 'auth-gate-test',
      projectRoot: './fixture',
      appHost: './fixture/aspire/apphost.mts',
    },
  } satisfies import('../../../src/domain/run-context.ts').RunContext;
  for (
    const [id, path] of [
      ['behavior.auth-signout-unauthenticated', '/api/v1/auth/signout'],
      ['behavior.auth-rpc-unauthenticated', '/api/rpc/v1/auth/signout'],
    ]
  ) {
    const gate = gates.find((gate) => gate.id === id);
    assert(gate?.kind === 'command');
    const command = gate.command(context);
    assert(command.some((arg) => arg.endsWith('/probe-plugin-resource.ts')));
    assertEquals(command.slice(-5), [
      context.project.appHost,
      'auth',
      'exchange',
      path,
      JSON.stringify({ method: 'POST', expectStatus: 401 }),
    ]);
    assert(gates.indexOf(gate) > start);
  }
  let token: string | undefined;
  for (
    const id of [
      'behavior.auth-session-authenticated',
      'behavior.service-api-unauthenticated',
      'behavior.service-api-authenticated',
      'behavior.auth-signout-foreign-session',
    ]
  ) {
    const gate = gates.find((gate) => gate.id === id);
    assert(gate?.kind === 'command');
    assert(gates.indexOf(gate) < start);
    assertEquals(gate.phase, 'scaffold');
    const command = gate.command(context);
    assertStringIncludes(command.join(' '), 'probe-generated-auth-batch.ts');
    const caseToken = command.at(-2);
    if (token === undefined) token = caseToken;
    assertEquals(caseToken, token);
    assertEquals(gate.stdoutIncludes, [id + ' PASS']);
    assert(
      command.at(-2) !== gate.command({ ...context }).at(-2),
      'New runner contexts must not reuse verdicts',
    );
  }
});
