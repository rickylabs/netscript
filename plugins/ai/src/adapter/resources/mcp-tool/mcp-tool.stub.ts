import { defineStub, type StubSource } from '@netscript/plugin/adapter';

/** Source for the opt-in skill-loader MCP tool. */
export const mcpToolStub: StubSource<never> = defineStub({
  source: `/** MCP-facing skill discovery tool. */
import type { SkillLoaderPort } from '@netscript/ai/skills';
import type { SkillMatch } from '@netscript/ai/skills';
import { type AiToolDefinition, defineAiTool } from '@netscript/ai/tools';

const STANDARD_SCHEMA_VERSION: 1 = 1;
interface SkillLoaderInput {
  readonly tags: readonly string[];
}

type SkillLoaderValidationResult =
  | { readonly value: SkillLoaderInput }
  | {
    readonly issues: readonly {
      readonly message: string;
      readonly path: readonly string[];
    }[];
  };

const skillLoaderInput = {
  '~standard': {
    version: STANDARD_SCHEMA_VERSION,
    vendor: 'netscript-scaffold',
    validate(value: unknown): SkillLoaderValidationResult {
      if (typeof value === 'object' && value !== null) {
        const candidate = Reflect.get(value, 'tags');
        if (Array.isArray(candidate)) {
          const tags: string[] = [];
          for (const tag of candidate) {
            if (typeof tag !== 'string') {
              return { issues: [{ message: 'Every "tags" item must be a string.', path: ['tags'] }] };
            }
            tags.push(tag);
          }
          return { value: { tags } };
        }
      }
      return { issues: [{ message: '"tags" must be an array of strings.', path: ['tags'] }] };
    },
  },
};

/** Create a skill discovery tool backed by the application's skill loader. */
export function createSkillLoaderTool(
  skills: SkillLoaderPort,
): AiToolDefinition<SkillLoaderInput, readonly SkillMatch[]> {
  return defineAiTool('skill-loader')
    .describe('Discover available Agent Skills by context tags.')
    .parameters({
      type: 'object',
      properties: { tags: { type: 'array', items: { type: 'string' } } },
      required: ['tags'],
    })
    .input(skillLoaderInput)
    .server(async ({ tags }) => await skills.matchByTag(tags));
}
`,
  tokens: [],
});
