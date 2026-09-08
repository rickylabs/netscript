import { GATE, GATE_PHASE } from '../../../domain/cli-surface.ts';
import type { GateDefinition } from '../../../domain/gate-definition.ts';

/** Prove a CLI-authored plugin through native sessions and the generated service. */
export function createGeneratedGuardedPluginGate(): GateDefinition {
  return {
    id: GATE.BEHAVIOR_GENERATED_GUARDED_PLUGIN,
    title: 'Authorize CLI-generated plugin reads through REST and native SDK',
    phase: GATE_PHASE.BEHAVIOR,
    kind: 'command',
    critical: true,
    command: (context) => [
      'deno',
      'run',
      '-A',
      new URL('./probe-generated-guarded-plugin.ts', import.meta.url).href,
      context.project.projectRoot,
      context.project.repoRoot,
    ],
    cwd: (context) => context.project.repoRoot,
    outputMode: 'capture',
    timeoutMs: 120_000,
    failureHint:
      'Generated read-only sessions must succeed through REST and RPC; 401/403/503 remain distinct.',
    skip: {
      exitCode: 78,
      message:
        'Native guarded-plugin authoring proof requires local-source packages; published-consumer acceptance is not asserted.',
    },
  };
}
