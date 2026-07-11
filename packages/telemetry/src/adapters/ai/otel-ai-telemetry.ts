import { SpanKind, trace } from '@opentelemetry/api';
import {
  ATTR_GEN_AI_OPERATION_NAME,
  ATTR_GEN_AI_PROVIDER_NAME,
  ATTR_GEN_AI_REQUEST_MODEL,
  ATTR_GEN_AI_RESPONSE_MODEL,
  ATTR_GEN_AI_TOOL_NAME,
  ATTR_GEN_AI_USAGE_INPUT_TOKENS,
  ATTR_GEN_AI_USAGE_OUTPUT_TOKENS,
} from '@opentelemetry/semantic-conventions/incubating';
const TOOL_CALL_EVENT = 'gen_ai.tool.call';
const EXECUTE_TOOL_OPERATION = 'execute_tool';
const EXECUTE_TOOL_SPAN = 'execute_tool';

/** Scalar attribute value accepted by the AI telemetry seam. */
export type AiTelemetryAttributeValue = string | number | boolean;

/** Attributes accepted by the AI telemetry seam. */
export type AiTelemetryAttributes = Readonly<Record<string, AiTelemetryAttributeValue>>;

/** Span shape returned to the AI runtime. */
export interface OtelAiTelemetrySpan {
  /** Attach an attribute. */
  setAttribute(key: string, value: AiTelemetryAttributeValue): void;
  /** Record an exception. */
  recordException(error: unknown): void;
  /** End the span. */
  end(): void;
}

/** Telemetry port shape implemented for `@netscript/ai`. */
export interface OtelAiTelemetryPort {
  /** Start a span. */
  startSpan(name: string, attributes?: AiTelemetryAttributes): OtelAiTelemetrySpan;
  /** Record an event. */
  recordEvent(name: string, attributes?: AiTelemetryAttributes): void;
}

/** Minimal injectable OTel tracer shape used by the adapter. */
export interface OtelAiTracer {
  /** Start an OpenTelemetry span. */
  startSpan(
    name: string,
    options?: { readonly kind?: number; readonly attributes?: AiTelemetryAttributes },
  ): {
    setAttribute(key: string, value: AiTelemetryAttributeValue): unknown;
    recordException(error: Error | string): void;
    end(): void;
  };
}

/** Options for creating an OpenTelemetry-backed AI telemetry port. */
export interface CreateOtelAiTelemetryPortOptions {
  /** Tracer to receive AI spans. Defaults to the global NetScript AI tracer. */
  readonly tracer?: OtelAiTracer;
}

const GenAiAttributeKeys = {
  'gen_ai.operation.name': ATTR_GEN_AI_OPERATION_NAME,
  'gen_ai.provider.name': ATTR_GEN_AI_PROVIDER_NAME,
  'gen_ai.request.model': ATTR_GEN_AI_REQUEST_MODEL,
  'gen_ai.response.model': ATTR_GEN_AI_RESPONSE_MODEL,
  'gen_ai.tool.name': ATTR_GEN_AI_TOOL_NAME,
  'gen_ai.usage.input_tokens': ATTR_GEN_AI_USAGE_INPUT_TOKENS,
  'gen_ai.usage.output_tokens': ATTR_GEN_AI_USAGE_OUTPUT_TOKENS,
} as const;

function semconvAttributes(attributes: AiTelemetryAttributes | undefined): AiTelemetryAttributes {
  if (!attributes) return {};
  return Object.fromEntries(
    Object.entries(attributes).map(([key, value]) => [
      GenAiAttributeKeys[key as keyof typeof GenAiAttributeKeys] ?? key,
      value,
    ]),
  );
}

/**
 * Create the telemetry-side OpenTelemetry adapter for `@netscript/ai`.
 *
 * Chat operations become client spans. The AI loop's point-in-time tool-call
 * signal becomes an `execute_tool` internal span because the current AI port
 * does not expose a longer tool-execution lifecycle.
 */
export function createOtelAiTelemetryPort(
  options: CreateOtelAiTelemetryPortOptions = {},
): OtelAiTelemetryPort {
  const tracer: OtelAiTracer = options.tracer ?? trace.getTracer('@netscript/ai');

  return {
    startSpan(name, attributes): OtelAiTelemetrySpan {
      const span = tracer.startSpan(name, {
        kind: name.startsWith('gen_ai.chat') ? SpanKind.CLIENT : SpanKind.INTERNAL,
        attributes: semconvAttributes(attributes),
      });
      return {
        setAttribute(key, value): void {
          span.setAttribute(
            GenAiAttributeKeys[key as keyof typeof GenAiAttributeKeys] ?? key,
            value,
          );
        },
        recordException(error): void {
          span.recordException(error instanceof Error ? error : String(error));
        },
        end(): void {
          span.end();
        },
      };
    },
    recordEvent(name, attributes): void {
      if (name !== TOOL_CALL_EVENT) {
        const span = tracer.startSpan(name, { attributes: semconvAttributes(attributes) });
        span.end();
        return;
      }
      const span = tracer.startSpan(EXECUTE_TOOL_SPAN, {
        kind: SpanKind.INTERNAL,
        attributes: {
          ...semconvAttributes(attributes),
          [ATTR_GEN_AI_OPERATION_NAME]: EXECUTE_TOOL_OPERATION,
        },
      });
      span.end();
    },
  };
}
