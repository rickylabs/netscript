/**
 * End-to-end gate metadata and probes for sagas plugin runtime validation.
 *
 * @module
 */

export { getSagasE2eGates } from './sagas-gates.ts';
export type { SagasE2eGate } from './sagas-gates.ts';
export { assertSuccessfulProbe, joinProbeUrl, summarizeResponse } from '@netscript/plugin';
export type { ProbeHttpResult } from '@netscript/plugin';
export {
  createSagasRoundtripPayload,
  resolveSagasHealthPath,
  resolveSagasProbeUrl,
  resolveSagasRoundtripPath,
} from './probes/probe-context.ts';
export type { SagasRoundtripProbePayload } from './probes/probe-context.ts';
export { SAGAS_PLUGIN_ID, SAGAS_PLUGIN_VERSION } from '../constants.ts';
