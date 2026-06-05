import { createStateSchema } from '@durable-streams/state';
import type { StreamStateDefinition as DurableStreamStateDefinition } from '@durable-streams/state';
import type { StateSchema, StreamStateDefinition } from '../domain/stream-schema.ts';

/**
 * Define a type-safe durable stream schema.
 *
 * @param collections - Collection definitions keyed by collection name.
 * @returns A frozen State Protocol schema consumed by producers and stream DB clients.
 *
 * @example
 * ```ts
 * import { defineStreamSchema } from "@netscript/plugin-streams-core";
 *
 * const schema = defineStreamSchema({
 *   execution: {
 *     schema: { "~standard": { version: 1, vendor: "example", validate: (value) => ({ value }) } },
 *     type: "execution",
 *     primaryKey: "id",
 *   },
 * });
 * ```
 */
export function defineStreamSchema<TDef extends StreamStateDefinition>(
  collections: TDef,
): StateSchema<TDef> {
  return createStateSchema(
    collections as unknown as DurableStreamStateDefinition,
  ) as unknown as StateSchema<TDef>;
}
