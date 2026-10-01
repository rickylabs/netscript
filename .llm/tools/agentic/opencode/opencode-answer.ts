/** Output presence is a prerequisite for an evaluator verdict, never a verdict itself. */
export const OPENCODE_OUTPUT_FAILURE_EXIT_CODE = 3;
export type OpenCodeOutputFailure = 'empty-answer' | 'output-malformed' | 'output-incomplete';

interface OutputOptions {
  readonly capture: boolean;
  readonly format: 'default' | 'json';
  readonly writeStdout: (bytes: Uint8Array) => Promise<number>;
  readonly drainTimeoutMs?: number;
}

/** Bounded JSON framing; lifecycle/tool/reasoning events do not establish an answer. */
class AnswerObserver {
  readonly #format: OutputOptions['format'];
  #buffer = '';
  #dropping = false;
  hasAnswer = false;
  malformed = false;
  constructor(format: OutputOptions['format']) {
    this.#format = format;
  }
  add(text: string): void {
    if (this.#format === 'default') {
      this.hasAnswer ||= text.trim().length > 0;
      return;
    }
    for (const [index, part] of text.split('\n').entries()) {
      if (index > 0) {
        if (!this.#dropping) this.#line(this.#buffer);
        this.#buffer = '';
        this.#dropping = false;
      }
      if (this.#dropping) continue;
      this.#buffer += part;
      if (this.#buffer.length > 1024 * 1024) {
        this.malformed = true;
        this.#buffer = '';
        this.#dropping = true;
      }
    }
  }
  finish(): void {
    if (this.#format === 'json' && this.#buffer && !this.#dropping) this.#line(this.#buffer);
  }
  #line(line: string): void {
    if (!line.trim()) return;
    let value: unknown;
    try {
      value = JSON.parse(line);
    } catch {
      this.malformed = true;
      return;
    }
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      this.malformed = true;
      return;
    }
    const event = value as Record<string, unknown>;
    const part = event.part;
    if (event.type !== 'text' || typeof part !== 'object' || part === null || Array.isArray(part)) {
      return;
    }
    const answer = part as Record<string, unknown>;
    if (answer.type === 'text' && typeof answer.text === 'string' && answer.text.trim()) {
      this.hasAnswer = true;
    }
  }
}

/** Drain while running, then cancel a pipe that remains open after its parent exits. */
export async function readOpenCodeOutput(
  child: {
    readonly stdout: ReadableStream<Uint8Array>;
    readonly status: Promise<Pick<Deno.CommandStatus, 'code'>>;
  },
  options: OutputOptions,
): Promise<
  { readonly code: number; readonly stdout?: string; readonly failure?: OpenCodeOutputFailure }
> {
  const reader = child.stdout.getReader();
  const observer = new AnswerObserver(options.format);
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let captured = '';
  let incomplete = false;
  let finished = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = child.status.then(() =>
    new Promise<null>((resolve) => {
      if (finished) {
        resolve(null);
        return;
      }
      timer = setTimeout(() => resolve(null), options.drainTimeoutMs ?? 1000);
    })
  );
  try {
    for (;;) {
      const next = await Promise.race([reader.read(), deadline]);
      if (next === null) {
        incomplete = true;
        await reader.cancel();
        break;
      }
      if (next.done) break;
      try {
        const text = decoder.decode(next.value, { stream: true });
        observer.add(text);
        if (options.capture) captured += text;
      } catch {
        observer.malformed = true;
      }
      if (!options.capture) {
        let offset = 0;
        while (offset < next.value.length) {
          const count = await options.writeStdout(next.value.subarray(offset));
          if (!Number.isInteger(count) || count < 1 || count > next.value.length - offset) {
            throw new Error('stdout write failed');
          }
          offset += count;
        }
      }
    }
    try {
      const tail = decoder.decode();
      observer.add(tail);
      if (options.capture) captured += tail;
    } catch {
      observer.malformed = true;
    }
    observer.finish();
  } catch {
    incomplete = true;
    await reader.cancel().catch(() => {});
  } finally {
    finished = true;
    if (timer !== undefined) clearTimeout(timer);
    reader.releaseLock();
  }
  const status = await child.status;
  const failure: OpenCodeOutputFailure | undefined = incomplete
    ? 'output-incomplete'
    : observer.malformed
    ? 'output-malformed'
    : !observer.hasAnswer
    ? 'empty-answer'
    : undefined;
  return {
    code: status.code === 0 && failure ? OPENCODE_OUTPUT_FAILURE_EXIT_CODE : status.code,
    ...(options.capture ? { stdout: captured } : {}),
    ...(status.code === 0 && failure ? { failure } : {}),
  };
}
