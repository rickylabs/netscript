/**
 * `@netscript/plugin-auth-core/sdk` client credential contributions.
 *
 * This universal subpath supplies the canonical bearer contribution without
 * reading ambient credentials or taking ownership of SDK transport and retry.
 *
 * @module
 */

export {
  createBearerSdkClientContribution,
  type CreateBearerSdkClientContributionOptions,
} from './bearer-contribution.ts';
export type { NetScriptAuthenticationRequirement } from '@netscript/contracts';
