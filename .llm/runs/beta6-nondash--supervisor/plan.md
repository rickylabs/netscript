# Plan — beta6-nondash--supervisor

Approved scope: the **non-dashboard** open `0.0.1-beta.6` board (charter 2026-07-06). Baseline
origin/main `a1669f60`. Dashboard #400/#410–#431 hard-excluded (rescope PR #506 owns them).

## Archetypes / overlays

Multi-lane supervisor run (4 phase groups). Per-slice archetypes: telemetry = ARCHETYPE-2
(ports/adapters core) + plugin overlays; AI-stack = ARCHETYPE-2 (`@netscript/ai`) + ARCHETYPE-4
(`fresh`/`fresh-ui`, `SCOPE-frontend`); PM-0 = CLI/config (ARCHETYPE-6 tooling surface); program
lanes = harness/docs (`SCOPE-docs` where applicable). Each Tier-D brief names its archetype.

## Topology (recorded lane configuration)

Per-slice branches + draft PRs against **main** (beta rolling-cadence shape used by beta.4/beta.5
supervisor runs), NOT a single integration branch — merge-on-green is granted per slice PR and the
board is issue-per-slice. This is a recorded deviation from `workflow/supervisor.md`'s
integration-branch layout; rationale: slices are independently shippable, the milestone is a
rolling beta, and stacked integration would serialize unrelated lanes. Registry: `phase-registry.md`.

## Lane plan

### Lane TEL — telemetry-revamp (#399)

| Slice | Issue | Lane | Deps | Surface (primary) |
| --- | --- | --- | --- | --- |
| TEL-T3 | #404 | D (Codex high) | — | telemetry ports + otel-deno/otel-sdk adapters + enabled gate |
| TEL-T4 | #405 | D (Codex high) | — (∥ T3, low overlap) | telemetry propagation + plugins/triggers parenting |
| TEL-T6 | #407 | D (Codex high) | T3 merged; AI-half after #494 | oRPC TracingPlugin + sdk CLIENT span + ai TelemetryPort + workers metrics |
| TEL-T7 | #408 | D (Codex high) | — (after T3 merge preferred) | `application/query` + `adapters/aspire-query` + `./query` subpath |
| TEL-T5 | #406 | D (Codex high) | **T3 merged** (SDK link attributes) | SpanLinkPort + createFanInLinks + streams/sagas spans |
| TEL-T8 | #409 | D (Codex high) | T4+T5+T6+T7 merged | Flow-B `BEHAVIOR_OTEL_TRACES` suite under scaffold.runtime — **epic merge gate, LAST** |

Waves: W1 = T3 + T4 → W2 = T5 + T6 + T7 → W3 = T8. T7 note: query contract only; dashboard-panel
integration decisions stay with the rescope (log coupling in drift.md).

### Lane AI — AI-stack beta.6 (#238 family)

| Slice | Issue | Lane | Deps | Surface (primary) |
| --- | --- | --- | --- | --- |
| AI-494 | #494 | D (Codex high) | — | ai ports/chat-client + 3 adapters + reasoning AgentChunk + plugin-ai-core zod lockstep |
| AI-463 | #463 | D (Codex high) | — (∥ #494, disjoint) | ai `/mcp` pool over existing transports + ui:// extraction |
| AI-257 | #257 | B (Opus 4.8 high) — UI slice, worktree-isolated | — | fresh-ui McpUiWidget island + manifest entry |
| AI-258 | #258 | B (Opus 4.8 high) — UI slice, size L | manifest after #257 | fresh-ui generative-ui-renderer + depth/whitelist guards + blocks |
| AI-379 | #379 | D (Codex high) | #257 + #463 merged | fresh `./ai` createMcpAppCallHandler (allowlist + stdio fallback + OTel) |
| AI-464 | #464 | D (Codex high) | all above merged | FAI-2 `ai` e2e `--mcp` variant + render + round-trip assertions — **merge gate, LAST** |

Waves: W1 = #494 + #463 + #257 → W2 = #258 + #379 → W3 = #464. Flagship-quality mandate applies
(meet-or-exceed reference plugins); #464 must fail if the capability slices didn't land.
Note: #464's cited FAI-5/6/8 deps are phantom handles — effective dep set {#494 #463 #257 #258 #379}
(research §3, drift D1).

### Lane PM — process-manager precursor

| Slice | Issue | Lane | Deps | Surface |
| --- | --- | --- | --- | --- |
| PM-0 | #511 | D (Codex high) | — | cli deploy router/registry + config resolveTargetConfig alias + flat-verb de-gate |

Single slice, independent, can launch in wave 1.

### Lane PROG — program/track

| Slice | Issue | Lane | Deps | Shape |
| --- | --- | --- | --- | --- |
| PROG-389 | #389 | A (Fable bookkeeping) | — | verify V3 acceptance vs main; owner-batch close/keep-open recommendation; NO closing keyword |
| PROG-303 | #303 | B audit → D impl | audit first; impl after TEL W1–W2 (plugin-core contention) | 172a-2-SOUND type-soundness beta gate + no-slow-types publish |
| PROG-306 | #306 | B (Opus high, harness/doc authoring) | — | 5 remaining bullets; `sync-claude-skills --check` + `validate-claude-surface` green |
| PROG-307 | #307 | deprioritized (p2) | capacity-gated | re-verify remaining waves vs main; audit-then-decide only |

## Concurrency + scheduling

Max **3 concurrent Codex threads** + 1–2 Opus worktree sub-agents (beta.5-proven envelope).
Launch order wave 1: TEL-T3, TEL-T4, AI-494 (Codex ×3) + AI-257, PROG-306 (Opus ×2) + PM-0 queued
next free Codex slot (or swapped in for T4 if T3/T4 overlap bites). AI-463 follows first freed
Codex slot. PROG-389 is supervisor bookkeeping, immediate.

## Per-slice protocol (invariant)

1. Tier-D launch only via `.llm/tools/agentic/launch-codex-slice.ts`; record thread id + WSL
   worktree + steering command in `worklog.md`. Tier-B via worktree-isolated Agent sub-agents.
2. Every brief starts `use harness` + `## SKILL` chapter (netscript-harness, netscript-doctrine,
   netscript-pr, netscript-tools, netscript-deno-toolchain, netscript-cli, rtk, + deno-fresh for
   UI slices, aspire for e2e slices).
3. Slice: commit → push (WSL, explicit `HEAD:refs/heads/<branch>`) → draft PR (Closes #N for
   fully-resolved issues; never on epics; labels + milestone per netscript-pr) → PR comment with
   gate evidence → worklog/context-pack update.
4. Gates: scoped wrappers (`run-deno-check|lint|fmt.ts --root <pkg> --ext ts,tsx`) per slice;
   `deno doc --lint` + `publish:dry-run` where the issue carries gate:jsr; `e2e:cli` only at
   merge-readiness / gate slices (T8, #464) or where the issue's acceptance explicitly demands
   scaffold.runtime coverage (#257, #258 — run once at merge-readiness).
5. Adversarial WSL Codex review before IMPL-EVAL (unoriented, fix caveats first); then ONE
   OpenHands qwen-3.7-max IMPL-EVAL round per PR (fix and ship); Tier-A substantive review before
   sign-off; merge on green (squash + delete-branch, verify commit-back file set, retarget stacked
   children first).

## Design

Locked decisions:

- **D-1 Per-slice PRs to main** (no integration branch) — recorded topology deviation, rationale
  above.
- **D-2 T3 before T5 is hard**; T4 parallel with T3 accepting rebase risk on telemetry core; T6's
  `packages/ai` half sequenced after #494 merges to avoid cross-lane conflict.
- **D-3 #257 owns the first manifest edit**, #258 rebases (both Tier B UI per the carried-forward
  routing override).
- **D-4 #464 effective deps re-derived** ({#494 #463 #257 #258 #379}) because FAI-5/6/8 were never
  filed (drift D1). #464's assertions must still be written against capabilities, not issue
  numbers.
- **D-5 #303 implementation deferred behind TEL W1–W2** to avoid plugin-core file contention; a
  Tier-B scope audit runs in parallel so the impl slice is ready to launch immediately after.
- **D-6 T7 ships contract + aspire-query adapter only**; any dashboard-panel-facing decision is
  deferred to the rescope session (charter exception), coupling logged in drift.md.
- **D-7 Merge gates last**: T8 and #464 launch only when every sibling slice in their lane is
  merged; they are the lane-level Definition-of-Done.

## Definition of done (run level)

All 16 non-dashboard beta.6 issues closed via merged slice PRs (epics #399/#389 excepted —
owner-batch close), T8 + #464 gate suites green under `scaffold.runtime`, no red main-push CI,
owner batch summary written (`owner-batch.md`) for: #389 close decision, #307 capacity verdict,
release-cut readiness.
