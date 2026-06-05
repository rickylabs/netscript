/** Branded saga definition identifier. */
export type SagaId<TId extends string = string> = TId & { readonly __brand: 'SagaId' };

/** Branded saga instance identifier. */
export type SagaInstanceId<TId extends string = string> = TId & {
  readonly __brand: 'SagaInstanceId';
};

/** Branded correlation key used to route messages to saga instances. */
export type SagaCorrelationKey<TId extends string = string> = TId & {
  readonly __brand: 'SagaCorrelationKey';
};

/** Branded message identifier for runtime and diagnostics records. */
export type SagaMessageId<TId extends string = string> = TId & {
  readonly __brand: 'SagaMessageId';
};
