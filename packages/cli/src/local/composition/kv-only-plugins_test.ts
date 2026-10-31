/** Generated consumer regression: no runtime resources are started by ordinary tests. */
import { assertRejects } from '@std/assert';
import { installDefinitions } from '../../../e2e/fixtures/kv-only/definitions.ts';
import { join } from '@std/path';
import {
  assertNoDatabase,
  checkGenerated,
  cli,
  REPO,
  scaffoldKvConsumer,
} from '../../../e2e/fixtures/kv-only/scaffold.ts';

Deno.test('workers, sagas, triggers and kv-oauth generate and diagnose without a database', async () => {
  // Maintainer init resolves source ownership from a destination beneath the checkout.
  const parent = join(REPO, '.llm/tmp', `kv-only-${crypto.randomUUID()}`);
  await Deno.mkdir(parent, { recursive: true });
  try {
    const root = await scaffoldKvConsumer(parent);
    await installDefinitions(root);
    await cli(['generate', 'plugins', '--project-root', root]);
    await checkGenerated(root);
    const path = join(root, 'appsettings.json');
    const original = await Deno.readTextFile(path);
    const settings = JSON.parse(original);
    settings.NetScript.BackgroundProcessors.sagas.RequiresDb = true;
    await Deno.writeTextFile(path, JSON.stringify(settings));
    await assertRejects(() => assertNoDatabase(root));
    await Deno.writeTextFile(path, original);
    const helper = join(root, 'aspire/.helpers/register-background.mts');
    const source = await Deno.readTextFile(helper);
    await Deno.writeTextFile(helper, `${source}\nconst unusedDatabaseUrl = 'control';\n`);
    await assertRejects(() => checkGenerated(root), Error, 'exited 1');
    await Deno.writeTextFile(helper, source);
    await assertNoDatabase(root);
  } finally {
    await Deno.remove(parent, { recursive: true });
  }
});
