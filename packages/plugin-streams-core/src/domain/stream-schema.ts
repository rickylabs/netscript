/** Validation options accepted by Standard Schema validators. */
export interface StreamSchemaValidationOptions {
  /** Optional library-specific validation parameters. */
  readonly libraryOptions?: Record<string, unknown>;
}

/** One validation issue returned by a Standard Schema validator. */
export interface StreamSchemaIssue {
  /** Human-readable validation failure. */
  readonly message: string;
  /** Optional property path associated with the failure. */
  readonly path?: ReadonlyArray<PropertyKey | Readonly<{ key: PropertyKey }>>;
}

/** Result returned by a Standard Schema validator. */
export type StreamSchemaValidationResult<T> =
  | Readonly<{ value: T; issues?: undefined }>
  | Readonly<{ issues: readonly StreamSchemaIssue[] }>;

/** Package-owned Standard Schema surface used by durable stream collections. */
export interface StreamStandardSchema<T = unknown> {
  /** Standard Schema metadata and validator. */
  readonly '~standard': {
    /** Standard Schema version marker. */
    readonly version: 1;
    /** Schema provider identifier. */
    readonly vendor: string;
    /** Validate an unknown value into a collection entity. */
    readonly validate: (
      value: unknown,
      options?: StreamSchemaValidationOptions,
    ) => StreamSchemaValidationResult<T> | Promise<StreamSchemaValidationResult<T>>;
  };
}

/** A single collection definition inside a durable stream schema. */
export interface CollectionDefinition<T = unknown> {
  /** Standard Schema compatible validator used by durable-streams. */
  readonly schema: StreamStandardSchema<T>;
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
export type StateSchema<TDef extends StreamStateDefinition> = {
  readonly [K in keyof TDef]: CollectionWithHelpers<
    TDef[K] extends CollectionDefinition<infer T> ? T : unknown
  >;
};
