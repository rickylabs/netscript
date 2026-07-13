import { assertEquals } from '@std/assert';
import { OPENCODE_TOOL } from '../config/versions.ts';
import {
  openCodeChildEnvironment,
  opencodeRunArguments,
  parseOpenRouterApiKey,
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
  );
  assertEquals(env.OPENROUTER_API_KEY, 'already-exported');
  assertEquals(reads, 0);
});

Deno.test('OpenRouter key falls back to the configured user env file', async () => {
  let requestedPath = '';
  const env = await openCodeChildEnvironment({ HOME: '/home/test' }, (path) => {
    requestedPath = path;
    return Promise.resolve('OPENROUTER_API_KEY=from-file');
  });
  assertEquals(requestedPath, `/home/test/${OPENCODE_TOOL.openRouterEnvRelativePath}`);
  assertEquals(env.OPENROUTER_API_KEY, 'from-file');
});
