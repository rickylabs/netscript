/**
 * Redaction-safe SDK contribution identifier parsing for construction diagnostics.
 *
 * @module
 */

import type { SdkClientContributionId } from '../../ports/sdk-client-contribution.ts';

const CONTRIBUTION_ID_PATTERN = /^[a-z0-9@][a-z0-9@._/-]*:[a-z0-9][a-z0-9._-]*$/;

/** Return a valid public contribution id without accepting the surrounding descriptor. */
export function parseSdkClientContributionDiagnosticId(
  value: unknown,
): SdkClientContributionId | undefined {
  return typeof value === 'string' && value.length >= 3 && value.length <= 128 &&
      CONTRIBUTION_ID_PATTERN.test(value) && !value.startsWith('@netscript/internal:')
    ? value as SdkClientContributionId
    : undefined;
}

/** Read a valid public contribution id from an unknown descriptor. */
export function getSdkClientContributionDiagnosticId(
  value: unknown,
): SdkClientContributionId | undefined {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const id = Object.getOwnPropertyDescriptor(value, 'id');
  return id !== undefined && 'value' in id
    ? parseSdkClientContributionDiagnosticId(id.value)
    : undefined;
}
