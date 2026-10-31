import { prepareLockedFixture } from '../../../../../.llm/tools/testing/locked-fixture.ts';
import { assertEquals } from '@std/assert';
import { retryPrismaGenerate } from './provider-process.ts';

type ProviderFixtureProfile = Readonly<
  { repo: URL; source: string; filterEnv: string; evidenceEnv: string }
>;

/** Compile a consumer-owned generated client and exercise the real provider with current workspace APIs. */
export async function runSagaProviderFixture(profile: ProviderFixtureProfile): Promise<void> {
  const temp = await Deno.makeTempDir();
  const repo = profile.repo;

  try {
    const rootConfig = JSON.parse(await Deno.readTextFile('deno.json'));
    const imports: Record<string, string> = { ...rootConfig.imports };
    const committed = JSON.parse(await Deno.readTextFile('deno.lock'));
    // Only expose catalog roots already present in the committed graph. Unused
    // future-wave tooling must not become a dependency of a saga provider test.
    for (const [name, version] of Object.entries(rootConfig.catalog)) {
      const specifier = 'npm:' + name + '@' + version;
      if (specifier in committed.specifiers) imports[name] = specifier;
    }
    for (const parent of ['packages', 'plugins']) {
      for await (const member of Deno.readDir(parent)) {
        if (!member.isDirectory) continue;
        const path = parent + '/' + member.name + '/deno.json';
        let config;
        try {
          config = JSON.parse(await Deno.readTextFile(path));
        } catch (e) {
          if (e instanceof Deno.errors.NotFound) continue;
          throw e;
        }
        for (const [key, specifier] of Object.entries(config.imports ?? {})) {
          if (
            typeof specifier === 'string' &&
            (specifier.startsWith('jsr:') || (specifier.startsWith('npm:') &&
              Object.keys(imports).some((name) => key.startsWith(name + '/'))))
          ) {
            imports[key] = specifier;
          }
        }
      }
    }
    // Workspace mappings win over published fallbacks from package manifests.
    for (const parent of ['packages', 'plugins']) {
      for await (const member of Deno.readDir(parent)) {
        if (!member.isDirectory) continue;
        let config;
        try {
          config = JSON.parse(await Deno.readTextFile(parent + '/' + member.name + '/deno.json'));
        } catch (e) {
          if (e instanceof Deno.errors.NotFound) continue;
          throw e;
        }
        if (!config.name) continue;
        for (const [subpath, path] of Object.entries(config.exports ?? {})) {
          if (typeof path === 'string') {
            imports[config.name + (subpath === '.' ? '' : subpath.slice(1))] =
              new URL(parent + '/' + member.name + '/' + path, repo).href;
          }
        }
      }
    }
    imports['prisma'] = 'npm:prisma@7.10.0';
    imports['@prisma/adapter-pg'] = 'npm:@prisma/adapter-pg@^7.10.0';
    imports['@prisma/client'] = 'npm:@prisma/client@^7.10.0';
    await Deno.writeTextFile(
      temp + '/deno.json',
      JSON.stringify({
        compilerOptions: { strict: true, isolatedDeclarations: false },
        catalog: rootConfig.catalog,
        imports,
      }),
    );
    let frozen = await prepareLockedFixture(temp);
    const commandSchema = await Deno.readTextFile(
      'packages/database/tests/fixtures/command-store/schema.prisma',
    );
    const sagaSchema = await Deno.readTextFile('plugins/sagas/database/sagas.prisma');
    await Deno.writeTextFile(
      temp + '/schema.prisma',
      commandSchema.slice(0, commandSchema.indexOf('model NetScriptCommandOutbox {')) + '\n' +
        sagaSchema,
    );
    await retryPrismaGenerate(() =>
      new Deno.Command(Deno.execPath(), {
        args: [
          'run',
          ...frozen,
          '--config',
          temp + '/deno.json',
          '-A',
          'npm:prisma@7.10.0',
          'generate',
          '--schema',
          temp + '/schema.prisma',
        ],
        signal: AbortSignal.timeout(120_000),
        stdout: 'piped',
        stderr: 'piped',
      }).output()
    );
    const source = await Deno.readTextFile(profile.source);
    await Deno.writeTextFile(
      temp + '/postgres-conformance_test.ts',
      source.replaceAll('REPO_URL', repo.href),
    );
    frozen = await prepareLockedFixture(temp, [temp + '/postgres-conformance_test.ts']);
    const filter = Deno.env.get(profile.filterEnv);
    const tested = await new Deno.Command(Deno.execPath(), {
      args: [
        'test',
        ...frozen,
        '--config',
        temp + '/deno.json',
        '--unstable-kv',
        '-A',
        ...(filter ? ['--filter', filter] : []),
        temp + '/postgres-conformance_test.ts',
      ],
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    const raw = new TextDecoder().decode(tested.stdout) + new TextDecoder().decode(tested.stderr);
    const evidence = Deno.env.get(profile.evidenceEnv);
    if (evidence) await Deno.writeTextFile(evidence, raw);
    assertEquals(tested.code, 0, raw);
  } finally {
    await Deno.remove(temp, { recursive: true });
  }
}
