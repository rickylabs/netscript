import { assertEquals, assertStringIncludes } from 'jsr:@std/assert@1';
import {
  analyzeZodAlignment,
  type ZodAlignmentInput,
} from './check-zod-alignment.ts';

const aligned: ZodAlignmentInput = {
  catalogZod: '^4.4.3',
  memberImports: [{ path: 'packages/example/deno.json', specifier: 'catalog:' }],
  lockText: JSON.stringify({ npm: { 'zod@4.4.3': {} } }),
  orpcImports: [{ path: 'packages/example/mod.ts', specifier: '@orpc/zod/zod4' }],
};

Deno.test('zod alignment accepts one catalogued npm v4 instance', () => {
  assertEquals(analyzeZodAlignment(aligned), {
    findings: [],
    resolvedInstances: ['zod@4.4.3'],
  });
});

Deno.test('zod alignment rejects a second or v3 lock instance', () => {
  const report = analyzeZodAlignment({
    ...aligned,
    lockText: JSON.stringify({
      npm: { 'zod@3.25.76': {}, 'zod@4.4.3': {} },
    }),
  });
  assertEquals(report.findings[0]?.code, 'LOCK_INSTANCE');
  assertStringIncludes(report.findings[0]?.message ?? '', 'zod@3.25.76, zod@4.4.3');
});

Deno.test('zod alignment rejects JSR and inline member specifiers', () => {
  const report = analyzeZodAlignment({
    ...aligned,
    memberImports: [{
      path: 'packages/example/deno.json',
      specifier: 'jsr:@zod/zod@4.4.3',
    }],
    lockText: JSON.stringify({
      specifiers: { 'jsr:@zod/zod@4.4.3': '4.4.3' },
      npm: { 'zod@4.4.3': {} },
    }),
  });
  assertEquals(report.findings.map((finding) => finding.code), [
    'MEMBER_SPECIFIER',
    'LOCK_INSTANCE',
  ]);
});

Deno.test('zod alignment rejects the oRPC compatibility root surface', () => {
  const report = analyzeZodAlignment({
    ...aligned,
    orpcImports: [{ path: 'packages/example/mod.ts', specifier: '@orpc/zod' }],
  });
  assertEquals(report.findings[0]?.code, 'ORPC_SURFACE');
});
