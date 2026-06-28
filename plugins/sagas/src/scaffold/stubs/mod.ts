/**
 * Sample sagas barrel emitted into a user workspace at `sagas/mod.ts`.
 *
 * Re-exports the user-owned sample saga and its config entry that `plugin add sagas` writes
 * alongside it. The paths are static siblings (`./user-registration-saga.ts`,
 * `./user-registration.config.ts`) so the barrel ships as a real, type-checked stub and is emitted
 * with no scaffold-time interpolation. The user extends this barrel as they add their own sagas.
 *
 * @module
 */

export { UserRegistrationSaga } from './user-registration-saga.ts';
export { UserRegistrationSagaConfig } from './user-registration.config.ts';
