import { createDurableStream, type DurableStreamProducer } from '@netscript/plugin-streams-core';
import { sagasStreamSchema } from './schema.ts';

const STREAM_PATH = '/sagas/instances';
const PRODUCER_ID = 'sagas-service';

let producer: DurableStreamProducer<typeof sagasStreamSchema> | undefined;
let reconciliationStarted = false;

type SagaInstanceRecordSelect = {
  correlationId: true;
  sagaName: true;
  state: true;
  version: true;
  isCompleted: true;
  createdAt: true;
  updatedAt: true;
};

type SagaInstanceRecord = {
  correlationId: string;
  sagaName: string;
  state: unknown;
  version: number;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
};

/** Minimal Prisma-like client needed for saga stream state reconciliation. */
export interface SagaStreamPrismaClient {
  sagaInstance: {
    findMany(args: {
      orderBy: Array<{ updatedAt: 'asc' } | { correlationId: 'asc' }>;
      take: number;
      skip: number;
      select: SagaInstanceRecordSelect;
    }): Promise<SagaInstanceRecord[]>;
  };
}

/** Options for bootstrapping saga state into durable streams. */
export interface SagasStreamMirrorOptions {
  readonly signal?: AbortSignal;
  readonly prisma?: SagaStreamPrismaClient | null;
}

/** Get or create the sagas stream producer. */
export function getSagasStreamProducer(): DurableStreamProducer<typeof sagasStreamSchema> {
  if (!producer) {
    producer = createDurableStream({
      streamPath: STREAM_PATH,
      schema: sagasStreamSchema,
      producerId: PRODUCER_ID,
    });
  }
  return producer;
}

/** Mirror existing saga state snapshots into the durable streams server. */
export async function startSagasStreamMirror(
  input?: AbortSignal | SagasStreamMirrorOptions,
): Promise<void> {
  const options = normalizeMirrorOptions(input);
  await startSagaStateReconciliation(getSagasStreamProducer(), options);
}

async function startSagaStateReconciliation(
  streamProducer: DurableStreamProducer<typeof sagasStreamSchema>,
  options: SagasStreamMirrorOptions,
): Promise<void> {
  if (reconciliationStarted || !options.prisma) {
    return;
  }

  reconciliationStarted = true;
  const pageSize = 100;
  let offset = 0;

  try {
    while (!options.signal?.aborted) {
      const records = await options.prisma.sagaInstance.findMany({
        orderBy: [
          { updatedAt: 'asc' },
          { correlationId: 'asc' },
        ],
        take: pageSize,
        skip: offset,
        select: sagaInstanceRecordSelect(),
      });

      if (records.length === 0) {
        break;
      }

      for (const record of records) {
        streamProducer.upsert('sagaInstance', mapSagaRecordToEntity(record));
      }

      if (records.length < pageSize) {
        break;
      }

      offset += records.length;
    }
  } catch (error) {
    if (!(error instanceof Error && error.name === 'AbortError')) {
      console.error('[Sagas Stream] State reconciliation stopped unexpectedly:', error);
    }
  } finally {
    reconciliationStarted = false;
  }
}

function mapSagaRecordToEntity(record: SagaInstanceRecord): Record<string, unknown> {
  const state = isRecord(record.state) ? record.state : {};
  const metadata = isRecord(state.metadata) ? state.metadata : undefined;
  const version = typeof metadata?.version === 'number' ? metadata.version : record.version;
  const isCompleted = typeof metadata?.isCompleted === 'boolean'
    ? metadata.isCompleted
    : record.isCompleted;
  const updatedAt = toISOString(
    metadata && (metadata.updatedAt as string | Date | undefined)
      ? (metadata.updatedAt as string | Date | undefined)
      : record.updatedAt,
  );
  const createdAt = toISOString(
    metadata && (metadata.createdAt as string | Date | undefined)
      ? (metadata.createdAt as string | Date | undefined)
      : record.createdAt,
  );

  return {
    instanceId: `${record.sagaName}:${record.correlationId}`,
    sagaId: record.sagaName,
    correlationKey: record.correlationId,
    status: isCompleted ? 'completed' : 'active',
    state,
    version,
    messageCount: version,
    lastMessageType: typeof state.lastMessageType === 'string' ? state.lastMessageType : undefined,
    startedAt: createdAt,
    updatedAt,
    completedAt: isCompleted ? updatedAt : undefined,
  };
}

function sagaInstanceRecordSelect(): SagaInstanceRecordSelect {
  return {
    correlationId: true,
    sagaName: true,
    state: true,
    version: true,
    isCompleted: true,
    createdAt: true,
    updatedAt: true,
  };
}

function normalizeMirrorOptions(
  input?: AbortSignal | SagasStreamMirrorOptions,
): SagasStreamMirrorOptions {
  if (isAbortSignal(input)) {
    return { signal: input };
  }
  return input ?? {};
}

function toISOString(value: string | Date | undefined): string {
  return value instanceof Date ? value.toISOString() : new Date(value ?? Date.now()).toISOString();
}

function isAbortSignal(value: unknown): value is AbortSignal {
  return typeof value === 'object' && value !== null && 'aborted' in value &&
    'addEventListener' in value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
