import { assertEquals } from '@std/assert';
import { ASPIRE_PACKAGE_CACHE } from '../../../src/application/gates/quickstart/hydrate-aspire-package-cache.ts';

Deno.test('pinned Aspire package-cache identities match both production restore graphs', () => {
  assertEquals(ASPIRE_PACKAGE_CACHE.fivePackageHash, '20B4B80F832F59C1');
  assertEquals(ASPIRE_PACKAGE_CACHE.fourPackageHash, 'F7BD251A60347D74');
  assertEquals(ASPIRE_PACKAGE_CACHE.fivePackages, [
    'Aspire.Hosting,13.4.6',
    'Aspire.Hosting.PostgreSQL,13.4.6',
    'Aspire.Hosting.Redis,13.4.6',
    'Aspire.Hosting.Browsers,13.4.6-preview.1.26319.6',
    'Aspire.Hosting.CodeGeneration.TypeScript,13.4.6',
  ]);
  assertEquals(
    [...ASPIRE_PACKAGE_CACHE.fourPackages],
    ASPIRE_PACKAGE_CACHE.fivePackages.filter((pkg) => !pkg.startsWith('Aspire.Hosting.Redis,')),
  );
});
