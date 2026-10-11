import { assertEquals, assertRejects, assertThrows } from '@std/assert';
import { ChildHealthMonitor, childHealthResponse } from '@netscript/plugin/health';
import {
  GATE,
  KV_BACKGROUND_RUNTIME_RESOURCES,
  SCAFFOLD,
} from '../../../src/domain/cli-surface.ts';
import type { RunContext } from '../../../src/domain/run-context.ts';
import { parseHttpExchangeContract } from '../../../src/domain/http-contract.ts';
import { probeBackgroundChildren } from '../../../src/application/gates/scaffold/runtime/probe-background-children.ts';
import { probeExchange } from '../../../src/application/gates/scaffold/runtime/probe-plugin-resource.ts';
import { runGate } from '../../../src/application/runner/gate-runner.ts';
import { resolveSuite } from '../../../src/presentation/cli/suites/registry.ts';
import { parseResourceUpdateLine } from '../../../src/application/gates/scaffold/runtime/resource-state-stream.ts';
import {
  resolveResourceUrlsFromAppHost,
  resourceUrlsFromDescribeOutput,
} from '../../../src/application/gates/scaffold/generated-app-endpoint.ts';

const CONTEXT = {
  project: { repoRoot: '/repo', appHost: '/workspace/aspire/apphost.mts' },
  request: { options: { commandTimeoutMs: 10_000 } },
} as RunContext;

function readinessGates(suiteId: typeof SCAFFOLD.RUNTIME | typeof SCAFFOLD.RUNTIME_SQLITE) {
  return resolveSuite(suiteId).gates.filter((gate) =>
    gate.id === GATE.BEHAVIOR_BACKGROUND_CHILDREN_HEALTH || gate.id === GATE.BEHAVIOR_STREAMS_HEALTH
  );
}

Deno.test('ready background children pass through endpoint-resolved real HTTP health', async () => {
  await withChildren(undefined, async (resolveUrls) => {
    await probeBackgroundChildren('fixture-apphost', { resolveUrls, fetch });
  });
});

for (const child of KV_BACKGROUND_RUNTIME_RESOURCES) {
  Deno.test(`crash-looping ${child} turns the registered runtime gate red while APIs stay green`, async () => {
    await withChildren(child, async (resolveUrls) => {
      const gate = readinessGates(SCAFFOLD.RUNTIME).find((gate) =>
        gate.id === 'behavior.background-children-health'
      );
      if (gate?.kind !== 'command') throw new Error('child command gate missing');
      const result = await runGate(gate, CONTEXT, {
        clock: { now: () => new Date(0), monotonicMs: () => 0 },
        platform: { current: () => 'linux' },
        httpClient: { request: () => Promise.resolve(Response.json({ ready: true })) },
        commandExecutor: {
          async run(request) {
            // Only replace the process boundary. Execute the same probe as the registered command.
            assertEquals(request.command.at(-1), CONTEXT.project.appHost);
            assertEquals(
              request.command.some((arg) => arg.endsWith('/probe-background-children.ts')),
              true,
            );
            await probeBackgroundChildren(request.command.at(-1)!, { resolveUrls, fetch });
            throw new Error('crash-loop fixture unexpectedly passed');
          },
        },
      });
      assertEquals(result.verdict, 'failed');
      assertEquals(result.critical, true);
      assertEquals(
        result.error?.includes(`${child} child readiness failed: expected HTTP 200, served 503`),
        true,
      );
    });
  });
}

Deno.test('a 200 wrapper cannot hide a child whose registry, dependency, or state is not ready', async () => {
  for (
    const health of [
      { state: 'crash-looping', registryReady: true, dependencyReady: true },
      { state: 'ready', registryReady: false, dependencyReady: true },
      { state: 'ready', registryReady: true, dependencyReady: false },
      { status: 'healthy' },
    ]
  ) {
    await assertRejects(
      () =>
        probeBackgroundChildren('fixture-apphost', {
          resolveUrls: () => Promise.resolve(['http://child.test']),
          fetch: () => Promise.resolve(Response.json(health)),
        }),
      Error,
      'requires ready with registryReady and dependencyReady',
    );
  }
});

Deno.test('streams probe fails absent resource, unhealthy response and false readiness body', async () => {
  const gate = readinessGates(SCAFFOLD.RUNTIME).find((entry) =>
    entry.id === 'behavior.streams-health'
  );
  if (gate?.kind !== 'command') throw new Error('streams command gate missing');
  const contract = parseHttpExchangeContract(gate.command(CONTEXT).at(-1)!);
  for (const response of [new Response(null, { status: 503 }), Response.json({ ready: false })]) {
    await assertRejects(
      () =>
        probeExchange(['http://streams.test'], '/health/ready', contract, {
          fetch: () => Promise.resolve(response),
          delay: () => Promise.resolve(),
          attempts: 1,
          retryDelayMs: 0,
          attemptTimeoutMs: 5_000,
        }),
      Error,
      'broke its contract',
    );
  }
  assertThrows(
    () =>
      resourceUrlsFromDescribeOutput(
        JSON.stringify({
          resources: [
            {
              displayName: 'streams-api',
              name: 'streams-api-instance',
              urls: ['http://sibling.test'],
            },
          ],
        }),
        'streams',
      ),
    Error,
    'was not present',
  );
});

async function withChildren(
  crashLoop: string | undefined,
  test: (resolveUrls: typeof resolveResourceUrlsFromAppHost) => Promise<void>,
): Promise<void> {
  const servers = new Map<string, Deno.HttpServer<Deno.NetAddr>>();
  try {
    for (const resource of KV_BACKGROUND_RUNTIME_RESOURCES) {
      const health = new ChildHealthMonitor(() => 0);
      health.registryLoaded();
      health.dependenciesReady();
      health.running();
      if (resource === crashLoop) {
        for (let restart = 0; restart < 3; restart++) health.restarting();
        assertEquals(health.snapshot().state, 'crash-looping');
      }
      servers.set(
        resource,
        Deno.serve(
          { hostname: '127.0.0.1', port: 0, onListen: () => {} },
          (request) => childHealthResponse(request, health.snapshot()),
        ),
      );
    }
    const resolved: string[] = [];
    await test((appHost, resource) =>
      resolveResourceUrlsFromAppHost(appHost, resource, async (_host, name) => {
        resolved.push(name);
        const server = servers.get(name);
        if (!server) throw new Error(`fixture omitted ${name}`);
        const update = parseResourceUpdateLine(
          JSON.stringify({
            displayName: name,
            name: `${name}-instance`,
            urls: [{ url: `http://127.0.0.1:${server.addr.port}` }],
          }),
          name,
        );
        return { waitFor: () => Promise.resolve(update), close: () => Promise.resolve() };
      })
    );
    assertEquals(
      resolved,
      crashLoop
        ? KV_BACKGROUND_RUNTIME_RESOURCES.slice(
          0,
          KV_BACKGROUND_RUNTIME_RESOURCES.indexOf(
            crashLoop as typeof KV_BACKGROUND_RUNTIME_RESOURCES[number],
          ) + 1,
        )
        : [...KV_BACKGROUND_RUNTIME_RESOURCES],
    );
  } finally {
    await Promise.all([...servers.values()].map((server) => server.shutdown()));
  }
}
