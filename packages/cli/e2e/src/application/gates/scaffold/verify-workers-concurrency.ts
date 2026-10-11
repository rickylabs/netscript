import { parseAppSettings } from '@netscript/aspire/config';
import { WorkerAttributes } from '@netscript/telemetry/attributes';
import type { TelemetrySpan } from '@netscript/telemetry/query';
import { join } from '@std/path';
import { createLiveAspireTelemetryQuery } from './aspire-dashboard-telemetry.ts';

/** Require a completed job in the generated background service to report its declared concurrency. */
export function assertWorkersConcurrency(
  spans: readonly TelemetrySpan[],
  declared: number,
): TelemetrySpan {
  const executions = spans.filter((span) =>
    span.name === 'job.execute' && span.attributes['netscript.job.id'] === 'health-check'
  );
  if (executions.length === 0) {
    throw new Error('No generated health-check job execution was observed');
  }
  for (const span of executions) {
    const actual = span.attributes[WorkerAttributes.WORKER_CONCURRENCY];
    if (actual !== declared) {
      throw new Error(
        `Generated workers concurrency mismatch: declared=${declared}, observed=${actual}`,
      );
    }
  }
  return executions[executions.length - 1]!;
}

/** Read the workers declaration from the generated project's root configuration. */
export async function readWorkersConcurrency(projectRoot: string) {
  if (!projectRoot) throw new Error('Generated project root is required');
  const { config } = await parseAppSettings(join(projectRoot, 'appsettings.json'));
  const entry = config.BackgroundProcessors.workers;
  if (entry?.ConcurrencyEnvVar !== 'WORKERS_CONCURRENCY' || !entry.Concurrency) {
    throw new Error('Generated workers metadata must declare WORKERS_CONCURRENCY and concurrency');
  }
  return { Concurrency: entry.Concurrency, ConcurrencyEnvVar: entry.ConcurrencyEnvVar };
}

async function main(projectRoot: string): Promise<void> {
  const entry = await readWorkersConcurrency(projectRoot);
  const query = await createLiveAspireTelemetryQuery(projectRoot);
  let lastFailure = 'No telemetry read completed';
  for (let attempt = 0; attempt < 30; attempt++) {
    try {
      const spans = await query.querySpans({ serviceName: 'workers', limit: 100 });
      const span = assertWorkersConcurrency(spans, entry.Concurrency);
      const receiptDir = join(projectRoot, '.netscript', 'e2e');
      await Deno.mkdir(receiptDir, { recursive: true });
      await Deno.writeTextFile(
        join(receiptDir, 'workers-concurrency-receipt.json'),
        JSON.stringify(
          {
            resource: 'workers',
            environmentVariable: entry.ConcurrencyEnvVar,
            declared: entry.Concurrency,
            observed: span.attributes[WorkerAttributes.WORKER_CONCURRENCY],
            traceId: span.traceId,
            spanId: span.spanId,
          },
          null,
          2,
        ),
      );
      console.info(
        `Generated workers concurrency PASS: declared=${entry.Concurrency}, observed=${
          span.attributes[WorkerAttributes.WORKER_CONCURRENCY]
        }`,
      );
      return;
    } catch (error) {
      lastFailure = error instanceof Error ? error.message : String(error);
    }
    if (attempt < 29) await new Promise((resolve) => setTimeout(resolve, 2_000));
  }
  throw new Error(`Generated workers concurrency did not converge: ${lastFailure}`);
}

if (import.meta.main) await main(Deno.args[0] ?? '');
