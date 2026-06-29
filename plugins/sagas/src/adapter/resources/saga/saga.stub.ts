/** Type-checked source stubs for generated saga userland files.
 *
 * @module
 */

import { defineStub, type StubSource } from '@netscript/plugin/adapter';

/** Type-checked saga definition stub with named substitution tokens. */
export const sagaDefinitionStub: StubSource<
  | 'COMPLETED_STATUS'
  | 'DURABILITY'
  | 'INITIAL_STATUS'
  | 'MESSAGE_TYPE'
  | 'SAGA_EXPORT'
  | 'SAGA_ID'
> = defineStub({
  source: `import { defineSaga, sagaComplete } from '@netscript/plugin-sagas-core';
import type { SagaDefinition } from '@netscript/plugin-sagas-core/domain';

type State = Readonly<{
  status: string;
  processedAt?: string;
}>;

type Message = Readonly<{ type: '%%MESSAGE_TYPE%%'; payload: unknown }>;

/**
 * Starter saga definition for %%SAGA_ID%%.
 */
export const %%SAGA_EXPORT%%: SagaDefinition<'%%SAGA_ID%%', State, Message> = defineSaga(
  '%%SAGA_ID%%',
)
  .durability('%%DURABILITY%%')
  .state<State>({ status: '%%INITIAL_STATUS%%' })
  .on<Message['type'], Message['payload']>('%%MESSAGE_TYPE%%', (saga, message, context) => {
    saga.state = {
      ...saga.state,
      status: '%%COMPLETED_STATUS%%',
      processedAt: context.now.toISOString(),
    };

    return [
      sagaComplete({
        messageType: message.type,
        processedAt: context.now.toISOString(),
      }),
    ];
  })
  .build();

export default %%SAGA_EXPORT%%;
`,
  tokens: [
    'COMPLETED_STATUS',
    'DURABILITY',
    'INITIAL_STATUS',
    'MESSAGE_TYPE',
    'SAGA_EXPORT',
    'SAGA_ID',
  ] as const,
});

/** Type-checked saga config stub with named substitution tokens. */
export const sagaConfigStub: StubSource<
  | 'CONFIG_EXPORT'
  | 'DESCRIPTION_LINE'
  | 'SAGA_ENTRYPOINT'
  | 'SAGA_ID'
  | 'SAGA_NAME'
  | 'TAGS_LINE'
  | 'TOPIC_LINE'
> = defineStub({
  source: `import { defineSagaConfig } from '@netscript/plugin-sagas-core/config';
import type { SagaConfigEntry } from '@netscript/plugin-sagas-core/config';

/**
 * Config-time registration for %%SAGA_ID%%.
 */
export const %%CONFIG_EXPORT%%: SagaConfigEntry<'%%SAGA_ID%%'> = defineSagaConfig(
  '%%SAGA_ID%%',
  '%%SAGA_ENTRYPOINT%%',
)
  .name('%%SAGA_NAME%%')%%DESCRIPTION_LINE%%%%TOPIC_LINE%%%%TAGS_LINE%%
  .build();

export default %%CONFIG_EXPORT%%;
`,
  tokens: [
    'CONFIG_EXPORT',
    'DESCRIPTION_LINE',
    'SAGA_ENTRYPOINT',
    'SAGA_ID',
    'SAGA_NAME',
    'TAGS_LINE',
    'TOPIC_LINE',
  ] as const,
});
