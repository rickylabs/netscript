import type { PluginManifest } from './plugin-manifest.ts';

/** Typed plugin dependency record keyed by caller-chosen aliases. */
export type PluginDependencies = Readonly<Record<string, PluginManifest>>;
