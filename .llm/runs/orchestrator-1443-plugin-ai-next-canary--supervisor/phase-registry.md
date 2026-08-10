# Phase Registry — orchestrator-1443-plugin-ai-next-canary--supervisor

One PR (#1444) closing **two** issues: **#1443** (AI topology/scaffold defect class) and **#1445**
(the shared configured-module contract, filed under the owner-authorized rescope in `drift.md` D-6).

Plan **v5**, **thirteen** slices. Groups below are capability-scoped slices of that single PR, each
delegated to a daemon-attached Codex session and reviewed by the Tier-A supervisor before sign-off.

| Group | Scope | Slices | Lane | Status |
| --- | --- | --- | --- | --- |
| G0 · Research & Plan | reproduce, mechanize, lock decisions, rescope | — | Opus 5 high (supervisor) | done |
| G1 · Plan-Gate | PLAN-EVAL against `gates/plan-gate.md` | — | Codex Sol high (`formal_plan_evaluation`) | cycles 1–3 `FAIL_PLAN`; v5 re-eval pending |
| G2 · Protocol & host rule | atomic manifest shape + every consumer; no synthesized service entrypoint | S1, S2 | Codex Sol high (`complex_implementation`) | blocked on G1 |
| G3 · AI truth & module contract | AI manifest; manifest-exporting `ai/mod.ts`; installed identity | S3, S4, S5 | Codex Sol high (`complex_implementation`) | blocked on G2 |
| G4 · AI surface | registry-sourced markdown closure; compilable `ai/**` | S6, S7 | Codex Sol medium (`normal_implementation`) | blocked on G3 |
| G5 · Doctor & consumer gate | three invariant checks; an assertive `consumer-verify.sh` | S8, S9 | Codex Sol low (`light_implementation`) | blocked on G2 |
| G6 · Shared contract (#1445) | all six plugins export a manifest; complete import surfaces | S10, S11 | Codex Sol high (`complex_implementation`) | blocked on G3 |
| G7 · Canonical E2E | runtime-schemas, `ai/**` check, appsettings + doctor-negative gates | S12 | Codex Sol medium (`normal_implementation`) | blocked on G5, G6 |
| G8 · Proof & release handoff | expensive E2E, leak-check, IMPL-EVAL, merge, canary handoff | S13 | Opus 5 high + Fable 5 medium (IMPL-EVAL) | blocked on G7 |

Effort per `lane-policy.md` §"Sol effort selection": `high` only for genuinely complex slices (G2
changes a published protocol; G3 and G6 change a shared loader contract across six packages),
`medium` where mid-slice research is likely, `low` for the mechanical doctor/script slice.

**Never launch two writers in this worktree at once** — the launcher enforces this
(`duplicate_sender_risk`). Each group records its Codex thread id, cwd, daemon route, and steering
command in `worklog.md` before the supervisor waits on it. Sessions are Desktop-visible only; no
group claims mobile proof (`drift.md` D-4/D-5).

## Escalations

- `escalations/E-1-configured-module-contract.md` — **resolved** 2026-08-10: owner authorized fixing
  the shared contract in this PR and filing #1445 for tracking.
