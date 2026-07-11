import {
  type ItemScaffolder,
  type ScaffoldArtifact,
  substituteTokens,
  textArtifact,
} from '@netscript/plugin/adapter';
import { mcpToolStub } from './mcp-tool.stub.ts';

/** Input selecting whether the opt-in MCP tool is emitted. */
export interface McpToolInput {
  readonly enabled: boolean;
}

/** Emit the SkillLoaderPort-consuming MCP tool only when enabled. */
export const mcpToolScaffolder: ItemScaffolder<McpToolInput> = {
  name: 'mcp-tool',
  emit(input: McpToolInput): readonly ScaffoldArtifact[] {
    return input.enabled
      ? [textArtifact('ai/tools/skill-loader.ts', substituteTokens(mcpToolStub, {}))]
      : [];
  },
};
