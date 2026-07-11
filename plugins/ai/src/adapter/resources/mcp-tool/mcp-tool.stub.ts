import { defineStub, type StubSource } from '@netscript/plugin/adapter';

/** Source for the opt-in skill-loader MCP tool. */
export const mcpToolStub: StubSource<never> = defineStub({
  source: `/** MCP-facing skill discovery tool. */
import type { SkillLoaderPort } from '@netscript/ai/skills';
import { defineAiTool } from '@netscript/ai/tools';

/** Create a skill discovery tool backed by the application's skill loader. */
export function createSkillLoaderTool(skills: SkillLoaderPort) {
  return defineAiTool('skill-loader')
    .describe('Discover available Agent Skills by context tags.')
    .parameters({
      type: 'object',
      properties: { tags: { type: 'array', items: { type: 'string' } } },
      required: ['tags'],
    })
    .server(async ({ tags }: { tags: string[] }) => await skills.matchByTag(tags));
}
`,
  tokens: [],
});
