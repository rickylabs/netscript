import type { PluginInstallRequest } from '../../../domain/plugin-install-plan.ts';

/** Parsed options accepted by the public `plugin install` command. */
export interface InstallPluginCommandInput {
  readonly name?: string;
  readonly port?: number;
  readonly serviceRefs?: string;
  readonly pluginRefs?: string;
  readonly db?: string | false;
  readonly sagaStoreBackend?: string;
  readonly samples?: boolean;
  readonly copySource?: boolean;
  readonly skipConfirmation?: boolean;
  readonly ci?: boolean;
  readonly dryRun?: boolean;
  readonly jsrUrl?: string;
  readonly localPath?: string;
  readonly projectRoot?: string;
  readonly force?: boolean;
}

/** User request handled by the public install-plugin use case. */
export type InstallPluginInput = PluginInstallRequest;
