import {
  ASPIRE_RESOURCE,
  type AspireResource,
  GATE,
  GATE_PHASE,
  KV_BACKGROUND_RUNTIME_WAIT_RESOURCES,
} from '../../../domain/cli-surface.ts';
import { DATABASE, type DatabaseEngine, PACKAGE_SOURCE } from '../../../domain/extension-axes.ts';
import type { GateDefinition } from '../../../domain/gate-definition.ts';
import { resolve } from '@std/path';
import { commandGate } from './gate-factory.ts';
import { generatedAppName } from './runtime/generated-app-name.ts';
import {
  ASPIRE_TYPED_DB_COMMAND_OR_RESTART_SCRIPT,
  AUTH_SMOKE_ENV_SCRIPT,
} from './runtime/runtime-scripts.ts';
import { listenerReadinessExpectation } from './runtime/listener-readiness-gates.ts';

/** A feed stall gets three short chances instead of consuming two suite-wide 15-minute budgets. */
export const ASPIRE_RESTORE_ATTEMPT_TIMEOUT_MS = 180_000;
export const ASPIRE_RESTORE_MAX_RETRIES = 2;

function runtimeWaitGate(resource: AspireResource): GateDefinition {
  const listenerExpectation = listenerReadinessExpectation(resource);
  return commandGate(
    `runtime.wait.${resource}`,
    listenerExpectation ? `Assert ${resource} listener health` : `Assert ${resource} convergence`,
    GATE_PHASE.RUNTIME,
    (context) => [
      'deno',
      'run',
      '--allow-read',
      `${context.project.repoRoot}/packages/cli/e2e/src/application/gates/scaffold/runtime/evidence/describe-follow.ts`,
      'assert',
      `${context.project.projectRoot}/.netscript/e2e/aspire-describe.ndjson`,
      resource,
      ...(listenerExpectation ? [listenerExpectation.healthCheckKey] : []),
    ],
  );
}

function runtimeAppWaitGate(): GateDefinition {
  return commandGate(
    GATE.RUNTIME_WAIT_APP,
    'Wait for the project-derived Fresh app',
    GATE_PHASE.RUNTIME,
    (context) => [
      'deno',
      'run',
      '--allow-read',
      `${context.project.repoRoot}/packages/cli/e2e/src/application/gates/scaffold/runtime/evidence/describe-follow.ts`,
      'assert',
      `${context.project.projectRoot}/.netscript/e2e/aspire-describe.ndjson`,
      generatedAppName(context),
    ],
  );
}

/** Create runtime and health-check gates for the generated application. */
export function createRuntimeGates(
  database: DatabaseEngine = DATABASE.POSTGRES,
): readonly GateDefinition[] {
  return [
    commandGate(
      GATE.RUNTIME_ASPIRE_RESTORE,
      'Restore Aspire TypeScript SDK',
      GATE_PHASE.RUNTIME,
      (context) => [
        'aspire',
        'restore',
        '--apphost',
        context.project.appHost,
        '--non-interactive',
        '--nologo',
      ],
      undefined,
      undefined,
      undefined,
      {
        classes: ['timeout', 'canceled', 'infrastructure'],
        maxRetries: ASPIRE_RESTORE_MAX_RETRIES,
      },
      ASPIRE_RESTORE_ATTEMPT_TIMEOUT_MS,
      'infrastructure',
    ),
    commandGate(
      GATE.RUNTIME_AUTH_SMOKE_ENV,
      'Wire auth smoke environment',
      GATE_PHASE.RUNTIME,
      (context) => [
        'deno',
        'eval',
        AUTH_SMOKE_ENV_SCRIPT,
        context.project.projectRoot,
        context.project.repoRoot,
      ],
    ),
    commandGate(
      GATE.RUNTIME_FLOW_B_FIXTURE,
      'Wire real Flow-B callback fixture',
      GATE_PHASE.RUNTIME,
      (context) => [
        'deno',
        'run',
        '--allow-read',
        '--allow-write',
        '--allow-run=deno',
        '--allow-env',
        'packages/cli/e2e/src/application/gates/scaffold/prepare-flow-b-fixture.ts',
        context.project.projectRoot,
        context.request.options.packageSource === PACKAGE_SOURCE.JSR ? 'published' : 'local',
        context.project.cliEntrypoint.startsWith('jsr:')
          ? context.project.cliEntrypoint
          : resolve(context.project.repoRoot, context.project.cliEntrypoint),
      ],
    ),
    commandGate(
      GATE.RUNTIME_READINESS_FIXTURE,
      'Wire dead-port readiness fixture',
      GATE_PHASE.RUNTIME,
      (context) => [
        'deno',
        'run',
        '--allow-read',
        '--allow-write',
        'packages/cli/e2e/src/application/gates/scaffold/runtime/prepare-readiness-fixture.ts',
        context.project.projectRoot,
        database,
      ],
    ),
    commandGate(
      GATE.RUNTIME_ASPIRE_START,
      'Start generated Aspire AppHost',
      GATE_PHASE.RUNTIME,
      (context) => [
        'deno',
        'run',
        '--allow-env',
        '--allow-read',
        '--allow-write',
        '--allow-run=git,deno',
        `${context.project.repoRoot}/.llm/tools/gates/run-gate.ts`,
        '--gate',
        'cli-e2e-aspire-start',
        '--id',
        `${context.request.suiteId}:runtime.aspire-start`,
        '--output',
        `${context.project.repoRoot}/.llm/tmp/gate-receipts/${context.request.suiteId}/runtime.aspire-start.receipt.json`,
        '--cwd',
        context.project.repoRoot,
        '--child-report',
        `${context.project.projectRoot}/.netscript/e2e/aspire-start.json`,
        '--',
        'capture',
        context.project.appHost,
        context.project.projectRoot,
        JSON.stringify([...runtimeResources(database), generatedAppName(context)]),
      ],
    ),
    commandGate(
      GATE.RUNTIME_CAPTURE_DB_ALLOCATION_FIRST,
      'Capture first live database allocation',
      GATE_PHASE.RUNTIME,
      (context) => [
        'deno',
        'run',
        '--allow-read',
        '--allow-write',
        '--allow-run=aspire',
        `${context.project.repoRoot}/packages/cli/e2e/src/application/gates/scaffold/runtime/capture-db-endpoint-allocation.ts`,
        context.project.appHost,
        context.project.projectRoot,
        'first',
      ],
    ),
    commandGate(
      GATE.RUNTIME_ASPIRE_RESTART_AFTER_DB,
      'Exercise typed database command and refresh background runtimes',
      GATE_PHASE.RUNTIME,
      (context) => [
        'deno',
        'eval',
        ASPIRE_TYPED_DB_COMMAND_OR_RESTART_SCRIPT,
        context.project.appHost,
        context.project.projectRoot,
        database,
      ],
    ),
    commandGate(
      GATE.RUNTIME_CAPTURE_DB_ALLOCATION_SECOND,
      'Capture second live database allocation',
      GATE_PHASE.RUNTIME,
      (context) => [
        'deno',
        'run',
        '--allow-read',
        '--allow-write',
        '--allow-run=aspire',
        `${context.project.repoRoot}/packages/cli/e2e/src/application/gates/scaffold/runtime/capture-db-endpoint-allocation.ts`,
        context.project.appHost,
        context.project.projectRoot,
        'second',
      ],
    ),
    ...runtimeResources(database).map(runtimeWaitGate),
    runtimeAppWaitGate(),
    commandGate(
      GATE.RUNTIME_ASPIRE_DESCRIBE,
      'Describe generated topology',
      GATE_PHASE.RUNTIME,
      (context) => [
        'deno',
        'run',
        '--allow-read',
        `${context.project.repoRoot}/packages/cli/e2e/src/application/gates/scaffold/runtime/evidence/describe-follow.ts`,
        'assert',
        `${context.project.projectRoot}/.netscript/e2e/aspire-describe.ndjson`,
        generatedAppName(context),
      ],
    ),
  ];
}

/** List the Aspire resources that a runtime suite waits for. */
export function runtimeResources(database: DatabaseEngine): readonly AspireResource[] {
  return [
    ...databaseRuntimeResources(database),
    ASPIRE_RESOURCE.GARNET,
    ...KV_BACKGROUND_RUNTIME_WAIT_RESOURCES,
    ASPIRE_RESOURCE.AUTH,
    ASPIRE_RESOURCE.STREAMS,
  ];
}

function databaseRuntimeResources(
  database: DatabaseEngine,
): readonly AspireResource[] {
  switch (database) {
    case DATABASE.POSTGRES:
      return [ASPIRE_RESOURCE.POSTGRES];
    case DATABASE.MYSQL:
      return [ASPIRE_RESOURCE.MYSQL];
    case DATABASE.MSSQL:
      return [ASPIRE_RESOURCE.MSSQL];
    case DATABASE.SQLITE:
      return [];
  }
}

/** Create cleanup gates that stop generated runtime resources. */
export function createCleanupGates(): readonly GateDefinition[] {
  return [
    commandGate(
      GATE.CLEANUP_ASPIRE_STOP,
      'Stop generated Aspire AppHost',
      GATE_PHASE.CLEANUP,
      (context) => [
        'deno',
        'run',
        '--allow-env',
        '--allow-read',
        '--allow-write',
        '--allow-run=git,deno',
        `${context.project.repoRoot}/.llm/tools/gates/run-gate.ts`,
        '--gate',
        'cli-e2e-aspire-cleanup',
        '--id',
        `${context.request.suiteId}:cleanup.aspire-stop`,
        '--output',
        `${context.project.repoRoot}/.llm/tmp/gate-receipts/${context.request.suiteId}/cleanup.aspire-stop.receipt.json`,
        '--cwd',
        context.project.repoRoot,
        '--child-report',
        `${context.project.repoRoot}/.llm/tmp/gate-receipts/${context.request.suiteId}/cleanup.aspire-stop.json`,
        '--',
        context.project.appHost,
        String(context.request.options.cleanup),
        `${context.project.repoRoot}/.llm/tmp/gate-receipts/${context.request.suiteId}/cleanup.aspire-stop.json`,
      ],
    ),
  ];
}

/** Exercise typed database and background-child resource commands after runtime behavior gates. */
export function createResourceCommandGate(): GateDefinition {
  const gate = commandGate(
    GATE.RUNTIME_RESOURCE_COMMAND,
    'Exercise Aspire resource commands',
    GATE_PHASE.RUNTIME,
    (context) => [
      'deno',
      'run',
      '--allow-read',
      '--allow-write',
      '--allow-run=aspire',
      `${context.project.repoRoot}/packages/cli/e2e/src/application/gates/scaffold/runtime/evidence/resource-command.ts`,
      context.project.appHost,
      context.project.projectRoot,
      context.request.options.database,
      `${context.project.repoRoot}/.llm/tmp/gate-receipts/${context.request.suiteId}/runtime.resource-command.json`,
    ],
  );
  if (gate.kind !== 'command') throw new Error('resource-command must be a command gate');
  return { ...gate, skip: { exitCode: 75, message: 'runtime.aspire-start receipt absent' } };
}
