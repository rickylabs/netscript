/**
 * K1 — sentinel-NDJSON stdout frame demux under adversarial logs (plan L8/K1).
 *
 * Demux algorithm v2 (the spec-relevant reference): STREAMING SENTINEL-SCAN, not line-anchored.
 * Rationale (measured in demux-v1, kept in results as k1-v1 rows): a frame write is atomic
 * (single write <= PIPE_BUF), but it may land INSIDE another writer's not-yet-terminated
 * >PIPE_BUF log line — line-anchored parsing then sees the sentinel mid-line and drops the
 * frame (python3 lost 8-44/200 frames per rep). Sentinel-scan recovers frames wherever they
 * are embedded; surrounding log bytes stay log content.
 *
 * Criteria: 200 progress frames + 1 result frame per emitter, exactly once, arrival-ordered,
 * sha-verified; frame-shaped log lines (no sentinel) never hijacked; sentinel+invalid-JSON
 * counted as malformed-diagnostic log, never a frame; no crash; throughput recorded.
 *
 *   deno run --allow-read --allow-write --allow-run --allow-env bench/spikes/k1/run-k1.ts
 */

const RUN_DIR = new URL('../../..', import.meta.url).pathname;
const K1 = `${RUN_DIR}bench/spikes/k1`;
const SENTINEL = new Uint8Array([0x00, 0x4e, 0x53, 0x46, 0x00]); // \x00NSF\x00
const FRAME_MAX = 4200;
const REPS = 5;

type Row = Record<string, unknown>;
const out: Row[] = [];
const emit = (o: Row) => out.push(o);
emit({ kind: 'meta', bench: 'k1-frame-transport', demux: 'sentinel-scan-v2', startedAt: new Date().toISOString(), reps: REPS });

class Demux {
  frames: Array<Record<string, unknown>> = [];
  logLines = 0;
  malformedSentinel = 0;
  frameShapedLogs = 0;
  private mode: 'log' | 'frame' = 'log';
  private sentMatch = 0; // sentinel bytes matched so far (log mode)
  private lineHead: number[] = []; // first 64 bytes of current log line
  private lineHasContent = false;
  private frameBuf: number[] = [];
  private dec = new TextDecoder('utf-8', { fatal: false });

  private logByte(b: number) {
    if (b === 0x0a) {
      if (this.lineHasContent || this.lineHead.length > 0 || true) this.endLogLine();
      return;
    }
    this.lineHasContent = true;
    if (this.lineHead.length < 64) this.lineHead.push(b);
  }

  private endLogLine() {
    const head = this.dec.decode(new Uint8Array(this.lineHead));
    if (head.startsWith('{"t":')) this.frameShapedLogs++;
    this.logLines++;
    this.lineHead = [];
    this.lineHasContent = false;
  }

  push(chunk: Uint8Array) {
    for (let i = 0; i < chunk.length; i++) {
      const b = chunk[i];
      if (this.mode === 'log') {
        if (b === SENTINEL[this.sentMatch]) {
          this.sentMatch++;
          if (this.sentMatch === SENTINEL.length) {
            this.sentMatch = 0;
            this.mode = 'frame';
            this.frameBuf = [];
          }
        } else {
          // flush withheld partial-sentinel bytes into the log line, then this byte
          for (let k = 0; k < this.sentMatch; k++) this.logByte(SENTINEL[k]);
          this.sentMatch = 0;
          if (b === SENTINEL[0]) { this.sentMatch = 1; } else this.logByte(b);
        }
      } else {
        if (b === 0x0a) {
          const body = this.dec.decode(new Uint8Array(this.frameBuf));
          let ok = false;
          try {
            const obj = JSON.parse(body);
            if (obj && typeof obj === 'object' && !Array.isArray(obj) && typeof obj.t === 'string') {
              this.frames.push(obj);
              ok = true;
            }
          } catch { /* fallthrough */ }
          if (!ok) {
            this.malformedSentinel++;
            for (const fb of this.frameBuf) this.logByte(fb);
            this.logByte(0x0a);
          }
          this.mode = 'log';
          this.frameBuf = [];
        } else {
          this.frameBuf.push(b);
          if (this.frameBuf.length > FRAME_MAX) {
            this.malformedSentinel++;
            for (const fb of this.frameBuf) this.logByte(fb);
            this.mode = 'log';
            this.frameBuf = [];
          }
        }
      }
    }
  }

  finish() {
    if (this.mode === 'frame') { this.malformedSentinel++; this.mode = 'log'; }
    if (this.lineHasContent) this.endLogLine();
  }
}

async function run(cmd: string[], label: string, rep: number) {
  const t0 = performance.now();
  const proc = new Deno.Command(cmd[0], {
    args: cmd.slice(1),
    stdout: 'piped',
    stderr: 'null',
  }).spawn();
  const d = new Demux();
  let bytes = 0;
  const reader = proc.stdout.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.length;
    d.push(value);
  }
  d.finish();
  const status = await proc.status;
  const wallMs = performance.now() - t0;

  const progress = d.frames.filter((f) => f.t === 'progress');
  const results = d.frames.filter((f) => f.t === 'result');
  const seqs = progress.map((f) => f.seq as number).sort((a, b) => a - b);
  const seqExact = seqs.length === 200 && seqs.every((v, i) => v === i);
  const arrival = progress.map((f) => f.seq as number);
  const inOrder = arrival.every((v, i) => i === 0 || v > arrival[i - 1]);
  let shaOk = true;
  for (const f of progress) {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(f.payload as string));
    const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
    if (!hex.startsWith(f.sha as string)) { shaOk = false; break; }
  }
  const pass = seqExact && inOrder && shaOk && results.length === 1;
  emit({
    kind: 'demux', label, rep, pass, wallMs: +wallMs.toFixed(1), exitCode: status.code,
    mbProcessed: +(bytes / 1048576).toFixed(1), framesRecovered: progress.length,
    resultFrames: results.length, seqExact, inOrder, shaOk, logLines: d.logLines,
    malformedSentinelAsLog: d.malformedSentinel, frameShapedLogsNotHijacked: d.frameShapedLogs,
    throughputMBs: +(bytes / 1048576 / (wallMs / 1000)).toFixed(1),
  });
  return pass;
}

await new Deno.Command('go', { args: ['build', '-o', `${K1}/bin/emitter-go`, `${K1}/emit-frames.go`], env: { ...Deno.env.toObject() }, cwd: K1 }).output();

let allPass = true;
for (let rep = 0; rep < REPS; rep++) {
  allPass = (await run([`${K1}/bin/emitter-go`], 'go', rep)) && allPass;
  allPass = (await run(['python3', `${K1}/emit_frames.py`], 'python3', rep)) && allPass;
}

emit({
  kind: 'fd3-feasibility',
  extraFdSupport: false,
  note: 'Deno.Command exposes only stdin/stdout/stderr; no API passes additional inherited fds. The pre-registered fd-3 fallback branch is unavailable on the Deno host; socket transports (K3) are the alternative channel.',
});
emit({
  kind: 'v1-lesson',
  note: 'Line-anchored demux (v1) lost 8-44/200 python3 frames per rep: atomic frames embedded inside another writer\'s unterminated >PIPE_BUF log line. Spec rule derived: demux MUST sentinel-scan the byte stream, not split lines first; frame span (sentinel..newline) integrity is guaranteed by single-write <= PIPE_BUF atomicity.',
});
emit({ kind: 'summary', allPass, finishedAt: new Date().toISOString() });
await Deno.writeTextFile(`${RUN_DIR}results/raw/k1.jsonl`, out.map((o) => JSON.stringify(o)).join('\n') + '\n');
console.log(`K1 ${allPass ? 'PASS' : 'FAIL'} -> results/raw/k1.jsonl`);
