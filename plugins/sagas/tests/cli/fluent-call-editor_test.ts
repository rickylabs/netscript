import { assertStringIncludes } from '@std/assert';
import { upsertFluentCall } from '../../src/cli/fluent-call-editor.ts';

Deno.test('upsertFluentCall ignores method lookalikes in comments and strings', () => {
  const source = `const warning = '.topic("wrong")';
// .topic('also-wrong')
export default defineSagaConfig('checkout', './checkout.ts')
  .name('Checkout')
  .build();
`;
  const updated = upsertFluentCall(source, {
    anchor: 'defineSagaConfig',
    method: 'topic',
    argument: JSON.stringify('orders'),
  });

  assertStringIncludes(updated, `const warning = '.topic("wrong")';`);
  assertStringIncludes(updated, `// .topic('also-wrong')`);
  assertStringIncludes(updated, `.topic("orders")\n  .build()`);
});

Deno.test('upsertFluentCall replaces nested call arguments as one syntax span', () => {
  const source = `export default defineSagaConfig('checkout', './checkout.ts')
  .tags(...makeTags('old', nested('value')))
  .build();
`;
  const updated = upsertFluentCall(source, {
    anchor: 'defineSagaConfig',
    method: 'tags',
    argument: '...["new","durable"]',
  });

  assertStringIncludes(updated, `.tags(...["new","durable"])`);
});
