import { join, relative } from '@std/path';

interface QualityReport {
  readonly ok: boolean;
  readonly selection?: {
    readonly files?: readonly string[];
  };
  readonly batches?: readonly {
    readonly stdout?: string;
    readonly stderr?: string;
  }[];
}

interface CommandResult {
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
}

/** Every scaffold-owned runtime surface that the generated quality task must select. */
export const QUALITY_PROBE_PATHS = [
  'apps/__quality_probe__.ts',
  'apps/__quality_probe__.tsx',
  'services/__quality_probe__.ts',
  'contracts/__quality_probe__.ts',
  'plugins/__quality_probe__.ts',
  'workers/__quality_probe__.ts',
  'sagas/__quality_probe__.ts',
  'triggers/__quality_probe__.ts',
  'streams/__quality_probe__.ts',
  'aspire/.helpers/__quality_probe__.mts',
] as const;

/** A selected scaffold source used to prove the generated lint task rejects explicit `any`. */
export const QUALITY_ANY_PROBE_PATH = 'apps/__quality_any_probe__.ts';

const PROBE_SOURCE = 'const __qualityProbe: string = 1;\nexport { __qualityProbe };\n';
// Assemble the forbidden type token so source scanning does not confuse fixture data with syntax.
const EXPLICIT_ANY_TYPE = String.fromCharCode(97, 110, 121);
export const ANY_PROBE_SOURCE = `export const __qualityAny: ${EXPLICIT_ANY_TYPE} = 1;\n`;

const DESIGN_PRODUCTION_EXCLUSION_MODE = '--design-production-exclusion';
const DESIGN_IGNORE_RULE = "ignore: mode === 'development' ? [] : [DESIGN_ROUTE_GROUP_PATTERN],";
const DESIGN_IGNORE_MUTATION = 'ignore: [], // e2e mutation: plant design routes';
const DESIGN_ROUTE_SOURCE_PATH = 'routes/(design)/';
const DESIGN_ROUTE_MARKER = 'Composition rules — NetScript design system';

class DesignRouteOutputError extends Error {}

async function runQualityTask(
  projectRoot: string,
  task: 'check' | 'lint',
): Promise<CommandResult> {
  const output = await new Deno.Command('deno', {
    args: ['task', task],
    cwd: projectRoot,
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  const decoder = new TextDecoder();
  return {
    code: output.code,
    stdout: decoder.decode(output.stdout),
    stderr: decoder.decode(output.stderr),
  };
}

function parseReport(result: CommandResult, path: string): QualityReport {
  try {
    return JSON.parse(result.stdout) as QualityReport;
  } catch (error) {
    throw new Error(
      `quality probe ${path} did not emit a structured report: ${String(error)}\n` +
        `stdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
    );
  }
}

async function probePath(projectRoot: string, path: string): Promise<void> {
  const absolute = `${projectRoot}/${path}`;
  let previous: string | undefined;
  try {
    previous = await Deno.readTextFile(absolute);
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) throw error;
  }

  await Deno.mkdir(absolute.slice(0, absolute.lastIndexOf('/')), { recursive: true });
  try {
    await Deno.writeTextFile(absolute, PROBE_SOURCE);
    const result = await runQualityTask(projectRoot, 'check');
    const report = parseReport(result, path);
    if (result.code === 0 || report.ok) {
      throw new Error(`quality probe ${path} unexpectedly passed`);
    }
    if (!report.selection?.files?.includes(path)) {
      throw new Error(`quality probe ${path} was not selected by the generated runner`);
    }
  } finally {
    if (previous === undefined) {
      await Deno.remove(absolute).catch((error: unknown) => {
        if (!(error instanceof Deno.errors.NotFound)) throw error;
      });
    } else {
      await Deno.writeTextFile(absolute, previous);
    }
  }
}

async function probeExplicitAny(projectRoot: string): Promise<void> {
  const path = QUALITY_ANY_PROBE_PATH;
  const absolute = `${projectRoot}/${path}`;
  let previous: string | undefined;
  try {
    previous = await Deno.readTextFile(absolute);
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) throw error;
  }

  await Deno.mkdir(absolute.slice(0, absolute.lastIndexOf('/')), { recursive: true });
  try {
    await Deno.writeTextFile(absolute, ANY_PROBE_SOURCE);
    const result = await runQualityTask(projectRoot, 'lint');
    const report = parseReport(result, path);
    if (result.code === 0 || report.ok) {
      throw new Error(`quality lint probe ${path} unexpectedly passed`);
    }
    if (!report.selection?.files?.includes(path)) {
      throw new Error(`quality lint probe ${path} was not selected by the generated runner`);
    }
    const diagnostics = report.batches?.flatMap((batch) => [batch.stdout ?? '', batch.stderr ?? ''])
      .join('\n') ?? '';
    if (!diagnostics.includes('no-explicit-any')) {
      throw new Error(`quality lint probe ${path} did not report no-explicit-any`);
    }
  } finally {
    if (previous === undefined) {
      await Deno.remove(absolute).catch((error: unknown) => {
        if (!(error instanceof Deno.errors.NotFound)) throw error;
      });
    } else {
      await Deno.writeTextFile(absolute, previous);
    }
  }
}

async function removeBuildOutput(appRoot: string): Promise<void> {
  await Deno.remove(join(appRoot, '_fresh'), { recursive: true }).catch((error: unknown) => {
    if (!(error instanceof Deno.errors.NotFound)) throw error;
  });
}

async function runProductionBuild(appRoot: string): Promise<void> {
  const output = await new Deno.Command('deno', {
    args: ['task', 'build'],
    cwd: appRoot,
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  if (output.code === 0) return;

  const decoder = new TextDecoder();
  throw new Error(
    `generated app production build failed (exit ${output.code})\n` +
      `stdout:\n${decoder.decode(output.stdout)}\n` +
      `stderr:\n${decoder.decode(output.stderr)}`,
  );
}

async function* walkFiles(root: string): AsyncGenerator<string> {
  for await (const entry of Deno.readDir(root)) {
    const path = join(root, entry.name);
    if (entry.isDirectory) {
      yield* walkFiles(path);
    } else if (entry.isFile) {
      yield path;
    }
  }
}

async function findDesignRouteEvidence(appRoot: string): Promise<string | undefined> {
  const buildRoot = join(appRoot, '_fresh');
  const decoder = new TextDecoder();
  for await (const path of walkFiles(buildRoot)) {
    const relativePath = relative(buildRoot, path).replaceAll('\\', '/');
    if (relativePath.includes(DESIGN_ROUTE_SOURCE_PATH)) {
      return `path:${relativePath}`;
    }

    const source = decoder.decode(await Deno.readFile(path));
    if (source.includes(DESIGN_ROUTE_SOURCE_PATH)) {
      return `source-path:${relativePath}`;
    }
    if (source.includes(DESIGN_ROUTE_MARKER)) {
      return `route-marker:${relativePath}`;
    }
  }
  return undefined;
}

async function assertDesignRoutesExcluded(appRoot: string): Promise<void> {
  const evidence = await findDesignRouteEvidence(appRoot);
  if (evidence !== undefined) {
    throw new DesignRouteOutputError(
      `production build contains developer design route output (${evidence})`,
    );
  }
}

function plantDesignRoutes(viteConfig: string): string {
  const matches = viteConfig.split(DESIGN_IGNORE_RULE).length - 1;
  if (matches !== 1) {
    throw new Error(`expected exactly one generated design ignore rule, found ${matches}`);
  }
  return viteConfig.replace(DESIGN_IGNORE_RULE, DESIGN_IGNORE_MUTATION);
}

/** Prove clean exclusion, mutation sensitivity, restoration, and a final clean build. */
export async function runDesignProductionExclusionProbe(appRoot: string): Promise<void> {
  const viteConfigPath = join(appRoot, 'vite.config.ts');
  const originalViteConfig = await Deno.readTextFile(viteConfigPath);

  await removeBuildOutput(appRoot);
  await runProductionBuild(appRoot);
  await assertDesignRoutesExcluded(appRoot);

  let mutationError: unknown;
  let mutationRejected = false;
  try {
    await Deno.writeTextFile(viteConfigPath, plantDesignRoutes(originalViteConfig));
    await removeBuildOutput(appRoot);
    await runProductionBuild(appRoot);
    try {
      await assertDesignRoutesExcluded(appRoot);
    } catch (error) {
      if (!(error instanceof DesignRouteOutputError)) throw error;
      mutationRejected = true;
    }
  } catch (error) {
    mutationError = error;
  } finally {
    await Deno.writeTextFile(viteConfigPath, originalViteConfig);
    await removeBuildOutput(appRoot);
    await runProductionBuild(appRoot);
    await assertDesignRoutesExcluded(appRoot);
  }

  if (mutationError !== undefined) throw mutationError;
  if (!mutationRejected) {
    throw new Error('design exclusion detector accepted the planted design route output');
  }

  console.log(JSON.stringify({
    ok: true,
    appRoot,
    cleanProductionBuild: true,
    plantedRouteRejected: true,
    restoredProductionBuild: true,
  }));
}

/** Run the serial negative matrix and prove cleanup with a final green task. */
export async function runQualityProbes(projectRoot: string): Promise<void> {
  for (const path of QUALITY_PROBE_PATHS) await probePath(projectRoot, path);
  await probeExplicitAny(projectRoot);

  const cleanCheck = await runQualityTask(projectRoot, 'check');
  if (cleanCheck.code !== 0) {
    throw new Error(
      `generated check did not recover after quality probes\nstdout:\n${cleanCheck.stdout}\nstderr:\n${cleanCheck.stderr}`,
    );
  }
  const cleanLint = await runQualityTask(projectRoot, 'lint');
  if (cleanLint.code !== 0) {
    throw new Error(
      `generated lint did not recover after quality probes\nstdout:\n${cleanLint.stdout}\nstderr:\n${cleanLint.stderr}`,
    );
  }
  console.log(JSON.stringify({
    ok: true,
    probes: QUALITY_PROBE_PATHS,
    lintProbe: QUALITY_ANY_PROBE_PATH,
    cleanupCheckExitCode: cleanCheck.code,
    cleanupLintExitCode: cleanLint.code,
  }));
}

if (import.meta.main) {
  const root = Deno.args[0];
  if (!root) throw new Error('generated project or app root is required');
  if (Deno.args[1] === DESIGN_PRODUCTION_EXCLUSION_MODE) {
    await runDesignProductionExclusionProbe(root);
  } else {
    await runQualityProbes(root);
  }
}
