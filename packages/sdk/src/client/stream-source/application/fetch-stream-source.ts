import type {
  StreamSourceEventV1,
  StreamSourceListenerV1,
} from '@netscript/plugin-streams-core/sse';
import type {
  FetchStreamEventSourceOptionsV1,
  FetchStreamEventSourceV1,
  FetchStreamHttpErrorInfoV1,
  StreamFetchResponseV1,
} from '../ports/fetch-stream-source.ts';
import {
  createHeartbeatDeadline,
  readSseConnection,
  untilAborted,
} from '../internal/connection.ts';
import { StreamReplayBuffer, type StreamReplayProgress } from '../internal/replay-buffer.ts';
import type { StreamSourceSettings } from '../internal/settings.ts';

/** Instance-owned lifecycle: connecting/reading, waiting, and permanently closed. */
export class FetchStreamSource implements FetchStreamEventSourceV1 {
  readonly done: Promise<void>;
  private readonly lifetime = new AbortController();
  private readonly listeners = new Map<string, Set<StreamSourceListenerV1>>();
  private readonly progress: StreamReplayProgress;
  private baseDelay: number;
  private delay: number;
  private _readyState: 0 | 1 | 2 = 0;
  private fatalFailure = false;
  private readonly onAbort = (): void => this.close();

  constructor(
    private readonly options: FetchStreamEventSourceOptionsV1,
    private readonly settings: StreamSourceSettings,
  ) {
    const url = new URL(options.url);
    url.searchParams.set('live', 'sse');
    this.progress = { url, lastEventId: options.lastEventId ?? '' };
    this.baseDelay = this.delay = settings.initialDelay;
    options.signal?.addEventListener('abort', this.onAbort, { once: true });
    if (options.signal?.aborted) this.close();
    this.done = this.run().finally(() => {
      options.signal?.removeEventListener('abort', this.onAbort);
      this.close();
    });
    void this.done.catch(() => {});
  }

  get readyState(): 0 | 1 | 2 {
    return this._readyState;
  }

  close(): void {
    this._readyState = 2;
    this.lifetime.abort();
    this.listeners.clear();
  }

  addEventListener(type: string, listener: StreamSourceListenerV1): void {
    if (this._readyState === 2 || this.lifetime.signal.aborted) return;
    const registered = this.listeners.get(type) ?? new Set<StreamSourceListenerV1>();
    registered.add(listener);
    this.listeners.set(type, registered);
  }

  removeEventListener(type: string, listener: StreamSourceListenerV1): void {
    const registered = this.listeners.get(type);
    registered?.delete(listener);
    if (registered?.size === 0) this.listeners.delete(type);
  }

  private markOpen(): void {
    if (this._readyState !== 2 && !this.lifetime.signal.aborted) {
      this._readyState = 1;
    }
  }

  private markConnecting(): void {
    if (this._readyState !== 2 && !this.lifetime.signal.aborted) {
      this._readyState = 0;
    }
  }

  private emit(event: StreamSourceEventV1): void {
    for (const listener of [...this.listeners.get(event.type) ?? []]) {
      if (this.lifetime.signal.aborted) break;
      try {
        listener(event);
      } catch (error) {
        this.fatalFailure = true;
        this.close();
        throw error;
      }
    }
  }

  private async request(signal: AbortSignal): Promise<StreamFetchResponseV1> {
    const auth = this.options.authHeaders
      ? await untilAborted(Promise.resolve(this.options.authHeaders(signal)), signal)
      : undefined;
    signal.throwIfAborted();
    const headers = new Headers(auth);
    headers.set('accept', 'text/event-stream');
    headers.delete('last-event-id');
    if (this.progress.lastEventId) headers.set('last-event-id', this.progress.lastEventId);
    const request = this.options.fetch(this.progress.url.href, {
      headers,
      signal,
      cache: 'no-store',
    });
    return await untilAborted(
      request.then((response) => {
        if (signal.aborted) void response.body?.cancel().catch(() => {});
        return response;
      }),
      signal,
    );
  }

  private async handleNonOkResponse(response: StreamFetchResponseV1): Promise<void> {
    await response.body?.cancel().catch(() => {});
    if (this.lifetime.signal.aborted) return;

    const retryAfter = response.headers.get('retry-after') ?? undefined;
    const terminal = this.settings.terminalStatuses.has(response.status);
    const info: FetchStreamHttpErrorInfoV1 = {
      status: response.status,
      ...(retryAfter !== undefined ? { retryAfter } : {}),
      terminal,
      ...(this.progress.lastCommittedOffset !== undefined
        ? { lastCommittedOffset: this.progress.lastCommittedOffset }
        : {}),
    };

    if (terminal) {
      // Transition readyState to CLOSED (2) BEFORE invoking onHttpError and dispatching
      // `{ type: 'error' }` so bindStreamEventSourceV1 observes readyState === 2 (`retryable: false`),
      // then clear listeners and abort lifetime cleanly so zero reconnects occur.
      this._readyState = 2;
      try {
        if (this.options.onHttpError) {
          try {
            this.options.onHttpError(info);
          } catch (error) {
            this.fatalFailure = true;
            throw error;
          }
        }
        if (!this.lifetime.signal.aborted) {
          this.emit({ type: 'error' });
        }
      } finally {
        this.close();
      }
      return;
    }

    this.markConnecting();
    if (this.options.onHttpError) {
      try {
        this.options.onHttpError(info);
      } catch (error) {
        this.fatalFailure = true;
        this.close();
        throw error;
      }
    }
    if (this.lifetime.signal.aborted) return;
    throw new Error(
      `Expected a successful streaming text/event-stream response (HTTP ${response.status})`,
    );
  }

  private async connect(): Promise<void> {
    const controller = new AbortController();
    const abort = (): void => controller.abort(this.lifetime.signal.reason);
    this.lifetime.signal.addEventListener('abort', abort, { once: true });
    const deadline = createHeartbeatDeadline(
      this.settings.scheduler,
      this.settings.heartbeatMs,
      controller,
    );
    const replay = new StreamReplayBuffer(
      this.progress,
      this.settings,
      controller.signal,
      (event) => this.emit(event),
      (terminal) => {
        this.delay = this.baseDelay;
        if (terminal) this.close();
      },
    );
    try {
      deadline.touch();
      const response = await this.request(controller.signal);
      if (response.status === 204) {
        await response.body?.cancel().catch(() => {});
        this.close();
        return;
      }
      if (!response.ok) {
        await this.handleNonOkResponse(response);
        return;
      }
      await readSseConnection({
        response,
        signal: controller.signal,
        bufferLimit: this.settings.bufferSize,
        lastEventId: this.progress.lastEventId,
        onOpen: () => this.markOpen(),
        onBytes: () => deadline.touch(),
        onBlock: (block) => replay.receive(block),
        onRetry: (retry) => {
          if (!Number.isNaN(retry) && retry >= 0) {
            this.baseDelay = this.delay = Math.min(
              Math.max(this.settings.initialDelay, retry),
              this.settings.cap,
            );
          }
        },
      });
    } finally {
      deadline.dispose();
      this.lifetime.signal.removeEventListener('abort', abort);
      controller.abort();
      this.markConnecting();
    }
  }

  private async wait(): Promise<void> {
    let cancel: () => void = () => {};
    const wait = new Promise<void>((resolve) => {
      cancel = this.settings.scheduler.schedule(resolve, this.delay);
    });
    try {
      await untilAborted(wait, this.lifetime.signal);
    } finally {
      cancel();
    }
    this.delay = Math.min(this.delay * 2, this.settings.cap);
  }

  private async run(): Promise<void> {
    await Promise.resolve(); // Let callers synchronously attach the existing binding.
    while (!this.lifetime.signal.aborted) {
      try {
        await this.connect();
      } catch (error) {
        if (this.fatalFailure) throw error;
        if (this.lifetime.signal.aborted) {
          if (!this.options.signal?.aborted && error !== this.lifetime.signal.reason) throw error;
          break;
        }
      }
      if (this.lifetime.signal.aborted) break;
      this.markConnecting();
      this.emit({ type: 'error' });
      if (this.lifetime.signal.aborted) break;
      try {
        await this.wait();
      } catch {
        break;
      }
    }
  }
}
