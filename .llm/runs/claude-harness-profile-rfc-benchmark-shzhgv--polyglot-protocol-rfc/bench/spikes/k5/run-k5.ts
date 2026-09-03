/**
 * K5 — stdin duplex cancel latency during blocking compute (plan L8/K5).
 * Host spawns the task, waits for the 'started' frame, waits 200 ms, writes a CANCEL frame
 * to stdin, and measures cancel-write -> cancel-ack-result-frame latency. 30 reps per
 * runtime. Criterion: p95 < 100 ms on both python3 and Go without runtime-specific flags.
 *
 *   deno run --allow-all bench/spikes/k5/run-k5.ts
 */

const RUN_DIR = new URL('../../..', import.meta.url).pathname;
const K5 = `${RUN_DIR}bench/spikes/k5`;
const SENTINEL = '\x00NSF\x00';
const REPS = 30;

const out: Record<string, unknown>[] = [];
const emit = (o: Record<string, unknown>) => out.push(o);
emit({ kind: 'meta', bench: 'k5-stdin-duplex-cancel', reps: REPS, startedAt: new Date().toISOString() });

await new Deno.Command('go', { args: ['build', '-o', `${K5}/bin/task-cancel-go`, `${K5}/task-cancel.go`], cwd: K5, env: Deno.env.toObject() }).output();

async function measure(cmd: string[], label: string) {
  const lats: number[] = [];
  let cancelled = 0;
  for (let rep = 0; rep < REPS; rep++) {
    const p = new Deno.Command(cmd[0], {
      args: cmd.slice(1),
      stdin: 'piped', stdout: 'piped', stderr: 'null',
      clearEnv: true, env: { PATH: '/usr/bin:/bin' },
    }).spawn();
    const reader = p.stdout.getReader();
    const dec = new TextDecoder();
    let buf = '';
    let cancelSentAt = 0;
    let ackAt = 0;
    const writer = p.stdin.getWriter();

    const pump = (async () => {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let idx: number;
        while ((idx = buf.indexOf('\n')) >= 0) {
          const line = buf.slice(0, idx);
          buf = buf.slice(idx + 1);
          if (!line.startsWith(SENTINEL)) continue;
          let f: Record<string, unknown>;
          try { f = JSON.parse(line.slice(SENTINEL.length)); } catch { continue; }
          if (f.t === 'started') {
            setTimeout(async () => {
              cancelSentAt = performance.now();
              await writer.write(new TextEncoder().encode(JSON.stringify({ v: 1, t: 'cancel', reason: 'k5' }) + '\n'));
            }, 200);
          }
          if (f.t === 'result') {
            ackAt = performance.now();
            if (f.outcome === 'cancelled') cancelled++;
          }
        }
      }
    })();
    await p.status;
    await pump;
    try { await writer.close(); } catch { /* already closed */ }
    if (cancelSentAt && ackAt) lats.push(ackAt - cancelSentAt);
  }
  lats.sort((a, b) => a - b);
  const p50 = lats[Math.floor(lats.length * 0.5)];
  const p95 = lats[Math.min(lats.length - 1, Math.ceil(lats.length * 0.95) - 1)];
  emit({
    kind: 'cancel', label, n: lats.length, cancelledOutcomes: cancelled,
    p50Ms: +p50.toFixed(1), p95Ms: +p95.toFixed(1), maxMs: +lats[lats.length - 1].toFixed(1),
    pass: cancelled === REPS && p95 < 100,
  });
  return cancelled === REPS && p95 < 100;
}

const goPass = await measure([`${K5}/bin/task-cancel-go`], 'go');
const pyPass = await measure(['python3', `${K5}/task_cancel.py`], 'python3');

emit({
  kind: 'verdict',
  criteria: 'T1 in-band control ships iff both testees ack CANCEL <100ms p95 during blocking compute, no special flags',
  decision: goPass && pyPass ? 'ADOPT T1 in-band stdin cancel (duplex optional capability)' : 'T1 control stays OS-signal-only; duplex is T2-only (Restate precedent)',
});
emit({ kind: 'summary', allPass: goPass && pyPass, finishedAt: new Date().toISOString() });
await Deno.writeTextFile(`${RUN_DIR}results/raw/k5.jsonl`, out.map((o) => JSON.stringify(o)).join('\n') + '\n');
console.log(`K5 ${goPass && pyPass ? 'PASS' : 'BRANCH-ELSE'} -> results/raw/k5.jsonl`);
