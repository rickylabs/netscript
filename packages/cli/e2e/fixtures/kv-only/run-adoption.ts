/** Opt-in KV-only acceptance; ordinary tests never launch this AppHost. @module */
import { join, resolve } from '@std/path';
import { assertNoDatabase, checkGenerated, cli, scaffoldKvConsumer } from './scaffold.ts';
import { installDefinitions } from './definitions.ts';
import { aspire, healthyResources, proveJobAndTrigger, proveSaga } from './runtime.ts';

/** Run the real generated consumer and write a public-safe receipt, even on failure. */
export async function runAdoption(parent: string): Promise<void> {
  const receipt: Record<string, unknown> = {
    issue: 2108,
    packageSource: 'local',
    ok: false,
  };
  let root = join(resolve(parent), 'kv-only-consumer');
  let started = false;
  let stage = 'scaffold';
  const previousAuthKey = Deno.env.get('NETSCRIPT_AUTH_KV_OAUTH_KEY');
  try {
    console.info('KV-only proof: scaffold');
    root = await scaffoldKvConsumer(parent);
    Object.assign(receipt, {
      scaffold: 'PASS',
      generate: 'PASS',
      doctor: 'PASS',
      noDatabase: 'PASS',
    });
    stage = 'definitions';
    await installDefinitions(root);
    // Deliberately public test material, identical to the existing guarded-auth probes.
    // This fixture attests backend startup, not a production OAuth provider or login.
    // Credentials are supplied through the subprocess environment, never config literals.
    Deno.env.set(
      'NETSCRIPT_AUTH_KV_OAUTH_KEY',
      btoa(String.fromCharCode(...new Uint8Array(32).fill(7))),
    );
    await cli(['generate', 'plugins', '--project-root', root]);
    await cli(['generate', 'runtime-schemas', '--project-root', root]);
    await cli(['plugin', 'doctor', '--project-root', root]);
    await assertNoDatabase(root);
    stage = 'generated-quality';
    await aspire(root, ['restore']);
    await checkGenerated(root, true);
    receipt.generatedQuality = 'PASS';
    stage = 'aspire-start';
    console.info('KV-only proof: start Aspire');
    started = true;
    await aspire(root, ['start', '--isolated']);
    stage = 'resource-health';
    receipt.resources = await healthyResources(root);
    receipt.backgroundReadiness = 'PASS';
    stage = 'job-and-trigger';
    console.info('KV-only proof: job and trigger');
    receipt.workflows = await proveJobAndTrigger(root);
    stage = 'saga-and-detached-runner';
    console.info('KV-only proof: saga and detached runner');
    receipt.saga = await proveSaga(root);
    receipt.finalResources = await healthyResources(root);
    receipt.ok = true;
  } catch (error) {
    receipt.failedStage = stage;
    if (started) {
      // Preserve local diagnostics before scoped teardown; they never enter the public receipt.
      const directory = join(root, '.netscript/e2e');
      await Deno.mkdir(directory, { recursive: true });
      for (const name of ['auth', 'workers', 'sagas', 'triggers']) {
        const logs = await aspire(root, ['logs', name, '-n', '100']).catch(() =>
          'Logs unavailable'
        );
        await Deno.writeTextFile(join(directory, `${name}-failure.log`), logs);
      }
    }
    throw error;
  } finally {
    if (previousAuthKey === undefined) Deno.env.delete('NETSCRIPT_AUTH_KV_OAUTH_KEY');
    else Deno.env.set('NETSCRIPT_AUTH_KV_OAUTH_KEY', previousAuthKey);
    if (started) {
      await aspire(root, ['stop']);
      receipt.cleanup = 'PASS';
    }
    await Deno.writeTextFile(
      join(resolve(parent), 'kv-only-receipt.json'),
      JSON.stringify(receipt, null, 2) + '\n',
    );
  }
}

if (import.meta.main) {
  if (!Deno.args[0]) throw new Error('Usage: run-adoption.ts <parent beneath this checkout>');
  await runAdoption(Deno.args[0]);
}
