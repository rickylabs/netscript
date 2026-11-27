/** Execute the documented scaffold order without the main suite's repair fixtures. @module */
import { join, resolve } from '@std/path';
import { buildStreamUrl } from '@netscript/plugin-streams-core';
import { z } from 'zod';
import {
  assertDocumentedSeedExecution,
  DOCUMENTED_SCAFFOLD_DOC,
  DOCUMENTED_SCAFFOLD_VARIANTS,
  documentedScaffoldCommands,
  type DocumentedScaffoldVariant,
  seedExecutionUrl,
  SeedHandoffAcceptanceError,
  StreamLinkAcceptanceError,
  waitForDocumentedActivity,
} from './documented-scaffold-contract.ts';
import { resolveResourceUrlsFromAppHost } from './generated-app-endpoint.ts';
import { probeAppHome } from './probe-app-home.ts';
import { probePluginResource } from './runtime/probe-plugin-resource.ts';
import { verifyGeneratedCrudAcceptance } from './verify-live-db-endpoint.ts';

const COMMAND_CEILING_MS = 330_000;
const DEFAULT_ASPIRE_START_TIMEOUT_SECONDS = 300;
const DIAG = {
  describeStderr: 150,
  ps: 80,
  seed: 200,
  stream: 200,
  startCmd: 120,
  seedCmd: 120,
  detachLog: 2_400,
  leewayMs: 10_000,
  psTimeoutMs: 15_000,
} as const;
const seedRequest = z.object({ version: z.literal(1), seedId: z.string().uuid() });
type Outcome = { readonly passed: true; readonly id: string } | {
  readonly passed: false;
  readonly error: unknown;
};
interface CommandOutput {
  readonly stdout: string;
  readonly stderr: string;
}
interface WorkerPidContext {
  readonly phase: string;
  readonly seed?: Outcome;
  readonly stream?: Outcome;
  readonly aspireStart?: CommandOutput;
  readonly dbSeed?: CommandOutput;
  readonly variantStartedAtMs?: number;
}

const aspireScope = (appHost: string): readonly string[] => [
  '--apphost',
  appHost,
  '--non-interactive',
  '--nologo',
];

async function runCommandOutput(
  executable: string,
  args: readonly string[],
  cwd: string,
): Promise<CommandOutput> {
  const startingAspire = executable === 'aspire' && args[0] === 'start';
  const startTimeout = Deno.env.get('ASPIRE_CLI_START_TIMEOUT') ??
    String(DEFAULT_ASPIRE_START_TIMEOUT_SECONDS);
  const ceiling = startingAspire
    ? Math.max(COMMAND_CEILING_MS, (Number(startTimeout) + 30) * 1_000)
    : COMMAND_CEILING_MS;
  const result = await new Deno.Command(executable, {
    args: [...args],
    cwd,
    stdin: 'null',
    stdout: 'piped',
    stderr: 'piped',
    signal: AbortSignal.timeout(ceiling),
    ...(startingAspire ? { env: { ASPIRE_CLI_START_TIMEOUT: startTimeout } } : {}),
  }).output();
  const stdout = new TextDecoder().decode(result.stdout);
  const stderr = new TextDecoder().decode(result.stderr);
  if (!result.success) {
    throw new Error(
      `${executable} ${args.join(' ')} exited ${result.code}: ${stderr.slice(-6000)}\n${
        stdout.slice(-6000)
      }`,
    );
  }
  return { stdout, stderr };
}

async function command(executable: string, args: readonly string[], cwd: string): Promise<string> {
  return (await runCommandOutput(executable, args, cwd)).stdout;
}

async function responseJson(url: string | URL): Promise<unknown> {
  const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!response.ok) {
    throw new Error(`${url}: HTTP ${response.status}: ${(await response.text()).slice(0, 1000)}`);
  }
  return await response.json();
}

async function outcome(probe: () => Promise<string>): Promise<Outcome> {
  try {
    return { passed: true, id: await probe() };
  } catch (error) {
    return { passed: false, error };
  }
}

async function seedExecution(appHost: string, projectRoot: string): Promise<string> {
  const { seedId } = seedRequest.parse(
    JSON.parse(await Deno.readTextFile(join(projectRoot, '.netscript/sample-seed.json'))),
  );
  try {
    // Bounded application-effect observation only; no trigger or restart repairs the setup.
    await probePluginResource(appHost, 'workers-api', 'workers-executions');
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('health-check execution has not completed yet')
    ) {
      throw new SeedHandoffAcceptanceError(error.message);
    }
    throw error;
  }
  const [url] = await resolveResourceUrlsFromAppHost(appHost, 'workers-api');
  return assertDocumentedSeedExecution(await responseJson(seedExecutionUrl(url, seedId)));
}

async function activity(appHost: string, projectRoot: string): Promise<string> {
  const [usersUrl] = await resolveResourceUrlsFromAppHost(appHost, 'users');
  const mutation = await verifyGeneratedCrudAcceptance(usersUrl);
  await probeAppHome(projectRoot, 'dashboard', appHost);
  const [appUrl] = await resolveResourceUrlsFromAppHost(appHost, 'dashboard');
  const [streamsUrl] = await resolveResourceUrlsFromAppHost(appHost, 'streams');
  const streamUrl = new URL(buildStreamUrl('/scaffold/users/records', streamsUrl));
  streamUrl.searchParams.set('offset', '-1');
  return await waitForDocumentedActivity({
    readHtml: async () => {
      const response = await fetch(appUrl, {
        signal: AbortSignal.timeout(10_000),
        headers: { accept: 'text/html' },
      });
      const html = await response.text();
      if (!response.ok || !html.includes('<html')) {
        throw new Error('The documented app failed to render');
      }
      return html;
    },
    readEvents: () => responseJson(streamUrl),
  }, mutation.representativeId);
}

function redactAspireTokens(text: string): string {
  return text
    .replace(/([?&](?:t|token|auth|key|secret|code)=)[^&\s"'`\\]+/gi, '$1<REDACTED>')
    .replace(
      /("(?:token|password|secret|authorization|connectionString)"\s*:\s*)"[^"]*"/gi,
      '$1"<REDACTED>"',
    )
    .replace(
      /\b(postgres(?:ql)?|mysql|redis|amqp|https?):\/\/([^:@\s/"']+):([^@\s/"']+)@/gi,
      '$1://$2:<REDACTED>@',
    )
    .replace(/(Password=)[^;\s"']+/gi, '$1<REDACTED>')
    .replace(/\b(Bearer\s+)\S+/gi, '$1<REDACTED>');
}

function summarizeOutcome(label: string, result: Outcome | undefined, maxChars: number): string {
  if (!result) return `${label}=not-run`;
  if (result.passed) return `${label}=passed(${result.id})`;
  const detail = result.error instanceof Error
    ? `${result.error.name}: ${result.error.message}`
    : String(result.error);
  return `${label}=failed(${redactAspireTokens(detail).slice(0, maxChars)})`;
}

function summarizeCommand(
  label: string,
  output: CommandOutput | undefined,
  maxChars: number,
): string {
  if (!output) return `${label}=<none>`;
  const combined = redactAspireTokens(`${output.stdout.trim()}\n${output.stderr.trim()}`)
    .replace(/\s+/g, ' ').trim();
  return combined ? `${label}=${JSON.stringify(combined.slice(-maxChars))}` : `${label}=<empty>`;
}

async function captureAspirePsSummary(cwd: string): Promise<string> {
  try {
    const result = await new Deno.Command('aspire', {
      args: ['ps', '--format', 'Json', '--non-interactive', '--nologo'],
      cwd,
      stdin: 'null',
      stdout: 'piped',
      stderr: 'piped',
      signal: AbortSignal.timeout(DIAG.psTimeoutMs),
    }).output();
    const stdout = redactAspireTokens(new TextDecoder().decode(result.stdout).trim());
    const stderr = redactAspireTokens(new TextDecoder().decode(result.stderr).trim());
    if (!result.success) {
      return `exited ${result.code}: ${(stderr || stdout || '(empty)').slice(-DIAG.ps)}`;
    }
    if (!stdout) return stderr ? `(empty stdout; stderr=${stderr.slice(-DIAG.ps)})` : '(empty)';
    return stdout.slice(0, DIAG.ps);
  } catch (error) {
    return `unavailable(${error instanceof Error ? error.message : String(error)})`;
  }
}

async function captureDetachLogTail(
  aspireStart?: CommandOutput,
  startedAtMs?: number,
): Promise<string> {
  const startText = `${aspireStart?.stdout ?? ''}\n${aspireStart?.stderr ?? ''}`;
  const explicit = [
    startText.match(/[^\s"'`]+_detach-child_[^\s"'`]+\.log/i)?.[0],
    startText.match(/[^\s"'`]+\.log/i)?.[0],
  ].filter((value): value is string => Boolean(value));
  const minMtimeMs = (startedAtMs ?? 0) - DIAG.leewayMs;
  const home = Deno.env.get('HOME');
  const logDirs = home ? [join(home, '.aspire/logs'), join(home, '.local/logs')] : [];
  const scanned: { path: string; mtimeMs: number; detach: boolean }[] = [];
  for (const dir of logDirs) {
    try {
      for await (const entry of Deno.readDir(dir)) {
        if (!entry.isFile || !entry.name.endsWith('.log')) continue;
        const path = join(dir, entry.name);
        const stat = await Deno.stat(path).catch(() => null);
        scanned.push({
          path,
          mtimeMs: stat?.mtime?.getTime() ?? 0,
          detach: entry.name.includes('_detach-child_'),
        });
      }
    } catch { /* Missing or unreadable log directory */ }
  }
  scanned.sort((a, b) => b.mtimeMs - a.mtimeMs);
  const detachFiles = scanned.filter((e) => e.detach && e.mtimeMs >= minMtimeMs).map((e) => e.path);
  for (const path of [...new Set([...explicit, ...detachFiles])]) {
    try {
      const redacted = redactAspireTokens(await Deno.readTextFile(path)).trim();
      if (!redacted) continue;
      const compact = redacted
        .replace(
          /\[\d{4}-\d{2}-\d{2} (\d{2}:\d{2}:\d{2}\.\d{3})\] \[DBUG\] \[PrebuiltAppHostServer\] PrebuiltAppHostServer\(\d+\) /g,
          '[$1 Host] ',
        )
        .replace(/\[\d{4}-\d{2}-\d{2} (\d{2}:\d{2}:\d{2}\.\d{3})\] /g, '[$1] ');
      const prefix = `${path.split('/').at(-1) ?? path} => `;
      const shutdownIdx = compact.lastIndexOf('Application is shutting down');
      const budget = Math.max(0, DIAG.detachLog - prefix.length);
      const logSlice = shutdownIdx > 0
        ? compact.slice(Math.max(0, shutdownIdx - Math.max(0, budget - 80)), shutdownIdx + 80)
        : compact.slice(-budget);
      return `${prefix}${logSlice}`;
    } catch { /* Try next log candidate */ }
  }
  const recent = scanned.slice(0, 5).map((entry) => entry.path);
  return recent.length > 0 ? `none; recentLogs=${JSON.stringify(recent)}` : '<none>';
}

async function workerPid(appHost: string, cwd: string, context: WorkerPidContext): Promise<number> {
  const { stdout, stderr } = await runCommandOutput('aspire', [
    'describe',
    '--format',
    'Json',
    ...aspireScope(appHost),
  ], cwd);
  let parsed: unknown;
  try {
    if (stdout.trim().length === 0) {
      throw new SyntaxError('Unexpected empty stdout from aspire describe');
    }
    parsed = JSON.parse(stdout);
  } catch (error) {
    const psSummary = (await captureAspirePsSummary(cwd)).slice(0, DIAG.ps);
    const parseDetail = error instanceof Error ? error.message : String(error);
    const stderrTail = redactAspireTokens(stderr.trim()).slice(-DIAG.describeStderr);
    const seedSummary = summarizeOutcome('seed', context.seed, DIAG.seed);
    const streamSummary = summarizeOutcome('stream', context.stream, DIAG.stream);
    const startSummary = summarizeCommand('startCmd', context.aspireStart, DIAG.startCmd);
    const seedCmdSummary = summarizeCommand('seedCmd', context.dbSeed, DIAG.seedCmd);
    const detachLog = await captureDetachLogTail(context.aspireStart, context.variantStartedAtMs);
    throw new Error(
      `workerPid(${context.phase}) expected JSON from aspire describe for ${appHost}: ` +
        `${parseDetail}; describe.stderr=${JSON.stringify(stderrTail)}; aspirePs=${psSummary}; ` +
        `${seedSummary}; ${streamSummary}; ${startSummary}; ${seedCmdSummary}; ` +
        `detachLog=${JSON.stringify(detachLog)}`,
    );
  }
  const snapshot = z.object({
    resources: z.array(z.object({
      displayName: z.string(),
      properties: z.record(z.string(), z.unknown()),
    })),
  }).parse(parsed);
  const workers = snapshot.resources.filter((resource) => resource.displayName === 'workers');
  const pid = workers.length === 1 ? workers[0].properties['executable.pid'] : undefined;
  if (typeof pid !== 'number' || pid <= 0) {
    throw new Error('The exact resident workers process has no PID');
  }
  return pid;
}

async function cleanup(repoRoot: string, projectRoot: string): Promise<void> {
  const receiptPath = join(projectRoot, '.netscript/e2e-cleanup.json');
  const cleanupScript = join(
    repoRoot,
    'packages/cli/e2e/src/application/gates/scaffold/runtime/evidence/cleanup.ts',
  );
  await command(Deno.execPath(), [
    'run',
    '--allow-read',
    '--allow-write',
    '--allow-run=aspire,docker',
    cleanupScript,
    join(projectRoot, 'aspire/apphost.mts'),
    projectRoot,
    'true',
    receiptPath,
  ], projectRoot);
  const receipt = z.object({
    evaluation: z.object({
      ownedContainers: z.array(z.unknown()),
      ownedProcesses: z.array(z.unknown()),
      foreignContainers: z.array(z.unknown()),
      unprovenContainers: z.array(z.unknown()),
      foreignProcesses: z.array(z.unknown()),
      unprovenProcesses: z.array(z.unknown()),
    }),
  }).parse(JSON.parse(await Deno.readTextFile(receiptPath)));
  const observed = receipt.evaluation;
  if (observed.ownedContainers.length || observed.ownedProcesses.length) {
    throw new Error('The documented workspace has owned runtime survivors');
  }
  console.info(JSON.stringify({
    cleanup: 'PASS',
    exactAppHostStopped: true,
    foreignOrUnknownLeftAlone: observed.foreignContainers.length +
      observed.unprovenContainers.length +
      observed.foreignProcesses.length + observed.unprovenProcesses.length,
  }));
}

async function runVariant(
  repoRoot: string,
  cliEntrypoint: string,
  parent: string,
  variant: DocumentedScaffoldVariant,
  commands: readonly (readonly string[])[],
): Promise<void> {
  const root = join(parent, variant);
  await Deno.mkdir(root, { recursive: true });
  const projectRoot = join(root, 'activity-demo');
  const appHost = join(projectRoot, 'aspire/apphost.mts');
  console.info(`${variant}: executing the documented command block`);
  let cwd = root;
  let beforeSeedPid: number | undefined;
  let aspireStart: CommandOutput | undefined;
  let dbSeed: CommandOutput | undefined;
  const variantStartedAtMs = Date.now();
  let appHostStarted = false;
  let primaryFailure: { readonly error: unknown } | undefined;
  try {
    for (const words of commands) {
      if (words[0] === 'cd') {
        if (words.length !== 2 || words[1] !== 'activity-demo') {
          throw new Error('The walkthrough must enter its new workspace');
        }
        cwd = projectRoot;
        continue;
      }
      let args = words.slice(1);
      if (variant === 'drop-link' && args[0] === 'plugin' && args[2] === 'streams') {
        const index = args.indexOf('--service');
        if (index < 0) throw new Error('The documented streams install lost its service link');
        args = [...args.slice(0, index), ...args.slice(index + 2)];
      }
      if (words[0] === 'aspire' && args[0] === 'start' && variant === 'skip-seed-handoff') {
        const runtime = join(projectRoot, 'workers/runtime.ts');
        const source = await Deno.readTextFile(runtime);
        // Deliberate fault in the disposable scaffold, never in a source carrier.
        const broken = source.replace(/^\s*seedHandoff: new URL\([^\n]*\),\n/m, '');
        if (broken === source) {
          throw new Error('The generated seed handoff wire is missing before the control');
        }
        await Deno.writeTextFile(runtime, broken);
      }
      if (words[0] === 'netscript' && args[0] === 'db' && args[1] === 'seed') {
        await command('aspire', [
          'wait',
          'workers',
          '--status',
          'healthy',
          '--timeout',
          '180',
          ...aspireScope(appHost),
        ], cwd);
        beforeSeedPid = await workerPid(appHost, cwd, {
          phase: 'beforeSeedPid',
          aspireStart,
          variantStartedAtMs,
        });
      }
      if (words[0] === 'aspire' && args[0] === 'start') appHostStarted = true;
      const netscriptArgs = cliEntrypoint.startsWith('jsr:')
        ? ['run', '-A', '--minimum-dependency-age=0', cliEntrypoint, ...args]
        : ['run', '-A', cliEntrypoint, ...args];
      const output = await runCommandOutput(
        words[0] === 'netscript' ? Deno.execPath() : 'aspire',
        words[0] === 'netscript' ? netscriptArgs : args,
        cwd,
      );
      if (words[0] === 'aspire' && args[0] === 'start') aspireStart = output;
      if (words[0] === 'netscript' && args[0] === 'db' && args[1] === 'seed') dbSeed = output;
    }
    const seed = await outcome(() => seedExecution(appHost, projectRoot));
    const stream = await outcome(() => activity(appHost, projectRoot));
    const afterSeedPid = await workerPid(appHost, cwd, {
      phase: 'afterSeedPid',
      seed,
      stream,
      aspireStart,
      dbSeed,
      variantStartedAtMs,
    });
    if (beforeSeedPid === undefined || beforeSeedPid !== afterSeedPid) {
      throw new Error('Workers restarted between seed and acceptance');
    }
    const failedErrors = [
      !seed.passed ? seed.error : undefined,
      !stream.passed ? stream.error : undefined,
    ].filter(Boolean);
    if (variant === 'skip-seed-handoff') {
      if (seed.passed || !(seed.error instanceof SeedHandoffAcceptanceError) || !stream.passed) {
        throw new AggregateError(
          failedErrors,
          `Seed control did not isolate the missing handoff (seed=${seed.passed}, activity=${stream.passed})`,
        );
      }
    } else if (variant === 'drop-link') {
      if (!seed.passed || stream.passed || !(stream.error instanceof StreamLinkAcceptanceError)) {
        throw new AggregateError(
          failedErrors,
          `Link control did not isolate the missing stream link (seed=${seed.passed}, activity=${stream.passed})`,
        );
      }
    } else if (!seed.passed || !stream.passed) {
      throw new AggregateError(failedErrors, 'The restored documented scaffold failed acceptance');
    }
    console.info(JSON.stringify({
      variant,
      verdict: 'PASS',
      seed: seed.passed ? seed.id : 'RED: missing handoff',
      activity: stream.passed ? stream.id : 'RED: missing link',
      residentWorkerPreserved: true,
    }));
  } catch (error) {
    primaryFailure = { error };
  }
  try {
    if (appHostStarted) await cleanup(repoRoot, projectRoot);
  } catch (error) {
    if (primaryFailure) {
      throw new AggregateError(
        [primaryFailure.error, error],
        'Documented acceptance and owned cleanup failed',
      );
    }
    throw error;
  }
  if (primaryFailure) throw primaryFailure.error;
  // Retain bind-mounted database data; runtime cleanup does not require deleting the workspace.
}

if (import.meta.main) {
  const [repoPath, cliPath, parentPath] = Deno.args;
  if (!repoPath || !cliPath || !parentPath) {
    throw new Error('Repository, CLI entrypoint and scratch parent are required');
  }
  const repoRoot = resolve(repoPath);
  const cliEntrypoint = cliPath.startsWith('jsr:') ? cliPath : resolve(repoRoot, cliPath);
  const commands = documentedScaffoldCommands(
    await Deno.readTextFile(join(repoRoot, DOCUMENTED_SCAFFOLD_DOC)),
  );
  const parentRoot = resolve(parentPath);
  await Deno.mkdir(parentRoot, { recursive: true });
  const parent = await Deno.makeTempDir({ dir: parentRoot, prefix: 'documented-' });
  for (const variant of DOCUMENTED_SCAFFOLD_VARIANTS) {
    await runVariant(repoRoot, cliEntrypoint, parent, variant, commands);
  }
  console.info(
    JSON.stringify({ documentedScaffold: 'PASS', variants: DOCUMENTED_SCAFFOLD_VARIANTS }),
  );
}
