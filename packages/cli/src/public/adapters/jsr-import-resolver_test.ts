import { describe, it } from 'jsr:@std/testing@^1/bdd';
import { assertEquals, assertRejects } from 'jsr:@std/assert@^1';
import { SCAFFOLD_PACKAGES } from '../../kernel/constants/scaffold/scaffold-packages.ts';
import { JsrImportResolver } from './jsr-import-resolver.ts';

describe('JsrImportResolver', () => {
  it('resolves NetScript package specifiers to JSR imports', () => {
    const resolver = new JsrImportResolver();

    assertEquals(
      resolver.resolveImport(SCAFFOLD_PACKAGES.NETSCRIPT_FRESH),
      'jsr:@netscript/fresh@^1.0.0',
    );
    assertEquals(
      resolver.resolveImport(SCAFFOLD_PACKAGES.NETSCRIPT_FRESH_VITE),
      'jsr:@netscript/fresh@^1.0.0/vite',
    );
    assertEquals(
      resolver.resolveImport(SCAFFOLD_PACKAGES.NETSCRIPT_FRESH_UI_INTERACTIVE),
      'jsr:@netscript/fresh-ui@^1.0.0/interactive',
    );
    assertEquals(
      resolver.resolveImport(SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN_AUTH_CORE_CONTRACTS_V1),
      'jsr:@netscript/plugin-auth-core@^1.0.0/contracts/v1',
    );
    assertEquals(
      resolver.resolveImport(SCAFFOLD_PACKAGES.NETSCRIPT_AUTH_KV_OAUTH),
      'jsr:@netscript/auth-kv-oauth@^1.0.0',
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
        [SCAFFOLD_PACKAGES.NETSCRIPT_SDK]: 'jsr:@netscript/sdk@^1.0.0',
        [SCAFFOLD_PACKAGES.NETSCRIPT_SDK_CLIENT]: 'jsr:@netscript/sdk@^1.0.0/client',
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
