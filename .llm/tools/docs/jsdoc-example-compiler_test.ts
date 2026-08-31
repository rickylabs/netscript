import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { dirname, fromFileUrl } from '@std/path';
import type {
  JsdocExampleAnalysis,
  JsdocExampleBlock,
  JsdocExampleOwner,
} from './jsdoc-example-contract.ts';
import { classifyDenoCheckDiagnostics, compileJsdocExamples } from './jsdoc-example-compiler.ts';
import { JSDOC_SCAFFOLD_ALIAS_RULES } from './snippet-supports.ts';
import { resolveWorkspaceSurface } from './snippet-workspace.ts';

const repositoryRoot = dirname(dirname(dirname(dirname(fromFileUrl(import.meta.url)))));

function owner(
  symbol: string,
  declarationKind: 'value' | 'type' | 'class',
  publicSpecifier: string,
): JsdocExampleOwner {
  return {
    memberName: publicSpecifier.split('/').slice(0, 2).join('/'),
    memberRoot: 'packages/test',
    sourcePath: 'packages/test/mod.ts',
    kind: 'symbol',
    symbol,
    declarationKind,
    publicSpecifier,
  };
}

function block(
  blockOwner: JsdocExampleOwner,
  body: string,
  fenceOrdinal = 1,
  exemptionReason?: string,
): JsdocExampleBlock {
  return {
    owner: blockOwner,
    exampleOrdinal: 1,
    fenceOrdinal,
    openingLine: 1,
    codeStartLine: 2,
    language: 'ts',
    checkedLanguage: 'ts',
    compilationExtension: 'ts',
    exemptionReason,
    body,
  };
}

function analysis(blocks: JsdocExampleBlock[]): JsdocExampleAnalysis {
  const exempt = blocks.filter((candidate) => candidate.exemptionReason !== undefined);
  return {
    blocks,
    exemptions: exempt,
    findings: blocks.map((candidate) => ({
      disposition: candidate.exemptionReason ? 'exempt' : 'checked',
      owner: candidate.owner,
      exampleOrdinal: candidate.exampleOrdinal,
      fenceOrdinal: candidate.fenceOrdinal,
      reason: candidate.exemptionReason,
    })),
    census: {
      members: blocks.length > 0 ? 1 : 0,
      files: blocks.length > 0 ? 1 : 0,
      examples: blocks.length,
      candidates: blocks.length,
      checked: blocks.length - exempt.length,
      exempt: exempt.length,
      nonTypeScript: 0,
      unfenced: 0,
      malformed: 0,
      failures: 0,
    },
  };
}

Deno.test('published-only workspace resolver excludes publish:false members', async () => {
  const surface = await resolveWorkspaceSurface(repositoryRoot, {}, { publishedOnly: true });
  assertEquals(surface.memberCount, 35);
  assertEquals(surface.imports['@netscript/cli-e2e'], undefined);
  assertEquals(surface.imports['@netscript/bench'], undefined);
});
Deno.test('zero candidates and zero checked modules refuse before spawning Deno', async () => {
  const zeroCandidates = await compileJsdocExamples(analysis([]), repositoryRoot);
  assertEquals(zeroCandidates.code, 1);
  assertEquals(zeroCandidates.denoCheckSpawned, false);
  assertStringIncludes(zeroCandidates.diagnostics, 'zero candidates');

  const exempt = block(
    owner('PaginationInputSchema', 'value', '@netscript/contracts/query'),
    'PaginationInputSchema.parse({ page: 1, limit: 20 });',
    1,
    'illustrative fragment',
  );
  const zeroChecked = await compileJsdocExamples(analysis([exempt]), repositoryRoot);
  assertEquals(zeroChecked.code, 1);
  assertEquals(zeroChecked.denoCheckSpawned, false);
  assertStringIncludes(zeroChecked.diagnostics, 'zero checked modules');
});

Deno.test('relative and undeclared NetScript subpath controls fail without execution', async () => {
  const moduleOwner: JsdocExampleOwner = {
    memberName: '@netscript/sdk',
    memberRoot: 'packages/sdk',
    sourcePath: 'packages/sdk/mod.ts',
    kind: 'module',
  };
  const result = await compileJsdocExamples(
    analysis([
      block(moduleOwner, 'import "../src/dead.ts";'),
      block(moduleOwner, 'import { nope } from "@netscript/sdk/not-shipped";\nvoid nope;', 2),
    ]),
    repositoryRoot,
  );
  assertEquals(result.code, 1);
  assertEquals(result.denoCheckSpawned, false);
  assertEquals(result.failureCensus.badSpecifier, 2);
  assertStringIncludes(result.diagnostics, 'relative/absolute import');
  assertStringIncludes(result.diagnostics, 'undeclared NetScript subpath');
});

Deno.test('scaffold aliases align to app and service generators per documented owner', async () => {
  const generatorProbe = await new Deno.Command(Deno.execPath(), {
    cwd: repositoryRoot,
    args: [
      'eval',
      '--config',
      'packages/cli/deno.json',
      `import { generateAppDenoJson } from "./packages/cli/src/kernel/adapters/templates/app/generate-app-deno-json.ts";
import { generateServiceDenoJson } from "./packages/cli/src/kernel/templates/service/generate-service-deno-json.ts";
const app = JSON.parse(generateAppDenoJson({ projectName: "my-app", appName: "dashboard", importMode: "jsr" }));
const service = JSON.parse(generateServiceDenoJson({ projectName: "my-app", serviceName: "users", importMode: "jsr", hasDatabase: true }));
console.log(JSON.stringify({ app, service }));`,
    ],
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  assertEquals(generatorProbe.code, 0, new TextDecoder().decode(generatorProbe.stderr));
  const { app: appConfig, service: serviceConfig } = JSON.parse(
    new TextDecoder().decode(generatorProbe.stdout),
  );
  assertEquals(appConfig.imports['@app/'], './');
  assertEquals(serviceConfig.imports['@app/'], undefined);
  assertEquals(typeof serviceConfig.imports['@database'], 'string');
  assertEquals(
    JSDOC_SCAFFOLD_ALIAS_RULES.map(({ prefix, scaffoldKind }) => ({ prefix, scaffoldKind })),
    [
      { prefix: '@app/', scaffoldKind: 'app' },
      { prefix: '@database', scaffoldKind: 'service' },
    ],
  );

  const serviceOwner = owner('defineService', 'value', '@netscript/service');
  const rejected = await compileJsdocExamples(
    analysis([
      block(
        serviceOwner,
        'import { definePage } from "@app/utils.ts";\nvoid definePage;',
      ),
    ]),
    repositoryRoot,
  );
  assertEquals(rejected.code, 1);
  assertEquals(rejected.failureCensus.badSpecifier, 1);
  assertStringIncludes(rejected.diagnostics, 'app-generated alias');

  const appOwner: JsdocExampleOwner = {
    memberName: '@netscript/fresh',
    memberRoot: 'packages/fresh',
    sourcePath: 'packages/fresh/mod.ts',
    kind: 'module',
  };
  const accepted = await compileJsdocExamples(
    analysis([
      block(
        appOwner,
        'import { definePage } from "@app/utils.ts";\nvoid definePage;',
      ),
    ]),
    repositoryRoot,
  );
  assertEquals(accepted.code, 0, accepted.diagnostics);
  assertEquals(accepted.failureCensus.badSpecifier, 0);
});

Deno.test('ambient documented-symbol injection covers const, type, and class shapes', async () => {
  const result = await compileJsdocExamples(
    analysis([
      block(
        owner('PaginationInputSchema', 'value', '@netscript/contracts/query'),
        'PaginationInputSchema.parse({ page: 1, limit: 20 });',
      ),
      block(
        owner('PaginationInput', 'type', '@netscript/contracts/query'),
        'const input: PaginationInput = { page: 1, limit: 20, sortOrder: "asc" };\nvoid input;',
        2,
      ),
      block(
        owner('MemoryKvAdapter', 'class', '@netscript/kv'),
        'const Adapter: typeof MemoryKvAdapter = MemoryKvAdapter;\nlet instance: MemoryKvAdapter | undefined;\nvoid Adapter;\nvoid instance;',
        3,
      ),
    ]),
    repositoryRoot,
  );
  assertEquals(result.code, 0, result.diagnostics);
  assert(result.denoCheckSpawned);
  assert(result.rootLockUnchanged);
});

Deno.test('an explicit documented-symbol import may shadow the ambient convention', async () => {
  const result = await compileJsdocExamples(
    analysis([
      block(
        owner('PaginationInputSchema', 'value', '@netscript/contracts/query'),
        'import { PaginationInputSchema } from "@netscript/contracts/query";\nPaginationInputSchema.parse({ page: 1, limit: 20 });',
      ),
    ]),
    repositoryRoot,
  );
  assertEquals(result.code, 0, result.diagnostics);
});

Deno.test('body diagnostics are classified and deferred without weakening the import gate', async () => {
  const result = await compileJsdocExamples(
    analysis([
      block(
        owner('PaginationInputSchema', 'value', '@netscript/contracts/query'),
        'PaginationInputSchema.parse(missingInput);',
      ),
    ]),
    repositoryRoot,
  );
  assertEquals(result.code, 0, result.diagnostics);
  assertEquals(result.enforcedFailureCount, 0);
  assertEquals(result.failureCensus.unboundName, 1);
  assertEquals(
    result.deferredExamples.map((example) => ({
      failureClass: example.failureClass,
      exampleOrdinal: example.exampleOrdinal,
      fenceOrdinal: example.fenceOrdinal,
      tsCodes: example.tsCodes,
    })),
    [{
      failureClass: 'unboundName',
      exampleOrdinal: 1,
      fenceOrdinal: 1,
      tsCodes: [2304],
    }],
  );
});

Deno.test('an unclassified compiler abort fails closed even when deferred syntax findings exist', async () => {
  const result = await compileJsdocExamples(
    analysis([
      block(
        owner('PaginationInputSchema', 'value', '@netscript/contracts/query'),
        'const illustrative = { value: ... };',
      ),
      block(
        owner('PaginationInput', 'type', '@netscript/contracts/query'),
        'const rendered = <App />;\nvoid rendered;',
        2,
      ),
    ]),
    repositoryRoot,
  );
  assertEquals(result.code, 1);
  assertEquals(result.failureCensus.typeError, 1);
  assertStringIncludes(result.diagnostics, 'SyntaxError');
});

Deno.test('placeholder preclassification ignores comments and leaves diagnostics to Deno', async () => {
  const result = await compileJsdocExamples(
    analysis([
      block(
        owner('PaginationInputSchema', 'value', '@netscript/contracts/query'),
        '// ... { illustrative input }\nPaginationInputSchema.parse({ page: 1, limit: 20 });',
      ),
      block(
        owner('PaginationInput', 'type', '@netscript/contracts/query'),
        'const repeated = 1;\n// ... { repeated: 2 }\nconst repeated = 2;\nvoid repeated;',
        2,
      ),
    ]),
    repositoryRoot,
  );
  assertEquals(result.code, 0, result.diagnostics);
  assert(result.denoCheckSpawned);
  assertEquals(result.failureCensus.typeError, 1);
  assertEquals(
    result.deferredExamples.map(({ fenceOrdinal, tsCodes }) => ({ fenceOrdinal, tsCodes })),
    [{ fenceOrdinal: 2, tsCodes: [2451] }],
  );
});

Deno.test('an exempt bad specifier remains a policy failure', async () => {
  const bad = block(
    owner('PaginationInputSchema', 'value', '@netscript/contracts/query'),
    'import "./missing.ts";\nPaginationInputSchema.parse({ page: 1, limit: 20 });',
    1,
    'illustrative fragment',
  );
  const good = block(
    owner('PaginationInputSchema', 'value', '@netscript/contracts/query'),
    'PaginationInputSchema.parse({ page: 1, limit: 20 });',
    2,
  );
  const result = await compileJsdocExamples(analysis([bad, good]), repositoryRoot);
  assertEquals(result.code, 1);
  assertEquals(result.failureCensus.badSpecifier, 1);
  assertStringIncludes(result.diagnostics, 'relative/absolute import');
});

Deno.test('diagnostic classification is identical with compiler color on and off', () => {
  const moduleOwner: JsdocExampleOwner = {
    memberName: '@netscript/test',
    memberRoot: 'packages/test',
    sourcePath: 'packages/test/mod.ts',
    kind: 'module',
  };
  const modules = [
    {
      path: '/tmp/jsdoc-examples/bad-import.ts',
      block: block(moduleOwner, 'import "missing";', 1),
    },
    {
      path: '/tmp/jsdoc-examples/unbound-name.ts',
      block: block(moduleOwner, 'void missing;', 2),
    },
    {
      path: '/tmp/jsdoc-examples/type-error.ts',
      block: block(moduleOwner, 'const value: string = 1;', 3),
    },
  ];
  const plain = [
    'TS2307 [ERROR]: Cannot find module.',
    '    at file:///tmp/jsdoc-examples/bad-import.ts:3:1',
    'TS2304 [ERROR]: Cannot find name.',
    '    at file:///tmp/jsdoc-examples/unbound-name.ts:3:1',
    'TS2345 [ERROR]: Argument is not assignable.',
    '    at file:///tmp/jsdoc-examples/type-error.ts:3:1',
  ].join('\n');
  const colored = plain
    .replaceAll(/TS(\d+)/g, '\u001b[31mTS$1\u001b[0m')
    .replaceAll(
      /file:\/\/\/tmp\/jsdoc-examples\/[^:]+:\d+:\d+/g,
      '\u001b[36m$&\u001b[0m',
    );

  const withoutColor = classifyDenoCheckDiagnostics(plain, modules);
  const withColor = classifyDenoCheckDiagnostics(colored, modules);
  assertEquals(withColor, withoutColor);
  assertEquals(withColor.census, { badSpecifier: 1, typeError: 1, unboundName: 1 });
  assertEquals(
    withColor.deferredExamples.map((example) => ({
      failureClass: example.failureClass,
      fenceOrdinal: example.fenceOrdinal,
      tsCodes: example.tsCodes,
    })),
    [
      { failureClass: 'unboundName', fenceOrdinal: 2, tsCodes: [2304] },
      { failureClass: 'typeError', fenceOrdinal: 3, tsCodes: [2345] },
    ],
  );
});
