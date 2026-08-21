/**
 * K4 series runner — protocol overhead through the REAL dispatch path (plan L8/K4).
 * Adapted from run-4's run-series.ts (methodology unchanged: fresh-KV isolation,
 * task-listener-only boot mirroring worker.ts contexts, measuring executor keyed by msgSeq).
 *
 * Subjects:
 *   BASE-go — run-4 baseline binary, argv contract (bytes-identical methodology to #1686)
 *   T1-go   — Tier-1 protocol subject: Zod-validated envelope in TASK_PAYLOAD (in-path,
 *             pre-spawn), task emits started/progress/result sentinel frames, in-path
 *             sentinel demux + Zod result validation from TaskResult.stdout.
 *
 *   deno run --allow-all --unstable-kv bench/spikes/k4/run-k4-series.ts \
 *     --subject T1-go --mode queue --concurrency 1 --warmup 20 --measure 300 \
 *     --out results/raw/k4_T1-go_queue_c1.jsonl
 */

import { createWorkersServiceRuntime } from '../../../../../../plugins/workers/services/src/service-runtime.ts';
import { startTaskQueueListener } from '../../../../../../plugins/workers/worker/queue-consumer.ts';
import { createWorkerPool } from '../../../../../../plugins/workers/worker/job-runner-pool.ts';
import type {
  WorkerDispatchContext,
  WorkerQueueContext,
} from '../../../../../../plugins/workers/worker/worker-options.ts';
import { createDefaultTaskExecutor } from '@netscript/plugin-workers-core/executor';
import type {
  TaskDefinition as ExecutorTaskDefinition,
  TaskExecutionOptions,
  TaskResult,
} from '@netscript/plugin-workers-core/executor';
import type { TaskDefinition } from '@netscript/plugin-workers-core/registry';
import { createQueue } from '@netscript/queue';
import type { TaskMessage } from '@netscript/plugin-workers-core/runtime';
import { z } from 'npm:zod@4'; // bare 'zod' is not in the root import map from run-dir modules

const SUBJECTS = ['BASE-go', 'T1-go'] as const;
type SubjectId = typeof SUBJECTS[number];
const N = 100_000; // short workload; overhead is dispatch-dominated
const EXPECTED_ACC = 846234426;
const SEED = 42;
const TASK_TIMEOUT_MS = 120_000;
const QUEUE_NAME = 'tasks';
const SENTINEL = '\x00NSF\x00';

const RUN_DIR = new URL('../../..', import.meta.url).pathname;
const RUNS_ROOT = new URL('../../../..', import.meta.url).pathname;
const BASE_BIN = `${RUNS_ROOT}claude-harness-profile-rfc-benchmark-shzhgv--golang-rfc/bench/tasks/go-lcg/build/task-go`;
const T1_BIN = `${RUN_DIR}bench/spikes/k4/bin/task-t1`;

// --- Tier-1 protocol schemas (the L3/L4 shapes, spike edition) ---
const EnvelopeSchema = z.object({
  v: z.literal(1),
  taskId: z.string(),
  executionId: z.string(),
  attempt: z.number().int().min(0),
  deadlineMs: z.number(),
  traceparent: z.string(),
  payload: z.object({ n: z.number().int(), seed: z.number().int() }),
  msgSeq: z.number().int(),
});
const ResultFrameSchema = z.object({
  v: z.literal(1),
  t: z.literal('result'),
  outcome: z.enum(['ok', 'error', 'cancelled']),
  acc: z.number().optional(),
  msgSeq: z.number().optional(),
  vmHwmKb: z.number().nullable().optional(),
});

function demuxFrames(stdout: string): Array<Record<string, unknown>> {
  const frames: Array<Record<string, unknown>> = [];
  let idx = 0;
  while ((idx = stdout.indexOf(SENTINEL, idx)) >= 0) {
    const nl = stdout.indexOf('\n', idx);
    const body = stdout.slice(idx + SENTINEL.length, nl < 0 ? undefined : nl);
    try {
      const f = JSON.parse(body);
      if (f && typeof f.t === 'string') frames.push(f);
    } catch { /* malformed-sentinel: log, not frame */ }
    idx = nl < 0 ? stdout.length : nl + 1;
  }
  return frames;
}

function taskDefinition(subject: SubjectId, taskId: string): TaskDefinition {
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
    timezone: 'UTC',
    retryDelay: 1000,
    maxConcurrency: 128,
    persist: true,
  };
  if (subject === 'BASE-go') {
    return { ...base, type: 'executable', entrypoint: BASE_BIN, args: [String(N), String(SEED)] };
  }
  return { ...base, type: 'executable', entrypoint: T1_BIN, args: [] };
}

type ExecCapture = {
  executorWallMs: number;
  adapterDurationMs: number;
  exitCode: number;
  status: string;
  acc: number | null;
  protoHostMs: number | null; // in-path host-side protocol cost (validate + demux + result-parse)
  framesSeen: number | null;
};

function makeMeasuringExecutor(subject: SubjectId, captures: Map<number, ExecCapture>) {
  const inner = createDefaultTaskExecutor();
  return {
    execute: async (
      task: ExecutorTaskDefinition,
      options: TaskExecutionOptions,
    ): Promise<TaskResult> => {
      const seq = msgSeqFromOptions(options);
      let protoHostMs = 0;
      if (subject === 'T1-go') {
        // pre-spawn: envelope validation (the boundary check the engine will own)
        const tv0 = performance.now();
        const parsed = EnvelopeSchema.safeParse(JSON.parse(options.env?.TASK_PAYLOAD ?? '{}'));
        protoHostMs += performance.now() - tv0;
        if (!parsed.success) throw new Error('envelope invalid: ' + parsed.error.message);
      }
      const t0 = performance.now();
      const result = await inner.execute(task, options);
      const executorWallMs = performance.now() - t0;
      let acc: number | null = null;
      let framesSeen: number | null = null;
      if (subject === 'T1-go') {
        const td0 = performance.now();
        const frames = demuxFrames(result.stdout ?? '');
        const resultFrame = frames.find((f) => f.t === 'result');
        const rf = ResultFrameSchema.safeParse(resultFrame);
        protoHostMs += performance.now() - td0;
        framesSeen = frames.length;
        acc = rf.success && rf.data.outcome === 'ok' ? rf.data.acc ?? null : null;
      } else {
        acc = numOrNull((result.result as Record<string, unknown> | null)?.acc);
      }
      if (seq !== null) {
        captures.set(seq, {
          executorWallMs,
          adapterDurationMs: result.duration,
          exitCode: result.exitCode,
          status: result.status,
          acc,
          protoHostMs: subject === 'T1-go' ? protoHostMs : null,
          framesSeen,
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

function messagePayload(subject: SubjectId, taskId: string, seriesId: string, seq: number): Record<string, unknown> {
  if (subject === 'BASE-go') return { msgSeq: seq };
  return {
    v: 1,
    taskId,
    executionId: `${seriesId}-${seq}`,
    attempt: 0,
    deadlineMs: Date.now() + TASK_TIMEOUT_MS,
    traceparent: '00-' + '0'.repeat(31) + '1-' + '0'.repeat(15) + '1-01',
    payload: { n: N, seed: SEED },
    msgSeq: seq,
  };
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
  const mode = arg('mode') as 'queue' | 'direct';
  const concurrency = Number(arg('concurrency', '1'));
  const warmup = Number(arg('warmup', '20'));
  const measure = Number(arg('measure', '300'));
  const outPath = `${RUN_DIR}${arg('out')}`;
  const total = warmup + measure;
  const seriesId = `k4_${subject}_${mode}_c${concurrency}`;

  const kvDir = await Deno.makeTempDir({ prefix: `bench-kv-${seriesId}-` });
  Deno.env.set('DENO_KV_URL', `${kvDir}/kv.sqlite`);

  const lines: string[] = [];
  const emit = (obj: Record<string, unknown>) => lines.push(JSON.stringify(obj));
  emit({ kind: 'meta', seriesId, subject, mode, concurrency, warmup, measure, n: N, seed: SEED, startedAt: new Date().toISOString() });

  const captures = new Map<number, ExecCapture>();
  const taskId = `bench-${seriesId}`;
  const def = taskDefinition(subject, taskId);
  const enqueuedAt = new Map<number, number>();
  const completedAt = new Map<number, number>();
  let failures = 0;

  if (mode === 'direct') {
    const executor = makeMeasuringExecutor(subject, captures);
    let next = 0;
    const runOne = async (seq: number) => {
      enqueuedAt.set(seq, performance.now());
      const result = await executor.execute(def, {
        env: { TASK_ID: taskId, TASK_PAYLOAD: JSON.stringify(messagePayload(subject, taskId, seriesId, seq)) },
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
    const runtime = createWorkersServiceRuntime();
    const executor = makeMeasuringExecutor(subject, captures);
    await runtime.taskRegistry.register(taskId, def);

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
          payload: messagePayload(subject, taskId, seriesId, seq),
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
      if (completed >= total) resolveDone();
      else enqueueNext().catch((e) => console.error('enqueue failed', e));
    });

    // Task-listener-only boot (run-1 D-5 rationale); contexts mirror worker.ts:315-349.
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
      reportListenerFailure: (name, error) => console.error(`[bench] listener failure ${name}:`, error),
      listenerMaxRestarts: 5,
      listenerInitialBackoffMs: 100,
      listenerMaxBackoffMs: 5000,
    };
    startTaskQueueListener(queueContext, dispatchContext);
    await enqueueNext();

    const deadline = setTimeout(() => {
      emit({ kind: 'error', message: `series deadline exceeded (completed=${completed}/${total})` });
      resolveDone();
    }, 30 * 60 * 1000);
    await done;
    clearTimeout(deadline);
    abort.abort();
  }

  let accFailures = 0;
  for (let seq = 0; seq < total; seq++) {
    const cap = captures.get(seq);
    const enq = enqueuedAt.get(seq);
    const comp = completedAt.get(seq);
    if (cap && cap.acc !== EXPECTED_ACC) accFailures++;
    emit({
      kind: 'exec',
      seq,
      warmup: seq < warmup,
      endToEndMs: enq !== undefined && comp !== undefined ? comp - enq : null,
      executorWallMs: cap?.executorWallMs ?? null,
      adapterDurationMs: cap?.adapterDurationMs ?? null,
      protoHostMs: cap?.protoHostMs ?? null,
      framesSeen: cap?.framesSeen ?? null,
      exitCode: cap?.exitCode ?? null,
      status: cap?.status ?? 'missing',
      acc: cap?.acc ?? null,
    });
  }
  emit({ kind: 'summary', seriesId, total, failures, accFailures, finishedAt: new Date().toISOString() });

  await Deno.mkdir(outPath.substring(0, outPath.lastIndexOf('/')), { recursive: true });
  await Deno.writeTextFile(outPath, lines.join('\n') + '\n');
  await Deno.remove(kvDir, { recursive: true }).catch(() => {});
  console.log(`${seriesId}: total=${total} failures=${failures} accFailures=${accFailures} -> ${outPath}`);
  if (failures > 0 || accFailures > 0) {
    console.error('FAIL: failures in series');
    Deno.exit(1);
  }
  Deno.exit(0);
}

await main();
