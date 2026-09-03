import { dirname, fromFileUrl, join, relative } from '@std/path';

const PACKAGE_VERSION = '0.0.7-canary.8';
const PUBLISHED_CLI = `jsr:@netscript/cli@${PACKAGE_VERSION}`;
const REGISTRY_PATH = '.netscript/generated/plugin-workers/job-registry.ts';

type Mode = 'green' | 'red';
type InvokingCwd = 'project' | 'repo';

const mode = parseMode(Deno.args);
const repoRoot = fromFileUrl(new URL('../../..', import.meta.url));
const gitHead = await readGitHead(repoRoot);
const failures: string[] = [];

console.log(`mode=${mode}`);
console.log(`gitHead=${gitHead}`);
console.log(`startedAt=${new Date().toISOString()}`);

for (const invokingCwd of ['repo', 'project'] as const) {
  const projectRoot = await Deno.makeTempDir({
    prefix: `netscript-1966-${mode}-${invokingCwd}-`,
  });
  try {
    await buildFixtureRoot(projectRoot, mode);
    const cwd = invokingCwd === 'repo' ? repoRoot : projectRoot;
    const denoArgs = [
      'run',
      '-A',
      '--minimum-dependency-age=0',
      PUBLISHED_CLI,
      'generate',
      'plugins',
      '--project-root',
      projectRoot,
    ];
    const result = await new Deno.Command(Deno.execPath(), {
      args: denoArgs,
      cwd,
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    const tree = await generatedTree(projectRoot);
    const registry = await readOptional(join(projectRoot, REGISTRY_PATH));

    console.log(`=== published CLI; mode=${mode}; cwd=${invokingCwd} ===`);
    console.log(`timestamp=${new Date().toISOString()}`);
    console.log(`gitHead=${gitHead}`);
    console.log(`cwd=${cwd}`);
    console.log(`projectRoot=${projectRoot}`);
    console.log(`command=${formatCommand('deno', denoArgs)}`);
    console.log(`exitCode=${result.code}`);
    console.log('stdout:');
    printRaw(result.stdout);
    console.log('stderr:');
    printRaw(result.stderr);
    console.log('generatedTree:');
    tree.forEach((path) => console.log(path));
    console.log('registryContents:');
    console.log(registry ?? `(missing ${REGISTRY_PATH})`);

    assertScenario(mode, invokingCwd, result, tree, registry, failures);
  } finally {
    await Deno.remove(projectRoot, { recursive: true });
  }
}

if (failures.length > 0) {
  failures.forEach((failure) => console.error(`ASSERTION_FAILURE: ${failure}`));
  Deno.exit(1);
}

console.log(`REPRODUCTION_${mode.toUpperCase()}_PASS`);

function parseMode(args: readonly string[]): Mode {
  if (args.length !== 2 || args[0] !== '--mode' || !['red', 'green'].includes(args[1])) {
    throw new Error('Usage: reproduce-canary8.ts --mode <red|green>');
  }
  return args[1] as Mode;
}

async function buildFixtureRoot(projectRoot: string, selectedMode: Mode): Promise<void> {
  await Deno.mkdir(join(projectRoot, 'workers/jobs'), { recursive: true });
  await Deno.mkdir(join(projectRoot, 'aspire'), { recursive: true });
  await Deno.mkdir(join(projectRoot, 'dotnet/AppHost'), { recursive: true });

  const workersSpecifier = `jsr:@netscript/plugin-workers@${PACKAGE_VERSION}`;
  const streamsSpecifier = `jsr:@netscript/plugin-streams@${PACKAGE_VERSION}`;
  await writeJson(join(projectRoot, 'deno.json'), {
    ...(selectedMode === 'green' ? { minimumDependencyAge: 0 } : {}),
    imports: {
      '@netscript/config': `jsr:@netscript/config@${PACKAGE_VERSION}`,
      '@netscript/plugin-workers': workersSpecifier,
      '@netscript/plugin-streams': streamsSpecifier,
    },
  });
  await Deno.writeTextFile(
    join(projectRoot, 'netscript.config.ts'),
    `import { defineConfig } from '@netscript/config';

const config = defineConfig({
  name: 'package-backed-doctor',
  version: '1.0.0',
  databases: { config: [] },
  plugins: [
    '${workersSpecifier}',
    '${streamsSpecifier}',
  ],
});

export { config as default };
`,
  );
  await Deno.writeTextFile(
    join(projectRoot, 'workers/jobs/package-backed-job.ts'),
    'export const packageBackedJob = async (): Promise<void> => undefined;\n',
  );

  const appsettings = {
    NetScript: {
      Name: 'package-backed-doctor',
      Version: '1.0.0',
      Defaults: { Deno: { Permissions: ['--allow-net'], WatchMode: false } },
      Plugins: {
        'workers-api': {
          Enabled: true,
          Entrypoint: `${workersSpecifier}/services`,
          Workdir: '.',
        },
        streams: {
          Enabled: true,
          Entrypoint: `${streamsSpecifier}/services`,
          Workdir: '.',
        },
      },
      BackgroundProcessors: {
        workers: {
          Enabled: true,
          Entrypoint: `${workersSpecifier}/runtime`,
          Workdir: '.',
        },
      },
    },
  };
  await writeJson(join(projectRoot, 'appsettings.json'), appsettings);
  await writeJson(join(projectRoot, 'dotnet/AppHost/appsettings.json'), appsettings);
}

function assertScenario(
  selectedMode: Mode,
  cwd: InvokingCwd,
  result: Deno.CommandOutput,
  tree: readonly string[],
  registry: string | undefined,
  output: string[],
): void {
  const stderr = new TextDecoder().decode(result.stderr);
  if (selectedMode === 'red') {
    if (result.code !== 1) output.push(`red/${cwd}: expected exit 1, got ${result.code}`);
    if (!/minimum dependency (?:age|date)/i.test(stderr)) {
      output.push(`red/${cwd}: missing minimum-dependency rejection`);
    }
    if (!tree.includes('(missing .netscript/generated)')) {
      output.push(`red/${cwd}: generated tree unexpectedly exists`);
    }
    return;
  }

  if (result.code !== 0) output.push(`green/${cwd}: expected exit 0, got ${result.code}`);
  if (!tree.includes(REGISTRY_PATH)) output.push(`green/${cwd}: registry absent from tree`);
  if (!registry?.includes('package-backed-job')) {
    output.push(`green/${cwd}: registry omits package-backed-job`);
  }
}

async function readGitHead(cwd: string): Promise<string> {
  const result = await new Deno.Command('git', {
    args: ['rev-parse', 'HEAD'],
    cwd,
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  if (!result.success) throw new Error(new TextDecoder().decode(result.stderr));
  return new TextDecoder().decode(result.stdout).trim();
}

async function generatedTree(projectRoot: string): Promise<readonly string[]> {
  const root = join(projectRoot, '.netscript/generated');
  const output: string[] = [];
  if (!await exists(root)) return ['(missing .netscript/generated)'];
  await collect(root);
  return output.length > 0 ? output : ['(empty .netscript/generated)'];

  async function collect(directory: string): Promise<void> {
    const entries = [...await Array.fromAsync(Deno.readDir(directory))]
      .sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of entries) {
      const absolute = join(directory, entry.name);
      const path = relative(projectRoot, absolute).replaceAll('\\', '/');
      output.push(entry.isDirectory ? `${path}/` : path);
      if (entry.isDirectory) await collect(absolute);
    }
  }
}

async function exists(path: string): Promise<boolean> {
  return await Deno.stat(path).then(() => true).catch((error: unknown) => {
    if (error instanceof Deno.errors.NotFound) return false;
    throw error;
  });
}

async function readOptional(path: string): Promise<string | undefined> {
  try {
    return await Deno.readTextFile(path);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return undefined;
    throw error;
  }
}

async function writeJson(path: string, value: unknown): Promise<void> {
  await Deno.mkdir(dirname(path), { recursive: true });
  await Deno.writeTextFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

function printRaw(value: Uint8Array): void {
  if (value.length === 0) {
    console.log('(empty)');
    return;
  }
  const decoded = new TextDecoder().decode(value);
  console.log(decoded.endsWith('\n') ? decoded.slice(0, -1) : decoded);
}

function formatCommand(command: string, args: readonly string[]): string {
  return [command, ...args].map((arg) =>
    /^[A-Za-z0-9_./:@=-]+$/.test(arg) ? arg : JSON.stringify(arg)
  )
    .join(' ');
}
