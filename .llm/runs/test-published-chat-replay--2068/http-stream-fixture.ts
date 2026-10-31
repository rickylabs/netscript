/** HTTP storage/framing only; every application record must arrive in a writer POST. */
export class HttpStreamFixture {
  readonly records: unknown[] = [];
  readonly posted: unknown[][] = [];
  readonly offsets: string[] = [];
  readonly snapshotOffsets: string[] = [];
  opens = 0;
  live = 0;
  maxLive = 0;
  cancels = 0;
  readonly #readers = new Set<ReadableStreamDefaultController<Uint8Array>>();
  readonly #listeners = new Set<() => void>();
  readonly #encoder = new TextEncoder();
  readonly #dropNative: boolean;
  readonly #server: Deno.HttpServer<Deno.NetAddr>;
  readonly target: { readonly sessionId: string; readonly baseUrl: string };

  constructor(dropNative = false) {
    this.#dropNative = dropNative;
    this.#server = Deno.serve(
      { hostname: '127.0.0.1', port: 0, onListen() {} },
      async (request) => {
        if (request.method === 'PUT') return new Response(null, { status: 201 });
        if (request.method === 'POST') {
          const body: unknown = await request.json();
          const items: unknown[] = Array.isArray(body) ? body : [body];
          this.posted.push(structuredClone(items));
          this.records.push(...structuredClone(items));
          const event = this.#encoder.encode(
            `event: data\ndata: ${JSON.stringify(this.#relay(items))}\n\nevent: control\ndata: ${
              JSON.stringify({ streamNextOffset: String(this.records.length), upToDate: true })
            }\n\n`,
          );
          for (const reader of this.#readers) reader.enqueue(event);
          return new Response(null, { status: 204 });
        }
        const url = new URL(request.url);
        const offset = url.searchParams.get('offset') ?? '0';
        if (url.searchParams.get('live') !== 'sse') {
          // Durable Streams' native -1 cursor means the beginning, not Array.slice(-1).
          this.snapshotOffsets.push(offset);
          const index = offset === '-1' ? 0 : Number(offset);
          if (!Number.isSafeInteger(index) || index < 0) return new Response(null, { status: 400 });
          return Response.json(this.#relay(this.records.slice(index)), {
            headers: {
              'Stream-Next-Offset': String(this.records.length),
              'Stream-Up-To-Date': 'true',
            },
          });
        }
        this.opens++;
        this.live++;
        this.maxLive = Math.max(this.maxLive, this.live);
        this.offsets.push(offset);
        let active: ReadableStreamDefaultController<Uint8Array>;
        const body = new ReadableStream<Uint8Array>({
          start: (controller) => {
            active = controller;
            this.#readers.add(controller);
            this.#notify();
          },
          cancel: () => {
            this.#readers.delete(active);
            this.live--;
            this.cancels++;
            this.#notify();
          },
        });
        return new Response(body, { headers: { 'content-type': 'text/event-stream' } });
      },
    );
    this.target = {
      sessionId: 'published-native-replay',
      baseUrl: `http://127.0.0.1:${this.#server.addr.port}`,
    };
  }

  /** Wait on actual transport events; the timeout is a hang deadline, not a latency assertion. */
  async until(predicate: () => boolean): Promise<void> {
    if (predicate()) return;
    const deferred = Promise.withResolvers<void>();
    const notify = () => {
      if (predicate()) deferred.resolve();
    };
    this.#listeners.add(notify);
    try {
      await bounded(deferred.promise);
    } finally {
      this.#listeners.delete(notify);
    }
  }

  /** Force-close only in finally, after positive cancellation assertions have already run. */
  async close(): Promise<void> {
    for (const reader of this.#readers) {
      try {
        reader.close();
      } catch { /* A remote cancellation may already have closed it. */ }
    }
    this.#readers.clear();
    await bounded(this.#server.shutdown());
  }

  #relay(items: readonly unknown[]): readonly unknown[] {
    if (!this.#dropNative) return items;
    return items.filter((item) =>
      !isRecord(item) || item.type !== 'CUSTOM' || item.name !== 'netscript.chat.messages'
    );
  }

  #notify(): void {
    for (const notify of this.#listeners) notify();
  }
}

/** Narrow untrusted wire frames without importing private framework types. */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
}

/** Apply a finite hang deadline and always clear its timer. */
export async function bounded<T>(operation: Promise<T>): Promise<T> {
  let timer: number | undefined;
  const deadline = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => reject(new Error('Probe hang deadline exceeded')), 10_000);
  });
  try {
    return await Promise.race([operation, deadline]);
  } finally {
    clearTimeout(timer);
  }
}
