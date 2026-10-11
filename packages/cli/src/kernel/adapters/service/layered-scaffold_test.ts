import { assert, assertEquals, assertThrows } from '@std/assert';
import { MemoryFileSystemAdapter } from '../scaffold/memory-fs.ts';
import { Scaffolder } from '../scaffold/scaffolder.ts';
import { StringTemplateAdapter } from '../scaffold/template-adapter.ts';
import { ServiceScaffolder } from './scaffolder.ts';
import golden from './fixtures/collapsed-service.json' with { type: 'json' };

function assertThinRouter(source: string): void {
  assert(
    !/@database|\b(?:db|database|delegate)\s*\.|\.(?:findMany|findUnique|count|slice)\s*\(|SORTABLE_FIELDS|\b(?:skip|take|orderBy|sortBy|sortOrder)\b|Math\.ceil/
      .test(source),
    'Router must only bind use-cases and map transport errors',
  );
}

function assertTestModule(files: readonly string[]): void {
  assert(files.some((path) => /src\/.*_test\.ts$/.test(path)), 'Test task needs a test module');
}

for (const variant of ['prisma', 'memory'] as const) {
  Deno.test(`collapsed ${variant} scaffold matches the golden tree and has a runnable test target`, async () => {
    const fs = new MemoryFileSystemAdapter();
    const templates = new StringTemplateAdapter(fs);
    const scaffolder = new ServiceScaffolder(new Scaffolder(templates, fs), fs, templates);
    const result = await scaffolder.scaffold({
      projectName: 'layered-proof',
      serviceName: 'team-members',
      modelName: 'TeamMember',
      targetPath: '/project',
      servicePort: 3000,
      hasDatabase: variant === 'prisma',
      importMode: 'jsr',
      force: false,
    });
    const files = result.scaffoldResult.filesCreated.map((path) =>
      path.replace('/project/services/team-members/', '').replaceAll('\\', '/')
    ).sort();
    assertEquals(files, golden[variant]);
    assertTestModule(files);
    assertThinRouter(await fs.readFile('/project/services/team-members/src/routers/v1.ts'));
    const config = JSON.parse(await fs.readFile('/project/services/team-members/deno.json'));
    assertEquals(config.tasks.test, 'deno test -A src/');
    const repeated = await scaffolder.scaffold({
      projectName: 'layered-proof',
      serviceName: 'team-members',
      modelName: 'TeamMember',
      targetPath: '/project',
      servicePort: 3000,
      hasDatabase: variant === 'prisma',
      importMode: 'jsr',
      force: false,
    });
    assertEquals(repeated.scaffoldResult.filesCreated, []);
    assertEquals(repeated.scaffoldResult.filesSkipped.length, golden[variant].length);
  });
}

Deno.test('negative golden guard rejects ORM calls, delegate calls, pagination and sort policy', async () => {
  for (const template of ['v1.ts.template', 'v1.memory.ts.template']) {
    const source = await Deno.readTextFile(
      new URL(`../../assets/service/routers/${template}`, import.meta.url),
    );
    assertThinRouter(source);
    for (
      const mutation of [
        'db.user.findMany()',
        'delegate.count()',
        'records.slice(0, 10)',
        'const skip = 10',
        'const SORTABLE_FIELDS = []',
      ]
    ) {
      assertThrows(() => assertThinRouter(`${source}\n${mutation}`));
    }
  }
});

Deno.test('negative golden guard rejects a test task whose tree has no test module', () => {
  assertThrows(() => assertTestModule(['src/main.ts', 'src/routers/v1.ts']));
});

Deno.test('consumer layout documents the vocabulary, collapse table and migration', async () => {
  const page = await Deno.readTextFile(
    new URL('../../../../../../docs/site/services-sdk/service-layout.md', import.meta.url),
  );
  for (
    const term of [
      'src/domain/',
      'src/application/',
      'src/ports/',
      'src/adapters/',
      'src/routers/',
      'src/auth/',
      'tests/',
      '## Collapse decision table',
      '## Migrate an existing service',
      '#2113',
    ]
  ) {
    assert(page.includes(term), `Missing service layout guidance: ${term}`);
  }
});
