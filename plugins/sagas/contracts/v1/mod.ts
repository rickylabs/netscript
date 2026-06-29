/**
 * Sagas Plugin Contracts - Version 1.
 *
 * Re-exports the sagas core contract surface owned by
 * `@netscript/plugin-sagas-core`. The connector no longer carries a duplicate
 * contract definition: the canonical, type-sound contract lives in
 * `@netscript/plugin-sagas-core/contracts/v1` and the service binds directly to
 * its `sagasContractV1` implementer.
 *
 * @module
 */

export * from '@netscript/plugin-sagas-core/contracts/v1';
