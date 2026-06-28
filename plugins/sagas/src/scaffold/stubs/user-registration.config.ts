/**
 * Sample saga config entry emitted into a user workspace at `sagas/user-registration.config.ts`.
 *
 * This file is shipped as a real, type-checked stub inside `@netscript/plugin-sagas` and is copied
 * verbatim into the user's workspace by `plugin add sagas`. The user owns and edits it; the
 * scaffolder never rewrites it after the first scaffold. It registers the sibling sample saga with
 * the runtime and imports only the published runtime core `@netscript/plugin-sagas-core/config`, so
 * it ships free of scaffold-time tokens and is emitted with no interpolation.
 *
 * @module
 */

import { defineSagaConfig } from '@netscript/plugin-sagas-core/config';
import type { SagaConfigEntry } from '@netscript/plugin-sagas-core/config';

/**
 * Config-time registration for the sibling {@linkcode UserRegistrationSaga} sample.
 *
 * Extend the metadata or add new `defineSagaConfig` entries as you author additional sagas.
 */
export const UserRegistrationSagaConfig: SagaConfigEntry<'user-registration'> = defineSagaConfig(
  'user-registration',
  'sagas/user-registration-saga.ts',
)
  .name('User Registration')
  .description('Registers a user through the default saga workflow.')
  .topic('users')
  .tags('sample', 'users')
  .build();

export default UserRegistrationSagaConfig;
