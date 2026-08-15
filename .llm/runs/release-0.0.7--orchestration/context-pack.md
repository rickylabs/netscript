# Context pack — release 0.0.7

Read, in order:

1. `.llm/harness/workflow/milestone-run.md`
2. `.llm/harness/workflow/canary-cadence.md`
3. `.llm/harness/workflow/run-loop.md`
4. `.llm/harness/workflow/lane-policy.md`
5. `.agents/skills/agent-milestone-orchestrator/SKILL.md`
6. This run's `research.md`, `plan.md`, `worklog.md`, `step0-synthesis.md`, the four milestone
   control JSON artifacts, `milestone-leaf-plan.json`, and `leaf-contracts.json`.

Baseline identity is `01e0960494c95ce56eb35892c211a095eb13e6ed`. Treat GitHub live state as mutable
after the snapshot; any issue or `main` drift must be recorded before dispatch or merge.

Step 0 is approved at 64 inspected targets / 60 active issues, 43 leaves, and nine dispatch waves.
#1564 is closed-fixed; there is no implementation wave-zero barrier. PLAN-EVAL cycle 2 approved
dispatch at plan head `331f7c664`; `leaf-contracts.json` is binding input for every leaf.

Reset authority at `2026-08-15T00:00:00+02:00`: `codex-root-0.0.7` remains sole milestone
coordinator in Codex session `019ffaa3-32ae-7b02-92a5-d7ae146d8cbd`; its canonical transcript is
`/home/codex/.codex/sessions/2026/08/13/rollout-2026-08-13T12-20-27-019ffaa3-32ae-7b02-92a5-d7ae146d8cbd.jsonl`.
Resume that exact session rather than creating a rival coordinator. Its binding route is GPT-5.6-SOL
at **high** effort, never max, through the Codex app-server Remote Control socket
`unix:///home/codex/.codex/app-server-control/app-server-control.sock`. The current proof is resume
PID `2452378` with explicit `-m gpt-5.6-sol -c model_reasoning_effort=high` and app-server PID
`5027` with `--remote-control`; the two interrupted `max` turn contexts are non-authoritative
history. Topic supervision is native Claude Opus 5/high only. Preserve the four active Claude Remote
Control supervisors as-is; a coordinator transport repair never authorizes their relaunch or
mutation. Claude supervisors do not implement; WSL Codex Sol leaves use effort matched to the
harness's per-slice complexity record.

Read `briefs/reset-gates/dispatch.json` after the central state. It supersedes both the pre-reset
six-Fable route and the rejected Sonnet-low matrix. The six retained holds have specific existing
issue/complexity justification; future PLAN-EVAL is conditional rather than mechanical. Formal gates
stay fresh, separate, and opposite-family. Their queues are serial **within each topic
orchestrator**, while one evaluator in each of docs, internals, fixes, and features may run
concurrently. The cluster-wide expensive-gate limit remains reserved for shared resource-heavy
E2E/Aspire work. Opus 5 low through high is the normal adversarial/evaluation route. Fable 5 is
reserved for a recorded genuinely architectural PLAN question or an exceptionally complex
implementation/review. No paused leaf resumes merely because the clock reset; its exact head, hold,
lane-local evaluator lease, CI, and formal gate must be re-established first.

All four historical Codex topic controllers are now durably parked: docs had no live session;
internals/fixes/features returned `TOPIC_CONTROLLER_PARKED`, are idle, and left clean worktrees. The
rejected Sonnet-low replacement canaries also exited with `TOPIC_CONTROLLER_PARKED_MODEL_FLOOR` and
dispatched no leaf or evaluator. The real replacements are now active through native Claude 2.1.233
with explicit `--model claude-opus-5`, `--effort high`, `--remote-control`, the exact initial brief,
and bypass permissions. Their exact session/PID/bridge/URL/topic-head receipts live in
`milestone-cluster-state.json` and their topic journals. The hybrid wrapper is not needed unless a
later task explicitly authorizes its alternate-worker delegation surface.

Live checkpoint advanced at `2026-08-14T23:54:29Z`: `main` is now
`0b3ed5d5a6aea451318f120988c25dfa3993a2ab` after coordinator merges of #1644 and #1643. Reset orders
1, 2, 3, 4, 5, and 6 are terminal `PASS`; orders 3/4/5/6 have been returned to their preserved Codex
implementation threads through the existing Claude topic supervisors. Fixes order 5 first returned
`FAIL_PLAN` cycle 1, was repaired at `5b3c6fcf2` by the original Codex plan-author thread, then
passed fresh PLAN-EVAL cycle 2 at evaluator commit `b8fc5eb53` in session `06451c1e-…`. PR #1654 is
draft at `status:impl`; only its preserved Codex thread `019ffcca-8be0-…` is authorized to
implement. Reset orders 1 and 2 are merged. Continue to serialize only inside each topic
orchestrator; never introduce a cluster-wide evaluator wait, and keep the separate shared-resource
`expensiveGates` mutex empty until a genuine E2E/Aspire gate needs it.

Completion supervision resumed at `2026-08-15T03:46:43Z`. The live continuation point is no longer
the reset-gate table above: docs S2 is active after exact pinned-input provisioning; internals #1653
is in fresh Opus 5/high IMPL-EVAL session `430d5f91-…`; features #1651's session `2a8cf0a6-…` ended
conditional `PASS` at `0e302ad3a`, but owner comment `5300440887` supersedes readiness and requires
the active delegated RFC-0003 duplicate/overlap audit; fixes #1654 repaired Tier-A finding T-1 at
`ebad68c80`, and now holds the singleton slice-6 `scaffold.runtime` lease granted only after empty
Aspire/Docker/central-lease preflight. Keep the coordinator turn active through those terminal
results and subsequent merge-readiness decisions. A supervisor's parked checkpoint is never itself a
reason to yield.

Resume from the authoritative `2026-08-15T05:06:31Z` checkpoint, not the stale paragraph above.
#1653 cycle 2 passed at `70177e808`; current-head CI and close-gate passed, it merged as
`473e8d75b`, and #1378/#1545 closed `COMPLETED` with terminal labels. Internals has advanced its
next serial leaf, `quality-scan-root-coverage` (#1542), to harness bootstrap/research/plan. #1654's
clean retry reached one terminal `suite-end`, 89/0/0, and cleanup receipt proves empty Aspire,
Docker, custom-network, volume, and leak-survivor state; head `0b2cf5e7c` is in Tier-A review and
the shared lease is complete. #1652 must first rewrite issue comments `5265826161` and `5265971722`
in place from authoritative EIS-Chat `5191de83`, with recalculated feature/effort estimates. The
comments predate the material route improvements already contained in that pin; no newer product
head exists, and `834a2b36` differs only by harness evidence. #1651 is not duplicate overall but
remains owner-blocked: wait for option 1 keep-and-narrow, option 2 remove/defer C6, or option 3
close-as-duplicate. Do not infer the verdict. All topic controllers and leaf threads remain the
preserved originals; serialization is per topic, not cluster-wide.

Resume from the newer `2026-08-15T05:16:27Z` checkpoint. #1652's two canonical issue-comment
replacements are complete and approved S3 is running on the original Codex author thread from
`54e1c3bff`. #1654 passed Tier-A at `f178ac663`; its one formal native Fable 5/medium IMPL-EVAL is
attached as session `19f1be7b-db7d-47c0-b0f1-7cfca302d44a`, bridge
`session_01Qs22iAtnVYh2fLb26ABvja`, with no expensive-gate authority. Internals has opened draft
#1656 for #1542 at bootstrap head `5dc2d2148` and is still research/plan-only. Preserve #1651's
owner hold and all four original Opus 5/high Remote Control topic supervisors.

Resume from the authoritative `2026-08-15T05:52:01Z` checkpoint. Main is `da574111a` after #1654
shipped with green post-merge CI/Pages/code-quality; #1262/#1263/#1588 are closed completed and the
host is empty. Docs #1652 is in one bounded F1–F5 repair on its original Codex author thread after
formal IMPL-EVAL cycle 1 `FAIL_FIX` at `e95f48380`; authorize cycle 2 only after the repaired head
receives fresh independent Tier-A. Internals #1656 passed PLAN-EVAL cycle 1 at `3b95a004f` and is
implementing its approved three-file plan on the original Codex thread; the earlier Fable attempt
was zero-token route drift, not a cycle. Fixes #1358 is implementing and must request the singleton
lease before `fresh-browser`. #1651 remains draft and unchanged until the owner explicitly selects 1
keep-and-narrow, 2 remove/defer C6, or 3 close-as-duplicate. Preserve all four topic supervisor
session IDs and Remote Control bridges; serialization remains per topic, while Aspire/Docker/E2E
alone share the global expensive-gate mutex.

Resume from the authoritative `2026-08-15T06:07:53Z` checkpoint. Docs #1652 repaired formal cycle-1
findings at `c7ce58a19`, passed hardened supervisor Tier-A at `3aedb4cce`, and has one fresh Opus
5/medium Remote Control IMPL-EVAL cycle 2 authorized against that immutable head. Internals #1656 is
functionally green at `dbbedde34` but must record its three justified JSON field-name clarifications
in `drift.md` and obtain slice-1 sign-off before S2. Fixes #1657 holds the singleton `fresh-browser`
lease at `4a3c40321`; only Playwright/Chromium is in scope and cleanup plus empty Aspire/Docker are
mandatory before the lease completes. #1651 remains unchanged and draft pending the owner's explicit
1/2/3 disposition. Do not serialize these topic-local actions across lanes.

Resume from the authoritative `2026-08-15T06:19:11Z` checkpoint. Docs #1652 cycle-2 IMPL-EVAL is
still working in the fresh native Opus 5/medium Remote Control session `4ed649d5-…` against clean
source `c7ce58a19`; do not repair, ready, merge, or start the next docs leaf before its terminal
verdict. Internals #1656 S1 is signed off at `a258bcc8c`; S2 is running on its preserved Codex
thread and has local commits through `a7e9ee0d5`, but the PR is not yet pushed beyond the S1 head,
so await the author's explicit stop and supervisor Tier-A. Fixes #1657's singleton browser lease is
terminal PASS with evidence head `c792327c9`; Aspire, Docker containers, volumes, and browser
survivors are empty, and fixes Tier-A is running. #1651 remains an unchanged draft awaiting owner
choice 1 keep-and-narrow, 2 remove/defer C6, or 3 close as duplicate. Only the shared runtime mutex
is cluster-wide; all evaluator and implementation serialization remains per topic.

Resume from the authoritative `2026-08-15T06:24:17Z` checkpoint. Docs #1652 formal cycle 2 is
terminal `PASS` at `71cc5a02c`; the preserved Codex author is correcting only evaluator N1–N3, then
the docs supervisor performs one topic Tier-A and stops. Never launch cycle 3. Internals #1656 S2 is
signed off at `4ae309d57`; final S3 is run-artifact-only and active on the preserved author thread,
after which coordinator may grant one fresh IMPL-EVAL. Fixes #1657 Tier-A found T-3 at `5fe600235`:
CLI design-template-only changes bypassed the Fresh UI drift CI. The coordinator amended the
contract at `c5e06661b` with exactly the Fresh UI workflow, classifier, and classifier test;
repair/re-review is active, without another browser/Aspire/Docker pass. #1651 is unchanged and draft
pending explicit owner option 1/2/3. Runtime mutex is free; serialization is per topic.

Resume from the newer authoritative `2026-08-15T06:54:51Z` checkpoint. Docs #1652 is still on its
original Codex author thread after head `d4a0a8340`: current-head CI exposed the deterministic
`agent-docs.generated.ts` cascade from the refreshed prose bundle. The contract is amended by that
one generated file plus run artifacts; obtain fresh opposite-family Tier-A and current-head CI, but
never launch formal cycle 3. Internals #1656 formal IMPL-EVAL cycle 1 passed at evaluator commit
`addba1ab9` for immutable source `2c4881fd7`; the preserved topic supervisor owns body/issue
truthfulness, `impl-eval:skip`-before-ready ordering, and current-head CI, then stops before merge.
Its `.llm/**` lint-exclusion finding is a separate follow-up, not a rescope. Fixes #1657 formal
cycle 1 returned `FAIL_FIX` at `a46b83831`: the source template had 66 entries but the shipped
`embedded.generated.ts` still had 50. Scope is amended by exactly that generated barrel; allow one
same-author repair, fresh Tier-A, and one final Opus 5/medium Remote Control cycle 2, with no
browser, Aspire, Docker, scaffold, or E2E rerun. #1651 remains frozen pending explicit owner choice
1/2/3. Runtime remains empty and the expensive-gate mutex free; serialization is only per topic.

Resume from the newer authoritative `2026-08-15T07:12:16Z` checkpoint. Main is
`7737d8903bb2925c3fcefbda362168fe297eebd4` after #1656 merged from exact source `b80794470`; #1542
is closed completed and both PR/issue carry `status:shipped`. Internals has advanced its next serial
leaf, draft PR #1658 `openhands-dispatch-claim-and-refusal` (#1611+#1613), on preserved Codex thread
`01a00443-…` at immutable base `7737d8903` and bootstrap `ca2266ecb`; its current authority ends
after research/plan. The L-2 mixed lint-batch exclusion false-green is a separate later tooling
leaf, not a fold-in or workaround. Fixes #1657 passed fresh Tier-A at `3d7819203`; its single final
Opus 5/medium Remote Control IMPL-EVAL cycle 2 is running in session `1df19d27-…` over that exact
local=remote=PR head. Docs #1652 is at final cascade head `a465836b4`; all four freshness gates pass
and its supervisor is waiting on fresh Tier-A plus terminal exact-head Actions, with formal cycle 3
forbidden. Features #1651 remains untouched and owner-blocked on choice 1 keep-and-narrow C6, 2
remove/defer C6, or 3 close as duplicate. Main CI has no failure at checkpoint but core `ci` is
still in progress. Agentic runtime is `no_change`; Aspire, Docker containers, and volumes are empty.
Preserve all four native topic supervisors and enforce serialization per topic only.

Resume from the newer authoritative `2026-08-15T07:25:00Z` checkpoint. Docs #1652 merged from
`a465836b4` as main `e090f894ff3682405a36e4f896ffd2cc16f9a1f8`; #1551 closed completed and the docs
lane has no residual bound 0.0.7 leaf. Internals #1658 stopped at research head `670e37bea` because
its original frozen contract excluded the real CLI producer and regression tests. The coordinator
replaced it with the exact eight-path mutation envelope recorded in `leaf-contracts.json`;
`.github/workflows/openhands-phase-eval.yml` is read-only precedent. Formal mode is explicit
`--phase plan|impl`, PR-only, verdict-bound, and uses a live CLI-resolved head; non-formal mode
stays tuple-free. Refusals are one sanitized non-recursive pre-spend reply, and lookup retry is 5×1s
with an attributable fail-closed exhaustion result. Resume the same Codex author only to rewrite the
plan, then run one fresh opposite-family PLAN-EVAL because the claim/spend and workflow-permission
boundary is architectural. Fixes #1657 cycle-2 IMPL-EVAL remains active at `3d7819203`. Features
#1651 stays frozen on owner choice 1/2/3. Main CI is running without a failure at this checkpoint;
Aspire and Docker remain empty.

Resume from the newer authoritative `2026-08-15T07:40:16Z` owner-verdict checkpoint. The owner chose
option 1 for features #1651: keep the distinct plugin CLI RFC and narrow C6. Release the lane hold
and resume only the preserved original Codex author. C6 owns the generic contribution workspace-plan
executor, preview/apply safety, common stage/check/commit/rollback, and generic doctor states. RFC
0003/#1490 exclusively owns command-store provider/Prisma/schema/migration/bridge/database and
business-command semantics. The adapter maps the RFC-0003 domain plan into the shared executor; C6
must not parse Prisma or own migrations, and RFC 0003 must not build a second generic CLI mount or
workspace transaction engine. The planner must return the same canonical plan in preview and apply.
Correct the PR-body receipt attribution and cache-hit note, rerun the six contracted gates at the
amended content head, obtain fresh opposite-family Tier-A, and run one bounded final IMPL-EVAL; no
new PLAN-EVAL or open loop. Keep the PR draft until coordinator readiness. Internals #1658 is at
repaired plan `cea999d18` awaiting its authorized Opus 5/medium PLAN-EVAL. Fixes #1657 is removing
only the three redundant T-3 CI deltas before fresh Tier-A. Docs remains terminal.

Resume from the newer authoritative `2026-08-15T07:48:51Z` checkpoint. Features #1651 is no longer
held: topic checkpoint `1bfc1cfcd` is clean/pushed and the preserved original Codex author
`019ffcc5-…` is performing the one bounded keep-and-narrow amendment from immutable starting head
`0e302ad3a`. It must preserve the plugin CLI architecture, narrow only C6/RFC-0003 ownership,
correct receipt provenance, run six exact-head gates, then stop for fresh Tier-A and one focused
IMPL-EVAL. Internals #1658 repaired plan `cea999d18` passed topic Tier-A and is under its single
fresh native Opus 5/medium Remote Control PLAN-EVAL in session `7d544aec-…`, bridge
`session_01N9zhX5ZDUvvrBxcwoAYBCm`; implementation remains forbidden before `PASS`. Fixes #1657's
formal cycle 2 passed and its bounded cleanup is clean/pushed at `a891c6520`; the redundant three CI
paths equal main and fresh cleanup Tier-A is next, with no cycle 3 or runtime rerun. Docs remains
terminal. Serialization is per topic; the expensive runtime mutex is free.

Resume from the newer authoritative `2026-08-15T08:04:33Z` checkpoint. Features #1651 completed the
owner amendment at content `67e12f021` and evidence `d45a92ba7`; local=remote=PR, all six contracted
receipts pass at the content head, the check provenance/body defects are corrected, and comment
`5301282095` is posted. Fresh Tier-A and one bounded final IMPL-EVAL remain; keep draft/status:impl.
Internals #1658 formal PLAN-EVAL passed at evaluator head `e15d78588`, comment `5301255122`; topic
checkpoint `d5ade932b` carries N1–N5 and the preserved original Codex author is implementing S1 with
a supervisor watcher armed. Stop at each slice for Tier-A, and do not dispatch OpenHands or runtime
gates. Fixes #1657 cleanup Tier-A artifact `21403902b` requested only three PR-body truthfulness
edits; same-author body correction and one focused fresh recheck are active, with cycle-2 product
PASS unchanged and no gate rerun. Docs is terminal and the runtime mutex remains free.

Resume from the newer authoritative `2026-08-15T08:31:20Z` checkpoint. Fixes #1657 shipped as main
`6917c656e`; #1358 is closed with 7/7 acceptance boxes and shipped lifecycle labels. Features #1651
then shipped as current main `284dda90a`; the owner keep-and-narrow boundary passed final bounded
IMPL-EVAL at `ec69100c8`, the owner disposition is answered in comment `5301349600`, and #1502 is
closed with 5/5 boxes and shipped labels. Both temporary `impl-eval:skip` labels were removed.
Internals #1658 S1 passed topic Tier-A at `6f725ad3b` after load-bearing root test 4,138/0; the same
Codex author is implementing S2 at `28a8a9184` and must stop again for Tier-A before S3. Features
and fixes supervisors were steered in place to reconcile the merges and advance only their own
frozen queues; fixes must preserve the #1348→#1350 prerequisite. Combined-main CI is active without
a failure. Runtime mutex remains free; no Aspire/Docker/browser gate is active.

Resume from the newer authoritative `2026-08-15T08:45:30Z` checkpoint. Exact current main remains
`284dda90a17a13a7e5e8e9834e5411b58887131b`, and combined-main workflow `31874580034` is terminal
success. Docs is active again under the owner's post-freeze #1659 replacement: draft #1660 at
`0b67ef39e` is on the original Codex author thread and repairing four Tier-A findings before a fresh
topic re-review. Internals #1658 S2 passed at `0886c2427`; S3 implementation is local at `d7fdbb1d9`
and must stop for Tier-A before S4. Fixes #1661 correctly stopped artifact-only at `1d4533462`;
topic ruling `af53757e6` expands exactly five `packages/ai/**` paths and fixes the additive public
status/cancellable-close contract before resuming the same author. Features #1293 is
research/plan-only; preserve and wire the already-published `onConnectionError` option, and run one
opposite-family PLAN-EVAL only if the clean returned plan remains decision-heavy after topic review.
Aspire and Docker remain empty. Keep the four native Opus 5/high supervisors and enforce
serialization only inside each topic.

Resume from the newer authoritative `2026-08-15T09:08:30Z` checkpoint. Main remains
`284dda90a17a13a7e5e8e9834e5411b58887131b`. Docs #1660 is ready at exact head `e35824d41` after a
fresh exclusive-owner Tier-A PASS and all eight #1659 boxes; merge only after its current readiness
CI is terminal green, then close/lifecycle-normalize #1659 and remove `impl-eval:skip`. The disclosed
stash incident is fully recovered at exact object `7eb4ed16d…`; no data loss occurred. Internals
#1658 has S3 signed off at `d3d31b3d0` and S4 local at `9b71e1bd2`, still before its required
receipt/push/Tier-A stop. Fixes #1661 is implementing amendment 2 through pushed `099067c6b`, with
both published transport wrappers and a Fresh cross-package check now binding. Features #1293
PLAN-EVAL passed at `7780ba49e`; the evaluator job's terminal metadata stayed stale, so the
coordinator verified the final response directly and woke the existing features supervisor to amend
the plan and resume the original Codex author. Do not launch a duplicate evaluator. Preserve all
four native Opus 5/high Remote Control supervisors, serialize only inside each topic, and keep the
runtime mutex free unless a real resource-heavy gate requests it.

Resume from the newer authoritative `2026-08-15T09:28:54Z` checkpoint. Current main is
`729386c567bfbd0b8c7f86a4ed09348f0a8a4ad8`: docs #1660 is merged, #1659 is closed 8/8 and shipped,
Pages push run `31876977060` passed, and both `/comparisons/frontend/` and
`/comparisons/backend/` are live with HTTP 200. The readiness failure was a stale exact-corpus
snapshot, repaired at `615786c1a` into stable named invariants and freshly Tier-A reviewed in comment
`5301575337`; never revert it to total-count pinning. Internals #1658 has final S5 evidence at
`704c067e8` with all three receipts green and is in final Tier-A. Fixes #1661 is Tier-A PASS at
`e3c74d7aa`; one fresh opposite-family IMPL-EVAL lease is granted and launching. Features #1293 is
implementing S1 after the verified plan amendment `feb8b0355`. Preserve the original author threads,
all four native Opus 5/high Remote Control supervisors, per-topic serialization, and the free
expensive-gate mutex.
