/** Base metadata command group shared by plugin CLIs. */

import type { PluginCliCommand, PluginCliResult } from '../types.ts';

/** Data returned by the shared plugin metadata commands. */
export interface PluginBaseMeta {
  /** Plugin package name. */
  readonly name: string;
  /** Human-readable plugin label. */
  readonly displayName: string;
  /** Plugin version, when statically known. */
  readonly version?: string;
  /** Capability labels reported by `info`. */
  readonly capabilities?: readonly string[];
  /** Optional health probe used by `health` and `status`. */
  readonly health?: () => Promise<PluginCliResult> | PluginCliResult;
}

/**
 * Create the shared `status`, `health`, and `info` command set.
 *
 * @param meta - Static plugin metadata and optional health probe.
 * @returns Base metadata commands mountable by any plugin CLI.
 */
export function createBaseMetaCommands(meta: PluginBaseMeta): readonly PluginCliCommand[] {
  return Object.freeze([
    {
      name: 'status',
      description: 'Report plugin status.',
      run: (): Promise<PluginCliResult> => runStatus(meta),
    },
    {
      name: 'health',
      description: 'Run the plugin health probe.',
      run: (): PluginCliResult | Promise<PluginCliResult> => runHealth(meta),
    },
    {
      name: 'info',
      description: 'Report plugin metadata.',
      run: (): PluginCliResult => runInfo(meta),
    },
  ]);
}

async function runStatus(meta: PluginBaseMeta): Promise<PluginCliResult> {
  const health = await runHealth(meta);
  return Object.freeze({
    code: health.code,
    message: health.code === 0
      ? `${meta.displayName} is ready.`
      : `${meta.displayName} is not ready.`,
    data: { health },
  });
}

function runHealth(meta: PluginBaseMeta): PluginCliResult | Promise<PluginCliResult> {
  if (meta.health === undefined) {
    return Object.freeze({ code: 0, message: `${meta.displayName} has no health probe.` });
  }
  return meta.health();
}

function runInfo(meta: PluginBaseMeta): PluginCliResult {
  return Object.freeze({
    code: 0,
    message: meta.displayName,
    data: {
      name: meta.name,
      displayName: meta.displayName,
      version: meta.version,
      capabilities: meta.capabilities ?? [],
    },
  });
}
