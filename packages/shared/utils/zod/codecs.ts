/**
 * Zod Codecs
 *
 * Bi-directional transformations for common type conversions.
 * Particularly useful for HTTP query parameters and form data.
 *
 * @see https://zod.dev/codecs
 */

import { z } from 'zod';
// Import Decimal from the browser-safe Prisma runtime to avoid pulling in the
// full server client (and its 4.8 MB WASM query compiler) into the frontend SSR bundle.
// The browser runtime exports the same Decimal class without heavy server dependencies.
import { Decimal } from 'npm:@prisma/client@^7.3.0/runtime/index-browser';

type Codec<Input, Output> = z.ZodCodec<z.ZodType<Input>, z.ZodType<Output>>;

/**
 * Converts string representations of numbers to JavaScript `number` type.
 *
 * **Use case**: HTTP query parameters, form data
 *
 * @example
 * ```ts
 * const schema = z.object({
 *   limit: stringToNumber(paginationLimit()),
 *   offset: stringToNumber(paginationOffset()),
 * });
 *
 * schema.decode({ limit: "10", offset: "0" });
 * // => { limit: 10, offset: 0 }
 * ```
 */
export function stringToNumber<T extends z.ZodNumber | z.ZodDefault<z.ZodNumber>>(
  outputSchema: T,
): z.ZodCodec<z.ZodString, T> {
  return z.codec(z.string().regex(z.regexes.number), outputSchema, {
    decode: (str) => Number.parseFloat(str) as z.input<T>,
    encode: (num) => (num ?? 0).toString(),
  });
}

/**
 * Converts string representations of integers to JavaScript `number` type.
 *
 * **Use case**: HTTP query parameters for IDs, counts, pagination
 *
 * @example
 * ```ts
 * const schema = z.object({
 *   id: stringToInt(positiveInt()),
 *   page: stringToInt(nonNegativeInt()),
 * });
 *
 * schema.decode({ id: "42", page: "1" });
 * // => { id: 42, page: 1 }
 * ```
 */
export function stringToInt<T extends z.ZodNumber | z.ZodDefault<z.ZodNumber>>(
  outputSchema: T,
): z.ZodCodec<z.ZodString, T> {
  return z.codec(z.string().regex(z.regexes.integer), outputSchema, {
    decode: (str) => Number.parseInt(str, 10) as z.input<T>,
    encode: (num) => (num ?? 0).toString(),
  });
}

/**
 * Converts string representations to JavaScript `bigint` type.
 *
 * **Use case**: Large integers beyond Number.MAX_SAFE_INTEGER
 *
 * @example
 * ```ts
 * const schema = stringToBigInt();
 * schema.decode("12345678901234567890"); // => 12345678901234567890n
 * schema.encode(12345n); // => "12345"
 * ```
 */
export const stringToBigInt: Codec<string, bigint> = z.codec(z.string(), z.bigint(), {
  decode: (str) => BigInt(str),
  encode: (bigint) => bigint.toString(),
});

/**
 * Converts JavaScript `number` to `bigint` type.
 *
 * **Use case**: Converting regular integers to bigint for database operations
 *
 * @example
 * ```ts
 * const schema = numberToBigInt();
 * schema.decode(42); // => 42n
 * schema.encode(42n); // => 42
 * ```
 */
export const numberToBigInt: Codec<number, bigint> = z.codec(z.int(), z.bigint(), {
  decode: (num) => BigInt(num),
  encode: (bigint) => Number(bigint),
});

/**
 * Converts ISO datetime strings to Temporal `Instant` values.
 *
 * **Use case**: API responses, database timestamps
 *
 * @example
 * ```ts
 * const schema = isoDatetimeToInstant();
 * schema.decode("2024-01-15T10:30:00.000Z"); // => Temporal.Instant
 * schema.encode(Temporal.Instant.from("2024-01-15T00:00:00.000Z"));
 * // => "2024-01-15T00:00:00Z"
 * ```
 */
export const isoDatetimeToInstant: Codec<string, Temporal.Instant> = z.codec(
  z.iso.datetime(),
  z.instanceof(Temporal.Instant),
  {
    decode: (isoString) => Temporal.Instant.from(isoString),
    encode: (instant) => instant.toString(),
  },
);

/**
 * Converts Unix timestamps (seconds since epoch) to Temporal `Instant` values.
 *
 * **Use case**: Unix timestamps from APIs, databases
 *
 * @example
 * ```ts
 * const schema = epochSecondsToInstant();
 * schema.decode(1705314600); // => Temporal.Instant
 * schema.encode(Temporal.Instant.from("2024-01-15T10:30:00Z"));
 * // => Unix timestamp in seconds
 * ```
 */
export const epochSecondsToInstant: Codec<number, Temporal.Instant> = z.codec(
  z.int().min(0),
  z.instanceof(Temporal.Instant),
  {
    decode: (seconds) => Temporal.Instant.fromEpochMilliseconds(seconds * 1000),
    encode: (instant) => Math.floor(instant.epochMilliseconds / 1000),
  },
);

/**
 * Converts Unix timestamps (milliseconds since epoch) to Temporal `Instant` values.
 *
 * **Use case**: JavaScript timestamps, some APIs
 *
 * @example
 * ```ts
 * const schema = epochMillisToInstant();
 * schema.decode(1705314600000); // => Temporal.Instant
 * schema.encode(Temporal.Instant.from("2024-01-15T10:30:00Z"));
 * // => Unix timestamp in milliseconds
 * ```
 */
export const epochMillisToInstant: Codec<number, Temporal.Instant> = z.codec(
  z.int().min(0),
  z.instanceof(Temporal.Instant),
  {
    decode: (millis) => Temporal.Instant.fromEpochMilliseconds(millis),
    encode: (instant) => instant.epochMilliseconds,
  },
);

/**
 * Parses JSON strings into structured data and serializes back to JSON.
 *
 * **Use case**: JSON stored in database columns, API payloads
 *
 * @example
 * ```ts
 * const schema = jsonCodec(z.object({ name: z.string(), age: z.number() }));
 * schema.decode('{"name":"Alice","age":30}'); // => { name: "Alice", age: 30 }
 * schema.encode({ name: "Bob", age: 25 }); // => '{"name":"Bob","age":25}'
 * ```
 */
export const jsonCodec = <T extends z.core.$ZodType>(schema: T): z.ZodCodec<z.ZodString, T> =>
  z.codec(z.string(), schema, {
    decode: (jsonString, ctx) => {
      try {
        return JSON.parse(jsonString);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        ctx.issues.push({
          code: 'invalid_format',
          format: 'json',
          input: jsonString,
          message,
        });
        return z.NEVER;
      }
    },
    encode: (value) => JSON.stringify(value),
  });

/**
 * Converts UTF-8 strings to `Uint8Array` byte arrays.
 *
 * **Use case**: Binary data handling, file operations
 *
 * @example
 * ```ts
 * const schema = utf8ToBytes();
 * schema.decode("Hello, 世界!"); // => Uint8Array
 * schema.encode(bytes); // => "Hello, 世界!"
 * ```
 */
export const utf8ToBytes: Codec<string, Uint8Array> = z.codec(
  z.string(),
  z.instanceof(Uint8Array),
  {
    decode: (str) => new TextEncoder().encode(str),
    encode: (bytes) => new TextDecoder().decode(bytes),
  },
);

/**
 * Converts `Uint8Array` byte arrays to UTF-8 strings.
 *
 * **Use case**: Binary data handling, file operations
 *
 * @example
 * ```ts
 * const schema = bytesToUtf8();
 * schema.decode(bytes); // => "Hello, 世界!"
 * schema.encode("Hello, 世界!"); // => Uint8Array
 * ```
 */
export const bytesToUtf8: Codec<Uint8Array, string> = z.codec(
  z.instanceof(Uint8Array),
  z.string(),
  {
    decode: (bytes) => new TextDecoder().decode(bytes),
    encode: (str) => new TextEncoder().encode(str),
  },
);

/**
 * Converts base64 strings to `Uint8Array` byte arrays and vice versa.
 *
 * **Use case**: Binary data in JSON/HTTP, file uploads
 *
 * @example
 * ```ts
 * const schema = base64ToBytes();
 * schema.decode("SGVsbG8="); // => Uint8Array([72, 101, 108, 108, 111])
 * schema.encode(bytes); // => "SGVsbG8="
 * ```
 */
export const base64ToBytes: Codec<string, Uint8Array> = z.codec(
  z.base64(),
  z.instanceof(Uint8Array),
  {
    decode: (base64String) => z.util.base64ToUint8Array(base64String),
    encode: (bytes) => z.util.uint8ArrayToBase64(bytes),
  },
);

/**
 * Converts base64url strings (URL-safe base64) to `Uint8Array` byte arrays.
 *
 * **Use case**: URL-safe binary data, JWT tokens
 *
 * @example
 * ```ts
 * const schema = base64urlToBytes();
 * schema.decode("SGVsbG8"); // => Uint8Array([72, 101, 108, 108, 111])
 * schema.encode(bytes); // => "SGVsbG8"
 * ```
 */
export const base64urlToBytes: Codec<string, Uint8Array> = z.codec(
  z.base64url(),
  z.instanceof(Uint8Array),
  {
    decode: (base64urlString) => z.util.base64urlToUint8Array(base64urlString),
    encode: (bytes) => z.util.uint8ArrayToBase64url(bytes),
  },
);

/**
 * Converts hexadecimal strings to `Uint8Array` byte arrays and vice versa.
 *
 * **Use case**: Cryptographic hashes, binary data representation
 *
 * @example
 * ```ts
 * const schema = hexToBytes();
 * schema.decode("48656c6c6f"); // => Uint8Array([72, 101, 108, 108, 111])
 * schema.encode(bytes); // => "48656c6c6f"
 * ```
 */
export const hexToBytes: Codec<string, Uint8Array> = z.codec(z.hex(), z.instanceof(Uint8Array), {
  decode: (hexString) => z.util.hexToUint8Array(hexString),
  encode: (bytes) => z.util.uint8ArrayToHex(bytes),
});

/**
 * Converts URL strings to JavaScript `URL` objects.
 *
 * **Use case**: URL validation and parsing
 *
 * @example
 * ```ts
 * const schema = stringToURL();
 * schema.decode("https://example.com/path"); // => URL object
 * schema.encode(new URL("https://example.com")); // => "https://example.com/"
 * ```
 */
export const stringToURL: Codec<string, URL> = z.codec(z.url(), z.instanceof(URL), {
  decode: (urlString) => new URL(urlString),
  encode: (url) => url.href,
});

/**
 * Converts HTTP/HTTPS URL strings to JavaScript `URL` objects.
 *
 * **Use case**: HTTP URL validation and parsing
 *
 * @example
 * ```ts
 * const schema = stringToHttpURL();
 * schema.decode("https://api.example.com/v1"); // => URL object
 * schema.encode(url); // => "https://api.example.com/v1"
 * ```
 */
export const stringToHttpURL: Codec<string, URL> = z.codec(z.httpUrl(), z.instanceof(URL), {
  decode: (urlString) => new URL(urlString),
  encode: (url) => url.href,
});

/**
 * Encodes and decodes URI components.
 *
 * **Use case**: URL parameter encoding
 *
 * @example
 * ```ts
 * const schema = uriComponent();
 * schema.decode("Hello%20World%21"); // => "Hello World!"
 * schema.encode("Hello World!"); // => "Hello%20World!"
 * ```
 */
export const uriComponent: Codec<string, string> = z.codec(z.string(), z.string(), {
  decode: (encodedString) => decodeURIComponent(encodedString),
  encode: (decodedString) => encodeURIComponent(decodedString),
});

// ============================================================================
// DECIMAL CODECS
// ============================================================================

/**
 * Duck-typing validator for Decimal-like values (Prisma.Decimal).
 * Checks for the internal structure of decimal.js objects.
 */
type DecimalLike = { d: number[]; e: number; s: number; toFixed: (dp?: number) => string };

const isDecimalLike = (
  v: unknown,
): v is DecimalLike => {
  if (v === null || v === undefined) return false;
  if (typeof v !== 'object') return false;
  const obj = v as Record<string, unknown>;
  return 'd' in obj && 'e' in obj && 's' in obj && 'toFixed' in obj &&
    typeof obj.toFixed === 'function';
};

/**
 * Zod schema for Decimal-like input values.
 * Accepts numbers, strings, or Decimal objects.
 */
const decimalInputSchema = z.union([
  z.number(),
  z.string().regex(/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/),
  z.custom<DecimalLike>(isDecimalLike),
]);

/**
 * Converts Prisma Decimal objects to JavaScript numbers for API responses.
 *
 * **Use case**: Transforming Prisma Decimal fields to JSON-serializable numbers
 *
 * @example
 * ```ts
 * const priceSchema = decimalToNumber();
 * priceSchema.decode(new Prisma.Decimal("19.99")); // => 19.99
 * priceSchema.encode(19.99); // => "19.99" (string for precision)
 * ```
 */
export const decimalToNumber: Codec<number | string | DecimalLike, number> = z.codec(
  decimalInputSchema,
  z.number(),
  {
    decode: (value) => {
      if (typeof value === 'number') return value;
      if (typeof value === 'string') return Number.parseFloat(value);
      if (isDecimalLike(value)) return Number(value.toFixed(10));
      return 0;
    },
    encode: (num) => num.toString(),
  },
);

/**
 * Type-safe helper to convert a Decimal-like value to number.
 * Use this in router handlers to transform Prisma Decimal fields.
 *
 * @example
 * ```ts
 * const order = await db.order.findUnique({ ... });
 * return {
 *   ...order,
 *   total: toNumber(order.total),
 *   items: order.items.map(item => ({
 *     ...item,
 *     price: toNumber(item.price),
 *   })),
 * };
 * ```
 */
export function toNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number.parseFloat(value);
  if (isDecimalLike(value)) return Number(value.toFixed(10));
  return 0;
}

/**
 * Type-safe helper to convert unknown values to Prisma Decimal.
 * Use this in router handlers when storing decimal values to the database.
 *
 * **Use case**: Converting API input (number/string) to Prisma Decimal for storage
 *
 * @example
 * ```ts
 * const order = await db.order.create({
 *   data: {
 *     total: toDecimal(input.total),
 *     items: {
 *       create: items.map(item => ({
 *         price: toDecimal(item.price),
 *       })),
 *     },
 *   },
 * });
 * ```
 */
export function toDecimal(value: unknown): Decimal {
  // If already a Decimal, return it
  if (isDecimalLike(value)) {
    return value as Decimal;
  }

  // Convert to number first, then to Decimal
  const numValue = toNumber(value);
  return new Decimal(numValue);
}
