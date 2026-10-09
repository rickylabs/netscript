import type {
  GateFailureClass,
  GateResult,
  HttpGateDefinition,
} from '../../domain/gate-definition.ts';
import { type HttpExchangeOutcome, judgeHttpResponse } from '../../domain/http-contract.ts';
import type { RunContext } from '../../domain/run-context.ts';
import type { HttpClient } from '../../ports/http-client.ts';

/** Per-request HTTP transport cap; this probes application responses, not managed resource state. */
const HTTP_ATTEMPT_TIMEOUT_MS = 5_000;
/** Delay between connection attempts; it is not a resource-readiness interval. */
const HTTP_RETRY_DELAY_MS = 250;

/**
 * Gate that succeeds when an HTTP endpoint serves the exact status (and body) its definition
 * expects. Any served response decides the gate at once; only a connection-level failure is
 * retried within the deadline.
 */
export class HttpGate {
  constructor(
    private readonly definition: HttpGateDefinition,
    private readonly http: HttpClient,
  ) {
  }

  async execute(context: RunContext): Promise<GateResult> {
    const started = performance.now();
    const url = this.definition.url(context);
    const deadline = Date.now() + context.request.options.httpTimeoutMs;
    let lastFailure = 'HTTP probe deadline elapsed before a request completed.';

    while (Date.now() < deadline) {
      try {
        const response = await this.http.request({
          method: this.definition.method,
          url,
          headers: this.definition.headers,
          timeoutMs: Math.min(HTTP_ATTEMPT_TIMEOUT_MS, deadline - Date.now()),
        });
        const outcome = await judgeHttpResponse(this.definition, response);
        return outcome.kind === 'matched' ? this.result(started, outcome) : this.result(
          started,
          outcome,
          'assertion',
          `HTTP ${this.definition.method} ${url} broke its contract: ${outcome.reason}.`,
        );
      } catch (error) {
        lastFailure = error instanceof Error ? error.message : String(error);
      }

      const delayMs = Math.min(HTTP_RETRY_DELAY_MS, deadline - Date.now());
      if (delayMs > 0) await delay(delayMs);
    }

    return this.result(
      started,
      undefined,
      'timeout',
      `HTTP ${this.definition.method} ${url} was not served before the deadline: ${lastFailure}.`,
    );
  }

  private result(
    started: number,
    outcome: HttpExchangeOutcome | undefined,
    failureClass?: GateFailureClass,
    error?: string,
  ): GateResult {
    const verdict = failureClass ? 'failed' : 'passed';
    return {
      id: this.definition.id,
      title: this.definition.title,
      critical: this.definition.critical,
      verdict,
      evidence: [{
        kind: 'http',
        label: this.definition.id,
        data: {
          expectStatus: this.definition.expectStatus,
          status: outcome?.status ?? 0,
          bodyPreview: outcome?.bodyPreview ?? '',
          ...(error ? { error } : {}),
        },
      }],
      attempts: [{
        attempt: 1,
        verdict,
        durationMs: Math.round(performance.now() - started),
        ...(failureClass ? { failureClass } : {}),
      }],
      retried: false,
      ...(error ? { error } : {}),
    };
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
