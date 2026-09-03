import { resolve } from '@std/path';
import { commandGate } from '../../src/application/gates/scaffold/gate-factory.ts';
import { createCleanupGates } from '../../src/application/gates/scaffold/runtime-gates.ts';
import { PROBE_SERVICE_HEALTH_SCRIPT } from '../../src/application/gates/scaffold/runtime/behavior-scripts.ts';
import { GATE, GATE_PHASE, QUICKSTART, QUICKSTART_TITLE } from '../../src/domain/cli-surface.ts';
import { PACKAGE_SOURCE } from '../../src/domain/extension-axes.ts';
import type { GateDefinition } from '../../src/domain/gate-definition.ts';
import type { RunContext, RunOptions } from '../../src/domain/run-context.ts';
import type { SuiteDefinition } from '../../src/domain/suite-definition.ts';
import { defaultRunOptions } from '../../src/application/builders/workspace/suite-builder-options.ts';
import {
  PGDATA_SETUP_NOT_CREATED_EXIT_CODE,
  PGDATA_SETUP_NOT_CREATED_MESSAGE,
} from '../../src/application/gates/quickstart/database-integrity-walk.ts';

const ASPIRE_STEP_TIMEOUT_MS = 180_000;
const ASPIRE_RESTORE_MAX_RETRIES = 2;

/** Ordered executable commands mirrored by the Quickstart page. */
export const QUICKSTART_DOCUMENTED_COMMANDS = [
  'deno install --global --allow-all --name netscript --minimum-dependency-age=0 jsr:@netscript/cli@<version>',
  'netscript init my-app --db postgres --yes',
  'cd my-app',
  'netscript service add --name users --with-client',
  'cd aspire',
  'aspire restore',
  'aspire start',
  'cd ..',
  'netscript db init --db postgres --name init',
  'netscript db generate --db postgres',
  'netscript db seed --db postgres',
  'deno task check',
] as const;

/** Build the published-CLI walk described by `docs/site/quickstart.vto`. */
export function createQuickstartWalkSuite(
  overrides: Partial<RunOptions> = {},
): SuiteDefinition {
  const options = {
    ...defaultRunOptions({ packageSource: PACKAGE_SOURCE.JSR }),
    ...overrides,
    packageSource: overrides.packageSource ?? PACKAGE_SOURCE.JSR,
  };
  return Object.freeze({
    id: QUICKSTART.WALK,
    title: QUICKSTART_TITLE.WALK,
    description: 'Walk the documented Quickstart against an exact published JSR CLI.',
    defaultOptions: Object.freeze(options),
    gates: Object.freeze([
      ...createQuickstartGates(),
      ...createCleanupGates(),
      createPgDataIntegrityGate(),
    ]),
  });
}

function requirePublishedCli(context: RunContext): string {
  const specifier = context.project.cliEntrypoint;
  if (
    context.request.options.packageSource !== PACKAGE_SOURCE.JSR ||
    !specifier.startsWith('jsr:@netscript/cli@')
  ) {
    throw new Error(
      'quickstart.walk requires --source jsr and --cli jsr:@netscript/cli@<version>.',
    );
  }
  return specifier;
}

function cli(context: RunContext, ...args: string[]): readonly string[] {
  return [
    'deno',
    'run',
    '-A',
    '--minimum-dependency-age=0',
    requirePublishedCli(context),
    ...args,
  ];
}

function sequenceScript(commands: readonly (readonly string[])[]): string {
  return `const commands = ${JSON.stringify(commands)};
for (const command of commands) {
  const [executable, ...args] = command;
  const child = new Deno.Command(executable, { args, stdout: 'inherit', stderr: 'inherit' }).spawn();
  const status = await child.status;
  if (!status.success) Deno.exit(status.code);
}`;
}

function createQuickstartGates(): readonly GateDefinition[] {
  return [
    commandGate(
      GATE.QUICKSTART_INSTALL,
      'Quickstart step 1/7 — install the published CLI',
      GATE_PHASE.PREFLIGHT,
      (context) => [
        'deno',
        'install',
        '--global',
        '--allow-all',
        '--minimum-dependency-age=0',
        '--no-lock',
        '--root',
        resolve(context.project.smokeRoot, '.quickstart-cli'),
        '--name',
        'netscript',
        requirePublishedCli(context),
      ],
    ),
    commandGate(
      GATE.QUICKSTART_INIT,
      'Quickstart step 2/7 — scaffold the workspace',
      GATE_PHASE.SCAFFOLD,
      (context) =>
        cli(
          context,
          'init',
          context.project.projectName,
          '--path',
          context.project.smokeRoot,
          '--db',
          'postgres',
          '--ci',
          '--yes',
          '--no-git',
          '--force',
        ),
    ),
    commandGate(
      GATE.QUICKSTART_SERVICE_ADD,
      'Quickstart step 3/7 — add and type-check a service after init',
      GATE_PHASE.SCAFFOLD,
      (context) => [
        'deno',
        'eval',
        sequenceScript([
          [
            ...cli(
              context,
              'service',
              'add',
              '--name',
              'users',
              '--with-client',
              '--project-root',
              '.',
            ),
          ],
          ['deno', 'check', '--unstable-kv', 'services/users'],
        ]),
      ],
      (context) => context.project.projectRoot,
    ),
    commandGate(
      GATE.QUICKSTART_ASPIRE,
      'Quickstart step 4/7 — restore and start Aspire (bounded; #1227)',
      GATE_PHASE.RUNTIME,
      (context) => [
        'deno',
        'run',
        '--allow-run=aspire',
        resolve(
          context.project.repoRoot,
          'packages/cli/e2e/src/application/gates/quickstart/aspire-walk.ts',
        ),
        context.project.appHost,
        context.project.projectRoot,
        String(ASPIRE_STEP_TIMEOUT_MS),
      ],
      (context) => context.project.projectRoot,
      undefined,
      undefined,
      {
        classes: ['timeout', 'canceled'],
        maxRetries: ASPIRE_RESTORE_MAX_RETRIES,
      },
    ),
    commandGate(
      GATE.QUICKSTART_DATABASE,
      'Quickstart step 5/7 — initialize, generate, and seed the database',
      GATE_PHASE.DATABASE,
      (context) => [
        'deno',
        'run',
        '--allow-run=deno,docker',
        '--allow-read',
        '--allow-write',
        resolve(
          context.project.repoRoot,
          'packages/cli/e2e/src/application/gates/quickstart/database-integrity-walk.ts',
        ),
        'run',
        context.project.projectRoot,
        requirePublishedCli(context),
      ],
      (context) => context.project.projectRoot,
    ),
    commandGate(
      GATE.QUICKSTART_CHECK,
      'Quickstart step 6/7 — run the documented project check',
      GATE_PHASE.BEHAVIOR,
      () => ['deno', 'task', 'check'],
      (context) => context.project.projectRoot,
    ),
    commandGate(
      GATE.QUICKSTART_SERVICE_RESPONSE,
      'Quickstart step 7/7 — receive an example service response',
      GATE_PHASE.BEHAVIOR,
      (context) => [
        'deno',
        'eval',
        PROBE_SERVICE_HEALTH_SCRIPT,
        context.project.appHost,
        'users',
      ],
    ),
  ];
}

function createPgDataIntegrityGate(): GateDefinition {
  return {
    id: GATE.QUICKSTART_DATABASE_INTEGRITY,
    title: 'Validate resident Postgres PGDATA after Aspire teardown',
    phase: GATE_PHASE.CLEANUP,
    kind: 'command',
    critical: true,
    command: (context) => [
      'deno',
      'run',
      '--allow-run=docker',
      '--allow-read',
      '--allow-write',
      resolve(
        context.project.repoRoot,
        'packages/cli/e2e/src/application/gates/quickstart/database-integrity-walk.ts',
      ),
      'verify',
      context.project.projectRoot,
    ],
    cwd: (context) => context.project.projectRoot,
    skip: {
      exitCode: PGDATA_SETUP_NOT_CREATED_EXIT_CODE,
      message: PGDATA_SETUP_NOT_CREATED_MESSAGE,
    },
  };
}
