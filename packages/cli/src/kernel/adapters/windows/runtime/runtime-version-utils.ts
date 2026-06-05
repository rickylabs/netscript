/**
 * @module infra/windows/runtime-version-utils
 *
 * Pure utility functions for runtime config version parsing and comparison.
 * Extracted from runtime-version.ts for testability.
 */

// ============================================================================
// VERSION PARSING
// ============================================================================

/**
 * Parse a runtime config JSON file and extract its `version` field.
 *
 * @param filePath  Absolute path to a versioned runtime JSON file
 * @returns         The version string (e.g., "1.0.0")
 * @throws          If the file cannot be read or lacks a version field
 */
export async function parseVersionFile(filePath: string): Promise<string> {
  const content = await Deno.readTextFile(filePath);
  const parsed = JSON.parse(content) as { version?: string };

  if (typeof parsed.version !== 'string' || parsed.version.length === 0) {
    throw new Error(`Missing or invalid 'version' field in ${filePath}`);
  }

  return parsed.version;
}

// ============================================================================
// VERSION COMPARISON
// ============================================================================

/**
 * Parse a semver-like version string into numeric parts.
 *
 * Handles: `1.0.0`, `1.0`, `1`, and pre-release suffixes like `1.0.0-beta.1`.
 * Pre-release versions sort lower than release versions.
 *
 * @param version  The version string to parse
 * @returns        Tuple of [major, minor, patch, prerelease?]
 */
function parseSemver(version: string): [number, number, number, string?] {
  const [main, prerelease] = version.split('-', 2);
  const parts = main.split('.').map(Number);
  return [
    parts[0] ?? 0,
    parts[1] ?? 0,
    parts[2] ?? 0,
    prerelease,
  ];
}

/**
 * Compare two semver version strings.
 *
 * @returns  -1 if a < b, 0 if a == b, 1 if a > b
 */
export function compareVersions(a: string, b: string): -1 | 0 | 1 {
  const [aMajor, aMinor, aPatch, aPre] = parseSemver(a);
  const [bMajor, bMinor, bPatch, bPre] = parseSemver(b);

  if (aMajor !== bMajor) return aMajor < bMajor ? -1 : 1;
  if (aMinor !== bMinor) return aMinor < bMinor ? -1 : 1;
  if (aPatch !== bPatch) return aPatch < bPatch ? -1 : 1;

  // Pre-release sorting: no prerelease > any prerelease
  if (!aPre && !bPre) return 0;
  if (!aPre && bPre) return 1; // release > prerelease
  if (aPre && !bPre) return -1; // prerelease < release

  // Both have prerelease — lexicographic
  if (aPre! < bPre!) return -1;
  if (aPre! > bPre!) return 1;
  return 0;
}
