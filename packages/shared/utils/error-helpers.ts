/**
 * Shared Error Helpers for Services
 *
 * KISS approach - automatically infer resource types from context
 * No arbitrary strings needed!
 */

/**
 * Extract resource type from handler path
 * Automatically infers 'user', 'product', 'order' etc. from the route
 *
 * @example
 * // In users service: getResourceType({ path: ['users'] }) => 'user'
 * // In products service: getResourceType({ path: ['products'] }) => 'product'
 */
export function getResourceType(options: { path?: readonly string[] }): string {
  // Convert readonly string[] to a concatenated string eg ['v1', 'users', 'getById'] => 'v1/users/getById'
  const fullPath = options.path?.join('/') || '';

  // Extract the resource segment (second part for versioned routes, first otherwise)
  // ['v1', 'users', 'getById'] -> 'users'
  // ['users', 'getById'] -> 'users'
  const pathSegment = options.path?.[0]?.startsWith('v') ? options.path?.[1] : options.path?.[0];
  const resourceSegment = pathSegment || '';

  // Remove 's' suffix to get singular form
  // 'users' -> 'user', 'products' -> 'product', 'orders' -> 'order'
  return resourceSegment.endsWith('s') ? resourceSegment.slice(0, -1) : resourceSegment;
}

/**
 * Options for notFound helper
 */
export interface NotFoundOptions {
  /** oRPC errors object from handler */
  errors: unknown;
  /** Route path array (e.g., ['users', 'getById']) */
  path?: readonly string[];
  /** Optional resource ID for error message */
  resourceId?: string | number;
  /** Optional custom error message */
  message?: string;
}

/**
 * Helper to throw NOT_FOUND error with auto-inferred resource type
 *
 * @example
 * ```ts
 * if (!user) {
 *   notFound({ errors, path, resourceId: input.id });
 * }
 * ```
 */
export function notFound(options: NotFoundOptions): never {
  const { errors, path, resourceId, message: customMessage } = options;
  const constructors = errors as { NOT_FOUND: (opts: any) => unknown };
  const resourceType = getResourceType({ path });
  const idDisplay = resourceId !== undefined ? ` with ID ${resourceId}` : '';

  throw constructors.NOT_FOUND({
    message: customMessage || `${capitalize(resourceType)}${idDisplay} not found`,
    data: {
      resourceType,
      resourceId,
    },
  });
}

/**
 * Capitalize first letter
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
