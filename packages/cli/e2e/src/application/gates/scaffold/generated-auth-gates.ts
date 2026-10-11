import { join } from '@std/path';
import { GATE, GATE_PHASE } from '../../../domain/cli-surface.ts';
import type { GateDefinition } from '../../../domain/gate-definition.ts';
import type { RunContext } from '../../../domain/run-context.ts';
import { GENERATED_AUTH_CREDENTIAL_CASES } from './generated-auth-checks.ts';

/** Named pre-start verdicts share one fixture, scoped to this runner context. */
export function createGeneratedAuthGates(): readonly GateDefinition[] {
  const tokens = new WeakMap<RunContext, string>();
  const titles = {
    [GATE.BEHAVIOR_AUTH_SESSION_AUTHENTICATED]:
      'Shipped auth entrypoint (in-process): credentialed session/me introspection',
    [GATE.BEHAVIOR_SERVICE_API_UNAUTHENTICATED]:
      'Generated users entrypoint: anonymous harness-added protected REST/RPC procedure',
    [GATE.BEHAVIOR_SERVICE_API_AUTHENTICATED]:
      'Generated users entrypoint: denied/permitted harness-added protected REST/RPC procedure',
    [GATE.BEHAVIOR_AUTH_SIGNOUT_FOREIGN_SESSION]:
      'Shipped auth entrypoint (in-process): foreign signout refused, owned signout accepted',
  };
  return GENERATED_AUTH_CREDENTIAL_CASES.map((id) => ({
    id,
    title: titles[id],
    phase: GATE_PHASE.SCAFFOLD,
    kind: 'command',
    critical: true,
    command: (context) => {
      let token = tokens.get(context);
      if (!token) {
        token = crypto.randomUUID();
        tokens.set(context, token);
      }
      return [
        'deno',
        'run',
        '-A',
        '--unstable-kv',
        new URL('./probe-generated-auth-batch.ts', import.meta.url).href,
        context.project.projectRoot,
        context.project.repoRoot,
        join(context.project.projectRoot, '.netscript/e2e/generated-auth-verdicts.json'),
        token,
        id,
      ];
    },
    cwd: (context) => context.project.repoRoot,
    outputMode: 'capture',
    stdoutIncludes: [id + ' PASS'],
    timeoutMs: 120_000,
  }));
}
