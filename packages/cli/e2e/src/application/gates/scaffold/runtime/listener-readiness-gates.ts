import {
  ASPIRE_RESOURCE,
  type AspireResource,
  GATE,
  GATE_PHASE,
} from '../../../../domain/cli-surface.ts';
import { resolve } from '@std/path';
import type { GateDefinition } from '../../../../domain/gate-definition.ts';
import type { RunContext } from '../../../../domain/run-context.ts';
import { DATABASE, type DatabaseEngine } from '../../../../domain/extension-axes.ts';
import { commandGate } from '../gate-factory.ts';
import {
  TEST_ONLY_GARNET_HEALTH_KEY,
  TEST_ONLY_POSTGRES_HEALTH_KEY,
} from './listener-fault-controller.ts';

const DEFAULT_LISTENER_WAIT_TIMEOUT_SECONDS = 300;
const GARNET_LISTENER_WAIT_TIMEOUT_SECONDS = 30;
const MSSQL_LISTENER_WAIT_TIMEOUT_SECONDS = 600;

/** Describe-derived listener health contract for one backing service resource. */
export interface ListenerReadinessExpectation {
  readonly resource: string;
  readonly healthCheckKey: string;
  readonly timeoutSeconds: number;
}

/** Closed D-101 ownership contract for one synthetic listener and its real backing check. */
export interface ListenerFaultExpectation extends ListenerReadinessExpectation {
  readonly realHealthCheckKey: string;
  readonly controllerListener: 'postgres' | 'garnet';
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
        timeoutSeconds: GARNET_LISTENER_WAIT_TIMEOUT_SECONDS,
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
    `${context.project.repoRoot}/packages/cli/e2e/src/application/gates/scaffold/runtime/verify-listener-readiness.ts`,
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
  return [
    commandGate(
      GATE.RUNTIME_HEALTH_LISTENER_UNREACHABLE,
      'Backing-service listeners fail unhealthy and recover',
      GATE_PHASE.RUNTIME,
      (context) => [
        'deno',
        'run',
        '--allow-read',
        '--allow-write',
        '--allow-run=aspire',
        `${context.project.repoRoot}/packages/cli/e2e/src/application/gates/scaffold/runtime/listener-unreachable-fixture.ts`,
        context.project.appHost,
        context.project.projectRoot,
        database,
      ],
      (context) => context.project.projectRoot,
    ),
  ];
}

/** Return the only two health checks the fault fixture is allowed to manipulate. */
export function listenerFaultExpectations(
  database: DatabaseEngine,
): readonly ListenerFaultExpectation[] {
  const garnet: ListenerFaultExpectation = {
    resource: ASPIRE_RESOURCE.GARNET,
    healthCheckKey: TEST_ONLY_GARNET_HEALTH_KEY,
    realHealthCheckKey: 'garnet_resp',
    controllerListener: 'garnet',
    timeoutSeconds: DEFAULT_LISTENER_WAIT_TIMEOUT_SECONDS,
  };
  switch (database) {
    case DATABASE.POSTGRES:
      return [{
        resource: ASPIRE_RESOURCE.POSTGRES,
        healthCheckKey: TEST_ONLY_POSTGRES_HEALTH_KEY,
        realHealthCheckKey: 'postgres_listener',
        controllerListener: 'postgres',
        timeoutSeconds: DEFAULT_LISTENER_WAIT_TIMEOUT_SECONDS,
      }, garnet];
    case DATABASE.MYSQL:
    case DATABASE.MSSQL:
    case DATABASE.SQLITE:
      return [garnet];
  }
}

/** Parse the closed database axis used by D-101 subprocess arguments. */
export function parseListenerFaultDatabase(value: string): DatabaseEngine {
  switch (value) {
    case DATABASE.POSTGRES:
    case DATABASE.MYSQL:
    case DATABASE.MSSQL:
    case DATABASE.SQLITE:
      return value;
    default:
      throw new Error(`unsupported listener-fault database: ${value}`);
  }
}

/** Build the lease-backed S8 receipt gate for the PostgreSQL runtime suite. */
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
