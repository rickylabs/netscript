import { assertEquals, assertRejects, assertStringIncludes } from '@std/assert';
import { dirname, join } from '@std/path';
import { LocalProjectFiles } from '@netscript/plugin/cli';
import { generateSagaRegistry, SAGAS_REGISTRY_PATH } from '../../src/cli/registry-generator.ts';
import { inspectSagasProject } from '../../src/cli/saga-inspector.ts';

const DECLARATION =
  "export default defineSagaConfig('agent-action', 'sagas/agent-action.ts').build();";
const FACTORY = 'export default defineAgentActionSaga();';
const OPTIONS = { fileSuffixes: ['-saga.ts'], exclude: ['mod.ts', 'plugin.ts', 'types.ts'] };

Deno.test('declared saga factory bypasses naming convention and undeclared non-saga stays out', async () => {
  await project({
    'sagas/agent-action.config.ts': DECLARATION,
    'sagas/agent-action.ts': FACTORY,
    'sagas/helper.ts': 'export default createHelper();',
    'sagas/helper-saga.ts': 'export function createHelper() {}',
  }, async (files) => {
    const inspected = await inspectSagasProject(files);
    assertEquals(inspected.entries[0].runtimeDeclarations, [{
      id: 'agent-action',
      entrypoint: 'sagas/agent-action.ts',
    }]);
    const generated = await generateSagaRegistry(files, OPTIONS);
    assertEquals(generated.sagas, ['sagas/agent-action.ts']);
    const source = await files.readTextFile(SAGAS_REGISTRY_PATH) ?? '';
    assertStringIncludes(source, "import * as saga0 from '../../../sagas/agent-action.ts'");
    assertEquals(source.includes('agent-action.config.ts'), false);
    assertEquals(source.includes('helper'), false);
  });
});

Deno.test('root config resolves declared modules outside conventional roots without evaluating it', async () => {
  await project({
    'netscript.config.ts': `
import { defineSagaConfig as declareSaga } from '@netscript/plugin-sagas-core/config';
throw new Error('config must never execute');
export const app = { services: ['operations'], plugins: ['sagas'] };
export const entry = declareSaga( /* id */ 'agent-action', /* path */ './plugins/sagas/agent-action.ts', ).build();
`,
    'plugins/sagas/agent-action.ts': FACTORY,
  }, async (files) => {
    const generated = await generateSagaRegistry(files, OPTIONS);
    assertEquals(generated.sagas, ['plugins/sagas/agent-action.ts']);
  });
});

Deno.test('saga config lexer ignores declaration text inside comments strings templates and regexes', async () => {
  await project({
    'sagas/notes.config.ts': [
      "// defineSagaConfig('ghost', 'sagas/missing.ts')",
      "/* defineSagaConfig('ghost', 'sagas/missing.ts') */",
      "const text = \"defineSagaConfig('ghost', 'sagas/missing.ts')\";",
      'const template = `defineSagaConfig("ghost", "sagas/missing.ts")`;',
      'const pattern = /defineSagaConfig("ghost", "sagas\\/missing.ts")/;',
    ].join('\n'),
  }, async (files) => {
    assertEquals((await inspectSagasProject(files)).entries, []);
    assertEquals((await generateSagaRegistry(files, OPTIONS)).sagas, []);
  });
});

for (
  const args of [
    "'agent-action', getEntrypoint()",
    "getId(), 'sagas/agent-action.ts'",
    "'agent-action'",
    "'agent-action', ''",
    "'agent-action', `sagas/${name}.ts`",
    "'agent-action', 'sagas/agent-action.ts', extra",
  ]
) {
  Deno.test(`unresolvable saga declaration rejects nonliteral or incomplete arguments: ${args}`, async () => {
    await project({
      'sagas/agent-action.config.ts': `export default defineSagaConfig(${args}).build();`,
    }, async (files) => {
      const error = await assertRejects(
        () => generateSagaRegistry(files, OPTIONS),
        Error,
        'Invalid saga declaration',
      );
      assertStringIncludes(error.message, 'sagas/agent-action.config.ts');
      assertEquals(await files.readTextFile(SAGAS_REGISTRY_PATH), undefined);
    });
  });
}

for (
  const [target, source, message] of [
    ['sagas/missing.ts', undefined, 'missing module sagas/missing.ts'],
    ['/outside.ts', FACTORY, 'project-relative TypeScript module'],
    ['C:/outside.ts', FACTORY, 'project-relative TypeScript module'],
    ['../outside.ts', undefined, 'inside the project'],
    ['file:///outside.ts', undefined, 'project-relative TypeScript module'],
    ['sagas/module.ts?query', undefined, 'project-relative TypeScript module'],
    ['.netscript/generated/module.ts', FACTORY, 'not a config or generated module'],
    ['sagas/other.config.ts', '', 'not a config or generated module'],
    ['sagas/other.json', '{}', 'runtime .ts/.tsx module'],
    ['sagas/no-export.ts', 'export function createSaga() {}', 'no runtime export'],
  ] as const
) {
  Deno.test(`unresolvable declared saga fails before writing: ${target}`, async () => {
    const sources: Record<string, string> = {
      'sagas/agent-action.config.ts':
        `export default defineSagaConfig('agent-action', '${target}').build();`,
    };
    if (source !== undefined && !target.startsWith('/') && !target.includes(':')) {
      sources[target] = source;
    }
    await project(sources, async (files) => {
      const error = await assertRejects(() => generateSagaRegistry(files, OPTIONS), Error, message);
      assertStringIncludes(error.message, 'agent-action');
      assertStringIncludes(error.message, 'sagas/agent-action.config.ts');
      assertEquals(await files.readTextFile(SAGAS_REGISTRY_PATH), undefined);
    });
  });
}

Deno.test('active declarations cannot be silently removed by manifest exclusions or first-line ignore', async () => {
  for (const ignored of [false, true]) {
    await project({
      'sagas/agent-action.config.ts': DECLARATION,
      'sagas/agent-action.ts': (ignored ? '// @netscript-registry-ignore\n' : '') + FACTORY,
    }, async (files) => {
      await assertRejects(
        () =>
          generateSagaRegistry(files, {
            ...OPTIONS,
            exclude: ignored ? [] : ['agent-action.ts'],
          }),
        Error,
        ignored ? 'ignored module' : 'excluded module',
      );
    });
  }
});

Deno.test('zero active saga declarations preserve valid empty output including ignored configs', async () => {
  await project({
    'sagas/ignored.config.ts':
      '// @netscript-registry-ignore\nexport default defineSagaConfig(dynamic);',
    'sagas/excluded.config.ts': 'export default defineSagaConfig(dynamic);',
    'sagas/helper.ts': 'export const value = 1;',
  }, async (files) => {
    const result = await generateSagaRegistry(files, {
      ...OPTIONS,
      exclude: ['excluded.config.ts'],
    });
    assertEquals(result.sagas, []);
    const source = await files.readTextFile(result.registryPath) ?? '';
    assertStringIncludes(source, 'const entries: readonly [string, SagaDefinition][] = [\n];');
    assertStringIncludes(source, 'export const sagaRegistry');
    assertStringIncludes(source, 'export const registry');
  });
});

Deno.test('matching config declarations and native discoveries deduplicate after normalization', async () => {
  await project({
    'netscript.config.ts':
      "export const entry = defineSagaConfig('agent-action', './sagas/agent-action-saga.ts').build();",
    'sagas/agent-action.config.ts':
      "export default defineSagaConfig('agent-action', 'sagas/agent-action-saga.ts').build();",
    'sagas/agent-action-saga.ts': "export default defineSaga('agent-action');",
  }, async (files) => {
    assertEquals((await generateSagaRegistry(files, OPTIONS)).sagas, [
      'sagas/agent-action-saga.ts',
    ]);
  });
});

for (const [id, path] of [['agent-action', 'sagas/other.ts'], ['other', 'sagas/agent-action.ts']]) {
  Deno.test(`conflicting saga declarations fail: ${id} at ${path}`, async () => {
    await project({
      'netscript.config.ts': `export const other = defineSagaConfig('${id}', '${path}').build();`,
      'sagas/agent-action.config.ts': DECLARATION,
      'sagas/agent-action.ts': FACTORY,
      'sagas/other.ts': FACTORY,
    }, async (files) => {
      await assertRejects(
        () => generateSagaRegistry(files, OPTIONS),
        Error,
        'conflicts with another saga declaration',
      );
    });
  });
}

for (
  const source of [
    'export { composed as default };',
    'export { composed as saga } from "../core.ts";',
    'export { definition };',
    'export const definition = compose();',
  ]
) {
  Deno.test(`declared saga accepts runtime export form: ${source}`, async () => {
    await project({
      'sagas/agent-action.config.ts': DECLARATION,
      'sagas/agent-action.ts': source,
    }, async (files) => {
      assertEquals((await generateSagaRegistry(files, OPTIONS)).sagas, ['sagas/agent-action.ts']);
    });
  });
}

for (
  const source of ['export type { Definition as saga };', 'export { type Definition as saga };']
) {
  Deno.test(`type-only saga export cannot resolve a declared runtime module: ${source}`, async () => {
    await project({
      'sagas/agent-action.config.ts': DECLARATION,
      'sagas/agent-action.ts': source,
    }, async (files) => {
      await assertRejects(() => generateSagaRegistry(files, OPTIONS), Error, 'no runtime export');
    });
  });
}

for (const quote of ['"', '`']) {
  Deno.test(`literal saga declarations support ${quote} quoting`, async () => {
    await project({
      'sagas/agent-action.config.ts':
        `export default defineSagaConfig(${quote}agent-action${quote}, ${quote}sagas/agent-action.ts${quote}).build();`,
      'sagas/agent-action.ts': FACTORY,
    }, async (files) => {
      assertEquals((await generateSagaRegistry(files, OPTIONS)).sagas, ['sagas/agent-action.ts']);
    });
  });
}

Deno.test('root config divisions cannot swallow subsequent literal saga declarations', async () => {
  await project({
    'netscript.config.ts': `
const firstRatio = total / count / factor;
const secondRatio = total / count; export const entry = defineSagaConfig('agent-action', 'sagas/agent-action.ts').build();
const assertion = defineSagaConfig as unknown;
const unrelated = unknown('other', 'sagas/missing.ts');
`,
    'sagas/agent-action.ts': FACTORY,
  }, async (files) => {
    assertEquals((await generateSagaRegistry(files, OPTIONS)).sagas, ['sagas/agent-action.ts']);
  });
});

async function project(
  sources: Readonly<Record<string, string>>,
  run: (files: LocalProjectFiles) => Promise<void>,
): Promise<void> {
  const root = await Deno.makeTempDir({ prefix: 'saga-declarations-' });
  try {
    for (const [path, source] of Object.entries(sources)) {
      // Invalid entrypoints are declaration text only; never create outside the fixture.
      if (path.startsWith('../')) continue;
      await Deno.mkdir(dirname(join(root, path)), { recursive: true });
      await Deno.writeTextFile(join(root, path), source);
    }
    await run(new LocalProjectFiles(root));
  } finally {
    await Deno.remove(root, { recursive: true });
  }
}
