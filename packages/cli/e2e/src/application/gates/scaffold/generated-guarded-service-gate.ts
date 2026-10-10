import { GATE, GATE_PHASE } from '../../../domain/cli-surface.ts';
import type { GateDefinition } from '../../../domain/gate-definition.ts';

/** Prove the public service-add command guards the generated API with native sessions. */
export function createGeneratedGuardedServiceGate(): GateDefinition {
  return {
    id: GATE.BEHAVIOR_GENERATED_GUARDED_SERVICE,
    title: 'Authorize CLI-generated service REST and RPC through native sessions',
    phase: GATE_PHASE.BEHAVIOR,
    kind: 'command',
    critical: true,
    command: (context) => [
      'deno',
      'run',
      '-A',
      new URL('./probe-generated-guarded-service.ts', import.meta.url).href,
      context.project.projectRoot,
      context.project.repoRoot,
    ],
    cwd: (context) => context.project.repoRoot,
    outputMode: 'capture',
    timeoutMs: 120_000,
    failureHint:
      'Generated service REST/RPC and OpenAPI must return 401/403/200; health stays anonymous.',
  };
}
