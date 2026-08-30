/** Bounded authentication and authorization facts projected from one OpenAPI operation. */
export interface OperationAccessSummary {
  /** Declared authentication behavior; an absent summary means the operation is undeclared. */
  readonly authentication: 'none' | 'optional' | 'required';
  /** OpenAPI security-scheme names callers may use. */
  readonly securitySchemes: readonly string[];
  /** Declared OAuth-style scopes, without credential values. */
  readonly scopes: readonly string[];
  /** Declared NetScript roles, without principal or credential data. */
  readonly roles: readonly string[];
}

type OpenApiSecurityRequirement = Readonly<Record<string, unknown>>;

/** Derive bounded access facts from an operation's own OpenAPI security declaration. */
export function deriveOperationAccessSummary(
  operation: Readonly<Record<string, unknown>>,
): OperationAccessSummary | undefined {
  if (!Object.hasOwn(operation, 'security') || !Array.isArray(operation.security)) {
    return undefined;
  }

  if (operation.security.length === 0) {
    return {
      authentication: 'none',
      securitySchemes: [],
      scopes: [],
      roles: stringArray(operation['x-netscript-roles']),
    };
  }

  const requirements = operation.security.filter(isSecurityRequirement);
  if (requirements.length === 0) return undefined;

  const nonEmptyRequirements = requirements.filter((requirement) =>
    Object.keys(requirement).length > 0
  );
  const optional = nonEmptyRequirements.length < requirements.length;

  return {
    authentication: optional ? 'optional' : 'required',
    securitySchemes: unique(nonEmptyRequirements.flatMap(Object.keys)),
    scopes: unique(
      nonEmptyRequirements.flatMap((requirement) =>
        Object.values(requirement).flatMap(stringArray)
      ),
    ),
    roles: optional ? [] : stringArray(operation['x-netscript-roles']),
  };
}

function isSecurityRequirement(value: unknown): value is OpenApiSecurityRequirement {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === 'string')
    : [];
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}
