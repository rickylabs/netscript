import { assertEquals } from 'jsr:@std/assert@^1';
import { join } from 'jsr:@std/path@^1.0.0';
import {
  coordinateVersionBump,
  createReleasePullRequest,
  findVersionResidue,
  parseArgs,
  validateNewerVersion,
  writeReleasePrBody,
} from './cut.ts';

Deno.test('release cut creates its PR through the injected GitHub transport', async () => {
  let request: { method: string; path: string; token: string; body?: unknown } | undefined;
  const created = await createReleasePullRequest('0.0.1-beta.8', 'generated body', {
    resolveToken: () => Promise.resolve({ token: 'secret-token', source: 'test' }),
    request: (method, path, token, body) => {
      request = { method, path, token, body };
      return Promise.resolve({
        ok: true,
        status: 201,
        body: { html_url: 'https://github.com/rickylabs/netscript/pull/999' },
      });
    },
  });

  assertEquals(created, true);
  assertEquals(request, {
    method: 'POST',
    path: '/repos/rickylabs/netscript/pulls',
    token: 'secret-token',
    body: {
      title: 'chore(release): cut 0.0.1-beta.8',
      head: 'release/cut-0.0.1-beta.8',
      base: 'main',
      body: 'generated body',
    },
  });
});

Deno.test('release cut leaves PR creation failure non-fatal', async () => {
  const created = await createReleasePullRequest('0.0.1-beta.8', 'generated body', {
    resolveToken: () => Promise.resolve({ token: 'secret-token', source: 'test' }),
    request: () =>
      Promise.resolve({ ok: false, status: 422, body: { message: 'validation failed' } }),
  });

  assertEquals(created, false);
});

Deno.test('release cut writes its PR body in a fresh worktree', async () => {
  const temp = await Deno.makeTempDir({ prefix: 'netscript-release-cut-fresh-' });
  try {
    const version = '0.0.1-beta.9';
    const bodyDirectory = join(temp, '.llm', 'tmp');
    const directoryExistedBeforeWrite = await Deno.stat(bodyDirectory).then(
      () => true,
      (error) => {
        if (error instanceof Deno.errors.NotFound) return false;
        throw error;
      },
    );
    assertEquals(directoryExistedBeforeWrite, false);

    const bodyFile = await writeReleasePrBody(temp, version);

    assertEquals(bodyFile, join(bodyDirectory, `release-cut-${version}-body.md`));
    assertEquals((await Deno.stat(bodyDirectory)).isDirectory, true);
    assertEquals((await Deno.readTextFile(bodyFile)).includes(`Cut NetScript ${version}.`), true);
  } finally {
    await Deno.remove(temp, { recursive: true });
  }
});

Deno.test('release cut bump coordinator updates root members and lock with no residue', async () => {
  const temp = await Deno.makeTempDir({ prefix: 'netscript-release-cut-' });
  try {
    await write(`${temp}/deno.json`, {
      version: '0.0.1-alpha.11',
      workspace: ['packages/*', 'plugins/*'],
      publish: false,
    });
    await Deno.mkdir(`${temp}/packages/contracts`, { recursive: true });
    await Deno.mkdir(`${temp}/packages/cli/e2e`, { recursive: true });
    await Deno.mkdir(`${temp}/plugins/workers`, { recursive: true });
    await write(`${temp}/packages/contracts/deno.json`, {
      name: '@netscript/contracts',
      version: '0.0.1-alpha.11',
      imports: {},
    });
    await write(`${temp}/packages/cli/e2e/deno.json`, {
      name: '@netscript/cli-e2e',
      version: '0.0.1-alpha.11',
      publish: false,
    });
    await write(`${temp}/plugins/workers/deno.json`, {
      name: '@netscript/plugin-workers',
      version: '0.0.1-alpha.11',
      imports: {
        '@netscript/contracts': 'jsr:@netscript/contracts@0.0.1-alpha.11',
        '@netscript/config': 'jsr:@netscript/config@^0.0.1-alpha.11',
      },
    });
    await Deno.writeTextFile(
      `${temp}/deno.lock`,
      JSON.stringify(
        {
          remote: [
            'jsr:@netscript/contracts@0.0.1-alpha.11',
            'jsr:@netscript/config@^0.0.1-alpha.11',
          ],
        },
        null,
        2,
      ) + '\n',
    );

    const result = await coordinateVersionBump(temp, '0.0.1-alpha.99');
    assertEquals(result.oldVersion, '0.0.1-alpha.11');
    assertEquals(result.newVersion, '0.0.1-alpha.99');
    assertEquals(await findVersionResidue(temp, result.oldVersion), []);
    assertEquals(await Deno.readTextFile(`${temp}/deno.json`).then(readVersion), '0.0.1-alpha.99');
    assertEquals(
      (await Deno.readTextFile(`${temp}/plugins/workers/deno.json`)).includes(
        'jsr:@netscript/config@^0.0.1-alpha.99',
      ),
      true,
    );
    assertEquals(
      (await Deno.readTextFile(`${temp}/deno.lock`)).includes(
        'jsr:@netscript/contracts@0.0.1-alpha.99',
      ),
      true,
    );
  } finally {
    await Deno.remove(temp, { recursive: true });
  }
});

Deno.test('release cut refuses equal or older versions', () => {
  assertEquals(throws(() => validateNewerVersion('0.0.1-alpha.11', '0.0.1-alpha.11')), 'throws');
  assertEquals(throws(() => validateNewerVersion('0.0.1-alpha.10', '0.0.1-alpha.11')), 'throws');
  validateNewerVersion('0.0.1-alpha.12', '0.0.1-alpha.11');
});

Deno.test('release cut parser ignores task separator', () => {
  const args = parseArgs(['--', '0.0.1-alpha.99', '--dry-run']);
  assertEquals(args.version, '0.0.1-alpha.99');
  assertEquals(args.dryRun, true);
});

async function write(path: string, value: Record<string, unknown>): Promise<void> {
  await Deno.writeTextFile(path, JSON.stringify(value, null, 2) + '\n');
}

function readVersion(text: string): string {
  const parsed = JSON.parse(text);
  if (isJsonObject(parsed) && typeof parsed.version === 'string') {
    return parsed.version;
  }
  throw new Error('missing version');
}

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function throws(fn: () => void): string {
  try {
    fn();
  } catch {
    return 'throws';
  }
  return 'does-not-throw';
}
