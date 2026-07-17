import { RESERVED_PLUGIN_NAMES } from '../../domain/mod.ts';

/** Return true when a plugin name is reserved by NetScript. */
export function isReservedPluginName(name: string): boolean {
  return RESERVED_PLUGIN_NAMES.some((reservedName) => reservedName === name);
}
