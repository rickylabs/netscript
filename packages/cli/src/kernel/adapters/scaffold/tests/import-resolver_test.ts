/**
 * @module import-resolver_test
 *
 * Unit tests for import resolution utilities — JSR and local modes.
 */

import { describe, it } from 'jsr:@std/testing@^1/bdd';
import { assertEquals, assertStringIncludes } from 'jsr:@std/assert@^1';
import { resolveNetScriptImports, resolveNuGetReference } from '../import-resolver.ts';

describe('resolveNetScriptImports', () => {
  it('should keep direct scaffold package families aligned across modes', () => {
    const cases = [
      {
        mode: 'jsr' as const,
        base: undefined,
        expected: {
          '@netscript/config': 'jsr:@netscript/config',
          '@netscript/service': 'jsr:@netscript/service',
          '@netscript/plugin-auth-core/contracts/v1':
            'jsr:@netscript/plugin-auth-core@0.0.1-alpha.2/contracts/v1',
          '@netscript/auth-kv-oauth': 'jsr:@netscript/auth-kv-oauth@0.0.1-alpha.2',
          '@std/path': 'jsr:@std/path',
          zod: 'npm:zod',
        },
      },
      {
        mode: 'local' as const,
        base: '../../../monorepo',
        expected: {
          '@netscript/config': '../../../monorepo/packages/config/mod.ts',
          '@netscript/service': '../../../monorepo/packages/service/mod.ts',
          '@netscript/plugin-auth-core/contracts/v1':
            '../../../monorepo/packages/plugin-auth-core/src/contracts/v1/mod.ts',
          '@netscript/auth-kv-oauth': '../../../monorepo/packages/auth-kv-oauth/mod.ts',
          '@std/path': 'jsr:@std/path',
          zod: 'npm:zod',
        },
      },
    ];

    for (const testCase of cases) {
      const imports = resolveNetScriptImports(testCase.mode, testCase.base);
      for (const [specifier, expectedPrefix] of Object.entries(testCase.expected)) {
        assertStringIncludes(imports[specifier], expectedPrefix);
      }
    }
  });

  it('should resolve JSR mode imports', () => {
    const imports = resolveNetScriptImports('jsr');
    assertStringIncludes(imports['@netscript/config'], 'jsr:@netscript/config');
    assertStringIncludes(imports['@netscript/service'], 'jsr:@netscript/service');
    assertStringIncludes(imports['@std/path'], 'jsr:@std/path');
    assertStringIncludes(imports['zod'], 'npm:zod');
  });

  it('should resolve local mode imports with default base', () => {
    const imports = resolveNetScriptImports('local');
    assertEquals(imports['@netscript/config'], '../../packages/config/mod.ts');
    assertEquals(imports['@netscript/service'], '../../packages/service/mod.ts');
    assertEquals(
      imports['@netscript/plugin-auth-core/contracts/v1'],
      '../../packages/plugin-auth-core/src/contracts/v1/mod.ts',
    );
    assertEquals(imports['@netscript/auth-kv-oauth'], '../../packages/auth-kv-oauth/mod.ts');
    // External deps still use registry
    assertStringIncludes(imports['@std/path'], 'jsr:@std/path');
    assertStringIncludes(imports['zod'], 'npm:zod');
  });

  it('should resolve local mode with custom base', () => {
    const imports = resolveNetScriptImports('local', '../../../monorepo');
    assertEquals(
      imports['@netscript/config'],
      '../../../monorepo/packages/config/mod.ts',
    );
  });
});

describe('resolveNuGetReference', () => {
  it('should resolve JSR mode as package reference', () => {
    const ref = resolveNuGetReference('jsr');
    assertEquals(ref.type, 'package');
    assertEquals(ref.value, 'NetScript.Aspire.Hosting');
  });

  it('should resolve local mode as project reference', () => {
    const ref = resolveNuGetReference('local');
    assertEquals(ref.type, 'project');
    assertEquals(ref.value, '../NetScript.Aspire.Hosting');
  });

  it('should use custom path for local mode', () => {
    const ref = resolveNuGetReference('local', '../custom/path');
    assertEquals(ref.type, 'project');
    assertEquals(ref.value, '../custom/path');
  });
});
