import { assertEquals } from '@std/assert';
import { HttpGate } from '../../../src/application/gates/http-gate.ts';
import { GATE, GATE_PHASE } from '../../../src/domain/cli-surface.ts';
import type { RunContext, RunOptions } from '../../../src/domain/run-context.ts';
import type { SmokeProject } from '../../../src/domain/smoke-project.ts';
import type { HttpClient, HttpRequest, HttpResult } from '../../../src/ports/http-client.ts';

Deno.test('HTTP gate retries transient request failures within the gate deadline', async () => {
  const http = new SequenceHttpClient([
    new Error('The signal has been aborted'),
    { status: 200, ok: true, bodyPreview: '{"status":"ok"}' },
  ]);
  const gate = new HttpGate({
    kind: 'http',
    id: GATE.BEHAVIOR_WORKERS_JOBS,
    title: 'List worker jobs',
    phase: GATE_PHASE.BEHAVIOR,
    critical: true,
    method: 'GET',
    url: () => 'http://127.0.0.1:8091/api/v1/workers/jobs',
  }, http);

  const result = await gate.execute(createContext());

  assertEquals(result.verdict, 'passed');
  assertEquals(http.requests.length, 2);
  assertEquals(http.requests[0].timeoutMs, 5_000);
});

function createContext(): RunContext {
  return {
    request: {
      suiteId: 'scaffold.runtime',
      options: {
        repoRoot: '.',
        cliEntrypoint: './packages/cli/bin/netscript.ts',
        smokeRoot: '.llm/tmp/cli-e2e',
        projectName: 'http-gate-test',
        database: 'postgres',
        packageSource: 'local',
        plugins: [],
        samples: true,
        cleanup: true,
        format: 'json',
        commandTimeoutMs: 30_000,
        httpTimeoutMs: 30_000,
      } satisfies RunOptions,
    },
    project: {
      repoRoot: '.',
      cliEntrypoint: './packages/cli/bin/netscript.ts',
      smokeRoot: '.llm/tmp/cli-e2e',
      projectName: 'http-gate-test',
      projectRoot: '.llm/tmp/cli-e2e/http-gate-test',
      appHost: '.llm/tmp/cli-e2e/http-gate-test/aspire/apphost.mts',
    } satisfies SmokeProject,
  };
}

class SequenceHttpClient implements HttpClient {
  readonly requests: HttpRequest[] = [];

  constructor(private readonly responses: readonly (Error | HttpResult)[]) {}

  request(request: HttpRequest): Promise<HttpResult> {
    this.requests.push(request);
    const response = this.responses[this.requests.length - 1];
    if (response instanceof Error) return Promise.reject(response);
    if (!response) throw new Error('No fake HTTP response configured.');
    return Promise.resolve(response);
  }
}
