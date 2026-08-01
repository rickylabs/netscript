import { assertEquals } from '@std/assert';

Deno.test('published manifest declares every SDK runtime dependency', async () => {
  const packageManifest = JSON.parse(
    await Deno.readTextFile(new URL('../package.json', import.meta.url)),
  ) as { dependencies?: Record<string, string> };
  const denoManifest = JSON.parse(
    await Deno.readTextFile(new URL('../deno.json', import.meta.url)),
  ) as { imports?: Record<string, string> };

  // JSR consumers do not inherit the producer workspace catalog. Keeping an npm runtime
  // dependency only in package.json makes clean Vite SSR fail while warm caches appear healthy.
  for (const dependency of Object.keys(packageManifest.dependencies ?? {})) {
    assertEquals(
      denoManifest.imports?.[dependency]?.startsWith('npm:'),
      true,
      `${dependency} must be present in the published deno.json imports`,
    );
  }
});
