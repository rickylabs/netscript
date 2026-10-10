import type {
  StreamAdminSpanV1,
  StreamDeletionV1,
  StreamHeadV1,
} from '../domain/admin-contract-v1.ts';
import type { StreamProducerTransportResultV1 } from '../domain/producer-contract-v1.ts';

/** Resolved service request accepted by the administrative transport edge. */
export interface StreamAdminInputV1 {
  /** Full stream URL, resolved by the composition helper. */
  readonly url: string;
  /** Service identity authorization headers. */
  readonly headers: Readonly<Record<string, string>>;
  /** Finite timeout for one transport request. */
  readonly requestTimeoutMs: number;
  /** Optional caller cancellation. */
  readonly signal?: AbortSignal;
}

/** Whole-stream administration for background workers and triggers. */
export interface StreamAdminPort {
  /** Read bounded metadata; null means the stream does not exist. */
  head(input: StreamAdminInputV1): Promise<StreamProducerTransportResultV1<StreamHeadV1 | null>>;
  /** Delete the whole stream; absence is a successful idempotent outcome. */
  delete(input: StreamAdminInputV1): Promise<StreamProducerTransportResultV1<StreamDeletionV1>>;
}

/** Narrow telemetry dependency satisfied by the existing StreamsInstrumentation facade. */
export interface StreamAdminInstrumentationV1 {
  /** Start one administrative request span. */
  startAdminSpan(
    streamPath: string,
    operation: 'head' | 'delete',
  ): StreamAdminSpanV1;
}
