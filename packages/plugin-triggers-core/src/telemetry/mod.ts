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
  TriggerMetricName,
  TriggerSpanName,
  TriggerTelemetryOutcome,
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
