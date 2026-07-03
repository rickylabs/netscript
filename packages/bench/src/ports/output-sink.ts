/**
 * OutputSink port: where reporters write their rendered bytes. Abstracts stdout
 * vs. a file vs. an in-memory buffer so reporter output is unit-testable.
 *
 * @module
 */

/** A destination for reporter output. */
export interface OutputSink {
  /** Append a chunk of text to the sink. */
  write(chunk: string): Promise<void>;
}

/** In-memory sink capturing all writes; used by reporter round-trip tests. */
export class BufferSink implements OutputSink {
  #chunks: string[] = [];

  write(chunk: string): Promise<void> {
    this.#chunks.push(chunk);
    return Promise.resolve();
  }

  /** All written text concatenated. */
  toString(): string {
    return this.#chunks.join('');
  }
}
