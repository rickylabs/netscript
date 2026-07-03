/** AI agent resource scaffolder.
 *
 * @module
 */

import {
  type ItemScaffolder,
  type PluginResource,
  type ScaffoldArtifact,
  substituteTokens,
  textArtifact,
} from '@netscript/plugin/adapter';
import { type AiResourceInput, exportStem, fileStem, parseResourceInput } from '../input.ts';
import { agentStub } from './agent.stub.ts';

/** Canonical starter agent input emitted during AI install. */
export const DEFAULT_AGENT_INPUT: AiResourceInput = { id: 'assistant' };

/** Unified AI agent item scaffolder used by install and `add agent`. */
export const agentScaffolder: ItemScaffolder<AiResourceInput> = {
  name: 'agent',
  emit(input: AiResourceInput): readonly ScaffoldArtifact[] {
    return [
      textArtifact(
        `ai/agents/${fileStem(input.id)}.ts`,
        substituteTokens(agentStub, {
          AGENT_ID: input.id,
          AGENT_EXPORT: `create${exportStem(input.id).replace(/^./, (c) => c.toUpperCase())}Agent`,
        }),
      ),
    ];
  },
};

/** AI agent plugin resource descriptor. */
export const agentResource: PluginResource<AiResourceInput> = {
  name: 'agent',
  scaffolder: agentScaffolder,
  defaultInput: DEFAULT_AGENT_INPUT,
  parseInput: parseResourceInput,
};
