/** Execute the documented scaffold order without the main suite's repair fixtures. @module */
import { join, resolve } from '@std/path';
import { buildStreamUrl } from '@netscript/plugin-streams-core';
import { z } from 'zod';
import {
  assertDocumentedActivity,
  assertDocumentedSeedExecution,
  assertLinkedActivityHtml,
  DOCUMENTED_SCAFFOLD_DOC,
  DOCUMENTED_SCAFFOLD_VARIANTS,
  documentedScaffoldCommands,
  type DocumentedScaffoldVariant,
  SeedHandoffAcceptanceError,
  StreamLinkAcceptanceError,
} from './documented-scaffold-contract.ts';
import { resolveResourceUrlsFromAppHost } from './generated-app-endpoint.ts';
import { probeAppHome } from './probe-app-home.ts';
import { probePluginResource } from './runtime/probe-plugin-resource.ts';
import { verifyGeneratedCrudAcceptance } from './verify-live-db-endpoint.ts';

const COMMAND_CEILING_MS = 300_000;
const seedRequest = z.object({ version: z.literal(1), seedId: z.string().uuid() });
type Outcome = { readonly passed: true; readonly id: string } | {
  readonly passed: false;
  readonly error: unknown;
};

async function command(executable: string, args: readonly string[], cwd: string): Promise<string> {
  const result = await new Deno.Command(executable, {
    args: [...args],
    cwd,
    stdin: 'null',
    stdout: 'piped',
    stderr: 'piped',
    signal: AbortSignal.timeout(COMMAND_CEILING_MS),
  }).output();
  const stdout = new TextDecoder().decode(result.stdout);
  if (!result.success) {
    throw new Error(
      `${executable} ${args.join(' ')} exited ${result.code}: ${
        new TextDecoder().decode(result.stderr).slice(-6000)
      }\n${stdout.slice(-6000)}`,
    );
  }
  return stdout;
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
  return assertDocumentedSeedExecution(
    await responseJson(new URL('/api/v1/workers/executions?limit=50', url)),
    seedId,
  );
}

async function activity(appHost: string, projectRoot: string): Promise<string> {
  const [usersUrl] = await resolveResourceUrlsFromAppHost(appHost, 'users');
  const mutation = await verifyGeneratedCrudAcceptance(usersUrl);
  await probeAppHome(projectRoot, 'dashboard', appHost);
  const [appUrl] = await resolveResourceUrlsFromAppHost(appHost, 'dashboard');
  const response = await fetch(appUrl, {
    signal: AbortSignal.timeout(10_000),
    headers: { accept: 'text/html' },
  });
  const html = await response.text();
  if (!response.ok || !html.includes('<html')) {
    throw new Error('The documented app failed to render');
  }
  assertLinkedActivityHtml(html);
  const [streamsUrl] = await resolveResourceUrlsFromAppHost(appHost, 'streams');
  const streamUrl = new URL(buildStreamUrl('/scaffold/users/records', streamsUrl));
  streamUrl.searchParams.set('offset', '-1');
  const events = await responseJson(streamUrl);
  return assertDocumentedActivity(events, mutation.representativeId, html);
}

async function workerPid(appHost: string, cwd: string): Promise<number> {
  const snapshot = z.object({
    resources: z.array(z.object({
      displayName: z.string(),
      properties: z.record(z.string(), z.unknown()),
    })),
  }).parse(JSON.parse(
    await command('aspire', [
      'describe',
      '--apphost',
      appHost,
      '--format',
      'Json',
      '--non-interactive',
      '--nologo',
    ], cwd),
  ));
  const workers = snapshot.resources.filter((resource) => resource.displayName === 'workers');
  const pid = workers.length === 1 ? workers[0].properties['executable.pid'] : undefined;
  if (typeof pid !== 'number' || pid <= 0) {
    throw new Error('The exact resident workers process has no PID');
  }
  return pid;
}

async function cleanup(repoRoot: string, projectRoot: string): Promise<void> {
  const result = await new Deno.Command(Deno.execPath(), {
    args: [
      'run',
      '-A',
      join(repoRoot, '.llm/tools/maint/teardown/teardown.ts'),
      '--slice-dir',
      join(projectRoot, '.netscript/e2e-cleanup'),
      '--worktree',
      repoRoot,
      '--owned-root',
      projectRoot,
      '--apply',
    ],
    cwd: repoRoot,
    stdin: 'null',
    stdout: 'piped',
    stderr: 'piped',
    signal: AbortSignal.timeout(COMMAND_CEILING_MS),
  }).output();
  if (result.code !== 0 && result.code !== 4) {
    throw new Error(
      `Documented workspace cleanup failed: ${new TextDecoder().decode(result.stderr)}`,
    );
  }
  const receipt = z.object({
    actionsRequired: z.array(z.string()),
    escalated: z.array(z.unknown()),
    stoppedAppHosts: z.array(z.string()),
    removedContainers: z.array(z.string()),
  }).parse(JSON.parse(new TextDecoder().decode(result.stdout)));
  if (receipt.actionsRequired.length) {
    throw new Error(`Documented cleanup needs action: ${receipt.actionsRequired.join('; ')}`);
  }
  console.info(
    JSON.stringify({
      cleanup: 'PASS',
      appHosts: receipt.stoppedAppHosts.length,
      containers: receipt.removedContainers.length,
      foreignOrUnknownLeftAlone: receipt.escalated.length,
    }),
  );
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
  let cwd = root;
  let beforeSeedPid: number | undefined;
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
          '--apphost',
          appHost,
          '--non-interactive',
          '--nologo',
        ], cwd);
        beforeSeedPid = await workerPid(appHost, cwd);
      }
      console.info(`${variant}: ${words.join(' ')}`);
      await command(
        words[0] === 'netscript' ? Deno.execPath() : 'aspire',
        words[0] === 'netscript'
          ? [
            'run',
            '-A',
            ...(cliEntrypoint.startsWith('jsr:') ? ['--minimum-dependency-age=0'] : []),
            cliEntrypoint,
            ...args,
          ]
          : args,
        cwd,
      );
    }
    const seed = await outcome(() => seedExecution(appHost, projectRoot));
    const stream = await outcome(() => activity(appHost, projectRoot));
    const afterSeedPid = await workerPid(appHost, cwd);
    if (beforeSeedPid === undefined || beforeSeedPid !== afterSeedPid) {
      throw new Error('Workers restarted between seed and acceptance');
    }
    if (variant === 'skip-seed-handoff') {
      if (seed.passed || !(seed.error instanceof SeedHandoffAcceptanceError) || !stream.passed) {
        throw new Error(
          `Seed control did not isolate the missing handoff: ${JSON.stringify({ seed, stream })}`,
        );
      }
    } else if (variant === 'drop-link') {
      if (!seed.passed || stream.passed || !(stream.error instanceof StreamLinkAcceptanceError)) {
        throw new Error(
          `Link control did not isolate the missing stream link: ${
            JSON.stringify({ seed, stream })
          }`,
        );
      }
    } else if (!seed.passed || !stream.passed) {
      throw new AggregateError(
        [!seed.passed ? seed.error : undefined, !stream.passed ? stream.error : undefined].filter(
          Boolean,
        ),
        'The restored documented scaffold failed acceptance',
      );
    }
    console.info(
      JSON.stringify({
        variant,
        verdict: 'PASS',
        seed: seed.passed ? seed.id : 'RED: missing handoff',
        activity: stream.passed ? stream.id : 'RED: missing link',
        residentWorkerPreserved: true,
      }),
    );
  } catch (error) {
    primaryFailure = { error };
  }
  try {
    await cleanup(repoRoot, projectRoot);
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
}
