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
`0b3ed5d5a6aea451318f120988c25dfa3993a2ab` after coordinator merges of #1644 and #1643. Reset orders 1, 2,
3, 4, 5, and 6 are terminal `PASS`; orders 3/4/5/6 have been returned to their preserved Codex
implementation threads through the existing Claude topic supervisors. Fixes order 5 first returned
`FAIL_PLAN` cycle 1, was repaired at `5b3c6fcf2` by the original Codex plan-author thread, then
passed fresh PLAN-EVAL cycle 2 at evaluator commit `b8fc5eb53` in session `06451c1e-…`. PR #1654
is draft at `status:impl`; only its preserved Codex thread `019ffcca-8be0-…` is authorized to
implement. Reset orders 1 and 2 are merged. Continue to
serialize only inside each topic orchestrator; never introduce a cluster-wide
evaluator wait, and keep the separate shared-resource `expensiveGates` mutex empty until a genuine
E2E/Aspire gate needs it.

Completion supervision resumed at `2026-08-15T03:46:43Z`. The live continuation point is no longer
the reset-gate table above: docs S2 is active after exact pinned-input provisioning; internals #1653
is in fresh Opus 5/high IMPL-EVAL session `430d5f91-…`; features #1651's session `2a8cf0a6-…`
ended conditional `PASS` at `0e302ad3a`, but owner comment `5300440887` supersedes readiness and
requires the active delegated RFC-0003 duplicate/overlap audit;
fixes #1654 repaired Tier-A finding T-1 at `ebad68c80`, and now holds the singleton slice-6
`scaffold.runtime` lease granted only after empty Aspire/Docker/central-lease preflight. Keep the coordinator turn active through those
terminal results and subsequent merge-readiness decisions. A supervisor's parked checkpoint is
never itself a reason to yield.

Resume from the authoritative `2026-08-15T05:06:31Z` checkpoint, not the stale paragraph above.
#1653 cycle 2 passed at `70177e808`; current-head CI and close-gate passed, it merged as
`473e8d75b`, and #1378/#1545 closed `COMPLETED` with terminal labels. Internals has advanced its next
serial leaf, `quality-scan-root-coverage` (#1542), to harness bootstrap/research/plan. #1654's clean
retry reached one terminal `suite-end`, 89/0/0, and cleanup receipt proves empty Aspire, Docker,
custom-network, volume, and leak-survivor state; head `0b2cf5e7c` is in Tier-A review and the shared
lease is complete. #1652 must first rewrite issue comments `5265826161` and `5265971722` in
place from authoritative EIS-Chat `5191de83`, with recalculated feature/effort estimates. The
comments predate the material route improvements already contained in that pin; no newer product
head exists, and `834a2b36` differs only by harness evidence. #1651 is
not duplicate overall but remains owner-blocked: wait for option 1 keep-and-narrow, option 2
remove/defer C6, or option 3 close-as-duplicate. Do not infer the verdict. All topic controllers and
leaf threads remain the preserved originals; serialization is per topic, not cluster-wide.

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
lease before `fresh-browser`. #1651 remains draft and unchanged until the owner explicitly selects
1 keep-and-narrow, 2 remove/defer C6, or 3 close-as-duplicate. Preserve all four topic supervisor
session IDs and Remote Control bridges; serialization remains per topic, while Aspire/Docker/E2E
alone share the global expensive-gate mutex.

Resume from the authoritative `2026-08-15T06:07:53Z` checkpoint. Docs #1652 repaired formal
cycle-1 findings at `c7ce58a19`, passed hardened supervisor Tier-A at `3aedb4cce`, and has one fresh
Opus 5/medium Remote Control IMPL-EVAL cycle 2 authorized against that immutable head. Internals
#1656 is functionally green at `dbbedde34` but must record its three justified JSON field-name
clarifications in `drift.md` and obtain slice-1 sign-off before S2. Fixes #1657 holds the singleton
`fresh-browser` lease at `4a3c40321`; only Playwright/Chromium is in scope and cleanup plus empty
Aspire/Docker are mandatory before the lease completes. #1651 remains unchanged and draft pending
the owner's explicit 1/2/3 disposition. Do not serialize these topic-local actions across lanes.

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
terminal `PASS` at `71cc5a02c`; the preserved Codex author is correcting only evaluator N1–N3,
then the docs supervisor performs one topic Tier-A and stops. Never launch cycle 3. Internals #1656
S2 is signed off at `4ae309d57`; final S3 is run-artifact-only and active on the preserved author
thread, after which coordinator may grant one fresh IMPL-EVAL. Fixes #1657 Tier-A found T-3 at
`5fe600235`: CLI design-template-only changes bypassed the Fresh UI drift CI. The coordinator
amended the contract at `c5e06661b` with exactly the Fresh UI workflow, classifier, and classifier
test; repair/re-review is active, without another browser/Aspire/Docker pass. #1651 is unchanged
and draft pending explicit owner option 1/2/3. Runtime mutex is free; serialization is per topic.
