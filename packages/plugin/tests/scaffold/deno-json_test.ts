import { assertEquals } from '@std/assert';
import { buildPluginDenoJson, buildStandardScaffoldArtifacts } from '../../src/scaffold/mod.ts';

Deno.test('buildPluginDenoJson emits the generated-plugin envelope', () => {
  const json = buildPluginDenoJson({
    pluginName: 'example',
    exports: {
      '.': './mod.ts',
      './services': './services/src/main.ts',
    },
    tasks: {
      check: 'deno check mod.ts services/src/main.ts',
      test: 'deno test --allow-all',
    },
    imports: {
      '@netscript/plugin': 'jsr:@netscript/plugin@0.0.1-alpha.12',
      zod: 'jsr:@zod/zod@4.4.3',
    },
  }, '0.0.1-alpha.12');

  assertEquals(
    json,
    `{
  "name": "@netscript-app/plugin-example",
  "version": "0.1.0",
  "exports": {
    ".": "./mod.ts",
    "./services": "./services/src/main.ts"
  },
  "tasks": {
    "check": "deno check mod.ts services/src/main.ts",
    "test": "deno test --allow-all"
  },
  "imports": {
    "@netscript/plugin": "jsr:@netscript/plugin@0.0.1-alpha.12",
    "zod": "jsr:@zod/zod@4.4.3"
  },
  "compilerOptions": {
    "lib": [
      "deno.ns",
      "deno.unstable",
      "dom",
      "dom.iterable"
    ],
    "strict": true
  }
}
`,
  );
});

Deno.test('buildStandardScaffoldArtifacts emits the stable root artifact trio', () => {
  assertEquals(
    buildStandardScaffoldArtifacts({
      pluginName: 'example',
      manifestJson: '{}\n',
      denoJson: '{"name":"example"}\n',
      modTs: 'export {};\n',
    }),
    [
      {
        path: 'plugins/example/scaffold.plugin.json',
        content: '{}\n',
      },
      {
        path: 'plugins/example/deno.json',
        content: '{"name":"example"}\n',
      },
      {
        path: 'plugins/example/mod.ts',
        content: 'export {};\n',
      },
    ],
  );
});
