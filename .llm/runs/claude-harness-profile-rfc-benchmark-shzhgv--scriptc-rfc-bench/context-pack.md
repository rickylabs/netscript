# Context Pack — claude-harness-profile-rfc-benchmark-shzhgv--scriptc-rfc-bench

Resumable summary. Read `supervisor.md` (identity + lane overrides), `plan.md` (locked
decisions L1–L7), `drift.md` (D-1..D-6), `worklog.md` (Design + slice log + gate table).

## State (2026-08-19, post-S9)

- **Branch:** `claude/harness-profile-rfc-benchmark-shzhgv`; draft PR **#1678**; labels
  `type:docs area:plugins area:docs rfc ci:skip-e2e ci:skip-scaffold` + one `status:*`.
- **Done:** S1 bootstrap, S2 research (F1–F17), S3 plan+design (PLAN-EVAL: N/A per L7),
  S4 workloads (exact cross-language identity), S5 harness (production dispatch path in-process
  on local Deno KV; three drift findings D-4/D-5/D-6), S6 protocol (32 series × 320 exec,
  0 failures), S7 boundary (wasm/ffi/in-process), S8 `results/results.md` (script-generated),
  S9 RFC `rfcs/0000-scriptc-task-runtime-adapter.md` (Draft) with all gates green (see worklog
  gate table).
- **IMPL-EVAL: PASS** (OpenHands DeepSeek V4 Flash, run 32304295923, evaluated head 13e212e;
  mirrored in `evaluate.md`). PR at `status:ready-merge`, all DoD boxes checked with evidence.
  Post-verdict commits are run-artifact-only (deliverable diff vs 13e212e empty).

## Headline results (full tables: `results/results.md`; raw: `results/raw/*.jsonl`)

- Queue e2e p50 short c=1: A-deno 108.0 ms → B-scriptc 64.0 ms (**40.7%**; C control 65.5).
- Executor-side p50: 50.6 → 6.8 ms (7.4×); Rust 4.9 ms. Direct spawn: 45.7 / 6.1 / 4.4 ms.
- RSS: deno 43.4 MB vs scriptc 2.5 MB vs Rust 2.2 MB (17×/20×). Throughput short: A caps ~69/s,
  native subjects 125–165/s (then queue-bound).
- scriptc compute = JS speed, not native: long 225 ms ≈ in-process V8 219 ms; Rust 53 ms; wasm
  54 ms. Boundary: subprocess ~5-6 ms/invocation; wasm 0.55 cold / 0.54 warm; ffi 0.48 warm
  (`--allow-ffi` works on stable 2.9.5).
- Pre-registered L5 "built-in defensible" branch **fired**; RFC verdict = phased adoption
  (recipe + experimental customAdapters now; first-class gated on scriptc maturity #173 etc.).

## Follow-up candidates (post evaluator review)

- ~~File D-4/D-5 issues~~ **Done:** #1681 (D-4), #1682 (D-5); RFC tracking issue **#1680**
  (evaluator finding 1). Wording nit ("~57 ms" → 58-62 ms) folds into the Discussion-transition
  edit, tracked in #1680.
- `deno compile` measured comparison (RFC unresolved question).
- #1679 monty spike (separate issue, already filed).

## Rerun instructions

Toolchain: Deno 2.9.5, scriptc 0.0.32 (npm -g), clang, rustc, GNU time (`apt install time`).
From repo root: `deno run --allow-all <run-dir>/bench/verify-workloads.ts` (builds + gates),
`bash <run-dir>/bench/harness/run-all.sh` (full protocol; ~14 min on 4 cores),
`deno run --allow-all --unstable-ffi <run-dir>/bench/boundary/run-boundary.ts`,
`deno run --allow-read --allow-write <run-dir>/bench/harness/report.ts`.
Comparability requires `results/environment.json` pins to match.
