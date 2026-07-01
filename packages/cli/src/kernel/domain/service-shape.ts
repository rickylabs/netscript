/**
 * Shared service shape vocabulary for generated NetScript workspaces.
 */

import type { ServiceEntry } from '@netscript/aspire/types';
import type { ScaffoldResult } from './core-types.ts';
import type { PackageSourceMode } from './scaffold/scaffold-options.ts';

export type { ScaffoldResult } from './core-types.ts';
export type { PackageSourceMode } from './scaffold/scaffold-options.ts';

/** Declarative service shape used by scaffold planning. */
export interface ServiceShape {
  /** Service name in kebab-case. */
  readonly name: string;

  /** HTTP port assigned to the service. */
  readonly port: number;

  /** Entrypoint path relative to the service workspace. */
  readonly entrypoint: string;
}

/** Configuration for one service in `appsettings.json`. */
export type ServiceConfigEntry = ServiceEntry;

/** Options for creating a service workspace under `services/<name>/`. */
export interface ServiceScaffoldOptions {
  /** Project name used for scoped package imports. */
  readonly projectName: string;
  /** Absolute project root path. */
  readonly targetPath: string;
  /** Service name, in kebab-case. */
  readonly serviceName: string;
  /** Allocated service port. */
  readonly servicePort: number;
  /** Import mode for NetScript package references. */
  readonly importMode: PackageSourceMode;
  /** Depth-adjusted local base path for local imports. */
  readonly localBase?: string;
  /** Whether the scaffold copied NetScript packages into the workspace. */
  readonly packagesAsWorkspaceMembers?: boolean;
  /** Prisma domain model name associated with the service. */
  readonly modelName?: string;
  /** Whether the service should use the database-backed CRUD templates. */
  readonly hasDatabase?: boolean;
  /** Optional peer services to expose through Aspire service discovery. */
  readonly serviceReferences?: readonly string[];
  /** Whether existing files should be overwritten. */
  readonly force: boolean;
}

/** Result of creating a service workspace. */
export interface ServiceScaffoldResult {
  /** Standard scaffold operation summary. */
  readonly scaffoldResult: ScaffoldResult;
  /** Absolute path to the service workspace directory. */
  readonly serviceDir: string;
  /** Allocated service port. */
  readonly port: number;
  /** Appsettings-ready service config entry. */
  readonly configEntry: ServiceConfigEntry;
}

/** Port allocation result. */
export interface PortAllocation {
  /** Allocated port number. */
  readonly port: number;
  /** Whether the port came from user input or automatic allocation. */
  readonly source: 'user' | 'auto';
}

/** Service discovered from `appsettings.json`. */
export interface DiscoveredService {
  /** Service config key. */
  readonly name: string;
  /** Whether the service is enabled. */
  readonly enabled: boolean;
  /** Service runtime. */
  readonly runtime: 'deno';
  /** Allocated HTTP port. */
  readonly port: number;
  /** Service entrypoint relative to workdir. */
  readonly entrypoint: string;
  /** Service working directory relative to project root. */
  readonly workdir: string;
  /** Peer service names referenced by this service. */
  readonly serviceReferences: readonly string[];
}

/** Options for `netscript service add`. */
export interface ServiceAddOptions {
  /** Service name, in kebab-case. */
  readonly name: string;
  /** Optional explicit port. */
  readonly port?: number;
  /** Optional peer service references. */
  readonly refs?: readonly string[];
  /** Project root directory. */
  readonly projectRoot: string;
  /** Whether existing files should be overwritten. */
  readonly force: boolean;
}
