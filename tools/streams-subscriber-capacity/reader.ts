/** Observe named SSE frames, and account for revisions only after their controls. */
import { Agent, get, type IncomingMessage } from 'node:http';
import { delay } from 'jsr:@std/async@1/delay';
import {
  createStreamSseReplayStateV1,
  parseStreamSseEventV1,
  reduceStreamSseReplayStateV1,
} from '@netscript/plugin-streams-core/sse';

const MAX_BUFFER_CHARS = 64 * 1024;
const MAX_RECONNECTS = 3;

/** Split native SSE framing across arbitrary HTTP chunks. The v1 API validates the payload. */
export async function* readFrames(
  chunks: AsyncIterable<Uint8Array>,
): AsyncGenerator<{ eventName: string; data: string }> {
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let tail = '';
  for await (const chunk of chunks) {
    tail += decoder.decode(chunk, { stream: true });
    const parts = tail.split(/\r?\n\r?\n/);
    tail = parts.pop()!;
    for (const part of parts) {
      if (part.length > MAX_BUFFER_CHARS) throw new Error('Oversized SSE frame');
      let eventName = '';
      const data = [];
      for (const line of part.split(/\r?\n/)) {
        if (line.startsWith('event:')) eventName = line.slice(6).trimStart();
        if (line.startsWith('data:')) data.push(line.slice(5).replace(/^ /, ''));
      }
      if (data.length > 0) yield { eventName, data: data.join('\n') };
    }
    if (tail.length > MAX_BUFFER_CHARS) throw new Error('Oversized unfinished SSE frame');
  }
}

class InvalidDelivery extends Error {}

/** Track validated commits and discard uncommitted data when the transport reconnects. */
export class Delivery {
  #state = createStreamSseReplayStateV1();
  #next = 0;
  readonly commits: Map<number, number> = new Map();
  duplicates = 0;
  outOfOrder = 0;

  constructor(readonly expected: readonly number[]) {}

  get offset(): string {
    return this.#state.lastCommittedOffset ?? '-1';
  }

  resetForReconnect(): void {
    this.#state = createStreamSseReplayStateV1({
      lastCommittedOffset: this.#state.lastCommittedOffset,
    });
  }

  observe(input: { eventName: string; data: string }, receivedAt: number): {
    caughtUp: boolean;
    closed: boolean;
  } {
    const parsed = parseStreamSseEventV1(input);
    if (!parsed.ok) throw new InvalidDelivery(parsed.error.message);
    const previous = this.#state;
    this.#state = reduceStreamSseReplayStateV1(previous, parsed.frame).state;
    if (parsed.frame.event === 'data') return { caughtUp: false, closed: false };
    if (previous.pendingBatches.length > 0 && previous.lastCommittedOffset === this.offset) {
      throw new InvalidDelivery('A batch control repeated the previous committed offset');
    }
    for (const batch of previous.pendingBatches) {
      for (const change of batch) {
        const value = change.value;
        if (
          change.type !== 'revision' || change.key !== 'revision' ||
          change.headers.operation !== 'upsert' || typeof value !== 'object' || value === null ||
          !('id' in value) || value.id !== 'revision' || !('revision' in value) ||
          typeof value.revision !== 'number' || !this.expected.includes(value.revision)
        ) {
          throw new InvalidDelivery('Unexpected synthetic revision');
        }
        const revision = value.revision;
        if (this.commits.has(revision)) {
          this.duplicates++;
          continue;
        }
        if (revision !== this.expected[this.#next]) this.outOfOrder++;
        this.commits.set(revision, receivedAt);
        while (this.commits.has(this.expected[this.#next])) this.#next++;
      }
    }
    return {
      caughtUp: parsed.frame.payload.upToDate === true,
      closed: this.#state.streamClosed,
    };
  }
}

interface ReaderOptions {
  readonly url: string;
  readonly expected: readonly number[];
  readonly delayMs: number;
  readonly signal: AbortSignal;
  readonly fail: (error: unknown) => void;
}

/** A single logical reader with bounded replay attempts and an independently observed open. */
export class Subscriber {
  readonly delivery: Delivery;
  readonly opened: Promise<void>;
  readonly done: Promise<void>;
  readonly httpVersions: Set<string> = new Set();
  reconnects = 0;

  constructor(options: ReaderOptions) {
    const opening = Promise.withResolvers<void>();
    this.opened = opening.promise;
    this.delivery = new Delivery(options.expected);
    const agent = new Agent({ keepAlive: false });
    this.done = this.#consume(options, opening.resolve, agent)
      .catch((error: unknown) => {
        if (!options.signal.aborted) options.fail(error);
      })
      .finally(() => agent.destroy());
  }

  async #consume(options: ReaderOptions, opened: () => void, agent: Agent): Promise<void> {
    const { signal } = options;
    const url = new URL(options.url);
    url.searchParams.set('live', 'sse');

    while (true) {
      signal.throwIfAborted();
      url.searchParams.set('offset', this.delivery.offset);
      const response = await new Promise<IncomingMessage>((resolve, reject) => {
        get(url, { agent, signal, headers: { accept: 'text/event-stream' } }, resolve)
          .once('error', reject);
      }).catch((error: unknown) => {
        if (!isConnectionError(error)) throw error;
      });
      if (response) {
        try {
          if (
            response.statusCode !== 200 ||
            !response.headers['content-type']?.startsWith('text/event-stream')
          ) {
            throw new InvalidDelivery('Expected a successful SSE response');
          }
          this.httpVersions.add(response.httpVersion);
          for await (const frame of readFrames(response)) {
            if (options.delayMs) await delay(options.delayMs, { signal });
            const control = this.delivery.observe(frame, performance.now());
            if (control.caughtUp) opened();
            if (control.closed) throw new InvalidDelivery('Unexpected terminal stream control');
          }
        } catch (error) {
          if (!isConnectionError(error)) throw error;
        } finally {
          response.destroy();
        }
      }
      signal.throwIfAborted();
      if (this.reconnects === MAX_RECONNECTS) throw new Error('SSE reconnect budget exhausted');
      await delay(100, { signal });
      this.delivery.resetForReconnect();
      this.reconnects++;
    }
  }
}

function isConnectionError(error: unknown): boolean {
  return error instanceof Error && 'code' in error &&
    ['ECONNRESET', 'ECONNREFUSED', 'EPIPE', 'ETIMEDOUT', 'ERR_STREAM_PREMATURE_CLOSE'].includes(
      String(error.code),
    );
}
