/** AI runtime barrel scaffolder.
 *
 * @module
 */

import {
  type ItemScaffolder,
  type ScaffoldArtifact,
  substituteTokens,
  textArtifact,
} from '@netscript/plugin/adapter';
import { barrelStub } from './barrel.stub.ts';

/** Input accepted by the barrel scaffolder (fixed content). */
export type BarrelInput = Record<string, never>;

/** Canonical barrel input emitted during AI install. */
export const DEFAULT_BARREL_INPUT: BarrelInput = {};

/** Emits the app-owned `ai/ai.ts` composition root wiring `@netscript/ai`. */
export const barrelScaffolder: ItemScaffolder<BarrelInput> = {
  name: 'barrel',
  emit(_input: BarrelInput): readonly ScaffoldArtifact[] {
    return [textArtifact('ai/ai.ts', substituteTokens(barrelStub, {}))];
  },
};
