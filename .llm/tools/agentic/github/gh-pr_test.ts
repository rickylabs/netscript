import { assertStringIncludes } from '@std/assert';

Deno.test('gh-pr merge requires terminal current-head IMPL provenance by default', async () => {
  const source = await Deno.readTextFile('.llm/tools/agentic/github/gh-pr.ts');
  assertStringIncludes(source, 'evaluateCurrentHeadImplEvalGate');
  assertStringIncludes(source, 'comment !== null, status, headSha');
  assertStringIncludes(source, 'terminal IMPL PASS for current head ${headSha}');
  assertStringIncludes(source, "gate.blocked === 'no-eval-comment'");
  assertStringIncludes(source, "case '--no-eval-gate':");
});
