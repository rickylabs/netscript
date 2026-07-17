import type { TelemetryQueryPort, TelemetrySpan } from '@netscript/telemetry/query';
import { SagaAttributes } from '@netscript/telemetry/attributes';
import type { ToolFlow } from '../../domain/tool-types.ts';
import { correlatedLogs, executionId, summarizeSpanTree } from '../telemetry-aggregation.ts';

/** Create the end-to-end semantic run detail flow. */
export function createGetRunFlow(query: TelemetryQueryPort): ToolFlow {
  return async (input) => {
    const id = (input as { id: string }).id;
    const candidates = await query.querySpans({ limit: 500 });
    const match = candidates.find((span: TelemetrySpan) => executionId(span) === id);
    if (!match) {
      return { ok: false, error: { code: 'run_not_found', message: `Run ${id} was not found.` } };
    }
    const trace = await query.getTrace(match.traceId);
    const spans = trace?.spans ??
      candidates.filter((span: TelemetrySpan) => span.traceId === match.traceId);
    const logs = correlatedLogs(await query.queryLogs({ limit: 500 }), match.traceId).map((
      log,
    ) => ({ timeUnixMs: log.timeUnixMs, severity: log.severity, message: log.body }));
    const error = spans.find((span: TelemetrySpan) => span.statusCode === 2);
    const outcome = match.attributes[SagaAttributes.OUTCOME];
    return {
      ok: true,
      value: {
        id,
        summary: error?.statusMessage ??
          (typeof outcome === 'string' ? outcome : 'Run telemetry found.'),
        traceId: match.traceId,
        outcome: typeof outcome === 'string' ? outcome : undefined,
        errorMessage: error?.statusMessage,
        spans: summarizeSpanTree(spans),
        logs,
      },
    };
  };
}
