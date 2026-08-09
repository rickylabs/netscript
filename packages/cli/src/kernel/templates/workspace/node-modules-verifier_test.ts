/**
 * @module templates/workspace/node-modules-verifier_test
 *
 * Executable regression contract for the generated materialization detector.
 */

import { assert, assertStringIncludes } from 'jsr:@std/assert@^1';
import { join } from '@std/path';
import { SCAFFOLD_DEFAULTS } from '../../constants/scaffold/scaffold-defaults.ts';
import { generateNodeModulesVerifier } from './node-modules-verifier.ts';

Deno.test('generated verifier fails closed for a cache file missing from node_modules/.deno', async () => {
  const fixture = await createFixture(false);
  try {
    const output = await runVerifier(fixture);
    const stderr = new TextDecoder().decode(output.stderr);

    assert(!output.success, 'incomplete materialization must fail');
    assertStringIncludes(stderr, 'Deno npm materialization is incomplete.');
    assertStringIncludes(stderr, 'lib/transformation/file/file.js');
    assertStringIncludes(
      stderr,
      'Remove-Item -Recurse -Force node_modules; deno install',
    );
    assertStringIncludes(stderr, 'rm -rf node_modules && deno install');
    assertStringIncludes(stderr, `Deno ${SCAFFOLD_DEFAULTS.DENO_VERSION}`);
    assertStringIncludes(
      stderr,
      'https://github.com/denoland/deno/issues/35804',
    );
  } finally {
    await Deno.remove(fixture.root, { recursive: true });
  }
});

Deno.test('generated verifier passes only after the local materialization is complete', async () => {
  const fixture = await createFixture(true);
  try {
    const output = await runVerifier(fixture);
    const stdout = new TextDecoder().decode(output.stdout);

    assert(output.success, new TextDecoder().decode(output.stderr));
    assertStringIncludes(
      stdout,
      'Deno npm materialization verified: 1 packages, 2 files.',
    );
  } finally {
    await Deno.remove(fixture.root, { recursive: true });
  }
});

interface VerifierFixture {
  readonly root: string;
  readonly projectRoot: string;
  readonly cacheRoot: string;
  readonly scriptPath: string;
}

async function createFixture(complete: boolean): Promise<VerifierFixture> {
  const root = await Deno.makeTempDir({ prefix: 'netscript-materialization-' });
  const projectRoot = join(root, 'project');
  const cacheRoot = join(root, 'cache', 'npm');
  const scriptPath = join(projectRoot, '.netscript', 'verify-node-modules.ts');
  const cachePackage = join(
    cacheRoot,
    'registry.npmjs.org',
    '@babel',
    'core',
    '7.29.7',
  );
  const localPackage = join(
    projectRoot,
    'node_modules',
    '.deno',
    '@babel+core@7.29.7',
    'node_modules',
    '@babel',
    'core',
  );
  const missingRelative = join('lib', 'transformation', 'file', 'file.js');

  await Deno.mkdir(join(projectRoot, '.netscript'), { recursive: true });
  await Deno.mkdir(cachePackage, { recursive: true });
  await Deno.mkdir(localPackage, { recursive: true });
  await Deno.writeTextFile(
    join(projectRoot, 'deno.json'),
    JSON.stringify({ compilerOptions: { strict: true, noImplicitAny: true } }),
  );
  await Deno.writeTextFile(scriptPath, generateNodeModulesVerifier());
  await Deno.writeTextFile(
    join(cachePackage, 'package.json'),
    JSON.stringify({ name: '@babel/core', version: '7.29.7' }),
  );
  await Deno.writeTextFile(join(localPackage, 'package.json'), '{}');
  await Deno.mkdir(join(cachePackage, 'lib', 'transformation', 'file'), {
    recursive: true,
  });
  await Deno.writeTextFile(join(cachePackage, missingRelative), 'export {};\n');
  // Deno owns this cache bookkeeping marker and intentionally does not materialize it.
  await Deno.writeTextFile(join(cachePackage, '.scripts-warned-12345'), '');
  if (complete) {
    await Deno.mkdir(join(localPackage, 'lib', 'transformation', 'file'), {
      recursive: true,
    });
    await Deno.writeTextFile(
      join(localPackage, missingRelative),
      'export {};\n',
    );
  }

  return { root, projectRoot, cacheRoot, scriptPath };
}

async function runVerifier(
  fixture: VerifierFixture,
): Promise<Deno.CommandOutput> {
  return await new Deno.Command(Deno.execPath(), {
    args: [
      'run',
      '--allow-read',
      fixture.scriptPath,
      '--project-root',
      fixture.projectRoot,
      '--cache-root',
      fixture.cacheRoot,
    ],
    stdout: 'piped',
    stderr: 'piped',
  }).output();
}
