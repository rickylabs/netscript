import type { StreamProducerTransportFailureV1 } from '../domain/producer-contract-v1.ts';

/** Exact producer identity retained across an append retry. */
export interface StreamProducerIdentityV1 {
  /** Stable producer identity. */
  readonly producerId: string;
  /** Claimed producer epoch. */
  readonly epoch: number;
  /** Sequence number within the epoch. */
  readonly sequence: number;
}

/** Connection input for the durable stream transport edge. */
export interface StreamProducerConnectInputV1 {
  /** Durable stream URL. */
  readonly url: string;
  /** Request headers, including authorization. */
  readonly headers: Readonly<Record<string, string>>;
  /** Optional cancellation. */
  readonly signal?: AbortSignal;
}

/** Append input retained byte-for-byte until acknowledgement. */
export interface StreamProducerAppendInputV1 extends StreamProducerConnectInputV1 {
  /** Exact serialized State Protocol event. */
  readonly body: string;
  /** Exact idempotency tuple. */
  readonly identity: StreamProducerIdentityV1;
}

/** Terminal close input using the next sequence in the same producer epoch. */
export interface StreamProducerCloseInputV1 extends StreamProducerConnectInputV1 {
  /** Exact idempotency tuple for the close request. */
  readonly identity: StreamProducerIdentityV1;
}

/** Acknowledgement returned by an append or terminal close. */
export interface StreamProducerAcknowledgementV1 {
  /** Whether the server identified the tuple as an already-committed duplicate. */
  readonly duplicate: boolean;
}

/** Result of one transport operation without policy or retry decisions. */
export type StreamProducerTransportResultV1<T> =
  | Readonly<{ ok: true; value: T }>
  | Readonly<{ ok: false; failure: StreamProducerTransportFailureV1 }>;

/** Durable-stream protocol edge consumed by the producer supervisor. */
export interface StreamProducerTransportPort {
  /** Create or open the target stream. */
  connect(input: StreamProducerConnectInputV1): Promise<StreamProducerTransportResultV1<void>>;
  /** Append one exact event under one exact idempotency tuple. */
  append(
    input: StreamProducerAppendInputV1,
  ): Promise<StreamProducerTransportResultV1<StreamProducerAcknowledgementV1>>;
  /** Acknowledge terminal stream closure under the same producer identity. */
  close(
    input: StreamProducerCloseInputV1,
  ): Promise<StreamProducerTransportResultV1<StreamProducerAcknowledgementV1>>;
}
