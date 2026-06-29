/** Sagas background workspace barrel scaffolder.
 *
 * @module
 */

import {
  type ItemScaffolder,
  type ScaffoldArtifact,
  substituteTokens,
  textArtifact,
} from '@netscript/plugin/adapter';
import { exportStem, fileStem } from '../input.ts';
import { DEFAULT_SAGA_INPUT } from '../saga/saga.ts';
import { barrelStub } from './barrel.stub.ts';

/** Input accepted by the sagas barrel scaffolder. */
export interface BarrelInput {
  /** Saga id exported by the generated barrel. */
  readonly sagaId: string;
}

/** Canonical barrel input emitted during sagas install. */
export const DEFAULT_BARREL_INPUT: BarrelInput = {
  sagaId: DEFAULT_SAGA_INPUT.id,
};

/** Sagas barrel item scaffolder emitted during install. */
export const barrelScaffolder: ItemScaffolder<BarrelInput> = {
  name: 'barrel',
  emit(input: BarrelInput): readonly ScaffoldArtifact[] {
    const stem = fileStem(input.sagaId);
    const sagaExport = `${exportStem(input.sagaId)}Saga`;
    return [
      textArtifact(
        'sagas/mod.ts',
        substituteTokens(barrelStub, {
          CONFIG_EXPORT: `${sagaExport}Config`,
          CONFIG_FILE: `${stem}.config`,
          SAGA_EXPORT: sagaExport,
          SAGA_FILE: `${stem}-saga`,
        }),
      ),
    ];
  },
};
