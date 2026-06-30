/** File-watch trigger resource scaffolder.
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
import {
  exportStem,
  type FileWatchInput,
  parseFileWatchInput,
  stringArrayLiteral,
  triggerPath,
} from '../input.ts';
import { fileWatchStub } from './file-watch.stub.ts';

/** Canonical starter file-watch input emitted during triggers install. */
export const DEFAULT_FILE_WATCH_INPUT: FileWatchInput = {
  id: 'incoming-file-watch',
  fileName: 'incoming-file-watch',
  paths: ['./shared/incoming'],
  patterns: ['*.json', '*.csv'],
  ignored: ['*.tmp', '.*'],
};

/** Unified file-watch trigger item scaffolder used by install and add file-watch. */
export const fileWatchScaffolder: ItemScaffolder<FileWatchInput> = {
  name: 'file-watch',
  emit(input: FileWatchInput): readonly ScaffoldArtifact[] {
    return [
      textArtifact(
        triggerPath(input),
        substituteTokens(fileWatchStub, {
          IGNORED: stringArrayLiteral(input.ignored?.length ? input.ignored : ['*.tmp', '.*']),
          PATHS: stringArrayLiteral(input.paths?.length ? input.paths : ['./shared/incoming']),
          PATTERNS: stringArrayLiteral(input.patterns?.length ? input.patterns : ['*']),
          TRIGGER_EXPORT: `${exportStem(input.id)}Trigger`,
          TRIGGER_ID: input.id,
        }),
      ),
    ];
  },
};

/** File-watch trigger plugin resource descriptor. */
export const fileWatchResource: PluginResource<FileWatchInput> = {
  name: 'file-watch',
  scaffolder: fileWatchScaffolder,
  defaultInput: DEFAULT_FILE_WATCH_INPUT,
  parseInput: parseFileWatchInput,
};
