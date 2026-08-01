const MAX_ATTEMPTS = 10;
const RETRY_DELAY_MS = 2_000;

/** Extract the first non-empty JSON array from generated task output. */
export function parseNonEmptyTraceArray(output: string): unknown[] {
  for (let index = output.indexOf('['); index >= 0; index = output.indexOf('[', index + 1)) {
    try {
      const parsed = JSON.parse(output.slice(index)) as unknown;
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {
      // A task banner may contain brackets; keep scanning for the JSON payload.
    }
  }
  throw new Error('generated aspire:otel task returned no non-empty JSON trace array');
}

/** Resolve the DCP instance name that `aspire otel traces` accepts. */
export function resourceInstanceName(describeOutput: string, displayName: string): string {
  const trimmed = describeOutput.trim();
  const indexes = [trimmed.indexOf('{'), trimmed.indexOf('[')].filter((index) => index >= 0);
  if (indexes.length === 0) throw new Error('aspire describe did not emit JSON');
  const topology = JSON.parse(trimmed.slice(Math.min(...indexes))) as {
    resources?: Array<{ name?: unknown; displayName?: unknown }>;
  };
  const resource = topology.resources?.find((candidate) =>
    candidate.displayName === displayName || candidate.name === displayName
  );
  if (typeof resource?.name !== 'string') {
    throw new Error(`resource ${displayName} was not present in aspire describe output`);
  }
  return resource.name;
}

async function resolveResource(projectRoot: string, displayName: string): Promise<string> {
  const output = await new Deno.Command('aspire', {
    args: [
      'describe',
      '--apphost',
      `${projectRoot}/aspire/apphost.mts`,
      '--format',
      'Json',
      '--non-interactive',
      '--nologo',
    ],
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  const stdout = new TextDecoder().decode(output.stdout);
  const stderr = new TextDecoder().decode(output.stderr);
  if (!output.success) {
    throw new Error(`aspire describe failed with code ${output.code}: ${stderr || stdout}`);
  }
  return resourceInstanceName(stdout, displayName);
}

async function main(): Promise<void> {
  const [projectRoot, resourceDisplayName = 'workers'] = Deno.args;
  if (!projectRoot) throw new Error('generated project root is required');
  const resource = await resolveResource(projectRoot, resourceDisplayName);

  let lastStdout = '';
  let lastStderr = '';
  let lastCode = 1;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const output = await new Deno.Command('deno', {
      args: [
        'task',
        'aspire:otel',
        '--',
        'traces',
        resource,
        '--non-interactive',
        '--nologo',
        '--limit',
        '20',
        '--format',
        'Json',
      ],
      cwd: projectRoot,
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    lastStdout = new TextDecoder().decode(output.stdout);
    lastStderr = new TextDecoder().decode(output.stderr);
    lastCode = output.code;

    if (output.success) {
      try {
        const traces = parseNonEmptyTraceArray(lastStdout);
        await Deno.stdout.write(output.stdout);
        await Deno.stderr.write(output.stderr);
        console.info(`Generated aspire:otel task returned ${traces.length} trace(s).`);
        return;
      } catch {
        // The exporter may still be flushing; retry against the same detached AppHost.
      }
    }
    if (attempt < MAX_ATTEMPTS) await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
  }

  if (lastStdout) console.error(lastStdout.trimEnd());
  if (lastStderr) console.error(lastStderr.trimEnd());
  throw new Error(
    `generated aspire:otel task did not return non-empty traces after ${MAX_ATTEMPTS} attempts (last exit ${lastCode})`,
  );
}

if (import.meta.main) await main();
