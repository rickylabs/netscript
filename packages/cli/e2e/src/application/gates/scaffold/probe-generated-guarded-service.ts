import { join, resolve, toFileUrl } from '@std/path';
import { GUARDED_SERVICE_PROBE_SOURCE } from './guarded-service-probe-source.ts';

/** Boot and probe the service emitted by the public service-add command. */
export async function probeGeneratedGuardedService(
  projectPath: string,
  repoPath: string,
): Promise<void> {
  const projectRoot = resolve(projectPath);
  const repoRoot = resolve(repoPath);
  await run([
    'run',
    '-A',
    join(repoRoot, 'packages/cli/bin/netscript.ts'),
    'service',
    'add',
    '--name',
    'guarded',
    '--project-root',
    projectRoot,
    '--force',
  ], repoRoot);
  const source = join(projectRoot, 'services/guarded/src/main.ts');
  const main = join(projectRoot, 'services/guarded/src/__auth_probe_main.ts');
  const probe = join(projectRoot, 'guarded-service-auth-probe.ts');
  const importMap = join(projectRoot, 'guarded-service-auth-imports.json');
  const entrypoint = await Deno.readTextFile(source);
  if (!entrypoint.includes('await defineService(router, {')) {
    throw new Error('Generated service entrypoint is missing its defineService composition.');
  }
  try {
    const config = JSON.parse(await Deno.readTextFile(join(projectRoot, 'deno.json'))) as {
      imports?: Record<string, string>;
    };
    const repoConfig = JSON.parse(await Deno.readTextFile(join(repoRoot, 'deno.json'))) as {
      imports: Record<string, string>;
    };
    await Deno.writeTextFile(
      importMap,
      JSON.stringify({
        imports: {
          ...Object.fromEntries(
            Object.entries(config.imports ?? {}).map(([name, target]) => [
              name,
              target.startsWith('.') ? toFileUrl(resolve(projectRoot, target)).href : target,
            ]),
          ),
          '@std/assert': repoConfig.imports['@std/assert'],
          '@std/assert/equal': `${repoConfig.imports['@std/assert']}/equal`,
        },
      }),
    );
    await Deno.writeTextFile(
      main,
      entrypoint.replace(
        'await defineService(router, {',
        'export const running = await defineService(router, {',
      ),
    );
    await Deno.writeTextFile(
      probe,
      GUARDED_SERVICE_PROBE_SOURCE
        .replaceAll('__AUTH_SOURCE__', toFileUrl(join(repoRoot, 'plugins/auth/services/src')).href)
        .replaceAll('__SERVICE_MAIN__', toFileUrl(main).href)
        .replaceAll(
          '__HTTP_CONTRACT__',
          new URL('../../../domain/http-contract.ts', import.meta.url).href,
        ),
    );
    await run(
      [
        'run',
        '-A',
        '--unstable-kv',
        '--config',
        join(projectRoot, 'deno.json'),
        '--import-map',
        importMap,
        probe,
      ],
      projectRoot,
    );
  } finally {
    await Promise.all(
      [main, probe, importMap].map((path) =>
        Deno.remove(path).catch((error: unknown) => {
          if (!(error instanceof Deno.errors.NotFound)) throw error;
        })
      ),
    );
  }
}

async function run(args: string[], cwd: string): Promise<void> {
  const result = await new Deno.Command(Deno.execPath(), {
    args,
    cwd,
    stdout: 'inherit',
    stderr: 'inherit',
  }).output();
  if (!result.success) throw new Error('Generated guarded service command failed: ' + result.code);
}

if (import.meta.main) {
  const [projectRoot, repoRoot] = Deno.args;
  if (!projectRoot || !repoRoot) {
    throw new Error('Generated project and source repository are required.');
  }
  await probeGeneratedGuardedService(projectRoot, repoRoot);
}
