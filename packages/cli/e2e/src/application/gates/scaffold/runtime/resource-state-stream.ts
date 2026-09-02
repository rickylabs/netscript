import { resourceMatches } from './verify-listener-readiness.ts';

/** One parsed update from a resource-scoped Aspire NDJSON follower. */
export interface ResourceUpdate {
  readonly rawLine: string;
  readonly resource: Readonly<Record<string, unknown>>;
}

/** A buffered, closable subscription to one Aspire resource's state transitions. */
export interface ResourceUpdateSubscription {
  waitFor(
    predicate: (update: ResourceUpdate) => boolean,
    ceilingMs: number,
  ): Promise<ResourceUpdate>;
  close(): Promise<void>;
}

interface ResourceUpdateFollowerStatus {
  readonly success: boolean;
  readonly code: number;
}

/** Process surface injected by focused tests; production uses `Deno.ChildProcess`. */
export interface ResourceUpdateFollower {
  readonly stdout: ReadableStream<Uint8Array>;
  readonly stderr: ReadableStream<Uint8Array>;
  readonly status: Promise<ResourceUpdateFollowerStatus>;
  kill(signal?: Deno.Signal): void;
}

/** Test seam for replacing only the long-lived follower process. */
export type StartResourceUpdateFollower = (command: Deno.Command) => ResourceUpdateFollower;

/**
 * Start reading Aspire's resource-scoped transition stream before returning the subscription.
 *
 * The positional resource argument is intentional: `--follow` then emits updates for exactly one
 * resource, so consumers never need cross-resource filtering.
 */
export async function watchResourceUpdates(
  appHost: string,
  resourceName: string,
  startFollower: StartResourceUpdateFollower = (command) => command.spawn(),
): Promise<ResourceUpdateSubscription> {
  if (appHost.length === 0) throw new Error('AppHost path is required for resource observation');
  if (resourceName.length === 0) throw new Error('resource name is required for observation');

  const follower = startFollower(
    new Deno.Command('aspire', {
      args: [
        'describe',
        resourceName,
        '--follow',
        '--format',
        'Json',
        '--apphost',
        appHost,
        '--non-interactive',
        '--nologo',
      ],
      stdin: 'null',
      stdout: 'piped',
      stderr: 'piped',
    }),
  );
  const subscription = new BufferedResourceUpdateSubscription(resourceName, follower);
  await subscription.ready();
  return subscription;
}

/** Parse one documented NDJSON container shape and retain the exact source line. */
export function parseResourceUpdateLine(
  rawLine: string,
  resourceName: string,
): ResourceUpdate {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawLine);
  } catch (cause) {
    throw unrecognizedLine(rawLine, cause);
  }

  if (!isRecord(parsed)) throw unrecognizedLine(rawLine);
  const candidates = 'resources' in parsed
    ? Array.isArray(parsed.resources) && parsed.resources.every(isRecord)
      ? parsed.resources
      : undefined
    : [parsed];
  if (candidates === undefined || candidates.length !== 1) {
    throw unrecognizedLine(rawLine);
  }

  const resource = candidates[0];
  if (!resourceMatches(resource, resourceName)) throw unrecognizedLine(rawLine);
  return { rawLine, resource };
}

class BufferedResourceUpdateSubscription implements ResourceUpdateSubscription {
  readonly #resourceName: string;
  readonly #follower: ResourceUpdateFollower;
  readonly #started = Promise.withResolvers<void>();
  readonly #status: Promise<ResourceUpdateFollowerStatus>;
  readonly #stderr: Promise<string>;
  readonly #pump: Promise<void>;
  #change = Promise.withResolvers<void>();
  #updates: ResourceUpdate[] = [];
  #cursor = 0;
  #terminalError: Error | undefined;
  #closed = false;
  #exited = false;
  #waitActive = false;
  #closePromise: Promise<void> | undefined;

  constructor(resourceName: string, follower: ResourceUpdateFollower) {
    this.#resourceName = resourceName;
    this.#follower = follower;
    this.#status = follower.status.then((status) => {
      this.#exited = true;
      return status;
    });
    this.#stderr = readText(follower.stderr);
    this.#pump = this.#readUpdates();
  }

  async ready(): Promise<void> {
    await this.#started.promise;
  }

  async waitFor(
    predicate: (update: ResourceUpdate) => boolean,
    ceilingMs: number,
  ): Promise<ResourceUpdate> {
    if (!Number.isFinite(ceilingMs) || ceilingMs <= 0) {
      throw new Error('resource-update failure ceiling must be a positive number of milliseconds');
    }
    if (this.#waitActive) throw new Error('resource-update waits must be sequential');
    if (this.#closed) {
      throw new Error(`resource-update subscription for ${this.#resourceName} closed`);
    }

    this.#waitActive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_resolve, reject) => {
      timer = setTimeout(
        () =>
          reject(
            new Error(
              `Timed out after ${ceilingMs}ms waiting for a matching ${this.#resourceName} ` +
                'resource update; this is a test-failure ceiling for a hung stream, not an ' +
                'assumed Aspire transition time.',
            ),
          ),
        ceilingMs,
      );
    });

    try {
      while (true) {
        const changed = this.#change.promise;
        if (this.#terminalError) throw this.#terminalError;

        while (this.#cursor < this.#updates.length) {
          const update = this.#updates[this.#cursor];
          this.#cursor += 1;
          if (predicate(update)) return update;
        }

        if (this.#terminalError) throw this.#terminalError;
        await Promise.race([changed, timeout]);
      }
    } catch (error) {
      await this.close();
      throw error;
    } finally {
      if (timer !== undefined) clearTimeout(timer);
      this.#waitActive = false;
    }
  }

  close(): Promise<void> {
    this.#closePromise ??= this.#close();
    return this.#closePromise;
  }

  async #close(): Promise<void> {
    this.#closed = true;
    this.#notify();
    this.#terminateFollower();
    const settled = await Promise.allSettled([this.#status, this.#stderr, this.#pump]);
    const rejected = settled.find(
      (result): result is PromiseRejectedResult => result.status === 'rejected',
    );
    if (rejected && !this.#terminalError) throw rejected.reason;
  }

  async #readUpdates(): Promise<void> {
    let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
    try {
      reader = this.#follower.stdout.getReader();
      this.#started.resolve();
      const decoder = new TextDecoder();
      let pending = '';
      while (true) {
        const result = await reader.read();
        if (result.done) break;
        pending += decoder.decode(result.value, { stream: true });
        pending = this.#consumeCompleteLines(pending);
      }
      pending += decoder.decode();
      if (pending.length > 0) this.#acceptLine(stripCarriageReturn(pending));

      if (!this.#closed && !this.#terminalError) {
        const [status, stderr] = await Promise.all([this.#status, this.#stderr]);
        this.#fail(
          new Error(
            `Aspire resource follower for ${this.#resourceName} exited ${status.code} before ` +
              `close${stderr.length === 0 ? '' : `: ${stderr}`}`,
          ),
          false,
        );
      }
    } catch (error) {
      this.#started.reject(error);
      this.#fail(asError(error), true);
    } finally {
      reader?.releaseLock();
    }
  }

  #consumeCompleteLines(text: string): string {
    let remainder = text;
    while (true) {
      const newline = remainder.indexOf('\n');
      if (newline < 0) return remainder;
      const rawLine = stripCarriageReturn(remainder.slice(0, newline));
      remainder = remainder.slice(newline + 1);
      this.#acceptLine(rawLine);
    }
  }

  #acceptLine(rawLine: string): void {
    this.#updates.push(parseResourceUpdateLine(rawLine, this.#resourceName));
    this.#notify();
  }

  #fail(error: Error, terminate: boolean): void {
    if (this.#terminalError) return;
    this.#terminalError = error;
    if (terminate) this.#terminateFollower();
    this.#notify();
  }

  #terminateFollower(): void {
    if (this.#exited) return;
    try {
      this.#follower.kill('SIGTERM');
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) throw error;
    }
  }

  #notify(): void {
    this.#change.resolve();
    this.#change = Promise.withResolvers<void>();
  }
}

function unrecognizedLine(rawLine: string, cause?: unknown): Error {
  return new Error(
    `Unrecognized Aspire resource update line; raw line: ${rawLine}`,
    cause === undefined ? undefined : { cause },
  );
}

function stripCarriageReturn(line: string): string {
  return line.endsWith('\r') ? line.slice(0, -1) : line;
}

async function readText(stream: ReadableStream<Uint8Array>): Promise<string> {
  const decoder = new TextDecoder();
  let text = '';
  for await (const chunk of stream) text += decoder.decode(chunk, { stream: true });
  return `${text}${decoder.decode()}`.trim();
}

function asError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
