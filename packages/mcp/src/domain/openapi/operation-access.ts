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
