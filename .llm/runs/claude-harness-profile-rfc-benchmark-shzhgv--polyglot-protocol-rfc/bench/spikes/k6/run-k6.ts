/**
 * K6 — progress persistence chain replica (plan L8/K6, D-12 fix shape).
 * Chain measured: guest progress frame (epoch-stamped) → sentinel demux (K1 algorithm) →
 * throttle (latest-wins, 100 ms — Temporal-shape) → KV write of the execution record's
 * progress field (same Deno KV store tech the real KvExecutionState uses) → mutation-hook-
 * shaped callback → loopback HTTP sink standing in for the streams-service transport
 * (whose real cost K3 measured at ~0.5 ms) → sink receipt timestamp.
 *
 * Honesty notes (recorded in results + drift): (1) KvExecutionState has NO public progress
 * mutation today (create/complete/get only — D-12 confirmed at API level), so the state-write
 * step replicates the PROPOSED progress() mutation rather than calling plugin code; (2) the
 * durable-stream producer requires the streams service URL (Aspire-hosted) — the sink stands
 * in for that transport. Criterion: emit→sink p95 <= 500 ms at 10 ev/s; bounded record size;
 * burst mode (100 ev/s) demonstrates coalescing.
 *
 *   deno run --allow-all --unstable-kv bench/spikes/k6/run-k6.ts
 */

const RUN_DIR = new URL('../../..', import.meta.url).pathname;
const SENTINEL = '\x00NSF\x00';
const out: Record<string, unknown>[] = [];
const emit = (o: Record<string, unknown>) => out.push(o);
emit({ kind: 'meta', bench: 'k6-progress-chain', startedAt: new Date().toISOString() });

// sink = streams-service transport stand-in
const receipts: Array<{ frameTMs: number; sinkTMs: number; percent: number }> = [];
const sink = Deno.serve({ hostname: '127.0.0.1', port: 0 }, async (req) => {
  const body = await req.json();
  receipts.push({ frameTMs: body.frameTMs, sinkTMs: Date.now(), percent: body.percent });
  return Response.json({ ok: true });
});
const SINK = `http://127.0.0.1:${sink.addr.port}`;

const kvDir = await Deno.makeTempDir({ prefix: 'k6-kv-' });
const kv = await Deno.openKv(`${kvDir}/kv.sqlite`);

async function runMode(label: string, evPerSec: number, seconds: number) {
  receipts.length = 0;
  // guest: python3 emitting epoch-stamped progress frames at the given rate
  const guest = new Deno.Command('python3', {
    args: ['-c', `
import json, os, sys, time
fd = sys.stdout.fileno()
S = b"\\x00NSF\\x00"
total = ${evPerSec * seconds}
for i in range(total):
    f = {"v":1, "t":"progress", "percent": round(i*100/total), "tMs": time.time()*1000}
    os.write(fd, S + json.dumps(f, separators=(',',':')).encode() + b"\\n")
    time.sleep(1/${evPerSec})
os.write(fd, S + json.dumps({"v":1,"t":"result","outcome":"ok"}, separators=(',',':')).encode() + b"\\n")
`],
    stdout: 'piped', stderr: 'null', clearEnv: true, env: { PATH: '/usr/bin:/bin' },
  }).spawn();

  // throttle: latest-wins flush every 100 ms
  let latest: { percent: number; tMs: number } | null = null;
  let framesIn = 0, flushes = 0;
  const record = { id: 'k6-exec', status: 'running', progress: 0, progressAtMs: 0 };
  const mutationHook = async (rec: typeof record, frameTMs: number) => {
    await fetch(`${SINK}/upsert`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ percent: rec.progress, frameTMs }),
    });
  };
  const flusher = setInterval(async () => {
    if (!latest) return;
    const l = latest; latest = null;
    flushes++;
    record.progress = l.percent;
    record.progressAtMs = l.tMs;
    await kv.set(['workers', 'executions', 'k6-exec'], record); // bounded: one record, latest-wins
    await mutationHook(record, l.tMs);
  }, 100);

  // demux (sentinel-scan on text — frames only in this guest)
  const reader = guest.stdout.getReader();
  const dec = new TextDecoder();
  let buf = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let idx: number;
    while ((idx = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, idx); buf = buf.slice(idx + 1);
      if (!line.startsWith(SENTINEL)) continue;
      try {
        const f = JSON.parse(line.slice(SENTINEL.length));
        if (f.t === 'progress') { framesIn++; latest = { percent: f.percent, tMs: f.tMs }; }
      } catch { /* malformed */ }
    }
  }
  await guest.status;
  // final flush
  await new Promise((r) => setTimeout(r, 150));
  clearInterval(flusher);

  const lats = receipts.map((r) => r.sinkTMs - r.frameTMs).sort((a, b) => a - b);
  const p50 = lats[Math.floor(lats.length / 2)];
  const p95 = lats[Math.min(lats.length - 1, Math.ceil(lats.length * 0.95) - 1)];
  const kvRec = await kv.get(['workers', 'executions', 'k6-exec']);
  emit({
    kind: 'mode', label, evPerSec, framesIn, flushes, delivered: receipts.length,
    coalesceRatio: +(framesIn / Math.max(1, flushes)).toFixed(2),
    latP50Ms: +p50.toFixed(1), latP95Ms: +p95.toFixed(1), maxMs: +lats[lats.length - 1].toFixed(1),
    kvRecordBytes: JSON.stringify(kvRec.value).length,
    pass: p95 <= 500,
  });
  return p95 <= 500;
}

const steady = await runMode('steady-10evs', 10, 3);
const burst = await runMode('burst-100evs', 100, 2);

emit({
  kind: 'honesty',
  stateApi: 'KvExecutionState exposes create/complete/get only — no progress mutation exists (D-12 confirmed at API level); the KV write replicates the PROPOSED progress() shape',
  streamTransport: 'durable-stream producer requires the Aspire-hosted streams service URL; loopback HTTP sink stands in (transport cost bounded by K3: ~0.5 ms p50)',
  sseNotExercised: true,
});
emit({ kind: 'verdict', pass: steady && burst, decision: steady && burst ? 'Chain shape MEASURED-ON-REPLICA: latency and coalescing meet the bar; RFC cites shape + numbers with replica caveat' : 'Bar missed — revisit throttle/transport in RFC' });
emit({ kind: 'summary', finishedAt: new Date().toISOString() });
kv.close();
sink.shutdown();
await Deno.remove(kvDir, { recursive: true }).catch(() => {});
await Deno.writeTextFile(`${RUN_DIR}results/raw/k6.jsonl`, out.map((o) => JSON.stringify(o)).join('\n') + '\n');
console.log(`K6 ${steady && burst ? 'PASS' : 'FAIL'} -> results/raw/k6.jsonl`);
Deno.exit(0);
