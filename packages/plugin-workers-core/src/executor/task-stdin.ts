import type { TaskStdin } from '../domain/task.ts';

const MAX_STDIN_BYTES = 1024 * 1024;
const encoder = new TextEncoder();

// NetScript policy: bound each serialization step BEFORE copying or retaining input.
export function encodeTaskStdin(payload: TaskStdin): Uint8Array {
  if (payload === undefined) throw new Error('MissingStdinPayload: expected bytes or JSON.');
  if (payload instanceof Uint8Array) {
    validateTaskStdinBytes(payload);
    return payload.slice();
  }
  let buffer = new Uint8Array(1024);
  let size = 0;
  for (const token of jsonTokens(payload, new Set(), 0)) {
    const bytes = encoder.encode(token);
    const nextSize = size + bytes.byteLength;
    if (nextSize > MAX_STDIN_BYTES) throw oversized();
    if (nextSize > buffer.byteLength) {
      const grown = new Uint8Array(
        Math.min(MAX_STDIN_BYTES, Math.max(nextSize, buffer.length * 2)),
      );
      grown.set(buffer.subarray(0, size));
      buffer = grown;
    }
    buffer.set(bytes, size);
    size = nextSize;
  }
  return buffer.subarray(0, size);
}

/** Validate already encoded input without copying or resolving precedence. */
export function validateTaskStdinBytes(bytes: Uint8Array): void {
  if (bytes.byteLength > MAX_STDIN_BYTES) throw oversized();
}

function oversized(): Error {
  return new Error('StdinPayloadTooLarge: stdin exceeds 1048576 bytes.');
}

function* stringTokens(value: string): Generator<string> {
  yield '"';
  for (let start = 0; start < value.length;) {
    let end = Math.min(start + 1024, value.length);
    const last = value.charCodeAt(end - 1);
    if (end < value.length && last >= 0xd800 && last <= 0xdbff) end--;
    yield JSON.stringify(value.slice(start, end)).slice(1, -1);
    start = end;
  }
  yield '"';
}

function* jsonTokens(value: unknown, ancestors: Set<object>, depth: number): Generator<string> {
  if (typeof value === 'string') {
    yield* stringTokens(value);
  } else if (
    value === null || typeof value === 'boolean' ||
    (typeof value === 'number' && Number.isFinite(value))
  ) {
    yield JSON.stringify(value);
  } else if (typeof value === 'object' && value !== null) {
    if (depth >= 64 || ancestors.has(value)) {
      throw new Error('InvalidStdinPayload: cyclic JSON or nesting exceeds 64 levels.');
    }
    if (
      !Array.isArray(value) && Object.getPrototypeOf(value) !== Object.prototype &&
      Object.getPrototypeOf(value) !== null
    ) {
      throw new Error('InvalidStdinPayload: expected a plain JSON object.');
    }
    ancestors.add(value);
    const array = Array.isArray(value);
    yield array ? '[' : '{';
    let first = true;
    if (array) {
      // Index descriptors avoid executing element getters or a custom iterator.
      for (let index = 0; index < value.length; index++) {
        const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
        if (!descriptor || !('value' in descriptor)) {
          throw new Error('InvalidStdinPayload: JSON array elements must be own data properties.');
        }
        if (!first) yield ',';
        first = false;
        yield* jsonTokens(descriptor.value, ancestors, depth + 1);
      }
    } else {
      for (const key in value) {
        if (!Object.hasOwn(value, key)) continue;
        if (!first) yield ',';
        first = false;
        yield* stringTokens(key);
        yield ':';
        const descriptor = Object.getOwnPropertyDescriptor(value, key);
        if (!descriptor || !('value' in descriptor)) {
          throw new Error('InvalidStdinPayload: JSON accessors are not supported.');
        }
        yield* jsonTokens(descriptor.value, ancestors, depth + 1);
      }
    }
    yield array ? ']' : '}';
    ancestors.delete(value);
  } else {
    throw new Error('InvalidStdinPayload: expected finite JSON data.');
  }
}
