/** Streams workspace barrel scaffolder.
 *
 * @module
 */

import {
  type ItemScaffolder,
  type ScaffoldArtifact,
  substituteTokens,
  textArtifact,
} from '@netscript/plugin/adapter';
import { camelStem, fileStem } from '../input.ts';
import { DEFAULT_STREAM_INPUT } from '../stream/stream.ts';
import { barrelStub } from './barrel.stub.ts';

/** Input accepted by the streams barrel scaffolder. */
export interface BarrelInput {
  /** Stream id exported by the generated barrel. */
  readonly streamId: string;
}

/** Canonical barrel input emitted during streams install. */
export const DEFAULT_BARREL_INPUT: BarrelInput = {
  streamId: DEFAULT_STREAM_INPUT.id,
};

/** Streams barrel item scaffolder emitted during install. */
export const barrelScaffolder: ItemScaffolder<BarrelInput> = {
  name: 'barrel',
  emit(input: BarrelInput): readonly ScaffoldArtifact[] {
    const stem = fileStem(input.streamId);
    const exportBase = camelStem(input.streamId);
    return [
      textArtifact(
        'streams/mod.ts',
        substituteTokens(barrelStub, {
          PRODUCER_EXPORT: `${exportBase}Stream`,
          SCHEMA_EXPORT: `${exportBase}StreamSchema`,
          STREAM_FILE: `${stem}-stream`,
        }),
      ),
    ];
  },
};
