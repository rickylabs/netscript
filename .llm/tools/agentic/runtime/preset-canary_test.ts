import { assert, assertEquals } from '@std/assert';
import { evaluateOpenRouterPresetCanaries } from './preset-canary.ts';
import {
  OPENROUTER_PRESET_IDS,
  OPENROUTER_PRESETS,
  type OpenRouterPreset,
} from './provider-profiles.ts';

const worktree = '/home/codex/repos/provider-canary-test';

Deno.test('static canary exhaustively validates every OpenRouter preset launch plan', () => {
  const result = evaluateOpenRouterPresetCanaries(worktree);
  assertEquals(result.status, 'passed');
  assertEquals(result.rows.map((row) => row.id), [...OPENROUTER_PRESET_IDS]);
  assert(result.rows.every((row) => row.validation === 'passed' && row.launchValid));
  assertEquals(
    result.rows.find((row) => row.id === 'claude-design-glm-5-2')?.liveEligible,
    true,
  );
  assertEquals(
    result.rows.find((row) => row.id === 'codex-design-glm-5-2')?.incompatibility,
    'codex-native-namespace-tool',
  );
  assertEquals(
    result.rows.find((row) => row.id === 'codex-design-glm-5-2')?.liveEligible,
    false,
  );
});

Deno.test('missing and incoherent preset records fail the exhaustive canary', () => {
  const missing: Record<string, OpenRouterPreset | undefined> = { ...OPENROUTER_PRESETS };
  delete missing['claude-design-glm-5-2'];
  const missingResult = evaluateOpenRouterPresetCanaries(worktree, missing);
  assertEquals(missingResult.status, 'failed');
  assert(missingResult.diagnostics.includes('preset_coverage_mismatch'));
  const incoherent = {
    ...OPENROUTER_PRESETS,
    'claude-design-glm-5-2': {
      ...OPENROUTER_PRESETS['claude-design-glm-5-2'],
      agenticTurn: 'unsupported',
      incompatibility: null,
    },
  } as unknown as typeof OPENROUTER_PRESETS;
  const incoherentResult = evaluateOpenRouterPresetCanaries(worktree, incoherent);
  assertEquals(incoherentResult.status, 'failed');
  assert(
    incoherentResult.rows.some((row) => row.diagnostics.includes('unsupported_without_reason')),
  );
  const wrongTransport = {
    ...OPENROUTER_PRESETS,
    'claude-design-glm-5-2': {
      ...OPENROUTER_PRESETS['claude-design-glm-5-2'],
      transport: 'responses',
    },
  } as unknown as typeof OPENROUTER_PRESETS;
  const transportResult = evaluateOpenRouterPresetCanaries(worktree, wrongTransport);
  assertEquals(transportResult.status, 'failed');
  assert(
    transportResult.rows.some((row) => row.diagnostics.includes('transport_profile_mismatch')),
  );
});
