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
  const projectRoot = Deno.args[0];
  if (!projectRoot) throw new Error('generated project root is required');
  await runQualityProbes(projectRoot);
}
