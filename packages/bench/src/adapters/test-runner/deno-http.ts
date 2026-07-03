/**
 * Deno HTTP test runner: boots the candidate NetScript service in the sandbox
 * and runs a task's frozen suite against it over HTTP.
 *
 * Every collaborator is injected — the suite loader, the HTTP client, the
 * command executor that boots/stops the service, and the clock — so the runner
 * is fully unit-testable with fakes and never requires a live service or a paid
 * agent. The live wiring (real `FetchHttpClient`, `DenoCommandExecutor`) is
 * supplied only in Slice 1b's conformance path.
 *
 * @module
 */

import type { FrozenSuite, ProbeContext } from '../../domain/frozen-suite.ts';
import type { ProbeResult } from '../../domain/test-run.ts';
import { summarizeProbes } from '../../domain/test-run.ts';
import type { TestRunResult } from '../../domain/test-run.ts';
import type { HttpClient } from '../../ports/http-client.ts';
import type { CommandHandle } from '../../ports/command-executor.ts';
import type { Clock } from '../../ports/clock.ts';
import type { TestRunner, TestRunRequest } from '../../ports/test-runner.ts';

/** Loads a frozen suite for a given suite module path. */
export interface SuiteLoader {
  load(suitePath: string): Promise<FrozenSuite>;
}

/** Boots (and reboots) the service under test, returning a health base URL. */
export interface ServiceHarness {
  /** Boot the service in `workdir`; resolve to a healthy base URL + handle. */
  boot(workdir: string, timeoutMs: number): Promise<BootedService>;
}

/** A booted service instance. */
export interface BootedService {
  readonly baseUrl: string;
  readonly handle: CommandHandle;
  /** Restart preserving persistence; resolve once healthy again. */
  restart(): Promise<string>;
}

/** Dependencies for {@link DenoHttpTestRunner}. */
export interface DenoHttpTestRunnerDeps {
  readonly loader: SuiteLoader;
  readonly harness: ServiceHarness;
  readonly http: HttpClient;
  readonly clock: Clock;
}

/** Default dynamic-import suite loader (used outside unit tests). */
export class DynamicImportSuiteLoader implements SuiteLoader {
  async load(suitePath: string): Promise<FrozenSuite> {
    const url = suitePath.startsWith('file:') ? suitePath : `file://${suitePath}`;
    const module = await import(url);
    const suite = module.suite ?? module.default;
    if (suite === undefined) {
      throw new Error(`frozen suite module '${suitePath}' has no 'suite' export`);
    }
    return suite as FrozenSuite;
  }
}

/** {@link TestRunner} that boots a service and runs a frozen HTTP suite. */
export class DenoHttpTestRunner implements TestRunner {
  readonly #deps: DenoHttpTestRunnerDeps;

  constructor(deps: DenoHttpTestRunnerDeps) {
    this.#deps = deps;
  }

  async run(request: TestRunRequest): Promise<TestRunResult> {
    const { loader, harness, http, clock } = this.#deps;
    const startMs = clock.monotonicMs();
    const suite = await loader.load(request.suitePath);

    const service = await harness.boot(request.workdir, request.timeoutMs);
    let baseUrl = service.baseUrl;

    const ctx: ProbeContext = {
      get baseUrl(): string {
        return baseUrl;
      },
      http,
      restart: async (): Promise<void> => {
        baseUrl = await service.restart();
      },
    };

    const probes: ProbeResult[] = [];
    try {
      for (const probe of suite.probes) {
        probes.push(await runProbe(probe, ctx, clock));
      }
    } finally {
      await service.handle.stop();
    }

    return summarizeProbes(probes, clock.monotonicMs() - startMs);
  }
}

async function runProbe(
  probe: FrozenSuite['probes'][number],
  ctx: ProbeContext,
  clock: Clock,
): Promise<ProbeResult> {
  const start = clock.monotonicMs();
  try {
    await probe.run(ctx);
    return {
      id: probe.id,
      title: probe.title,
      verdict: 'pass',
      durationMs: clock.monotonicMs() - start,
    };
  } catch (error) {
    return {
      id: probe.id,
      title: probe.title,
      verdict: 'fail',
      durationMs: clock.monotonicMs() - start,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
