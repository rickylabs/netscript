# Phase Registry — beta5-impl--supervisor

Live status of every phase group / lane in the beta.5 implementation run.
Statuses: pending | active | impl-done | adversarial | eval | merged | blocked | closed-n/a

## Step 0 — reconciliation

| Group | Scope | Lane | Status | Notes |
| --- | --- | --- | --- | --- |
| X-ref map | Cross-reference beta.5 issues vs seed-run docs | C (Sonnet 5 high workflow) | merged | DONE 18/18 agents; reconciliation-map.md; Phase-0 issue edits applied (#301 #389 #306 #347 #348 + #307 comment) |

## Step 1 — chores/optimization wave (merge BEFORE features)

| Group | Issue | Lane | Status | PR | Notes |
| --- | --- | --- | --- | --- | --- |
| CI skip-expensive (docs-only + skip labels) | (owner addendum 2) | B (Opus 4.8 high) | merged | #487 | MERGED 2026-07-06 00:15Z (main 37e6818c); genuine IMPL-EVAL PASS; `ci:skip-scaffold` label created live |
| S2 enterprise maturation | #303 | D (Codex high) | adversarial | #483 | SLICE-COMPLETE 7e295569; Opus review CAVEATS(1) AiContractDefinitionShape un-exported (docs #492 references it); re-export steer resume-303c |
| S4 doctrine revamp | #305 | D (Codex high) — quick-win only | merged | #484 | MERGED 2026-07-06 (main 7ce447d7); eval PASS (job-fail/comment-PASS pattern); full 12-ch rewrite = OWNER-BATCH |
| S5 harness+skills revamp | #306 | B (Opus 4.8 high) | merged | #486 | worktree-isolated sub-agent; branch chore/306-harness-remainder |
| S6 stale-code elimination | #307 | D (Codex high) — Waves 2+4 | merged | #485 | thread 019f3492-97ee…; caveat fixed ac9e06ba; IMPL-EVAL dispatched (4888024439); W3 blocked on #305; W5 OWNER-BATCH |
| harness-V3 remnants | #389 | closed-n/a | merged | — | body bookkeeping applied; stays OPEN as durable umbrella by design |

## Step 2 — feature lanes

| Group | Issue | Lane | Status | PR | Notes |
| --- | --- | --- | --- | --- | --- |
| T1 telemetry convention | #402 | D (Codex high) per launch brief | eval | #489 | SLICE-COMPLETE-2 fe0203a9 (semconv 1.43.0 + correlation floor + domain roots); IMPL-EVAL dispatched |
| T2 ports/adapters restructure | #403 | D (Codex high) | pending | — | strictly after T1 IMPL-EVAL; gate:jsr full-export doc-lint + publish dry-run |
| AI anchor | #219 | D (Codex high) FA-fix + A (Fable gate) | active | — | DRIFT: seam analysis proved FA1/FA2 unadoptable (hardcoded /ai/chat subpath) + FA2 misses decode-time crash; FA-fix MERGED 2026-07-06 (PR #488, main 927ad485): streamPath override + identity-encoding on all FA1/FA2 reads + Vite plugin assignability contract; adversarial CAVEATS(2) fixed a46e75cc, IMPL-EVAL PASS 5/5, Tier-A reviewed; #219 stays OPEN — closes via eis-chat gate = Step 3 |
| Deploy S9 | #345 | owner-batch — parked | blocked | — | owner D3/D4: deferred to stable; staging placement only |
| Deploy S10 | #346 | D (Codex high) | eval | #491 | SLICE-COMPLETE-2 04a93861 (env-misuse removed, config plumbed, cloud-run=real image provider); IMPL-EVAL dispatched |
| Deploy S11 | #347 | D (Codex high) | eval | #490 | SLICE-COMPLETE-2 aad80af9 (plan verb + output-dir + guard test, diff-verified); IMPL-EVAL dispatched |
| Deploy S12 | #348 | D (Codex high) | pending | — | ready; body fixed; deploy-group.ts:76 marker, no init verb, no cut.ts deploy step |
| eis-chat seam-usage analysis | (pre-#479) | C (Claude workflow) | merged | — | DONE 9/9 agents; report + audits committed (eischat-seam-analysis.md/-audits.json); 24 issue candidates; #219 criterion NOT satisfied → FA-fix slice spawned |
| AI reference docs | #479 | C (Claude workflow) | merged | #492 | MERGED 2026-07-06 (main f89623a2); FAIL_FIX handled single-loop (8e47ada7 + SSE-finding rebuttal); #479 auto-closed |

## Step 3 — validation gate

| Group | Scope | Lane | Status | Notes |
| --- | --- | --- | --- | --- |
| eis-chat coverage gate | validate shipped AI seams vs eis-chat | Fable 5 sub-agent | pending | after AI epic lands; findings → issues |

## Release prep

| Item | Status | Notes |
| --- | --- | --- |
| e2e-cli-prod re-proof | pending | intentionally red for beta.4; beta.5 cut must re-prove green |
| Release cut prep (owner executes) | pending | everything green + owner batch summary by morning |
