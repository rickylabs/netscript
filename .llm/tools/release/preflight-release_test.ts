import { assertEquals, assertRejects } from 'jsr:@std/assert@^1';
import { auditMarkdownPins, auditPublishSet } from './preflight-release.ts';

Deno.test('publish-set audit includes AI siblings and reports publish:false as missing', async () => {
  const root = await fixtureRoot();
  try {
    await member(root, 'packages/ai', '@netscript/ai');
    await member(root, 'packages/plugin-ai-core', '@netscript/plugin-ai-core');
    await member(root, 'plugins/ai', '@netscript/plugin-ai', false);
    const audit = await auditPublishSet(root);
    assertEquals(audit.intended.map((entry) => entry.name), [
      '@netscript/ai',
      '@netscript/plugin-ai-core',
      '@netscript/plugin-ai',
    ]);
    assertEquals(audit.effective.map((entry) => entry.name), [
      '@netscript/ai',
      '@netscript/plugin-ai-core',
    ]);
    assertEquals(audit.missing.map((entry) => entry.name), ['@netscript/plugin-ai']);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('publish-set exclusions require a recorded reason', async () => {
  const root = await fixtureRoot();
  try {
    await assertRejects(() => auditPublishSet(root, [{ path: 'plugins/ai', reason: '' }]));
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('publish-set audit accepts an explicitly reasoned internal exclusion', async () => {
  const root = await fixtureRoot();
  try {
    await member(root, 'packages/bench', '@netscript/bench', false);
    const audit = await auditPublishSet(root, [
      { path: 'packages/bench', reason: 'internal benchmark workspace' },
    ]);
    assertEquals(audit.missing, []);
    assertEquals(audit.extra, []);
    assertEquals(audit.excluded.length, 1);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('publish-set audit covers explicit nested workspace members and applies the durable exclusion', async () => {
  const root = await fixtureRoot();
  try {
    const rootConfig = JSON.parse(await Deno.readTextFile(`${root}/deno.json`));
    rootConfig.workspace.splice(1, 0, 'packages/cli/e2e');
    await Deno.writeTextFile(`${root}/deno.json`, `${JSON.stringify(rootConfig)}\n`);
    await member(root, 'packages/cli/e2e', '@netscript/cli-e2e', false);

    const audit = await auditPublishSet(root);
    assertEquals(audit.missing, []);
    assertEquals(audit.extra, []);
    assertEquals(
      audit.excluded.some((entry) => entry.path === 'packages/cli/e2e' && entry.reason.length > 0),
      true,
    );
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('markdown preflight separates stale, neutral, and deferred snippets', async () => {
  const root = await fixtureRoot();
  try {
    await Deno.mkdir(`${root}/docs/site`, { recursive: true });
    await Deno.writeTextFile(
      `${root}/README.md`,
      'stale: jsr:@netscript/ai@^0.0.1-beta.4\nneutral: jsr:@netscript/ai\n',
    );
    await Deno.writeTextFile(
      `${root}/docs/site/guide.md`,
      'deferred: jsr:@netscript/plugin-ai-core@0.0.1-alpha.0\n',
    );
    const audit = await auditMarkdownPins(root, '0.0.1-beta.6');
    assertEquals(audit.violations.map(({ path, line }) => ({ path, line })), [
      { path: 'README.md', line: 1 },
    ]);
    assertEquals(audit.deferred.map(({ path, line }) => ({ path, line })), [
      { path: 'docs/site/guide.md', line: 1 },
    ]);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

async function fixtureRoot(): Promise<string> {
  const root = await Deno.makeTempDir({ prefix: 'netscript-release-preflight-' });
  await Deno.mkdir(`${root}/packages`, { recursive: true });
  await Deno.mkdir(`${root}/plugins`, { recursive: true });
  await Deno.writeTextFile(
    `${root}/deno.json`,
    '{"version":"0.0.1-beta.6","workspace":["packages/*","plugins/*"]}\n',
  );
  return root;
}

async function member(root: string, path: string, name: string, publish = true): Promise<void> {
  await Deno.mkdir(`${root}/${path}`, { recursive: true });
  await Deno.writeTextFile(
    `${root}/${path}/deno.json`,
    `${JSON.stringify({ name, version: '0.0.1-beta.6', publish })}\n`,
  );
}
