import { assertEquals, assertStringIncludes, assertThrows } from '@std/assert';
import { AstExtractor, RegistryEmitter } from '../../src/sdk/mod.ts';

Deno.test('core-only saga discovery uses metadata owned by the factory without a saga service', async () => {
  const declaration = await Deno.readTextFile(
    new URL('../../../plugin-sagas-core/src/builders/define-saga.ts', import.meta.url),
  );
  const contributions = await new AstExtractor().extract([
    { path: 'packages/plugin-sagas-core/define-saga.ts', text: declaration },
    {
      path: 'app/onboarding.ts',
      text: `import { defineSaga } from '@netscript/plugin-sagas-core';
export const onboarding = defineSaga('onboarding').state({ status: 'pending' })
  .on('created', () => []).build();`,
    },
  ]);
  assertEquals(contributions, [{ file: 'app/onboarding.ts', symbol: 'onboarding', axis: 'sagas' }]);
  const emissions = await new RegistryEmitter().emit(contributions);
  assertEquals(emissions.map((emission) => emission.path), [
    '.netscript/generated/sagas.registry.ts',
  ]);
  assertStringIncludes(emissions[0].text, 'String(sagas0.id)');
});

Deno.test('stream schema map discovery is explicitly excluded by its factory metadata', async () => {
  const declaration = await Deno.readTextFile(
    new URL('../../../plugin-streams-core/src/builders/define-stream-schema.ts', import.meta.url),
  );
  const contributions = await new AstExtractor().extract([
    { path: 'packages/plugin-streams-core/define-stream-schema.ts', text: declaration },
    {
      path: 'app/schemas.ts',
      text: `import { defineStreamSchema } from '@netscript/plugin-streams-core';
export const first = defineStreamSchema({ invoice: { primaryKey: 'invoiceId' } });
export default defineStreamSchema({ customer: { primaryKey: 'customerId' } });`,
    },
  ]);
  assertEquals(contributions, []);
  assertEquals(await new RegistryEmitter().emit(contributions), []);
});

Deno.test('published core-only host declares saga axis and schema exclusion in walked source', async () => {
  const contributions = await new AstExtractor().extract([
    {
      path: 'discovery.ts',
      text: `export const NETSCRIPT_CONTRIBUTION_BUILDERS = [
  { callee: 'defineSaga', axis: 'sagas' },
  { callee: 'defineStreamSchema', axis: null },
] as const;`,
    },
    {
      path: 'app/definitions.ts',
      text: `import { defineSaga } from '@netscript/plugin-sagas-core';
import { defineStreamSchema } from '@netscript/plugin-streams-core';
export const saga = defineSaga('onboarding').build();
export const schema = defineStreamSchema({});`,
    },
  ]);
  assertEquals(contributions, [{ file: 'app/definitions.ts', symbol: 'saga', axis: 'sagas' }]);
});

Deno.test('metadata repeated by core source and control module is idempotent', async () => {
  const declaration = `export const NETSCRIPT_CONTRIBUTION_BUILDERS = [
  { callee: 'defineSaga', axis: 'sagas' },
  { callee: 'defineStreamSchema', axis: null },
] as const;`;
  assertEquals(
    await new AstExtractor().extract([
      { path: 'core.ts', text: declaration },
      { path: 'plugin.ts', text: declaration },
    ]),
    [],
  );
});

Deno.test('non-registry declarations support options and still reject conflicting axes', async () => {
  assertEquals(
    await new AstExtractor({
      additionalBuilders: [{ callee: 'defineStreamSchema', axis: null }],
    }).extract([{
      path: 'schema.ts',
      text: `import { defineStreamSchema } from '@netscript/plugin-streams-core';
export const schema = defineStreamSchema({});`,
    }]),
    [],
  );
  assertThrows(
    () =>
      new AstExtractor({
        additionalBuilders: [
          { callee: 'defineStreamSchema', axis: null },
          { callee: 'defineStreamSchema', axis: 'schemas' },
        ],
      }),
    TypeError,
    'Duplicate contribution builder callee',
  );
});
