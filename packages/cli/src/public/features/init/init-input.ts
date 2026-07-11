import type { DbEngineChoice } from '../../../kernel/domain/db-engine.ts';
import type { CacheBackendChoice } from '../../../kernel/domain/cache-backend.ts';
import type { EditorChoice } from '../../../kernel/domain/scaffold/workspace-config.ts';

/** Parsed options accepted by the public `init` command. */
export interface InitCommandInput {
  readonly appName?: string;
  readonly db?: DbEngineChoice | string;
  readonly service?: boolean;
  readonly serviceName?: string;
  readonly modelName?: string;
  readonly servicePort?: number;
  readonly cache?: boolean;
  readonly cacheBackend?: CacheBackendChoice | string;
  readonly editor?: EditorChoice | string;
  readonly aspire?: boolean;
  readonly git?: boolean;
  readonly force?: boolean;
  readonly ci?: boolean;
  readonly yes?: boolean;
  readonly path?: string;
  readonly dryRun?: boolean;
  readonly json?: boolean;
  readonly from?: string;
}
