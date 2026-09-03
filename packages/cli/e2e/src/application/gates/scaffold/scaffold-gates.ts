import { GATE, GATE_PHASE } from '../../../domain/cli-surface.ts';
import { PACKAGE_SOURCE } from '../../../domain/extension-axes.ts';
import type { GateDefinition } from '../../../domain/gate-definition.ts';
import type { RunContext } from '../../../domain/run-context.ts';
import type { PluginSuiteState } from '../../builders/scaffold/plugin-suite-state.ts';
import { generatedAppName } from './runtime/generated-app-name.ts';
import { cli, commandGate } from './gate-factory.ts';
import { createPluginInstallGates } from './plugin-install-gates.ts';
import { createResourceSliceGates } from './resource-slice-gates.ts';

const DISABLE_CACHE_ARGUMENT = '--cache=false';

/** Create preflight gates for required CLI tooling. */
export function createPreflightGates(): readonly GateDefinition[] {
  return [
    commandGate(
      GATE.PREFLIGHT_DENO,
      'Deno CLI is available',
      GATE_PHASE.PREFLIGHT,
      () => ['deno', '--version'],
    ),
    commandGate(
      GATE.PREFLIGHT_ASPIRE,
      'Aspire CLI doctor is healthy',
      GATE_PHASE.PREFLIGHT,
      (context) => [
        'deno',
        'run',
        '--allow-env',
        '--allow-read',
        '--allow-write',
        '--allow-run=git,deno',
        `${context.project.repoRoot}/.llm/tools/gates/run-gate.ts`,
        '--gate',
        'cli-e2e-aspire-doctor',
        '--id',
        `${context.request.suiteId}:preflight.aspire`,
        '--output',
        `${context.project.repoRoot}/.llm/tmp/gate-receipts/${context.request.suiteId}/preflight.aspire.receipt.json`,
        '--cwd',
        context.project.repoRoot,
        '--child-report',
        `${context.project.repoRoot}/.llm/tmp/gate-receipts/${context.request.suiteId}/preflight.aspire.json`,
        '--',
        `${context.project.repoRoot}/.llm/tmp/gate-receipts/${context.request.suiteId}/preflight.aspire.json`,
      ],
    ),
  ];
}

function scaffoldInitCommand(context: RunContext): readonly string[] {
  if (
    context.request.options.packageSource === PACKAGE_SOURCE.JSR &&
    !isJsrCompatibleCliEntrypoint(context.project.cliEntrypoint)
  ) {
    throw new Error(
      '--source jsr requires --cli jsr:@netscript/cli@<version> or --cli packages/cli/bin/netscript.ts.',
    );
  }

  const cacheArgs = context.request.options.cache ? [] : [DISABLE_CACHE_ARGUMENT];

  return cli(
    context,
    'init',
    context.project.projectName,
    '--path',
    context.project.smokeRoot,
    '--db',
    context.request.options.database,
    ...cacheArgs,
    '--service',
    '--service-name',
    'users',
    '--ci',
    '--yes',
    '--no-git',
    '--force',
  );
}

function isJsrCompatibleCliEntrypoint(cliEntrypoint: string): boolean {
  const normalized = cliEntrypoint.replaceAll('\\', '/');
  return normalized.startsWith('jsr:@netscript/cli@') ||
    normalized.endsWith('packages/cli/bin/netscript.ts');
}

/** Create scaffold-phase gates for the generated project and plugins. */
export function createScaffoldGates(state: PluginSuiteState): readonly GateDefinition[] {
  return [
    commandGate(
      GATE.SCAFFOLD_INIT,
      'Scaffold generated project',
      GATE_PHASE.SCAFFOLD,
      scaffoldInitCommand,
    ),
    commandGate(
      GATE.SCAFFOLD_SERVICE_CLIENT_ADD,
      'Add a second service with typed client helpers',
      GATE_PHASE.SCAFFOLD,
      (context) =>
        cli(
          context,
          'service',
          'add',
          '--name',
          'payments',
          '--with-client',
          '--project-root',
          context.project.projectRoot,
        ),
    ),
    commandGate(
      GATE.SCAFFOLD_SERVICE_CLIENT_GENERATE,
      'Reconcile service client and Aspire output',
      GATE_PHASE.SCAFFOLD,
      (context) =>
        cli(context, 'service', 'generate', '--project-root', context.project.projectRoot),
    ),
    commandGate(
      GATE.GENERATED_SERVICE_CLIENT_CONTRACT,
      'Prove idempotent two-service client and cache-key output',
      GATE_PHASE.SCAFFOLD,
      (context) => [
        'deno',
        'run',
        '-A',
        `${context.project.repoRoot}/packages/cli/e2e/src/application/gates/scaffold/service-client-runtime-probe.ts`,
        'static',
        context.project.projectRoot,
        generatedAppName(context),
        JSON.stringify(cli(context)),
      ],
    ),
    ...createResourceSliceGates(),
    commandGate(
      GATE.SCAFFOLD_AGENT_INIT,
      'Install generated Claude agent integration',
      GATE_PHASE.SCAFFOLD,
      (context) => cli(context, 'agent', 'init', '--host', 'claude'),
      (context) => context.project.projectRoot,
    ),
    commandGate(
      GATE.SERVICE_LIST,
      'List generated services',
      GATE_PHASE.SCAFFOLD,
      (context) => cli(context, 'service', 'list', '--project-root', context.project.projectRoot),
    ),
    commandGate(
      GATE.CONTRACT_ADD,
      'Add a generated contract',
      GATE_PHASE.SCAFFOLD,
      (context) =>
        cli(
          context,
          'contract',
          'add',
          'catalog-items',
          '--path',
          context.project.projectRoot,
        ),
    ),
    commandGate(
      GATE.CONTRACT_LIST,
      'List generated contracts',
      GATE_PHASE.SCAFFOLD,
      (context) => cli(context, 'contract', 'list', '--path', context.project.projectRoot),
    ),
    ...createPluginInstallGates(state),
    commandGate(
      GATE.SCAFFOLD_PLUGIN_LIST,
      'List configured plugins',
      GATE_PHASE.SCAFFOLD,
      (context) => cli(context, 'plugin', 'list', '--project-root', context.project.projectRoot),
    ),
  ];
}
