import { dirname, join, resolve } from '@std/path';
import {
  findUnpublishedFixturePackages,
  PACKAGE_BACKED_DOCTOR_UNPUBLISHED_EXIT_CODE,
} from './package-backed-plugin-version.ts';

const WORKERS_PERMISSIONS = [
  '--unstable-kv',
  '--allow-net',
  '--allow-env',
  '--allow-read',
  '--allow-write',
  '--allow-run',
] as const;
const STREAMS_PERMISSIONS = [
  '--allow-net',
  '--allow-env',
  '--allow-read',
  '--allow-write',
  '--allow-sys',
  '--allow-ffi',
] as const;
const REGISTRY_PATH = '.netscript/generated/plugin-workers/job-registry.ts';

const options = parseArgs(Deno.args);
const unpublishedPackages = await findUnpublishedFixturePackages(options.packageVersion);
if (unpublishedPackages.length > 0) {
  console.log('PACKAGE_BACKED_PLUGIN_DOCTOR_EXCLUDED');
  console.log(`version=${options.packageVersion}`);
  console.log(`unpublishedPackages=${unpublishedPackages.join(',')}`);
  Deno.exit(PACKAGE_BACKED_DOCTOR_UNPUBLISHED_EXIT_CODE);
}
await Deno.remove(options.projectRoot, { recursive: true }).catch((error: unknown) => {
  if (!(error instanceof Deno.errors.NotFound)) throw error;
});
await Deno.mkdir(join(options.projectRoot, 'workers/jobs'), { recursive: true });
await Deno.mkdir(join(options.projectRoot, 'aspire'), { recursive: true });
await Deno.mkdir(join(options.projectRoot, 'dotnet/AppHost'), { recursive: true });

const workersSpecifier = `jsr:@netscript/plugin-workers@${options.packageVersion}`;
const streamsSpecifier = `jsr:@netscript/plugin-streams@${options.packageVersion}`;
await writeJson(join(options.projectRoot, 'deno.json'), {
  // Test-harness only: the nested registry generator reads this project deno.json, and Deno's
  // default 24h minimum dependency age rejects a just-published canary (#1966). The outer CLI
  // receives --minimum-dependency-age=0 on its own command line, but that flag does not reach the
  // nested generator process. Product supply-chain policy is untouched.
  minimumDependencyAge: 0,
  imports: {
    '@netscript/config': `jsr:@netscript/config@${options.packageVersion}`,
    '@netscript/plugin-workers': workersSpecifier,
    '@netscript/plugin-streams': streamsSpecifier,
  },
});
await Deno.writeTextFile(
  join(options.projectRoot, 'netscript.config.ts'),
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
  join(options.projectRoot, 'workers/jobs/package-backed-job.ts'),
  `export const packageBackedJob = async (): Promise<void> => undefined;
`,
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
await writeJson(join(options.projectRoot, 'appsettings.json'), appsettings);
await writeJson(join(options.projectRoot, 'dotnet/AppHost/appsettings.json'), appsettings);

const failures: string[] = [];
for (const forbidden of ['plugins/workers', 'plugins/streams']) {
  if (await exists(join(options.projectRoot, forbidden))) {
    failures.push(`fixture fabricated forbidden local plugin workdir: ${forbidden}`);
  }
}

const generate = await runCli(options, [
  'generate',
  'plugins',
  '--project-root',
  options.projectRoot,
]);
if (generate.code !== 0) {
  failures.push(`generate plugins exited ${generate.code}: ${generate.output}`);
}
if (
  /exited (?:with )?(?:code )?[1-9]|minimum dependency age|dependency age/i.test(generate.output)
) {
  failures.push(`nested registry generation did not exit 0: ${generate.output}`);
}
const registryPath = join(options.projectRoot, REGISTRY_PATH);
const registry = await readOptional(registryPath);
if (!registry) failures.push(`missing generated registry: ${REGISTRY_PATH}`);
if (registry && !registry.includes('package-backed-job')) {
  failures.push('generated workers registry does not contain package-backed-job');
}

const aspire = await runCli(options, ['generate', 'aspire', '--project-root', options.projectRoot]);
if (aspire.code !== 0) failures.push(`generate aspire exited ${aspire.code}: ${aspire.output}`);

const doctor = await runCli(options, ['plugin', 'doctor', '--project-root', options.projectRoot]);
if (doctor.code !== 0) failures.push(`plugin doctor exited ${doctor.code}: ${doctor.output}`);
for (
  const [plugin, permissions] of [
    ['@netscript/plugin-workers', WORKERS_PERMISSIONS],
    ['@netscript/plugin-streams', STREAMS_PERMISSIONS],
  ] as const
) {
  const permissionLine = `${plugin}\thealthy\tPermission metadata\t${permissions.join(' ')}`;
  if (!doctor.output.includes(permissionLine)) {
    failures.push(`doctor did not report published permissions: ${permissionLine}`);
  }
}
for (
  const check of [
    'generated job registry exists',
    'generated job registry is non-empty',
    'every declared job is registered',
  ]
) {
  if (!doctor.output.includes(`\thealthy\t${check}\t`)) {
    failures.push(`doctor did not execute healthy workers check: ${check}`);
  }
}
for (
  const forbidden of [
    'plugins/workers does not exist',
    'plugins/streams does not exist',
    'No plugin permissions declared',
  ]
) {
  if (doctor.output.includes(forbidden)) {
    failures.push(`doctor emitted forbidden diagnostic: ${forbidden}`);
  }
}
for (const specifier of [workersSpecifier, streamsSpecifier]) {
  if (!doctor.output.includes(`healthy\tConfigured module resolves\t${specifier}`)) {
    failures.push(`doctor did not resolve exact published module: ${specifier}`);
  }
}

const pluginHelper = await readOptional(
  join(options.projectRoot, 'aspire/.helpers/register-plugins.mts'),
);
const backgroundHelper = await readOptional(
  join(options.projectRoot, 'aspire/.helpers/register-background.mts'),
);
if (!pluginHelper) failures.push('generated plugin AppHost helper is missing');
if (!backgroundHelper) failures.push('generated background AppHost helper is missing');
if (pluginHelper && !containsPermissions(pluginHelper, WORKERS_PERMISSIONS)) {
  failures.push('generated plugin AppHost helper lacks workers manifest permissions');
}
if (pluginHelper && !containsPermissions(pluginHelper, STREAMS_PERMISSIONS)) {
  failures.push('generated plugin AppHost helper lacks streams manifest permissions');
}
if (backgroundHelper && !containsPermissions(backgroundHelper, WORKERS_PERMISSIONS)) {
  failures.push('generated background AppHost helper lacks workers manifest permissions');
}

if (failures.length > 0) {
  console.error('PACKAGE_BACKED_PLUGIN_DOCTOR_FAIL');
  for (const failure of failures) console.error(`- ${failure}`);
  console.error('--- doctor output ---');
  console.error(doctor.output);
  throw new Error('Package-backed plugin doctor assertions failed.');
}

console.log('PACKAGE_BACKED_PLUGIN_DOCTOR_PASS');
console.log(`registry=${REGISTRY_PATH}`);
console.log(`workersPermissions=${WORKERS_PERMISSIONS.join(' ')}`);
console.log(`streamsPermissions=${STREAMS_PERMISSIONS.join(' ')}`);

interface FixtureOptions {
  readonly cliEntrypoint: string;
  readonly packageVersion: string;
  readonly projectRoot: string;
  readonly repoRoot: string;
}

function parseArgs(args: readonly string[]): FixtureOptions {
  const values = new Map<string, string>();
  for (let index = 0; index < args.length; index += 2) {
    const name = args[index];
    const value = args[index + 1];
    if (!name?.startsWith('--') || !value) {
      throw new Error(`Invalid fixture argument: ${name ?? ''}`);
    }
    values.set(name, value);
  }
  const projectRoot = values.get('--project-root');
  const repoRoot = values.get('--repo-root');
  const cliEntrypoint = values.get('--cli-entrypoint');
  const packageVersion = values.get('--package-version');
  if (!projectRoot || !repoRoot || !cliEntrypoint || !packageVersion) {
    throw new Error(
      'Fixture requires --project-root, --repo-root, --cli-entrypoint, and --package-version.',
    );
  }
  return {
    projectRoot: resolve(projectRoot),
    repoRoot: resolve(repoRoot),
    cliEntrypoint,
    packageVersion,
  };
}

async function runCli(
  fixture: FixtureOptions,
  args: readonly string[],
): Promise<{ readonly code: number; readonly output: string }> {
  const entrypoint = fixture.cliEntrypoint.startsWith('jsr:')
    ? fixture.cliEntrypoint
    : resolve(fixture.repoRoot, fixture.cliEntrypoint);
  const denoArgs = ['run', '-A'];
  if (entrypoint.startsWith('jsr:')) denoArgs.push('--minimum-dependency-age=0');
  denoArgs.push(entrypoint, ...args);
  const result = await new Deno.Command(Deno.execPath(), {
    args: denoArgs,
    cwd: fixture.repoRoot,
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  const stdout = new TextDecoder().decode(result.stdout);
  const stderr = new TextDecoder().decode(result.stderr);
  return { code: result.code, output: `${stdout}${stderr}`.trim() };
}

function containsPermissions(source: string, permissions: readonly string[]): boolean {
  return permissions.every((permission) => source.includes(permission));
}

async function exists(path: string): Promise<boolean> {
  try {
    await Deno.stat(path);
    return true;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return false;
    throw error;
  }
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
