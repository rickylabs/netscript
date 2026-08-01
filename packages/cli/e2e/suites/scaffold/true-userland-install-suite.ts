import { join, resolve } from '@std/path';
import { defaultRunOptions } from '../../src/create-default-runner.ts';
import { GATE, GATE_PHASE, SCAFFOLD, SCAFFOLD_TITLE } from '../../src/domain/cli-surface.ts';
import { PACKAGE_SOURCE, PLUGIN, REPORT_FORMAT } from '../../src/domain/extension-axes.ts';
import type { GateDefinition } from '../../src/domain/gate-definition.ts';
import type { RunOptions } from '../../src/domain/run-context.ts';
import type { SuiteDefinition } from '../../src/domain/suite-definition.ts';
import {
  createPreflightGates,
  createScaffoldGates,
} from '../../src/application/gates/scaffold/scaffold-gates.ts';
import { commandGate } from '../../src/application/gates/scaffold/gate-factory.ts';

const USERLAND_PROJECT_PREFIX = 'netscript-userland-install-';

/** Build the true-userland plugin install suite. */
export function createTrueUserlandInstallSuite(
  overrides: Partial<RunOptions> = {},
): SuiteDefinition {
  const repoRoot = resolve(overrides.repoRoot ?? '.');
  const baseOptions = defaultRunOptions(overrides);
  const smokeRoot = overrides.smokeRoot ?? Deno.makeTempDirSync({
    prefix: USERLAND_PROJECT_PREFIX,
  });
  const options: RunOptions = {
    ...baseOptions,
    ...overrides,
    repoRoot,
    cliEntrypoint: overrides.cliEntrypoint ??
      join(repoRoot, 'packages', 'cli', 'bin', 'netscript.ts'),
    smokeRoot,
    packageSource: PACKAGE_SOURCE.AUTO,
    plugins: [PLUGIN.WORKER, PLUGIN.SAGA, PLUGIN.TRIGGER, PLUGIN.STREAM],
    samples: false,
    format: overrides.format ?? REPORT_FORMAT.NDJSON,
    logFile: overrides.logFile ??
      join(repoRoot, '.llm', 'tmp', 'cli-e2e', `${baseOptions.projectName}.log`),
  };

  return Object.freeze({
    id: SCAFFOLD.USERLAND_INSTALL,
    title: SCAFFOLD_TITLE.USERLAND_INSTALL,
    description:
      'Installs an official plugin into a scratch project outside the repo and asserts no framework source leaked.',
    defaultOptions: Object.freeze(options),
    gates: Object.freeze([
      createPreflightGates()[0],
      ...createScaffoldGates({
        plugins: [PLUGIN.WORKER, PLUGIN.SAGA, PLUGIN.TRIGGER, PLUGIN.STREAM],
        samples: false,
      }).filter((gate) =>
        gate.id === GATE.SCAFFOLD_INIT ||
        gate.id === 'scaffold.plugin.worker' ||
        gate.id === 'scaffold.plugin.saga' ||
        gate.id === 'scaffold.plugin.trigger' ||
        gate.id === 'scaffold.plugin.stream'
      ),
      createTrueUserlandAssertionGate(),
      createTrueUserlandCleanupGate(),
    ]),
  });
}

function createTrueUserlandAssertionGate(): GateDefinition {
  return commandGate(
    GATE.USERLAND_INSTALL_ASSERTIONS,
    'Assert true userland install has artifacts and no source leak',
    GATE_PHASE.BEHAVIOR,
    (context) => [
      'deno',
      'eval',
      TRUE_USERLAND_ASSERTION_SCRIPT,
      context.project.projectRoot,
      context.project.repoRoot,
      context.project.smokeRoot,
    ],
  );
}

function createTrueUserlandCleanupGate(): GateDefinition {
  return commandGate(
    GATE.CLEANUP_USERLAND_SMOKE_ROOT,
    'Remove true userland scratch project',
    GATE_PHASE.CLEANUP,
    (context) => [
      'deno',
      'eval',
      TRUE_USERLAND_CLEANUP_SCRIPT,
      context.project.projectRoot,
      context.project.smokeRoot,
    ],
  );
}

const TRUE_USERLAND_CLEANUP_SCRIPT = [
  'const projectRoot = Deno.args[0];',
  'const smokeRoot = Deno.args[1];',
  'if (!projectRoot) throw new Error("project root argument is required");',
  'await Deno.remove(projectRoot, { recursive: true }).catch((error) => {',
  '  if (!(error instanceof Deno.errors.NotFound)) throw error;',
  '});',
  'console.info(`removed scratch project: ${projectRoot}`);',
  'if (smokeRoot) {',
  '  await Deno.remove(smokeRoot).catch(() => undefined);',
  '  console.info(`removed scratch root when empty: ${smokeRoot}`);',
  '}',
].join('\n');

const TRUE_USERLAND_ASSERTION_SCRIPT = [
  'const [projectRoot, repoRoot, smokeRoot] = Deno.args;',
  'if (!projectRoot || !repoRoot || !smokeRoot) {',
  '  throw new Error("project root, repo root, and smoke root arguments are required");',
  '}',
  'const normalize = (path) => path.replaceAll("\\\\", "/").replace(/\\/+$/, "");',
  'const normalizedProject = normalize(projectRoot);',
  'const normalizedRepo = normalize(repoRoot);',
  'const normalizedSmokeRoot = normalize(smokeRoot);',
  'const failures = [];',
  'if (normalizedProject === normalizedRepo || normalizedProject.startsWith(`${normalizedRepo}/`)) {',
  '  failures.push(`project root is inside repo root: ${projectRoot}`);',
  '}',
  'if (normalizedSmokeRoot === normalizedRepo || normalizedSmokeRoot.startsWith(`${normalizedRepo}/`)) {',
  '  failures.push(`smoke root is inside repo root: ${smokeRoot}`);',
  '}',
  'const requiredPaths = [',
  '  "deno.json",',
  '  "workers/mod.ts",',
  '  "workers/runtime.ts",',
  '  "sagas/mod.ts",',
  '  "sagas/runtime.ts",',
  '  "triggers/mod.ts",',
  '  "triggers/runtime.ts",',
  '  "streams/mod.ts",',
  '];',
  'for (const relativePath of requiredPaths) {',
  '  if (!await exists(`${projectRoot}/${relativePath}`)) {',
  '    failures.push(`missing expected artifact: ${relativePath}`);',
  '  }',
  '}',
  'const forbiddenPaths = [',
  '  "workers/jobs/health-check.ts",',
  '  "sagas/user-registration-saga.ts",',
  '  "triggers/daily-maintenance.ts",',
  '  "triggers/generic-inbound-webhook.ts",',
  '  "triggers/incoming-file-watch.ts",',
  '  "streams/notifications-stream.ts",',
  '  "packages",',
  '  "plugins/workers/src",',
  '  "plugins/workers/scaffold.ts",',
  '  "plugins/workers/worker",',
  '  "plugins/workers/tests",',
  '];',
  'for (const relativePath of forbiddenPaths) {',
  '  if (await exists(`${projectRoot}/${relativePath}`)) {',
  '    failures.push(`forbidden framework/plugin source was copied: ${relativePath}`);',
  '  }',
  '}',
  'const structuralPaths = requiredPaths.filter((path) => path.endsWith(".ts"));',
  'const check = await new Deno.Command("deno", {',
  '  args: ["check", "--unstable-kv", ...structuralPaths],',
  '  cwd: projectRoot,',
  '  stdout: "piped",',
  '  stderr: "piped",',
  '}).output();',
  'if (!check.success) {',
  '  failures.push("structural output failed deno check: " + new TextDecoder().decode(check.stderr));',
  '}',
  'const contentFailures = await findContentLeaks(projectRoot, normalizedRepo);',
  'failures.push(...contentFailures);',
  'if (failures.length > 0) {',
  '  console.error(failures.join("\\n"));',
  '  Deno.exit(1);',
  '}',
  'console.info(`scratch project outside checkout: ${projectRoot}`);',
  'console.info("present artifacts: " + requiredPaths.join(", "));',
  'console.info("type-checked structural outputs: " + structuralPaths.join(", "));',
  'console.info("no copied packages/, plugin src tree, scaffold entrypoint, or monorepo path leaks found");',
  '',
  'async function exists(path) {',
  '  try {',
  '    await Deno.stat(path);',
  '    return true;',
  '  } catch (error) {',
  '    if (error instanceof Deno.errors.NotFound) return false;',
  '    throw error;',
  '  }',
  '}',
  '',
  'async function findContentLeaks(root, normalizedRepoRoot) {',
  '  const leaks = [];',
  '  const forbiddenSnippets = [',
  '    normalizedRepoRoot,',
  '    `file://${normalizedRepoRoot}`,',
  '    "../packages/",',
  '    "../../packages/",',
  '  ];',
  '  for await (const filePath of walkFiles(root)) {',
  '    if (!shouldScan(filePath)) continue;',
  '    const text = await Deno.readTextFile(filePath);',
  '    const normalizedText = text.replaceAll("\\\\", "/");',
  '    for (const snippet of forbiddenSnippets) {',
  '      if (normalizedText.includes(snippet)) {',
  '        leaks.push(`forbidden source/path reference ${JSON.stringify(snippet)} in ${filePath}`);',
  '      }',
  '    }',
  '  }',
  '  return leaks;',
  '}',
  '',
  'async function* walkFiles(root) {',
  '  for await (const entry of Deno.readDir(root)) {',
  '    const path = `${root}/${entry.name}`;',
  '    if (entry.isDirectory) {',
  '      yield* walkFiles(path);',
  '    } else if (entry.isFile) {',
  '      yield path;',
  '    }',
  '  }',
  '}',
  '',
  'function shouldScan(path) {',
  '  return /\\.(json|ts|tsx|mts|js|mjs|prisma)$/.test(path);',
  '}',
].join('\n');
