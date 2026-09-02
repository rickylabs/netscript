const resource = 'workers';
const schedulerReadyMarker = '[Scheduler] Started with';
const runnerReadyMarkers = [
  'Starting with Web Worker pool',
  'Starting in-process job runner',
] as const;
const maxAttempts = 90;
const pollIntervalMs = 2_000;

/** Returns whether logs prove scheduler and runner-mode startup. */
export function hasWorkersRuntimeStartupEvidence(logs: string): boolean {
  return logs.includes(schedulerReadyMarker) &&
    runnerReadyMarkers.some((marker) => logs.includes(marker));
}

if (import.meta.main) {
  const appHost = Deno.args[0];
  if (!appHost) throw new Error('AppHost path argument is required');

  await runAspire([
    'wait',
    resource,
    '--apphost',
    appHost,
    '--non-interactive',
    '--nologo',
  ]);

  let lastLogs = '';
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const result = await runAspire([
      'logs',
      resource,
      '--apphost',
      appHost,
      '-n',
      '200',
    ], false);
    lastLogs = result.output;
    if (result.success && hasWorkersRuntimeStartupEvidence(lastLogs)) {
      console.info(`workers runtime ready after ${attempt} log probe(s)`);
      break;
    }
    if (attempt === maxAttempts) {
      const missingRequirements = missingStartupRequirements(lastLogs);
      throw new Error(
        `workers process became healthy without runtime startup evidence (${
          missingRequirements.length > 0
            ? missingRequirements.join('; ')
            : 'Aspire log probe did not succeed'
        }); last logs:\n${tail(lastLogs)}`,
      );
    }
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }
}

function missingStartupRequirements(logs: string): string[] {
  const missing: string[] = [];
  if (!logs.includes(schedulerReadyMarker)) {
    missing.push(`scheduler marker missing: ${schedulerReadyMarker}`);
  }
  if (!runnerReadyMarkers.some((marker) => logs.includes(marker))) {
    missing.push(
      `no runner-mode marker found: ${runnerReadyMarkers.join(' OR ')}`,
    );
  }
  return missing;
}

async function runAspire(
  args: readonly string[],
  requireSuccess = true,
): Promise<Readonly<{ success: boolean; output: string }>> {
  const result = await new Deno.Command('aspire', {
    args: [...args],
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  const decoder = new TextDecoder();
  const stdout = decoder.decode(result.stdout);
  const stderr = decoder.decode(result.stderr);
  const output = `${stdout}\n${stderr}`.trim();
  if (requireSuccess && !result.success) {
    throw new Error(`aspire ${args.join(' ')} failed: ${tail(output)}`);
  }
  return { success: result.success, output };
}

function tail(value: string): string {
  return value.length > 4_000 ? value.slice(-4_000) : value;
}
