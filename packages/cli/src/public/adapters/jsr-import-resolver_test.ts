import { describe, it } from 'jsr:@std/testing@^1/bdd';
import { assertEquals, assertRejects } from 'jsr:@std/assert@^1';
import { SCAFFOLD_PACKAGES } from '../../kernel/constants/scaffold/scaffold-packages.ts';
import { netscriptJsrSpecifier } from '../../kernel/constants/jsr-specifiers.ts';
import { JsrImportResolver } from './jsr-import-resolver.ts';

describe('JsrImportResolver', () => {
  it('resolves NetScript package specifiers to JSR imports', () => {
    const resolver = new JsrImportResolver();

    assertEquals(
      resolver.resolveImport(SCAFFOLD_PACKAGES.NETSCRIPT_FRESH),
      netscriptJsrSpecifier('fresh'),
    );
    assertEquals(
      resolver.resolveImport(SCAFFOLD_PACKAGES.NETSCRIPT_FRESH_VITE),
      netscriptJsrSpecifier('fresh', '/vite'),
    );
    assertEquals(
      resolver.resolveImport(SCAFFOLD_PACKAGES.NETSCRIPT_FRESH_UI_INTERACTIVE),
      netscriptJsrSpecifier('fresh-ui', '/interactive'),
    );
    assertEquals(
      resolver.resolveImport(SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN_AUTH_CORE_CONTRACTS_V1),
      netscriptJsrSpecifier('plugin-auth-core', '/contracts/v1'),
    );
    assertEquals(
      resolver.resolveImport(SCAFFOLD_PACKAGES.NETSCRIPT_AUTH_KV_OAUTH),
      netscriptJsrSpecifier('auth-kv-oauth'),
    );
  });

  it('resolves external dependencies to registry imports', () => {
    const resolver = new JsrImportResolver();

    assertEquals(resolver.resolveImport(SCAFFOLD_PACKAGES.STD_PATH), 'jsr:@std/path@^1.0.0');
    assertEquals(resolver.resolveImport(SCAFFOLD_PACKAGES.ZOD), 'npm:zod@^4.3.6');
  });

  it('resolves selected imports as an import-map fragment', () => {
    const resolver = new JsrImportResolver();

    assertEquals(
      resolver.resolveImports([
        SCAFFOLD_PACKAGES.NETSCRIPT_SDK,
        SCAFFOLD_PACKAGES.NETSCRIPT_SDK_CLIENT,
      ]),
      {
        [SCAFFOLD_PACKAGES.NETSCRIPT_SDK]: netscriptJsrSpecifier('sdk'),
        [SCAFFOLD_PACKAGES.NETSCRIPT_SDK_CLIENT]: netscriptJsrSpecifier('sdk', '/client'),
      },
    );
  });

  it('rejects unknown import keys', async () => {
    const resolver = new JsrImportResolver();

    await assertRejects(
      () => Promise.resolve().then(() => resolver.resolveImport('@netscript/unknown')),
      Error,
      'No JSR import mapping',
    );
  });
});
