import { assertEquals, assertStringIncludes } from '@std/assert';
import type {
  JsdocDeferredExample,
  JsdocExampleCensus,
  JsdocExampleOwner,
} from './jsdoc-example-contract.ts';
import { formatDeferredClassesMarkdown } from './check-jsdoc-examples.ts';
import {
  classifyJsdocExampleTag,
  JSDOC_EXAMPLE_RATCHET,
  jsdocExampleRatchetFailures,
} from './jsdoc-example-policy.ts';

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

Deno.test('deferred body classes are classifier-owned and cannot grow', () => {
  const census: JsdocExampleCensus = {
    members: 35,
    files: 2020,
    examples: JSDOC_EXAMPLE_RATCHET.minimumExamples,
    candidates: JSDOC_EXAMPLE_RATCHET.minimumCandidates,
    checked: JSDOC_EXAMPLE_RATCHET.minimumChecked,
    exempt: 0,
    nonTypeScript: 1,
    unfenced: 0,
    malformed: 0,
    failures: 0,
  };
  const deferred = (failureClass: JsdocDeferredExample['failureClass']): JsdocDeferredExample => ({
    failureClass,
    owner: moduleOwner,
    exampleOrdinal: 1,
    fenceOrdinal: 1,
    tsCodes: failureClass === 'unboundName' ? [2304] : [2345],
  });
  const accepted = [
    ...Array.from(
      { length: JSDOC_EXAMPLE_RATCHET.maximumDeferredUnboundName },
      () => deferred('unboundName'),
    ),
    ...Array.from(
      { length: JSDOC_EXAMPLE_RATCHET.maximumDeferredTypeError },
      () => deferred('typeError'),
    ),
  ];
  assertEquals(jsdocExampleRatchetFailures(census, accepted), []);
  assertEquals(jsdocExampleRatchetFailures(census, accepted.slice(0, -1)), []);
  assertEquals(jsdocExampleRatchetFailures(census, [...accepted, deferred('typeError')]), [
    `deferred typeError ${
      JSDOC_EXAMPLE_RATCHET.maximumDeferredTypeError + 1
    } > ${JSDOC_EXAMPLE_RATCHET.maximumDeferredTypeError}`,
  ]);
});

Deno.test('deferred-class artifact preserves owner, ordinals, and classifier TS codes', () => {
  const rendered = formatDeferredClassesMarkdown([{
    failureClass: 'unboundName',
    owner: moduleOwner,
    exampleOrdinal: 2,
    fenceOrdinal: 3,
    tsCodes: [2304, 2552],
  }]);
  assertStringIncludes(rendered, '## Unbound-name convention class — 1 examples');
  assertStringIncludes(
    rendered,
    '- packages/cron/ports/types.ts · module @netscript/cron · example 2 · fence 3 · TS2304, TS2552',
  );
  assertStringIncludes(rendered, '## Published-API type-error class — 0 examples');
});
