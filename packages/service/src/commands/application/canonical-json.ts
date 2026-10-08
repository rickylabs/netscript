import type { CommandJsonLimits } from '../domain/codec.ts';
import type { CommandJson } from '../domain/values.ts';

const CANONICAL_PROTOCOL = 'jcs-v1';
const DEFAULT_LIMITS = Object.freeze({ depth: 64, items: 10_000, bytes: 1_048_576 });
type Bounds = Readonly<{ depth: number; items: number; bytes: number }>;

function limits(options: CommandJsonLimits = {}): Bounds {
  const result = {
    depth: options.depth ?? DEFAULT_LIMITS.depth,
    items: options.items ?? DEFAULT_LIMITS.items,
    bytes: options.bytes ?? DEFAULT_LIMITS.bytes,
  };
  const names: readonly (keyof Bounds)[] = ['depth', 'items', 'bytes'];
  for (const key of names) {
    if (
      !Number.isSafeInteger(result[key]) || result[key] < 1 || result[key] > DEFAULT_LIMITS[key]
    ) {
      throw new TypeError('[netscript.command.codec] limits may only tighten protocol safeguards');
    }
  }
  return result;
}

function invalid(): never {
  throw new TypeError(`[netscript.command.codec] invalid or oversized ${CANONICAL_PROTOCOL} data`);
}

// Count before encoding/escaping so large strings cannot allocate an oversized encoded token.
function stringBytes(value: string, quoted: boolean): number {
  if (!value.isWellFormed()) invalid();
  let bytes = quoted ? 2 : 0;
  for (let index = 0; index < value.length; index++) {
    const code = value.charCodeAt(index);
    if (quoted && (code === 34 || code === 92 || [8, 9, 10, 12, 13].includes(code))) bytes += 2;
    else if (quoted && code < 32) bytes += 6;
    else if (code < 128) bytes++;
    else if (code < 2048) bytes += 2;
    else if (code >= 0xd800 && code <= 0xdbff) {
      bytes += 4;
      index++;
    } else bytes += 3;
  }
  return bytes;
}

function serialize(value: unknown, bounds: Bounds): Readonly<{ value: CommandJson; text: string }> {
  const active = new WeakSet<object>();
  const chunks: string[] = [];
  let items = 0;
  let bytes = 0;
  function append(token: string, size = token.length): void {
    bytes += size;
    if (bytes > bounds.bytes) invalid();
    chunks.push(token);
  }
  function appendString(text: string): void {
    if (text.length > bounds.bytes - bytes) invalid();
    const size = stringBytes(text, true);
    if (size > bounds.bytes - bytes) invalid();
    append(JSON.stringify(text), size);
  }
  function visit(current: unknown, depth: number): CommandJson {
    if (++items > bounds.items) invalid();
    if (current === null || typeof current === 'boolean') {
      append(JSON.stringify(current));
      return current;
    }
    if (typeof current === 'number') {
      if (!Number.isFinite(current)) invalid();
      append(JSON.stringify(current));
      return current;
    }
    if (typeof current === 'string') {
      appendString(current);
      return current;
    }
    if (typeof current !== 'object' || depth >= bounds.depth || active.has(current)) invalid();
    const prototype: unknown = Object.getPrototypeOf(current);
    const array = Array.isArray(current);
    if (
      array ? prototype !== Array.prototype : prototype !== Object.prototype && prototype !== null
    ) invalid();
    if (array && Array.isArray(current) && current.length > bounds.items - items) invalid();
    const keys = Reflect.ownKeys(current);
    if (keys.some((key) => typeof key !== 'string')) invalid();
    active.add(current);
    if (array && Array.isArray(current)) {
      if (current.length > bounds.items - items || keys.length !== current.length + 1) invalid();
      const result: CommandJson[] = [];
      append('[');
      for (let index = 0; index < current.length; index++) {
        const descriptor = Object.getOwnPropertyDescriptor(current, String(index));
        if (!descriptor || !descriptor.enumerable || !('value' in descriptor)) invalid();
        const child: unknown = descriptor.value;
        if (index > 0) append(',');
        result.push(visit(child, depth + 1));
      }
      append(']');
      active.delete(current);
      return Object.freeze(result);
    }
    if (keys.length * 2 > bounds.items - items) invalid();
    const names: string[] = [];
    for (const key of keys) {
      if (typeof key !== 'string') invalid();
      names.push(key);
    }
    // UTF-16 lexical ordering, including integer-like names; never stringify a sorted object.
    names.sort();
    const result: { [key: string]: CommandJson } = {};
    append('{');
    for (let index = 0; index < names.length; index++) {
      const key = names[index];
      const descriptor = Object.getOwnPropertyDescriptor(current, key);
      if (!descriptor || !descriptor.enumerable || !('value' in descriptor)) invalid();
      const child: unknown = descriptor.value;
      if (++items > bounds.items) invalid();
      if (index > 0) append(',');
      appendString(key);
      append(':');
      const cloned = visit(child, depth + 1);
      Object.defineProperty(result, key, { value: cloned, enumerable: true });
    }
    append('}');
    active.delete(current);
    return Object.freeze(result);
  }
  const cloned = visit(value, 0);
  return { value: cloned, text: chunks.join('') };
}

// Bound nesting and token counts before JSON.parse, while ignoring braces inside strings.
function preflight(text: string, bounds: Bounds): void {
  if (text.length > bounds.bytes || stringBytes(text, false) > bounds.bytes) invalid();
  let depth = 0;
  let items = 0;
  let inString = false;
  let escaped = false;
  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '{' || char === '[') {
      if (++depth > bounds.depth) invalid();
      items++;
    } else if (char === '}' || char === ']') depth--;
    else if (char === '"') {
      inString = true;
      items++;
    } else if (char !== ':' && char !== ',' && !/\s/.test(char)) {
      items++;
      while (index + 1 < text.length && !/[\s,\]}:]/.test(text[index + 1])) index++;
    }
    if (items > bounds.items) invalid();
  }
}

/**
 * Serialize bounded I-JSON using RFC 8785 numeric/string rules and UTF-16 key order.
 *
 * @example
 * ```ts
 * import { canonicalCommandJson } from '@netscript/service/commands';
 * canonicalCommandJson({ b: 2, a: 1 }); // '{"a":1,"b":2}'
 * ```
 */
export function canonicalCommandJson(value: unknown, options?: CommandJsonLimits): string {
  return serialize(value, limits(options)).text;
}

/**
 * Parse bounded stored text only when it round-trips byte-for-byte as canonical I-JSON.
 *
 * @example
 * ```ts
 * import { parseCanonicalCommandJson } from '@netscript/service/commands';
 * const value = parseCanonicalCommandJson('{"a":1}');
 * ```
 */
export function parseCanonicalCommandJson(text: string, options?: CommandJsonLimits): CommandJson {
  const bounds = limits(options);
  preflight(text, bounds);
  const parsed: unknown = JSON.parse(text);
  const result = serialize(parsed, bounds);
  if (result.text !== text) invalid();
  return result.value;
}

/** Produce a bounded, deeply frozen I-JSON snapshot for a codec boundary. */
export function validatedCommandJson(value: unknown, options?: CommandJsonLimits): CommandJson {
  return serialize(value, limits(options)).value;
}
