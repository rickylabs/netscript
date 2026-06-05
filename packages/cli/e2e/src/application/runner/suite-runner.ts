import type { RunReport } from '../../domain/report.ts';
import type { StepResult } from '../../domain/report.ts';
import type { GateDefinition } from '../../domain/gate-definition.ts';
import type { RunRequest } from '../../domain/run-context.ts';
import type { SuiteDefinition } from '../../domain/suite-definition.ts';
import { GATE } from '../../domain/cli-surface.ts';
import type { Clock } from '../../ports/clock.ts';
import type { CommandExecutor } from '../../ports/command-executor.ts';
import type { DockerResourceCleaner } from '../../ports/docker-resource-cleaner.ts';
import type { HttpClient } from '../../ports/http-client.ts';
import type { Reporter } from '../../ports/reporter.ts';
import { createSmokeProject } from '../builders/workspace/smoke-project-factory.ts';
import { buildExecutionPlan } from './execution-plan-builder.ts';
import { runGate } from './gate-runner.ts';

function selectCleanupGates(
  suite: SuiteDefinition,
  plan: readonly GateDefinition[],
  request: RunRequest,
): readonly GateDefinition[] {
  if (request.gateId) {
    const hasNonCleanupGate = plan.some((gate) => gate.phase !== 'cleanup');
    if (!request.options.cleanup || !hasNonCleanupGate) return [];
    // A targeted run only includes the requested gate in `plan`, but cleanup must still
    // execute the suite's full cleanup tail when that targeted gate is not itself cleanup.
    return suite.gates.filter((gate) => gate.phase === 'cleanup');
  }
  return plan.filter((gate) => gate.phase === 'cleanup' && request.options.cleanup);
}

function selectMainGates(
  plan: readonly GateDefinition[],
  request: RunRequest,
): readonly GateDefinition[] {
  const isTargetedCleanupRun = request.gateId && plan.every((gate) => gate.phase === 'cleanup');
  return isTargetedCleanupRun ? plan : plan.filter((gate) => gate.phase !== 'cleanup');
}

/** Dependencies required by the suite runner. */
export interface SuiteRunnerOptions {
  readonly clock: Clock;
  readonly commandExecutor: CommandExecutor;
  readonly httpClient: HttpClient;
  readonly dockerCleaner?: DockerResourceCleaner;
  readonly reporter: Reporter;
}

/** Executable suite runner. */
export interface SuiteRunner {
  run(suite: SuiteDefinition, request: RunRequest): Promise<RunReport>;
}

/** Create an application runner from injected ports. */
export function createSuiteRunner(options: SuiteRunnerOptions): SuiteRunner {
  return {
    async run(suite, request) {
      const startedAt = options.clock.now();
      const startedMs = options.clock.monotonicMs();
      const project = createSmokeProject(request.options);
      const context = { request, project };
      const snapshot = request.options.cleanup
        ? await options.dockerCleaner?.captureSnapshot()
        : undefined;
      const steps: StepResult[] = [];

      await options.reporter.emit({ type: 'suite-start', suiteId: suite.id });
      const plan = buildExecutionPlan(suite, request.gateId);
      const cleanupGates = selectCleanupGates(suite, plan, request);
      const mainGates = selectMainGates(plan, request);

      try {
        for (const gate of mainGates) {
          await options.reporter.emit({ type: 'gate-start', gateId: gate.id, title: gate.title });
          const step = await runGate(gate, context, options);
          steps.push(step);
          await options.reporter.emit({ type: 'gate-end', result: step });
          if (step.critical && step.verdict === 'failed') break;
        }
      } finally {
        for (const gate of cleanupGates) {
          await options.reporter.emit({ type: 'gate-start', gateId: gate.id, title: gate.title });
          const step = await runGate(gate, context, options);
          steps.push(step);
          await options.reporter.emit({ type: 'gate-end', result: step });
        }
        if (request.options.cleanup && snapshot) {
          const removed = await options.dockerCleaner?.pruneCreatedResources(snapshot);
          if (removed && removed.length > 0) {
            steps.push({
              id: GATE.CLEANUP_DOCKER_CREATED_CONTAINERS,
              title: 'Prune suite-created Docker containers',
              verdict: 'passed' as const,
              critical: false,
              durationMs: 0,
              evidence: [{ kind: 'docker' as const, label: 'removed containers', data: removed }],
            });
          }
        }
      }

      const failed = steps.filter((step) => step.verdict === 'failed').length;
      const report: RunReport = {
        ok: failed === 0,
        suiteId: suite.id,
        projectRoot: project.projectRoot,
        startedAt: startedAt.toISOString(),
        durationMs: Math.round(options.clock.monotonicMs() - startedMs),
        steps,
        summary: {
          passed: steps.filter((step) => step.verdict === 'passed').length,
          failed,
          skipped: steps.filter((step) => step.verdict === 'skipped').length,
        },
      };
      await options.reporter.emit({ type: 'suite-end', report });
      return report;
    },
  };
}
