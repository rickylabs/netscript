/**
 * Fenced durable chat session writer (#2067) — internal to `@netscript/fresh/ai`.
 *
 * Mirrors `toDurableChatSessionResponse` from
 * `@durable-streams/tanstack-ai-transport` (same stream setup, same echo and
 * sanitization helpers, same response statuses) but appends through
 * `@durable-streams/client`'s `IdempotentProducer`, so the new-message echo and
 * the assistant chunks share one `(id, epoch, seq)` producer sequence and a
 * stale epoch is rejected by the streams runtime.
 *
 * @module
 */

import {
  type DurableStream,
  FetchError,
  IdempotentProducer,
  SequenceGapError,
  StaleEpochError,
  STREAM_CLOSED_HEADER,
} from '@durable-streams/client';
import {
  ensureDurableChatSessionStream,
  sanitizeChunkForStorage,
  toMessageEchoChunks,
} from '@durable-streams/tanstack-ai-transport';
import type { StreamProducerTransportFailureKindV1 } from '@netscript/plugin-streams-core';
import { type NetScriptChatProducer, NetScriptChatProducerError } from './chat-producer.ts';

/**
 * Batches allowed in flight before the assistant pipe waits for acknowledgement.
 * Bounds buffered memory to roughly this many producer batches.
 */
const MAX_IN_FLIGHT_BATCHES = 5;

/** Compile-time guard: the chat error kinds stay identical to the State Protocol producer kinds. */
type SameKinds<A, B> = [A] extends [B] ? ([B] extends [A] ? true : never) : never;
const KINDS_MATCH: SameKinds<
  NetScriptChatProducerError['kind'],
  StreamProducerTransportFailureKindV1
> = true;
void KINDS_MATCH;

/** Input of {@link toFencedChatSessionResponse}; the default `toResponse` seam shape plus a producer. */
export interface FencedChatSessionResponseInput {
  readonly writeUrl: string;
  readonly headers: Record<string, string>;
  readonly producer: NetScriptChatProducer;
  readonly newMessages: readonly unknown[];
  readonly source: AsyncIterable<unknown>;
  readonly mode?: 'immediate' | 'await';
  readonly waitUntil?: (task: Promise<unknown>) => void;
}

/** Reject a malformed writer identity before any request is made. */
export function assertChatProducer(producer: NetScriptChatProducer): void {
  if (typeof producer.id !== 'string' || producer.id.trim().length === 0) {
    throw new TypeError('toNetScriptChatResponse: `producer.id` must be a non-empty string.');
  }
  if (!Number.isSafeInteger(producer.epoch) || producer.epoch < 0) {
    throw new TypeError(
      'toNetScriptChatResponse: `producer.epoch` must be a non-negative safe integer.',
    );
  }
}

/**
 * Produce a durable chat session `Response`, appending under a fenced producer.
 *
 * The echo of `newMessages` is acknowledged before the response is returned (as
 * upstream). In `'await'` mode a failed append rejects with a
 * {@link NetScriptChatProducerError}; in `'immediate'` mode an assistant-append
 * failure after the `202` is logged like the upstream background writer.
 */
export async function toFencedChatSessionResponse(
  input: FencedChatSessionResponseInput,
): Promise<Response> {
  const stream = await ensureDurableChatSessionStream({
    writeUrl: input.writeUrl,
    headers: input.headers,
    createIfMissing: true,
  });
  const writer = new FencedChatSessionWriter(stream, input.producer);
  await writer.writeEcho(
    input.newMessages.flatMap((message) =>
      toMessageEchoChunks(message as Parameters<typeof toMessageEchoChunks>[0])
    ),
  );
  const writeAssistant = writer.pipe(input.source);

  if (input.mode === 'await') {
    await writeAssistant;
    return new Response(null, { status: 200, headers: { 'Cache-Control': 'no-store' } });
  }
  const backgroundTask = writeAssistant.catch((error) => {
    console.error('Durable chat session write failed', error);
  });
  input.waitUntil?.(backgroundTask);
  return new Response(null, { status: 202, headers: { 'Cache-Control': 'no-store' } });
}

/** One writer lifetime: one `IdempotentProducer`, one sequence, first failure wins. */
class FencedChatSessionWriter {
  readonly #producer: IdempotentProducer;
  readonly #identity: NetScriptChatProducer;
  #failure: Error | undefined;

  constructor(stream: DurableStream, identity: NetScriptChatProducer) {
    this.#identity = identity;
    this.#producer = new IdempotentProducer(stream, identity.id, {
      epoch: identity.epoch,
      // Never self-heal a stale epoch by claiming epoch + 1: that would defeat fencing.
      autoClaim: false,
      maxInFlight: MAX_IN_FLIGHT_BATCHES,
      onError: (error) => {
        this.#failure ??= error;
      },
    });
  }

  /** Append the new-message echo and wait for its acknowledgement. */
  async writeEcho(chunks: readonly unknown[]): Promise<void> {
    for (const chunk of chunks) this.#append(chunk);
    try {
      await this.#settle();
    } catch (error) {
      await this.#producer.detach();
      throw error;
    }
  }

  /** Pipe assistant chunks under the same sequence; stops consuming `source` on the first failure. */
  async pipe(source: AsyncIterable<unknown>): Promise<void> {
    try {
      for await (const chunk of source) {
        if (this.#failure !== undefined) break;
        this.#append(chunk);
        if (this.#producer.inFlightCount >= MAX_IN_FLIGHT_BATCHES) await this.#producer.flush();
      }
      await this.#settle();
    } finally {
      await this.#producer.detach();
    }
  }

  #append(chunk: unknown): void {
    this.#producer.append(JSON.stringify(sanitizeChunkForStorage(chunk)));
  }

  async #settle(): Promise<void> {
    await this.#producer.flush();
    if (this.#failure !== undefined) throw toChatProducerError(this.#failure, this.#identity);
  }
}

function toChatProducerError(
  error: Error,
  producer: NetScriptChatProducer,
): NetScriptChatProducerError {
  if (error instanceof StaleEpochError) {
    const message = `toNetScriptChatResponse: producer "${producer.id}" epoch ${producer.epoch} ` +
      `is stale; a newer writer holds epoch ${error.currentEpoch}.`;
    return new NetScriptChatProducerError(
      { kind: 'stale-epoch', producer, message, currentEpoch: error.currentEpoch },
      { cause: error },
    );
  }
  return new NetScriptChatProducerError(
    { kind: classifyFailure(error), producer, message: error.message },
    { cause: error },
  );
}

/** Same categories as the State Protocol producer transport in `@netscript/plugin-streams-core`. */
function classifyFailure(error: Error): StreamProducerTransportFailureKindV1 {
  if (error instanceof SequenceGapError) return 'sequence-gap';
  if (error instanceof FetchError) {
    if (error.status === 409 && error.headers[STREAM_CLOSED_HEADER.toLowerCase()] === 'true') {
      return 'stream-closed';
    }
    const retryable = error.status === 408 || error.status === 429 || error.status >= 500;
    return retryable ? 'retryable' : 'non-retryable';
  }
  if (error.name === 'AbortError') return 'aborted';
  return error instanceof TypeError ? 'retryable' : 'non-retryable';
}
