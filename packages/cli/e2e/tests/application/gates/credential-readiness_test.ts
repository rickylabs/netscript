import { assertEquals, assertRejects, assertStringIncludes, assertThrows } from '@std/assert';
import { delay } from '@std/async/delay';

import { generateRegisterInfrastructure } from '../../../../src/kernel/templates/aspire/helpers/register/generate-register-infrastructure.ts';
import { GATE, SCAFFOLD } from '../../../src/domain/cli-surface.ts';
import { DATABASE, PACKAGE_SOURCE, REPORT_FORMAT } from '../../../src/domain/extension-axes.ts';
import type { RunContext } from '../../../src/domain/run-context.ts';
import {
  createCredentialFaultPassword,
  CREDENTIAL_FAULT_PROBE_DIR,
  CREDENTIAL_FAULT_PROBE_RESOURCE,
  injectCredentialFaultHealthCheck,
  prepareCredentialFaultFixture,
  TEST_ONLY_POSTGRES_AUTH_REJECTED_KEY,
} from '../../../src/application/gates/scaffold/runtime/credential-fault-fixture.ts';
import { createCredentialReadinessGates } from '../../../src/application/gates/scaffold/runtime/credential-readiness-gates.ts';
import { injectListenerFaultHealthChecks } from '../../../src/application/gates/scaffold/runtime/prepare-readiness-fixture.ts';
import {
  assertGeneratedHelpersHaveNoSecrets,
  assertHealthReportsHaveNoSecrets,
  assertMcpTranscriptHasNoSecrets,
} from '../../../src/application/gates/scaffold/runtime/credential-secret-surfaces.ts';
import {
  ASPIRE_WAIT_TIMEOUT_EXIT_CODE,
  assertBoundedWaitRejected,
  assertCredentialRejectionEvidence,
} from '../../../src/application/gates/scaffold/runtime/verify-credential-rejection.ts';

const REAL_PASSWORD = '5f0c2a9e8b7d4c3a1f6e5d4c3b2a1908';
const WRONG_PASSWORD = '0123456789abcdef0123456789abcdef';
const SECRETS = [REAL_PASSWORD, WRONG_PASSWORD];
const AUTH_DESCRIPTION =
  'postgres credential check failed: auth 28P01 (invalid_password) at localhost:54321 after 9 ms';

Deno.test('credential fault probe task stays alive for repeated Aspire health evaluations', async () => {
  const projectRoot = await Deno.makeTempDir();
  let probe: Deno.ChildProcess | undefined;
  let probeExited = false;
  try {
    await prepareCredentialFaultFixture(projectRoot, postgresInfrastructure());
    probe = new Deno.Command(Deno.execPath(), {
      args: ['task', 'start'],
      cwd: `${projectRoot}/${CREDENTIAL_FAULT_PROBE_DIR}`,
      stdin: 'null',
      stdout: 'null',
      stderr: 'null',
    }).spawn();
    const abort = new AbortController();
    try {
      const outcome = await Promise.race([
        probe.status.then((status) => {
          probeExited = true;
          return `exited ${status.code}`;
        }),
        delay(500, { signal: abort.signal }).then(() => 'running'),
      ]);
      assertEquals(outcome, 'running', 'the probe must keep active event-loop work');
    } finally {
      abort.abort();
    }
  } finally {
    if (probe) {
      if (!probeExited) probe.kill('SIGTERM');
      await probe.status;
    }
    await Deno.remove(projectRoot, { recursive: true });
  }
});

Deno.test('credential fault splice reuses the generated postgres_auth server binding', () => {
  const source = injectListenerFaultHealthChecks(postgresInfrastructure(), DATABASE.POSTGRES);
  const injected = injectCredentialFaultHealthCheck(source, WRONG_PASSWORD);
  const lines = injected.split('\n');
  const attachment = lines.findIndex((line) =>
    line.trim() === 'await db_0_server.withHealthCheck("postgres_auth");'
  );

  assertEquals(attachment > 0, true);
  assertStringIncludes(
    lines[attachment + 3],
    `builder.addHealthCheck('${TEST_ONLY_POSTGRES_AUTH_REJECTED_KEY}', ` +
      `createPostgresCredentialReadinessCheck({ endpoint: () => db_0_server.getEndpoint('tcp'), ` +
      'password: credential_fault_password }));',
  );
  assertStringIncludes(
    lines[attachment + 4],
    `builder.addExecutable('${CREDENTIAL_FAULT_PROBE_RESOURCE}', 'deno', ` +
      '`${appHostDir}/.netscript/e2e/credential-fault-probe`',
  );
  assertStringIncludes(
    lines[attachment + 5],
    `await credential_fault_probe.withHealthCheck('${TEST_ONLY_POSTGRES_AUTH_REJECTED_KEY}');`,
  );
  // The fault never touches the real database's checks.
  assertEquals(
    injected.split('\n').filter((line) =>
      line.includes('db_0_server.withHealthCheck') &&
      line.includes(TEST_ONLY_POSTGRES_AUTH_REJECTED_KEY)
    ),
    [],
  );
  assertEquals(injected.includes(WRONG_PASSWORD), false);
  assertStringIncludes(injected, 'readCredentialFaultState');
  assertStringIncludes(injected, 'appHostDir: string');
  assertStringIncludes(injected, 'createPostgresCredentialReadinessCheck,');
});

Deno.test('credential fault splice fails closed without exactly one postgres_auth marker', () => {
  const sqlite = generateRegisterInfrastructure({
    databases: {
      sqlite: { Enabled: true, Engine: 'Sqlite', DataPath: '.data/app.sqlite', Persistent: false },
    },
    caches: {},
  });
  assertThrows(
    () => injectCredentialFaultHealthCheck(sqlite, WRONG_PASSWORD),
    Error,
    'must attach postgres_auth once; found 0',
  );
  const injected = injectCredentialFaultHealthCheck(postgresInfrastructure(), WRONG_PASSWORD);
  assertThrows(
    () => injectCredentialFaultHealthCheck(injected, WRONG_PASSWORD),
    Error,
    'already registered',
  );
  assertThrows(
    () => injectCredentialFaultHealthCheck(postgresInfrastructure(), "x'); evil('"),
    Error,
    'lowercase hex token',
  );
  assertEquals(/^[0-9a-f]{32}$/.test(createCredentialFaultPassword()), true);
});

Deno.test('rejection evidence requires an auth-classified report beside a Healthy server', () => {
  const evidence = assertCredentialRejectionEvidence(snapshot(), SECRETS);

  assertEquals(evidence.rejected.status, 'Unhealthy');
  assertEquals(evidence.rejected.description, AUTH_DESCRIPTION);
  assertEquals(evidence.listener.status, 'Healthy');
  assertEquals(evidence.accepted.status, 'Healthy');
});

Deno.test('rejection evidence refuses a non-auth failure or a degraded real server', () => {
  assertThrows(
    () =>
      assertCredentialRejectionEvidence(
        snapshot({
          rejectedDescription:
            'postgres credential check failed: listener ECONNREFUSED at localhost:54321 after 1 ms',
        }),
        SECRETS,
      ),
    Error,
    'not auth-classified',
  );
  assertThrows(
    () => assertCredentialRejectionEvidence(snapshot({ rejectedStatus: 'Healthy' }), SECRETS),
    Error,
    'expected Unhealthy',
  );
  assertThrows(
    () => assertCredentialRejectionEvidence(snapshot({ realAuthStatus: 'Unhealthy' }), SECRETS),
    Error,
    'postgres postgres_auth is Unhealthy',
  );
  assertThrows(
    () => assertCredentialRejectionEvidence(snapshot({ rejectedClass: 'listener' }), SECRETS),
    Error,
    'data.class is "listener"',
  );
});

Deno.test('describe environment projection is deferred to #2259; health descriptions still fail', () => {
  for (const secret of SECRETS) {
    assertCredentialRejectionEvidence(
      snapshot({ extraEnvironment: `Password=${secret}` }),
      SECRETS,
    );
    const error = assertThrows(
      () => assertCredentialRejectionEvidence(snapshot({ rejectedDescription: secret }), SECRETS),
      Error,
      'health evidence output contains credential',
    );
    assertEquals(error.message.includes(secret), false);
  }
});

Deno.test('scoped secret scan rejects each credential in helpers, all health evidence and MCP', async () => {
  const projectRoot = await Deno.makeTempDir();
  try {
    await Deno.mkdir(`${projectRoot}/aspire/.helpers/nested`, { recursive: true });
    for (const secret of SECRETS) {
      await Deno.writeTextFile(`${projectRoot}/aspire/.helpers/nested/probe.mts`, secret);
      const helperError = await assertRejects(
        () => assertGeneratedHelpersHaveNoSecrets(projectRoot, SECRETS),
        Error,
        'generated helper output contains credential',
      );
      assertEquals(helperError.message.includes(secret), false);
      for (const key of ['healthReports', 'healthChecks', 'healthCheckDescriptions']) {
        for (const field of ['description', 'data', 'exception']) {
          const healthError = assertThrows(
            () =>
              assertHealthReportsHaveNoSecrets({
                resources: [
                  { name: 'unselected-resource', [key]: { other_check: { [field]: secret } } },
                ],
              }, SECRETS),
            Error,
            'health evidence output contains credential',
          );
          assertEquals(healthError.message.includes(secret), false);
        }
      }
      const mcpError = assertThrows(
        () =>
          assertMcpTranscriptHasNoSecrets(
            [
              { direction: 'response', message: { result: { content: [{ text: secret }] } } },
            ],
            SECRETS,
          ),
        Error,
        'MCP list_resources output contains credential',
      );
      assertEquals(mcpError.message.includes(secret), false);
    }
    await Deno.writeTextFile(
      `${projectRoot}/aspire/.helpers/nested/probe.mts`,
      '// no literal secret',
    );
    await assertGeneratedHelpersHaveNoSecrets(projectRoot, SECRETS);
  } finally {
    await Deno.remove(projectRoot, { recursive: true });
  }
});

Deno.test('bounded wait must time out with the documented exit code and no leak', () => {
  assertBoundedWaitRejected(
    { code: ASPIRE_WAIT_TIMEOUT_EXIT_CODE, durationMs: 10_400, output: 'timed out' },
    SECRETS,
  );
  assertThrows(
    () => assertBoundedWaitRejected({ code: 0, durationMs: 50, output: '' }, SECRETS),
    Error,
    'exited 0, expected 18',
  );
  assertThrows(
    () =>
      assertBoundedWaitRejected(
        { code: 18, durationMs: 10_000, output: `connection Password=${REAL_PASSWORD}` },
        SECRETS,
      ),
    Error,
    'aspire wait output contains credential #0',
  );
});

Deno.test('credential readiness gates wait on postgres_auth and run the rejection verifier', () => {
  const [accepted, rejected] = createCredentialReadinessGates();
  if (accepted.kind !== 'command' || rejected.kind !== 'command') {
    throw new Error('credential readiness gates must be command gates');
  }
  assertEquals(accepted.id, GATE.RUNTIME_HEALTH_CREDENTIAL_ACCEPTED);
  assertEquals(rejected.id, GATE.RUNTIME_HEALTH_CREDENTIAL_REJECTED);
  assertEquals(accepted.command(runContext()).slice(-4), [
    '/workspace/app/aspire/apphost.mts',
    'postgres',
    'postgres_auth',
    '300000',
  ]);
  assertEquals(rejected.command(runContext()).slice(-3), [
    '/repo/packages/cli/e2e/src/application/gates/scaffold/runtime/verify-credential-rejection.ts',
    '/workspace/app/aspire/apphost.mts',
    '/workspace/app',
  ]);
});

function postgresInfrastructure(): string {
  return generateRegisterInfrastructure({
    databases: {
      postgres: { Enabled: true, Engine: 'Postgres', Mode: 'Container', Persistent: false },
    },
    caches: { garnet: { Enabled: true, Engine: 'Garnet', Mode: 'Container' } },
    primaryDatabase: 'postgres',
    primaryCache: 'garnet',
  });
}

function snapshot(overrides: {
  readonly rejectedStatus?: string;
  readonly rejectedDescription?: string;
  readonly rejectedClass?: string;
  readonly realAuthStatus?: string;
  readonly extraEnvironment?: string;
} = {}): string {
  return JSON.stringify({
    resources: [
      {
        name: 'postgres',
        state: 'Running',
        healthStatus: 'Healthy',
        environment: overrides.extraEnvironment ? [overrides.extraEnvironment] : [],
        healthReports: {
          postgres_listener: { status: 'Healthy', description: 'postgres listener ready' },
          postgres_auth: {
            status: overrides.realAuthStatus ?? 'Healthy',
            description: 'postgres credentials accepted on localhost:54321',
          },
        },
      },
      {
        name: CREDENTIAL_FAULT_PROBE_RESOURCE,
        state: 'Running',
        healthStatus: 'Unhealthy',
        healthReports: {
          [TEST_ONLY_POSTGRES_AUTH_REJECTED_KEY]: {
            status: overrides.rejectedStatus ?? 'Unhealthy',
            description: overrides.rejectedDescription ?? AUTH_DESCRIPTION,
            ...(overrides.rejectedClass ? { data: { class: overrides.rejectedClass } } : {}),
          },
        },
      },
    ],
  });
}

function runContext(): RunContext {
  return {
    request: {
      suiteId: SCAFFOLD.RUNTIME,
      options: {
        repoRoot: '/repo',
        cliEntrypoint: 'packages/cli/bin/netscript-dev.ts',
        smokeRoot: '/workspace',
        projectName: 'app',
        database: DATABASE.POSTGRES,
        packageSource: PACKAGE_SOURCE.LOCAL,
        plugins: [],
        samples: true,
        cache: true,
        cleanup: true,
        format: REPORT_FORMAT.PRETTY,
        commandTimeoutMs: 900_000,
        httpTimeoutMs: 30_000,
      },
    },
    project: {
      repoRoot: '/repo',
      cliEntrypoint: 'packages/cli/bin/netscript-dev.ts',
      smokeRoot: '/workspace',
      projectName: 'app',
      projectRoot: '/workspace/app',
      appHost: '/workspace/app/aspire/apphost.mts',
    },
  };
}
