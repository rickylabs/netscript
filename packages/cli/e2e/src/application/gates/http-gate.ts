import type { GateResult, HttpGateDefinition } from '../../domain/gate-definition.ts';
import type { RunContext } from '../../domain/run-context.ts';
import type { HttpClient } from '../../ports/http-client.ts';

/** Gate that succeeds when an HTTP endpoint returns a 2xx response. */
export class HttpGate {
  constructor(
    private readonly definition: HttpGateDefinition,
    private readonly http: HttpClient,
  ) {
  }

  async execute(context: RunContext): Promise<GateResult> {
    const url = this.definition.url(context);
    const result = await this.http.request({
      method: this.definition.method,
      url,
      timeoutMs: context.request.options.httpTimeoutMs,
    });
    return {
      id: this.definition.id,
      title: this.definition.title,
      critical: this.definition.critical,
      verdict: result.ok ? 'passed' : 'failed',
      evidence: [{ kind: 'http', label: this.definition.id, data: result }],
      error: result.ok
        ? undefined
        : `HTTP ${this.definition.method} ${url} returned ${result.status}.`,
    };
  }
}
