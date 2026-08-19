# 2026-08-19 — scriptc task-runtime benchmark + RFC (harness run)

Run dir: `.llm/runs/claude-harness-profile-rfc-benchmark-shzhgv--scriptc-rfc-bench/` · PR #1678 ·
branch `claude/harness-profile-rfc-benchmark-shzhgv`.

Cloud-container harness run (ARCHETYPE-3 + SCOPE-docs, lane overrides in supervisor.md/D-1):
benchmarked scriptc-compiled native task binaries against the `deno` TaskType through the worker
plugin's production dispatch path (in-process on local Deno KV native queue — drift D-2/D-5),
with a same-binary control, a Rust ceiling, and wasm/ffi/in-process boundary microbenchmarks;
authored `rfcs/0000-scriptc-task-runtime-adapter.md` (Draft) whose verdict follows
pre-registered criteria (plan.md L5).

## Outcomes

- 32 series × 320 executions, 0 failures; results in `results/results.md` (script-generated).
- Verdict branch "built-in defensible" fired (40.7% e2e, 17× RSS); RFC recommends **phased
  adoption** (recipe + experimental customAdapters now; first-class TaskType gated on scriptc
  maturity — #173 JSR, npm stability, post-0.0.x commitment).
- Sharpest finding: scriptc removes the process tax (6.8 vs 50.6 ms, 2.5 vs 43 MB) but computes
  at JS speed (long 225 ms ≈ V8 219 ms vs Rust 53 ms / wasm 54 ms).
- Upstream findings for follow-up issues (post evaluator): D-4 queue path drops correlation/
  trace env for task subprocesses (doc mismatch); D-5 named-queue collision on shared local
  Deno KV; D-6 sandboxed deno tasks cannot read /proc (RSS self-report impossible).
- Filed #1679 (pydantic/monty sandboxed Python runtime) on owner request.

## Lessons (candidate, not yet promoted)

- `Worker.start()` parks on the jobs listener for the worker lifetime — harness/tooling callers
  must not await it as an init.
- Registry task definitions default `maxConcurrency: 1` — any concurrency experiment must set it
  explicitly or the sweep silently serializes.
- Deno gates `/proc` reads behind `--allow-all`; external `/usr/bin/time -v` is the portable
  peak-RSS probe for sandboxed subprocesses.

## Addendum — runs 2 and 3 (same session, same branch lineage)

- **Run 2 (rust-workers, PR #1683, merged):**
  `.llm/runs/claude-harness-profile-rfc-benchmark-shzhgv--rust-workers-rfc/` —
  `rfcs/0000-rust-workers-integration.md`. Key findings: documented web-worker runner mode
  unimplemented (→ #1684, with oRPC message-port resolution for the pool protocol); nonblocking
  FFI onto Rust threads = 17.6× throughput at <5 ms event-loop jitter; wasmbuild verified at
  native speed; rusty_v8/deno_core embedding rejected on cadence/archival facts. IMPL-EVAL PASS.
- **Run 3 (dotnet, PR #1685):**
  `.llm/runs/claude-harness-profile-rfc-benchmark-shzhgv--dotnet-rfc/` —
  `rfcs/0000-dotnet-task-runtime-paths.md`. Key findings: 45× dispatch-mode spread inside the
  existing dotnet TaskType (file-based 284 ms vs NativeAOT 6.3 ms / 3.4 MB with native compute);
  Bootsharp verified on Linux at native speed in Deno; cross-language sandbox matrix (monty /
  Rust-WASI / Bootsharp / Hyperlight / adapter-level Landlock-bwrap). IMPL-EVAL PASS.
- Series lessons promoted-candidate: the deferred-push + branch-restart + post-verdict
  artifact-only-commit protocol worked three times; close-gate needs the body complete BEFORE the
  head's CI run (rerun-by-bookkeeping-push is the workaround absent `gh run rerun`).
