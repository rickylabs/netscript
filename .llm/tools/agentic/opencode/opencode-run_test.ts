import { assertEquals } from '@std/assert';
import { ROUTING_MODEL_IDS } from '../config/models.ts';
import { OPENCODE_TOOL } from '../config/versions.ts';
import {
  openCodeChildEnvironment,
  opencodeRunArguments,
  parseOpenRouterApiKey,
  preflightOpenCodeExpense,
  resolveOpenCodeBinary,
} from './opencode-run.ts';

Deno.test('OpenCode argv keeps the message before every flag', () => {
  assertEquals(
    opencodeRunArguments({
      message: 'inspect this design',
      model: 'caller/model',
      variant: 'max',
    }),
    ['run', 'inspect this design', '-m', 'caller/model', '--variant', 'max'],
  );
});

Deno.test('OpenCode argv repeats -f and passes variant and JSON format through', () => {
  assertEquals(
    opencodeRunArguments({
      message: 'compare both images',
      model: 'caller/model',
      variant: 'minimal',
      files: ['/wsl/first.png', '/wsl/second.png'],
      format: 'json',
    }),
    [
      'run',
      'compare both images',
      '-m',
      'caller/model',
      '--variant',
      'minimal',
      '-f',
      '/wsl/first.png',
      '-f',
      '/wsl/second.png',
      '--format',
      'json',
    ],
  );
});

Deno.test('OpenCode argv resumes the exact stored session before provider dispatch', () => {
  assertEquals(
    opencodeRunArguments({
      message: 'continue safely',
      model: 'caller/model',
      variant: 'high',
      session: 'ses_local-42',
    }),
    [
      'run',
      'continue safely',
      '-m',
      'caller/model',
      '--variant',
      'high',
      '--session',
      'ses_local-42',
    ],
  );
});

Deno.test('OpenCode binary override takes precedence over PATH-resolved name', () => {
  assertEquals(
    resolveOpenCodeBinary({ OPENCODE_BIN: '/custom/opencode', PATH: '/bin' }),
    '/custom/opencode',
  );
  assertEquals(resolveOpenCodeBinary({ OPENCODE_BIN: '  ', PATH: '/bin' }), 'opencode');
  assertEquals(resolveOpenCodeBinary({ PATH: '/bin' }), 'opencode');
});

Deno.test('OpenRouter env parser accepts export and quoted values', () => {
  assertEquals(parseOpenRouterApiKey("# secret\nexport OPENROUTER_API_KEY='opaque'\n"), 'opaque');
  assertEquals(parseOpenRouterApiKey('UNRELATED=value\n'), undefined);
});

Deno.test('existing OpenRouter key wins without reading the config file', async () => {
  let reads = 0;
  const env = await openCodeChildEnvironment(
    { HOME: '/home/test', OPENROUTER_API_KEY: 'already-exported' },
    () => {
      reads++;
      return Promise.resolve('OPENROUTER_API_KEY=from-file');
    },
    { model: ROUTING_MODEL_IDS.glm53FlashOpenRouter },
  );
  assertEquals(env.OPENROUTER_API_KEY, 'already-exported');
  assertEquals(reads, 0);
});

Deno.test('OpenRouter key falls back to the configured mode-600 user env file', async () => {
  let requestedPath = '';
  const env = await openCodeChildEnvironment(
    { HOME: '/home/test' },
    (path) => {
      requestedPath = path;
      return Promise.resolve('OPENROUTER_API_KEY=from-file');
    },
    {
      model: ROUTING_MODEL_IDS.glm53FlashOpenRouter,
      stat: () => Promise.resolve({ mode: 0o100600 }),
    },
  );
  assertEquals(requestedPath, `/home/test/${OPENCODE_TOOL.openRouterEnvRelativePath}`);
  assertEquals(env.OPENROUTER_API_KEY, 'from-file');
});

Deno.test('paid OpenCode route is blocked before dispatch when expense proof is absent', async () => {
  let message = '';
  try {
    await preflightOpenCodeExpense({
      message: 'do work',
      model: ROUTING_MODEL_IDS.glm53FlashGo,
      variant: 'high',
    });
  } catch (error) {
    message = error instanceof Error ? error.message : String(error);
  }
  assertEquals(
    message,
    'paid opencode_go route requires --usage-snapshot and --estimated-cost-usd',
  );
});

Deno.test('paid OpenCode route accepts a fresh structured allowance decision', async () => {
  const decision = await preflightOpenCodeExpense(
    {
      message: 'do work',
      model: ROUTING_MODEL_IDS.glm53FlashGo,
      variant: 'high',
      cwd: '/work',
      usageSnapshotPath: 'usage.json',
      estimatedCostUsd: 0.5,
    },
    (path) => {
      assertEquals(path, '/work/usage.json');
      return Promise.resolve(JSON.stringify({
        provider: 'opencode_go',
        capturedAt: '2026-09-04T15:55:00.000Z',
        rollingFiveHoursUsedUsd: 1,
        weeklyUsedUsd: 2,
        monthlyUsedUsd: 3,
      }));
    },
    () => '2026-09-04T16:00:00.000Z',
  );
  assertEquals(decision?.allowed, true);
});
