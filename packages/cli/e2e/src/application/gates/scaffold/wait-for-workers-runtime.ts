const appHost = Deno.args[0];
if (!appHost) throw new Error('AppHost path argument is required');

const resource = 'workers';
const readyMarkers = [
  '[Scheduler] Started with',
  'Starting with Web Worker pool',
] as const;
const maxAttempts = 90;
const pollIntervalMs = 2_000;

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
  if (result.success && readyMarkers.every((marker) => lastLogs.includes(marker))) {
    console.info(`workers runtime ready after ${attempt} log probe(s)`);
    break;
  }
  if (attempt === maxAttempts) {
    throw new Error(
      `workers process became healthy without runtime startup evidence; last logs:\n${
        tail(lastLogs)
      }`,
    );
  }
  await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
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
