import { assert, assertEquals, assertStringIncludes } from 'jsr:@std/assert@^1';
import { dirname, extname, isAbsolute, join, relative } from 'jsr:@std/path@^1';

import cliMeta from '../../../../deno.json' with { type: 'json' };
import {
  type AppConventionsInput,
  appConventionsReferencedPaths,
  buildAppAgentsMarkdown,
} from '../../../kernel/templates/app/agent-conventions.ts';
import { createPublicCommandTree } from './public-command-tree.ts';

Deno.test('public root command reports the package version', () => {
  const command = createPublicCommandTree({
    cwd: () => Deno.cwd(),
    resolvePath: (path) => path ?? Deno.cwd(),
  });

  assertEquals(command.getVersion(), cliMeta.version);
  assertEquals(command.getVersion() === '1.0.0', false);
});

Deno.test('public init --dry-run leaves the target directory absent', async () => {
  const parent = await Deno.makeTempDir({ prefix: 'netscript-dry-run-' });
  const projectName = 'dry-run-zero';
  const targetPath = `${parent}/${projectName}`;

  try {
    const command = createPublicCommandTree({
      cwd: () => parent,
      resolvePath: (path) => path === undefined ? parent : `${parent}/${path}`,
    });

    await command.parse([
      'init',
      projectName,
      '--path',
      parent,
      '--dry-run',
      '--ci',
      '--yes',
      '--no-aspire',
      '--no-git',
      '--db',
      'none',
    ]);

    await assertPathAbsent(targetPath);
    assertEquals(await readEntryNames(parent), []);
  } finally {
    await Deno.remove(parent, { recursive: true });
  }
});

Deno.test('public init emits resolvable app conventions with and without the example service', async () => {
  assertStringIncludes(
    buildAppAgentsMarkdown({
      appName: 'dashboard',
      dbEngine: 'none',
      includeExampleService: true,
      serviceName: 'users',
    }),
    'Before hand-writing a service request or probing it with curl, follow the MCP path: `list_api_services` to discover the live service name, `list_service_operations` to select an operation, then `get_operation_schema` for its request and response contract.',
  );
  const parent = await Deno.makeTempDir({
    prefix: 'netscript-app-conventions-',
  });

  try {
    await scaffoldFixture(parent, 'with-service', [
      '--service',
      '--service-name',
      'users',
    ]);
    const serviceApp = join(parent, 'with-service', 'apps', 'dashboard');
    const serviceMarkdown = await assertAppConventionsResolve(serviceApp, {
      appName: 'dashboard',
      dbEngine: 'none',
      includeExampleService: true,
      serviceName: 'users',
    });
    assertStringIncludes(
      serviceMarkdown.agents,
      'netscript ui:add page <path> --island',
    );
    assertStringIncludes(
      serviceMarkdown.agents,
      'netscript ui:add island <Name> --query',
    );
    assertStringIncludes(serviceMarkdown.agents, 'netscript ui:add data-table');
    assertStringIncludes(serviceMarkdown.agents, 'probing it with curl');
    assertStringIncludes(serviceMarkdown.agents, 'get_operation_schema');
    assertStringIncludes(
      serviceMarkdown.agents,
      'routes/examples/users/index.tsx',
    );
    const exampleReadme = await Deno.readTextFile(
      join(serviceApp, 'routes', 'examples', 'users', 'README.md'),
    );
    assertStringIncludes(exampleReadme, 'Copy the architecture');
    assertStringIncludes(exampleReadme, 'Delete or replace the sample data');
    await assertPathAbsent(join(serviceApp, 'lib', 'example-service.ts'));
    for (const localDirectory of ['(_components)', '(_islands)', '(_shared)', '(_lib)']) {
      const stat = await Deno.stat(
        join(serviceApp, 'routes', 'examples', 'users', localDirectory),
      );
      assert(stat.isDirectory, `Expected resource-local directory: ${localDirectory}`);
    }
    await Deno.stat(
      join(serviceApp, 'routes', 'examples', 'users', '(_components)', 'managed-form.tsx'),
    );
    await Deno.stat(
      join(serviceApp, 'routes', 'examples', 'users', '(_shared)', 'authorization.ts'),
    );
    for (
      const retainedRoute of [
        join('routes', 'examples', 'crud.tsx'),
        join('routes', 'examples', 'orders', '[id].tsx'),
        join('routes', 'examples', 'telemetry', 'index.tsx'),
        join('routes', 'examples', 'users', 'index.tsx'),
      ]
    ) {
      const stat = await Deno.stat(join(serviceApp, retainedRoute));
      assert(stat.isFile, `Expected retained example route: ${retainedRoute}`);
    }
    await assertExampleImportsResolve(serviceApp);

    await scaffoldFixture(parent, 'with-db-service', [
      '--service',
      '--service-name',
      'users',
    ], 'postgres');
    const dbServiceApp = join(parent, 'with-db-service', 'apps', 'dashboard');
    await Deno.stat(
      join(dbServiceApp, 'routes', 'examples', 'users', '(_islands)', 'ServiceShowcaseLab.tsx'),
    );
    await assertExampleImportsResolve(dbServiceApp);

    await scaffoldFixture(parent, 'without-service');
    const noServiceApp = join(parent, 'without-service', 'apps', 'dashboard');
    const noServiceMarkdown = await assertAppConventionsResolve(noServiceApp, {
      appName: 'dashboard',
      dbEngine: 'none',
      includeExampleService: false,
    });
    assertEquals(
      noServiceMarkdown.agents.includes('routes/examples/users'),
      false,
    );
    assertEquals(
      noServiceMarkdown.webLayer.includes('lib/example-service.ts'),
      false,
    );
    assertEquals(
      noServiceMarkdown.webLayer.includes('routes/examples/telemetry'),
      false,
    );
  } finally {
    await Deno.remove(parent, { recursive: true });
  }
});

async function scaffoldFixture(
  parent: string,
  projectName: string,
  extraArgs: readonly string[] = [],
  dbEngine = 'none',
): Promise<void> {
  const command = createPublicCommandTree({
    cwd: () => parent,
    resolvePath: (path) => path === undefined ? parent : `${parent}/${path}`,
  });
  await command.parse([
    'init',
    projectName,
    '--path',
    parent,
    '--app-name',
    'dashboard',
    '--db',
    dbEngine,
    '--ci',
    '--yes',
    '--no-aspire',
    '--no-git',
    ...extraArgs,
  ]);
}

const IMPORT_SPECIFIER_PATTERN = /(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s*)['"]([^'"]+)['"]/g;
const EXTERNAL_SPECIFIER_PATTERN = /^[a-z][a-z\d+.-]*:/i;

async function assertExampleImportsResolve(appDir: string): Promise<void> {
  const config = JSON.parse(await Deno.readTextFile(join(appDir, 'deno.json'))) as {
    readonly imports?: Readonly<Record<string, string>>;
  };
  const imports = config.imports ?? {};
  const examplesDir = join(appDir, 'routes', 'examples');
  for await (const sourcePath of walkTypeScriptFiles(examplesDir)) {
    const source = await Deno.readTextFile(sourcePath);
    for (const match of source.matchAll(IMPORT_SPECIFIER_PATTERN)) {
      const specifier = match[1];
      const targetPath = resolveEmittedTreeImport(appDir, sourcePath, specifier, imports);
      if (targetPath === undefined) continue;
      let target: Deno.FileInfo;
      try {
        target = await Deno.stat(targetPath);
      } catch (error) {
        if (!(error instanceof Deno.errors.NotFound)) throw error;
        throw new Error(
          `Unresolved emitted import: ${relative(appDir, sourcePath)} imports ${specifier} ` +
            `but ${relative(appDir, targetPath)} does not exist`,
        );
      }
      assert(
        target.isFile,
        `Expected emitted import to resolve to a file: ${
          relative(appDir, sourcePath)
        } -> ${specifier}`,
      );
    }
  }
}

function resolveEmittedTreeImport(
  appDir: string,
  sourcePath: string,
  specifier: string,
  imports: Readonly<Record<string, string>>,
): string | undefined {
  if (EXTERNAL_SPECIFIER_PATTERN.test(specifier)) return undefined;
  if (specifier.startsWith('./') || specifier.startsWith('../')) {
    return join(dirname(sourcePath), specifier);
  }

  const matchingKey = Object.keys(imports)
    .filter((key) =>
      key === specifier ||
      (key.endsWith('/') && specifier.startsWith(key)) ||
      specifier.startsWith(`${key}/`)
    )
    .sort((left, right) => right.length - left.length)[0];
  if (matchingKey === undefined) {
    throw new Error(
      `Unresolved emitted import-map specifier: ${
        relative(appDir, sourcePath)
      } imports ${specifier}`,
    );
  }

  const mappedSpecifier = `${imports[matchingKey]}${specifier.slice(matchingKey.length)}`;
  if (EXTERNAL_SPECIFIER_PATTERN.test(mappedSpecifier)) return undefined;
  if (isAbsolute(mappedSpecifier)) return mappedSpecifier;
  if (mappedSpecifier.startsWith('./') || mappedSpecifier.startsWith('../')) {
    return join(appDir, mappedSpecifier);
  }
  throw new Error(
    `Unsupported emitted import-map target: ${matchingKey} maps ${specifier} to ${mappedSpecifier}`,
  );
}

async function* walkTypeScriptFiles(root: string): AsyncGenerator<string> {
  for await (const entry of Deno.readDir(root)) {
    const path = join(root, entry.name);
    if (entry.isDirectory) {
      yield* walkTypeScriptFiles(path);
    } else if (entry.isFile && ['.ts', '.tsx'].includes(extname(entry.name))) {
      yield path;
    }
  }
}

async function assertAppConventionsResolve(
  appDir: string,
  input: AppConventionsInput,
): Promise<{ readonly agents: string; readonly webLayer: string }> {
  const agentsPath = join(appDir, 'AGENTS.md');
  const webLayerPath = join(appDir, 'WEB-LAYER.md');
  const [agents, webLayer] = await Promise.all([
    Deno.readTextFile(agentsPath),
    Deno.readTextFile(webLayerPath),
  ]);
  const routeFiles: Readonly<Record<string, string>> = {
    '/design/composition': 'routes/(design)/design/composition.tsx',
  };
  const references = [...`${agents}\n${webLayer}`.matchAll(/`([^`\n]+)`/g)]
    .map((match) => match[1])
    .filter((token) =>
      token.startsWith('/') ||
      (!token.includes(' ') && (token.includes('/') || token.includes('.')))
    );
  const parsedPaths = [...new Set(references)].sort();
  const declaredPaths = [...new Set(appConventionsReferencedPaths(input))].sort();
  assertEquals(parsedPaths, declaredPaths);

  for (const reference of parsedPaths) {
    const relativePath = routeFiles[reference] ?? reference;
    const stat = await Deno.stat(join(appDir, relativePath));
    assert(
      stat.isFile,
      `Expected convention path to resolve to a file: ${reference}`,
    );
  }
  return { agents, webLayer };
}

async function assertPathAbsent(path: string): Promise<void> {
  try {
    await Deno.stat(path);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return;
    throw error;
  }
  throw new Error(`Expected path to be absent: ${path}`);
}

async function readEntryNames(path: string): Promise<string[]> {
  const names: string[] = [];
  for await (const entry of Deno.readDir(path)) {
    names.push(entry.name);
  }
  return names.sort();
}
Deno.test('app conventions declare the scaffold dynamic route as a canonical reference', () => {
  const paths = appConventionsReferencedPaths({
    appName: 'dashboard',
    dbEngine: 'none',
    includeExampleService: false,
  });

  assert(
    paths.includes('routes/examples/orders/[id].tsx'),
    'dynamic order route must be part of the canonical scaffold references',
  );
});
