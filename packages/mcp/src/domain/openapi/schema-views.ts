import type { IndexedOpenApiOperation, OpenApiObject } from './operation-index.ts';

/** Closed set of OpenAPI schema projections exposed by the domain module. */
export type SchemaViewName = 'request' | 'response' | 'errors' | 'all';

/** Supported schema-view names in stable display order. */
export const SCHEMA_VIEW_NAMES: readonly SchemaViewName[] = Object.freeze([
  'request',
  'response',
  'errors',
  'all',
]);

/** One projected OpenAPI parameter. */
export interface ProjectedParameter {
  /** Parameter name when declared. */
  readonly name?: string;
  /** OpenAPI parameter location when declared. */
  readonly location?: string;
  /** Whether the parameter is required. */
  readonly required: boolean;
  /** Human-readable parameter description when declared. */
  readonly description?: string;
  /** Expanded parameter schema when declared. */
  readonly schema?: unknown;
  /** Unresolved or external parameter reference when expansion was impossible. */
  readonly ref?: string;
}

/** Projected request-body content. */
export interface ProjectedRequestBody {
  /** Whether the body is required. */
  readonly required: boolean;
  /** Media type to expanded JSON Schema. */
  readonly content: Readonly<Record<string, unknown>>;
  /** Unresolved or external request-body reference when expansion was impossible. */
  readonly ref?: string;
}

/** Request schema view with merged path/operation parameters and body content. */
export interface RequestSchemaView {
  /** Path Item parameters followed by operation parameters, with operation duplicates winning. */
  readonly parameters: readonly ProjectedParameter[];
  /** Request body when the operation declares one. */
  readonly body?: ProjectedRequestBody;
}

/** One declared response projected to its description and media schemas. */
export interface ProjectedResponse {
  /** Human-readable response description when declared. */
  readonly description?: string;
  /** Media type to expanded JSON Schema. */
  readonly content: Readonly<Record<string, unknown>>;
  /** Unresolved or external response reference when expansion was impossible. */
  readonly ref?: string;
}

/** Exact declared 2xx response map. */
export type ResponseSchemaView = Readonly<Record<string, ProjectedResponse>>;

/** One detected family of byte-identical, non-empty error responses. */
export interface CommonErrorResponse {
  /** Original declared response codes retained in source order. */
  readonly statuses: readonly string[];
  /** Response rendered once for all retained status codes. */
  readonly response: ProjectedResponse;
}

/**
 * Exact declared non-2xx/default response map.
 *
 * When repeated non-empty responses are byte-identical, the reserved `common` key contains compact
 * groups. With no declared errors this value is exactly `{}`.
 */
export type ErrorSchemaView = Readonly<
  Record<string, ProjectedResponse | readonly CommonErrorResponse[]>
>;

/** Combined request, success-response, and error projections. */
export interface OperationSchemaAllView {
  /** Request projection. */
  readonly request: RequestSchemaView;
  /** Declared success responses. */
  readonly response: ResponseSchemaView;
  /** Declared error responses. */
  readonly errors: ErrorSchemaView;
}

/** Every independently selectable schema view for one operation. */
export interface OperationSchemaViews extends OperationSchemaAllView {
  /** Combined view containing request, response, and errors. */
  readonly all: OperationSchemaAllView;
}

const MAX_LOCAL_REF_DEPTH = 12;
function object(value: unknown): OpenApiObject | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as OpenApiObject
    : undefined;
}
function pointerTarget(document: OpenApiObject, ref: string): unknown {
  if (!ref.startsWith('#/')) return undefined;
  let current: unknown = document;
  for (const rawSegment of ref.slice(2).split('/')) {
    let segment: string;
    try {
      segment = decodeURIComponent(rawSegment).replace(/~1/g, '/').replace(/~0/g, '~');
    } catch {
      return undefined;
    }
    const container = object(current);
    if (!container || !Object.hasOwn(container, segment)) return undefined;
    current = container[segment];
  }
  return current;
}
function expandRefs(
  value: unknown,
  document: OpenApiObject,
  depth = 0,
  active: ReadonlySet<string> = new Set(),
): unknown {
  if (Array.isArray(value)) {
    return Object.freeze(value.map((entry) => expandRefs(entry, document, depth, active)));
  }
  const source = object(value);
  if (!source) return value;

  const ref = typeof source.$ref === 'string' ? source.$ref : undefined;
  if (ref?.startsWith('#/') && depth < MAX_LOCAL_REF_DEPTH && !active.has(ref)) {
    const target = pointerTarget(document, ref);
    if (target !== undefined) {
      const nextActive = new Set(active);
      nextActive.add(ref);
      const expanded = expandRefs(target, document, depth + 1, nextActive);
      const expandedObject = object(expanded);
      const siblings = Object.fromEntries(
        Object.entries(source).filter(([key]) => key !== '$ref').map(([key, entry]) => [
          key,
          expandRefs(entry, document, depth, active),
        ]),
      );
      if (expandedObject) return Object.freeze({ ...expandedObject, ...siblings });
      if (Object.keys(siblings).length === 0) return expanded;
    }
  }

  return Object.freeze(Object.fromEntries(
    Object.entries(source).map(([key, entry]) => [key, expandRefs(entry, document, depth, active)]),
  ));
}
function projectContent(value: unknown): Readonly<Record<string, unknown>> {
  const content = object(value);
  if (!content) return Object.freeze({});
  return Object.freeze(Object.fromEntries(
    Object.entries(content).map(([mediaType, mediaValue]) => {
      const media = object(mediaValue);
      const schema = media && Object.hasOwn(media, 'schema') ? media.schema : {};
      return [mediaType, schema];
    }),
  ));
}
function projectParameter(value: unknown, document: OpenApiObject): ProjectedParameter | undefined {
  const expanded = object(expandRefs(value, document));
  if (!expanded) return undefined;
  const ref = typeof expanded.$ref === 'string' ? expanded.$ref : undefined;
  const name = typeof expanded.name === 'string' ? expanded.name : undefined;
  const location = typeof expanded.in === 'string' ? expanded.in : undefined;
  if (!ref && (!name || !location)) return undefined;
  return Object.freeze({
    ...(name ? { name } : {}),
    ...(location ? { location } : {}),
    required: expanded.required === true,
    ...(typeof expanded.description === 'string' ? { description: expanded.description } : {}),
    ...(Object.hasOwn(expanded, 'schema') ? { schema: expanded.schema } : {}),
    ...(ref ? { ref } : {}),
  });
}

function parameterKey(parameter: ProjectedParameter, index: number): string {
  return parameter.name && parameter.location
    ? `${parameter.location}\u0000${parameter.name}`
    : `ref\u0000${parameter.ref ?? index}`;
}

function parameters(value: unknown, document: OpenApiObject): readonly ProjectedParameter[] {
  if (!Array.isArray(value)) return Object.freeze([]);
  return Object.freeze(
    value.map((entry) => projectParameter(entry, document)).filter(
      (entry): entry is ProjectedParameter => entry !== undefined,
    ),
  );
}

function requestView(
  document: OpenApiObject,
  operation: IndexedOpenApiOperation,
): RequestSchemaView {
  const paths = object(document.paths);
  const pathItem = object(paths?.[operation.path]);
  const merged = new Map<string, ProjectedParameter>();
  for (const [index, parameter] of parameters(pathItem?.parameters, document).entries()) {
    merged.set(parameterKey(parameter, index), parameter);
  }
  for (const [index, parameter] of parameters(operation.operation.parameters, document).entries()) {
    merged.set(parameterKey(parameter, index), parameter);
  }

  const requestBody = object(expandRefs(operation.operation.requestBody, document));
  const body: ProjectedRequestBody | undefined = requestBody
    ? Object.freeze({
      required: requestBody.required === true,
      content: projectContent(requestBody.content),
      ...(typeof requestBody.$ref === 'string' ? { ref: requestBody.$ref } : {}),
    })
    : undefined;
  return Object.freeze({
    parameters: Object.freeze([...merged.values()]),
    ...(body ? { body } : {}),
  });
}

function projectResponse(value: unknown, document: OpenApiObject): ProjectedResponse | undefined {
  const response = object(expandRefs(value, document));
  if (!response) return undefined;
  return Object.freeze({
    ...(typeof response.description === 'string' ? { description: response.description } : {}),
    content: projectContent(response.content),
    ...(typeof response.$ref === 'string' ? { ref: response.$ref } : {}),
  });
}

function responseEntries(
  document: OpenApiObject,
  operation: IndexedOpenApiOperation,
): readonly (readonly [string, ProjectedResponse])[] {
  const responses = object(operation.operation.responses);
  if (!responses) return Object.freeze([]);
  return Object.freeze(
    Object.entries(responses).flatMap(([status, value]) => {
      const projected = projectResponse(value, document);
      return projected ? [[status, projected] as const] : [];
    }),
  );
}

function isSuccess(status: string): boolean {
  return /^2(?:\d{2}|XX)$/i.test(status);
}

function hasSchemaContent(response: ProjectedResponse): boolean {
  return Object.values(response.content).some((schema) => JSON.stringify(schema) !== '{}');
}

function errorView(
  entries: readonly (readonly [string, ProjectedResponse])[],
): ErrorSchemaView {
  const errors = entries.filter(([status]) => !isSuccess(status));
  if (errors.length === 0) return Object.freeze({});

  const groups = new Map<string, Array<readonly [string, ProjectedResponse]>>();
  for (const entry of errors) {
    if (!hasSchemaContent(entry[1])) continue;
    const signature = JSON.stringify(entry[1]);
    const group = groups.get(signature) ?? [];
    group.push(entry);
    groups.set(signature, group);
  }
  const repeated = [...groups.values()].filter((group) => group.length > 1);
  const compacted = new Set(repeated.flatMap((group) => group.map(([status]) => status)));
  const result: Record<string, ProjectedResponse | readonly CommonErrorResponse[]> = Object
    .fromEntries(errors.filter(([status]) => !compacted.has(status)));
  if (repeated.length) {
    result.common = Object.freeze(repeated.map((group) =>
      Object.freeze({
        statuses: Object.freeze(group.map(([status]) => status)),
        response: group[0]![1],
      })
    ));
  }
  return Object.freeze(result);
}

/** Project request, success-response, errors, and combined views from declared OpenAPI data. */
export function projectOperationSchemaViews(
  document: OpenApiObject,
  operation: IndexedOpenApiOperation,
): OperationSchemaViews {
  const entries = responseEntries(document, operation);
  const request = requestView(document, operation);
  const response: ResponseSchemaView = Object.freeze(Object.fromEntries(
    entries.filter(([status]) => isSuccess(status)),
  ));
  const errors = errorView(entries);
  const all: OperationSchemaAllView = Object.freeze({ request, response, errors });
  return Object.freeze({ request, response, errors, all });
}
