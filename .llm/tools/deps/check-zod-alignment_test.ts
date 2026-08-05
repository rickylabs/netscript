import { assertEquals, assertStringIncludes } from 'jsr:@std/assert@1';
import { analyzeZodAlignment, type ZodAlignmentInput } from './check-zod-alignment.ts';

const aligned: ZodAlignmentInput = {
  catalogZod: '^4.4.3',
  memberImports: [{ path: 'packages/example/deno.json', specifier: 'catalog:' }],
  lockText: JSON.stringify({
    jsr: {
      '@olli/kvdex@3.6.7': { dependencies: ['npm:zod@^3.24.0'] },
    },
    npm: {
      '@ag-ui/core@0.0.52': { dependencies: ['zod@3.25.76'] },
      '@anthropic-ai/sdk@0.97.1_zod@4.4.3': { dependencies: ['zod@4.4.3'] },
      '@modelcontextprotocol/sdk@1.29.0_zod@4.4.3': { dependencies: ['zod@4.4.3'] },
      'openai@6.45.0_zod@4.4.3': { dependencies: ['zod@4.4.3'] },
      'zod-to-json-schema@3.25.2_zod@4.4.3': { dependencies: ['zod@4.4.3'] },
      'zod@3.25.76': {},
      'zod@4.4.3': {},
    },
  }),
  orpcImports: [{ path: 'packages/example/mod.ts', specifier: '@orpc/zod/zod4' }],
};

Deno.test('zod alignment accepts npm v4 plus the documented residual v3 boundary', () => {
  assertEquals(analyzeZodAlignment(aligned), {
    findings: [],
    resolvedInstances: ['zod@3.25.76', 'zod@4.4.3'],
  });
});

Deno.test('zod alignment rejects a second or v3 lock instance', () => {
  const report = analyzeZodAlignment({
    ...aligned,
    lockText: JSON.stringify({
      npm: {
        '@anthropic-ai/sdk@0.97.1_zod@3.25.76': { dependencies: ['zod@3.25.76'] },
        'zod@3.25.76': {},
        'zod@4.4.3': {},
      },
    }),
  });
  assertEquals(report.findings[0]?.code, 'LOCK_INSTANCE');
  assertStringIncludes(report.findings[0]?.message ?? '', 'v3 parents');
});

Deno.test('zod alignment rejects JSR and inline member specifiers', () => {
  const report = analyzeZodAlignment({
    ...aligned,
    memberImports: [{
      path: 'packages/example/deno.json',
      specifier: 'jsr:@zod/zod@4.4.3',
    }],
  });
  assertEquals(report.findings.map((finding) => finding.code), ['MEMBER_SPECIFIER']);
});

Deno.test('zod alignment rejects source that emits a JSR Zod manifest', () => {
  const report = analyzeZodAlignment({
    ...aligned,
    legacyJsrUses: ['packages/cli/src/template.ts'],
  });
  assertEquals(report.findings[0]?.code, 'MEMBER_SPECIFIER');
});

Deno.test('zod alignment rejects an AI or MCP package resolving through v3', () => {
  const report = analyzeZodAlignment({
    ...aligned,
    lockText: aligned.lockText.replace(
      '@modelcontextprotocol/sdk@1.29.0_zod@4.4.3',
      '@modelcontextprotocol/sdk@1.29.0_zod@3.25.76',
    ).replace(
      '"@modelcontextprotocol/sdk@1.29.0_zod@3.25.76":{"dependencies":["zod@4.4.3"]}',
      '"@modelcontextprotocol/sdk@1.29.0_zod@3.25.76":{"dependencies":["zod@3.25.76"]}',
    ),
  });
  assertEquals(report.findings.some((finding) => finding.code === 'PEER_CLUSTER'), true);
});

Deno.test('zod alignment rejects the oRPC compatibility root surface', () => {
  const report = analyzeZodAlignment({
    ...aligned,
    orpcImports: [{ path: 'packages/example/mod.ts', specifier: '@orpc/zod' }],
  });
  assertEquals(report.findings[0]?.code, 'ORPC_SURFACE');
});
