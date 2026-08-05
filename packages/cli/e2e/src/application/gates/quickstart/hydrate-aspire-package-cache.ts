import { join } from '@std/path';

export const ASPIRE_PACKAGE_CACHE = {
  fivePackageHash: '20B4B80F832F59C1',
  fourPackageHash: 'F7BD251A60347D74',
  fivePackages: [
    'Aspire.Hosting,13.4.6',
    'Aspire.Hosting.PostgreSQL,13.4.6',
    'Aspire.Hosting.Redis,13.4.6',
    'Aspire.Hosting.Browsers,13.4.6-preview.1.26319.6',
    'Aspire.Hosting.CodeGeneration.TypeScript,13.4.6',
  ],
  fourPackages: [
    'Aspire.Hosting,13.4.6',
    'Aspire.Hosting.PostgreSQL,13.4.6',
    'Aspire.Hosting.Browsers,13.4.6-preview.1.26319.6',
    'Aspire.Hosting.CodeGeneration.TypeScript,13.4.6',
  ],
} as const;

export type AspirePackageSet = 'five' | 'four';
const HYDRATION_TIMEOUT_MS = 30_000;

/** Hydrate Aspire's project-local restore cache from the workflow's pinned local NuGet source. */
export async function hydrateAspirePackageCache(
  repoRoot: string,
  aspireRoot: string,
  packageSet: AspirePackageSet,
): Promise<void> {
  const managedPath = (await Deno.readTextFile(
    join(repoRoot, '.llm/tmp/aspire-managed-path.txt'),
  )).trim();
  const localSource = join(repoRoot, '.llm/tmp/aspire-nuget-source');
  const hash = packageSet === 'five'
    ? ASPIRE_PACKAGE_CACHE.fivePackageHash
    : ASPIRE_PACKAGE_CACHE.fourPackageHash;
  const packages = packageSet === 'five'
    ? ASPIRE_PACKAGE_CACHE.fivePackages
    : ASPIRE_PACKAGE_CACHE.fourPackages;
  const output = join(
    aspireRoot,
    packageSet === 'five' ? '' : 'db-operation',
    '.aspire/integrations/package-restore',
    hash,
    'obj',
  );
  const args = [
    'nuget',
    'restore',
    '--output',
    output,
    '--framework',
    'net10.0',
    '--runtime-identifier',
    'linux-x64',
    ...packages.flatMap((pkg) => ['--package', pkg]),
    '--source',
    localSource,
    '--working-dir',
    packageSet === 'five' ? aspireRoot : join(aspireRoot, 'db-operation'),
  ];
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), HYDRATION_TIMEOUT_MS);
  let result: Deno.CommandOutput;
  try {
    result = await new Deno.Command(managedPath, {
      args,
      env: {
        // Acquisition was already audited by the prerequisite `dotnet restore`.
        // Keep this local-source materialization fully offline.
        NuGetAudit: 'false',
      },
      stdout: 'piped',
      stderr: 'piped',
      signal: controller.signal,
    }).output();
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error(
        'pinned Aspire package-cache hydration exceeded its 30s infrastructure bound',
      );
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
  if (result.code !== 0) {
    throw new Error(
      `pinned Aspire package-cache hydration failed (${result.code}): ${
        new TextDecoder().decode(result.stderr)
      }`,
    );
  }
}
