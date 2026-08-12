const JSR_REGISTRY_BASE_URL = 'https://jsr.io';

export const PACKAGE_BACKED_DOCTOR_UNPUBLISHED_EXIT_CODE = 78;
export const PACKAGE_BACKED_DOCTOR_UNPUBLISHED_MESSAGE =
  'Package-backed plugin doctor excluded: the pinned NetScript version is not published on JSR.';

const REQUIRED_PACKAGES = [
  '@netscript/config',
  '@netscript/plugin-workers',
  '@netscript/plugin-streams',
] as const;

/** Return fixture packages whose exact pinned version is absent from JSR. */
export async function findUnpublishedFixturePackages(
  version: string,
  fetcher: typeof fetch = fetch,
): Promise<readonly string[]> {
  const checks = await Promise.all(REQUIRED_PACKAGES.map(async (packageName) => {
    const response = await fetcher(
      `${JSR_REGISTRY_BASE_URL}/${packageName}/${version}_meta.json`,
    );
    if (response.status === 404) return packageName;
    if (!response.ok) {
      throw new Error(
        `JSR availability check failed for ${packageName}@${version}: HTTP ${response.status}.`,
      );
    }
    return undefined;
  }));
  return checks.filter((packageName): packageName is typeof REQUIRED_PACKAGES[number] =>
    packageName !== undefined
  );
}
