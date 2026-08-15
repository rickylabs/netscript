import { assertEquals, assertStringIncludes, assertThrows } from '@std/assert';

import { createSmokeProject } from '../../../src/application/builders/workspace/smoke-project-factory.ts';
import { generatedAppName } from '../../../src/application/gates/scaffold/generated-app-name.ts';
import { createScaffoldGates } from '../../../src/application/gates/scaffold/scaffold-gates.ts';
import {
  assertByteIdentical,
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

const INPUT = { limit: 3, page: 1, sortBy: 'id', sortOrder: 'asc' } as const;

function keyEvidence(): ServiceKeyEvidence {
  return {
    usersServerKey: ['users', 'list', JSON.stringify(INPUT)],
    paymentsServerKey: ['payments', 'list', JSON.stringify(INPUT)],
    usersServerFilter: ['users', 'list'],
    paymentsServerFilter: ['payments', 'list'],
    usersClientKey: ['users', 'list', { input: INPUT }],
    paymentsClientKey: ['payments', 'list', { input: INPUT }],
    usersClientFilter: ['users', 'list'],
    paymentsClientFilter: ['payments', 'list'],
  };
}

Deno.test('service client probe accepts only index-zero resource isolation and own prefixes', () => {
  assertServiceKeyIsolation(keyEvidence());

  assertThrows(
    () =>
      assertServiceKeyIsolation({
        ...keyEvidence(),
        paymentsClientKey: ['payments', 'find', { input: INPUT }],
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
    'did not prefix-match its own factory key',
  );
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

Deno.test('generated consumer imports usersQueries and paymentsQueries together without aliases', () => {
  const source = serviceClientConsumerSource();
  assertStringIncludes(source, "import { usersQueries } from './users.ts';");
  assertStringIncludes(source, "import { paymentsQueries } from './payments.ts';");
  assertEquals(source.includes(' as usersQueries'), false);
  assertEquals(source.includes(' as paymentsQueries'), false);
  assertStringIncludes(source, 'usersQueries.list.key(input)');
  assertStringIncludes(source, 'paymentsQueries.list.clientKey(input)');
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
  const staticIds = [
    GATE.SCAFFOLD_INIT,
    GATE.SCAFFOLD_SERVICE_CLIENT_ADD,
    GATE.SCAFFOLD_SERVICE_CLIENT_GENERATE,
    GATE.GENERATED_SERVICE_CLIENT_CONTRACT,
  ];
  const serviceIds = resolveSuite(SCAFFOLD.SERVICE).gates.map((gate) => gate.id);
  const runtimeIds = resolveSuite(SCAFFOLD.RUNTIME).gates.map((gate) => gate.id);
  assertEquals(serviceIds.slice(1, 1 + staticIds.length), staticIds);
  assertEquals(runtimeIds.slice(0, 1), [GATE.PREFLIGHT_DENO]);
  assertEquals(runtimeIds.slice(2, 2 + staticIds.length), staticIds);
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
