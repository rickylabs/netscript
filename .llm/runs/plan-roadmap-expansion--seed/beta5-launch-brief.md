# beta.5 LAUNCH BRIEF — telemetry-revamp supervisor

> Launch-ready the moment the owner confirms OF-5/OF-10 + milestones + labels and the Phase-2 filing
> lands the `telemetry-revamp` epic + T1–T9 issues. **Do not launch before filing** (the WSL Codex
> slices reference real issue numbers). Design of record: `design/B-telemetry/{proposal,epic-and-issues}.md`.

## Mission

Land the beta.5 telemetry foundation and open the critical path to the beta.6 Spine-1 co-land.
Full critical path to a shippable beta.6 trace: **T1 → T2 → T3 → T5 → T8** (T8 = epic merge-gate).
**The beta.5 wave itself is T1 + T2** (foundation, low behavioral risk); T3/T5/T8 are beta.6 and
co-land with the `dev-dashboard` DDX-8 flagship.

## Lane + topology

- **Implementation:** WSL Codex daemon-attached, **draft-PR-per-slice** (one PR per T-slice, branch
  off `main`, explicit refspec push as `codex`; never force-push, never `git add -A`, never
  `--no-verify`).
- **Evaluation:** OpenHands, **separate session** (IMPL-EVAL = qwen 3.7 max), per-slice verdict.
  The supervisor (Fable) coordinates and never writes framework code.
- **Adversarial pass:** WSL Codex unoriented adversarial review + caveat-fix **before** each
  OpenHands IMPL-EVAL (MEMORY: adversarial-impl-review-before-impl-eval).
- **Supervisor wake:** run `.llm/tools/harness/watch-run.ts <run-dir>` as a background process to
  re-wake on `worklog.md` change; do not poll.

## Wave 1 — beta.5 (launch now, in order)

### T1 — Framework telemetry convention (TC-1..14) + attribute-namespacing law  · FIRST
- **Deps:** none (foundational). **Blocks:** every downstream parity slice.
- **Scope:** TC-1..14 conformance checklist; central `SpanNames` extension + `createXAttributes`
  builders; `netscript.*` single-root namespacing with a one-beta deprecated-alias window; wire
  `OTEL_SEMCONV_STABILITY_OPT_IN`. No consumer behavior change — this is the contract.
- **Gate:** checklist published; builders cover job/messaging/saga/trigger/execution/genai;
  `arch:check` green; convention referenced by every downstream parity acceptance. (No `gate:jsr`
  yet — pure contract.)

### T2 — Package ports/adapters restructure (close the Refactor arch-debt)  · SECOND
- **Deps:** T1. **Load-bearing for:** T3–T8.
- **Scope:** kill forbidden `core/` (→ `domain`/`application`), delete orphan `src/public/mod.ts`,
  real `./registry` facade, complete `mod.ts` barrel, add **`./otel`** + **`./query`** subpaths,
  `testing/` in-memory recorder, fix `workspace-mutator.ts` JSR rewrite-map, Standard-Schema env
  validation.
- **Gate (`gate:jsr`):** no forbidden role folders; `application` never imports `adapters`;
  **`deno doc --lint` clean on the FULL export set** (not `mod.ts` alone — MEMORY
  jsr-doc-lint-full-export-set); `deno publish --dry-run` green; existing consumers still compile
  (subpath compat); arch-debt Refactor entry closed with F-3/F-5/F-6 evidence.

## Wave 2 — beta.6 continuation (map only; co-lands with dev-dashboard)

```
T2 ─┬─→ T3 (thin-vs-SDK adapters; OF-5 opt-in SDK) ─┬─→ T5 (fan-in span-links) ─┐
    ├─→ T4 (W3C + triggers bugfix) ─────────────────┤                            ├─→ T8 (real Flow-B e2e) ▲ EPIC GATE
    ├─→ T6 (oRPC span + AI-invoke) ─────────────────┤                            │
    └─→ T7 (@netscript/telemetry/query) ────────────┘                            │
                                          T3, T6 ───────────────────────────────▶ T9 (== FAI-17, stable)
```

- **T3** carries the **OF-5** decision: `adapters/otel-deno` default (zero-dep) + `adapters/otel-sdk`
  opt-in. Do not start T5 until T3's SDK adapter lands (T5 fan-in links need attribute-bearing links).
- **T4/T6/T7** parallelize after T2. **T8** is the epic merge-gate (real, non-mocked grouped-trace
  Flow-B assertions under `scaffold.runtime`). **T9 == FAI-17** is filed once, stable.
- **Cross-epic co-land contract:** dev-dashboard **DDX-8** hard-deps **T4 + T5 + T6 + T7**. Schedule
  the two epics to co-land at beta.6, not sequenced.

## Per-slice gate matrix

| Slice | check(+kv) | arch:check | gate:jsr (full-export doc:lint + publish dry-run) | gate:e2e |
| ----- | ---------- | ---------- | ------------------------------------------------- | -------- |
| T1 | yes | yes | — | — |
| T2 | yes | yes | **yes** | — |
| T3 | yes | yes | yes (`deps:prod-install` proves default zero-dep) | — |
| T4 | yes | yes | — | regression: ingress+process share traceId |
| T5 | yes | yes | — | — |
| T6 | yes | yes | — | — |
| T7 | yes | yes | yes (`./query` subpath) | — |
| T8 | yes | yes | — | **`scaffold.runtime` Flow-B assertions (epic gate)** |

## Non-negotiables (carry into every slice prompt's `## SKILL` chapter)

- Skills: `netscript-harness`, `netscript-doctrine`, `netscript-tools`, `netscript-deno-toolchain`,
  `netscript-pr`; `jsr-audit` on T2/T3/T7.
- E2E type soundness: only the 2 accepted casts; never defer any other `any` as debt.
- JSR-safe asset embedding (import attributes, never `readTextFile`/`fromFileUrl`).
- Closing keyword `Closes #T<n>` in each **PR body**; **never** a keyword on the telemetry epic or #301.
- Push explicit refspec as `codex`; no force-push; no `git add -A`; no `--no-verify`.
- Evaluator is a **separate session** from the implementer; Fable never writes framework code.
- Do not run the expensive `scaffold.runtime` e2e per intermediate loop — reserve it for T8 /
  merge-readiness.
