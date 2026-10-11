import { assertEquals, assertStringIncludes } from '@std/assert';
import { DenoFileSystem } from '../../../../../src/kernel/adapters/runtime/file-system/deno-file-system.ts';
import { readAuthServiceName } from '../../../../../src/kernel/adapters/service/auth-policy.ts';
import { join, resolve, toFileUrl } from '@std/path';
import { GUARDED_SERVICE_PROBE_SOURCE } from './guarded-service-probe-source.ts';
import { runLockedProbe } from './run-locked-probe.ts';

/** Boot and probe the service emitted by the public service-add command. */
export async function probeGeneratedGuardedService(
  projectPath: string,
  repoPath: string,
): Promise<void> {
  // The runtime suite's shared project is only an existence precondition. Every
  // command below targets our own temporary project, including helper generation.
  await Deno.stat(resolve(projectPath));
  const scratch = await Deno.makeTempDir({ prefix: 'guarded-service-probe-' });
  try {
    const postures: string[] = [];
    for (const authFirst of [true, false]) {
      postures.push(await probeInScratch(scratch, resolve(repoPath), authFirst));
    }
    assertEquals(postures[0], postures[1], 'Auth installation order changed the service policy');
  } finally {
    await Deno.remove(scratch, { recursive: true });
  }
}

async function probeInScratch(
  scratch: string,
  repoRoot: string,
  authFirst: boolean,
): Promise<string> {
  // Distinct projects prove both public CLI orders with the real installed manifest/layout.
  const orderRoot = join(scratch, authFirst ? 'auth-first' : 'service-first');
  await Deno.mkdir(orderRoot, { recursive: true });
  const projectRoot = join(orderRoot, 'guard-probe');
  const cli = join(repoRoot, 'packages/cli/bin/netscript.ts');
  const run = (args: readonly string[], cwd: string) => runLockedProbe(args, cwd, repoRoot);
  await run([
    '-A',
    join(repoRoot, 'packages/cli/bin/netscript.ts'),
    'init',
    'guard-probe',
    '--path',
    orderRoot,
    '--db',
    'none',
    '--app-name',
    'web',
    '--ci',
    '--yes',
    '--no-git',
    '--force',
    '--editor',
    'none',
  ], repoRoot);
  const installAuth = () =>
    run([
      '-A',
      cli,
      'plugin',
      'install',
      'auth',
      '--name',
      'auth',
      '--project-root',
      projectRoot,
      '--force',
    ], repoRoot);
  const addService = () =>
    run([
      '-A',
      cli,
      'service',
      'add',
      '--name',
      'guarded',
      '--project-root',
      projectRoot,
      '--force',
    ], repoRoot);
  if (authFirst) {
    await installAuth();
    await addService();
  } else {
    await addService();
    await installAuth();
  }
  assertEquals(await readAuthServiceName(projectRoot, new DenoFileSystem()), 'auth');
  await addProtectedProbeProcedure(projectRoot);
  const source = join(projectRoot, 'services/guarded/src/main.ts');
  const main = join(projectRoot, 'services/guarded/src/__auth_probe_main.ts');
  const probe = join(projectRoot, 'guarded-service-auth-probe.ts');
  const importMap = join(projectRoot, 'guarded-service-auth-imports.json');
  const entrypoint = await Deno.readTextFile(source);
  assertStringIncludes(entrypoint, 'authenticator: browserAuthenticator');
  assertStringIncludes(entrypoint, 'createContractAuthorizer(router)');
  assertEquals(entrypoint.includes('createScopeAuthorizer'), false);
  const authored = [
    'appsettings.json',
    'netscript.config.ts',
    'auth/service.ts',
    'auth/bff.ts',
    'services/guarded/src/main.ts',
  ];
  const before = await Promise.all(
    authored.map((path) => Deno.readTextFile(join(projectRoot, path))),
  );
  await run(['-A', cli, 'generate', 'aspire', '--project-root', projectRoot], repoRoot);
  assertEquals(
    await Promise.all(authored.map((path) => Deno.readTextFile(join(projectRoot, path)))),
    before,
  );
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
          '@guard-probe/contracts': toFileUrl(join(projectRoot, 'contracts/mod.ts')).href,
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
    console.info(
      'Generated guarded service order: ' + (authFirst ? 'auth -> service' : 'service -> auth'),
    );
    await run(
      [
        '-A',
        '--unstable-kv',
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
  const policy = entrypoint.match(/\bauth:\s*\{[\s\S]*?\n {2}\},/);
  if (!policy) throw new Error('Generated BFF policy was not found.');
  return policy[0];
}

/** Add a contract-protected control without changing generated authentication options. */
export async function addProtectedProbeProcedure(projectRoot: string): Promise<void> {
  const contract = join(projectRoot, 'contracts/versions/v1/guarded.contract.ts');
  const source = await Deno.readTextFile(contract);
  assertStringIncludes(source, 'export const GuardedContractV1 = {');
  await Deno.writeTextFile(
    contract,
    source.replace(
      'export const GuardedContractV1 = {',
      `export const GuardedContractV1 = {
  protected: baseContract.route({ method: 'GET', path: '/guarded/private' })
    .meta({ access: { authentication: 'required', authorization: { scopes: ['guarded:read'] } } })
    .output(z.object({ ok: z.boolean() })),`,
    ),
  );
  const router = join(projectRoot, 'services/guarded/src/router.ts');
  const current = await Deno.readTextFile(router);
  assertStringIncludes(current, '...createGuardedV1(application), health');
  await Deno.writeTextFile(
    router,
    "import { v1 } from '@guard-probe/contracts';\n" + current.replace(
      '...createGuardedV1(application), health',
      '...createGuardedV1(application), health, protected: v1.guarded.protected.handler(() => ({ ok: true }))',
    ),
  );
}

if (import.meta.main) {
  const [projectRoot, repoRoot] = Deno.args;
  if (!projectRoot || !repoRoot) {
    throw new Error('Generated project and source repository are required.');
  }
  await probeGeneratedGuardedService(projectRoot, repoRoot);
}
