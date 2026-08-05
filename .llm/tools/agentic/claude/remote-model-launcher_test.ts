import { assertEquals, assertRejects, assertThrows } from '@std/assert';
import { LOOPBACK_HTTP_PROTOCOL } from '../config/endpoints.ts';
import { OPENROUTER_MODEL_IDS } from '../config/models.ts';
import {
  claudeGatewayChildEnvironment,
  parseRemoteModelLaunchOptions,
  remoteModelClaudeArguments,
  type RemoteModelLauncherPorts,
  runRemoteModelLauncher,
} from './remote-model-launcher.ts';

Deno.test('new inference session uses the configured model and mandatory bypass mode', () => {
  const options = parseRemoteModelLaunchOptions([
    '--',
    '--cwd',
    '/repo',
    '--name',
    'deepseek fork',
  ]);
  assertEquals(options.model, OPENROUTER_MODEL_IDS.deepseekV4Flash0731);
  assertEquals(remoteModelClaudeArguments(options), [
    '--model',
    OPENROUTER_MODEL_IDS.deepseekV4Flash0731,
    '--effort',
    'xhigh',
    '--permission-mode',
    'bypassPermissions',
    '--name',
    'deepseek fork',
  ]);
});

Deno.test('conversation fork uses inference-only resume with model and effort', () => {
  const options = parseRemoteModelLaunchOptions([
    '--resume',
    'conversation-id',
    '--fork-session',
    '--effort',
    'high',
    '--name',
    'fork name',
  ]);
  assertEquals(remoteModelClaudeArguments(options), [
    '--resume',
    'conversation-id',
    '--fork-session',
    '--model',
    OPENROUTER_MODEL_IDS.deepseekV4Flash0731,
    '--effort',
    'high',
    '--permission-mode',
    'bypassPermissions',
    '--name',
    'fork name',
  ]);
});

Deno.test('launcher rejects unsafe or contradictory session combinations', () => {
  assertThrows(() => parseRemoteModelLaunchOptions(['--fork-session']), Error, 'requires --resume');
  assertThrows(
    () => parseRemoteModelLaunchOptions(['--remote-control']),
    Error,
    'unsupported',
  );
  assertThrows(
    () => parseRemoteModelLaunchOptions(['--name', 'line\nbreak']),
    Error,
    'unsupported characters',
  );
});

Deno.test('Claude child receives the gateway URL but no alternate-provider credential', () => {
  const child = claudeGatewayChildEnvironment(
    {
      PATH: '/bin',
      OPENROUTER_API_KEY: 'secret',
      ANTHROPIC_API_KEY: 'unrelated-api-key',
      ANTHROPIC_AUTH_TOKEN: 'unrelated-auth-token',
    },
    'secret',
    `${LOOPBACK_HTTP_PROTOCOL}//loopback.invalid`,
  );
  assertEquals(child, {
    PATH: '/bin',
    ANTHROPIC_BASE_URL: `${LOOPBACK_HTTP_PROTOCOL}//loopback.invalid`,
  });
});

Deno.test('launcher removes signal hooks and closes the gateway when Claude fails', async () => {
  const events: string[] = [];
  const ports: RemoteModelLauncherPorts = {
    environment: () => ({ OPENROUTER_API_KEY: 'secret' }),
    resolveCredential: () => Promise.resolve('secret'),
    assertDirectory: () => Promise.resolve(),
    startGateway: () => ({
      baseUrl: `${LOOPBACK_HTTP_PROTOCOL}//loopback.invalid`,
      close: () => {
        events.push('close');
        return Promise.resolve();
      },
    }),
    spawnClaude: () => ({
      status: Promise.reject(new Error('synthetic child failure')),
      kill: () => events.push('kill'),
    }),
    addSignalListener: (signal) => events.push(`add:${signal}`),
    removeSignalListener: (signal) => events.push(`remove:${signal}`),
  };
  await assertRejects(
    () => runRemoteModelLauncher(parseRemoteModelLaunchOptions([]), ports),
    Error,
    'synthetic child failure',
  );
  assertEquals(events, [
    'add:SIGINT',
    'add:SIGTERM',
    'remove:SIGINT',
    'remove:SIGTERM',
    'close',
  ]);
});
