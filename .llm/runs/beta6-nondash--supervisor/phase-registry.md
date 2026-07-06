# Phase Registry — beta6-nondash--supervisor

Live status of every lane/slice. Statuses: pending | active | impl-done | adversarial | eval |
merged | blocked | closed-n/a | owner-batch

## Lane TEL — telemetry-revamp (#399)

| Slice | Issue | Lane | Status | PR | Notes |
| --- | --- | --- | --- | --- | --- |
| TEL-T3 | #404 | D (Codex high) | pending | — | wave 1; load-bearing for T5/T6 |
| TEL-T4 | #405 | D (Codex high) | pending | — | wave 1; ∥ T3, rebase risk accepted (D-2) |
| TEL-T5 | #406 | D (Codex high) | pending | — | wave 2; hard-dep T3 merged |
| TEL-T6 | #407 | D (Codex high) | pending | — | wave 2; ai-half after #494 (D-2) |
| TEL-T7 | #408 | D (Codex high) | pending | — | wave 2; contract-only, dashboard coupling → drift (D-6) |
| TEL-T8 | #409 | D (Codex high) | pending | — | wave 3; EPIC MERGE GATE — last |

## Lane AI — AI-stack beta.6 (#238 family)

| Slice | Issue | Lane | Status | PR | Notes |
| --- | --- | --- | --- | --- | --- |
| AI-494 | #494 | D (Codex high) | pending | — | wave 1; plugin-ai-core zod lockstep |
| AI-463 | #463 | D (Codex high) | pending | — | wave 1 (next free slot); upstream of #379 |
| AI-257 | #257 | B (Opus 4.8 high) | pending | — | wave 1; owns first manifest edit (D-3) |
| AI-258 | #258 | B (Opus 4.8 high) | pending | — | wave 2; rebases manifest after #257 |
| AI-379 | #379 | D (Codex high) | pending | — | wave 2; deps #257 + #463 merged |
| AI-464 | #464 | D (Codex high) | pending | — | wave 3; MERGE GATE — last; effective deps re-derived (D-4) |

## Lane PM — process-manager

| Slice | Issue | Lane | Status | PR | Notes |
| --- | --- | --- | --- | --- | --- |
| PM-0 | #511 | D (Codex high) | pending | — | independent; queued wave-1 slot |

## Lane PROG — program/track

| Slice | Issue | Lane | Status | PR | Notes |
| --- | --- | --- | --- | --- | --- |
| PROG-389 | #389 | A (Fable) | pending | — | bookkeeping: verify V3 acceptance; owner-batch close/keep decision |
| PROG-303-audit | #303 | B (Opus high) | pending | — | scope audit of 172a-2-SOUND remainder |
| PROG-303-impl | #303 | D (Codex high) | blocked | — | after TEL W1–W2 merge (D-5) + audit |
| PROG-306 | #306 | B (Opus high) | pending | — | 5 remaining harness/skills bullets |
| PROG-307 | #307 | — | owner-batch | — | p2 deprioritized; audit-then-decide if capacity |

## Run gates

| Item | Status | Notes |
| --- | --- | --- |
| PLAN-EVAL (OpenHands minimax-M3, separate session) | pending | HARD STOP before any implementation slice |
| T8 Flow-B suite green | pending | telemetry epic DoD |
| #464 capability e2e green | pending | AI lane DoD |
| Owner batch summary | pending | #389 close, #307 verdict, release readiness |
