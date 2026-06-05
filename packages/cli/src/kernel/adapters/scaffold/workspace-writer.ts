/**
 * @module infra/scaffold/workspace-writer
 *
 * Workspace mutation operations for the scaffold system.
 *
 * Provides utilities for modifying the root `deno.json` workspace config,
 * allocating ports from predefined ranges, and validating resource names
 * against workspace constraints.
 */

import { join } from '@std/path';
import { getAvailablePort } from '@std/net';
import { PORT_RANGES } from '../../constants/port-ranges.ts';
import { SCAFFOLD_FILES } from '../../constants/scaffold/scaffold-files.ts';
import { SCAFFOLD_VALIDATION } from '../../constants/scaffold/scaffold-validation.ts';
import type { AllocatableResourceType } from '../../domain/scaffold/workspace-config.ts';
import type { FileSystemPort } from '../../ports/file-system-port.ts';
import { ScaffoldValidationError } from '../../domain/errors.ts';

/**
 * Add a new member path to the root workspace `deno.json`.
 *
 * Performs a read-parse-validate-mutate-serialize-write cycle:
 * 1. Read the existing `deno.json` from the project root.
 * 2. Parse the JSON content.
 * 3. Normalize the member path to POSIX format with a `./` prefix.
 * 4. Validate the member is not already present.
 * 5. Push the new member and sort the array alphabetically.
 * 6. Write the updated config back to disk.
 *
 * @param rootPath - Absolute path to the project root directory.
 * @param memberPath - Relative path to the new workspace member.
 * @param fs - Filesystem adapter for reading and writing files.
 * @throws If the member already exists in the workspace array.
 */
export async function addWorkspaceMember(
  rootPath: string,
  memberPath: string,
  fs: FileSystemPort,
): Promise<void> {
  const configPath = join(rootPath, SCAFFOLD_FILES.DENO_JSON);
  const content = await fs.readFile(configPath);
  const config = JSON.parse(content) as Record<string, unknown>;

  const normalized = './' + memberPath.replace(/\\/g, '/').replace(/^\.\//, '');

  const workspace = (config.workspace ?? []) as string[];

  if (workspace.includes(normalized)) {
    throw new Error(
      `Workspace member "${normalized}" already exists in ${SCAFFOLD_FILES.DENO_JSON}`,
    );
  }

  workspace.push(normalized);
  workspace.sort();
  config.workspace = workspace;

  await fs.writeFile(configPath, JSON.stringify(config, null, 2) + '\n');
}

/**
 * Allocate an available port within the predefined range for a resource type.
 *
 * Iterates through the port range for the given resource type, skipping ports
 * already in the `usedPorts` set, and probes each candidate with
 * `getAvailablePort()` to confirm it is actually free on the host.
 *
 * @param type - The resource type to allocate a port for.
 * @param usedPorts - Set of port numbers already claimed by other resources.
 * @param getPort - Port-availability probe function. Defaults to the real
 *   `getAvailablePort` from `@std/net`. Override in tests to avoid network access.
 * @returns A port number that is both unclaimed and available on the host.
 * @throws If no available port can be found within the entire range.
 */
export async function allocatePort(
  type: AllocatableResourceType,
  usedPorts: Set<number>,
  getPort: typeof getAvailablePort = getAvailablePort,
): Promise<number> {
  const range = PORT_RANGES[type];

  for (let port = range.start; port <= range.end; port++) {
    if (usedPorts.has(port)) {
      continue;
    }

    const actual = await getPort({ preferredPort: port });

    if (actual === port) {
      return port;
    }
  }

  throw new Error(
    `No available port found for resource type "${type}" ` +
      `in range ${range.start}–${range.end}. All ports are exhausted.`,
  );
}

/** Validate the resource naming contract without checking workspace uniqueness. */
export function validateResourceName(
  name: string,
  type: string,
): void {
  if (!SCAFFOLD_VALIDATION.NAME_PATTERN.test(name)) {
    throw new ScaffoldValidationError(
      `Invalid ${type} name "${name}". ` +
        `Names must match ${SCAFFOLD_VALIDATION.NAME_PATTERN} ` +
        `(kebab-case, starting with a letter).`,
      { name, type },
    );
  }

  if (name.length > SCAFFOLD_VALIDATION.NAME_MAX_LENGTH) {
    throw new ScaffoldValidationError(
      `The ${type} name "${name}" exceeds the maximum length ` +
        `of ${SCAFFOLD_VALIDATION.NAME_MAX_LENGTH} characters.`,
      { name, type, length: name.length },
    );
  }

  const reservedNames: readonly string[] = SCAFFOLD_VALIDATION.RESERVED_NAMES;
  if (reservedNames.includes(name)) {
    throw new ScaffoldValidationError(
      `The name "${name}" is reserved and cannot be used as a ${type} name. ` +
        `Reserved names: ${reservedNames.join(', ')}`,
      { name, type },
    );
  }
}

/**
 * Validate that a resource name is unique within the workspace.
 *
 * Performs four sequential checks:
 * 1. The name matches the required kebab-case pattern.
 * 2. The name does not exceed the maximum allowed length.
 * 3. The name is not in the reserved names list.
 * 4. No existing workspace member path ends with `/<name>`.
 *
 * @param rootPath - Absolute path to the project root directory.
 * @param name - The candidate resource name to validate.
 * @param type - Human-readable resource type for error messages (e.g., `'service'`).
 * @param fs - Filesystem adapter for reading workspace config.
 * @throws {ScaffoldValidationError} If the name is invalid, reserved, or already taken.
 */
export async function validateUniqueName(
  rootPath: string,
  name: string,
  type: string,
  fs: FileSystemPort,
): Promise<void> {
  validateResourceName(name, type);

  const configPath = join(rootPath, SCAFFOLD_FILES.DENO_JSON);
  const configExists = await fs.exists(configPath);

  if (configExists) {
    const content = await fs.readFile(configPath);
    const config = JSON.parse(content) as Record<string, unknown>;
    const workspace = (config.workspace ?? []) as string[];
    const suffix = `/${name}`;

    for (const member of workspace) {
      if (member.endsWith(suffix)) {
        throw new ScaffoldValidationError(
          `A ${type} named "${name}" already exists in the workspace`,
          { name, type, existingMember: member },
        );
      }
    }
  }
}
