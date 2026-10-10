import { ASPIRE_RESOURCE, GATE, GATE_PHASE } from '../../../../domain/cli-surface.ts';
import type { GateDefinition } from '../../../../domain/gate-definition.ts';
import { commandGate } from '../gate-factory.ts';
import { POSTGRES_AUTH_HEALTH_KEY } from './credential-fault-fixture.ts';
import {
  type ListenerReadinessExpectation,
  listenerReadinessExpectation,
  listenerReadinessWaitCommand,
} from './listener-readiness-gates.ts';

/**
 * The PostgreSQL credential check that must report Healthy once the real login succeeds.
 * MySQL and SQL Server credential readiness is deferred (#1726 follow-up), so only the
 * PostgreSQL tier carries these gates.
 */
export function postgresCredentialReadinessExpectation(): ListenerReadinessExpectation {
  const listener = listenerReadinessExpectation(ASPIRE_RESOURCE.POSTGRES);
  if (!listener) throw new Error('postgres has no listener readiness expectation');
  return { ...listener, healthCheckKey: POSTGRES_AUTH_HEALTH_KEY };
}

/** Register the #1726 accepted- and rejected-credential runtime gates. */
export function createCredentialReadinessGates(): readonly GateDefinition[] {
  return [
    commandGate(
      GATE.RUNTIME_HEALTH_CREDENTIAL_ACCEPTED,
      'PostgreSQL accepts the real credential (postgres_auth Healthy)',
      GATE_PHASE.RUNTIME,
      (context) => listenerReadinessWaitCommand(context, postgresCredentialReadinessExpectation()),
      (context) => context.project.projectRoot,
    ),
    commandGate(
      GATE.RUNTIME_HEALTH_CREDENTIAL_REJECTED,
      'A wrong PostgreSQL password is auth-classified Unhealthy without leaking it',
      GATE_PHASE.RUNTIME,
      (context) => [
        'deno',
        'run',
        '--allow-read',
        '--allow-write',
        '--allow-run=aspire',
        `${context.project.repoRoot}/packages/cli/e2e/src/application/gates/scaffold/runtime/verify-credential-rejection.ts`,
        context.project.appHost,
        context.project.projectRoot,
      ],
      (context) => context.project.projectRoot,
    ),
  ];
}
