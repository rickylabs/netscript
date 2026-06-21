import type { PluginAddRequest } from '../../../domain/plugin-add-plan.ts';

/** Parsed options accepted by the public `plugin add` command. */
export interface AddPluginCommandInput {
  readonly name?: string;
  readonly port?: number;
  readonly serviceRefs?: string;
  readonly pluginRefs?: string;
  readonly db?: string | false;
  readonly sagaStoreBackend?: string;
  readonly samples?: boolean;
  readonly projectRoot?: string;
  readonly force?: boolean;
}

/** User request handled by the public add-plugin use case. */
export type AddPluginInput = PluginAddRequest;
