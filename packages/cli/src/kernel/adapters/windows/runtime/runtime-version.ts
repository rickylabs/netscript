import { outputText } from '../../../presentation/output/default-output.ts';
/**
 * @module infra/windows/runtime-version
 *
 * Handles version conflict resolution for runtime config files during deploy.
 *
 * When `deploy build` generates runtime config (jobs, sagas, tasks, triggers,
 * features), it may encounter existing files at the target. This module
 * implements the 4-case resolution strategy:
 *
 *   1. **No existing output** → write the initial version (no prompt).
 *   2. **Same version exists** → prompt which to keep (or skip via `--keep-runtime=local|remote`).
 *   3. **Remote is newer** → skip by default; `--fail-on-drift` fails the build.
 *   4. **Local is newer** → prompt to confirm override (or skip via flag / `--ci`).
 *
 * All prompts are suppressed in `--ci` mode (non-interactive).
 */

import { exists } from '@std/fs';
import { basename as _basename, join } from '@std/path';
import { gray, green as _green, red as _red, yellow as _yellow } from '@std/fmt/colors';
import { compareVersions, parseVersionFile } from './runtime-version-utils.ts';

// ============================================================================
// TYPES
// ============================================================================

/** Resolution strategy for a single topic file. */
export type VersionResolution =
  | 'write' // Write the generated file (new or confirmed overwrite)
  | 'skip' // Keep the existing file
  | 'fail'; // Abort the build (--fail-on-drift)

/** Options controlling version conflict behavior. */
export interface VersionConflictOptions {
  /** Non-interactive mode — never prompt, use defaults. */
  ci: boolean;
  /** Force overwrite all runtime config files. */
  force: boolean;
  /** When true, fail the build if remote config is newer than local. */
  failOnDrift: boolean;
  /** Explicit resolution for same-version conflicts: keep local (generated) or remote (existing). */
  keepRuntime?: 'local' | 'remote';
  /** Print detailed output. */
  verbose: boolean;
}

/** Result of resolving a single topic's version conflict. */
export interface VersionConflictResult {
  topic: string;
  resolution: VersionResolution;
  localVersion: string;
  remoteVersion?: string;
  reason: string;
}

// ============================================================================
// PROMPT HELPER
// ============================================================================

/**
 * Prompt the user for a yes/no choice via stdin.
 * Returns `true` for yes, `false` for no.
 * In CI mode, always returns the `defaultValue`.
 */
async function promptYesNo(
  message: string,
  defaultValue: boolean,
  ci: boolean,
): Promise<boolean> {
  if (ci) return defaultValue;

  const suffix = defaultValue ? '[Y/n]' : '[y/N]';
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  await Deno.stdout.write(encoder.encode(`   ${message} ${suffix}: `));

  const buf = new Uint8Array(64);
  const n = await Deno.stdin.read(buf);
  if (n === null) return defaultValue;

  const answer = decoder.decode(buf.subarray(0, n)).trim().toLowerCase();
  if (answer === '') return defaultValue;
  return answer === 'y' || answer === 'yes';
}

/**
 * Prompt the user to choose between local or remote version.
 * Returns `'local'` or `'remote'`.
 */
async function promptLocalOrRemote(
  topic: string,
  localVersion: string,
  _remoteVersion: string,
  ci: boolean,
  keepPreference?: 'local' | 'remote',
): Promise<'local' | 'remote'> {
  // Explicit flag overrides prompt
  if (keepPreference) return keepPreference;
  // CI mode defaults to keeping remote (don't overwrite)
  if (ci) return 'remote';

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  await Deno.stdout.write(encoder.encode(
    `   ${topic}: same version v${localVersion} exists at target.\n` +
      `   Keep [l]ocal (generated) or [r]emote (existing)? [r]: `,
  ));

  const buf = new Uint8Array(64);
  const n = await Deno.stdin.read(buf);
  if (n === null) return 'remote';

  const answer = decoder.decode(buf.subarray(0, n)).trim().toLowerCase();
  if (answer === 'l' || answer === 'local') return 'local';
  return 'remote';
}

// ============================================================================
// CORE RESOLVER
// ============================================================================

/**
 * Resolve the version conflict for a single runtime config topic file.
 *
 * @param topic            The topic name (e.g., 'jobs', 'sagas')
 * @param localVersion     The version being generated (from config)
 * @param existingFilePath Absolute path to the existing file at the target
 * @param options          Conflict resolution options
 * @returns                The resolution and reasoning
 */
export async function resolveVersionConflict(
  topic: string,
  localVersion: string,
  existingFilePath: string,
  options: VersionConflictOptions,
): Promise<VersionConflictResult> {
  // Force mode — always write
  if (options.force) {
    return {
      topic,
      resolution: 'write',
      localVersion,
      reason: 'force flag set',
    };
  }

  // Case 1: No existing file → write
  if (!(await exists(existingFilePath))) {
    return {
      topic,
      resolution: 'write',
      localVersion,
      reason: 'no existing file',
    };
  }

  // Read existing file to determine its version
  let remoteVersion: string;
  try {
    remoteVersion = await parseVersionFile(existingFilePath);
  } catch {
    // Cannot parse existing file — overwrite with generated
    return {
      topic,
      resolution: 'write',
      localVersion,
      reason: 'existing file is malformed',
    };
  }

  const comparison = compareVersions(localVersion, remoteVersion);

  // Case 2: Same version
  if (comparison === 0) {
    const choice = await promptLocalOrRemote(
      topic,
      localVersion,
      remoteVersion,
      options.ci,
      options.keepRuntime,
    );
    return {
      topic,
      resolution: choice === 'local' ? 'write' : 'skip',
      localVersion,
      remoteVersion,
      reason: choice === 'local'
        ? 'user chose local (generated)'
        : 'same version — keeping existing',
    };
  }

  // Case 3: Remote is newer (local < remote)
  if (comparison < 0) {
    if (options.failOnDrift) {
      return {
        topic,
        resolution: 'fail',
        localVersion,
        remoteVersion,
        reason:
          `remote v${remoteVersion} is newer than local v${localVersion} — --fail-on-drift active`,
      };
    }

    if (options.verbose) {
      outputText(
        gray(
          `   → ${topic}: remote v${remoteVersion} is newer than local v${localVersion} — skipping`,
        ),
      );
    }

    return {
      topic,
      resolution: 'skip',
      localVersion,
      remoteVersion,
      reason: `remote v${remoteVersion} is newer — preserving`,
    };
  }

  // Case 4: Local is newer (local > remote)
  const shouldOverwrite = await promptYesNo(
    `${topic}: local v${localVersion} is newer than remote v${remoteVersion}. Overwrite?`,
    true, // default: yes
    options.ci,
  );

  return {
    topic,
    resolution: shouldOverwrite ? 'write' : 'skip',
    localVersion,
    remoteVersion,
    reason: shouldOverwrite
      ? `overwriting remote v${remoteVersion} with local v${localVersion}`
      : 'user declined overwrite',
  };
}

/**
 * Resolve version conflicts for all runtime config topics.
 *
 * @param topics    Array of topic names to check
 * @param version   The version being generated
 * @param targetDir Absolute path to the runtime config directory at the target
 * @param options   Conflict resolution options
 * @returns         Map of topic → resolution result
 */
export async function resolveAllVersionConflicts(
  topics: string[],
  version: string,
  targetDir: string,
  options: VersionConflictOptions,
): Promise<Map<string, VersionConflictResult>> {
  const results = new Map<string, VersionConflictResult>();
  const versionFileName = `v${version}.json`;

  for (const topic of topics) {
    const existingPath = join(targetDir, topic, versionFileName);
    const result = await resolveVersionConflict(topic, version, existingPath, options);
    results.set(topic, result);

    // Fail-fast if any topic triggers --fail-on-drift
    if (result.resolution === 'fail') {
      throw new Error(
        `Runtime config drift detected: ${result.reason}\n` +
          `Remove --fail-on-drift or update the local config version to match.`,
      );
    }
  }

  return results;
}
