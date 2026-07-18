import type { DesktopRpcJsonSerializer } from '../domain/types.ts';

/** Stable custom serializer type id reserved for Desktop `Uint8Array` values. */
export const DESKTOP_UINT8_ARRAY_SERIALIZER_TYPE = 32;

function isByteArray(value: unknown): value is readonly number[] {
  return Array.isArray(value) &&
    value.every((item) => Number.isInteger(item) && item >= 0 && item <= 255);
}

/** oRPC JSON-value serializer that preserves nested `Uint8Array` procedure data. */
export const DESKTOP_UINT8_ARRAY_SERIALIZER: DesktopRpcJsonSerializer = {
  type: DESKTOP_UINT8_ARRAY_SERIALIZER_TYPE,
  condition(data: unknown): boolean {
    return data instanceof Uint8Array;
  },
  serialize(data: unknown): unknown {
    if (!(data instanceof Uint8Array)) {
      throw new TypeError('Desktop Uint8Array serializer received an invalid value');
    }
    return Array.from(data);
  },
  deserialize(serialized: unknown): unknown {
    if (!isByteArray(serialized)) {
      throw new TypeError('Desktop Uint8Array serializer received invalid bytes');
    }
    return new Uint8Array(serialized);
  },
};

/** Symmetric oRPC JSON serializers required by both Desktop link and handler. */
export const DESKTOP_RPC_JSON_SERIALIZERS: readonly DesktopRpcJsonSerializer[] = [
  DESKTOP_UINT8_ARRAY_SERIALIZER,
];
