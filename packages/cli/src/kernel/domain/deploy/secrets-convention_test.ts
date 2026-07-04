import { assertEquals } from 'jsr:@std/assert@^1';

import {
  reconcileSecrets,
  type RenderedSecretsEnvFile,
  renderSecretsEnvFile,
  RESTRICTED_SECRET_FILE_MODE,
  type SecretsBundle,
  type SecretsStorePort,
} from './secrets-convention.ts';

Deno.test('RESTRICTED_SECRET_FILE_MODE is owner read/write only (0o600)', () => {
  assertEquals(RESTRICTED_SECRET_FILE_MODE, 0o600);
  // No group/other bits set: 0o600 & 0o077 === 0.
  assertEquals(RESTRICTED_SECRET_FILE_MODE & 0o077, 0);
});

Deno.test('renderSecretsEnvFile emits KEY=VALUE lines with the restricted mode', () => {
  const rendered = renderSecretsEnvFile({
    target: 'linux-service',
    secrets: [
      { key: 'DATABASE_URL', value: 'libsql://db.example' },
      { key: 'PORT', value: '8080' },
    ],
  });

  assertEquals(rendered.mode, 0o600);
  assertEquals(rendered.content, 'DATABASE_URL=libsql://db.example\nPORT=8080\n');
});

Deno.test('renderSecretsEnvFile quotes + escapes values that would break a dotenv parse', () => {
  const rendered = renderSecretsEnvFile({
    target: 'linux-service',
    secrets: [
      { key: 'SPACED', value: 'a b' },
      { key: 'EMPTY', value: '' },
      { key: 'QUOTED', value: 'he said "hi"' },
      { key: 'MULTILINE', value: 'line1\nline2' },
      { key: 'BACKSLASH', value: 'a\\b' },
    ],
  });

  assertEquals(
    rendered.content,
    [
      'SPACED="a b"',
      'EMPTY=""',
      'QUOTED="he said \\"hi\\""',
      'MULTILINE="line1\\nline2"',
      'BACKSLASH="a\\\\b"',
      '',
    ].join('\n'),
  );
});

Deno.test('renderSecretsEnvFile renders an empty body for a bundle with no secrets', () => {
  const rendered = renderSecretsEnvFile({ target: 'linux-service', secrets: [] });
  assertEquals(rendered.content, '');
  assertEquals(rendered.mode, 0o600);
});

/** In-memory fake store recording the put payload and returning a seeded key list. */
class FakeSecretsStore implements SecretsStorePort {
  putCalls: { rendered: RenderedSecretsEnvFile; bundle: SecretsBundle }[] = [];
  clearCalls = 0;
  constructor(private readonly existing: readonly string[]) {}
  put(rendered: RenderedSecretsEnvFile, bundle: SecretsBundle): Promise<void> {
    this.putCalls.push({ rendered, bundle });
    return Promise.resolve();
  }
  list(): Promise<readonly string[]> {
    return Promise.resolve(this.existing);
  }
  clear(): Promise<void> {
    this.clearCalls += 1;
    return Promise.resolve();
  }
}

Deno.test('reconcileSecrets writes the rendered bundle through the store port', async () => {
  const store = new FakeSecretsStore([]);
  const bundle: SecretsBundle = {
    target: 'linux-service',
    secrets: [{ key: 'API_KEY', value: 'abc' }],
  };

  const result = await reconcileSecrets({ bundle }, store);

  assertEquals(store.putCalls.length, 1);
  assertEquals(store.putCalls[0].rendered.content, 'API_KEY=abc\n');
  assertEquals(store.putCalls[0].rendered.mode, 0o600);
  assertEquals(result.target, 'linux-service');
  assertEquals(result.written, ['API_KEY']);
  assertEquals(result.pruned, []);
  assertEquals(result.mode, 0o600);
});

Deno.test('reconcileSecrets reports keys held by the store but dropped from the bundle as pruned', async () => {
  const store = new FakeSecretsStore(['API_KEY', 'STALE_TOKEN', 'OLD_URL']);
  const bundle: SecretsBundle = {
    target: 'linux-service',
    secrets: [
      { key: 'API_KEY', value: 'new' },
      { key: 'NEW_URL', value: 'x' },
    ],
  };

  const result = await reconcileSecrets({ bundle }, store);

  assertEquals(result.written, ['API_KEY', 'NEW_URL']);
  assertEquals(result.pruned, ['STALE_TOKEN', 'OLD_URL']);
});
