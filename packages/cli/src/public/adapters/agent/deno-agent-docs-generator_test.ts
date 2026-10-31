import { readAgentDocsPages } from '../../../../../../.llm/tools/docs/agent-docs-page-carrier.ts';
import { DenoAgentInitFileSystem } from '../../features/agent/init/agent-init-file-system.ts';
import { initAgent } from '../../features/agent/init/init-agent.ts';
import { assertEquals, assertRejects, assertStringIncludes } from '@std/assert';
import { join, resolve, toFileUrl } from '@std/path';
import { EMBEDDED_AGENT_DOCS_PACKAGE_EXPORTS } from '../../../kernel/assets/agent-docs.generated.ts';
import { NETSCRIPT_RELEASE_VERSION } from '../../../kernel/constants/jsr-specifiers.ts';
import {
  type AgentDocsCommandRunner,
  DenoAgentDocsGenerator,
  resolveInstalledNetScriptPackages,
} from './deno-agent-docs-generator.ts';

class RecordingRunner implements AgentDocsCommandRunner {
  readonly specifiers: string[] = [];

  run(
    specifier: string,
  ): Promise<{ code: number; stdout: string; stderr: string }> {
    this.specifiers.push(specifier);
    return Promise.resolve({
      code: 0,
      stdout: `docs for ${specifier}`,
      stderr: '',
    });
  }
}

async function writeProject(
  root: string,
  imports: Record<string, string>,
): Promise<void> {
  await Deno.writeTextFile(
    join(root, 'deno.json'),
    `${JSON.stringify({ imports }, null, 2)}\n`,
  );
}

function differentReleaseVersion(): string {
  const [major, minor, patch] = NETSCRIPT_RELEASE_VERSION.split('.').map(
    Number,
  );
  return `${major}.${minor}.${patch + 1}`;
}

Deno.test('offline docs cover every export subpath at the exact installed version', async () => {
  const root = await Deno.makeTempDir();
  try {
    await writeProject(root, {
      '@netscript/config': `jsr:@netscript/config@${NETSCRIPT_RELEASE_VERSION}`,
    });
    const runner = new RecordingRunner();
    const generated = await new DenoAgentDocsGenerator(
      runner,
      () => new Date('2026-08-03T10:00:00Z'),
    ).generate(root);
    const expected = EMBEDDED_AGENT_DOCS_PACKAGE_EXPORTS['@netscript/config'];
    assertEquals(
      runner.specifiers,
      expected.map((subpath) =>
        `jsr:@netscript/config@${NETSCRIPT_RELEASE_VERSION}${
          subpath === '.' ? '' : subpath.slice(1)
        }`
      ),
    );
    assertEquals(generated.apiPackageCount, 1);
    assertEquals(generated.apiExportCount, expected.length);
    assertStringIncludes(generated.files['llms.txt'], '## Task router');
    assertStringIncludes(
      generated.files['deno-doc/config.txt'],
      runner.specifiers.at(-1)!,
    );
    assertStringIncludes(generated.files['MANIFEST.md'], `@netscript/config`);
    assertStringIncludes(
      generated.files['MANIFEST.md'],
      NETSCRIPT_RELEASE_VERSION,
    );
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('lock evidence resolves a non-exact JSR range', async () => {
  const root = await Deno.makeTempDir();
  try {
    const range = `jsr:@netscript/config@^${NETSCRIPT_RELEASE_VERSION}`;
    await writeProject(root, { '@netscript/config': range });
    await Deno.writeTextFile(
      join(root, 'deno.lock'),
      JSON.stringify({ specifiers: { [range]: NETSCRIPT_RELEASE_VERSION } }),
    );
    assertEquals(await resolveInstalledNetScriptPackages(root), [
      { name: '@netscript/config', version: NETSCRIPT_RELEASE_VERSION },
    ]);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('workspace evidence resolves a local package version without a lock', async () => {
  const root = await Deno.makeTempDir();
  try {
    await writeProject(root, { '@netscript/config': 'workspace:*' });
    await Deno.mkdir(join(root, 'packages', 'config'), { recursive: true });
    const packageRoot = join(root, 'packages', 'config');
    const exports = Object.fromEntries(
      EMBEDDED_AGENT_DOCS_PACKAGE_EXPORTS['@netscript/config'].map((
        subpath,
      ) => [
        subpath,
        subpath === '.' ? './mod.ts' : `./src/${subpath.slice(2)}/mod.ts`,
      ]),
    );
    await Deno.writeTextFile(
      join(packageRoot, 'deno.json'),
      JSON.stringify({
        name: '@netscript/config',
        version: NETSCRIPT_RELEASE_VERSION,
        exports,
      }),
    );
    assertEquals(await resolveInstalledNetScriptPackages(root), [
      {
        name: '@netscript/config',
        version: NETSCRIPT_RELEASE_VERSION,
        packageRoot,
      },
    ]);
    const runner = new RecordingRunner();
    await new DenoAgentDocsGenerator(runner).generate(root);
    assertEquals(
      runner.specifiers,
      Object.values(exports).map((target) => toFileUrl(resolve(packageRoot, target)).href),
    );
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('missing lock evidence, version mismatch, and launch throws fail loudly', async () => {
  const root = await Deno.makeTempDir();
  try {
    await writeProject(root, {
      '@netscript/config': `jsr:@netscript/config@^${NETSCRIPT_RELEASE_VERSION}`,
    });
    await assertRejects(
      () => resolveInstalledNetScriptPackages(root),
      Error,
      'Cannot prove an exact installed version',
    );
    await writeProject(root, {
      '@netscript/config': `jsr:@netscript/config@${differentReleaseVersion()}`,
    });
    await assertRejects(
      () => new DenoAgentDocsGenerator(new RecordingRunner()).generate(root),
      Error,
      'does not match CLI',
    );
    await writeProject(root, {
      '@netscript/config': `jsr:@netscript/config@${NETSCRIPT_RELEASE_VERSION}`,
    });
    const missingBinary: AgentDocsCommandRunner = {
      run: () => Promise.reject(new Deno.errors.NotFound('missing deno binary')),
    };
    await assertRejects(
      () => new DenoAgentDocsGenerator(missingBinary).generate(root),
      Error,
      'Failed to launch deno doc',
    );
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('generated carrier MANIFEST bytes equal generated and installed consumer output with stable prose provenance', async () => {
  const root = await Deno.makeTempDir();
  try {
    await writeProject(root, {
      '@netscript/config': `jsr:@netscript/config@${NETSCRIPT_RELEASE_VERSION}`,
    });
    // Read the canonical carrier as data, independently of the adapter's imported page snapshot.
    const prose = await readAgentDocsPages(
      new URL(
        '../../../../../mcp/src/infrastructure/docs/agent-docs-prose.generated.ts',
        import.meta.url,
      ),
      NETSCRIPT_RELEASE_VERSION,
    );
    const orderedProse: Record<string, string> = {};
    for (const path of Object.keys(prose).sort()) orderedProse[path] = prose[path];
    const canonicalBytes = new TextEncoder().encode(
      JSON.stringify({ schemaVersion: 1, files: orderedProse }),
    );
    const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', canonicalBytes)).toHex();
    const proseCount = Object.keys(prose).length;
    const exportCount = EMBEDDED_AGENT_DOCS_PACKAGE_EXPORTS['@netscript/config'].length;
    const apiTime = '2026-08-03T10:00:00.000Z';
    // Keep the complete contract independent of the production manifest renderer.
    const expectedManifest = `# NetScript offline documentation

Generated for the exact NetScript packages installed in this project. Start with \`llms.txt\` for the task router and use \`llms-full.txt\` as the grep target.

| Field | Value |
| --- | --- |
| Framework / CLI version | \`${NETSCRIPT_RELEASE_VERSION}\` |
| Prose source commit | \`sha256:${digest}\` |
| Prose extraction time | \`release:${NETSCRIPT_RELEASE_VERSION}\` |
| API generation time | \`${apiTime}\` |
| Prose files | ${proseCount} |
| Total files | ${proseCount + 2} |
| API packages / export subpaths | 1 / ${exportCount} |

## Documented installed packages

| Package | Exact version |
| --- | --- |
| \`@netscript/config\` | \`${NETSCRIPT_RELEASE_VERSION}\` |
`;
    const expectedBytes = new TextEncoder().encode(expectedManifest);
    const generator = new DenoAgentDocsGenerator(new RecordingRunner(), () => new Date(apiTime));
    const generated = await generator.generate(root);
    assertEquals(new TextEncoder().encode(generated.files['MANIFEST.md']), expectedBytes);

    await initAgent({ projectRoot: root, host: 'claude', withDocs: true }, {
      fs: new DenoAgentInitFileSystem(),
      aspireAgentInitializer: { initialize: () => Promise.resolve({ ok: true }) },
      docsGenerator: generator,
    });
    assertEquals(await Deno.readFile(join(root, '.netscript/docs/MANIFEST.md')), expectedBytes);

    const laterTime = '2030-01-01T00:00:00.000Z';
    const later = await new DenoAgentDocsGenerator(
      new RecordingRunner(),
      () => new Date(laterTime),
    ).generate(root);
    assertEquals(
      new TextEncoder().encode(later.files['MANIFEST.md']),
      new TextEncoder().encode(expectedManifest.replace(apiTime, laterTime)),
    );
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
