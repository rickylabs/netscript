import {
  ASPIRE_RESOURCE,
  type AspireResource,
  GATE,
  GATE_PHASE,
} from '../../../../domain/cli-surface.ts';
import { resolve } from '@std/path';
import { DATABASE, type DatabaseEngine } from '../../../../domain/extension-axes.ts';
import type { GateDefinition } from '../../../../domain/gate-definition.ts';
import type { RunContext } from '../../../../domain/run-context.ts';
import { commandGate } from '../gate-factory.ts';

const DEFAULT_LISTENER_WAIT_TIMEOUT_SECONDS = 300;
const MSSQL_LISTENER_WAIT_TIMEOUT_SECONDS = 600;

/** Describe-derived listener health contract for one backing service resource. */
export interface ListenerReadinessExpectation {
  readonly resource: string;
  readonly healthCheckKey: string;
  readonly timeoutSeconds: number;
}

/** Resolve the named custom health report attached to a runtime backing service. */
export function listenerReadinessExpectation(
  resource: AspireResource,
): ListenerReadinessExpectation | undefined {
  switch (resource) {
    case ASPIRE_RESOURCE.POSTGRES:
    case ASPIRE_RESOURCE.MYSQL:
      return {
        resource,
        healthCheckKey: `${resource}_listener`,
        timeoutSeconds: DEFAULT_LISTENER_WAIT_TIMEOUT_SECONDS,
      };
    case ASPIRE_RESOURCE.MSSQL:
      return {
        resource,
        healthCheckKey: `${resource}_listener`,
        timeoutSeconds: MSSQL_LISTENER_WAIT_TIMEOUT_SECONDS,
      };
    case ASPIRE_RESOURCE.GARNET:
      return {
        resource,
        healthCheckKey: `${resource}_resp`,
        timeoutSeconds: DEFAULT_LISTENER_WAIT_TIMEOUT_SECONDS,
      };
    default:
      return undefined;
  }
}

/** Build the wait command that also verifies the 13.5 `healthReports` contract. */
export function listenerReadinessWaitCommand(
  context: RunContext,
  expectation: ListenerReadinessExpectation,
): readonly string[] {
  return [
    'deno',
    'run',
    '--allow-run=aspire',
    `${context.project.repoRoot}/packages/cli/e2e/src/application/gates/scaffold/runtime/evidence/listener-readiness.ts`,
    context.project.appHost,
    expectation.resource,
    expectation.healthCheckKey,
    String(expectation.timeoutSeconds),
  ];
}

/** Register the Phase-B failure/recovery fixture without executing it in Phase A. */
export function createListenerReadinessGates(
  database: DatabaseEngine = DATABASE.POSTGRES,
): readonly GateDefinition[] {
  const expectations = listenerUnreachableExpectations(database);
  return [
    commandGate(
      GATE.RUNTIME_HEALTH_LISTENER_UNREACHABLE,
      'Backing-service listeners fail unhealthy and recover',
      GATE_PHASE.RUNTIME,
      (context) => [
        'deno',
        'run',
        '--allow-run=aspire',
        '--allow-write',
        `${context.project.repoRoot}/packages/cli/e2e/src/application/gates/scaffold/runtime/listener-unreachable-fixture.ts`,
        context.project.appHost,
        context.project.projectRoot,
        JSON.stringify(expectations),
      ],
      (context) => context.project.projectRoot,
    ),
  ];
}

/** Build the lease-backed S8 receipt gate without registering it in a Phase-A suite. */
export function createTypedDbPhaseBGate(): GateDefinition {
  return commandGate(
    GATE.RUNTIME_TYPED_DB_PHASE_B,
    'Verify typed database commands and bounded unhealthy wait',
    GATE_PHASE.RUNTIME,
    (context) => [
      'deno',
      'run',
      '--allow-env=ASPIRE_CLI_START_TIMEOUT',
      '--allow-read',
      '--allow-write',
      '--allow-run=aspire,deno',
      `${context.project.repoRoot}/packages/cli/e2e/src/application/gates/scaffold/runtime/verify-typed-db-phase-b.ts`,
      context.project.appHost,
      context.project.projectRoot,
      context.project.cliEntrypoint.startsWith('jsr:')
        ? context.project.cliEntrypoint
        : resolve(context.project.repoRoot, context.project.cliEntrypoint),
      context.request.options.database,
    ],
    (context) => context.project.projectRoot,
  );
}

/** Failure/recovery resources for the selected runtime tier. */
export function listenerUnreachableExpectations(
  database: DatabaseEngine,
): readonly ListenerReadinessExpectation[] {
  const databaseExpectation = databaseListenerExpectation(database);
  const garnetExpectation = listenerReadinessExpectation(ASPIRE_RESOURCE.GARNET);
  if (!garnetExpectation) throw new Error('Garnet listener readiness contract is missing.');
  return databaseExpectation ? [databaseExpectation, garnetExpectation] : [garnetExpectation];
}

function databaseListenerExpectation(
  database: DatabaseEngine,
): ListenerReadinessExpectation | undefined {
  switch (database) {
    case DATABASE.POSTGRES:
      return listenerReadinessExpectation(ASPIRE_RESOURCE.POSTGRES);
    case DATABASE.MYSQL:
      return listenerReadinessExpectation(ASPIRE_RESOURCE.MYSQL);
    case DATABASE.MSSQL:
      return listenerReadinessExpectation(ASPIRE_RESOURCE.MSSQL);
    case DATABASE.SQLITE:
      return undefined;
  }
}
