import type { CONTRIBUTION_AXES, LIFECYCLE_HOOK_NAMES, PLUGIN_TYPES } from './constants.ts';

/** Supported plugin contribution axes. */
export type ContributionAxis = (typeof CONTRIBUTION_AXES)[number];

/** Supported plugin categories. */
export type PluginType = (typeof PLUGIN_TYPES)[number];

/** Supported plugin lifecycle hook names. */
export type LifecycleHookName = (typeof LIFECYCLE_HOOK_NAMES)[number];

/** Stable plugin identifier. */
export type PluginName = `@${string}/${string}` | string;

/** Plugin semantic version string. */
export type PluginVersion = string;

/** Runtime-safe metadata values. */
export type PluginMetadataValue =
  | string
  | number
  | boolean
  | null
  | readonly PluginMetadataValue[]
  | { readonly [key: string]: PluginMetadataValue };

/** Logger shape supplied to plugin lifecycle hooks. */
export interface PluginLogger {
  /** Emit a debug-level lifecycle message. */
  readonly debug: (message: string, fields?: Record<string, unknown>) => void;
  /** Emit an info-level lifecycle message. */
  readonly info: (message: string, fields?: Record<string, unknown>) => void;
  /** Emit a warning-level lifecycle message. */
  readonly warn: (message: string, fields?: Record<string, unknown>) => void;
  /** Emit an error-level lifecycle message. */
  readonly error: (message: string, fields?: Record<string, unknown>) => void;
}

/** Context supplied to plugin lifecycle hooks. */
export interface PluginContext {
  /** Absolute project root path for the host application. */
  readonly projectRoot: string;
  /** Absolute plugin root path when the plugin is local. */
  readonly pluginRoot?: string;
  /** Whether the host is running in development mode. */
  readonly isDev?: boolean;
  /** Logger supplied by the host. */
  readonly logger: PluginLogger;
  /** Parsed plugin manifest. */
  readonly manifest: unknown;
}
