# Wave plan v2 — 0.0.5 (stage B)

v2, 2026-08-03: revised against PLAN-EVAL `FAIL` (`plan-eval.md`, commit `b8b7475b1`) — every
blocker resolved, every major addressed. v1 is in git history (`79a28e612`). Clustering is built
on acceptance text (`research.md` records the read); 44 open issues at run start, 42 now in
milestone after two recorded moves.

## Issue disposition — every milestone issue, exactly one class

| Class | Count | Issues |
| --- | --- | --- |
| PR-closable | 33 | all issues in the wave table except #1166, #1168, #1004 |
| PR + evidence hand-close | 3 | #1166 (PR carries `Refs`; boxes 2–4 tick only on canary.1's recorded merge-commit demonstration and the #1149 re-verification), #1168 (PR closes retry classification + visibility boxes; the transient-vs-ceiling measurement box ticks only on a real fired retry during this run, else it moves with a written reason), #1004 (R2-HON-1: its last box needs a real partial-publish retry's registry log — W6-B carries `Refs #1004`; hand-close on recorded evidence or the box moves with reason) |
| Observational hand-close | 2 | #1149 (0.0.4 retro-audit + this run's canary evidence; box 4 gated on #1166), #1090 (inherited-0.0.4 observations only; hand-closed on evidence or moved at cut) |
| Epic / tracking — no closing keywords | 3 | #1126, #1169 (its one-pass DoD box is evidenced by this run's stable cut), #1117 (hand-verified close after S9/S12 land; box 6 routed to #1140@0.0.6) |
| Gated out (F2 stands at (a)) | 1 | #1139 — moves at cut with written reason unless owner flips F2 |
| Moved to 0.0.6 (done, reasons on issues) | 2 | #1140 (post-ship observation; HON-1), #1175 (release-activity constraint; COV-1) |
| Mid-run additions (filed 2026-08-03, orchestrator) | 1 | #1187 (pr-checks cross-attempt supersede defect, found at PR #1181's gate) → **PR-closable**, wave 3, Sol·low-medium |
| Mid-run addition (filed 2026-08-03, owner; wave-4 control run) | 1 | #1189 (plugin linking declared in config, wired by one core seam — p1) → **PR-closable**, **W6-A (Sol·high), canary.4 train**, sequenced after #1093 (shared plugin-core surface, split per the critical-code rule); holds wave 6's expensive-gate slot; verification = the seven-point protocol adapted (single-command install/start, OTEL-proven cross-boundary call, RED-first, install-order independence, uninstall cleanup) + the fixture third-party plugin wired without touching CLI source as the seam proof. Wave-6 tail (#1110, #1137+#1138) slides to wave 7 |
| Mid-run addition (filed 2026-08-03, orchestrator; disposition recorded 2026-08-04 — found undispositioned in the milestone-23 reconciliation) | 1 | #1188 (close-gate derives closing issues from body keywords only; GitHub also auto-closes Development-sidebar manual links unverified — #1169 child) → **wave-7 tail alongside #1137/#1138, 0.0.6-move candidate at cut time with written reason**. Compensating control until fixed, binding on every merge this run: the pre-merge gate checks the PR's GraphQL `closingIssuesReferences` against body keywords and clears or re-routes any sidebar-only link before merging |
| Mid-run addition (filed 2026-08-04, orchestrator; from the #1211 merge-gate incident) | 1 | #1219 (`e2e-cli.yml` still respawns/cancels on labeled/unlabeled — the #1214 ci.yml fix was never applied there; a label event killed PR #1211's runtime verdict at minute 29) → **PR-closable**, fast-iteration slice (Luna·max per lane-policy small-fixes row), dispatch between canary.6 and the wave-4 merges; policy test per the #1212/#1214 convention |
| Mid-run addition (filed 2026-08-04, orchestrator; found by the #1190 protocol run) | 1 | #1223 (Redis-persisted saga state reaches projection with unrevived dates — `saga_instances` never projected; silent-dead saga surface behind a healthy-looking app) → **PR-closable**, sagas thread continues as the fix slice (Sol·high, saga-work standard), #1184 closure bar (seven-point both-backends protocol GREEN) before merge; blocks #1190 evidence hand-close, so it precedes the cut-time checklist |
| Mid-run addition (filed 2026-08-03, owner; amended same day) | 1 | #1184 (sagas generated glue registers no KV adapter — p1 published-artifact defect) → **PR-closable**, scheduled W2-F (Sol·high) into the canary.2 train. Closure bar: the owner's **seven-point saga verification protocol** (fresh default scaffold, genuinely-healthy resource with populated healthReports, full lifecycle incl. compensation, `aspire otel` trace/span/log evidence with correlation held, RED before GREEN, restart durability, artefact-not-exit-code) — the standard for **all saga work this milestone**. Canary.2's pair supplies the published-artifact confirmation, quoted on the issue before close |

Total: 33 + 3 + 2 + 3 + 1 + 2 = **44** ✓ (+ #1188, #1219, #1223 dispositioned 2026-08-04 → **47**). The wave table contains **31 PRs covering 36 issues**
(34 PR-closable + the two Refs-carrying PRs for #1166/#1168).

## Wave table

Lanes per `lane-policy.md`; Sol = Codex GPT-5.6 Sol, agy = Antigravity docs lane (serialized, one
docs PR per wave — quota contingency is re-waving, never substitution). Review composes existing
triggers (draft→ready augment + OpenHands label). Dependencies run across waves only. Gate columns
name the **proving gates** per cluster; every `packages/**`/`plugins/**` PR additionally takes the
framework-wave law: `quality:gate` (scan + arch:check), scoped check/lint/fmt wrappers, doc-lint +
publish dry-run when the export surface moves (jsr-audit risk: #1102, #1093, #1110, #1112, OMB
S4–S7 — all touch published packages).

### Wave 1

| PR | Issues | Scope | Lane | Proving gates |
| --- | --- | --- | --- | --- |
| W1-A | #1168 | epic #1169 S1 — first per the epic's slicing record: retry classification, attempt-visible report, retry-rate record; measurement box per disposition above | Sol · medium | non-retry negative test; report artifact shows retried-pass distinctly |
| W1-B | #1127 #1128 #1129 | OMB wave-0 proofs; P1 arbitrates F1 (FAIL ⇒ F1(b), S7 re-scoped) | Sol · high | three committed `proofs/P<n>-verdict.md`; skipped ≠ passed |
| W1-C | #1166 (`Refs`) | canary-payload derivation: merge-aware, genuine-empty vs derivation-failure distinguishable | Sol · medium | negative fixture; canary.1 supplies the real-cut demonstration post-merge |
| W1-D | #1134 | OMB S8 existing-machinery: truncation metadata + receipt-after-validation | Sol · medium | both fixtures (failed receipt on invalid output; no silent 75→50) |

**→ Canary point 1** (wave-1 boundary). Payload = whatever landed since 0.0.4 stable, derived by
the **corrected #1166 implementation** — the point must record the merge-commit/updated-branch
case before #1166's boxes tick.

### Wave 2

| PR | Issues | Scope | Lane | Proving gates |
| --- | --- | --- | --- | --- |
| W2-A | #1170 | epic S2: `agentic:pr-checks` latest-run-per-name rollup | Sol · medium | two-fixture negative case (cancelled-superseded clean; genuine red non-zero) |
| W2-B | #1174 #1142 | epic S4 (one slice per #1174's body): deleted-ref guard + `$GITHUB_OUTPUT` sweep | Sol · medium | deleted-ref negative case; post-merge conclusions green-or-absent on a real merge |
| W2-C | #1130 | OMB S4 projection domain (P2 verdict in hand) | Sol · high | ladder/ambiguity/no-hallucinated-envelope fixtures; Archetype-2 column |
| W2-D | #1131 | OMB S5 directory port + adapters (P1 verdict in hand; F1(b) switches primary source, same contract) | Sol · high | full source-outcome fixture matrix; row-level timeout fixture |
| W2-E | #1106 | auth session-lifecycle docs (pure docs) | agy · low | adapter-entrypoint compile checks; docs link check |

### Wave 3

| PR | Issues | Scope | Lane | Proving gates |
| --- | --- | --- | --- | --- |
| W3-A | #1171 #1105 | epic S3 + close-gate PR-body convention (shared `check-close-gate.ts`, shared verdict-honesty acceptance; recommendation to brief: enforce, per #1088) | Sol · medium | stale-verdict test; PR-body failing-case fixture |
| W3-B | #1132 | OMB S6 three read tools (S4/S5/S8 landed) | Sol · high | truncation/absent-count/sources-verbatim fixtures; registry 14→17 |
| W3-C | #1133 | OMB S7 manifest emission — scope + effort set by the P1 verdict at dispatch | Sol · medium–high | `scaffold.runtime` evidence (serialized; sole expensive-gate holder this wave) |
| W3-D | #1119 | AI-rollout canary rename — early, before further canary points harden the vocabulary | Sol · low | no bare "canary" left for AI rollout; nothing silently broken |
| W3-E | #1109 | runtime testing/observation/replay docs | agy · low | per-example compile coverage; published-subpath imports |

**→ Canary point 2** (wave-3 boundary — OMB spine + read tools: the release's main
public-surface change).

### Wave 4

| PR | Issues | Scope | Lane | Proving gates |
| --- | --- | --- | --- | --- |
| W4-A | #1172 | epic S5: serialize `scaffold.runtime` + lease naming holder | Sol · medium | forced-collision negative case as a real run; release surface untouched |
| W4-B | #1135 | OMB S9 activation surfaces + migration fixture | Sol · medium | byte fixtures; S-18 re-init fixture |
| W4-C | #1136 | OMB S10 evidence-gate acceptance (S8 landed wave 1) | Sol · medium | post-fix receipt satisfies gate; pre-validation receipt unproducible |
| W4-D | #1104 | cron retry/backoff: implement-vs-deprecate decision + fake-clock tests | Sol · high | deterministic retry/exhaustion/cap/cancellation tests on both adapters |

### Wave 5

| PR | Issues | Scope | Lane | Proving gates |
| --- | --- | --- | --- | --- |
| W5-A | #1173 | epic S6 refusal-honesty audit (after S5, per epic order) | Sol · medium | audit list on the PR; negative-case test per refusal path |
| W5-B | #1102 | intent-aware capability discovery + eval corpus; tracking box → #1140@0.0.6 | Sol · high | checked-in corpus with expected top-k; bounded responses |
| W5-C | #1093 | plugin-discovery de-hardcoding | Sol · high | third-party fixture test that fails on today's main; doctrine check |
| W5-D | #1108 | docs-reference drift gate + bulk inventory repair | Sol · medium | negative fixture: an added export fails until mapped |

**→ Canary point 3** (wave-5 boundary).

### Wave 6

| PR | Issues | Scope | Lane | Proving gates |
| --- | --- | --- | --- | --- |
| W6-A | #1085 | launch-codex-slice lifecycle (scope netted against #1173's audit findings) | Sol · medium | orphaned-session test; SIGTERM survival |
| W6-B | #1004 (`Refs`) | same-semver canary republish path (last box: demonstrated partial-publish retry — a canary re-run this cycle can supply it, else the box moves with reason) | Sol · medium | skip-already-published logged on the demonstration |
| W6-C | #1148 | version-residue scan widening | Sol · low | seeded stale `.ts` fails; exclusions documented |
| W6-D | #1110 | contracts pagination walkthrough + JSDoc fix (after #1108, shared page) | Sol · low | Prisma-shaped compile fixture; boundary/error coverage |
| W6-E | #1137 #1138 | OMB S11 contract enrichment (F3a) + S12 reference docs (S6 surface final) | Sol · low | publish dry-run + doc-lint on touched packages; links green |

### Wave 7

| PR | Issues | Scope | Lane | Proving gates |
| --- | --- | --- | --- | --- |
| W7-A | #1024 | last box: standalone consumer scaffold e2e | Sol · medium | scaffolded project runs full smoke without the framework repo |
| W7-B | #1112 | MySQL Prisma adapter docs + option/cleanup code + tests (mislabel-corrected) | Sol · medium | adapter option-translation/cleanup tests |
| W7-C | #1116 | AI docs (retries/budgets/citations) + JSDoc touches | Sol · low | typed examples compile; focused provider-retry tests |
| W7-D | #1115 | `codex-follow` + live state (rollout recency, not process liveness) | Sol · medium | one-command "working/idle/stalled" answer demonstrated |

**→ Canary point 4** (wave-7 boundary — final; supplies the green canary pair
`netscript-release` requires) → stage F cut-time checklist → stable cut (owner's publish call).

## Canary schedule — the single, four-point declaration

Owner-decided 2026-08-03 ("6 if strictly needed otherwise 3-4" / "failed canary doesn't block"):

| Point | Boundary | Rationale |
| --- | --- | --- |
| canary.1 | wave 1 | strictly needed: the demonstration vehicle for #1166 and #1149 |
| canary.2 | wave 3 | OMB spine + read tools — main public-surface change |
| canary.3 | wave 5 | activation, discovery, enrichment groundwork |
| canary.4 | wave 7 | final; the green-pair precondition for the stable cut |

Boundaries of waves 2, 4, 6 carry **no** canary; promotion of one is a recorded decision at that
boundary. Membership at every point is **content-derived from actual merge history using the
corrected, merge-aware derivation #1166 lands in wave 1** — the wave is a dispatch unit, the
canary is a content unit; a PR that lands out of plan order is still in the payload. Version
strings and labels come from `release-canary.yml`'s publish output (D3) — never typed, never from
this plan. A red canary blocks **only the cut**, never the next dispatch.

## Open-decision sweep

| Decision | Class | Holder |
| --- | --- | --- |
| F1 mechanism (manifest seam vs aspire-cli) | resolved by P1 verdict, wave 1 | #1127 |
| #1104 implement-vs-deprecate | must-resolve at W4-D dispatch: supervisor briefs both, PR records the choice + rationale | orchestrator brief |
| #1105 enforce-vs-convention for PR-body checklists | must-resolve at W3-A dispatch; recommendation: enforce (per #1088) | orchestrator brief |
| #1139 in/out | safe-to-defer; out unless owner flips F2 | owner |
| #1149/#1166/#1168 evidence boxes | resolved by declared evidence points (canary.1, a fired retry) or move with reason | orchestrator at cut |
| canary promotion at waves 2/4/6 | safe-to-defer; recorded decision if promoted | orchestrator |

## Risk register

| Risk | Mitigation |
| --- | --- |
| P1 proof FAILs (legitimate) | F1(b) pre-planned: W2-D keeps scope, W3-C re-scoped + re-tiered at dispatch |
| Codex weekly quota (57% used at plan time) exhausts mid-run | quota recorded per wave-dispatch; waves shrink rather than substitute; owner informed at ≥85% |
| agy cap mid-docs (0.0.4 precedent) | one docs PR per wave, serialized; re-wave remainder, never substitute |
| `scaffold.runtime` contention (three concurrent runs = two false fails, 0.0.4) | expensive gates serialized: one holder per wave (W3-C; W4-A adds the lease) |
| shared-machine load (froze at 160 in 0.0.4) | ≤4 local Codex lanes + ≤1 agy per wave; `codex-status` + leak-check before each dispatch |
| stale-red / false-green check readings during merges | pre-merge gate rules 4 + false-red (#1142); after W2-A lands, `agentic:pr-checks` supersedes the manual rule |
| #1166 regression discovered at canary.1 | canary.1 verdict is a finding, not a hand-patch; failed canary blocks only the cut |

## Re-planning stance

The plan is a dispatch schedule, not a contract. Undispatched remainder re-clusters freely;
queue-jumps land when they unblock a lane; `cut-trace.md` records what actually happened. The
stage-B dispatch preconditions (provider quota + paid-transport) are checked and recorded in
`worklog.md` immediately before **every** wave dispatch — the PLAN-EVAL dispatch record
(2026-08-03) is the template.
