/**
 * Minimal durable-stream producer that speaks NetScript's SSE wire contract V1
 * (`event: data` change batches committed by `event: control` offsets), so the
 * desktop client can use the real `@netscript/sdk/streams/consumer` source with
 * offset resume. A production app points the same consumer at the Durable
 * Streams server behind `@netscript/plugin-streams`.
 */
type Operation = 'insert' | 'update' | 'delete' | 'upsert';

interface Change {
  readonly type: string;
  readonly key: string;
  readonly headers: { readonly operation: Operation; readonly correlationId: string; readonly traceparent: string };
  readonly value?: unknown;
}

const encoder = new TextEncoder();
const HEARTBEAT_MS = 10_000;
const RETAINED = 2_000;

function hex(bytes: number): string {
  const buffer = crypto.getRandomValues(new Uint8Array(bytes));
  return Array.from(buffer, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function offsetString(offset: number): string {
  return String(offset).padStart(12, '0');
}

export class ActivityStream {
  #next = 1;
  readonly #entries: Array<{ offset: number; change: Change }> = [];
  readonly #listeners = new Set<() => void>();

  /** Append one change; live connections receive it in their next frame. */
  publish(type: string, key: string, value: unknown, operation: Operation = 'upsert'): void {
    const change: Change = {
      type,
      key,
      headers: { operation, correlationId: crypto.randomUUID(), traceparent: `00-${hex(16)}-${hex(8)}-01` },
      value,
    };
    this.#entries.push({ offset: this.#next++, change });
    if (this.#entries.length > RETAINED) this.#entries.splice(0, this.#entries.length - RETAINED);
    for (const listener of this.#listeners) listener();
  }

  get lastOffset(): number {
    return this.#next - 1;
  }

  /** `GET <path>?offset=<opaque|-1>&live=sse` */
  respond(request: Request): Response {
    const url = new URL(request.url);
    const requested = request.headers.get('last-event-id') ?? url.searchParams.get('offset') ?? '-1';
    let cursor = requested === '-1' || requested === 'now' ? 0 : Number(requested) || 0;
    if (requested === 'now') cursor = this.lastOffset;
    let closed = false;
    let heartbeat: ReturnType<typeof setInterval> | undefined;
    let wake: (() => void) | undefined;

    const body = new ReadableStream<Uint8Array>({
      start: (controller) => {
        const write = (text: string) => {
          if (!closed) controller.enqueue(encoder.encode(text));
        };
        const flush = () => {
          const pending = this.#entries.filter((entry) => entry.offset > cursor);
          if (pending.length > 0) {
            for (let index = 0; index < pending.length; index += 100) {
              const batch = pending.slice(index, index + 100);
              cursor = batch[batch.length - 1].offset;
              write(`event: data\ndata: ${JSON.stringify(batch.map((entry) => entry.change))}\n\n`);
              write(`id: ${offsetString(cursor)}\nevent: control\ndata: ${JSON.stringify({ streamNextOffset: offsetString(cursor), upToDate: index + 100 >= pending.length })}\n\n`);
            }
          }
        };
        write('retry: 1000\n\n');
        flush();
        write(`event: control\ndata: ${JSON.stringify({ streamNextOffset: offsetString(cursor), upToDate: true })}\n\n`);
        wake = flush;
        this.#listeners.add(flush);
        heartbeat = setInterval(() => {
          write(`event: control\ndata: ${JSON.stringify({ streamNextOffset: offsetString(cursor), upToDate: true })}\n\n`);
        }, HEARTBEAT_MS);
        request.signal.addEventListener('abort', () => {
          closed = true;
          clearInterval(heartbeat);
          if (wake) this.#listeners.delete(wake);
          try {
            controller.close();
          } catch { /* already closed */ }
        });
      },
      cancel: () => {
        closed = true;
        clearInterval(heartbeat);
        if (wake) this.#listeners.delete(wake);
      },
    });
    return new Response(body, {
      headers: { 'content-type': 'text/event-stream', 'cache-control': 'no-store', connection: 'keep-alive' },
    });
  }
}
