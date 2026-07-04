import { assertEquals, assertRejects } from 'jsr:@std/assert@^1';

import type { ProcessPort, ProcessResult } from '../../ports/process-port.ts';
import type { RenderedSecretsEnvFile, SecretsBundle } from '../../domain/deploy/secrets-convention.ts';
import { EnvFileSecretsStore, restrictAclArgs, type SecretsFsPort } from './env-file-secrets-store.ts';

interface FsCall {
  readonly op: 'write' | 'chmod' | 'remove';
  readonly path: string;
  readonly content?: string;
  readonly mode?: number;
}

function fakeFs(initial?: string): { fs: SecretsFsPort; calls: FsCall[]; stored: () => string | undefined } {
  const calls: FsCall[] = [];
  let content = initial;
  const fs: SecretsFsPort = {
    writeTextFile(path, value) {
      calls.push({ op: 'write', path, content: value });
      content = value;
      return Promise.resolve();
    },
    readTextFile(_path) {
      return Promise.resolve(content);
    },
    chmod(path, mode) {
      calls.push({ op: 'chmod', path, mode });
      return Promise.resolve();
    },
    remove(path) {
      calls.push({ op: 'remove', path });
      content = undefined;
      return Promise.resolve();
    },
  };
  return { fs, calls, stored: () => content };
}

function fakeProcess(): { process: ProcessPort; execs: { command: string; args: string[] }[] } {
  const execs: { command: string; args: string[] }[] = [];
  const process: ProcessPort = {
    exec(command, args): Promise<ProcessResult> {
      execs.push({ command, args: [...args] });
      return Promise.resolve({ code: 0, stdout: '', stderr: '' });
    },
  };
  return { process, execs };
}

const rendered: RenderedSecretsEnvFile = { content: 'API_KEY=abc\nDB_URL=postgres://x\n', mode: 0o600 };
const bundle: SecretsBundle = {
  target: 'workers-api',
  secrets: [{ key: 'API_KEY', value: 'abc' }, { key: 'DB_URL', value: 'postgres://x' }],
};

Deno.test('put on POSIX writes content then chmod 0o600, no process invocation', async () => {
  const { fs, calls } = fakeFs();
  const { process, execs } = fakeProcess();
  const store = new EnvFileSecretsStore({
    envFilePath: '/opt/app/.env',
    fs,
    platform: 'posix',
    process,
    owner: 'deployer',
  });

  await store.put(rendered, bundle);

  assertEquals(calls, [
    { op: 'write', path: '/opt/app/.env', content: rendered.content },
    { op: 'chmod', path: '/opt/app/.env', mode: 0o600 },
  ]);
  assertEquals(execs.length, 0);
});

Deno.test('put on Windows writes content then applies owner+SYSTEM icacls ACL, no chmod', async () => {
  const { fs, calls } = fakeFs();
  const { process, execs } = fakeProcess();
  const store = new EnvFileSecretsStore({
    envFilePath: 'C:/app/.env',
    fs,
    platform: 'windows',
    process,
    owner: 'deployer',
  });

  await store.put(rendered, bundle);

  assertEquals(calls, [{ op: 'write', path: 'C:/app/.env', content: rendered.content }]);
  assertEquals(execs, [{ command: 'icacls', args: restrictAclArgs('C:/app/.env', 'deployer') }]);
});

Deno.test('Windows put without a ProcessPort rejects', async () => {
  const { fs } = fakeFs();
  const store = new EnvFileSecretsStore({
    envFilePath: 'C:/app/.env',
    fs,
    platform: 'windows',
    owner: 'deployer',
  });

  await assertRejects(() => store.put(rendered, bundle), Error, 'ProcessPort');
});

Deno.test('list parses persisted keys and ignores blanks and comments', async () => {
  const { fs } = fakeFs('# header\nAPI_KEY=abc\n\nDB_URL=postgres://x\n');
  const store = new EnvFileSecretsStore({ envFilePath: '/opt/app/.env', fs, platform: 'posix' });

  assertEquals(await store.list(), ['API_KEY', 'DB_URL']);
});

Deno.test('list returns empty when the secret file is absent', async () => {
  const { fs } = fakeFs();
  const store = new EnvFileSecretsStore({ envFilePath: '/opt/app/.env', fs, platform: 'posix' });

  assertEquals(await store.list(), []);
});

Deno.test('clear removes the secret file', async () => {
  const { fs, calls, stored } = fakeFs('API_KEY=abc\n');
  const store = new EnvFileSecretsStore({ envFilePath: '/opt/app/.env', fs, platform: 'posix' });

  await store.clear();

  assertEquals(calls, [{ op: 'remove', path: '/opt/app/.env' }]);
  assertEquals(stored(), undefined);
});
