import { assert, assertStringIncludes } from 'jsr:@std/assert@^1';
import { join } from '@std/path';
import { generateDependencyClosureVerifier } from './dependency-closure-verifier.ts';
import {
  closureExportSpecifier,
  NETSCRIPT_WEB_RUNTIME_EXPORTS,
} from '../../domain/dependency-closures/netscript-web-runtime-closure.ts';

Deno.test('generated closure verifier rejects split JSR identities with version-bearing output', async () => {
  const fixture = await createFixture({
    '@netscript/fresh': 'jsr:@netscript/fresh@0.0.5',
    '@netscript/fresh/defer': 'jsr:@netscript/fresh@0.0.6-canary.3/defer',
    '@netscript/sdk': 'jsr:@netscript/sdk@0.0.5',
  });
  try {
    const output = await runVerifier(fixture);
    const stderr = new TextDecoder().decode(output.stderr);
    assert(!output.success, 'a split closure must fail before Vite');
    assertStringIncludes(stderr, 'NetScript dependency closure is incoherent.');
    assertStringIncludes(stderr, '@netscript/fresh@0.0.5');
    assertStringIncludes(stderr, '@netscript/fresh@0.0.6-canary.3/defer');
    assertStringIncludes(stderr, '@netscript/sdk@0.0.5');
    assertStringIncludes(stderr, 'different exact versions: 0.0.5, 0.0.6-canary.3');
    assertStringIncludes(stderr, 'to one exact release, then rerun.');
  } finally {
    await Deno.remove(fixture.root, { recursive: true });
  }
});

Deno.test('generated closure verifier accepts a coherent full canary closure', async () => {
  const version = '0.0.6-canary.3';
  const fixture = await createFixture({
    '@netscript/fresh': `jsr:@netscript/fresh@${version}`,
    '@netscript/sdk': `jsr:@netscript/sdk@${version}`,
    '@netscript/telemetry': `jsr:@netscript/telemetry@${version}`,
  });
  try {
    const output = await runVerifier(fixture);
    const stdout = new TextDecoder().decode(output.stdout);
    assert(output.success, new TextDecoder().decode(output.stderr));
    assertStringIncludes(
      stdout,
      'NetScript dependency closure verified: exact release 0.0.6-canary.3 (jsr).',
    );
  } finally {
    await Deno.remove(fixture.root, { recursive: true });
  }
});

Deno.test('generated closure verifier fails closed on a range pin', async () => {
  const fixture = await createFixture({
    '@netscript/fresh': 'jsr:@netscript/fresh@^0.0.5',
    '@netscript/sdk': 'jsr:@netscript/sdk@0.0.5',
  });
  try {
    const output = await runVerifier(fixture);
    const stderr = new TextDecoder().decode(output.stderr);
    assert(!output.success);
    assertStringIncludes(stderr, '@netscript/fresh uses non-exact version "^0.0.5"');
    assertStringIncludes(stderr, 'pin this member exactly');
  } finally {
    await Deno.remove(fixture.root, { recursive: true });
  }
});

Deno.test('generated closure verifier accepts one coherent local package graph', async () => {
  const root = await Deno.makeTempDir({ prefix: 'netscript-local-closure-' });
  const appRoot = join(root, 'apps', 'dashboard');
  const imports: Record<string, string> = {};
  try {
    for (const [packageName, exportNames] of Object.entries(NETSCRIPT_WEB_RUNTIME_EXPORTS)) {
      const packageDirectory = packageName.slice('@netscript/'.length);
      const packageRoot = join(root, 'packages', packageDirectory);
      await Deno.mkdir(packageRoot, { recursive: true });
      await Deno.writeTextFile(
        join(packageRoot, 'deno.json'),
        JSON.stringify({ name: packageName, version: '0.0.5', exports: './mod.ts' }),
      );
      await Deno.writeTextFile(join(packageRoot, 'mod.ts'), 'export {};\n');
      for (const exportName of exportNames) {
        imports[closureExportSpecifier(packageName, exportName)] =
          `../../packages/${packageDirectory}/mod.ts`;
      }
    }

    const fixture = await createFixture(imports, root);
    const output = await runVerifier(fixture);
    const stdout = new TextDecoder().decode(output.stdout);
    assert(output.success, new TextDecoder().decode(output.stderr));
    assertStringIncludes(stdout, 'exact release 0.0.5 (local)');
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

interface ClosureFixture {
  readonly root: string;
  readonly appRoot: string;
  readonly scriptPath: string;
}

async function createFixture(
  imports: Record<string, string>,
  suppliedRoot?: string,
): Promise<ClosureFixture> {
  const root = suppliedRoot ?? await Deno.makeTempDir({ prefix: 'netscript-closure-' });
  const appRoot = join(root, 'apps', 'dashboard');
  const scriptPath = join(appRoot, '.netscript', 'verify-dependency-closure.ts');
  await Deno.mkdir(join(appRoot, '.netscript'), { recursive: true });
  await Deno.writeTextFile(
    join(root, 'deno.json'),
    JSON.stringify({ workspace: ['./apps/dashboard'] }),
  );
  await Deno.writeTextFile(
    join(appRoot, 'deno.json'),
    JSON.stringify({ name: '@fixture/dashboard', version: '0.0.0', imports }),
  );
  await Deno.writeTextFile(scriptPath, generateDependencyClosureVerifier());
  return { root, appRoot, scriptPath };
}

async function runVerifier(fixture: ClosureFixture): Promise<Deno.CommandOutput> {
  return await new Deno.Command(Deno.execPath(), {
    args: ['run', '--allow-read', fixture.scriptPath],
    cwd: fixture.appRoot,
    stdout: 'piped',
    stderr: 'piped',
  }).output();
}
