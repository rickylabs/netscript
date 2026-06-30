import type { DatabaseScaffoldResult } from '../../kernel/domain/db-engine.ts';
import type {
  PluginDbDetectionResult,
  PluginKind,
  PluginKindProvider,
  PluginScaffoldResult,
  PluginSchemaCopyResult,
  SagaStoreBackend,
} from '../../kernel/domain/plugin-kind.ts';
import type { ValidatedPluginDescriptor } from '../features/plugins/install/jsr-plugin-validator-port.ts';
import type { ScaffoldResult as PluginOwnedScaffoldResult } from '@netscript/plugin/protocol';

/** User request for installing one starter plugin workspace. */
export interface PluginInstallRequest {
  /** Raw plugin kind received from the command surface. */
  readonly kind: string;

  /** Plugin workspace and config key. */
  readonly pluginName: string;

  /** Optional service port override. */
  readonly port?: number;

  /** Service config keys the plugin depends on. */
  readonly serviceReferences: readonly string[];

  /** Plugin config keys the plugin depends on. */
  readonly pluginReferences: readonly string[];

  /** Database engine or configured database key to target. */
  readonly db?: string;

  /** Whether database wiring should be skipped. */
  readonly noDb: boolean;

  /** Whether starter samples should be generated. */
  readonly includeSamples: boolean;

  /** Whether third-party plugin confirmation should be skipped. */
  readonly skipConfirmation?: boolean;

  /** Whether the command is running in non-interactive CI mode. */
  readonly ci?: boolean;

  /** Whether plugin-owned scaffolding should preview changes without writing files. */
  readonly dryRun?: boolean;

  /** Explicit JSR package specifier used instead of the positional kind. */
  readonly jsrUrl?: string;

  /** Explicit local plugin package directory used for maintainer validation. */
  readonly localPath?: string;

  /** Maintainer-only: generate a thin local stub instead of copying official source. */
  readonly noCopySource?: boolean;

  /** Durable saga state backend to write for saga plugins. */
  readonly sagaStoreBackend?: SagaStoreBackend;

  /** Absolute project root. */
  readonly projectRoot: string;

  /** Whether existing generated files may be overwritten. */
  readonly overwrite: boolean;
}

/** Planned plugin installation with workspace metadata resolved. */
export interface PluginInstallPlan extends Omit<PluginInstallRequest, 'kind'> {
  /** Plugin kind identifier. */
  readonly kind: PluginKind;

  /** Provider metadata for the selected plugin kind. */
  readonly provider: PluginKindProvider;

  /** Project name used in generated package metadata. */
  readonly projectName: string;

  /** Resolved database intent for this plugin. */
  readonly dbDetection: PluginDbDetectionResult;
}

/** Files and resources produced while rendering the plugin workspace. */
export interface PluginRenderSupportResult {
  /** Number of plugin registry files initialized. */
  readonly registryFilesCreated: number;

  /** Whether plugin service context bootstrap was written. */
  readonly wroteServiceContext: boolean;

  /** Database workspace scaffold result when the plugin required a new database. */
  readonly provisionedDatabase: DatabaseScaffoldResult | null;
}

/** Files and resources produced while rendering the plugin workspace. */
export interface PluginRenderResult extends PluginRenderSupportResult {
  /** Result of starter plugin scaffolding. */
  readonly plugin: PluginScaffoldResult;
}

/** Result of the public install-plugin application flow. */
export interface InstallPluginResult extends PluginRenderResult {
  /** Static JSR descriptor resolved before any plugin code executes. */
  readonly resolvedPlugin?: ValidatedPluginDescriptor;

  /** Preview or applied result returned by a plugin-owned scaffolder. */
  readonly pluginOwnedScaffold?: PluginOwnedScaffoldResult;

  /** Whether a shared cache resource was added. */
  readonly provisionedCache: boolean;

  /** Schema contribution copies made into the active database workspace. */
  readonly schemaCopies: readonly PluginSchemaCopyResult[];

  /** AppHost helper files regenerated after config mutation. */
  readonly helperFiles: readonly string[];
}
