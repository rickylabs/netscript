/** Branded trigger definition identifier. */
export type TriggerId<TId extends string = string> = TId & { readonly __brand: 'TriggerId' };

/** Branded trigger event identifier. */
export type TriggerEventId<TId extends string = string> = TId & {
  readonly __brand: 'TriggerEventId';
};

/** Branded webhook definition identifier. */
export type WebhookId<TId extends string = string> = TId & { readonly __brand: 'WebhookId' };
