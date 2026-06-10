/** @module @netscript/plugin-triggers-core/telemetry */

export {
  TriggerAttributes,
  TriggerMetricNames,
  TriggerSpanNames,
  TriggerTelemetryOutcomes,
} from './attributes.ts';
export { createTriggerInstrumentation, TriggerInstrumentation } from './instrumentation.ts';
export type {
  TriggerAttributeName,
  TriggerAttributesMap,
  TriggerMetricName,
  TriggerMetricNamesMap,
  TriggerSpanName,
  TriggerSpanNamesMap,
  TriggerTelemetryOutcome,
  TriggerTelemetryOutcomesMap,
} from './attributes.ts';
export type {
  TriggerActionDispatchInput,
  TriggerDispatchMetricInput,
  TriggerDlqInput,
  TriggerIngressMetricInput,
  TriggerInstrumentationOptions,
  TriggerSpanInput,
  TriggerTelemetryAttributes,
  TriggerTelemetryAttributeValue,
  TriggerTelemetryCounter,
  TriggerTelemetryHistogram,
  TriggerTelemetryMeter,
  TriggerTelemetrySpan,
  TriggerTelemetrySpanKind,
  TriggerTelemetryStatus,
  TriggerTelemetryTracer,
} from './instrumentation.ts';
export { TRIGGER_DURABILITY_TIERS, TRIGGER_EVENT_STATUSES, TRIGGER_KINDS } from '../domain/mod.ts';
export type {
  TriggerDurabilityTier,
  TriggerEventStatus,
  TriggerKind,
  TriggerKnownKind,
} from '../domain/mod.ts';
