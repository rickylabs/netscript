import { assert, assertStringIncludes } from 'jsr:@std/assert@^1';
import { join } from '@std/path';
import { generateDependencyClosureVerifier } from './dependency-closure-verifier.ts';
import {
  closureExportSpecifier,
  NETSCRIPT_WEB_RUNTIME_EXPORTS,
} from '../../domain/dependency-closures/netscript-web-runtime-closure.ts';
import { NETSCRIPT_RELEASE_VERSION } from '../../constants/jsr-specifiers.ts';

const CANARY_VERSION = '0.0.6-canary.3';

function jsr(packageName: string, version: string, subpath = ''): string {
  return `jsr:@netscript/${packageName}@${version}${subpath}`;
}

Deno.test('generated closure verifier rejects split JSR identities with version-bearing output', async () => {
  const fixture = await createFixture({
    '@netscript/fresh': jsr('fresh', NETSCRIPT_RELEASE_VERSION),
    '@netscript/fresh/defer': jsr('fresh', CANARY_VERSION, '/defer'),
    '@netscript/sdk': jsr('sdk', NETSCRIPT_RELEASE_VERSION),
  });
  try {
    const output = await runVerifier(fixture);
    const stderr = new TextDecoder().decode(output.stderr);
    assert(!output.success, 'a split closure must fail before Vite');
    assertStringIncludes(stderr, 'NetScript dependency closure is incoherent.');
    assertStringIncludes(stderr, `@netscript/fresh@${NETSCRIPT_RELEASE_VERSION}`);
    assertStringIncludes(stderr, '@netscript/fresh@0.0.6-canary.3/defer');
    assertStringIncludes(stderr, `@netscript/sdk@${NETSCRIPT_RELEASE_VERSION}`);
    assertStringIncludes(
      stderr,
      `different exact versions: ${NETSCRIPT_RELEASE_VERSION}, ${CANARY_VERSION}`,
    );
    assertStringIncludes(stderr, 'to one exact release, then rerun.');
  } finally {
    await Deno.remove(fixture.root, { recursive: true });
  }
});

Deno.test('generated closure verifier accepts a coherent full canary closure', async () => {
  const version = CANARY_VERSION;
  const fixture = await createFixture({
    '@netscript/fresh': jsr('fresh', version),
    '@netscript/sdk': jsr('sdk', version),
    '@netscript/telemetry': jsr('telemetry', version),
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
    '@netscript/fresh': jsr('fresh', `^${NETSCRIPT_RELEASE_VERSION}`),
    '@netscript/sdk': jsr('sdk', NETSCRIPT_RELEASE_VERSION),
  });
  try {
    const output = await runVerifier(fixture);
    const stderr = new TextDecoder().decode(output.stderr);
    assert(!output.success);
    assertStringIncludes(
      stderr,
      `@netscript/fresh uses non-exact version "^${NETSCRIPT_RELEASE_VERSION}"`,
    );
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
    for (
      const [packageName, exportNames] of Object.entries(
        NETSCRIPT_WEB_RUNTIME_EXPORTS,
      )
    ) {
      const packageDirectory = packageName.slice('@netscript/'.length);
      const packageRoot = join(root, 'packages', packageDirectory);
      await Deno.mkdir(packageRoot, { recursive: true });
      await Deno.writeTextFile(
        join(packageRoot, 'deno.json'),
        JSON.stringify({
          name: packageName,
          // This is synthetic coherent-graph data, not the checkout's active release version.
          version: '0.0.5',
          exports: './mod.ts',
        }),
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
  const root = suppliedRoot ??
    await Deno.makeTempDir({ prefix: 'netscript-closure-' });
  const appRoot = join(root, 'apps', 'dashboard');
  const scriptPath = join(
    appRoot,
    '.netscript',
    'verify-dependency-closure.ts',
  );
  await Deno.mkdir(join(appRoot, '.netscript'), { recursive: true });
  await Deno.writeTextFile(
    join(root, 'deno.json'),
    JSON.stringify({
      workspace: ['./apps/dashboard'],
      tasks: {
        'deps:closure': 'deno task --cwd apps/dashboard deps:closure',
      },
    }),
  );
  await Deno.writeTextFile(
    join(appRoot, 'deno.json'),
    JSON.stringify({
      name: '@fixture/dashboard',
      version: '0.0.0',
      exports: './main.ts',
      tasks: {
        'deps:closure': 'deno run --allow-read .netscript/verify-dependency-closure.ts',
      },
      imports,
    }),
  );
  await Deno.writeTextFile(scriptPath, generateDependencyClosureVerifier());
  return { root, appRoot, scriptPath };
}

async function runVerifier(
  fixture: ClosureFixture,
): Promise<Deno.CommandOutput> {
  return await new Deno.Command(Deno.execPath(), {
    args: ['task', 'deps:closure'],
    cwd: fixture.root,
    stdout: 'piped',
    stderr: 'piped',
  }).output();
}
