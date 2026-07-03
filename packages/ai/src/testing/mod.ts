/**
 * `@netscript/ai/testing` — fakes for downstream unit tests.
 *
 * Deterministic, dependency-free port doubles plus the recorded-telemetry
 * helper. Import these to unit-test wiring against the AI ports without a real
 * provider, model, or transport.
 *
 * @module
 */

export {
  createFakeAgentLoop,
  createFakeAgentMemory,
  createFakeChatModelProvider,
  createFakeEmbeddingProvider,
  createFakeModelProvider,
  createFakeTelemetryPort,
  createFakeVisionProvider,
  createInMemoryToolRegistry,
  type FakeChatModelProvider,
  type FakeTelemetryPort,
  type RecordedTelemetry,
} from './fakes.ts';
