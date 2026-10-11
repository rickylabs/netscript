import type { CollectionDefinition } from './stream-schema.ts';

/**
 * Type-only signature of the upstream durable stream database factory.
 *
 * Import this symbol with `import type` and use `typeof StreamDBFactory` when
 * describing a supplied factory. It has no runtime export or implementation;
 * `StreamCollection` uses its generic return type to retain TanStack's nominal
 * collection contract without loading the upstream client through this module.
 *
 * @example
 * ```ts
 * import type { StreamDBFactory } from '@netscript/plugin-streams-core';
 *
 * type Factory = typeof StreamDBFactory;
 * declare const factory: Factory;
 * declare const options: Parameters<Factory>[0];
 * const db = factory(options);
 * console.log(db.collections);
 * ```
 */
declare const StreamDBFactory: (typeof import('@durable-streams/state/db'))['createStreamDB'];
export type { StreamDBFactory };

/**
 * Live TanStack collection handle for validated durable stream entities.
 *
 * @example
 * ```ts
 * import type { StreamCollection } from '@netscript/plugin-streams-core';
 *
 * declare const sessions: StreamCollection<{ id: string; state: string }>;
 * const session = sessions.get('session-1');
 * console.log(session?.state);
 * ```
 */
export type StreamCollection<T extends object> = ReturnType<
  typeof StreamDBFactory<{ item: CollectionDefinition<T> }>
>['collections']['item'];
