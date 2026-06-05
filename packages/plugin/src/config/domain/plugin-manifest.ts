import type { PluginLifecycleHooks } from './plugin-lifecycle-hooks.ts';
import type { PluginMetadata } from './plugin-metadata.ts';
import type { PluginContributions } from './plugin-contributions.ts';
import type { PluginDependencies } from './plugin-dependencies.ts';
import type { PluginType } from '../../domain/mod.ts';

/** Plugin manifest consumed by NetScript hosts and tooling. */
export interface PluginManifest {
  /** Plugin package name. */
  readonly name: string;
  /** Plugin semantic version. */
  readonly version: string;
  /** Human-readable plugin description. */
  readonly description?: string;
  /** Display name used in UI surfaces. */
  readonly displayName?: string;
  /** Plugin category. */
  readonly type?: PluginType;
  /** Plugin author. */
  readonly author?: string;
  /** Plugin license identifier. */
  readonly license?: string;
  /** Plugin tags for discovery. */
  readonly tags?: readonly string[];
  /** Permissions requested by the plugin. */
  readonly permissions?: readonly string[];
  /** Runtime-safe metadata. */
  readonly metadata?: PluginMetadata;
  /** Contribution groups registered by the plugin. */
  readonly contributions: PluginContributions;
  /** Lifecycle hooks registered by the plugin. */
  readonly hooks?: PluginLifecycleHooks;
  /** Typed plugin dependencies consumed by this plugin. */
  readonly dependencies?: PluginDependencies;
}
