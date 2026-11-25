import { isValidStreamOffset } from '@netscript/contracts/streams';
import {
  STREAM_SSE_CONTRACT_V1,
  type StreamSseControlPayloadV1,
} from '../../domain/sse-contract-v1.ts';

/** Validated atomic delivery unit emitted by the incremental SSE parser. */
export interface SseDeliveryUnit {
  /** Concatenated raw wire bytes of pending `event: data` frames plus committing `event: control`. */
  readonly bytes: Uint8Array;
  /** Validated committing control payload. */
  readonly control: StreamSseControlPayloadV1;
}

/** Step result from feeding or finishing the bounded incremental SSE parser. */
export type SseParseStep =
  | { readonly kind: 'need-more' }
  | { readonly kind: 'unit'; readonly unit: SseDeliveryUnit }
  | { readonly kind: 'eof' }
  | { readonly kind: 'error'; readonly reason: 'frame-limit-exceeded' | 'upstream-error' };

class BoundedByteBuffer {
  #buf: Uint8Array;
  #len = 0;

  constructor(initialCapacity = 256) {
    this.#buf = new Uint8Array(initialCapacity);
  }

  get length(): number {
    return this.#len;
  }

  appendByte(byte: number): void {
    if (this.#len === this.#buf.byteLength) {
      const next = new Uint8Array(Math.max(64, this.#buf.byteLength * 2));
      next.set(this.#buf);
      this.#buf = next;
    }
    this.#buf[this.#len] = byte;
    this.#len += 1;
  }

  toUint8ArrayCopy(): Uint8Array {
    return this.#buf.slice(0, this.#len);
  }

  subarrayView(): Uint8Array {
    return this.#buf.subarray(0, this.#len);
  }

  reset(): void {
    this.#len = 0;
  }
}

function concatFrames(frames: readonly Uint8Array[], trailing: Uint8Array): Uint8Array {
  let total = trailing.byteLength;
  for (const frame of frames) total += frame.byteLength;
  const combined = new Uint8Array(total);
  let offset = 0;
  for (const frame of frames) {
    combined.set(frame, offset);
    offset += frame.byteLength;
  }
  combined.set(trailing, offset);
  return combined;
}

/**
 * Bounded incremental UTF-8 WHATWG SSE delivery-unit parser.
 *
 * Enforces a single byte limit (`maxPendingBatchBytes`) across accumulated `event: data` frames
 * and the currently assembling partial block/comment/control frame BEFORE retaining additional
 * bytes. Pauses immediately upon completing one validated `(data[], control)` delivery unit so
 * a single upstream chunk containing multiple units never speculatively pre-buffers ahead of
 * pull-driven authorization checks.
 */
export class BoundedSseDeliveryUnitParser {
  readonly #maxBytes: number;
  readonly #decoder = new TextDecoder('utf-8', { fatal: true });

  #chunk: Uint8Array | null = null;
  #cursor = 0;

  #pendingDataFrames: Uint8Array[] = [];
  #pendingDataBytes = 0;

  #activeBlockBuf = new BoundedByteBuffer(512);
  #activeLineBuf = new BoundedByteBuffer(256);
  #activeBlockBytes = 0;

  #sawCr = false;
  #isFirstLine = true;

  #blockHasNonCommentField = false;
  #blockEventName: string | undefined = undefined;
  #blockDataLines: string[] = [];

  constructor(maxPendingBatchBytes: number) {
    this.#maxBytes = maxPendingBatchBytes;
  }

  /** Whether the parser has unread bytes remaining in the currently attached chunk. */
  get hasBufferedChunkBytes(): boolean {
    return this.#chunk !== null && this.#cursor < this.#chunk.byteLength;
  }

  /** Attach the next upstream chunk (only when no unread bytes remain). */
  pushChunk(chunk: Uint8Array): void {
    this.#chunk = chunk;
    this.#cursor = 0;
  }

  /** Discard all internal buffered bytes on terminal close/error. */
  clear(): void {
    this.#chunk = null;
    this.#cursor = 0;
    this.#pendingDataFrames = [];
    this.#pendingDataBytes = 0;
    this.#activeBlockBuf.reset();
    this.#activeLineBuf.reset();
    this.#activeBlockBytes = 0;
    this.#sawCr = false;
    this.#resetBlockFields();
  }

  /**
   * Advance through the attached chunk until either one complete validated delivery unit is
   * ready, an error occurs, or more upstream bytes are needed.
   */
  step(): SseParseStep {
    while (this.#chunk !== null && this.#cursor < this.#chunk.byteLength) {
      const byte = this.#chunk[this.#cursor]!;

      if (this.#sawCr) {
        if (byte === 0x0A) {
          this.#activeBlockBytes += 1;
          if (this.#pendingDataBytes + this.#activeBlockBytes > this.#maxBytes) {
            this.clear();
            return { kind: 'error', reason: 'frame-limit-exceeded' };
          }
          this.#activeBlockBuf.appendByte(0x0A);
          this.#sawCr = false;
          this.#cursor += 1;
          const result = this.#finishLine();
          if (result !== null) return result;
          continue;
        }
        // Previous CR was a standalone CR line terminator; process it without consuming `byte`.
        this.#sawCr = false;
        const result = this.#finishLine();
        if (result !== null) return result;
        continue;
      }

      this.#activeBlockBytes += 1;
      if (this.#pendingDataBytes + this.#activeBlockBytes > this.#maxBytes) {
        this.clear();
        return { kind: 'error', reason: 'frame-limit-exceeded' };
      }
      this.#activeBlockBuf.appendByte(byte);
      this.#cursor += 1;

      if (byte === 0x0D) {
        this.#sawCr = true;
        continue;
      }
      if (byte === 0x0A) {
        const result = this.#finishLine();
        if (result !== null) return result;
        continue;
      }
      this.#activeLineBuf.appendByte(byte);
    }

    if (this.#chunk !== null && this.#cursor >= this.#chunk.byteLength) {
      this.#chunk = null;
      this.#cursor = 0;
    }
    return { kind: 'need-more' };
  }

  /**
   * Handle upstream EOF. Flushes a pending trailing CR line terminator if present, then allows
   * clean EOF strictly when zero pending `data` frames and zero partial block bytes remain.
   */
  finish(): SseParseStep {
    if (this.#sawCr) {
      this.#sawCr = false;
      const result = this.#finishLine();
      if (result !== null) return result;
    }
    if (this.#pendingDataFrames.length === 0 && this.#activeBlockBytes === 0) {
      return { kind: 'eof' };
    }
    this.clear();
    return { kind: 'error', reason: 'upstream-error' };
  }

  #resetBlockFields(): void {
    this.#blockHasNonCommentField = false;
    this.#blockEventName = undefined;
    this.#blockDataLines = [];
  }

  #finishLine(): SseParseStep | null {
    const rawLine = this.#activeLineBuf.subarrayView();
    let lineBytes = rawLine;
    if (this.#isFirstLine) {
      this.#isFirstLine = false;
      if (
        lineBytes.byteLength >= 3 &&
        lineBytes[0] === 0xEF &&
        lineBytes[1] === 0xBB &&
        lineBytes[2] === 0xBF
      ) {
        lineBytes = lineBytes.subarray(3);
      }
    }

    if (lineBytes.byteLength === 0) {
      this.#activeLineBuf.reset();
      return this.#finishBlock();
    }

    let decodedLine: string;
    try {
      decodedLine = this.#decoder.decode(lineBytes);
    } catch {
      this.clear();
      return { kind: 'error', reason: 'upstream-error' };
    }
    this.#activeLineBuf.reset();

    if (decodedLine.startsWith(':')) {
      // Comment line: bytes stay accounted in activeBlockBytes until blank line discards them.
      return null;
    }

    this.#blockHasNonCommentField = true;
    const colonIndex = decodedLine.indexOf(':');
    const field = colonIndex < 0 ? decodedLine : decodedLine.slice(0, colonIndex);
    let value = colonIndex < 0 ? '' : decodedLine.slice(colonIndex + 1);
    if (value.startsWith(' ')) {
      value = value.slice(1);
    }

    if (field === 'event') {
      this.#blockEventName = value;
    } else if (field === 'data') {
      this.#blockDataLines.push(value);
    }
    return null;
  }

  #finishBlock(): SseParseStep | null {
    if (!this.#blockHasNonCommentField) {
      // Comment-only block or stray blank line: discard and reset activeBlockBytes.
      this.#activeBlockBuf.reset();
      this.#activeBlockBytes = 0;
      this.#resetBlockFields();
      return null;
    }

    const eventName = this.#blockEventName;
    if (eventName !== 'data' && eventName !== 'control') {
      this.clear();
      return { kind: 'error', reason: 'upstream-error' };
    }

    const rawBlock = this.#activeBlockBuf.toUint8ArrayCopy();
    const blockByteCount = this.#activeBlockBytes;
    const dataLines = this.#blockDataLines;

    this.#activeBlockBuf.reset();
    this.#activeBlockBytes = 0;
    this.#resetBlockFields();

    if (eventName === 'data') {
      if (dataLines.length === 0 || dataLines.join('\n').length === 0) {
        this.clear();
        return { kind: 'error', reason: 'upstream-error' };
      }
      this.#pendingDataFrames.push(rawBlock);
      this.#pendingDataBytes += blockByteCount;
      return null;
    }

    // event: control — must validate JSON + STREAM_SSE_CONTRACT_V1.schemas.control + isValidStreamOffset
    if (dataLines.length === 0) {
      this.clear();
      return { kind: 'error', reason: 'upstream-error' };
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(dataLines.join('\n'));
    } catch {
      this.clear();
      return { kind: 'error', reason: 'upstream-error' };
    }

    const validation = STREAM_SSE_CONTRACT_V1.schemas.control['~standard'].validate(parsed);
    if (!('value' in validation) || !isValidStreamOffset(validation.value.streamNextOffset)) {
      this.clear();
      return { kind: 'error', reason: 'upstream-error' };
    }

    const bytes = concatFrames(this.#pendingDataFrames, rawBlock);
    this.#pendingDataFrames = [];
    this.#pendingDataBytes = 0;
    return {
      kind: 'unit',
      unit: { bytes, control: validation.value },
    };
  }
}
