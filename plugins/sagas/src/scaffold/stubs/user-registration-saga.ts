/**
 * Sample saga definition emitted into a user workspace at `sagas/user-registration-saga.ts`.
 *
 * This file is shipped as a real, type-checked stub inside `@netscript/plugin-sagas` and is copied
 * verbatim into the user's workspace by `plugin add sagas`. The user owns and edits it; the
 * scaffolder never rewrites it after the first scaffold. Keep it minimal, dependency-direction
 * clean (import only the published runtime core `@netscript/plugin-sagas-core`), and free of
 * scaffold-time tokens so it can be emitted with no interpolation.
 *
 * @module
 */

import { defineSaga, sagaComplete } from '@netscript/plugin-sagas-core';
import type { SagaDefinition } from '@netscript/plugin-sagas-core/domain';

type State = Readonly<{
  status: string;
  processedAt?: string;
}>;

type Message = Readonly<{ type: 'user.registered'; payload: unknown }>;

/**
 * A starter saga that completes as soon as its first message arrives.
 *
 * Replace the handler body with your own orchestration logic; the export name and the
 * `@netscript/plugin-sagas-core` imports are all the sagas runtime needs to discover and run it.
 */
export const UserRegistrationSaga: SagaDefinition<'user-registration', State, Message> = defineSaga(
  'user-registration',
)
  .durability('t1')
  .state<State>({ status: 'pending' })
  .on<Message['type'], Message['payload']>('user.registered', (saga, message, context) => {
    saga.state = {
      ...saga.state,
      status: 'completed',
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

export default UserRegistrationSaga;
