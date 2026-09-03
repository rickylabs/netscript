/** Direct child-process preflight/startup ceiling; no orchestrated resource exists in this probe. */
export const DEV_STARTUP_BUDGET_MS = 180_000;

/** Direct Fresh-child HTTP ceiling after Vite reports its address; no resource state is sampled. */
export const FRESH_HTTP_READINESS_BUDGET_MS = 60_000;

/** Direct Fresh-child HTTP retry interval; it never observes an orchestrated resource. */
const HTTP_POLL_INTERVAL_MS = 250;
const VITE_READY_MARKER = 'Local:';
const ANSI_ESCAPE_PATTERN = new RegExp(
  `${String.fromCodePoint(0x1b)}\\[[0-9;]*[A-Za-z]`,
  'g',
);

export interface FreshDevServerWaitOptions {
  readonly startupSignal: Promise<void>;
  readonly childStatus: Promise<Deno.CommandStatus>;
  readonly fetchRoot: () => Promise<Response>;
  readonly now: () => number;
  readonly sleep: (milliseconds: number) => Promise<void>;
  readonly startupBudgetMs?: number;
  readonly httpReadinessBudgetMs?: number;
}

/** Waits for startup/preflight and HTTP readiness under independent budgets. */
export async function waitForFreshDevServer(
  options: FreshDevServerWaitOptions,
): Promise<Response> {
  const startupBudgetMs = options.startupBudgetMs ?? DEV_STARTUP_BUDGET_MS;
  const startupDeadline = options.now() + startupBudgetMs;
  let startupComplete = false;
  while (options.now() < startupDeadline) {
    const remainingMs = startupDeadline - options.now();
    const startupOutcome = await Promise.race([
      options.startupSignal.then(() => ({ kind: 'started' }) as const),
      options.childStatus.then((status) => ({ kind: 'exited', status }) as const),
      options.sleep(Math.min(HTTP_POLL_INTERVAL_MS, remainingMs)).then(() =>
        ({ kind: 'retry' }) as const
      ),
    ]);
    if (startupOutcome.kind === 'started') {
      startupComplete = true;
      break;
    }
    if (startupOutcome.kind === 'exited') {
      throw new Error(
        `Generated dev process exited during startup/preflight; status=${startupOutcome.status.code}`,
      );
    }
  }
  if (!startupComplete) {
    throw new Error(
      `Generated dev startup/preflight timed out after ${startupBudgetMs}ms; status=running`,
    );
  }

  const httpReadinessBudgetMs = options.httpReadinessBudgetMs ??
    FRESH_HTTP_READINESS_BUDGET_MS;
  const deadline = options.now() + httpReadinessBudgetMs;
  let lastError = 'server did not answer';

  while (options.now() < deadline) {
    const attempt = await Promise.race([
      options.fetchRoot().then(
        (response) => ({ kind: 'response', response }) as const,
        (error) => ({ kind: 'fetch-error', error }) as const,
      ),
      options.childStatus.then((status) => ({ kind: 'exited', status }) as const),
    ]);

    if (attempt.kind === 'exited') {
      throw new Error(
        `Fresh dev server exited after startup under hostile parent tsconfig; status=${attempt.status.code}`,
      );
    }
    if (attempt.kind === 'response') {
      if (attempt.response.ok) return attempt.response;
      lastError = `HTTP ${attempt.response.status}`;
    } else {
      lastError = attempt.error instanceof Error ? attempt.error.message : String(attempt.error);
    }

    const remainingMs = deadline - options.now();
    if (remainingMs <= 0) break;
    const retryOutcome = await Promise.race([
      options.childStatus.then((status) => ({ kind: 'exited', status }) as const),
      options.sleep(Math.min(HTTP_POLL_INTERVAL_MS, remainingMs)).then(() =>
        ({ kind: 'retry' }) as const
      ),
    ]);
    if (retryOutcome.kind === 'exited') {
      throw new Error(
        `Fresh dev server exited after startup under hostile parent tsconfig; status=${retryOutcome.status.code}`,
      );
    }
  }

  throw new Error(
    `Fresh dev server failed under hostile parent tsconfig after startup: ${lastError}; status=running`,
  );
}

async function runProbe(projectRoot: string, appName: string): Promise<void> {
  const port = 5199;
  const appRoot = `${projectRoot}/apps/${appName}`;
  const child = new Deno.Command(Deno.execPath(), {
    args: [
      'task',
      '--cwd',
      appRoot,
      'dev',
      '--host',
      '127.0.0.1',
      '--port',
      String(port),
      '--strictPort',
    ],
    cwd: projectRoot,
    env: { NO_COLOR: '1' },
    stdin: 'null',
    stdout: 'piped',
    stderr: 'piped',
  }).spawn();
  let childExited = false;
  const childStatus = child.status.then((status) => {
    childExited = true;
    return status;
  });
  const startup = Promise.withResolvers<void>();
  const outputPumps = [
    mirrorOutput(child.stdout, Deno.stdout.writable, startup.resolve),
    mirrorOutput(child.stderr, Deno.stderr.writable, startup.resolve),
  ];

  try {
    const response = await waitForFreshDevServer({
      startupSignal: startup.promise,
      childStatus,
      fetchRoot: () => fetch(`http://127.0.0.1:${port}/`),
      now: Date.now,
      sleep: (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)),
    });
    console.info(`Fresh dev server answered ${response.status} with hostile parent tsconfig`);
  } finally {
    await stopChild(child, childExited);
    await Promise.all(outputPumps);
  }
}

async function mirrorOutput(
  stream: ReadableStream<Uint8Array>,
  target: WritableStream<Uint8Array>,
  signalStartup: () => void,
): Promise<void> {
  const reader = stream.getReader();
  const writer = target.getWriter();
  const decoder = new TextDecoder();
  let scanTail = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      await writer.write(value);
      const scanText = stripAnsi(decoder.decode(value, { stream: true }));
      scanTail = `${scanTail}${scanText}`.slice(-4_096);
      if (scanTail.includes(VITE_READY_MARKER)) signalStartup();
    }
  } finally {
    reader.releaseLock();
    writer.releaseLock();
  }
}

function stripAnsi(value: string): string {
  return value.replace(ANSI_ESCAPE_PATTERN, '');
}

async function stopChild(child: Deno.ChildProcess, childExited: boolean): Promise<void> {
  if (!childExited) {
    try {
      child.kill('SIGTERM');
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) throw error;
    }
  }
  await child.status.catch(() => undefined);
}

if (import.meta.main) {
  const [projectRoot, appName] = Deno.args;
  if (!projectRoot || !appName) {
    throw new Error('generated project root and app name are required');
  }
  await runProbe(projectRoot, appName);
}
