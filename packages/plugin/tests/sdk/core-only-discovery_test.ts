import { assertEquals, assertStringIncludes, assertThrows } from '@std/assert';
import { defineStreamSchema } from '../../../plugin-streams-core/mod.ts';
import { z } from 'zod';
import { AstExtractor, RegistryEmitter } from '../../src/sdk/mod.ts';

Deno.test('core-only saga discovery uses a walked host declaration without a saga service', async () => {
  const declaration = `export const NETSCRIPT_CONTRIBUTION_BUILDERS = [
    { callee: 'defineSaga', axis: 'sagas' },
  ] as const;`;
  const contributions = await new AstExtractor().extract([
    { path: 'discovery.ts', text: declaration },
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

Deno.test('stream schema map discovery is explicitly excluded by a walked host declaration', async () => {
  const schema = defineStreamSchema({
    invoice: {
      schema: z.object({ invoiceId: z.string() }),
      type: 'invoice',
      primaryKey: 'invoiceId',
    },
  });
  assertEquals(Object.keys(schema), ['invoice']);
  assertEquals('id' in schema, false);
  const declaration = `export const NETSCRIPT_CONTRIBUTION_BUILDERS = [
    { callee: 'defineStreamSchema', axis: null },
  ] as const;`;
  const contributions = await new AstExtractor().extract([
    { path: 'discovery.ts', text: declaration },
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

Deno.test('metadata repeated by host and control modules is idempotent', async () => {
  const declaration = `export const NETSCRIPT_CONTRIBUTION_BUILDERS = [
  { callee: 'defineSaga', axis: 'sagas' },
  { callee: 'defineStreamSchema', axis: null },
] as const;`;
  assertEquals(
    await new AstExtractor().extract([
      { path: 'discovery.ts', text: declaration },
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
