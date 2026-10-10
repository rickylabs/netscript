const RETAINED_OUTPUT_BYTES = 1024 * 1024;
const decoder = new TextDecoder();

/** Growing byte ring: retain a bounded tail without limiting total output. */
export class OutputTail {
  readonly #limit: number;
  #bytes = new Uint8Array(0);
  #end = 0;
  #size = 0;

  constructor(totalLimit?: number) {
    this.#limit = Math.min(totalLimit ?? RETAINED_OUTPUT_BYTES, RETAINED_OUTPUT_BYTES);
  }

  append(bytes: Uint8Array): void {
    if (bytes.length === 0) return;
    this.#reserve(Math.min(this.#limit, this.#size + bytes.length));
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

  #reserve(size: number): void {
    if (size <= this.#bytes.length) return;
    const grown = new Uint8Array(
      Math.min(this.#limit, Math.max(1024, size, this.#bytes.length * 2)),
    );
    if (this.#size) {
      const start = (this.#end - this.#size + this.#bytes.length) % this.#bytes.length;
      const first = Math.min(this.#size, this.#bytes.length - start);
      grown.set(this.#bytes.subarray(start, start + first));
      grown.set(this.#bytes.subarray(0, this.#size - first), first);
    }
    this.#bytes = grown;
    this.#end = this.#size % grown.length;
  }

  text(): string {
    if (!this.#size) return '';
    const bytes = new Uint8Array(this.#size);
    const start = (this.#end - this.#size + this.#bytes.length) % this.#bytes.length;
    const first = Math.min(this.#size, this.#bytes.length - start);
    bytes.set(this.#bytes.subarray(start, start + first));
    bytes.set(this.#bytes.subarray(0, this.#size - first), first);
    let boundary = 0;
    while (boundary < bytes.length && (bytes[boundary] & 0xc0) === 0x80) boundary++;
    return decoder.decode(bytes.subarray(boundary)).split('\n')
      .filter((line) => line.trim()).join('\n');
  }
}
