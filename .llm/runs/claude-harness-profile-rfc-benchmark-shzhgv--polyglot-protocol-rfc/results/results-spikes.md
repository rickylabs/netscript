# Spike results — RFC-5 polyglot task protocol (run 5)

Generated 2026-08-20T07:48:08.507Z by `report-spikes.ts` from `results/raw/k*.jsonl`.
Pre-registered criteria in plan.md L8; every verdict below is the criterion branch that fired.
Host: run-1 environment manifest lineage (4-core container).

## K1 — frame transport (sentinel-NDJSON stdout under adversarial logs)

| Emitter | Reps | Frames recovered | Log lines | Malformed-sentinel→log | Frame-shaped logs hijacked | Demux MB/s p50 |
| --- | --- | --- | --- | --- | --- | --- |
| go | 5 | 200+1 / 200+1 (all reps) | 10000 | 2504 | 0 | 132.7 |
| python3 | 5 | 200+1 / 200+1 (all reps) | 10000 | 2504 | 0 | 127.2 |

Verdict: **ADOPT sentinel-stdout (T0/T1)** — with the derived spec rule: the demux MUST
sentinel-scan the byte stream (a line-anchored v1 lost 8–44/200 python3 frames per rep to frames embedded
inside unterminated >PIPE_BUF log lines; kept as the `v1-lesson` row). Frame writes are single write ≤ PIPE_BUF.
fd-3 branch: infeasible on the Deno host (`Deno.Command` exposes no extra-fd API) — sockets are the alternative.
Aggregate: 127.2 MB/s demux p50 over ~1.25 GB hostile output per rep.

## K2 — token delivery + constructed env

- `/proc/*/environ` mode **0400** (owner-only: true); cross-uid blocked; N/A — single-user container; owner-only mode 0400 means exposure is same-uid only, per proc(5)
- Constructed allowlist via `clearEnv`+`env`: delivered=true, inherited leak=none, canary leaked=false (runtime self-set observed: ["LC_CTYPE"] — CPython PEP-538)
- stdin-first-frame (python3): p50 27.5 ms / p95 41.7 ms (includes process start)
- stdin-first-frame (sh-read): p50 2.1 ms / p95 2.5 ms (includes process start)
- Bonus: sandboxed deno tasks cannot read `/proc` at all (`--allow-all` gate; run-1 D-6 lineage).

Verdict: **ADOPT env-pointer + bootstrap token for T0/T1 (constructed allowlisted env, clearEnv proven); stdin-first-frame verified as the T1+ optional and T2 per-dispatch mechanism**

## K3 — loopback citizen-surface transport

| Client | Reached | Auth gate | Progress RTT p50 / p95 (ms) |
| --- | --- | --- | --- |
| deno sandboxed `--allow-net=127.0.0.1:PORT` | true | 401 without bearer: true; bootstrap→attempt token flow: true | 0.49 / 1.06 |
| deno sandboxed WRONG port scope | **denied (NotCapable): true** | — | — |
| python3 | exit 0 | cred 200 | 0.67 / 1.29 |

UDS: Deno unix listener true, python3 client true, deno fetch over UDS **false**;
SUN_LEN caveat: first attempt at the run-dir path failed with "path must be shorter than SUN_LEN" (~108 chars) — deep workspace paths cannot host UDS sockets; any UDS option must allocate short paths (/tmp or XDG_RUNTIME_DIR).

Verdict: **ADOPT TCP 127.0.0.1 (canonical, all tiers)** — per-task exact-port `--allow-net` scoping is itself the
access gate for deno-type tasks; UDS demoted to optional capability (no deno-fetch support + SUN_LEN).
Docker/Aspire survival untested in-container (recorded limitation).

## K5 — stdin duplex cancel during blocking compute

| Runtime | n | Cancelled outcomes | Ack p50 (ms) | p95 | max | Bar (<100 p95) |
| --- | --- | --- | --- | --- | --- | --- |
| go | 30 | 30/30 | 3.5 | 5.8 | 6.5 | PASS |
| python3 | 30 | 30/30 | 30.2 | 43.1 | 88.3 | PASS |

Verdict: **ADOPT T1 in-band stdin cancel (duplex optional capability)** (OS signals remain the non-cooperative backstop).

## K4 — protocol overhead through the REAL dispatch path

BASE-go = run-4 baseline binary (argv contract). T1-go = Tier-1 protocol subject (Zod-validated
envelope in TASK_PAYLOAD; started/progress/result sentinel frames; in-path demux + result
validation from `TaskResult.stdout`). Short workload (100k), warmup 20 / measured 300 per series;
exact acc identity asserted every execution.

| Series | n | fail | exec-wall p50 | p95 (ms) | e2e p50 | p95 (ms) | protoHost p50 (ms) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| BASE-go_direct_c1 | 300 | 0+0acc | 7.18 | 9.37 | 7.2 | 9.4 | — |
| BASE-go_queue_c1 | 300 | 0+0acc | 7.59 | 9.50 | 61.4 | 110.1 | — |
| BASE-go_queue_c16 | 300 | 0+0acc | 13.29 | 39.50 | 160.3 | 223.5 | — |
| T1-go_direct_c1 | 300 | 0+0acc | 6.83 | 9.13 | 7.0 | 9.4 | 0.084 |
| T1-go_queue_c1 | 300 | 0+0acc | 8.00 | 10.72 | 69.6 | 113.6 | 0.097 |
| T1-go_queue_c16 | 300 | 0+0acc | 11.21 | 38.76 | 138.0 | 214.6 | 0.063 |

| Criterion (pre-registered) | Measured | Bar | Result |
| --- | --- | --- | --- |
| T1 exec-wall delta, queue c=1 | 0.41 ms | ≤ 1.0 ms | PASS |
| T1 exec-wall delta, direct c=1 | -0.35 ms | ≤ 1.0 ms | PASS |
| T1 e2e delta, queue c=16 | -13.9% | ≤ 5% | PASS |
| Host-side protocol cost (validate+demux+parse, in-path) | 0.06–0.10 ms p50 | ≤ 0.5 ms | PASS |

Verdict: **PASS all bars** — the Tier-1 envelope+frames contract costs ≈0.4–0.5 ms per execution on the
6–8 ms exec-wall class; the envelope rode the EXISTING `TASK_PAYLOAD` mechanism unmodified.

## K6 — progress persistence chain (replica)

| Mode | Frames in | Flushes | Delivered | Coalesce ratio | Latency p50 / p95 (ms) | KV record (B) | Bar (≤500 p95) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| steady-10evs | 30 | 30 | 30 | 1× | 92.0 / 93.9 | 82 | PASS |
| burst-100evs | 200 | 21 | 21 | 9.52× | 8.1 / 12.0 | 84 | PASS |

Replica caveats (verbatim from the raw): (1) KvExecutionState exposes create/complete/get only — no progress mutation exists (D-12 confirmed at API level); the KV write replicates the PROPOSED progress() shape. (2) durable-stream producer requires the Aspire-hosted streams service URL; loopback HTTP sink stands in (transport cost bounded by K3: ~0.5 ms p50). (3) SSE not exercised.

Verdict: **Chain shape MEASURED-ON-REPLICA: latency and coalescing meet the bar; RFC cites shape + numbers with replica caveat**

## Spike verdict summary

All six spikes resolved on their PRIMARY pre-registered criteria — no "else" branch fired:
K1 sentinel-stdout ADOPT (+ sentinel-scan spec rule, fd-3 infeasible) · K2 env-pointer + bootstrap
token ADOPT (+ clearEnv allowlist proven) · K3 TCP loopback canonical (+ permission-scoping as the
gate, UDS optional) · K4 overhead PASS (≈0.5 ms per execution, all bars) · K5 in-band cancel ADOPT
(3.5/30.2 ms p50) · K6 progress chain PASS on replica (94 ms p95 steady, 9.5× burst coalescing).

