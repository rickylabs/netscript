import { join, resolve } from '@std/path';
import { GATE, GATE_PHASE } from '../../../domain/cli-surface.ts';
import type { GateDefinition } from '../../../domain/gate-definition.ts';
import { commandGate } from './gate-factory.ts';
import { generatedAppName } from './runtime/generated-app-name.ts';

/** Create full generated-workspace quality gates after codegen and registry generation. */
export function createGeneratedQualityGates(): readonly GateDefinition[] {
  return [
    commandGate(
      GATE.SCAFFOLD_DESIGN_PRODUCTION_EXCLUSION,
      'Prove production builds exclude the developer design routes',
      GATE_PHASE.SCAFFOLD,
      (context) => [
        'deno',
        'run',
        '--allow-read',
        '--allow-write',
        '--allow-run=deno',
        resolve(
          context.project.repoRoot,
          'packages/cli/e2e/src/application/gates/scaffold/generated-quality-probes.ts',
        ),
        join(context.project.projectRoot, 'apps', generatedAppName(context)),
        '--design-production-exclusion',
      ],
      (context) => context.project.repoRoot,
    ),
    commandGate(
      GATE.GENERATED_QUALITY_NEGATIVE,
      'Prove every generated quality surface with deliberate failures',
      GATE_PHASE.DATABASE,
      (context) => [
        'deno',
        'run',
        '--allow-read',
        '--allow-write',
        '--allow-run=deno',
        resolve(
          context.project.repoRoot,
          'packages/cli/e2e/src/application/gates/scaffold/generated-quality-probes.ts',
        ),
        context.project.projectRoot,
      ],
      (context) => context.project.repoRoot,
    ),
    commandGate(
      GATE.GENERATED_DENO_CHECK,
      'Run the generated workspace type-check task',
      GATE_PHASE.DATABASE,
      () => ['deno', 'task', 'check'],
      (context) => context.project.projectRoot,
    ),
    commandGate(
      GATE.GENERATED_DENO_LINT,
      'Run the generated workspace lint task',
      GATE_PHASE.DATABASE,
      () => ['deno', 'task', 'lint'],
      (context) => context.project.projectRoot,
    ),
    commandGate(
      GATE.GENERATED_DENO_FMT_CHECK,
      'Run the generated workspace format-check task',
      GATE_PHASE.DATABASE,
      () => ['deno', 'task', 'fmt:check'],
      (context) => context.project.projectRoot,
    ),
  ];
}
