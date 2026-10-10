const RETAINED_OUTPUT_BYTES = 1024 * 1024;

/** Fixed-capacity byte ring: retain the tail without limiting total output. */
export class OutputTail {
  readonly #bytes: Uint8Array;
  #end = 0;
  #size = 0;

  constructor(totalLimit?: number) {
    this.#bytes = new Uint8Array(
      Math.min(totalLimit ?? RETAINED_OUTPUT_BYTES, RETAINED_OUTPUT_BYTES),
    );
  }

  append(bytes: Uint8Array): void {
    const capacity = this.#bytes.length;
    if (bytes.length >= capacity) {
      this.#bytes.set(bytes.subarray(bytes.length - capacity));
      this.#end = 0;
      this.#size = capacity;
      return;
    }
    const first = Math.min(bytes.length, capacity - this.#end);
    this.#bytes.set(bytes.subarray(0, first), this.#end);
    this.#bytes.set(bytes.subarray(first), 0);
    this.#end = (this.#end + bytes.length) % capacity;
    this.#size = Math.min(capacity, this.#size + bytes.length);
  }

  text(): string {
    const bytes = new Uint8Array(this.#size);
    const start = (this.#end - this.#size + this.#bytes.length) % this.#bytes.length;
    const first = Math.min(this.#size, this.#bytes.length - start);
    bytes.set(this.#bytes.subarray(start, start + first));
    bytes.set(this.#bytes.subarray(0, this.#size - first), first);
    return new TextDecoder().decode(bytes).split('\n').filter((line) => line.trim()).join('\n');
  }
}
