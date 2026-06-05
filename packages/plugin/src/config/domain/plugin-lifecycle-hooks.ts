import type { PluginContext } from '../../domain/mod.ts';

/** Lifecycle hooks supported by plugin definitions. */
export interface PluginLifecycleHooks {
  /** Hook called when the plugin is initialized. */
  readonly setup?: (context: PluginContext) => void | Promise<void>;
  /** Hook called before generation tasks run. */
  readonly beforeGenerate?: (context: PluginContext) => void | Promise<void>;
  /** Hook called after generation tasks complete. */
  readonly afterGenerate?: (context: PluginContext) => void | Promise<void>;
  /** Hook called when the plugin is torn down. */
  readonly teardown?: (context: PluginContext) => void | Promise<void>;
}
