import type {
  GateFailureClass,
  GateResult,
  HttpGateDefinition,
} from '../../domain/gate-definition.ts';
import { evaluateHttpExchange } from '../../domain/http-contract.ts';
import type { RunContext } from '../../domain/run-context.ts';
import type { HttpClient, HttpResult } from '../../ports/http-client.ts';

/** Per-request HTTP transport cap; this probes application responses, not managed resource state. */
const HTTP_ATTEMPT_TIMEOUT_MS = 5_000;
/** Delay between application HTTP attempts; it is not a resource-readiness interval. */
const HTTP_RETRY_DELAY_MS = 250;

/**
 * Gate that succeeds when an HTTP endpoint serves the exact status (and body) its definition
 * expects. Only a not-yet-up endpoint is retried within the deadline; a served response that
 * breaks the contract fails the gate at once.
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
    let lastResult: HttpResult | undefined;
    let lastFailure: string | undefined;

    while (Date.now() < deadline) {
      const remainingMs = deadline - Date.now();
      try {
        const result = await this.http.request({
          method: this.definition.method,
          url,
          headers: this.definition.headers,
          timeoutMs: Math.min(HTTP_ATTEMPT_TIMEOUT_MS, remainingMs),
        });
        lastResult = result;
        const outcome = evaluateHttpExchange(this.definition, result);
        if (outcome.kind === 'matched') return this.result('passed', started, result);
        lastFailure = outcome.reason;
        if (outcome.kind === 'mismatch') {
          return this.result('failed', started, result, 'assertion', this.failure(url, outcome));
        }
      } catch (error) {
        lastFailure = error instanceof Error ? error.message : String(error);
        lastResult = undefined;
      }

      const delayMs = Math.min(HTTP_RETRY_DELAY_MS, deadline - Date.now());
      if (delayMs > 0) await delay(delayMs);
    }

    const reason = lastFailure ?? 'HTTP probe deadline elapsed before a request completed.';
    return this.result(
      'failed',
      started,
      lastResult,
      'timeout',
      `HTTP ${this.definition.method} ${url} was not served before the deadline: ${reason}.`,
      reason,
    );
  }

  private failure(url: string, outcome: { readonly reason: string }): string {
    return `HTTP ${this.definition.method} ${url} broke its contract: ${outcome.reason}.`;
  }

  private result(
    verdict: 'passed' | 'failed',
    started: number,
    result: HttpResult | undefined,
    failureClass?: GateFailureClass,
    error?: string,
    transportError?: string,
  ): GateResult {
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
          status: result?.status ?? 0,
          ok: result?.ok ?? false,
          bodyPreview: result?.bodyPreview ?? transportError ?? '',
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
