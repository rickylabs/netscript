import { PluginBuilder } from './plugin-builder.ts';

/** Start a new plugin manifest builder chain. */
export function definePlugin<TName extends string, TVersion extends string>(
  name: TName,
  version: TVersion,
): PluginBuilder<TName, TVersion, Record<PropertyKey, never>, Record<PropertyKey, never>> {
  return new PluginBuilder().withName(name).withVersion(version);
}
