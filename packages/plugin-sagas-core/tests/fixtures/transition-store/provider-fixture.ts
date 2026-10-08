import { assertEquals } from '@std/assert';

type ProviderFixtureProfile = Readonly<
  { repo: URL; source: string; filterEnv: string; evidenceEnv: string; cohort?: string }
>;

/** Compile a consumer-owned generated client and exercise the real provider with current workspace APIs. */
export async function runSagaProviderFixture(profile: ProviderFixtureProfile): Promise<void> {
  const temp = await Deno.makeTempDir();
  const repo = profile.repo;

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
    const cohortUrl = profile.cohort ? await prepareCohort(temp, profile.cohort) : '';
    const source = await Deno.readTextFile(profile.source);
    await Deno.writeTextFile(
      temp + '/postgres-conformance_test.ts',
      source.replaceAll('REPO_URL', repo.href).replaceAll('C5_URL', cohortUrl),
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
    if (profile.cohort) {
      imports['@netscript/database/commands'] = cohortUrl + 'packages/database/commands.ts';
      imports['@netscript/service/commands/relay'] = cohortUrl +
        'packages/service/commands-relay.ts';
      imports['@c5/database/postgres'] = cohortUrl + 'packages/database/commands-postgres.ts';
      imports['@c5/workers/commands'] = cohortUrl + 'packages/plugin-workers-core/commands.ts';
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
    const filter = Deno.env.get(profile.filterEnv);
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
    const evidence = Deno.env.get(profile.evidenceEnv);
    if (evidence) await Deno.writeTextFile(evidence, raw);
    assertEquals(tested.code, 0, raw);
  } finally {
    await Deno.remove(temp, { recursive: true });
  }
}

async function prepareCohort(temp: string, pin: string): Promise<string> {
  const exists = await new Deno.Command('git', {
    args: ['cat-file', '-e', pin + '^{commit}'],
    stdout: 'null',
    stderr: 'null',
  }).output();
  if (exists.code !== 0) {
    const fetched = await new Deno.Command('git', {
      args: ['fetch', '--no-tags', 'origin', pin],
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    assertEquals(fetched.code, 0, new TextDecoder().decode(fetched.stderr));
  }
  const archive = await new Deno.Command('git', {
    args: ['archive', '--format=tar', '--output=' + temp + '/cohort.tar', pin],
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  assertEquals(archive.code, 0, new TextDecoder().decode(archive.stderr));
  await Deno.mkdir(temp + '/cohort');
  const extracted = await new Deno.Command('tar', {
    args: ['-xf', temp + '/cohort.tar', '-C', temp + '/cohort'],
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  assertEquals(extracted.code, 0, new TextDecoder().decode(extracted.stderr));
  // The cohort supplies immutable production modules. Its workspace configuration must not
  // register duplicate package names over the current producer's explicit consumer import map.
  await Deno.remove(temp + '/cohort/deno.json');
  for (const parent of ['packages', 'plugins']) {
    for await (const entry of Deno.readDir(temp + '/cohort/' + parent)) {
      if (!entry.isDirectory) continue;
      try {
        await Deno.remove(temp + '/cohort/' + parent + '/' + entry.name + '/deno.json');
      } catch (e) {
        if (!(e instanceof Deno.errors.NotFound)) throw e;
      }
    }
  }
  if (Deno.env.get('SAGA_COHORT_APPLY_MIGRATION') === '1') {
    const bin = Deno.env.get('COMMAND_POSTGRES_BIN');
    const migrated = await new Deno.Command(bin ? bin + '/psql' : 'psql', {
      args: [
        '-h',
        Deno.env.get('COMMAND_POSTGRES_SOCKET')!,
        '-d',
        'postgres',
        '-v',
        'ON_ERROR_STOP=1',
        '-f',
        temp +
        '/cohort/packages/database/tests/fixtures/command-store/relay-acceptance-migration.sql',
      ],
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    assertEquals(migrated.code, 0, new TextDecoder().decode(migrated.stderr));
  }
  return new URL('file://' + temp + '/cohort/').href;
}
