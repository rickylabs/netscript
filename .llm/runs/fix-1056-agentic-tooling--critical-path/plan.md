# Plan: agentic runtime, lane bindings, and release tooling

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1056-agentic-tooling--critical-path` |
| Branch | `fix/1056-agentic-tooling` |
| Phase | `plan` |
| Target | repository agentic/runtime/release tooling and harness docs |
| Archetype | N/A — no package/plugin surface |
| Scope overlays | docs |

## Archetype

N/A. The changed TypeScript belongs to `.llm/tools/agentic` and `.llm/tools/release`, not a shipped
package/plugin. The docs overlay governs the lane-policy and discoverability guidance.

## Current Doctrine Verdict

N/A for non-package tooling. Repository operating rules and harness invariants are authoritative.

## Goal

Land five independently validated commits in the owner-specified order: unblock Gemini-backed docs
authoring first; repair Codex runtime truthfulness; gate unanswered review threads; remove unsafe
Aspire teardown guidance; then address only #1004's remaining missing-member retry evidence.

## Scope

- S1: Gemini 3.6 Flash documentation-authoring generator lane, preset, rendered policy, and
  evaluator-rejection regression test.
- S2: process/socket-anchored Codex session liveness and anchored app-server process counting.
- S3: read-only review-thread reporting plus CI reply gate and symptom-first discoverability.
- S4: exact-AppHost Aspire cleanup guidance, regenerated consumer assets, and forbidden-inventory
  removal.
- S5: #1004 remaining missing-member retry behavior/evidence only.

## Non-Scope

- No change to Qwen 3.7 Max or the formal evaluator approved-model set.
- No PR creation, edit, labels, comments, or milestone mutations; the owner retains PR control.
- No host-wide Aspire stop, foreign process/container cleanup, or changes under `wave4-*`.
- No reimplementation of #1004 behavior already merged in #1035.

## Hidden Scope

- Harness run artifacts travel with every slice so gate evidence and commit hashes remain resumable.
- Provider-profile finite tuples/tests must grow with the Gemini preset.
- Generated consumer output, rather than source alone, is the acceptance oracle for S4.

## Locked Decisions

| ID | Decision | Rationale |
| --- | -------- | --------- |
| D1 | `documentation_authoring` uses Claude + OpenRouter + `google/gemini-3.6-flash`. | Owner decision dated 2026-08-03. |
| D2 | Gemini is a generator only and is positively rejected by the formal evaluator resolver. | Preserves the paid-model exclusion. |
| D3 | `OPEN_EVALUATOR_MODEL_IDS` remains exactly Minimax M3 + Qwen 3.7 Max. | Explicit invariant. |
| D4 | Runtime liveness is anchored in process/socket reality. | Stale rollout files cannot prove liveness. |
| D5 | Review replies, including reasoned declines, satisfy S3; outdated threads do not block. | Silence is the defect, not disagreement or UI resolution state. |
| D6 | Aspire cleanup guidance uses an exact AppHost path. | Shared-host-wide teardown is unsafe and unreliable. |
| D7 | S5 stops at truthful remaining-scope reporting if live workflow behavior cannot be safely evidenced. | Owner directive forbids fake evidence. |

## Open-Decision Sweep

| Decision | Status | Notes |
| -------- | ------ | ----- |
| Gemini id/transport/lane | resolved | Locked by owner. |
| Preset metadata | resolved | Generator preset on Claude/OpenRouter; no evaluator policy. |
| S2 liveness anchor | resolved | Use anchored app-server processes and/or the control socket. |
| S3 reply semantics | resolved | Any reply passes; outdated ignored. |
| S5 live evidence availability | safe to defer | Inspect #1035 and existing tests/workflows in S5; report limits honestly. |

## Risk Register

| Risk | Mitigation |
| ---- | ---------- |
| Gemini accidentally enters evaluator policy | Preserve the exact approved tuple and add a resolver rejection test using the new lane. |
| False-green validation through piped exit status | Run commands directly and inspect complete output/artifacts. |
| User changes folded into commits | Check raw git status/diff before every commit and stage explicit paths. |
| Foreign live resources disturbed | All runtime checks are read-only; never stop/kill undeclared resources. |
| Section 1 delayed behind later work | Commit and push S1 alone, then stop and report its hash. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| ----- | ---- | ---------------- | --------------- |
| 1 | S1 routing tests | `deno test .llm/tools/agentic/runtime/provider-profiles_test.ts .llm/tools/agentic/runtime/routing-policy_test.ts` | PASS, including Gemini rejection |
| 2 | Volatile guard | `deno test .llm/tools/agentic/config/no-hardcoded-volatile_test.ts` | PASS with no production hardcode |
| 3 | Scoped lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root .llm/tools/agentic --ext ts` | PASS |
| 4 | Scoped fmt | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root .llm/tools/agentic --ext ts` | PASS |
| 5 | Final static | `deno task check` and `deno task test` | PASS with named suites present |

## Deferred Scope

- Sections 2–5 are deferred until Section 1 has its own pushed commit and the hash is reported.
- Package/plugin quality and architecture gates are N/A unless scope unexpectedly reaches those
  trees, which would require a recorded rescope.

## Drift Watch

- Any change to the owner-specified model id, evaluator set, Qwen binding, or commit ordering.
- Any inability to produce live S5 registry evidence without an unsafe or unauthorized publish.
