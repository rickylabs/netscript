/** Shared input helpers for AI adapter resources.
 *
 * @module
 */

import type { PluginCliArgs } from '@netscript/plugin/adapter';

/** Common AI resource input: a stable identifier supplied by the user. */
export interface AiResourceInput {
  /** Stable resource identifier used to derive file and symbol names. */
  readonly id: string;
}

/** Convert a resource identifier into a stable file stem. */
export function fileStem(id: string): string {
  return id.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/** Convert a resource identifier into a stable exported symbol stem. */
export function exportStem(id: string): string {
  const cleaned = id
    .trim()
    .replace(/^[^a-zA-Z_]+/, '')
    .replace(/[^a-zA-Z0-9]+(.)/g, (_match, char: string) => char.toUpperCase())
    .replace(/[^a-zA-Z0-9_]/g, '');
  return cleaned.length > 0 ? cleaned : 'ai';
}

/** Read the resource id from either adapter-form or legacy command-form args. */
export function requiredResourceId(args: PluginCliArgs): string {
  const [, adapterId] = args.values ?? [];
  const legacyId = args.values?.[0];
  const id = args.command === 'add' || args.command === 'generate' ? adapterId : legacyId;
  if (!id || id.trim().length === 0) {
    throw new Error('Missing AI resource id.');
  }
  return id;
}

/** Parse a single-id AI resource input from adapter CLI args. */
export function parseResourceInput(args: PluginCliArgs): AiResourceInput {
  return { id: requiredResourceId(args) };
}
