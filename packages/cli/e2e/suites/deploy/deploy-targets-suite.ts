import { join, resolve } from '@std/path';
import { defaultRunOptions } from '../../src/create-default-runner.ts';
import { DEPLOY, DEPLOY_TITLE, GATE, GATE_PHASE } from '../../src/domain/cli-surface.ts';
import { PACKAGE_SOURCE, REPORT_FORMAT } from '../../src/domain/extension-axes.ts';
import type { GateDefinition } from '../../src/domain/gate-definition.ts';
import type { RunOptions } from '../../src/domain/run-context.ts';
import type { SuiteDefinition } from '../../src/domain/suite-definition.ts';
import {
  createPreflightGates,
  createScaffoldGates,
} from '../../src/application/gates/scaffold/scaffold-gates.ts';
import { cli, commandGate } from '../../src/application/gates/scaffold/gate-factory.ts';

/** Build the deploy target acceptance suite. */
export function createDeployTargetsSuite(
  overrides: Partial<RunOptions> = {},
): SuiteDefinition {
  const repoRoot = resolve(overrides.repoRoot ?? '.');
  const baseOptions = defaultRunOptions(overrides);
  const options: RunOptions = {
    ...baseOptions,
    ...overrides,
    repoRoot,
    cliEntrypoint: overrides.cliEntrypoint ??
      join(repoRoot, 'packages', 'cli', 'bin', 'netscript.ts'),
    packageSource: overrides.packageSource ?? PACKAGE_SOURCE.LOCAL,
    samples: false,
    format: overrides.format ?? REPORT_FORMAT.NDJSON,
    logFile: overrides.logFile ??
      join(repoRoot, '.llm', 'tmp', 'cli-e2e', `${baseOptions.projectName}.log`),
  };

  return Object.freeze({
    id: DEPLOY.TARGETS,
    title: DEPLOY_TITLE.TARGETS,
    description:
      'Credential-free deploy target acceptance: scaffold a project, preflight Deno Deploy, and assert Docker/Compose target resolution.',
    defaultOptions: Object.freeze(options),
    gates: Object.freeze([
      createPreflightGates()[0],
      ...createScaffoldGates({ plugins: [], samples: false }).filter((gate) =>
        gate.id === GATE.SCAFFOLD_INIT
      ),
      createDenoDeployPlanGate(),
      createComposeResolutionGate(),
      createDeployCleanupGate(),
    ]),
  });
}

function createDenoDeployPlanGate(): GateDefinition {
  return commandGate(
    GATE.DEPLOY_DENO_DEPLOY_PLAN,
    'Preflight generated project for Deno Deploy',
    GATE_PHASE.BEHAVIOR,
    (context) =>
      cli(
        context,
        'deploy',
        'deno-deploy',
        'plan',
        '--project-root',
        context.project.projectRoot,
        '--app',
        context.project.projectName,
      ),
  );
}

function createComposeResolutionGate(): GateDefinition {
  return commandGate(
    GATE.DEPLOY_COMPOSE_RESOLUTION,
    'Resolve Docker and Compose deploy target routers',
    GATE_PHASE.BEHAVIOR,
    (context) => [
      'deno',
      'eval',
      DEPLOY_TARGET_RESOLUTION_SCRIPT,
      context.project.repoRoot,
      context.project.cliEntrypoint,
    ],
  );
}

function createDeployCleanupGate(): GateDefinition {
  return commandGate(
    GATE.CLEANUP_USERLAND_SMOKE_ROOT,
    'Remove deploy target smoke project',
    GATE_PHASE.CLEANUP,
    (context) => [
      'deno',
      'eval',
      DEPLOY_CLEANUP_SCRIPT,
      context.project.projectRoot,
      context.project.smokeRoot,
    ],
  );
}

const DEPLOY_TARGET_RESOLUTION_SCRIPT = [
  'const [repoRoot, cliEntrypoint] = Deno.args;',
  'if (!repoRoot || !cliEntrypoint) throw new Error("repo root and CLI entrypoint are required");',
  'const normalizedEntrypoint = cliEntrypoint.startsWith("jsr:")',
  '  ? cliEntrypoint',
  '  : new URL(cliEntrypoint, `file://${repoRoot}/`).pathname;',
  'for (const target of ["compose", "docker"]) {',
  '  const command = new Deno.Command("deno", {',
  '    args: ["run", "-A", normalizedEntrypoint, "deploy", target, "--help"],',
  '    cwd: repoRoot,',
  '    stdout: "piped",',
  '    stderr: "piped",',
  '  });',
  '  const output = await command.output();',
  '  const stdout = new TextDecoder().decode(output.stdout);',
  '  const stderr = new TextDecoder().decode(output.stderr);',
  '  if (!output.success) {',
  '    throw new Error(`deploy ${target} --help failed with code ${output.code}: ${stderr || stdout}`);',
  '  }',
  '  const help = `${stdout}\\n${stderr}`;',
  '  for (const verb of ["plan", "up", "down", "status", "logs"]) {',
  '    if (!help.includes(verb)) {',
  '      throw new Error(`deploy ${target} help did not expose ${verb}: ${help}`);',
  '    }',
  '  }',
  '  console.info(`deploy ${target} target resolved with plan/up/down/status/logs verbs`);',
  '}',
].join('\n');

const DEPLOY_CLEANUP_SCRIPT = [
  'const projectRoot = Deno.args[0];',
  'const smokeRoot = Deno.args[1];',
  'if (!projectRoot) throw new Error("project root argument is required");',
  'await Deno.remove(projectRoot, { recursive: true }).catch((error) => {',
  '  if (!(error instanceof Deno.errors.NotFound)) throw error;',
  '});',
  'console.info(`removed deploy smoke project: ${projectRoot}`);',
  'if (smokeRoot) {',
  '  await Deno.remove(smokeRoot).catch(() => undefined);',
  '  console.info(`removed smoke root when empty: ${smokeRoot}`);',
  '}',
].join('\n');
