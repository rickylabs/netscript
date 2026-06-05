import type { ProcessPort } from '../../../../kernel/ports/process-port.ts';
import type { FrameworkVerb } from './dispatch-plugin-verb.ts';

/** Options for routing a framework plugin verb to a plugin CLI subpath. */
export interface PluginDispatchOptions {
  /** Framework-owned plugin verb. */
  readonly verb: FrameworkVerb;
  /** Plugin package name, such as `@scope/plugin-name`. */
  readonly pkg: string;
  /** Remaining arguments forwarded to the plugin CLI. */
  readonly args: readonly string[];
  /** Project root used as the subprocess working directory. */
  readonly projectRoot: string;
  /** Process execution port. */
  readonly processRunner: ProcessPort;
}

/** Result returned by a plugin CLI dispatch. */
export interface PluginDispatchResult {
  /** Process exit code. */
  readonly code: number;
  /** Captured standard output. */
  readonly stdout: string;
  /** Captured standard error. */
  readonly stderr: string;
}

/** Port for dispatching framework plugin verbs to plugin CLIs. */
export interface PluginDispatchPort {
  /** Dispatch a framework verb to the plugin CLI. */
  dispatch(options: PluginDispatchOptions): Promise<PluginDispatchResult>;
}
