/** AI models starter scaffolder.
 *
 * @module
 */

import {
  type ItemScaffolder,
  type ScaffoldArtifact,
  substituteTokens,
  textArtifact,
} from '@netscript/plugin/adapter';
import { modelsStub } from './models.stub.ts';

/** Input accepted by the models scaffolder (fixed content). */
export type ModelsInput = Record<string, never>;

/** Canonical models input emitted during AI install. */
export const DEFAULT_MODELS_INPUT: ModelsInput = {};

/** Emits the app-owned `ai/models.ts` provider + model registry. */
export const modelsScaffolder: ItemScaffolder<ModelsInput> = {
  name: 'models',
  emit(_input: ModelsInput): readonly ScaffoldArtifact[] {
    return [textArtifact('ai/models.ts', substituteTokens(modelsStub, {}))];
  },
};
