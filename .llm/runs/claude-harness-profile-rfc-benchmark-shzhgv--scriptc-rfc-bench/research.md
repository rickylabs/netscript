# Research — claude-harness-profile-rfc-benchmark-shzhgv--scriptc-rfc-bench

## Re-baseline

- Carried-in source: handover prompt `37df715b-handoverpromptscriptctaskruntimebench.md`
  (uploaded to session; single-machine prior data point: Ubuntu 24 x86_64, scriptc 0.0.32,
  Deno 2.9.5, direct spawn without worker runtime — native 3 ms vs deno 24 ms avg @100k iters;
  185 ms vs 205 ms @10M; peak RSS 2.4 MB vs 40.6 MB; binary 414 KB).
- Re-derived against `main` @ 2dd1a75 (2026-08-19). The carried-in numbers are treated as a
  hypothesis to confirm/refute **through the worker dispatch path**, not as ground truth.
- Owner scope additions mid-run (recorded from user messages, 2026-08-19):
  1. Add a **Rust release binary** benchmark subject and an RFC section comparing scriptc vs Rust
     (what problem each solves, how they complement) through the same `executable` seam.
  2. Add the **WASM / ABI / FFI / dlopen** dimension: study execution boundaries beyond subprocess
     spawn (in-process WASM task runtime, `Deno.dlopen` C-ABI shared library) in the RFC, with
     labeled direct microbenchmarks where feasible.

## Findings

| #  | Finding | How to verify |
| -- | ------- | ------------- |
| F1 | Container toolchain: Deno **2.9.5** (installed this run), scriptc **0.0.32** (npm global), clang **18.1.3**, Node **22.22.2**/npm 10.9.7, rustc **1.94.1**. No Docker daemon, no `dotnet`, no `aspire`, no `zig`. | `deno --version`, `scriptc --version`, `clang --version`, `rustc --version`, `docker info` (fails), `which aspire dotnet zig` (empty) |
| F2 | scriptc 0.0.32 static build works in-container: 100k-iter LCG task compiles to a **422 784-byte** static binary; runs correctly; reads `process.argv`/`process.env` (incl. `CORRELATION_ID`). | scratchpad `scriptc-smoke/smoke.ts`; output `{"acc":113062890,"n":100000,...}` |
| F3 | scriptc static-tier limits reproduced firsthand at 0.0.32: `Deno` reference is a compile error even behind `typeof` guard (**SC0001** ×2); `Math.sin` fails static build (**SC2012**, hint: `--dynamic` adds ~620KB embedded engine); object spread after explicit properties rejected (**SC1090**). | scratchpad `deno-guard.ts`, `mathsin.ts`, `spread.ts` builds |
| F4 | DB-less init flag is `--db none` (`DbEngineChoice = DbEngine \| 'none'`; choices postgres/mysql/mssql/sqlite/none). Derived from source, not live `--help` (drift D-3). | `packages/cli/src/kernel/domain/db-engine.ts:12-22`, `.../features/init/init-command.ts:73` |
| F5 | scriptc upstream: vercel-labs/scriptc#173 "First-class JSR support" opened 2026-08-19 by @vinczemarton, **open, zero maintainer response, no labels/milestone**. Proposes resolving TS source from JSR into the same static compile path. | https://github.com/vercel-labs/scriptc/issues/173 |
| F6 | scriptc tiers per scriptc.dev: Tier 1 static native (classes, closures, async/await, Node fs/path/process/http); Tier 2 `--dynamic` embedded JS engine (~620KB) for npm JS; Tier 3 rejected at build with SC-codes ("nothing silently miscompiles"). Hello-world ~320KB, ~4ms start (vendor claims — our own numbers supersede for RFC use). Toolchain: "Node.js 24 or newer and clang" (works under Node 22.22.2 here — doc mismatch, minor); WASI/cross-target builds **require Zig** (absent → scriptc WASM target not buildable in this container). WASI preview-1 diagnostics: sockets/fetch, child processes, signals, fs-watch fail before linking with **SC3002**. | scriptc.dev; github.com/vercel-labs/scriptc README |
| F7 | Seven built-in TaskTypes (`deno` default+sandboxed, `python`, `dotnet`, `shell`, `powershell`, `cmd`, `executable`); `executable` "runs the entrypoint directly as a prebuilt binary with the task's args". `.permissions(...)` enforced **only** for `deno` runtime; deno task without `.permissions(...)` builds an `--allow-all` command line. Result contract: **one JSON object as the final line of stdout**; input argv+env; no stdin channel; runtime injects `TRACEPARENT`/`TRACESTATE`/`CORRELATION_ID`. Exit 127 → command not found, 126 → not executable. | `docs/site/background-processing/polyglot-tasks.md` |
| F8 | The extension seam already exists and is documented: `createDefaultTaskExecutor({ adapters, customAdapters })`; contract `TaskRuntimeAdapterLike` = `id`, `runtime`, `supports(task)`, `execute(task, options)`; `customAdapters` is for task types outside the built-in set. | `docs/site/background-processing/how-to/add-a-task-runtime-adapter.md`; `packages/plugin-workers-core/src/executor/` |
| F9 | RFC process: copy `rfcs/0000-template.md` → `rfcs/0000-<slug>.md`, keep 0000 while Draft, front-matter (rfc/title/status/authors/created/tracking-issue/target-milestone), open PR + companion `rfc`-labeled tracking issue; numbers assigned by maintainer at acceptance. Template headings: Summary, Motivation, Guide-level, Reference-level, Drawbacks, Rationale and alternatives, Breaking changes and migration, Prior art, Unresolved questions, Future possibilities. House style for large RFCs (0002): metadata table, numbered sections, mermaid diagrams, pinned SHAs for every measurement, epistemic-status labeling. | `rfcs/README.md`, `rfcs/0000-template.md`, `rfcs/0002-runtime-versioned-automation.md` |
| F10 | Doctrine verdict (2026-08-12): `packages/plugin-workers-core` = **3 / Refactor** ("reduce contract/domain cardinality"); `plugins/workers` = **5 / Refactor** ("connector thinness, jobs/worker split"). New work must not deepen violations. | `docs/architecture/doctrine/10-codebase-verdict-and-handoff.md` |
| F11 | Open debt central to the RFC: `workers-non-deno-task-sandbox-boundary` (DEBT_ACCEPTED) — non-Deno runtimes inherit worker-host OS privileges; docs caveat marker `arch-debt:workers-non-deno-task-sandbox-boundary` in the add-a-task-runtime-adapter how-to. Close gate: documented enforced per-task sandbox **or** public API models it as a permanent trust boundary. Also relevant: `PLUGIN-RUNTIME-ADAPTER-RELOCATION` (#172d, workers = reference impl), `CRON-SUBSYSTEM-DUP` (mapped to a future RFC), `workers-private-type-ref-1655`. | `.llm/harness/debt/arch-debt.md` lines 1413, 1836, 1511, 2307 |
| F12 | Rust toolchain in-container: rustc 1.94.1, cargo, clippy; installed target `x86_64-unknown-linux-gnu` only (wasm32 targets addable via rustup for subject E fallback; `Deno.dlopen` FFI needs a `cdylib` with C ABI — subject F). | `rustc --version`, `rustup target list --installed` |
| F13 | WORKER_RUNTIMES runner modes: `in-process`, `web-worker` (scaffold default, `WORKERS_CONCURRENCY`), `subprocess`; config knobs `concurrency`, `mode`, `queueProvider`, `jobsDir`/`tasksDir`. Tasks share queue/retry/telemetry machinery with jobs; "the difference is purely the execution surface". | `docs/site/background-processing/workers.md` |

## Feasibility (container constraints → benchmark tier)

The handover's Phase 1 (scaffolded `bench-app` + Aspire graph + `netscript plugin install worker`)
requires the Aspire CLI, .NET, and Docker — none present and Docker unresolvable in this managed
container (no daemon socket; drift D-2). The dispatch machinery the RFC's claims depend on —
queue → `MultiRuntimeTaskExecutor` → adapter → subprocess → TaskResult — lives in
`@netscript/plugin-workers-core` and is exercised **in-process from the repo workspace** with a
repo-native queue provider. End-to-end numbers are labeled "in-process worker runtime, not
Aspire-hosted"; the executor-side `duration` numbers are host-independent.
**[PENDING — dispatch-path map from Explore agent: exact queue provider choice, trigger path
helpers, test harnesses that drive enqueue→TaskResult without external services.]**

## jsr-audit surface scan (package/plugin waves)

- N/A — this run changes no package/plugin source; deliverables are run-dir artifacts + one
  `rfcs/*.md` draft. The RFC's Reference-level section *describes* the
  `@netscript/plugin-workers-core/executor` surface but does not modify it.

## Related filings from this run

- **#1679** `feat(workers): evaluate pydantic/monty as the sandboxed Python task runtime`
  (owner-requested, 2026-08-19; Backlog / Triage). Monty is the Python-flavored instance of the
  in-process sandboxed execution boundary this run's RFC studies for native/WASM tasks; the RFC
  references #1679 as future work under the same `TaskRuntimeAdapterLike` seam and the
  `workers-non-deno-task-sandbox-boundary` debt. Duplicate check performed: no prior monty/python-
  sandbox issue existed.

## Open questions

- Which queue provider gives the most representative through-the-queue numbers without Docker
  (in-memory vs KV-backed)? → close from dispatch-path map; state the choice + its bias in the RFC.
- Where does the queue provider become the bottleneck in the concurrency sweep (1/4/16/64)? →
  answer empirically; the RFC's verdict hinges on spawn-tax share of end-to-end latency.
- scriptc WASM target unbuildable here (no Zig): is Rust `wasm32` an acceptable stand-in for the
  in-process WASM boundary microbenchmark (E)? Proposed: yes, labeled — the boundary cost
  (instantiate+call+copy) dominates over codegen provenance for the LCG workload; revisit when a
  Zig toolchain is available.
- Does `Deno.dlopen` remain permission-gated (`--allow-ffi`) in Deno 2.9 and does it require
  `--unstable-ffi`? → verify empirically in subject F before citing.
