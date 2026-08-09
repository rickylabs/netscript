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
