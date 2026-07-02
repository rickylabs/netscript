/**
 * Skill loader port.
 *
 * A "skill" is a named, reusable instruction+tool bundle the agent can load on
 * demand. Default is a no-op loader returning no skills — a real loader (e.g.
 * filesystem- or registry-backed) is supplied by the host or a later slice.
 *
 * @module
 */

/**
 * Description of a loadable skill.
 */
export interface SkillDescriptor {
  /** Stable skill id. */
  readonly id: string;
  /** Human-readable skill name. */
  readonly name: string;
  /** Optional summary of what the skill does. */
  readonly description?: string;
  /** Instruction text injected into the system prompt when the skill loads. */
  readonly instructions?: string;
  /** Names of tools this skill expects to be available. */
  readonly tools?: readonly string[];
}

/**
 * The skill-loading capability seam.
 */
export interface SkillLoaderPort {
  /** Load all available skills. */
  loadSkills(): Promise<readonly SkillDescriptor[]>;
  /** Load a single skill by id, or `undefined` if absent. */
  getSkill(id: string): Promise<SkillDescriptor | undefined>;
}

/**
 * Create the default no-op skill loader: no skills are ever returned.
 */
export function createNoopSkillLoader(): SkillLoaderPort {
  return {
    loadSkills(): Promise<readonly SkillDescriptor[]> {
      return Promise.resolve([]);
    },
    getSkill(): Promise<SkillDescriptor | undefined> {
      return Promise.resolve(undefined);
    },
  };
}
