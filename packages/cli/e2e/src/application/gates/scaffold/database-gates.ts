import { GATE, GATE_PHASE } from '../../../domain/cli-surface.ts';
import type { GateDefinition } from '../../../domain/gate-definition.ts';
import { cli, commandGate } from './gate-factory.ts';

/** Create database workflow gates for a generated project. */
export function createDatabaseGates(): readonly GateDefinition[] {
  return [
    commandGate(
      GATE.DATABASE_INIT,
      'Initialize generated database',
      GATE_PHASE.DATABASE,
      (context) =>
        cli(
          context,
          'db',
          'init',
          '--project-root',
          context.project.projectRoot,
          '--db',
          context.request.options.database,
          '--name',
          'init',
        ),
    ),
    commandGate(
      GATE.DATABASE_GENERATE,
      'Generate database clients',
      GATE_PHASE.DATABASE,
      (context) =>
        cli(
          context,
          'db',
          'generate',
          '--project-root',
          context.project.projectRoot,
          '--db',
          context.request.options.database,
        ),
    ),
    commandGate(
      GATE.DATABASE_SEED,
      'Seed generated database',
      GATE_PHASE.DATABASE,
      (context) =>
        cli(
          context,
          'db',
          'seed',
          '--project-root',
          context.project.projectRoot,
          '--db',
          context.request.options.database,
        ),
    ),
  ];
}

/** Create type-check gates for generated project slices. */
export function createGeneratedCheckGates(): readonly GateDefinition[] {
  return [
    commandGate(
      GATE.GENERATED_SERVICE_CHECK,
      'Type-check generated service workspace',
      GATE_PHASE.DATABASE,
      () => ['deno', 'check', '--unstable-kv', './packages', './services'],
      (context) => context.project.projectRoot,
    ),
    commandGate(
      GATE.GENERATED_CONTRACTS_CHECK,
      'Type-check generated contracts',
      GATE_PHASE.DATABASE,
      () => ['deno', 'check', '--unstable-kv', './contracts'],
      (context) => context.project.projectRoot,
    ),
    commandGate(
      GATE.GENERATED_INFRASTRUCTURE_CHECK,
      'Type-check generated infrastructure workspace',
      GATE_PHASE.DATABASE,
      () => [
        'deno',
        'check',
        '--unstable-kv',
        './packages',
        './services',
        './contracts',
        './database',
      ],
      (context) => context.project.projectRoot,
    ),
    commandGate(
      GATE.GENERATED_DENO_CHECK,
      'Type-check generated workspaces',
      GATE_PHASE.DATABASE,
      () => [
        'deno',
        'check',
        '--unstable-kv',
        './packages',
        './plugins',
        './workers',
        './sagas',
        './triggers',
        './services',
        './database',
      ],
      (context) => context.project.projectRoot,
    ),
  ];
}
