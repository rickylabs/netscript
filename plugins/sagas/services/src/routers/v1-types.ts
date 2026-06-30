import type { SagaDurabilityTier, SagaInstanceStatus } from '@netscript/plugin-sagas-core/domain';

/** Service context available to V1 saga route handlers. */
export type SagaServiceContext = Readonly<{
  /** Database client provided by the plugin service host. */
  db: SagaServiceDatabaseClient;
  /** Started saga runtime used by publish endpoints. */
  sagaRuntime?: SagaServiceRuntime;
}>;

/** Minimal saga runtime message shape used by the service publish endpoint. */
export type SagaRuntimeMessage = Readonly<{
  /** Message type routed by saga handlers. */
  type: string;
  /** Optional message payload. */
  payload?: unknown;
  /** Optional saga correlation key. */
  correlationKey?: string;
  /** Optional client idempotency key used to deduplicate retries. */
  idempotencyKey?: string;
  /** Message occurrence timestamp. */
  occurredAt: Date;
  /** W3C traceparent header. */
  traceparent?: string;
  /** W3C tracestate header. */
  tracestate?: string;
}>;

/** Minimal runtime publish options used by the service publish endpoint. */
export type SagaRuntimePublishOptions = Readonly<{
  /** Optional client idempotency key used to deduplicate retries. */
  idempotencyKey?: string;
  /** W3C traceparent header. */
  traceparent?: string;
  /** W3C tracestate header. */
  tracestate?: string;
}>;

/** Minimal saga runtime boundary required by V1 handlers. */
export interface SagaServiceRuntime {
  /** Publish one saga runtime message. */
  publish(message: SagaRuntimeMessage, options?: SagaRuntimePublishOptions): Promise<unknown>;
}

/** Server-sent event names emitted by the saga API. */
export type SagaPublishEventType =
  | 'saga:started'
  | 'saga:message_received'
  | 'saga:state_changed'
  | 'saga:completed'
  | 'saga:failed'
  | 'heartbeat';

/** SSE event shape written by publish handlers. */
export type SagaPublishEvent = Readonly<{
  /** Event type discriminator. */
  type: SagaPublishEventType;
  /** Event timestamp. */
  timestamp: string;
  /** Optional saga definition name. */
  sagaName?: string;
  /** Optional correlation identifier. */
  correlationId?: string;
  /** Event payload. */
  data?: Readonly<Record<string, unknown>>;
}>;

/** Writer for saga publish SSE events. */
export type SagaPublishEventWriter = (
  event: SagaPublishEvent,
) => Promise<void>;

/** Options used when publishing one contract message through the saga runtime. */
export type PublishSagaMessageOptions = Readonly<{
  /** Started runtime used to route the message. */
  runtime: SagaServiceRuntime;
  /** Optional event writer used by tests or alternate transports. */
  writeEvent?: SagaPublishEventWriter;
  /** Trace headers propagated from the active request span. */
  traceHeaders?: Readonly<Record<string, string>>;
}>;

/** Input accepted by the V1 publish helper. */
export type SagaPublishMessageInput = Readonly<{
  /** Message type routed by saga handlers. */
  type: string;
  /** Optional JSON-like payload. */
  payload?: Readonly<Record<string, unknown>>;
  /** Optional correlation identifier. */
  correlationId?: string;
  /** Optional client idempotency key used to deduplicate retries. */
  idempotencyKey?: string;
  /** Optional topic hint. */
  topic?: string;
}>;

/** Output returned by the V1 publish helper. */
export type SagaPublishMessageOutput = Readonly<{
  /** Whether the message was accepted for publishing. */
  published: boolean;
  /** Published message type. */
  messageType: string;
  /** Optional correlation identifier. */
  correlationId?: string;
}>;

/**
 * Saga instance API status values.
 *
 * Aligned with the canonical contract vocabulary (`SAGA_INSTANCE_STATUSES` in
 * `@netscript/plugin-sagas-core/domain`) so handler outputs conform UP to the
 * published `SagaInstanceResponse` contract without loosening it. The previous
 * connector-local `'active'` value was not a contract status; non-completed
 * instances normalize to `'running'`.
 */
export type SagaInstanceApiStatus = SagaInstanceStatus;

/** Saga instance response returned by V1 APIs. */
export type SagaInstanceResponse = Readonly<{
  /** Saga definition name. */
  sagaName: string;
  /** Optional saga definition identifier (Decision-B). */
  sagaId?: string;
  /** Optional durable instance identifier (Decision-B). */
  instanceId?: string;
  /** Correlation identifier. */
  correlationId: string;
  /** Optional saga correlation key (Decision-B). */
  correlationKey?: string;
  /** Business state payload. */
  state: Record<string, unknown>;
  /** Normalized instance status. */
  status: SagaInstanceApiStatus;
  /** Creation timestamp. */
  createdAt: string;
  /** Last update timestamp. */
  updatedAt: string;
  /** Optional completion timestamp. */
  completedAt?: string;
  /** State version. */
  version: number;
  /** Approximate processed message count. */
  messageCount: number;
  /** Last observed message type. */
  lastMessageType?: string;
}>;

/** Registered saga metadata shape consumed by V1 responses. */
export type SagaMetadataView = Readonly<{
  /** Saga definition identifier. */
  id: string;
  /** Human-readable saga name. */
  name: string;
  /** Optional topic. */
  topic?: string;
  /** Optional enabled flag. */
  enabled?: boolean;
}>;

/** Saga definition response returned by list/get APIs. */
export type SagaDefinitionResponse = Readonly<{
  /** Saga definition identifier. */
  id: string;
  /** Saga display name. */
  name: string;
  /** Saga description. */
  description: string;
  /** Saga topic. */
  topic: string;
  /** Whether the saga is enabled. */
  enabled: boolean;
  /** Optional source entrypoint. */
  entrypoint: string;
  /** Tags used for discovery (mutable to match the contract output schema). */
  tags: string[];
  /** Durability tier advertised for the saga definition (Decision-B). */
  durabilityTier: SagaDurabilityTier;
  /** Optional timeout policy. */
  timeout?: { completionTimeout?: number };
  /** Optional retry policy. */
  retry?: {
    maxAttempts?: number;
    initialDelay?: number;
    maxDelay?: number;
  };
}>;

/** Saga execution history response entry. */
export type SagaHistoryResponseEntry = Readonly<{
  /** History row identifier. */
  id: string;
  /** Saga definition name. */
  sagaName: string;
  /** Saga definition identifier. */
  sagaId: string;
  /** Correlation identifier. */
  correlationId: string;
  /** Message type handled by the transition. */
  messageType: string;
  /** Optional message identifier. */
  messageId?: string;
  /** Previous state snapshot. */
  previousState?: Record<string, unknown>;
  /** New state snapshot. */
  newState: Record<string, unknown>;
  /** Normalized transition outcome. */
  outcome: 'success' | 'error' | 'compensated';
  /** Optional error message. */
  error?: string;
  /** Optional transition duration. */
  duration?: number;
  /** Transition timestamp. */
  transitionAt: string;
}>;

/** Saga instance state returned by durable saga stores. */
export interface SagaInstanceState {
  /** Durable record identifier. */
  id: string;
  /** Saga correlation identifier. */
  correlationId: string;
  /** State version. */
  version: number;
  /** Whether the saga has completed. */
  isCompleted: boolean;
  /** Creation timestamp from the store. */
  createdAt?: Date;
  /** Last update timestamp from the store. */
  updatedAt?: Date;
  /** Optional nested saga metadata. */
  metadata?: {
    /** Saga definition identifier. */
    sagaId?: string;
    /** Metadata version. */
    version?: number;
    /** Metadata creation timestamp. */
    createdAt?: string | Date;
    /** Metadata update timestamp. */
    updatedAt?: string | Date;
    /** Metadata completion flag. */
    isCompleted?: boolean;
    /** W3C traceparent header. */
    traceParent?: string | null;
    /** W3C tracestate header. */
    traceState?: string | null;
  };
  /** Additional business state fields. */
  [key: string]: unknown;
}

/** JSON path shape accepted by Prisma JSON filters across supported providers. */
export type SagaPrismaJsonPath = string | string[];

/** JSON equality value accepted by the V1 status filter. */
export type SagaPrismaJsonEquals = string;

/** JSON state filter used by saga instance queries. */
export type SagaInstanceStateFilter = {
  /** Provider-specific JSON path. */
  path: SagaPrismaJsonPath;
  /** Scalar value to compare at the JSON path. */
  equals: SagaPrismaJsonEquals;
};

/** Hand-typed Prisma where input for saga instance queries. */
export type SagaInstanceWhereInput = {
  /** Saga definition name. */
  sagaName?: string;
  /** Correlation identifier. */
  correlationId?: string;
  /** Completion flag stored on the saga instance row. */
  isCompleted?: boolean;
  /** JSON state filter for non-completed statuses. */
  state?: SagaInstanceStateFilter;
};

/** Hand-typed Prisma order for saga instance queries. */
export type SagaInstanceOrderByInput = {
  /** Creation timestamp sort order. */
  createdAt?: 'asc' | 'desc';
};

/** Raw Prisma record returned by saga instance queries. */
export interface PrismaRecord {
  /** Durable record identifier. */
  id: string;
  /** Saga definition name. */
  sagaName: string;
  /** Correlation identifier. */
  correlationId: string;
  /** State version. */
  version: number;
  /** Completion flag. */
  isCompleted: boolean;
  /** Persisted saga state. */
  state: Record<string, unknown>;
  /** Creation timestamp. */
  createdAt: Date;
  /** Last update timestamp. */
  updatedAt: Date;
}

/** Saga execution history record returned by Prisma. */
export interface SagaHistoryEntry {
  /** History row identifier. */
  id: string;
  /** Saga definition name. */
  sagaName: string;
  /** Saga definition identifier. */
  sagaId: string;
  /** Correlation identifier. */
  correlationId: string;
  /** Step name recorded by the runtime. */
  stepName: string;
  /** Message type handled by the transition. */
  messageType: string;
  /** Optional message identifier. */
  messageId?: string | null;
  /** Runtime outcome string. */
  outcome?: string | null;
  /** Optional error message. */
  error?: string | null;
  /** Optional duration in milliseconds. */
  duration?: number | null;
  /** Previous state snapshot. */
  previousState?: Record<string, unknown> | null;
  /** New state snapshot. */
  newState?: Record<string, unknown> | null;
  /** Transition timestamp. */
  transitionAt: Date;
  /** History row creation timestamp. */
  createdAt: Date;
  /** Optional runtime metadata. */
  metadata?: Record<string, unknown> | null;
}

/** Hand-typed Prisma subset required by the V1 sagas router. */
export interface SagaServiceDatabaseClient {
  /** Saga instance table access. */
  sagaInstance: {
    /** List saga instance records. */
    findMany(args: {
      where?: SagaInstanceWhereInput;
      orderBy: SagaInstanceOrderByInput;
      take?: number;
      skip?: number;
    }): Promise<PrismaRecord[]>;
    /** Count saga instance records. */
    count(args: {
      where?: SagaInstanceWhereInput;
    }): Promise<number>;
  };
  /** Saga execution history table access. */
  sagaExecutionHistory: {
    /** List execution history records. */
    findMany(args: {
      where: Pick<SagaInstanceWhereInput, 'sagaName' | 'correlationId'>;
      orderBy: { transitionAt: 'asc' | 'desc' };
      take?: number;
      skip?: number;
    }): Promise<SagaHistoryEntry[]>;
    /** Count execution history records. */
    count(args: {
      where: Pick<SagaInstanceWhereInput, 'sagaName' | 'correlationId'>;
    }): Promise<number>;
  };
}
