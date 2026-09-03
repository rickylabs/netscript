import { dirname, fromFileUrl, join, relative } from '@std/path';

const PACKAGE_VERSION = '0.0.7-canary.8';
const PUBLISHED_CLI = `jsr:@netscript/cli@${PACKAGE_VERSION}`;

interface Scenario {
  readonly cli: 'published' | 'local';
  readonly cwd: 'repo' | 'project';
}

const repoRoot = fromFileUrl(new URL('../../..', import.meta.url));
const localCli = join(repoRoot, 'packages/cli/bin/netscript.ts');
const scenarios: readonly Scenario[] = [
  { cli: 'published', cwd: 'repo' },
  { cli: 'published', cwd: 'project' },
  { cli: 'local', cwd: 'repo' },
  { cli: 'local', cwd: 'project' },
];

for (const scenario of scenarios) {
  const projectRoot = await Deno.makeTempDir({
    prefix: `netscript-1966-${scenario.cli}-${scenario.cwd}-`,
  });
  try {
    await buildFixtureRoot(projectRoot);
    const entrypoint = scenario.cli === 'published' ? PUBLISHED_CLI : localCli;
    const denoArgs = ['run', '-A'];
    if (scenario.cli === 'published') denoArgs.push('--minimum-dependency-age=0');
    denoArgs.push(
      entrypoint,
      'generate',
      'plugins',
      '--project-root',
      projectRoot,
      '--verbose',
    );
    const result = await new Deno.Command(Deno.execPath(), {
      args: denoArgs,
      cwd: scenario.cwd === 'repo' ? repoRoot : projectRoot,
      stdout: 'piped',
      stderr: 'piped',
    }).output();

    console.log(`=== ${scenario.cli} CLI; cwd=${scenario.cwd} ===`);
    console.log(`entrypoint=${entrypoint}`);
    console.log(`projectRoot=${projectRoot}`);
    console.log(`invokingCwd=${scenario.cwd === 'repo' ? repoRoot : projectRoot}`);
    console.log(`exitCode=${result.code}`);
    console.log('stdout:');
    console.log(decode(result.stdout) || '(empty)');
    console.log('stderr:');
    console.log(decode(result.stderr) || '(empty)');
    console.log('generatedTree:');
    for (const path of await generatedTree(projectRoot)) console.log(path);
  } finally {
    await Deno.remove(projectRoot, { recursive: true });
  }
}

async function buildFixtureRoot(projectRoot: string): Promise<void> {
  await Deno.mkdir(join(projectRoot, 'workers/jobs'), { recursive: true });
  await Deno.mkdir(join(projectRoot, 'aspire'), { recursive: true });
  await Deno.mkdir(join(projectRoot, 'dotnet/AppHost'), { recursive: true });

  const workersSpecifier = `jsr:@netscript/plugin-workers@${PACKAGE_VERSION}`;
  const streamsSpecifier = `jsr:@netscript/plugin-streams@${PACKAGE_VERSION}`;
  await writeJson(join(projectRoot, 'deno.json'), {
    minimumDependencyAge: 0,
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

async function writeJson(path: string, value: unknown): Promise<void> {
  await Deno.mkdir(dirname(path), { recursive: true });
  await Deno.writeTextFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

function decode(value: Uint8Array): string {
  return new TextDecoder().decode(value).trim();
}
