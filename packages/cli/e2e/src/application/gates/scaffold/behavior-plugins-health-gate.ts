import { GATE, GATE_PHASE } from '../../../domain/cli-surface.ts';
import type { GateDefinition } from '../../../domain/gate-definition.ts';
import { cli, commandGate } from './gate-factory.ts';
import { resolve } from '@std/path';
import { NETSCRIPT_RELEASE_VERSION } from '../../../../../src/kernel/constants/jsr-specifiers.ts';
import {
  PACKAGE_BACKED_DOCTOR_UNPUBLISHED_EXIT_CODE,
  PACKAGE_BACKED_DOCTOR_UNPUBLISHED_MESSAGE,
} from './package-backed-plugin-version.ts';

const PACKAGE_BACKED_DOCTOR_FIXTURE = new URL(
  './package-backed-plugin-doctor-fixture.ts',
  import.meta.url,
);

/** Assert doctor fails honestly before required plugin registries are generated. */
export function createBehaviorPluginUnhealthyGates(): readonly GateDefinition[] {
  return [{
    id: GATE.BEHAVIOR_PLUGINS_UNHEALTHY,
    title: 'Reject missing workers and sagas registries',
    phase: GATE_PHASE.BEHAVIOR,
    kind: 'command',
    critical: true,
    command: (context) =>
      cli(context, 'plugin', 'doctor', '--project-root', context.project.projectRoot),
    cwd: (context) => context.project.repoRoot,
    expectedExitCode: 1,
    stdoutIncludes: [
      '.netscript/generated/plugin-workers/job-registry.ts',
      '.netscript/generated/plugin-sagas/sagas.registry.ts',
      'deno run -A jsr:@netscript/plugin-workers@',
      'deno run -A jsr:@netscript/plugin-sagas@',
    ],
  }];
}

/** Generate workers and sagas registries through their real local plugin CLIs. */
export function createPluginRegistryGenerationGates(): readonly GateDefinition[] {
  return [
    commandGate(
      GATE.GENERATED_WORKERS_REGISTRY,
      'Compile workers registry through plugin CLI',
      GATE_PHASE.DATABASE,
      (context) => [
        'deno',
        'run',
        '-A',
        resolve(context.project.repoRoot, 'plugins/workers/src/cli/composition/main.ts'),
        'compile-registry',
      ],
      (context) => context.project.projectRoot,
    ),
    commandGate(
      GATE.GENERATED_SAGAS_REGISTRY,
      'Generate sagas registry through plugin CLI',
      GATE_PHASE.DATABASE,
      (context) => [
        'deno',
        'run',
        '-A',
        resolve(context.project.repoRoot, 'plugins/sagas/src/cli/mod.ts'),
        'generate-registry',
      ],
      (context) => context.project.projectRoot,
    ),
  ];
}

/** Create a behavior gate that validates installed plugins through host diagnostics. */
export function createBehaviorPluginHealthGates(): readonly GateDefinition[] {
  return [
    commandGate(
      GATE.BEHAVIOR_PLUGINS_HEALTH,
      'Check installed plugin health',
      GATE_PHASE.BEHAVIOR,
      (context) => cli(context, 'plugin', 'doctor', '--project-root', context.project.projectRoot),
    ),
  ];
}

/** Validate published workers/streams manifests without copied plugin workdirs. */
export function createPackageBackedPluginDoctorGates(): readonly GateDefinition[] {
  return [
    {
      id: GATE.BEHAVIOR_PACKAGE_BACKED_PLUGIN_DOCTOR,
      title: 'Validate package-backed plugin doctor truth',
      phase: GATE_PHASE.BEHAVIOR,
      kind: 'command',
      critical: true,
      command: (context) => {
        const publishedVersion = /^jsr:@netscript\/cli@([^/]+)(?:\/.*)?$/.exec(
          context.project.cliEntrypoint,
        )?.[1];
        return [
          'deno',
          'run',
          '-A',
          PACKAGE_BACKED_DOCTOR_FIXTURE.href,
          '--project-root',
          resolve(context.project.smokeRoot, `${context.project.projectName}-package-doctor`),
          '--repo-root',
          context.project.repoRoot,
          '--cli-entrypoint',
          context.project.cliEntrypoint,
          '--package-version',
          publishedVersion ?? NETSCRIPT_RELEASE_VERSION,
        ];
      },
      cwd: (context) => context.project.repoRoot,
      outputMode: 'capture',
      failureHint:
        'Package-backed doctor must consume published manifests without local plugin workdirs.',
      timeoutMs: 120_000,
      skip: {
        exitCode: PACKAGE_BACKED_DOCTOR_UNPUBLISHED_EXIT_CODE,
        message: PACKAGE_BACKED_DOCTOR_UNPUBLISHED_MESSAGE,
      },
    },
  ];
}
