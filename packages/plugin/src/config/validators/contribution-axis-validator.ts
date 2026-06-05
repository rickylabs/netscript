import { CONTRIBUTION_AXES } from '../../domain/mod.ts';

/** Check whether a value is a supported contribution axis. */
export function isContributionAxis(value: string): boolean {
  return CONTRIBUTION_AXES.includes(value as (typeof CONTRIBUTION_AXES)[number]);
}
