/** Sagas saga resource scaffolder.
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
  completedStatus,
  displayName,
  exportStem,
  fileStem,
  initialStatus,
  messageType,
  parseSagaInput,
  sagaDirectory,
  type SagaInput,
  stringArrayLiteral,
} from '../input.ts';
import { sagaConfigStub, sagaDefinitionStub } from './saga.stub.ts';

/** Canonical starter saga input emitted during sagas install. */
export const DEFAULT_SAGA_INPUT: SagaInput = {
  id: 'user-registration',
  durability: 't1',
  messageType: 'user.registered',
  description: 'Registers a user through the default saga workflow.',
  topic: 'users',
  tags: ['sample', 'users'],
};

/** Unified sagas item scaffolder used by install and add saga. */
export const sagaScaffolder: ItemScaffolder<SagaInput> = {
  name: 'saga',
  emit(input: SagaInput): readonly ScaffoldArtifact[] {
    const stem = fileStem(input.id);
    const directory = sagaDirectory(input);
    const exportName = `${exportStem(input.id)}Saga`;
    return [
      textArtifact(
        `${directory}/${stem}-saga.ts`,
        substituteTokens(sagaDefinitionStub, {
          COMPLETED_STATUS: completedStatus(input),
          DURABILITY: input.durability,
          INITIAL_STATUS: initialStatus(input),
          MESSAGE_TYPE: messageType(input),
          SAGA_EXPORT: exportName,
          SAGA_ID: input.id,
        }),
      ),
      textArtifact(
        `${directory}/${stem}.config.ts`,
        substituteTokens(sagaConfigStub, {
          CONFIG_EXPORT: `${exportName}Config`,
          DESCRIPTION_LINE: input.description
            ? `\n  .description(${JSON.stringify(input.description)})`
            : '',
          SAGA_ENTRYPOINT: `${directory}/${stem}-saga.ts`,
          SAGA_ID: input.id,
          SAGA_NAME: displayName(input.id),
          TAGS_LINE: input.tags?.length ? `\n  .tags(...${stringArrayLiteral(input.tags)})` : '',
          TOPIC_LINE: input.topic ? `\n  .topic(${JSON.stringify(input.topic)})` : '',
        }),
      ),
    ];
  },
};

/** Sagas saga plugin resource descriptor. */
export const sagaResource: PluginResource<SagaInput> = {
  name: 'saga',
  scaffolder: sagaScaffolder,
  defaultInput: DEFAULT_SAGA_INPUT,
  parseInput: parseSagaInput,
};
