import { assertEquals, assertThrows } from '@std/assert';
import { validateOpenCodeMcpAttachment } from './opencode-preflight.ts';
import {
  attestCopilotCatalog,
  copilotCatalogAvailability,
  preflightCopilotCatalog,
} from './opencode-preflight.ts';
import { ROUTING_MODEL_IDS } from '../config/models.ts';
import { COPILOT_CATALOG_FIXTURE } from '../runtime/test-fixtures.ts';
import { resolveWorkloadRoute } from '../runtime/routing-policy.ts';

Deno.test('Copilot catalog exact attestation rejects absent and substring IDs', () => {
  const model = ROUTING_MODEL_IDS.gemini38FlashCopilot;
  const now = '2026-09-04T20:00:00Z';
  assertEquals(attestCopilotCatalog(model, COPILOT_CATALOG_FIXTURE, now), {
    model,
    present: true,
    capturedAt: now,
  });
  const missing = attestCopilotCatalog(model, `${model}-other`, now);
  assertEquals(missing.present, false);
  const route = resolveWorkloadRoute({
    tier: 'feature',
    role: 'deep_research',
    worktree: '/work',
    unavailableTransports: [
      'agy',
      ...copilotCatalogAvailability(missing).unavailableTransports ?? [],
    ],
  });
  assertEquals(route.model, ROUTING_MODEL_IDS.lunaNative);
});

Deno.test('Copilot catalog probe uses a non-inference command with isolated environment', async () => {
  const receipt = await preflightCopilotCatalog(ROUTING_MODEL_IDS.kimiK3Copilot, {
    cwd: '/work',
    env: { HOME: '/home/test', GH_TOKEN: 'never-retain', OPENROUTER_API_KEY: 'never-retain' },
    listModels: (_binary, options) => {
      assertEquals(options.args, ['models', 'github-copilot']);
      assertEquals(options.clearEnv, true);
      assertEquals(options.env, { HOME: '/home/test' });
      return Promise.resolve(COPILOT_CATALOG_FIXTURE);
    },
  });
  assertEquals(receipt.present, true);
  assertEquals(JSON.stringify(receipt).includes('never-retain'), false);
});

Deno.test('MCP preflight keeps available count separate from expected tools and calls', () => {
  assertEquals(
    validateOpenCodeMcpAttachment(
      ['netscript', 'aspire'],
      { netscript: { status: 'connected' }, aspire: { status: 'connected' } },
      ['read', 'netscript_search_docs', 'netscript_doctor', 'aspire_list_resources'],
    ),
    {
      expectedServerCount: 2,
      connectedServerCount: 2,
      availableToolCount: 4,
      expectedToolCount: 2,
      documentationTool: 'netscript_search_docs',
    },
  );
});

Deno.test('MCP preflight fails closed for missing connection or invalid host tool shape', () => {
  assertThrows(
    () =>
      validateOpenCodeMcpAttachment(
        ['netscript', 'aspire'],
        { netscript: { status: 'connected' }, aspire: { status: 'failed' } },
        ['netscript_search_docs', 'aspire_doctor'],
      ),
    Error,
    'required_server_not_connected',
  );
  assertThrows(
    () =>
      validateOpenCodeMcpAttachment(
        ['netscript', 'aspire'],
        { netscript: { status: 'connected' }, aspire: { status: 'connected' } },
        { invalid: true },
      ),
    Error,
    'invalid_tool_shape',
  );
});

Deno.test('MCP preflight diagnostics reject unsafe generated server identities', () => {
  assertThrows(
    () => validateOpenCodeMcpAttachment(['private server'], {}, []),
    Error,
    'safe server identities',
  );
});
