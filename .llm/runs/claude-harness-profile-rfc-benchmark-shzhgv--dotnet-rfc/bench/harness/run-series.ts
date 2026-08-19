/**
 * S5/S6 series runner — drives ONE benchmark series through the worker plugin's real dispatch
 * path (queue → Worker task listener → processWorkerTask → MultiRuntimeTaskExecutor → adapter →
 * subprocess → TaskResult) or, in `direct` mode, straight through `executor.execute()` to
 * isolate dispatch overhead.
 *
 * Run from repo root (fresh process per series; the runner pins DENO_KV_URL to a fresh sqlite
 * file so queue + state stores are isolated — plan.md R4):
 *
 *   deno run --allow-all --unstable-kv bench/harness/run-series.ts \
 *     --subject A-deno --workload short --mode queue --concurrency 1 \
 *     --warmup 20 --measure 300 --out results/raw/A-deno_short_queue_c1.jsonl
 *
 * Output: JSONL — one `meta` record, N `exec` records, periodic `hostRss` records, one `summary`.
 */

import { createWorkersServiceRuntime } from '../../../../../plugins/workers/services/src/service-runtime.ts';
import { startTaskQueueListener } from '../../../../../plugins/workers/worker/queue-consumer.ts';
import { createWorkerPool } from '../../../../../plugins/workers/worker/job-runner-pool.ts';
import type {
  WorkerDispatchContext,
  WorkerQueueContext,
} from '../../../../../plugins/workers/worker/worker-options.ts';
import { createDefaultTaskExecutor } from '@netscript/plugin-workers-core/executor';
import type {
  TaskDefinition as ExecutorTaskDefinition,
  TaskExecutionOptions,
  TaskResult,
} from '@netscript/plugin-workers-core/executor';
import type { TaskDefinition } from '@netscript/plugin-workers-core/registry';
import { createQueue } from '@netscript/queue';
import type { TaskMessage } from '@netscript/plugin-workers-core/runtime';

const SUBJECTS = ['H1-dotnet-run', 'H2-dotnet-fd', 'H3-dotnet-aot', 'H3x-executable-control'] as const;
type SubjectId = typeof SUBJECTS[number];
const WORKLOADS = { short: 100_000, long: 10_000_000 } as const;
type WorkloadId = keyof typeof WORKLOADS;
type SeriesMode = 'queue' | 'direct';

const SEED = 42;
const TASK_TIMEOUT_MS = 120_000;
const QUEUE_NAME = 'tasks'; // the production queue name the tasks router uses
const RSS_SAMPLE_MS = 500;

const RUN_DIR = new URL('../..', import.meta.url).pathname; // .llm/runs/<run-id>/
const BUILD = `${RUN_DIR}bench/tasks/build`;
const TASKS = `${RUN_DIR}bench/tasks`;

function taskDefinition(subject: SubjectId, workload: WorkloadId, taskId: string): TaskDefinition {
  const n = String(WORKLOADS[workload]);
  // Full registry shape; maxRetries 0, maxConcurrency 128 (run-1 lessons). Subjects H1-H3
  // dispatch through the REAL DotNetRuntimeAdapter (this RFC's subject): H1 = .cs entrypoint
  // (buildDotNetCommand -> `dotnet run <file.cs>`), H2/H3 = direct-executable mode (entrypoint
  // is the published binary). H3x re-dispatches the AOT binary via ExecutableRuntimeAdapter as
  // the adapter-seam control (expected == H3).
  const base = {
    id: taskId,
    name: taskId,
    topic: 'tasks',
    timeout: TASK_TIMEOUT_MS,
    maxRetries: 0,
    priority: 50,
    enabled: true,
    tags: ['bench'],
    source: 'local' as const,
    args: [n, String(SEED)],
    timezone: 'UTC',
    retryDelay: 1000,
    maxConcurrency: 128,
    persist: true,
  };
  switch (subject) {
    case 'H1-dotnet-run':
      return { ...base, type: 'dotnet', entrypoint: `${TASKS}/task-standalone.cs` };
    case 'H2-dotnet-fd':
      return { ...base, type: 'dotnet', entrypoint: `${TASKS}/csharp-lcg/build/fd/task-csharp` };
    case 'H3-dotnet-aot':
      return { ...base, type: 'dotnet', entrypoint: `${TASKS}/csharp-lcg/build/aot/task-csharp` };
    case 'H3x-executable-control':
      return { ...base, type: 'executable', entrypoint: `${TASKS}/csharp-lcg/build/aot/task-csharp` };
  }
}

type ExecCapture = {
  executorWallMs: number;
  adapterDurationMs: number;
  exitCode: number;
  status: string;
  acc: number | null;
  vmHwmKb: number | null;
};

/** Decorating executor implementing the WorkerTaskExecutor port; delegates to the default. */
function makeMeasuringExecutor(captures: Map<number, ExecCapture>) {
  const inner = createDefaultTaskExecutor();
  return {
    execute: async (
      task: ExecutorTaskDefinition,
      options: TaskExecutionOptions,
    ): Promise<TaskResult> => {
      const seq = msgSeqFromOptions(options);
      const t0 = performance.now();
      const result = await inner.execute(task, options);
      const executorWallMs = performance.now() - t0;
      if (seq !== null) {
        captures.set(seq, {
          executorWallMs,
          adapterDurationMs: result.duration,
          exitCode: result.exitCode,
          status: result.status,
          acc: numOrNull(result.result?.acc),
          vmHwmKb: numOrNull(result.result?.vmHwmKb),
        });
      }
      return result;
    },
    supports: (task: ExecutorTaskDefinition) => inner.supports(task),
  };
}

function msgSeqFromOptions(options: TaskExecutionOptions): number | null {
  const raw = options.env?.TASK_PAYLOAD;
  if (!raw) return null;
  try {
    const payload = JSON.parse(raw) as { msgSeq?: number };
    return typeof payload.msgSeq === 'number' ? payload.msgSeq : null;
  } catch {
    return null;
  }
}

function numOrNull(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

function arg(name: string, fallback?: string): string {
  const i = Deno.args.indexOf(`--${name}`);
  if (i >= 0 && Deno.args[i + 1]) return Deno.args[i + 1];
  if (fallback !== undefined) return fallback;
  throw new Error(`Missing --${name}`);
}

async function main(): Promise<void> {
  const subject = arg('subject') as SubjectId;
  if (!SUBJECTS.includes(subject)) throw new Error(`Unknown subject ${subject}`);
  const workload = arg('workload') as WorkloadId;
  const mode = arg('mode') as SeriesMode;
  const concurrency = Number(arg('concurrency', '1'));
  const warmup = Number(arg('warmup', '20'));
  const measure = Number(arg('measure', '300'));
  const outPath = `${RUN_DIR}${arg('out')}`;
  const total = warmup + measure;
  const seriesId = `${subject}_${workload}_${mode}_c${concurrency}`;

  // Fresh-KV isolation (plan.md R4): pin queue + state stores to a new sqlite file.
  const kvDir = await Deno.makeTempDir({ prefix: `bench-kv-${seriesId}-` });
  const kvPath = `${kvDir}/kv.sqlite`;
  Deno.env.set('DENO_KV_URL', kvPath);

  const lines: string[] = [];
  const emit = (obj: Record<string, unknown>) => lines.push(JSON.stringify(obj));
  emit({
    kind: 'meta',
    seriesId,
    subject,
    workload,
    mode,
    concurrency,
    warmup,
    measure,
    iterations: WORKLOADS[workload],
    seed: SEED,
    kvPath,
    startedAt: new Date().toISOString(),
  });

  const rssTimer = setInterval(() => {
    try {
      const status = Deno.readTextFileSync('/proc/self/status');
      const vmRss = status.match(/VmRSS:\s*(\d+)/)?.[1];
      const vmHwm = status.match(/VmHWM:\s*(\d+)/)?.[1];
      emit({ kind: 'hostRss', tMs: performance.now(), vmRssKb: Number(vmRss), vmHwmKb: Number(vmHwm) });
    } catch { /* /proc read failed; skip sample */ }
  }, RSS_SAMPLE_MS);

  const captures = new Map<number, ExecCapture>();
  const taskId = `bench-${seriesId}`;
  const def = taskDefinition(subject, workload, taskId);
  const enqueuedAt = new Map<number, number>();
  const completedAt = new Map<number, number>();
  let failures = 0;

  if (mode === 'direct') {
    const executor = makeMeasuringExecutor(captures);
    let next = 0;
    const runOne = async (seq: number) => {
      enqueuedAt.set(seq, performance.now());
      const result = await executor.execute(def, {
        env: { TASK_ID: taskId, TASK_PAYLOAD: JSON.stringify({ msgSeq: seq }) },
        timeout: TASK_TIMEOUT_MS,
      });
      completedAt.set(seq, performance.now());
      if (!result.success) failures++;
    };
    const workers: Promise<void>[] = [];
    for (let w = 0; w < concurrency; w++) {
      workers.push((async () => {
        while (true) {
          const seq = next++;
          if (seq >= total) return;
          await runOne(seq);
        }
      })());
    }
    await Promise.all(workers);
  } else {
    const trace = (m: string) => console.error(`[series ${((performance.now()) / 1000).toFixed(1)}s] ${m}`);
    trace('creating runtime');
    const runtime = createWorkersServiceRuntime();
    const executor = makeMeasuringExecutor(captures);
    await runtime.taskRegistry.register(taskId, def);
    trace('task registered');

    let resolveDone!: () => void;
    const done = new Promise<void>((r) => (resolveDone = r));
    let completed = 0;
    let next = 0;
    const queue = createQueue<TaskMessage>(QUEUE_NAME);

    const enqueueNext = async () => {
      while (next < total && next - completed < concurrency) {
        const seq = next++;
        enqueuedAt.set(seq, performance.now());
        await queue.enqueue({
          taskId,
          topic: 'tasks',
          triggeredBy: 'api',
          triggeredAt: new Date().toISOString(),
          payload: { msgSeq: seq },
          priority: 50,
          idempotencyKey: `${seriesId}-${seq}`,
        });
      }
    };

    runtime.executionState.setMutationHook((event) => {
      if (event.type !== 'updated') return;
      const status = event.execution.status;
      if (status !== 'completed' && status !== 'failed' && status !== 'timeout') return;
      const seq = (event.execution.payload as { msgSeq?: number } | undefined)?.msgSeq;
      if (typeof seq !== 'number' || completedAt.has(seq)) return;
      completedAt.set(seq, performance.now());
      if (status !== 'completed') failures++;
      completed++;
      if (completed >= total) {
        resolveDone();
      } else {
        enqueueNext().catch((e) => console.error('enqueue failed', e));
      }
    });

    // Task-listener-only boot. The full Worker also runs a jobs listener on the same local KV
    // database; Deno KV has a single queue per database and the adapter envelope carries no
    // queue name, so the jobs listener steals 'tasks' messages (drift D-5). The contexts below
    // mirror Worker.dispatchContext()/queueContext() (plugins/workers/worker/worker.ts:315-349)
    // verbatim; listener, dispatcher, executor, queue, and state remain production code.
    const workerId = `bench-worker-${seriesId}`;
    const pool = createWorkerPool();
    await pool.initialize();
    const abort = new AbortController();
    const dispatchContext: WorkerDispatchContext = {
      workerId,
      registry: runtime.jobRegistry,
      executionState: runtime.executionState,
      taskExecutor: executor,
      taskRegistry: runtime.taskRegistry,
      idempotency: runtime.idempotency,
      workerPool: pool,
      jobsDir: './jobs',
      activeJobs: new Map(),
      workerSpan: null,
    };
    const queueContext: WorkerQueueContext = {
      workerId,
      registry: runtime.jobRegistry,
      queueTriggers: [],
      triggerQueues: [],
      abortController: abort,
      processJob: () => Promise.resolve(),
      setTaskQueue: () => {},
      reportListenerFailure: (name, error) =>
        console.error(`[bench] listener failure ${name}:`, error),
      listenerMaxRestarts: 5,
      listenerInitialBackoffMs: 100,
      listenerMaxBackoffMs: 5000,
    };
    trace('starting task queue listener');
    startTaskQueueListener(queueContext, dispatchContext);
    await enqueueNext();
    trace(`initial enqueue done (next=${next})`);

    const deadline = setTimeout(() => {
      emit({ kind: 'error', message: `series deadline exceeded (completed=${completed}/${total})` });
      resolveDone();
    }, 30 * 60 * 1000);
    await done;
    clearTimeout(deadline);
    abort.abort();
  }

  clearInterval(rssTimer);

  for (let seq = 0; seq < total; seq++) {
    const cap = captures.get(seq);
    const enq = enqueuedAt.get(seq);
    const comp = completedAt.get(seq);
    emit({
      kind: 'exec',
      seq,
      warmup: seq < warmup,
      enqueuedAtMs: enq ?? null,
      completedAtMs: comp ?? null,
      endToEndMs: enq !== undefined && comp !== undefined ? comp - enq : null,
      executorWallMs: cap?.executorWallMs ?? null,
      adapterDurationMs: cap?.adapterDurationMs ?? null,
      exitCode: cap?.exitCode ?? null,
      status: cap?.status ?? 'missing',
      acc: cap?.acc ?? null,
      vmHwmKb: cap?.vmHwmKb ?? null,
    });
  }
  emit({ kind: 'summary', seriesId, total, failures, finishedAt: new Date().toISOString() });

  await Deno.mkdir(outPath.substring(0, outPath.lastIndexOf('/')), { recursive: true });
  await Deno.writeTextFile(outPath, lines.join('\n') + '\n');
  await Deno.remove(kvDir, { recursive: true }).catch(() => {});
  console.log(`${seriesId}: total=${total} failures=${failures} -> ${outPath}`);
  if (failures > total * 0.02) {
    console.error('FAIL: >2% failures — protocol-invalidating (plan.md lifecycle design)');
    Deno.exit(1);
  }
  // KV listener holds the event loop; series is complete and flushed — exit explicitly.
  Deno.exit(0);
}

await main();
