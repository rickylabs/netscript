/**
 * Benchmark runner shared by the container CLI (bench/bench.ts) and the
 * installable's `--bench` mode, so laptop numbers use the same method.
 *
 * Per variant: cold start (spawn → data-backed frame painted, fresh profile),
 * steady memory over the process tree, idle CPU (0 events/s), active CPU
 * (20 events/s: live feed, job progress, aggregate refetch), parallel instances.
 */
import { killTree, sampleTree } from './probe.ts';

export interface BenchVariant {
  readonly id: string;
  readonly label: string;
  readonly command: string;
  readonly args?: readonly string[];
  /** Profile via env (webview hosts) instead of `--profile=` (GPUIX). */
  readonly profileViaEnv?: boolean;
}

export interface BenchOptions {
  readonly variants: readonly BenchVariant[];
  readonly runs?: number;
  readonly activeRuns?: number;
  readonly parallel?: readonly number[];
  readonly idleWindowMs?: number;
  readonly log?: (line: string) => void;
  readonly onPartial?: (report: BenchReport) => Promise<void> | void;
}

export interface VariantResult {
  label: string;
  coldStartMs: { median: number; min: number; max: number; samples: number[] };
  memoryMb: { rssMedian: number; pssMedian: number | null };
  processCount: number;
  processes: ReadonlyArray<{ name: string; rssMb: number }>;
  idleCpuPct: { median: number; samples: number[] };
  activeCpuPct: { median: number; samples: number[]; rssMedianMb: number };
  parallel: Array<{ instances: number; allReadyMs: number; totalRssMb: number; totalPssMb: number | null; rssPerInstanceMb: number }>;
}

export interface BenchReport {
  environment: Record<string, unknown>;
  variants: Record<string, VariantResult>;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const round = (value: number, digits = 1) => Math.round(value * 10 ** digits) / 10 ** digits;
const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted.length === 0 ? NaN : sorted[Math.floor(sorted.length / 2)];
};

interface Running {
  child: Deno.ChildProcess;
  ready: Promise<number>;
  profile: string;
}

async function launch(variant: BenchVariant, rate: number, tag: string): Promise<Running> {
  const profile = await Deno.makeTempDir({ prefix: `ns-bench-${variant.id}-${tag}-` });
  const env: Record<string, string> = { NETSCRIPT_BENCH: '1', NETSCRIPT_BENCH_RATE: String(rate), NETSCRIPT_BENCH_CHILD: '1' };
  const args = [...(variant.args ?? [])];
  if (variant.profileViaEnv) env.NETSCRIPT_BENCH_PROFILE = profile;
  else args.push(`--profile=${profile}`);
  const started = performance.now();
  const child = new Deno.Command(variant.command, { args, env, stdout: 'piped', stderr: 'null', stdin: 'null' }).spawn();
  const ready = (async () => {
    const decoder = new TextDecoder();
    let buffer = '';
    const reader = child.stdout.getReader();
    while (true) {
      const { value, done } = await reader.read();
      if (done) throw new Error(`${variant.id} exited before ready`);
      buffer += decoder.decode(value, { stream: true });
      if (buffer.includes('NETSCRIPT_READY')) {
        const at = performance.now() - started;
        void (async () => {
          try {
            while (!(await reader.read()).done) { /* drain */ }
          } catch { /* closed */ }
        })();
        return at;
      }
    }
  })();
  return { child, ready, profile };
}

async function stop(running: Running): Promise<void> {
  await killTree(running.child.pid);
  const forced = setTimeout(() => {
    try {
      running.child.kill('SIGKILL');
    } catch { /* gone */ }
  }, 3_000);
  await running.child.status.catch(() => {});
  clearTimeout(forced);
  await sleep(300);
  await Deno.remove(running.profile, { recursive: true }).catch(() => {});
}

async function cpuPercent(pid: number, windowMs: number): Promise<number> {
  const before = await sampleTree(pid);
  await sleep(windowMs);
  const after = await sampleTree(pid);
  return ((after.cpuSeconds - before.cpuSeconds) / (windowMs / 1000)) * 100;
}

function timeout<T>(promise: Promise<T>, ms: number, what: string): Promise<T> {
  return Promise.race([promise, sleep(ms).then(() => { throw new Error(`${what} timed out after ${ms} ms`); })]);
}

export async function runBench(options: BenchOptions): Promise<BenchReport> {
  const log = options.log ?? ((line: string) => console.error(line));
  const runs = options.runs ?? 5;
  const activeRuns = options.activeRuns ?? Math.min(3, runs);
  const idleWindow = options.idleWindowMs ?? 10_000;
  const report: BenchReport = {
    environment: {
      date: new Date().toISOString(),
      os: `${Deno.build.os}-${Deno.build.arch}`,
      osRelease: Deno.osRelease(),
      cpus: navigator.hardwareConcurrency,
      loadavg: Deno.build.os === 'windows' ? null : Deno.loadavg(),
      memoryTotalMb: Math.round(Deno.systemMemoryInfo().total / 1_048_576),
      method: 'cold = spawn→data-backed frame painted, fresh profile; memory = process tree 3 s after ready; idle/active CPU = tree CPU time over a window, % of one core',
    },
    variants: {},
  };

  for (const variant of options.variants) {
    log(`\n== ${variant.label}`);
    const cold: number[] = [];
    const rss: number[] = [];
    const pss: number[] = [];
    const idle: number[] = [];
    let processes: VariantResult['processes'] = [];
    for (let run = 0; run < runs; run++) {
      const running = await launch(variant, 0, `c${run}`);
      try {
        cold.push(await timeout(running.ready, 45_000, `${variant.id} ready`));
        await sleep(3_000);
        const sample = await sampleTree(running.child.pid);
        rss.push(sample.rssMb);
        if (sample.pssMb !== null) pss.push(sample.pssMb);
        processes = sample.processes.map(({ name, rssMb }) => ({ name, rssMb }));
        idle.push(await cpuPercent(running.child.pid, idleWindow));
        log(`  cold ${run + 1}/${runs}: ready ${round(cold.at(-1)!, 0)} ms · rss ${round(sample.rssMb, 0)} MB${sample.pssMb === null ? '' : ` · pss ${round(sample.pssMb, 0)} MB`} · idle ${round(idle.at(-1)!)}% · ${sample.processes.length} proc`);
      } catch (error) {
        log(`  cold ${run + 1}/${runs}: FAILED ${String(error)}`);
      } finally {
        await stop(running);
      }
    }

    const active: number[] = [];
    const activeRss: number[] = [];
    for (let run = 0; run < activeRuns; run++) {
      const running = await launch(variant, 20, `a${run}`);
      try {
        await timeout(running.ready, 45_000, `${variant.id} ready`);
        await sleep(2_000);
        active.push(await cpuPercent(running.child.pid, idleWindow));
        activeRss.push((await sampleTree(running.child.pid)).rssMb);
        log(`  active ${run + 1}/${activeRuns}: cpu ${round(active.at(-1)!)}% · rss ${round(activeRss.at(-1)!, 0)} MB`);
      } catch (error) {
        log(`  active ${run + 1}/${activeRuns}: FAILED ${String(error)}`);
      } finally {
        await stop(running);
      }
    }

    const parallel: VariantResult['parallel'] = [];
    for (const count of options.parallel ?? [1, 4, 8]) {
      const started = performance.now();
      const batch = await Promise.all(Array.from({ length: count }, (_, index) => launch(variant, 0, `p${count}-${index}`)));
      try {
        await timeout(Promise.all(batch.map((running) => running.ready)), 90_000, `${variant.id} x${count} ready`);
        const allReady = performance.now() - started;
        await sleep(3_000);
        const samples = await Promise.all(batch.map((running) => sampleTree(running.child.pid)));
        const totalRss = samples.reduce((sum, sample) => sum + sample.rssMb, 0);
        const totalPss = samples.every((sample) => sample.pssMb !== null) ? samples.reduce((sum, sample) => sum + (sample.pssMb ?? 0), 0) : null;
        parallel.push({ instances: count, allReadyMs: round(allReady, 0), totalRssMb: round(totalRss, 0), totalPssMb: totalPss === null ? null : round(totalPss, 0), rssPerInstanceMb: round(totalRss / count, 0) });
        log(`  parallel x${count}: all ready ${round(allReady, 0)} ms · total rss ${round(totalRss, 0)} MB${totalPss === null ? '' : ` · total pss ${round(totalPss, 0)} MB`}`);
      } catch (error) {
        log(`  parallel x${count}: FAILED ${String(error)}`);
      } finally {
        await Promise.all(batch.map(stop));
      }
    }

    report.variants[variant.id] = {
      label: variant.label,
      coldStartMs: { median: round(median(cold), 0), min: round(Math.min(...cold), 0), max: round(Math.max(...cold), 0), samples: cold.map((value) => round(value, 0)) },
      memoryMb: { rssMedian: round(median(rss), 0), pssMedian: pss.length ? round(median(pss), 0) : null },
      processCount: processes.length,
      processes,
      idleCpuPct: { median: round(median(idle)), samples: idle.map((value) => round(value)) },
      activeCpuPct: { median: round(median(active)), samples: active.map((value) => round(value)), rssMedianMb: round(median(activeRss), 0) },
      parallel,
    };
    await options.onPartial?.(report);
  }
  return report;
}

/** Human summary table. */
export function summarize(report: BenchReport): string {
  const lines = ['| Host | Cold start (median) | Memory (tree) | Processes | Idle CPU | Active CPU | 8 instances (total) |', '| --- | --- | --- | --- | --- | --- | --- |'];
  for (const result of Object.values(report.variants)) {
    const memory = result.memoryMb.pssMedian !== null ? `${result.memoryMb.pssMedian} MB PSS (${result.memoryMb.rssMedian} RSS)` : `${result.memoryMb.rssMedian} MB RSS`;
    const eight = result.parallel.find((entry) => entry.instances === 8);
    const eightText = eight ? `${eight.totalPssMb ?? eight.totalRssMb} MB · ready ${eight.allReadyMs} ms` : 'did not start';
    lines.push(`| ${result.label} | ${result.coldStartMs.median} ms | ${memory} | ${result.processCount} | ${result.idleCpuPct.median}% | ${result.activeCpuPct.median}% | ${eightText} |`);
  }
  return lines.join('\n');
}
