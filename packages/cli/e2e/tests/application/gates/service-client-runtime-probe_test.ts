import {
  assertEquals,
  assertRejects,
  assertStrictEquals,
  assertStringIncludes,
  assertThrows,
} from '@std/assert';
import { z } from 'zod';

import { createSmokeProject } from '../../../src/application/builders/workspace/smoke-project-factory.ts';
import {
  terminateBrowserProcess,
  waitForCompletedStableBaseline,
} from '../../../src/application/gates/scaffold/service-client-browser-probe.ts';
import { generatedAppName } from '../../../src/application/gates/scaffold/generated-app-name.ts';
import { createScaffoldGates } from '../../../src/application/gates/scaffold/scaffold-gates.ts';
import { deriveProcedureInput } from '../../../src/application/gates/scaffold/service-client-input-probe.ts';
import {
  assertByteIdentical,
  assertGeneratedServiceSchemaReady,
  assertServiceGenerationSequence,
  assertServiceKeyIsolation,
  assertSettledRefetch,
  type FileSnapshot,
  serviceClientConsumerSource,
  type ServiceKeyEvidence,
} from '../../../src/application/gates/scaffold/service-client-runtime-probe.ts';
import { GATE, SCAFFOLD } from '../../../src/domain/cli-surface.ts';
import { DATABASE, PACKAGE_SOURCE, REPORT_FORMAT } from '../../../src/domain/extension-axes.ts';
import type { CommandGateDefinition } from '../../../src/domain/gate-definition.ts';
import type { RunContext, RunOptions } from '../../../src/domain/run-context.ts';
import { resolveSuite } from '../../../src/presentation/cli/suites/registry.ts';

const USERS_INPUT = { limit: 3, page: 1, sortBy: 'id', sortOrder: 'asc' } as const;
const PAYMENTS_INPUT = { limit: 3, offset: 0 } as const;

function keyEvidence(): ServiceKeyEvidence {
  return {
    usersInput: USERS_INPUT,
    paymentsInput: PAYMENTS_INPUT,
    usersServerKey: ['users', 'list', JSON.stringify(USERS_INPUT)],
    paymentsServerKey: ['payments', 'list', JSON.stringify(PAYMENTS_INPUT)],
    usersServerFilter: ['users', 'list'],
    paymentsServerFilter: ['payments', 'list'],
    usersClientKey: ['users', 'list', { input: USERS_INPUT }],
    paymentsClientKey: ['payments', 'list', { input: PAYMENTS_INPUT }],
    usersClientFilter: ['users', 'list'],
    paymentsClientFilter: ['payments', 'list'],
  };
}

Deno.test('service client probe accepts distinct typed inputs with isolated own prefixes', () => {
  assertServiceKeyIsolation(keyEvidence());

  assertThrows(
    () =>
      assertServiceKeyIsolation({
        ...keyEvidence(),
        paymentsClientKey: ['payments', 'find', { input: PAYMENTS_INPUT }],
      }),
    Error,
    'paymentsClientKey did not equal',
  );
  assertThrows(
    () =>
      assertServiceKeyIsolation({
        ...keyEvidence(),
        usersClientFilter: ['payments', 'list'],
      }),
    Error,
    'usersClientFilter did not equal',
  );
  assertThrows(
    () =>
      assertServiceKeyIsolation({
        ...keyEvidence(),
        usersServerFilter: ['payments', 'list'],
      }),
    Error,
    'usersServerFilter did not equal',
  );
});

Deno.test('procedure inputs are derived independently from divergent real schema contracts', () => {
  const usersSchema = z.object({
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).default(10),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  });
  const paymentsSchema = z.object({
    limit: z.number().int().positive(),
    offset: z.number().int().nonnegative(),
    search: z.string().min(1).optional(),
  });

  assertThrows(() => paymentsSchema.parse(USERS_INPUT));
  const usersInput = deriveProcedureInput<z.output<typeof usersSchema>>(
    usersSchema,
    'users.list',
  );
  const paymentsInput = deriveProcedureInput<z.output<typeof paymentsSchema>>(
    paymentsSchema,
    'payments.list',
  );
  assertEquals(usersInput, { page: 1, limit: 10, sortOrder: 'desc' });
  assertEquals(paymentsInput, { limit: 1, offset: 0 });

  const source = serviceClientConsumerSource('file:///probe/service-client-runtime-probe.ts');
  assertStringIncludes(source, 'deriveProcedureInput<UsersListInput>');
  assertStringIncludes(source, 'deriveProcedureInput<PaymentsListInput>');
  assertStringIncludes(source, "usersContract.list['~orpc'].inputSchema");
  assertStringIncludes(source, "paymentsContract.list['~orpc'].inputSchema");
  assertEquals(source.includes('const input ='), false);
});

Deno.test('service client schema precondition rejects a project before database codegen', async () => {
  const projectRoot = await Deno.makeTempDir({ prefix: 'netscript-service-schema-missing-' });
  try {
    await assertRejects(
      () => assertGeneratedServiceSchemaReady(projectRoot),
      Error,
      'database/<engine>/schema/.generated/zod/crud.ts',
    );
  } finally {
    await Deno.remove(projectRoot, { recursive: true });
  }
});

Deno.test('service client probe rejects any second-generation byte drift', () => {
  const before: FileSnapshot = {
    'apps/alpha/lib/payments.ts': { size: 8, sha256: 'payments' },
    'apps/alpha/lib/users.ts': { size: 5, sha256: 'users' },
    'aspire/apphost.mts': { size: 7, sha256: 'aspire' },
  };
  assertByteIdentical(before, { ...before });
  assertThrows(
    () =>
      assertByteIdentical(before, {
        ...before,
        'apps/alpha/lib/users.ts': { size: 6, sha256: 'changed' },
      }),
    Error,
    'second service generate changed owned output',
  );
});

Deno.test('service generation converges once then rejects repeated writes or byte drift', async () => {
  const converged: FileSnapshot = {
    'apps/alpha/lib/payments.ts': { size: 8, sha256: 'payments' },
    'apps/alpha/lib/users.ts': { size: 5, sha256: 'users' },
    'aspire/.helpers/services.mts': { size: 7, sha256: 'aspire' },
  };
  const result = (aspireWrites: number) => ({
    code: 0,
    stdout:
      `Wrote 0 service client modules.\nSkipped 2 current service client modules.\nWrote ${aspireWrites} Aspire helper files.\n`,
    stderr: '',
  });

  let generateCall = 0;
  let snapshotCall = 0;
  const events: string[] = [];
  const generations = [result(3), result(0)];
  const snapshots = [converged, { ...converged }];
  await assertServiceGenerationSequence({
    generate: () => {
      events.push(`generate:${generateCall + 1}`);
      return Promise.resolve(generations[generateCall++]!);
    },
    snapshot: () => {
      events.push(`snapshot:${snapshotCall + 1}`);
      return Promise.resolve(snapshots[snapshotCall++]!);
    },
  });
  assertEquals(generateCall, 2);
  assertEquals(snapshotCall, 2);
  assertEquals(events, ['generate:1', 'snapshot:1', 'generate:2', 'snapshot:2']);

  generateCall = 0;
  await assertRejects(
    () =>
      assertServiceGenerationSequence({
        generate: () => Promise.resolve([result(3), result(1)][generateCall++]!),
        snapshot: () => Promise.resolve(converged),
      }),
    Error,
    'consecutive service generate did not report Wrote 0 Aspire helper files.',
  );

  generateCall = 0;
  snapshotCall = 0;
  await assertRejects(
    () =>
      assertServiceGenerationSequence({
        generate: () => Promise.resolve([result(3), result(0)][generateCall++]!),
        snapshot: () =>
          Promise.resolve(
            [
              converged,
              {
                ...converged,
                'aspire/.helpers/services.mts': { size: 8, sha256: 'changed' },
              },
            ][snapshotCall++]!,
          ),
      }),
    Error,
    'second service generate changed owned output',
  );
});

Deno.test('settled refetch proof requires mutation, optimistic row, exactly +1, and final row', () => {
  const evidence = {
    baselineListRequestCount: 2,
    finalListRequestCount: 3,
    mutationSucceeded: true,
    optimisticRowContainedRenamedName: true,
    finalRowContainedRenamedName: true,
    renamedName: 'Ada*',
  } as const;
  assertSettledRefetch(evidence);
  assertThrows(
    () => assertSettledRefetch({ ...evidence, finalListRequestCount: 4 }),
    Error,
    'expected 3',
  );
  assertThrows(
    () => assertSettledRefetch({ ...evidence, mutationSucceeded: false }),
    Error,
    'users.update did not return a success response',
  );
  assertThrows(
    () => assertSettledRefetch({ ...evidence, optimisticRowContainedRenamedName: false }),
    Error,
    'optimistic row did not contain Ada*',
  );
  assertThrows(
    () => assertSettledRefetch({ ...evidence, finalRowContainedRenamedName: false }),
    Error,
    'persisted row did not contain Ada*',
  );
});

Deno.test('quiet baseline rejects a late initial request before accepting the completed count', async () => {
  let now = 0;
  let observation = 0;
  const observations = [
    { requestCount: 1, completedCount: 1 },
    { requestCount: 2, completedCount: 1 },
    { requestCount: 2, completedCount: 2 },
    { requestCount: 2, completedCount: 2 },
    { requestCount: 2, completedCount: 2 },
  ] as const;

  const baseline = await waitForCompletedStableBaseline(
    () => observations[Math.min(observation++, observations.length - 1)],
    {
      confirmationMs: 100,
      pollMs: 50,
      timeoutMs: 500,
      now: () => now,
      sleep: (milliseconds) => {
        now += milliseconds;
        return Promise.resolve();
      },
    },
  );

  assertEquals(baseline, 2);
  assertEquals(observation, 5);
});

Deno.test('browser termination tolerates a naturally exited child and awaits its drain', async () => {
  const child = new Deno.Command(Deno.execPath(), {
    args: [
      'eval',
      `await Deno.stderr.write(new TextEncoder().encode('natural-exit'))`,
    ],
    stdout: 'null',
    stderr: 'piped',
  }).spawn();
  let stderr = '';
  let drainCompleted = false;
  const drain = child.stderr
    .pipeThrough(new TextDecoderStream())
    .pipeTo(
      new WritableStream<string>({
        write(chunk) {
          stderr += chunk;
        },
      }),
    )
    .then(() => {
      drainCompleted = true;
    });

  const naturalStatus = await child.status;
  const terminatedStatus = await terminateBrowserProcess(child, drain);

  assertEquals(naturalStatus, { success: true, code: 0, signal: null });
  assertEquals(terminatedStatus, naturalStatus);
  assertEquals(stderr, 'natural-exit');
  assertEquals(drainCompleted, true);
});

Deno.test('browser termination sends SIGTERM to an active child and awaits its drain', async () => {
  const child = new Deno.Command(Deno.execPath(), {
    args: [
      'eval',
      `console.error('ready'); setInterval(() => {}, 1_000);`,
    ],
    stdout: 'null',
    stderr: 'piped',
  }).spawn();
  const ready = Promise.withResolvers<void>();
  let stderr = '';
  let drainCompleted = false;
  const drain = child.stderr
    .pipeThrough(new TextDecoderStream())
    .pipeTo(
      new WritableStream<string>({
        write(chunk) {
          stderr += chunk;
          if (stderr.includes('ready')) ready.resolve();
        },
      }),
    )
    .then(() => {
      drainCompleted = true;
    });
  let terminationStarted = false;

  try {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_resolve, reject) => {
      timeoutId = setTimeout(() => reject(new Error('active child did not become ready')), 5_000);
    });
    try {
      await Promise.race([ready.promise, timeout]);
    } finally {
      clearTimeout(timeoutId);
    }

    terminationStarted = true;
    const status = await terminateBrowserProcess(child, drain);
    assertEquals(status.success, false);
    assertEquals(status.signal, 'SIGTERM');
    assertStringIncludes(stderr, 'ready');
    assertEquals(drainCompleted, true);
  } finally {
    if (!terminationStarted) await terminateBrowserProcess(child, drain);
  }
});

Deno.test('browser termination propagates unrelated kill and drain errors unchanged', async () => {
  const successfulStatus: Deno.CommandStatus = { success: true, code: 0, signal: null };
  const unrelatedTypeError = new TypeError('permission denied');
  const wrongType = new Error('Child process has already terminated');

  for (const expected of [unrelatedTypeError, wrongType]) {
    const actual = await assertRejects(() =>
      terminateBrowserProcess(
        {
          kill: () => {
            throw expected;
          },
          status: Promise.resolve(successfulStatus),
        },
        Promise.resolve(),
      )
    );
    assertStrictEquals(actual, expected);
  }

  const drainError = new Error('stderr drain failed');
  const drain = new Promise<void>((_resolve, reject) => {
    setTimeout(() => reject(drainError), 0);
  });
  const actual = await assertRejects(() =>
    terminateBrowserProcess(
      {
        kill: () => undefined,
        status: Promise.resolve(successfulStatus),
      },
      drain,
    )
  );
  assertStrictEquals(actual, drainError);
});

Deno.test('browser refetch probe keeps the stable baseline and response-stage resume', async () => {
  const source = await Deno.readTextFile(
    new URL(
      '../../../src/application/gates/scaffold/service-client-browser-probe.ts',
      import.meta.url,
    ),
  );
  assertStringIncludes(source, 'await waitForCompletedStableBaseline(() => ({');
  assertEquals(source.includes('await delay(750)'), false);
  assertStringIncludes(source, "client.send('Fetch.continueResponse'");
  assertEquals(source.includes("client.send('Fetch.continueRequest'"), false);
  const cleanupStart = source.indexOf('  } finally {');
  const helperStart = source.indexOf('/** Terminate the browser child');
  const cleanup = source.slice(cleanupStart, helperStart);
  assertStringIncludes(cleanup, 'await terminateBrowserProcess(child, drain);');
  assertEquals(cleanup.includes("child.kill('SIGTERM')"), false);
});

Deno.test('generated consumer imports usersQueries and paymentsQueries together without aliases', () => {
  const source = serviceClientConsumerSource();
  assertStringIncludes(source, "import { usersContract, usersQueries } from './users.ts';");
  assertStringIncludes(
    source,
    "import { paymentsContract, paymentsQueries } from './payments.ts';",
  );
  assertEquals(source.includes(' as usersQueries'), false);
  assertEquals(source.includes(' as paymentsQueries'), false);
  assertStringIncludes(source, 'usersQueries.list.key(usersInput)');
  assertStringIncludes(source, 'paymentsQueries.list.clientKey(paymentsInput)');
});

Deno.test('service client gates emit the required commands and probe modes', () => {
  const context = createContext();
  assertEquals(commandGate(GATE.SCAFFOLD_SERVICE_CLIENT_ADD).command(context), [
    'deno',
    'run',
    '-A',
    '/repo/packages/cli/bin/netscript.ts',
    'service',
    'add',
    '--name',
    'payments',
    '--with-client',
    '--project-root',
    context.project.projectRoot,
  ]);
  assertEquals(commandGate(GATE.SCAFFOLD_SERVICE_CLIENT_GENERATE).command(context), [
    'deno',
    'run',
    '-A',
    '/repo/packages/cli/bin/netscript.ts',
    'service',
    'generate',
    '--project-root',
    context.project.projectRoot,
  ]);

  const staticProbe = commandGate(GATE.GENERATED_SERVICE_CLIENT_CONTRACT).command(context);
  assertEquals(staticProbe.slice(-4, -1), [
    'static',
    context.project.projectRoot,
    generatedAppName(context),
  ]);
  assertEquals(JSON.parse(staticProbe.at(-1) ?? 'null'), [
    'deno',
    'run',
    '-A',
    '/repo/packages/cli/bin/netscript.ts',
  ]);
  assertEquals(commandGate(GATE.BEHAVIOR_SERVICE_CLIENT_REFETCH).command(context).slice(-4), [
    'browser',
    context.project.projectRoot,
    generatedAppName(context),
    context.project.appHost,
  ]);
});

Deno.test('service and runtime suites preserve executable service-client gate order', () => {
  const serviceIds = resolveSuite(SCAFFOLD.SERVICE).gates.map((gate) => gate.id);
  const runtimeIds = resolveSuite(SCAFFOLD.RUNTIME).gates.map((gate) => gate.id);
  assertEquals(runtimeIds.slice(0, 1), [GATE.PREFLIGHT_DENO]);
  for (const ids of [serviceIds, runtimeIds]) {
    assertEquals(
      ids.indexOf(GATE.SCAFFOLD_SERVICE_CLIENT_ADD) <
        ids.indexOf(GATE.SCAFFOLD_SERVICE_CLIENT_GENERATE),
      true,
    );
    assertEquals(
      ids.indexOf(GATE.DATABASE_CODEGEN) + 1,
      ids.indexOf(GATE.GENERATED_SERVICE_CLIENT_CONTRACT),
    );
  }
  assertEquals(serviceIds.includes(GATE.BEHAVIOR_SERVICE_CLIENT_REFETCH), false);
  assertEquals(
    runtimeIds.indexOf(GATE.BEHAVIOR_SERVICE_HEALTH) <
      runtimeIds.indexOf(GATE.BEHAVIOR_SERVICE_CLIENT_REFETCH),
    true,
  );
});

function commandGate(id: string): CommandGateDefinition {
  const gate = createScaffoldGates({ plugins: [], samples: false }).find((entry) =>
    entry.id === id
  );
  if (!gate || gate.kind !== 'command') throw new Error(`${id} command gate missing`);
  return gate;
}

function createContext(): RunContext {
  const options: RunOptions = {
    repoRoot: '/repo',
    cliEntrypoint: 'packages/cli/bin/netscript.ts',
    smokeRoot: '/repo/.llm/tmp/cli-e2e',
    projectName: 'alpha',
    database: DATABASE.POSTGRES,
    packageSource: PACKAGE_SOURCE.LOCAL,
    plugins: [],
    samples: false,
    cache: true,
    cleanup: true,
    format: REPORT_FORMAT.PRETTY,
    commandTimeoutMs: 30_000,
    httpTimeoutMs: 10_000,
  };
  return {
    request: { suiteId: SCAFFOLD.RUNTIME, options },
    project: createSmokeProject(options),
  };
}
