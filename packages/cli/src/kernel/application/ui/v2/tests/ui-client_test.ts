import { assert, assertEquals, assertRejects } from '@std/assert';
import { UiConfigSchema } from '../../../../domain/ui/ui-config.ts';
import { createUiRegistryClient } from '../registry-client.ts';

Deno.test('namespaced dependency names stay in their registry and fetch each source once', async () => {
  const calls: string[] = [];
  const config = UiConfigSchema.parse({
    registries: {
      '@acme': {
        url: 'https://example.com/r/{name}.json',
        headers: { Authorization: 'Bearer ${ACME_TOKEN}' },
      },
    },
  });
  const client = await createUiRegistryClient(config, {
    transport: {
      read: (url, headers) => {
        calls.push(url);
        assertEquals(headers.Authorization, 'Bearer ${ACME_TOKEN}');
        const name = url.endsWith('x.json') ? 'x' : 'helper';
        return Promise.resolve(
          JSON.stringify({
            name,
            type: 'registry:ui',
            registryDependencies: name === 'x' ? ['helper'] : [],
            files: [{
              path: `${name}.ts`,
              type: 'registry:ui',
              content: `export const ${name} = 1;`,
            }],
          }),
        );
      },
    },
  });
  const items = await client.resolve(['@acme/x', '@acme/helper']);
  assertEquals(items.map((entry) => entry.ref), ['@acme/helper', '@acme/x']);
  assertEquals(calls, ['https://example.com/r/x.json', 'https://example.com/r/helper.json']);
});

Deno.test('registry resolver rejects dependency cycles and invalid item JSON without writes', async () => {
  const client = await createUiRegistryClient(UiConfigSchema.parse({}), {
    builtin: () =>
      Promise.resolve({
        registry: {
          items: [
            { name: 'x', type: 'registry:ui', registryDependencies: ['y'] },
            { name: 'y', type: 'registry:ui', registryDependencies: ['x'] },
          ],
        },
        content: {},
      }),
  });
  await assertRejects(() => client.resolve(['x']), Error, 'cycle');
  const broken = await createUiRegistryClient(
    UiConfigSchema.parse({ registries: { '@bad': 'https://example.com/{name}.json' } }),
    {
      transport: { read: () => Promise.resolve('{"name":"x","type":"invalid"}') },
    },
  );
  await assertRejects(() => broken.item('@bad/x'), Error, 'Invalid registry item');
  const credential = crypto.randomUUID();
  const reflected = await createUiRegistryClient(
    UiConfigSchema.parse({ registries: { '@acme': 'https://example.com/{name}.json' } }),
    {
      transport: { read: () => Promise.resolve(`invalid JSON reflecting ${credential}`) },
    },
  );
  const error = await assertRejects(() => reflected.item('@acme/x'), Error, 'not valid JSON');
  assert(!String(error).includes(credential));
});
