import { dirname, join, resolve } from '@std/path';
import { DenoCommandAdapter } from '../../../adapters/commands/deno-command-adapter.ts';
import type { CommandExecutor } from '../../../ports/command-executor.ts';
import { createDefaultSuiteLeaseManager } from '../../runner/suite-lease.ts';
import { captureDescribeFollow } from './runtime/evidence/describe-capture.ts';
import { evaluateDescribeFollow } from './runtime/evidence/describe-follow.ts';
import { pathContained, stopCommand } from './runtime/evidence/cleanup.ts';
import { disableAnonymousDashboard } from './runtime/dashboard-config.ts';
import { SCAFFOLD_VERSIONS } from '../../../../../src/kernel/constants/scaffold/scaffold-versions.ts';
import {
  type GarnetCoexistenceDriver,
  type GarnetFixtureSide,
  runGarnetCoexistence,
} from './garnet-coexistence.ts';
import { garnetPong } from './garnet-coexistence-resp.ts';

const COMMAND_CEILING_MS = 180_000;
const CONVERGENCE_CEILING_SECONDS = 60;
const PORT_ARGUMENT = 'cache_0_tcpEndpoint.property(EndpointProperty.TargetPort)';

/** Replace only the executable argv reference, preserving Aspire endpoint allocation. */
export function pinGarnetListenPort(source: string, port: number): string {
  if (!Number.isSafeInteger(port) || port <= 0 || port > 65535) {
    throw new Error('negative control requires a valid owned listen port');
  }
  const marker = `args.add(${PORT_ARGUMENT})`;
  if (source.split(marker).length !== 2) {
    throw new Error('negative control requires exactly one generated executable port reference');
  }
  return source.replace(marker, `args.add('${port}')`);
}

/** Require the actual Garnet bind error at the owned port, not an unrelated startup failure. */
export function assertGarnetBindCollision(waitCode: number, logs: string, port: number): void {
  if (waitCode === 0 || !logs.includes(`Could not bind 127.0.0.1:${port} (AddressAlreadyInUse)`)) {
    throw new Error('literal-port negative control did not prove a Garnet bind collision');
  }
}

/** Cache-only projects use the shipped CLI generation path and the same runtime ownership seams. */
export function createGarnetCoexistenceFixture(
  repoRoot: string,
  fixtureRoot: string,
  commands: CommandExecutor,
): GarnetCoexistenceDriver {
  const root = (side: GarnetFixtureSide) => join(fixtureRoot, side);
  const appHost = (side: GarnetFixtureSide) => join(root(side), 'aspire', 'apphost.mts');
  const state = (side: GarnetFixtureSide) => join(root(side), '.netscript', 'e2e');
  const helper = (side: GarnetFixtureSide) =>
    join(root(side), 'aspire', '.helpers', 'register-infrastructure.mts');
  const started = new Set<GarnetFixtureSide>();
  let pinnedPort: number | undefined;
  const run = async (
    command: readonly string[],
    cwd = repoRoot,
    timeoutMs = COMMAND_CEILING_MS,
  ) => {
    const result = await commands.run({ command, cwd, timeoutMs });
    if (result.code !== 0 || result.timedOut) {
      throw new Error(`${command[0]} ${command[1]} failed (${result.code}): ${result.stderr}`);
    }
    if (result.stdout.length > 1_048_576) {
      throw new Error('fixture command exceeded 1 MiB evidence');
    }
    return result.stdout;
  };
  const cli = (...args: string[]) => [
    'deno',
    'run',
    '-A',
    `--lock=${join(repoRoot, 'deno.lock')}`,
    join(repoRoot, 'packages', 'cli', 'bin', 'netscript-dev.ts'),
    ...args,
  ];
  const start = async (side: GarnetFixtureSide) => {
    started.add(side);
    await run([
      'aspire',
      'start',
      '--apphost',
      appHost(side),
      '--isolated',
      '--non-interactive',
      '--nologo',
      '--format',
      'Json',
    ]);
  };
  return {
    async prepare(side) {
      // createNew fixture roots prevent a previous run's AppHost from becoming ours.
      await Deno.mkdir(root(side));
      await run(cli(
        'init',
        side,
        '--path',
        fixtureRoot,
        '--db',
        'sqlite',
        '--service=false',
        '--editor',
        'none',
        '--ci',
        '--yes',
        '--no-git',
        '--force',
      ));
      const settingsPath = join(root(side), 'appsettings.json');
      const settings = JSON.parse(await Deno.readTextFile(settingsPath));
      for (
        const section of [
          'Databases',
          'Services',
          'Plugins',
          'BackgroundProcessors',
          'Apps',
          'Tools',
        ]
      ) {
        settings.NetScript[section] = {};
      }
      delete settings.NetScript.PrimaryDatabase;
      settings.NetScript.Cache = { garnet: { Enabled: true, Engine: 'Garnet', Mode: 'Auto' } };
      settings.NetScript.PrimaryCache = 'garnet';
      await Deno.writeTextFile(settingsPath, `${JSON.stringify(settings, null, 2)}\n`);
      await run(cli('generate', 'aspire', '--project-root', root(side)));
      const configPath = await disableAnonymousDashboard(appHost(side));
      const config = JSON.parse(await Deno.readTextFile(configPath));
      config.profiles.https.environmentVariables.NETSCRIPT_CACHE_MODE = 'Executable';
      await Deno.writeTextFile(configPath, `${JSON.stringify(config, null, 2)}\n`);
      await Deno.mkdir(state(side), { recursive: true });
      await Deno.mkdir(join(root(side), '.config'), { recursive: true });
      await Deno.writeTextFile(
        join(root(side), '.config', 'dotnet-tools.json'),
        JSON.stringify({
          version: 1,
          isRoot: true,
          tools: {
            'garnet-server': {
              version: SCAFFOLD_VERSIONS.GARNET_TOOL,
              commands: ['garnet-server'],
            },
          },
        }),
      );
      // Surface restore failures before startup; the shipped helper's restore is best-effort.
      await run(['dotnet', 'tool', 'restore'], root(side));
      await run([
        'aspire',
        'restore',
        '--apphost',
        appHost(side),
        '--non-interactive',
        '--nologo',
      ]);
    },
    start,
    async observe(side) {
      const evidencePath = join(state(side), 'garnet-describe.ndjson');
      await captureDescribeFollow(
        appHost(side),
        evidencePath,
        ['garnet'],
        CONVERGENCE_CEILING_SECONDS,
      );
      const stream = await Deno.readTextFile(evidencePath);
      evaluateDescribeFollow(stream, ['garnet']);
      const snapshot = JSON.parse(
        await run([
          'aspire',
          'describe',
          'garnet',
          '--apphost',
          appHost(side),
          '--format',
          'Json',
          '--non-interactive',
          '--nologo',
        ]),
      );
      const resource = snapshot.resources?.find((entry: Record<string, unknown>) =>
        entry.displayName === 'garnet'
      );
      if (!resource || resource.resourceType !== 'Executable' || resource.state !== 'Running') {
        throw new Error('forced Executable mode did not produce a running Garnet executable');
      }
      if (resource.healthReports?.garnet_resp?.status !== 'Healthy') {
        throw new Error('runtime.wait.garnet: real RESP health report is not Healthy');
      }
      const pid: unknown = resource.properties?.['executable.pid'];
      if (
        typeof pid !== 'number' || !Number.isSafeInteger(pid) || pid <= 0 ||
        await Deno.realPath(`/proc/${pid}/cwd`) !== await Deno.realPath(root(side))
      ) {
        throw new Error('Garnet PID is not proven by the owned workdir and resource model');
      }
      const argv = new TextDecoder().decode(await Deno.readFile(`/proc/${pid}/cmdline`)).split(
        '\0',
      );
      if (!argv.includes('garnet-server') || !argv.includes('--port')) {
        throw new Error('owned process is not the generated Garnet executable');
      }
      const listenPort = Number(argv[argv.indexOf('--port') + 1]);
      const published = resource.urls?.find((entry: Record<string, unknown>) =>
        entry.name === 'tcp'
      );
      const publishedPort = Number(new URL(published?.url).port);
      return {
        pid,
        listenPort,
        publishedPort,
        listenPong: await garnetPong(listenPort),
        publishedPong: await garnetPong(publishedPort),
      };
    },
    async stop(side) {
      if (!started.has(side)) return;
      if (!pathContained(appHost(side), fixtureRoot)) throw new Error('AppHost ownership lost');
      await run(stopCommand(appHost(side), false), repoRoot, 30_000);
      // Check process ownership even when startup/observation failed before a PID was captured.
      for (let attempt = 0; attempt < 20; attempt++) {
        if ((await ownedGarnetPids(root(side))).length === 0) break;
        if (attempt === 19) throw new Error('owned Garnet process survived scoped stop');
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      started.delete(side);
    },
    async pinSecondListenPort(port) {
      pinnedPort = port;
      await Deno.writeTextFile(
        helper('second'),
        pinGarnetListenPort(await Deno.readTextFile(helper('second')), port),
      );
    },
    async assertSecondBindCollision() {
      // Start may itself fail when the pinned process cannot bind; diagnose instead of retrying.
      try {
        await start('second');
      } catch { /* The collision log below is the authority. */ }
      const waited = await commands.run({
        command: [
          'aspire',
          'wait',
          'garnet',
          '--status',
          'healthy',
          '--timeout',
          '20',
          '--apphost',
          appHost('second'),
          '--non-interactive',
          '--nologo',
        ],
        cwd: repoRoot,
        timeoutMs: 30_000,
      });
      const logs = await run(
        [
          'aspire',
          'logs',
          'garnet',
          '-n',
          '100',
          '--apphost',
          appHost('second'),
          '--non-interactive',
          '--nologo',
        ],
        repoRoot,
        10_000,
      );
      await Deno.writeTextFile(join(state('second'), 'literal-port-control.log'), logs);
      if (pinnedPort === undefined) throw new Error('negative control omitted owned port');
      assertGarnetBindCollision(waited.code, logs, pinnedPort);
    },
  };
}

async function ownedGarnetPids(projectRoot: string): Promise<readonly number[]> {
  const expected = await Deno.realPath(projectRoot);
  const owned: number[] = [];
  let examined = 0;
  for await (const entry of Deno.readDir('/proc')) {
    if (++examined > 32768) throw new Error('process scan exceeded fixture budget');
    const pid = Number(entry.name);
    if (!Number.isSafeInteger(pid) || pid <= 0) continue;
    try {
      if (await Deno.realPath(`/proc/${pid}/cwd`) !== expected) continue;
      const argv = new TextDecoder().decode(await Deno.readFile(`/proc/${pid}/cmdline`)).split(
        '\0',
      );
      if (
        argv.includes('garnet-server') ||
        argv.some((arg) => /(?:^|[/\\])GarnetServer(?:\.dll)?$/.test(arg))
      ) {
        owned.push(pid);
      }
    } catch (error) {
      if (
        !(error instanceof Deno.errors.NotFound) && !(error instanceof Deno.errors.PermissionDenied)
      ) throw error;
    }
  }
  return owned;
}

if (import.meta.main) {
  const [repoArg, receiptArg] = Deno.args;
  if (!repoArg || !receiptArg) throw new Error('requires repository root and receipt path');
  if (Deno.build.os !== 'linux') throw new Error('owned process proof requires Linux /proc');
  if (!Deno.env.get('ASPIRE_CLI_START_TIMEOUT')) {
    Deno.env.set('ASPIRE_CLI_START_TIMEOUT', String(CONVERGENCE_CEILING_SECONDS));
  }
  const repoRoot = resolve(repoArg);
  const receiptPath = resolve(receiptArg);
  await Deno.mkdir(dirname(receiptPath), { recursive: true });
  const fixtureRoot = await Deno.makeTempDir({
    dir: dirname(receiptPath),
    prefix: 'garnet-coexistence-',
  });
  const head = await new Deno.Command('git', { args: ['rev-parse', 'HEAD'], cwd: repoRoot })
    .output();
  if (!head.success) throw new Error('fixture could not establish Git head');
  const headSha = new TextDecoder().decode(head.stdout).trim();
  const startedAt = new Date().toISOString();
  await runGarnetCoexistence(
    repoRoot,
    createDefaultSuiteLeaseManager(),
    createGarnetCoexistenceFixture(repoRoot, fixtureRoot, new DenoCommandAdapter()),
    (receipt) =>
      Deno.writeTextFile(
        receiptPath,
        `${
          JSON.stringify(
            { ...receipt, headSha, startedAt, completedAt: new Date().toISOString() },
            null,
            2,
          )
        }\n`,
      ),
  );
  console.info(
    'Garnet coexistence: PASS; both RESP endpoints distinct; literal-port control rejected; owned cleanup complete',
  );
}
