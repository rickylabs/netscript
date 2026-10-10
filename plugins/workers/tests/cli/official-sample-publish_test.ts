import { assertEquals } from '@std/assert';
import { fromFileUrl, join, toFileUrl } from '@std/path';
import { writeOfficialSampleConfiguration } from '../../src/cli/official-sample-configuration.ts';

const repositoryRoot = fromFileUrl(new URL('../../../..', import.meta.url));

Deno.test('emitted create-user-settings job fails when sagas-api is unreachable', async () => {
  const projectRoot = await Deno.makeTempDir({ prefix: 'netscript-sample-publish-' });
  try {
    await Deno.mkdir(join(projectRoot, 'workers'));
    await Deno.mkdir(join(projectRoot, 'sagas'));
    await writeOfficialSampleConfiguration({ projectRoot, force: false });

    // Resolve only the publisher import through a fixture that injects its existing IO ports.
    // The generated job and the real publisher implementation execute without source rewriting.
    const fixture = join(projectRoot, 'publisher-fixture.ts');
    await Deno.writeTextFile(
      fixture,
      `import { createSagaPublisher as createHttpPublisher } from ${
        JSON.stringify(
          toFileUrl(join(repositoryRoot, 'plugins/sagas/src/runtime/saga-publisher.ts')),
        )
      };
import type { SagaMessage } from '@netscript/plugin-sagas-core/domain';
import { assertEquals } from '@std/assert';

export let fetchCalls = 0;
export function createSagaPublisher<TMessage extends SagaMessage>() {
  return createHttpPublisher<TMessage>({
    readEnv: (name) => name === 'services__sagas-api__http__0'
      ? 'https://example.invalid' : undefined,
    fetcher: (input, init) => {
      fetchCalls += 1;
      assertEquals(String(input), 'https://example.invalid/api/v1/sagas/publish');
      assertEquals(init?.method, 'POST');
      assertEquals(JSON.parse(String(init?.body)), {
        type: 'UserSettingsCreated', payload: { userId: 'user-unreachable' },
      });
      return Promise.reject(new TypeError('sagas-api connection refused'));
    },
  });
}
`,
    );
    const importMap = join(projectRoot, 'import-map.json');
    const rootConfig = JSON.parse(await Deno.readTextFile(join(repositoryRoot, 'deno.json'))) as {
      catalog: Readonly<Record<string, string>>;
    };
    await Deno.writeTextFile(
      importMap,
      JSON.stringify({
        imports: {
          '@netscript/plugin-sagas/runtime': toFileUrl(fixture).href,
          '@std/assert': 'jsr:@std/assert@^1',
          zod: `npm:zod@${rootConfig.catalog.zod}`,
        },
      }),
    );
    const script = `import { assertEquals } from '@std/assert';
import handler from ${
      JSON.stringify(toFileUrl(join(projectRoot, 'plugins/workers/jobs/create-user-settings.ts')))
    };
import { fetchCalls } from ${JSON.stringify(toFileUrl(fixture))};

assertEquals(handler.id, 'create-user-settings');
const result = await handler({
  id: 'sample-publish-unreachable',
  payload: { userId: 'user-unreachable' },
  signal: new AbortController().signal,
});
assertEquals(fetchCalls, 1);
assertEquals(result, {
  success: false,
  error: 'Saga publish rejected: sagas-api connection refused',
  data: { userId: 'user-unreachable', retryable: true },
});
`;
    const output = await new Deno.Command(Deno.execPath(), {
      args: [
        'eval',
        '--unstable-kv',
        '--no-lock',
        '--config',
        join(repositoryRoot, 'deno.json'),
        '--import-map',
        importMap,
        script,
      ],
      cwd: repositoryRoot,
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    assertEquals(output.code, 0, new TextDecoder().decode(output.stderr));
  } finally {
    await Deno.remove(projectRoot, { recursive: true });
  }
});
