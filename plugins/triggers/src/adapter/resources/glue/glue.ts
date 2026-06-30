/** Triggers runtime glue scaffolder.
 *
 * @module
 */

import {
  type ItemScaffolder,
  type ScaffoldArtifact,
  textArtifact,
} from '@netscript/plugin/adapter';
import { runtimeGlueStub } from './runtime.stub.ts';

/** Input accepted by the triggers runtime glue scaffolder. */
export type RuntimeGlueInput = Readonly<Record<string, never>>;

/** Canonical runtime glue input emitted during triggers install. */
export const DEFAULT_RUNTIME_GLUE_INPUT: RuntimeGlueInput = {};

/** Triggers runtime glue emitted during install. */
export const runtimeGlueScaffolder: ItemScaffolder<RuntimeGlueInput> = {
  name: 'runtime-glue',
  emit(): readonly ScaffoldArtifact[] {
    return [textArtifact('triggers/runtime.ts', runtimeGlueStub.source)];
  },
};
