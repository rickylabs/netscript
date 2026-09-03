/**
 * @module templates/app/generators-config_test
 */

import { describe, it } from 'jsr:@std/testing@^1/bdd';
import { assert, assertEquals, assertStringIncludes, assertThrows } from 'jsr:@std/assert@^1';
import {
  SCAFFOLD_APP_IMPORTS,
  SCAFFOLD_WORKSPACE_CATALOG,
} from '../../constants/scaffold/scaffold-app-catalog.ts';
import { generateAppDenoJson } from '../../adapters/templates/app/generate-app-deno-json.ts';
import { generateAppViteConfig } from '../../adapters/templates/app/generate-vite-config.ts';
import { DEFAULT_TEMPLATE_REGISTRY } from '../../application/registries/template-registry.ts';
import { NETSCRIPT_RELEASE_VERSION } from '../../constants/jsr-specifiers.ts';

const CANARY_VERSION = '0.0.6-canary.3';

function jsr(packageName: string, version: string, subpath = ''): string {
  return `jsr:@netscript/${packageName}@${version}${subpath}`;
}

// These generators read templates synchronously, which requires a previously-
// awaited registry hydration. The tests exercise them directly (outside the CLI
// dispatch path), so hydrate at module load.
await DEFAULT_TEMPLATE_REGISTRY.hydrate();

describe('generateAppDenoJson', () => {
  it('should produce valid JSON with scoped name', () => {
    const output = generateAppDenoJson({
      projectName: 'my-project',
      appName: 'dashboard',
      importMode: 'jsr',
    });
    const config = JSON.parse(output);
    assertEquals(config.name, '@my-project/dashboard');
  });

  it('should have exports pointing to main.ts', () => {
    const config = JSON.parse(generateAppDenoJson({
      projectName: 'test',
      appName: 'web',
      importMode: 'jsr',
    }));
    assertEquals(config.exports, './main.ts');
  });

  it('should include Fresh and Preact imports', () => {
    const output = generateAppDenoJson({
      projectName: 'test',
      appName: 'dashboard',
      importMode: 'jsr',
    });
    assertStringIncludes(output, 'fresh');
    assertStringIncludes(output, 'preact');
  });

  it('should include JSX compiler options', () => {
    const config = JSON.parse(generateAppDenoJson({
      projectName: 'test',
      appName: 'dashboard',
      importMode: 'jsr',
    }));
    // Fresh uses precompile JSX with preact as the import source.
    assertEquals(config.compilerOptions.jsx, 'precompile');
    assertEquals(config.compilerOptions.jsxImportSource, 'preact');
  });

  it('should NOT include workspace field (only valid on root deno.json)', () => {
    const config = JSON.parse(generateAppDenoJson({
      projectName: 'test',
      appName: 'dashboard',
      importMode: 'jsr',
    }));
    assert(
      !('workspace' in config),
      'app deno.json must not contain a workspace field — Deno warns when it is present on non-root members',
    );
  });

  it('should have Vite-based tasks', () => {
    const config = JSON.parse(generateAppDenoJson({
      projectName: 'test',
      appName: 'dashboard',
      importMode: 'jsr',
    }));
    assertEquals(
      config.tasks.dev,
      'deno task deps:closure && deno task --cwd ../.. deps:verify && deno run -A npm:vite --configLoader native',
    );
    assertEquals(
      config.tasks['deps:closure'],
      'deno run --allow-read .netscript/verify-dependency-closure.ts',
    );
    assertEquals(
      config.tasks.build,
      'deno task deps:closure && deno run -A npm:vite build',
    );
    assertEquals(config.tasks.serve, 'deno run -A npm:vite preview');
  });

  it('should include Vite and Fresh plugin imports', () => {
    const config = JSON.parse(generateAppDenoJson({
      projectName: 'test',
      appName: 'dashboard',
      importMode: 'jsr',
    }));
    assert(config.imports['@netscript/fresh']);
    assert(config.imports['@netscript/fresh/defer/island']);
    assert(config.imports['@netscript/fresh-ui']);
    assert(config.imports['@test/contracts']);
    assert(config.imports['@netscript/sdk']);
    assert(config.imports['@fresh/plugin-vite']);
    assert(config.imports['@tailwindcss/vite']);
    assert(config.imports['vite']);
    assertEquals(config.imports.zod, 'catalog:');
    assertEquals(config.imports['@netscript/fresh/route'], undefined);
    assertEquals(config.imports['@netscript/fresh-ui/interactive'], undefined);
    assertEquals(config.imports['@netscript/sdk/client'], undefined);
    assertEquals(config.imports['preact/hooks'], undefined);
    assertEquals(config.imports['vite/client'], undefined);
  });

  it('materializes production route dependencies instead of emitting catalog targets', () => {
    const config = JSON.parse(generateAppDenoJson({
      projectName: 'test',
      appName: 'dashboard',
      importMode: 'local',
      localBase: '../..',
    }));

    const unresolvedCatalogImports = Object.entries(config.imports)
      .filter(([, target]) => String(target).startsWith('catalog:'));

    assertEquals(unresolvedCatalogImports, []);
    assertEquals(
      config.imports.zod,
      `npm:zod@${SCAFFOLD_WORKSPACE_CATALOG.zod}`,
    );
  });

  it('should end with trailing newline', () => {
    assert(
      generateAppDenoJson({
        projectName: 'test',
        appName: 'web',
        importMode: 'jsr',
      }).endsWith(
        '\n',
      ),
    );
  });

  it('emits the expected app manifest shape for JSR mode', () => {
    const config = JSON.parse(generateAppDenoJson({
      projectName: 'my-project',
      appName: 'dashboard',
      importMode: 'jsr',
    }));

    assertEquals(config.name, '@my-project/dashboard');
    assertEquals(config.exports, './main.ts');
    assertEquals(Object.keys(config.tasks), [
      'check',
      'deps:closure',
      'dev',
      'build',
      'serve',
      'start',
      'update',
    ]);
    assertEquals(config.exclude, ['**/_fresh/*']);
    assertEquals(Object.keys(config.imports).slice(0, 8), [
      '@app/',
      '@my-project/contracts',
      '@netscript/fresh',
      '@netscript/fresh/defer/island',
      '@netscript/fresh-ui',
      '@netscript/sdk',
      '@netscript/mcp',
      'fresh',
    ]);
    assertEquals(config.imports['@app/'], './');
    assertEquals(
      config.imports['@my-project/contracts'],
      '../../contracts/mod.ts',
    );
    assertEquals(config.imports.vite, SCAFFOLD_APP_IMPORTS.vite);
  });

  it('should resolve @netscript/fresh/vite in local mode', () => {
    const config = JSON.parse(generateAppDenoJson({
      projectName: 'test',
      appName: 'dashboard',
      importMode: 'local',
      localBase: '../..',
    }));
    assertEquals(
      config.imports['@netscript/fresh/defer/island'],
      '../../packages/fresh/src/application/defer/island.ts',
    );
    assertEquals(
      config.imports['@netscript/fresh/vite'],
      '../../packages/fresh/src/application/vite/vite.ts',
    );
  });

  it('should match the validated copied-workspace app contract in local mode', () => {
    const config = JSON.parse(generateAppDenoJson({
      projectName: 'test',
      appName: 'dashboard',
      importMode: 'local',
      localBase: '../..',
      packagesAsWorkspaceMembers: true,
    }));

    assertEquals(
      config.imports['@netscript/fresh'],
      '../../packages/fresh/mod.ts',
    );
    assertEquals(
      config.imports['@netscript/fresh/builders'],
      '../../packages/fresh/src/application/builders/mod.ts',
    );
    assertEquals(
      config.imports['@netscript/fresh/query'],
      '../../packages/fresh/src/application/query/mod.ts',
    );
    assertEquals(
      config.imports['@netscript/fresh/route'],
      '../../packages/fresh/src/application/route/mod.ts',
    );
    assertEquals(
      config.imports['@netscript/fresh/server'],
      '../../packages/fresh/src/runtime/server/mod.ts',
    );
    assertEquals(
      config.imports['@netscript/fresh/vite'],
      '../../packages/fresh/src/application/vite/vite.ts',
    );
    assertEquals(
      config.imports['@netscript/fresh-ui'],
      '../../packages/fresh-ui/mod.ts',
    );
    assertEquals(
      config.imports['@netscript/fresh-ui/interactive'],
      '../../packages/fresh-ui/interactive.ts',
    );
    assertEquals(config.imports['@netscript/sdk'], '../../packages/sdk/mod.ts');
    assertEquals(config.imports['@netscript/mcp'], '../../packages/mcp/mod.ts');
    assertEquals(
      config.imports['@netscript/sdk/client'],
      '../../packages/sdk/src/client/mod.ts',
    );
    assertEquals(
      config.imports['@netscript/sdk/query'],
      '../../packages/sdk/src/query/mod.ts',
    );
    assertEquals(
      config.imports['@netscript/sdk/query-client'],
      '../../packages/sdk/src/query-client/mod.ts',
    );
    assertEquals(config.imports['@test/contracts'], '../../contracts/mod.ts');
    assertEquals(
      config.imports['tailwindcss'],
      SCAFFOLD_APP_IMPORTS.tailwindcss,
    );
    assertEquals(config.imports.vite, SCAFFOLD_APP_IMPORTS.vite);
    assertEquals(config.compilerOptions.types, ['vite/client']);
  });

  it('sources external app dependency pins from the scaffold catalog', () => {
    const config = JSON.parse(generateAppDenoJson({
      projectName: 'test',
      appName: 'dashboard',
      importMode: 'local',
      localBase: '../..',
    }));

    for (const [specifier, target] of Object.entries(SCAFFOLD_APP_IMPORTS)) {
      assertEquals(config.imports[specifier], target);
    }
  });

  it('rejects an incoherent resolver result before serializing the app manifest', () => {
    const error = assertThrows(
      () =>
        generateAppDenoJson({
          projectName: 'test',
          appName: 'dashboard',
          importMode: 'jsr',
          jsrResolver: {
            resolveImport: (specifier) => specifier,
            resolveImports: (specifiers) =>
              Object.fromEntries(specifiers.map((specifier) => [
                specifier,
                specifier === '@netscript/fresh/defer/island'
                  ? jsr('fresh', CANARY_VERSION, '/defer/island')
                  : specifier.startsWith('@netscript/fresh')
                  ? jsr(
                    'fresh',
                    NETSCRIPT_RELEASE_VERSION,
                    specifier.slice('@netscript/fresh'.length),
                  )
                  : specifier.startsWith('@netscript/sdk')
                  ? jsr(
                    'sdk',
                    NETSCRIPT_RELEASE_VERSION,
                    specifier.slice('@netscript/sdk'.length),
                  )
                  : jsr('fresh-ui', NETSCRIPT_RELEASE_VERSION),
              ])),
          },
        }),
      Error,
    );
    assertStringIncludes(
      error.message,
      'NetScript dependency closure is incoherent.',
    );
    assertStringIncludes(error.message, `@netscript/fresh@${NETSCRIPT_RELEASE_VERSION}`);
    assertStringIncludes(
      error.message,
      '@netscript/fresh@0.0.6-canary.3/defer/island',
    );
  });

  it('rejects a non-exact closure member at init', () => {
    const error = assertThrows(
      () =>
        generateAppDenoJson({
          projectName: 'test',
          appName: 'dashboard',
          importMode: 'jsr',
          jsrResolver: {
            resolveImport: (specifier) => specifier,
            resolveImports: (specifiers) =>
              Object.fromEntries(specifiers.map((specifier) => [
                specifier,
                specifier.startsWith('@netscript/fresh')
                  ? jsr(
                    'fresh',
                    `^${NETSCRIPT_RELEASE_VERSION}`,
                    specifier.slice('@netscript/fresh'.length),
                  )
                  : specifier.startsWith('@netscript/sdk')
                  ? jsr(
                    'sdk',
                    NETSCRIPT_RELEASE_VERSION,
                    specifier.slice('@netscript/sdk'.length),
                  )
                  : jsr('fresh-ui', NETSCRIPT_RELEASE_VERSION),
              ])),
          },
        }),
      Error,
    );
    assertStringIncludes(
      error.message,
      `uses non-exact version "^${NETSCRIPT_RELEASE_VERSION}"`,
    );
    assertStringIncludes(error.message, 'pin this member exactly');
  });
});

describe('generateAppViteConfig', () => {
  it('should include the NetScript Vite plugin and workspace watch paths', () => {
    const output = generateAppViteConfig({
      appName: 'dashboard',
      appPort: 50_123,
    });
    assertStringIncludes(output, 'createNetScriptVitePlugin');
    assertStringIncludes(
      output,
      "fresh({ islandSpecifiers: ['@netscript/fresh/defer/island'] })",
    );
    assertStringIncludes(output, "resolve(workspaceRoot, 'packages')");
    assertStringIncludes(output, "resolve(workspaceRoot, 'contracts')");
    assertStringIncludes(output, "resolve(workspaceRoot, 'plugins')");
  });

  it('should include all @app aliases mirrored from the playground', () => {
    const output = generateAppViteConfig({
      appName: 'dashboard',
      appPort: 50_123,
    });
    assertStringIncludes(output, '@app/assets');
    assertStringIncludes(output, '@app/components');
    assertStringIncludes(output, '@app/islands');
    assertStringIncludes(output, '@app/lib');
    assertStringIncludes(output, '@app/routes');
  });

  it('keeps alias and plugin ordering stable in the vite config', () => {
    const output = generateAppViteConfig({
      appName: 'dashboard',
      appPort: 50_123,
    });

    assert(
      output.indexOf("{ find: '@app/assets'") <
          output.indexOf("{ find: '@app/components'") &&
        output.indexOf("{ find: '@app/components'") <
          output.indexOf("{ find: '@app/islands'") &&
        output.indexOf("{ find: '@app/islands'") <
          output.indexOf("{ find: '@app/lib'") &&
        output.indexOf("{ find: '@app/lib'") <
          output.indexOf("{ find: '@app/routes'"),
    );
    assert(
      output.indexOf("fresh({ islandSpecifiers: ['@netscript/fresh/defer/island'] }),") <
          output.indexOf('tailwindCSS(),') &&
        output.indexOf('tailwindCSS(),') <
          output.indexOf('createNetScriptVitePlugin({'),
    );
    const fallback = /process\.env\.PORT \?\? '(\d+)'/.exec(output);
    assertEquals(fallback?.[1] !== undefined, true);
    assertEquals(Number(fallback?.[1]) >= 49_152, true);
  });
});
