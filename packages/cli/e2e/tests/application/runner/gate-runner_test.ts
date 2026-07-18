import { assertEquals } from '@std/assert';
import { runGate } from '../../../src/application/runner/gate-runner.ts';
import { GATE, GATE_PHASE, SCAFFOLD } from '../../../src/domain/cli-surface.ts';
import type { GateDefinition } from '../../../src/domain/gate-definition.ts';
import type { RunContext, RunOptions } from '../../../src/domain/run-context.ts';
import type { Clock } from '../../../src/ports/clock.ts';
import type { CommandExecutor } from '../../../src/ports/command-executor.ts';
import type { HttpClient } from '../../../src/ports/http-client.ts';

Deno.test('platform-inapplicable gate emits machine-readable NOT_RUN without execution', async () => {
  let executions = 0;
  const gate: GateDefinition = {
    id: GATE.DEPLOY_DESKTOP_PREFLIGHT,
    title: 'Desktop native preflight',
    phase: GATE_PHASE.PREFLIGHT,
    kind: 'command',
    critical: true,
    platforms: ['windows'],
    cwd: () => '.',
    command: () => ['should-not-run'],
  };
  const result = await runGate(gate, createContext(), {
    clock: new FakeClock(),
    platform: { current: () => 'linux' },
    commandExecutor: {
      run: () => {
        executions += 1;
        throw new Error('inapplicable gate executed');
      },
    } satisfies CommandExecutor,
    httpClient: {} as HttpClient,
  });

  assertEquals(executions, 0);
  assertEquals(result.verdict, 'skipped');
  assertEquals(result.evidence, [{
    kind: 'summary',
    label: 'platform applicability',
    data: {
      status: 'NOT_RUN',
      platform: 'linux',
      supportedPlatforms: ['windows'],
      reason: 'Gate requires one of: windows.',
    },
  }]);
});

function createContext(): RunContext {
  return {
    request: {
      suiteId: SCAFFOLD.RUNTIME,
      options: {
        repoRoot: '.',
        cliEntrypoint: './packages/cli/bin/netscript.ts',
        smokeRoot: '.llm/tmp/cli-e2e',
        projectName: 'platform-gate-test',
        database: 'postgres',
        packageSource: 'local',
        plugins: [],
        samples: false,
        cleanup: false,
        format: 'json',
        commandTimeoutMs: 1_000,
        httpTimeoutMs: 1_000,
      } satisfies RunOptions,
    },
    project: {
      repoRoot: '.',
      cliEntrypoint: './packages/cli/bin/netscript.ts',
      smokeRoot: '.llm/tmp/cli-e2e',
      projectName: 'platform-gate-test',
      projectRoot: '.llm/tmp/cli-e2e/platform-gate-test',
      appHost: '.llm/tmp/cli-e2e/platform-gate-test/aspire/apphost.mts',
    },
  };
}

class FakeClock implements Clock {
  #time = 0;
  now(): Date {
    return new Date('2026-07-18T00:00:00.000Z');
  }
  monotonicMs(): number {
    return this.#time++;
  }
}
