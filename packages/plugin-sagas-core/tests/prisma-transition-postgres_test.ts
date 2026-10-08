import { assertEquals } from '@std/assert';

Deno.test({
  name: 'real PostgreSQL generated-client atomic saga transition conformance',
  ignore: !Deno.env.get('COMMAND_POSTGRES_SOCKET'),
  async fn() {
    const temp = await Deno.makeTempDir();
    const repo = new URL('../../../', import.meta.url);
    const fixture = 'packages/plugin-sagas-core/tests/fixtures/transition-store/';
    try {
      const commandSchema = await Deno.readTextFile(
        'packages/database/tests/fixtures/command-store/schema.prisma',
      );
      const sagaSchema = await Deno.readTextFile('plugins/sagas/database/sagas.prisma');
      await Deno.writeTextFile(temp + '/schema.prisma', commandSchema + '\n' + sagaSchema);
      const generated = await new Deno.Command(Deno.execPath(), {
        args: [
          'run',
          '--no-lock',
          '-A',
          'npm:prisma@7.8.0',
          'generate',
          '--schema',
          temp + '/schema.prisma',
        ],
        stdout: 'piped',
        stderr: 'piped',
      }).output();
      assertEquals(generated.code, 0, new TextDecoder().decode(generated.stderr));
      const source = await Deno.readTextFile(fixture + 'postgres-conformance.ts.template');
      await Deno.writeTextFile(
        temp + '/postgres-conformance_test.ts',
        source.replaceAll('REPO_URL', repo.href),
      );
      const rootConfig = JSON.parse(await Deno.readTextFile('deno.json'));
      const imports: Record<string, string> = { ...rootConfig.imports };
      for (const [key, version] of Object.entries(rootConfig.catalog)) {
        imports[key] = 'npm:' + key + '@' + version;
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
              typeof specifier === 'string' && !specifier.startsWith('./') &&
              !specifier.startsWith('../')
            ) {
              imports[key] = specifier === 'catalog:'
                ? 'npm:' + key + '@' + rootConfig.catalog[key]
                : specifier;
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
      imports['@prisma/client'] = 'npm:@prisma/client@7.8.0';
      await Deno.writeTextFile(
        temp + '/deno.json',
        JSON.stringify({
          compilerOptions: { strict: true, isolatedDeclarations: false },
          catalog: rootConfig.catalog,
          imports,
        }),
      );
      const filter = Deno.env.get('SAGA_POSTGRES_TEST_FILTER');
      const tested = await new Deno.Command(Deno.execPath(), {
        args: [
          'test',
          '--no-lock',
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
      const evidence = Deno.env.get('SAGA_POSTGRES_EVIDENCE');
      if (evidence) await Deno.writeTextFile(evidence, raw);
      assertEquals(tested.code, 0, raw);
    } finally {
      await Deno.remove(temp, { recursive: true });
    }
  },
});
