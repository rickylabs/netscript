import { assert, assertEquals, assertRejects, assertStringIncludes } from '@std/assert';
import { fromFileUrl, join } from '@std/path';
import { applyShowcasePreset } from '../../../kernel/domain/scaffold/showcase-preset.ts';
import type { InitOptions } from '../../../kernel/domain/scaffold/scaffold-options.ts';

const defaults: InitOptions = {
  name: 'northwind',
  importMode: 'local',
  force: false,
  ci: true,
  yes: true,
  dryRun: false,
  noGit: true,
  noAspire: false,
};

Deno.test('showcase is explicit and rejects incompatible choices before effects', async () => {
  assertEquals(applyShowcasePreset(defaults), defaults);
  const preset = applyShowcasePreset({ ...defaults, from: 'showcase' });
  assertEquals([preset.serviceName, preset.modelName, preset.dbEngine], [
    'orders',
    'Order',
    'sqlite',
  ]);
  for (
    const invalid of [{ noAspire: true }, { dbEngine: 'none' as const }, {
      serviceName: 'customers',
    }]
  ) {
    await assertRejects(() =>
      Promise.resolve().then(() =>
        applyShowcasePreset({ ...defaults, from: 'showcase', ...invalid })
      )
    );
  }
});

Deno.test('documented showcase init emits the complete recipe without extra wiring', async () => {
  const repository = fromFileUrl(new URL('../../../../../../', import.meta.url));
  const parent = join(repository, '.llm/tmp', `showcase-recipe-${crypto.randomUUID()}`);
  try {
    const result = await new Deno.Command(Deno.execPath(), {
      args: [
        'run',
        '-A',
        'packages/cli/bin/netscript-dev.ts',
        'init',
        'northwind',
        '--from',
        'showcase',
        '--app-name',
        'portal',
        '--path',
        parent,
        '--ci',
        '--yes',
        '--no-git',
      ],
      cwd: repository,
      stdin: 'null',
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    assertEquals(result.code, 0, new TextDecoder().decode(result.stderr));
    const target = join(parent, 'northwind');
    const config = JSON.parse(await Deno.readTextFile(join(target, 'deno.json')));
    assert(config.tasks['showcase:setup'], 'The documented setup task must exist');
    const schema = await Deno.readTextFile(join(target, 'database/sqlite/schema/schema.prisma'));
    for (const model of ['Order', 'Customer', 'Product', 'OrderLine']) {
      assertStringIncludes(schema, `model ${model} {`);
    }
    const detail = await Deno.readTextFile(join(target, 'apps/portal/routes/orders/[id].tsx'));
    assertStringIncludes(detail, 'OrderWorkflow');
    const setup = await Deno.readTextFile(join(target, 'showcase/setup.ts'));
    for (const plugin of ['workers', 'sagas', 'triggers', 'streams']) {
      assertStringIncludes(setup, `'${plugin}'`);
    }
    assertStringIncludes(setup, "run('db', 'seed')");
    assertStringIncludes(
      await Deno.readTextFile(join(target, 'contracts/commerce.contract.ts')),
      'commerceContract',
    );
  } finally {
    await Deno.remove(parent, { recursive: true }).catch(() => {});
  }
});
