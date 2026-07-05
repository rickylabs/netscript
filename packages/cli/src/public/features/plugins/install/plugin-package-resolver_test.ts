import { describe, it } from 'jsr:@std/testing@^1/bdd';
import { assertEquals, assertRejects } from 'jsr:@std/assert@^1';

import { resolvePluginPackageSpec } from './plugin-package-resolver.ts';

describe('resolvePluginPackageSpec', () => {
  it('resolves bare aliases to verified NetScript plugin packages', () => {
    const resolved = resolvePluginPackageSpec('workers');

    assertEquals(resolved.source, 'bare-alias');
    assertEquals(resolved.alias, 'workers');
    assertEquals(resolved.packageSpecifier, '@netscript/plugin-workers');
    assertEquals(resolved.jsrSpecifier, 'jsr:@netscript/plugin-workers');
  });

  it('resolves the AI bare alias to the published NetScript AI plugin package', () => {
    const resolved = resolvePluginPackageSpec('ai');

    assertEquals(resolved.source, 'bare-alias');
    assertEquals(resolved.alias, 'ai');
    assertEquals(resolved.packageSpecifier, '@netscript/plugin-ai');
    assertEquals(resolved.jsrSpecifier, 'jsr:@netscript/plugin-ai');
  });

  it('passes scoped package names through unchanged', () => {
    const resolved = resolvePluginPackageSpec('@acme/plugin-billing');

    assertEquals(resolved.source, 'scoped-name');
    assertEquals(resolved.scope, 'acme');
    assertEquals(resolved.packageName, 'plugin-billing');
    assertEquals(resolved.packageSpecifier, '@acme/plugin-billing');
    assertEquals(resolved.jsrSpecifier, 'jsr:@acme/plugin-billing');
  });

  it('passes explicit JSR package specs through unchanged', () => {
    const resolved = resolvePluginPackageSpec('jsr:@acme/plugin-billing');

    assertEquals(resolved.source, 'explicit-jsr');
    assertEquals(resolved.scope, 'acme');
    assertEquals(resolved.packageName, 'plugin-billing');
    assertEquals(resolved.packageSpecifier, '@acme/plugin-billing');
    assertEquals(resolved.jsrSpecifier, 'jsr:@acme/plugin-billing');
  });

  it('rejects malformed package specs', async () => {
    await assertRejects(
      () => Promise.resolve().then(() => resolvePluginPackageSpec('not a package')),
      Error,
      'Invalid JSR plugin package spec',
    );
  });
});
