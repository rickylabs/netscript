/** OpenTelemetry adapter for the `@netscript/ai` telemetry port. @module */

export {
  type AiTelemetryAttributes,
  type AiTelemetryAttributeValue,
  createOtelAiTelemetryPort,
  type CreateOtelAiTelemetryPortOptions,
  type OtelAiTelemetryPort,
  type OtelAiTelemetrySpan,
  type OtelAiTracer,
} from './src/adapters/ai/otel-ai-telemetry.ts';
