/** AI tool resource scaffolder.
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
import { toolStub } from './tool.stub.ts';

/** Canonical starter tool input emitted during AI install. */
export const DEFAULT_TOOL_INPUT: AiResourceInput = { id: 'echo' };

/** Unified AI tool item scaffolder used by install and `add tool`. */
export const toolScaffolder: ItemScaffolder<AiResourceInput> = {
  name: 'tool',
  emit(input: AiResourceInput): readonly ScaffoldArtifact[] {
    return [
      textArtifact(
        `ai/tools/${fileStem(input.id)}.ts`,
        substituteTokens(toolStub, {
          TOOL_ID: input.id,
          TOOL_EXPORT: `${exportStem(input.id)}Tool`,
        }),
      ),
    ];
  },
};

/** AI tool plugin resource descriptor. */
export const toolResource: PluginResource<AiResourceInput> = {
  name: 'tool',
  scaffolder: toolScaffolder,
  defaultInput: DEFAULT_TOOL_INPUT,
  parseInput: parseResourceInput,
};
