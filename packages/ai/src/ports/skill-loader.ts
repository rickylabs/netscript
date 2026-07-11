/**
 * Skill-loading capability seam, published primarily from `@netscript/ai/skills`.
 *
 * @module
 */

import type { SkillLoaderPort } from '../skills/domain/types.ts';

export type { SkillLoaderPort } from '../skills/domain/types.ts';

/** Create a no-op skill loader that exposes an empty catalog. */
export function createNoopSkillLoader(): SkillLoaderPort {
  return {
    list: () => Promise.resolve([]),
    load: () => Promise.resolve(undefined),
    matchByTag: () => Promise.resolve([]),
    matchByQuery: () => Promise.resolve([]),
  };
}
