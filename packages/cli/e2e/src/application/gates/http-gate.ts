import type { GateResult, HttpGateDefinition } from '../../domain/gate-definition.ts';
import type { RunContext } from '../../domain/run-context.ts';
import type { HttpClient, HttpResult } from '../../ports/http-client.ts';

const HTTP_ATTEMPT_TIMEOUT_MS = 5_000;
const HTTP_RETRY_DELAY_MS = 250;

/** Gate that succeeds when an HTTP endpoint returns a 2xx response. */
export class HttpGate {
  constructor(
    private readonly definition: HttpGateDefinition,
    private readonly http: HttpClient,
  ) {
  }

  async execute(context: RunContext): Promise<GateResult> {
    const url = this.definition.url(context);
    const deadline = Date.now() + context.request.options.httpTimeoutMs;
    let lastResult: HttpResult | undefined;
    let lastError: string | undefined;

    while (Date.now() < deadline) {
      const remainingMs = deadline - Date.now();
      try {
        const result = await this.http.request({
          method: this.definition.method,
          url,
          timeoutMs: Math.min(HTTP_ATTEMPT_TIMEOUT_MS, remainingMs),
        });
        lastResult = result;
        lastError = undefined;
        if (result.ok) {
          return {
            id: this.definition.id,
            title: this.definition.title,
            critical: this.definition.critical,
            verdict: 'passed',
            evidence: [{ kind: 'http', label: this.definition.id, data: result }],
          };
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
        lastResult = {
          status: 0,
          ok: false,
          bodyPreview: lastError,
        };
      }

      const delayMs = Math.min(HTTP_RETRY_DELAY_MS, deadline - Date.now());
      if (delayMs > 0) await delay(delayMs);
    }

    const result = lastResult ?? {
      status: 0,
      ok: false,
      bodyPreview: lastError ?? 'HTTP probe deadline elapsed before a request completed.',
    };
    return {
      id: this.definition.id,
      title: this.definition.title,
      critical: this.definition.critical,
      verdict: 'failed',
      evidence: [{ kind: 'http', label: this.definition.id, data: result }],
      error: lastError
        ? `HTTP ${this.definition.method} ${url} failed: ${lastError}.`
        : `HTTP ${this.definition.method} ${url} returned ${result.status}.`,
    };
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
