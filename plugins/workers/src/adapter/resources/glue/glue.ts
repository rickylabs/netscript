/** Workers runtime glue scaffolder.
 *
 * @module
 */

import {
  type ItemScaffolder,
  type ScaffoldArtifact,
  textArtifact,
} from '@netscript/plugin/adapter';
import { runtimeGlueStub } from './runtime.stub.ts';

/** Input accepted by the workers runtime glue scaffolder. */
export type RuntimeGlueInput = Readonly<Record<string, never>>;

/** Canonical runtime glue input emitted during workers install. */
export const DEFAULT_RUNTIME_GLUE_INPUT: RuntimeGlueInput = {};

/** Workers runtime glue emitted during install. */
export const runtimeGlueScaffolder: ItemScaffolder<RuntimeGlueInput> = {
  name: 'runtime-glue',
  emit(): readonly ScaffoldArtifact[] {
    return [textArtifact('workers/runtime.ts', runtimeGlueStub.source)];
  },
};
