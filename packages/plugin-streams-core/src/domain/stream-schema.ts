/** A single collection definition inside a durable stream schema. */
export interface CollectionDefinition<T = unknown> {
  /** Standard Schema compatible validator used by durable-streams. */
  readonly schema: DurableCollectionDefinition<T>['schema'];
  /** State Protocol type discriminator emitted for the collection. */
  readonly type: string;
  /** Property name used as the entity primary key. */
  readonly primaryKey: string;
}

/** Helper methods attached to collections by `@durable-streams/state`. */
export interface CollectionEventHelpers<T = unknown> {
  /** Create an insert event for the collection. */
  insert(params: Readonly<{ key?: string; value: T; headers?: Record<string, string> }>): unknown;
  /** Create an update event for the collection. */
  update(
    params: Readonly<{
      key?: string;
      value: T;
      oldValue?: T;
      headers?: Record<string, string>;
    }>,
  ): unknown;
  /** Create an upsert event for the collection. */
  upsert(params: Readonly<{ key?: string; value: T; headers?: Record<string, string> }>): unknown;
  /** Create a delete event for the collection. */
  delete(
    params: Readonly<{ key?: string; oldValue?: T; headers?: Record<string, string> }>,
  ): unknown;
}

/** Collection definition after durable-streams helper methods are attached. */
export type CollectionWithHelpers<T = unknown> =
  & CollectionDefinition<T>
  & CollectionEventHelpers<T>;

/** Input map accepted by `defineStreamSchema`. */
export type StreamStateDefinition = Record<string, CollectionDefinition>;

/** Schema map returned by `defineStreamSchema`. */
export type StateSchema<TDef extends StreamStateDefinition> = DurableStateSchema<TDef>;
import type {
  CollectionDefinition as DurableCollectionDefinition,
  StateSchema as DurableStateSchema,
} from '@durable-streams/state';
