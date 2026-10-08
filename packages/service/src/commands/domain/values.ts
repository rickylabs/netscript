/** I-JSON data admitted by command codecs after runtime validation. */
export type CommandJson = null | boolean | string | number | readonly CommandJson[] | {
  readonly [key: string]: CommandJson;
};

/** Narrow durable origin; authentication and authorization happen before execution. */
export type CommandActor =
  | Readonly<{ kind: 'principal'; subject: string; scheme?: string }>
  | Readonly<{ kind: 'system'; subject: string }>;

/** W3C propagation fields carried by a command, outside its request identity. */
export type CommandTraceContext = Readonly<{ traceparent: string; tracestate?: string }>;

/** Command input and transport identity; expectedVersion is a normalized string token. */
export type CommandEnvelope<TInput> = Readonly<{
  input: TInput;
  actor: CommandActor;
  correlationId: string;
  trace?: CommandTraceContext;
  idempotencyKey?: string;
  expectedVersion?: string;
}>;
