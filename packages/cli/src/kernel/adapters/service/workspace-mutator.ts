/**
 * @module infra/service/workspace-mutator
 *
 * Workspace mutation helpers for service lifecycle commands.
 */

import { basename, join } from '@std/path';
import { ScaffoldValidationError } from '../../domain/errors.ts';
import { type AspireSurfaceRenderOptions, renderAspireSurface } from './aspire-surface-renderer.ts';

import { SCAFFOLD_DIRS } from '../../constants/scaffold/scaffold-dirs.ts';
import { SCAFFOLD_FILES } from '../../constants/scaffold/scaffold-files.ts';
import { addWorkspaceMember, removeWorkspaceMember } from '../scaffold/workspace-writer.ts';
import type { FileSystemPort } from '../../ports/file-system-port.ts';
import type { ScaffolderPort, TemplatePort } from '../../ports/template-port.ts';
import type { ServiceConfigEntry } from '../../domain/service-shape.ts';

/** Project metadata needed to scaffold service resources. */
export interface ServiceProjectMetadata {
  /** Project name used for scoped local imports. */
  readonly projectName: string;
  /** Whether service deno.json files should import local copied packages. */
  readonly packagesAsWorkspaceMembers: boolean;
}

/** Read service-relevant project metadata from config files. */
export async function readServiceProjectMetadata(
  projectRoot: string,
  fs: FileSystemPort,
): Promise<ServiceProjectMetadata> {
  const appsettingsPath = join(projectRoot, SCAFFOLD_FILES.APPSETTINGS);
  if (await fs.exists(appsettingsPath)) {
    const raw = JSON.parse(await fs.readFile(appsettingsPath)) as {
      NetScript?: { Name?: string };
    };
    if (raw.NetScript?.Name) {
      return {
        projectName: raw.NetScript.Name,
        packagesAsWorkspaceMembers: await hasLocalPackageWorkspace(projectRoot, fs),
      };
    }
  }

  const denoJsonPath = join(projectRoot, SCAFFOLD_FILES.DENO_JSON);
  if (await fs.exists(denoJsonPath)) {
    const raw = JSON.parse(await fs.readFile(denoJsonPath)) as {
      name?: string;
    };
    if (raw.name) {
      const scope = raw.name.startsWith('@') ? raw.name.split('/')[0]?.slice(1) : raw.name;
      if (scope) {
        return {
          projectName: scope,
          packagesAsWorkspaceMembers: await hasLocalPackageWorkspace(projectRoot, fs),
        };
      }
    }
  }

  return {
    projectName: basename(projectRoot),
    packagesAsWorkspaceMembers: await hasLocalPackageWorkspace(projectRoot, fs),
  };
}

/** Add or replace a service entry in root `appsettings.json`. */
export async function upsertServiceAppsettingsEntry(
  projectRoot: string,
  serviceName: string,
  entry: ServiceConfigEntry,
  fs: FileSystemPort,
): Promise<void> {
  const configPath = join(projectRoot, SCAFFOLD_FILES.APPSETTINGS);
  if (!await fs.exists(configPath)) {
    throw new ScaffoldValidationError(
      `Cannot add service "${serviceName}" because ${SCAFFOLD_FILES.APPSETTINGS} was not found.`,
      { projectRoot, serviceName },
    );
  }

  const raw = JSON.parse(await fs.readFile(configPath)) as {
    NetScript?: { Services?: Record<string, ServiceConfigEntry> };
  };
  raw.NetScript ??= {};
  raw.NetScript.Services ??= {};
  raw.NetScript.Services[serviceName] = entry;

  await fs.writeFile(configPath, JSON.stringify(raw, null, 2) + '\n');
}

/** Add `services/<name>` to the root Deno workspace. */
export async function addServiceWorkspaceMember(
  projectRoot: string,
  serviceName: string,
  fs: FileSystemPort,
): Promise<void> {
  await addWorkspaceMember(
    projectRoot,
    `${SCAFFOLD_DIRS.SERVICES}/${serviceName}`,
    fs,
  );
}

/** Remove a service entry from root `appsettings.json` when present. */
export async function removeServiceAppsettingsEntry(
  projectRoot: string,
  serviceName: string,
  fs: FileSystemPort,
): Promise<boolean> {
  const configPath = join(projectRoot, SCAFFOLD_FILES.APPSETTINGS);
  if (!await fs.exists(configPath)) return false;
  const raw = JSON.parse(await fs.readFile(configPath)) as {
    NetScript?: { Services?: Record<string, ServiceConfigEntry> };
  };
  if (!raw.NetScript?.Services?.[serviceName]) return false;
  delete raw.NetScript.Services[serviceName];
  await fs.writeFile(configPath, JSON.stringify(raw, null, 2) + '\n');
  return true;
}

/** Remove `services/<name>` from the root Deno workspace. */
export async function removeServiceWorkspaceMember(
  projectRoot: string,
  serviceName: string,
  fs: FileSystemPort,
): Promise<boolean> {
  return await removeWorkspaceMember(
    projectRoot,
    `${SCAFFOLD_DIRS.SERVICES}/${serviceName}`,
    fs,
  );
}

/** Regenerate TypeScript Aspire helper files from root `appsettings.json`. */
export async function regenerateAspireHelpers(
  projectRoot: string,
  fs: FileSystemPort,
  scaffolder: ScaffolderPort,
  templateAdapter: TemplatePort,
  options: AspireSurfaceRenderOptions & {
    readonly dryRun?: boolean;
    readonly force?: boolean;
  } = {},
): Promise<readonly string[]> {
  const files = await renderAspireSurface(projectRoot, fs, templateAdapter, options);
  const written: string[] = [];
  for (const file of files) {
    const path = join(projectRoot, file.path);
    const changed = options.force || !await fs.exists(path) ||
      await fs.readFile(path) !== file.content;
    if (!changed) continue;
    written.push(path);
    if (!options.dryRun) await scaffolder.writeFile(path, file.content, true);
  }
  return written;
}

async function hasLocalPackageWorkspace(
  projectRoot: string,
  fs: FileSystemPort,
): Promise<boolean> {
  return await fs.exists(
    join(projectRoot, SCAFFOLD_DIRS.PACKAGES, 'service', SCAFFOLD_FILES.MOD),
  );
}
