const MAX_ATTEMPTS = 10;
const RETRY_DELAY_MS = 2_000;
const triggersPort = Number(Deno.args[2]);
const WEBHOOK_URL = `http://127.0.0.1:${triggersPort}/api/v1/webhooks/inbound/generic`;

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

/** Resolve ordered resource identities from model and running-system output. */
export function resourceCandidates(
  describeOutput: string,
  psOutput: string,
  displayName: string,
): string[] {
  const described = parseJsonOutput(describeOutput, 'aspire describe');
  const runningSystem = parseJsonOutput(psOutput, 'aspire ps');
  const describedName = findDescribedResourceName(described, displayName);
  const running = collectMatchingResourceNames([described, runningSystem], displayName)
    .filter((name) => name.startsWith(`${displayName}-`));
  const candidates = [describedName, displayName, ...running].filter((name): name is string =>
    typeof name === 'string'
  );
  return [...new Set(candidates)];
}

/** Resolve the first candidate for compatibility with earlier focused tests. */
export function resourceInstanceName(describeOutput: string, displayName: string): string {
  const [candidate] = resourceCandidates(describeOutput, '[]', displayName);
  if (!candidate) {
    throw new Error(`resource ${displayName} was not present in aspire describe output`);
  }
  return candidate;
}

async function resolveResourceCandidates(
  projectRoot: string,
  displayName: string,
): Promise<string[]> {
  const describe = await new Deno.Command('aspire', {
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
  const describeStdout = new TextDecoder().decode(describe.stdout);
  const describeStderr = new TextDecoder().decode(describe.stderr);
  if (!describe.success) {
    throw new Error(
      `aspire describe failed with code ${describe.code}: ${describeStderr || describeStdout}`,
    );
  }
  const ps = await new Deno.Command('aspire', {
    args: ['ps', '--format', 'Json', '--non-interactive', '--nologo'],
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  const psStdout = new TextDecoder().decode(ps.stdout);
  const psStderr = new TextDecoder().decode(ps.stderr);
  if (!ps.success) {
    throw new Error(`aspire ps failed with code ${ps.code}: ${psStderr || psStdout}`);
  }
  return resourceCandidates(describeStdout, psStdout, displayName);
}

async function main(): Promise<void> {
  if (!Number.isInteger(triggersPort)) throw new Error('triggers API port argument is required');
  const [projectRoot, resourceDisplayName = 'workers'] = Deno.args;
  if (!projectRoot) throw new Error('generated project root is required');
  const candidates = await resolveResourceCandidates(projectRoot, resourceDisplayName);
  await generateTraffic();

  let lastStdout = '';
  let lastStderr = '';
  let lastCode = 1;
  let lastCandidate = '<none>';
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    for (const candidate of candidates) {
      const output = await new Deno.Command('deno', {
        args: [
          'task',
          'aspire:otel',
          '--',
          'traces',
          candidate,
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
      lastCandidate = candidate;
      lastStdout = new TextDecoder().decode(output.stdout);
      lastStderr = new TextDecoder().decode(output.stderr);
      lastCode = output.code;
      console.info(
        `aspire:otel candidate=${JSON.stringify(candidate)} exit=${output.code} bytes=${
          output.stdout.length + output.stderr.length
        }`,
      );
      if (output.success) {
        try {
          const traces = parseNonEmptyTraceArray(lastStdout);
          await Deno.stdout.write(output.stdout);
          await Deno.stderr.write(output.stderr);
          console.info(
            `Generated aspire:otel task returned ${traces.length} trace(s) for candidate ${
              JSON.stringify(candidate)
            }.`,
          );
          return;
        } catch {
          // The exporter may still be flushing; try the remaining identities and retry.
        }
      }
    }
    if (attempt < MAX_ATTEMPTS) await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
  }

  if (lastStdout) console.error(lastStdout.trimEnd());
  if (lastStderr) console.error(lastStderr.trimEnd());
  throw new Error(
    `generated aspire:otel task did not return non-empty traces after ${MAX_ATTEMPTS} attempts; ` +
      `candidates=${JSON.stringify(candidates)}; lastCandidate=${JSON.stringify(lastCandidate)}; ` +
      `lastExit=${lastCode}; lastStdout=${JSON.stringify(lastStdout)}; lastStderr=${
        JSON.stringify(lastStderr)
      }`,
  );
}

async function generateTraffic(): Promise<void> {
  for (let request = 1; request <= 5; request++) {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        message: `e2e-aspire-task-${request}`,
        timestamp: new Date().toISOString(),
      }),
    });
    const body = await response.text();
    if (!response.ok) {
      throw new Error(
        `telemetry traffic request ${request} failed with HTTP ${response.status}: ${body}`,
      );
    }
  }
  console.info(`Generated 5 telemetry traffic requests via ${WEBHOOK_URL}.`);
}

function collectMatchingResourceNames(value: unknown, displayName: string): string[] {
  const names: string[] = [];
  visit(value, (record) => {
    const name = typeof record.name === 'string' ? record.name : undefined;
    const display = typeof record.displayName === 'string' ? record.displayName : undefined;
    if (
      name &&
      (name === displayName || name.startsWith(`${displayName}-`) || display === displayName)
    ) {
      names.push(name);
    }
  });
  return names;
}

function findDescribedResourceName(value: unknown, displayName: string): string | undefined {
  let result: string | undefined;
  visit(value, (record) => {
    if (result) return;
    const name = typeof record.name === 'string' ? record.name : undefined;
    const display = typeof record.displayName === 'string' ? record.displayName : undefined;
    if (name && (name === displayName || display === displayName)) result = name;
  });
  return result;
}

function visit(value: unknown, inspect: (record: Record<string, unknown>) => void): void {
  if (Array.isArray(value)) {
    for (const item of value) visit(item, inspect);
    return;
  }
  if (!isRecord(value)) return;
  inspect(value);
  for (const child of Object.values(value)) visit(child, inspect);
}

function parseJsonOutput(output: string, source: string): unknown {
  const trimmed = output.trim();
  const indexes = [trimmed.indexOf('{'), trimmed.indexOf('[')].filter((index) => index >= 0);
  if (indexes.length === 0) throw new Error(`${source} did not emit JSON`);
  return JSON.parse(trimmed.slice(Math.min(...indexes))) as unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

if (import.meta.main) await main();
