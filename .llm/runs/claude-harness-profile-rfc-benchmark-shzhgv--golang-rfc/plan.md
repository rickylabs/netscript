# Plan — claude-harness-profile-rfc-benchmark-shzhgv--golang-rfc

Profile/gates: identical shape to runs 1–3 (ARCHETYPE-3 + SCOPE-docs; fitness n/a — no framework
source; scoped checks + SCOPE-docs gates + suite completeness/correctness).

## Decisions — LOCKED

- L1 Continuity: run-1 harness reused; MINSTD; warmup 20 / measure 300; run-1..3 rows cited.
- L2 Subjects: G1 go binary via `executable` (queue short c={1,16}, long c=1; direct both);
  boundary G2 official js/wasm (wasm_exec.js in Deno) + G3 c-shared dlopen (long, 120 measured);
  wasip1 build-proof; probe rows G1 + **PY-python3** (the no-Python-RFC evidence row).
- L3 Pre-registered criteria: (a) recipe-only verdict (no TaskType) unless a capability gap
  appears — none anticipated (Rust precedent); (b) G2 promoted as the in-process plane if within
  3× of run-2 wasm (54.2) — else cite-only; (c) G3 documented with hazards regardless (FFI row
  completeness), recommended only behind run-2's nonblocking rules.
- L4 Push policy: hold until #1685 merges (runs-2/3 protocol).
- L5 PLAN-EVAL: N/A (owner-directed scope; mechanics locked; no framework source). IMPL-EVAL
  mandatory on the ship PR.

## Slices

V1 bootstrap+build+verify · V2 protocol+probes+boundary · V3 results-go.md · V4 RFC · V5 ship.

## Deferred

TinyGo, wasip1 execution, G3 stress (GC/signals under load), Hyperlight (no /dev/kvm).
