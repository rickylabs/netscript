import { assertEquals, assertStringIncludes } from '@std/assert';
import type { JsdocExampleOwner } from './jsdoc-example-contract.ts';
import { formatTypeErrorsMarkdown } from './check-jsdoc-examples.ts';
import { classifyJsdocExampleTag, JSDOC_EXAMPLE_RATCHET } from './jsdoc-example-policy.ts';

const moduleOwner: JsdocExampleOwner = {
  memberName: '@netscript/cron',
  memberRoot: 'packages/cron',
  sourcePath: 'packages/cron/ports/types.ts',
  kind: 'module',
};

Deno.test('a bare JSDoc example fence is malformed rather than silently unchecked', () => {
  const result = classifyJsdocExampleTag('```\ncron expression\n```', moduleOwner, 1);
  assertEquals(result.blocks.length, 0);
  assertEquals(result.findings[0]?.disposition, 'malformed');
  assertStringIncludes(result.findings[0]?.reason ?? '', 'no language');
});

Deno.test('explicitly labelled non-TypeScript fences remain attributable', () => {
  const result = classifyJsdocExampleTag('```text\ncron expression\n```', moduleOwner, 1);
  assertEquals(result.blocks.length, 0);
  assertEquals(result.findings[0]?.disposition, 'nonTypeScript');
  assertEquals(result.findings[0]?.reason, 'text');
});

Deno.test('reasoned TypeScript exemption is source local', () => {
  const result = classifyJsdocExampleTag(
    '```ts no-check:illustrates generated application wiring\nconst app = generatedApp;\n```',
    moduleOwner,
    2,
  );
  assertEquals(result.blocks.length, 1);
  assertEquals(result.blocks[0]?.exemptionReason, 'illustrates generated application wiring');
  assertEquals(result.findings[0]?.disposition, 'exempt');
});

Deno.test('type errors have no deferred ceiling: every failure is enforced', () => {
  assertEquals(Object.hasOwn(JSDOC_EXAMPLE_RATCHET, 'maximumDeferredTypeError'), false);
});

Deno.test('unbound names have no deferred ceiling: the class is enforced, not ratcheted', () => {
  assertEquals(Object.hasOwn(JSDOC_EXAMPLE_RATCHET, 'maximumDeferredUnboundName'), false);
  assertEquals(formatTypeErrorsMarkdown([]).includes('Unbound-name'), false);
});

Deno.test('type-error artifact preserves owner, ordinals, and classifier TS codes', () => {
  const rendered = formatTypeErrorsMarkdown([{
    failureClass: 'typeError',
    owner: moduleOwner,
    exampleOrdinal: 2,
    fenceOrdinal: 3,
    tsCodes: [2322, 2345],
  }]);
  assertStringIncludes(rendered, '## Published-API type-error class — 1 examples');
  assertStringIncludes(
    rendered,
    '- packages/cron/ports/types.ts · module @netscript/cron · example 2 · fence 3 · TS2322, TS2345',
  );
});
