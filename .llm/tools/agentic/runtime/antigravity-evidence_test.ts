import { ANTIGRAVITY_CAPABILITIES, classifyAntigravityEvidence } from './antigravity-evidence.ts';
import { assert, assertEquals } from '@std/assert';

Deno.test('finite Antigravity evidence proves exact headless markers without raw output', () => {
  const result = classifyAntigravityEvidence({
    exitCode: 0,
    timedOut: false,
    stdout: 'AGY_HEADLESS_CANARY_OK',
    stderr: '',
    expectedMarker: 'AGY_HEADLESS_CANARY_OK',
    staticCapabilities: [
      'model_flag',
      'agent_flag',
      'project_flag',
      'conversation_flag',
      'sandbox',
    ],
  });
  assertEquals(result.status, 'passed');
  assertEquals(result.evidence.capabilities.headless, 'supported');
  assertEquals(result.evidence.capabilities.structured_output, 'unsupported');
  assertEquals(Object.keys(result.evidence.capabilities), [...ANTIGRAVITY_CAPABILITIES]);
  assertEquals(result.evidence.rawOutputRetained, false);
  assert(!JSON.stringify(result).includes('AGY_HEADLESS_CANARY_OK'));
});

Deno.test('classification fails closed for auth, timeout, quota, and rate limiting', () => {
  const result = classifyAntigravityEvidence({
    exitCode: 1,
    timedOut: true,
    stdout: '',
    stderr: 'authentication service timeout; quota exhausted; rate limit 429',
  });
  assertEquals(result.status, 'blocked');
  assertEquals(result.evidence.failureSignals, [
    'authentication',
    'quota',
    'rate_limited',
    'timeout',
  ]);
  assertEquals(result.diagnostics.map((entry) => [entry.code, entry.ownerIssue]), [
    ['auth_required', undefined],
    ['quota_exhausted', undefined],
    ['rate_limited', undefined],
    ['timeout', undefined],
  ]);
  assert(!JSON.stringify(result).includes('authentication service timeout'));
});

Deno.test('citation metadata strips query, fragment, credentials, duplicates, and raw text', () => {
  const result = classifyAntigravityEvidence({
    exitCode: 0,
    timedOut: false,
    stdout: [
      'Evidence https://example.test/path?account=private#fragment',
      'Duplicate https://example.test/path?other=value',
      'Reject https://user:secret@example.test/private',
    ].join('\n'),
    stderr: '',
  });
  assertEquals(result.evidence.citations, [{ url: 'https://example.test/path', persisted: true }]);
  assertEquals(result.aggregationEligible, true);
  const serialized = JSON.stringify(result);
  for (const forbidden of ['account=private', 'other=value', 'user:secret', 'Evidence ']) {
    assert(!serialized.includes(forbidden), `raw citation content retained: ${forbidden}`);
  }
});

Deno.test('owner acceptance is explicit and does not overwrite observed failure', () => {
  const result = classifyAntigravityEvidence({
    exitCode: 1,
    timedOut: true,
    stdout: '',
    stderr: 'authentication timeout',
    ownerAcceptedCapabilities: ['headless', 'sandbox', 'web_search_fetch', 'citation_persistence'],
  });
  assertEquals(result.status, 'blocked');
  assertEquals(result.evidence.ownerAcceptanceApplied, true);
  assertEquals(result.evidence.capabilities.headless, 'owner_accepted_working');
  assertEquals(result.aggregationEligible, false);
});

Deno.test('AGENTS and GEMINI instruction markers are classified independently', () => {
  const agents = classifyAntigravityEvidence({
    exitCode: 0,
    timedOut: false,
    stdout: 'AGENTS_INSTRUCTION_OK',
    stderr: '',
    expectedInstructionMarker: 'AGENTS',
  });
  const gemini = classifyAntigravityEvidence({
    exitCode: 0,
    timedOut: false,
    stdout: 'GEMINI_INSTRUCTION_OK',
    stderr: '',
    expectedInstructionMarker: 'GEMINI',
  });
  assertEquals(agents.evidence.capabilities.agents_instructions, 'supported');
  assertEquals(agents.evidence.capabilities.gemini_instructions, 'unknown');
  assertEquals(gemini.evidence.capabilities.gemini_instructions, 'supported');
  assertEquals(gemini.evidence.capabilities.agents_instructions, 'unknown');
  assert(!JSON.stringify([agents, gemini]).includes('INSTRUCTION_OK'));
});
