import { assertEquals } from '@std/assert';
import { isTransientAspireScanPath } from './aspire-scan-scope.ts';
import { buildAspireSurfaceManifest } from './aspire-surface-manifest.ts';

Deno.test('live manifest excludes every harness run and transient copy, including its owning run', async () => {
  const manifest = await buildAspireSurfaceManifest();
  const paths = manifest.rows.map((row) => row.split('\t')[0]);
  assertEquals(paths.some(isTransientAspireScanPath), false);
  assertEquals(paths.includes('packages/aspire/src/domain/aspire-resource-name.ts'), true);
  assertEquals(paths.includes('docs/site/explanation/aspire.md'), true);
  assertEquals(manifest.unmatched, []);
});

Deno.test('Aspire scans exclude retained run evidence and transient copies', () => {
  for (
    const path of [
      '.llm/runs/research-aspire-13.5-adoption--0.0.7/plan.md',
      '.llm/runs/next-milestone/receipt.json',
      './.llm/tmp/generated/apphost.ts',
      '.agents/generated/consumer-skills/.agents/skills/aspire/SKILL.md',
      'packages/cli/node_modules/aspire/index.ts',
      'packages/cli/.data/apphost.ts',
      '.git/worktrees/leaf/HEAD',
      '.cache/test/apphost.ts',
      '.vite/generated.ts',
      'coverage/apphost.ts',
      'tmp/apphost.ts',
      'temp/apphost.ts',
      'C:\\repo\\.llm\\runs\\old\\receipt.ts',
    ]
  ) assertEquals(isTransientAspireScanPath(path), true, path);
});

Deno.test('Aspire scans retain framework, maintained docs, tooling, and shipped generated source', () => {
  for (
    const path of [
      'packages/aspire/src/domain/resource.ts',
      'packages/cli/src/kernel/templates/aspire/apphost.ts',
      'packages/sdk/src/.generated/client.ts',
      'packages/cli/src/temp/example.ts',
      'docs/site/reference/aspire.md',
      'skills/aspire/SKILL.md',
      '.agents/skills/aspire-upgrade/SKILL.md',
      '.llm/tools/validation/check-aspire-version-parity.ts',
      '.aspire/settings.json',
    ]
  ) assertEquals(isTransientAspireScanPath(path), false, path);
});
