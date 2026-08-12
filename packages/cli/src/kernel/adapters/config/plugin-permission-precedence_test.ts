import { assertEquals } from '@std/assert';
import { resolveEffectivePluginPermissions } from './deploy-config-resolvers.ts';

Deno.test('plugin permission precedence preserves every canonical slot', () => {
  const global = ['--global'];
  const manifest = ['--manifest'];
  const contribution = ['--contribution'];
  const explicit = ['--explicit'];

  assertEquals(
    resolveEffectivePluginPermissions(explicit, contribution, manifest, global),
    explicit,
  );
  assertEquals(
    resolveEffectivePluginPermissions(undefined, contribution, manifest, global),
    contribution,
  );
  assertEquals(
    resolveEffectivePluginPermissions(undefined, undefined, manifest, global),
    manifest,
  );
  assertEquals(
    resolveEffectivePluginPermissions(undefined, undefined, undefined, global),
    global,
  );
});
