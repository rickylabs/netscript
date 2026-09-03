/** Record-shaped payload supported by the workers trigger wire schema. */
export type JobPayloadRecord = Readonly<Record<string, unknown>>;

/** Literal job-id-to-payload registry accepted by typed workers clients. */
export type JobPayloadRegistry = Readonly<Record<string, JobPayloadRecord>>;

/** Input accepted by `triggerJob`, optionally bound to a literal payload registry. */
export type JobTriggerInput<
  TPayloads extends JobPayloadRegistry = JobPayloadRegistry,
> = string extends keyof TPayloads ? Readonly<
    {
      /** Job id, resolved from the `{id}` path segment; optional in the broad service input. */
      id?: string;
      payload?: JobPayloadRecord;
      priority?: number;
      delay?: number;
      correlationId?: string;
      traceparent?: string;
      tracestate?: string;
    }
  >
  : {
    [TId in keyof TPayloads & string]: Readonly<
      & {
        id: TId;
        priority?: number;
        delay?: number;
        correlationId?: string;
        traceparent?: string;
        tracestate?: string;
      }
      & (undefined extends TPayloads[TId] ? Readonly<{ payload?: TPayloads[TId] }>
        : Readonly<{ payload: TPayloads[TId] }>)
    >;
  }[keyof TPayloads & string];
