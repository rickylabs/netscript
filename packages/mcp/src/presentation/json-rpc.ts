import { isRecord } from '../domain/schema.ts';

/** JSON-RPC request accepted by the S1 runner. */
export interface JsonRpcRequest {
  /** JSON-RPC revision. */
  readonly jsonrpc: '2.0';
  /** Request identifier; absent for notifications. */
  readonly id?: string | number;
  /** Protocol method name. */
  readonly method: string;
  /** Object-valued request parameters. */
  readonly params?: Record<string, unknown>;
}
/** JSON-RPC error payload. */
export interface JsonRpcError {
  /** Integer JSON-RPC error code. */
  readonly code: number;
  /** Human-readable protocol error. */
  readonly message: string;
  /** Optional structured diagnostic data. */
  readonly data?: unknown;
}
/** JSON-RPC response emitted by the S1 runner. */
export interface JsonRpcResponse {
  /** JSON-RPC revision. */
  readonly jsonrpc: '2.0';
  /** Matching request identifier. */
  readonly id: string | number | null;
  /** Successful object result. */
  readonly result?: Record<string, unknown>;
  /** Structured protocol error. */
  readonly error?: JsonRpcError;
}

/** Parse protocol input without performing external effects. */
export function parseJsonRpcRequest(value: unknown): JsonRpcRequest {
  if (!isRecord(value) || value.jsonrpc !== '2.0' || typeof value.method !== 'string') {
    throw new Error('Invalid JSON-RPC 2.0 request');
  }
  if (value.id !== undefined && typeof value.id !== 'string' && typeof value.id !== 'number') {
    throw new Error('Invalid JSON-RPC request id');
  }
  if (value.params !== undefined && !isRecord(value.params)) {
    throw new Error('JSON-RPC params must be an object');
  }
  const request: JsonRpcRequest = {
    jsonrpc: '2.0',
    method: value.method,
    ...(value.id === undefined ? {} : { id: value.id }),
    ...(value.params === undefined ? {} : { params: value.params }),
  };
  return request;
}
