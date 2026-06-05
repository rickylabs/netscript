import type { NotFoundError } from './schemas.ts';

const DEFAULT_RESOURCE_TYPE = 'resource';
const VERSION_SEGMENT_PATTERN = /^v\d+$/i;

/** Options for throwing a contract `NOT_FOUND` oRPC error. */
export type NotFoundOptions = Readonly<{
  /** oRPC errors object from a handler context. */
  errors: unknown;
  /** Route path array, for example `["users", "getById"]`. */
  path?: readonly string[];
  /** Optional resource ID for the error payload. */
  resourceId?: string | number;
  /** Optional custom error message. */
  message?: string;
}>;

type NotFoundFactory = (options: {
  message: string;
  data: NotFoundError;
}) => unknown;

type NotFoundErrorContainer = Readonly<{
  NOT_FOUND: NotFoundFactory;
}>;

/** Resolves a singular resource name from an oRPC handler path. */
export function getResourceType(options: { path?: readonly string[] }): string {
  const pathSegment =
    options.path?.find((segment) => segment.length > 0 && !VERSION_SEGMENT_PATTERN.test(segment)) ??
      DEFAULT_RESOURCE_TYPE;

  return pathSegment.length > 1 && pathSegment.endsWith('s')
    ? pathSegment.slice(0, -1)
    : pathSegment;
}

/** Throws the contract `NOT_FOUND` oRPC error with inferred resource context. */
export function notFound(options: NotFoundOptions): never {
  const constructors = options.errors as NotFoundErrorContainer;
  const resourceType = getResourceType({ path: options.path });
  const resourceId = options.resourceId ?? 'unknown';
  const idDisplay = options.resourceId !== undefined ? ` with ID ${options.resourceId}` : '';

  throw constructors.NOT_FOUND({
    message: options.message ?? `${capitalize(resourceType)}${idDisplay} not found`,
    data: {
      resourceType,
      resourceId,
    },
  });
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
