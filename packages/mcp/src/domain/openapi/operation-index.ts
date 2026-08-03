/** One standard HTTP method in its canonical uppercase form. */
export type HttpMethod =
  | 'GET'
  | 'PUT'
  | 'POST'
  | 'DELETE'
  | 'OPTIONS'
  | 'HEAD'
  | 'PATCH'
  | 'TRACE';

/** Standard HTTP methods supported by OpenAPI Path Item objects. */
export const HTTP_METHODS: readonly HttpMethod[] = Object.freeze([
  'GET',
  'PUT',
  'POST',
  'DELETE',
  'OPTIONS',
  'HEAD',
  'PATCH',
  'TRACE',
]);

/** A structurally inspected JSON object from an OpenAPI document. */
export type OpenApiObject = Readonly<Record<string, unknown>>;

/** One operation discovered from an OpenAPI Paths Object. */
export interface IndexedOpenApiOperation {
  /** Stable identity: declared operation id, or the exact method-path identity. */
  readonly canonicalId: string;
  /** Declared operation id when it is a non-empty string. */
  readonly operationId?: string;
  /** Canonical uppercase HTTP method. */
  readonly method: HttpMethod;
  /** Exact path-template key from the source document. */
  readonly path: string;
  /** Exact fallback identity formatted as `METHOD /path`. */
  readonly methodPath: string;
  /** Original operation object, retained without mutation. */
  readonly operation: OpenApiObject;
}

/** Deterministic source-order index of an OpenAPI document's operations. */
export interface OpenApiOperationIndex {
  /** Original document, retained without mutation for later projections. */
  readonly document: OpenApiObject;
  /** Supported operations in path-then-method source order. */
  readonly operations: readonly IndexedOpenApiOperation[];
}

const METHOD_KEYS = new Map<string, HttpMethod>(HTTP_METHODS.map((method) => [
  method.toLowerCase(),
  method,
]));

function object(value: unknown): OpenApiObject | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as OpenApiObject
    : undefined;
}

/** Index supported operations from an OpenAPI document without performing I/O. */
export function indexOpenApiOperations(document: unknown): OpenApiOperationIndex {
  const source = object(document);
  if (!source) throw new TypeError('OpenAPI document must be an object');

  const operations: IndexedOpenApiOperation[] = [];
  const paths = object(source.paths);
  if (paths) {
    for (const [path, pathValue] of Object.entries(paths)) {
      const pathItem = object(pathValue);
      if (!pathItem) continue;
      for (const [key, operationValue] of Object.entries(pathItem)) {
        const method = METHOD_KEYS.get(key);
        const operation = object(operationValue);
        if (!method || !operation) continue;
        const methodPath = `${method} ${path}`;
        const operationId =
          typeof operation.operationId === 'string' && operation.operationId.length
            ? operation.operationId
            : undefined;
        operations.push(Object.freeze({
          canonicalId: operationId ?? methodPath,
          ...(operationId ? { operationId } : {}),
          method,
          path,
          methodPath,
          operation,
        }));
      }
    }
  }

  return Object.freeze({ document: source, operations: Object.freeze(operations) });
}
