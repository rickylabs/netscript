/**
 * @module
 *
 * Curated root exports for `@netscript/plugin-sagas-core`.
 *
 * This barrel starts empty in slice E1. Later slices add only stable,
 * documented root exports that fit the 25-export budget in the v2 plan.
 */

export { defineQuery, defineSaga, defineSignal } from '../builders/mod.ts';
export { sagaCompensate, sagaComplete, sagaFail, schedule, send, spawn } from './messages.ts';
