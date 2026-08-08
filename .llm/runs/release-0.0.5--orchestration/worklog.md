# Worklog — release-0.0.5 continuation

## 2026-08-06 — Activation and re-baseline

- Read all owner-mandated skills and workflow documents completely, plus activation, run-loop,
  supervisor/escalation, and evaluator protocols.
- Read the durable handover and the required legacy run artifacts, including the last 200 lines of
  the legacy worklog and drift D1–D21.
- Verified current `origin/main@2508eb8c`; continuation branch equals main and is clean.
- Verified legacy branch/current-run divergence without mutating either.
- GitHub token check: valid, login `rickylabs`.
- Runtime status: zero managed sessions. Primary remote/mobile/tmux visibility is not proven.
- Verified #1331/#1336 live closure, acceptance mirror, separate evaluator sessions, empty review
  thread set, and merged main commit.
- Read all 38 open 0.0.5 issue acceptance lists and all four open train PR bodies.
- Captured future-milestone metadata/counts and locked the highest-to-lowest rollover map.

## 2026-08-06 — Milestone rollover complete

- Re-queried milestones 16–21 and 24 plus every open milestone-24 item immediately before mutation.
- Renamed future milestones highest-to-lowest without moving their assignments: `0.0.12→0.0.13`,
  `0.0.11→0.0.12`, `0.0.10→0.0.11`, `0.0.9→0.0.10`, `0.0.8→0.0.9`, `0.0.7→0.0.8`, `0.0.6→0.0.7`.
- Created milestone 25 `0.0.6` with an explicit post-0.0.5 follow-up description.
- Moved the fourteen live non-frontend rows from renamed milestone 24 to milestone 25 and posted a
  reason on every item. #1215 is the only PR in that set; the others are issues.
- Verified milestone 24 now has 20 open frontend rows (#922–#941) and its same six closed historical
  assignments. Verified milestone 25 has exactly the fourteen intended open rows and zero closed.
- No closed historical item was moved; no intermediate-milestone assignment churn occurred.

## Design

This run coordinates GitHub state and delegated PR clusters; it does not introduce a framework
public API directly. Domain vocabulary: `MilestoneSnapshot`, `IssueDisposition`, `PrCluster`,
`DispatchWave`, `CanaryBoundary`, and `PreMergeVerdict`. External ports are GitHub API/Actions, JSR
publish truth, and the agentic runtime. Finite values are the exact milestone mapping above, phase
routes in `supervisor.md`, and explicit issue disposition classes. Commit slices are: S0
activation/re-baseline; S1 rollover/re-triage; S2 wave-plan + PLAN-EVAL; then one tracked supervisor
sub-run per PR cluster. Deferred implementation capability is never represented by placeholder
files.

## 2026-08-06 — Train repair, doctrine classification, and wave plan v3

- Created `canary/0.0.5-canary.14` from current main and retargeted #1315–#1318 without deleting the
  colliding historical canary.13 branch.
- Re-ran the checked-in PR rollup: #1317/#1318 green; #1315 red on child-project `catalog:zod`
  resolution; #1316 red on empty `Apps: {}` cleanup and honestly close-gated on missing live OTEL
  evidence. No orchestrator code patch was made.
- Read the doctrine navigator, JSR audit, Deno toolchain, relevant doctrine chapters, A1/A3/A5/A6
  profiles, scope overlays, gate matrix, and debt entries. This changed the clustering: streams
  contract precedes reconnect runtime; plugin generated-runtime work remains thin-core wiring with
  full parity gates; #1333 receives a separate major-UI design checkpoint.
- Locked all 38 live issues to exactly one disposition. Proposed eight 0.0.6 moves and eighteen
  supervisor-owned implementation clusters, capped at three concurrent supervisors.
- Declared three remaining content-derived cuts: canary.14 after inherited train + release/scaffold/
  OpenCode foundations, canary.15 after runtime/adoption waves, canary.16 after frontend/docs tail.
- `agentic:routing-state`: no persisted fallback. Live paid-transport canaries passed for Minimax M3
  high and Qwen 3.8 Max high. The initial credential-absent probe failed closed and is retained as
  negative evidence.
- Last release evidence remains 1,076/4,000 attempts after canary.13; plan cost is 105 base
  attempts, with #1312 fail-before-mint preflight mandatory before the next cut.
- Wave plan v3 is ready to commit and send to a separate Minimax PLAN-EVAL. Implementation remains
  on hold.

## 2026-08-06 — Plan committed and draft PR opened

- Committed the plan-only run state as `a463f0766` and pushed `orchestrator/0.0.5-continuation`.
- Opened draft PR #1337 to `main` through the GitHub connector. Applied milestone 23 and exactly one
  lifecycle label, `status:plan-eval`, with `type:chore`, `area:tooling`, `priority:p0`, and
  `wave:v1`. The body deliberately carries no closing keyword.
- Prepared the separate Minimax M3 evaluator prompt. No implementation has started.

## 2026-08-06 — PLAN-EVAL PASS

- Launched a separate Minimax M3 high evaluator through the supported `formal_plan_evaluation`
  route. Session `567e3125-0fe9-4637-b0bb-30c20f9d3c26` completed in 247,552 ms and returned `PASS`.
- The evaluator independently re-verified all 38 open-issue dispositions, all eighteen PR clusters,
  dependency order, the three-supervisor cap, evidence-only closure handling, doctrine and JSR
  gates, route separation, and the affordable three-cut cadence guarded by #1312.
- Recorded the evaluator's proposed `plan-eval.md` artifact verbatim. Implementation is now
  authorized; the next state mutation is the eight reviewed moves to milestone 25.

## 2026-08-06 — Reviewed scope boundary applied

- Moved #1085, #1093, #1112, #1139, #1201, #1210, #1260, and #1293 directly from milestone 23 to new
  milestone 25. Posted the PLAN-EVAL-approved reason on every issue; no closed assignment or
  intermediate future milestone changed.
- Paginated post-mutation verification found milestone 23 at 30 product issues + four train PRs +
  orchestration PR #1337, and milestone 25 at 21 issues + existing PR #1215.
- Replaced `status:ready-merge` with terminal `status:shipped` on closed issue #1331 and merged PR
  #1336. Updated PR #1337 to `status:impl`, refreshed its checklist, and posted the formal PLAN-EVAL
  summary. No closing keyword was introduced.

## 2026-08-06 — T1 supervisors dispatched

- Prepared and dry-ran bypass-enabled Sol-low briefs for T1-A (#1295/PR #1315) and T1-B (#1189/PR
  #1316). Both briefs passed the handoff, exact-head, no-upstream, and route checks.
- Real new-thread launch failed closed with `duplicate_sender_risk` because both inherited worktrees
  already had durable Codex owners. Resumed exactly those owner threads through
  `agentic:codex-resume`: T1-A `019fcd0c-9cda-7641-9479-3d1c72358154`; T1-B
  `019fcdc4-d0e7-7431-9e30-8eb35360c3f9`. Rollouts prove OpenAI Sol low, bypass permissions, and the
  correct worktrees.
- The managed app-server daemon is running. Phone/tmux remains failed/not-attached; supported
  runtime repair dry-run refused with `active_session`, and no background shell is presented as
  observability.
- Live post-resume status exposed C-D9: both active implementation turns are Sol medium because
  `agentic:codex-resume` has no effort override and used the default. Their inherited threads were
  originally Sol low, but the current turns are not. The mismatch is explicit; separate Qwen
  IMPL-EVAL remains mandatory, and later lanes will launch as new sender-free Sol-low threads.
- Preserved T1-B's unrelated lock churn in stash commit `7eb4ed16d6944c1d1c904895bcb76b4361ad8a57`.
  The current leak reporter found foreign/unproven survivors only; none were mutated.
- Reconciled #1295/#1315 and #1189/#1316 to exactly one active lifecycle label, `status:impl`, and
  `wave:v1`; stale `status:ready-merge` / `status:impl-eval` labels no longer overstate the live
  repair phase.

## 2026-08-06 — T2 preflight

- Re-queried #1317 and #1318 while T1 runs. Both current heads remain green with `close-gate`
  success and zero review threads; #1317 also has both mandatory scaffold runtime lanes reporting
  `SUCCESS`, not skipped.
- Their clean verdicts precede T1 train mutations, so neither will merge on that evidence. T2
  supervisors will integrate the content-derived train head after T1 lands and earn new current-SHA
  gates. Both inherited worktrees have unrelated `deno.lock` changes and no upstream; preserve them
  before dispatch as done for T1-B.

## 2026-08-06 — T1-A evaluator launch failed closed

- #1315 reached pushed head `9f5ef7dcb55668a6649c5451266908ad8e29b15c` with product repair
  `ecd224243ea373e803c5165ba607f235d438f9c8`, but live runtime still reported its generator turn
  `working`; the PR lifecycle was restored to `status:impl` pending terminal handoff.
- Detected C-D10: Qwen high evaluator sessions `b329c804-2b7b-47b3-b109-84895f66f01d` and
  `4b004c60-acae-4373-b7f7-56956b191156` were launched nineteen seconds apart. The second used the
  same stale prompt as the first, incorrectly describing the resumed generator turn as Sol low.
- Terminated both exact evaluator process groups without accepting a verdict. Neither session nor
  either partial output is evidence. Corrected the prompt to record observed Sol-medium C-D9 drift;
  a single fresh Qwen evaluator may launch only after the implementation thread reaches a terminal
  handoff.

## 2026-08-06 — T1-A terminal handoff and canonical IMPL-EVAL

- The supported same-thread steering turn finished with `DONE`, clean local/remote/PR head
  `9f5ef7dcb55668a6649c5451266908ad8e29b15c`, and current-SHA `SUCCESS` for close-gate, check-test,
  quality, deps-report, code-quality, surface-diff, core CI lane visibility, and scaffold lane
  visibility. No product change or evaluator launch occurred in that terminal verification.
- Reconciled issue #1295 and PR #1315 to exactly one lifecycle label, `status:impl-eval`, retaining
  `wave:v1` and their approved taxonomy.
- Launched exactly one fresh corrected formal evaluator from the T1-A worktree through the supported
  OpenRouter route: Qwen 3.8 Max high, bypass, session `f516aada-2a74-4dad-821e-b20963fe2983`. The
  evaluator is read-only and targets exact clean head `9f5ef7dcb55668a6649c5451266908ad8e29b15c`.

## 2026-08-06 — Single-writer and T1 recovery

- Runtime inspection proved the initial app-server launch and the later tmux resume were concurrent
  writers on the same primary thread. Consolidated onto the actual tmux Codex CLI and terminated
  only the older root client. The managed daemon and durable child threads remain the supported
  control surface; C-D11 records the incident.
- T1-A's pushed product work and current-SHA hosted CI are green, but its implementation thread is
  still completing the terminal handoff. No Qwen evaluator may launch until that turn finishes.
- T1-B's interrupted full runtime command had passed through `cleanup.aspire-stop` but returned no
  captured process exit, so it is not a gate verdict. T1-B leak-check proved one owned survivor;
  teardown apply removed only `postgres-84ad11ad` (`6b0e09804...`) and left every foreign or
  unproven resource untouched.
- Resumed T1-B's exact durable thread with `recovery.md`. It must rerun the complete one-pass
  `scaffold.runtime --cleanup --format pretty` command and finish its pushed implementation handoff
  before separate Qwen evaluation.
- A preceding supported recovery send was already active on T1-B and owned the rerun E2E process
  tree. Detected the redundant `recovery.md` sender, retained the earlier owner, and terminated only
  the redundant sender process group without touching E2E or product state (C-D13).
- A later acceptance-guard steer also opened a concurrent same-thread client rather than queuing.
  Terminated only that newest process group before it could own work (C-D14). The original recovery
  sender remains the sole T1-B writer; #1189's observational runtime checkbox stays unchecked until
  orchestrator adjudication after separate evaluation.

## 2026-08-06 — T1-B terminal implementation handoff

- The recovered durable thread completed with `DONE` at clean local/remote/PR head
  `53d6c278d01a1b7ce967078ce94db619a5d8f4a8`; product/runtime evidence is commit
  `e6c429f4527e02f1dfa8886f0ff66311bbc5a299`.
- Decisive generator evidence: real HTTP 500 RED, HTTP 200 catalog→fixture GREEN, correlated trace
  `00766def76331c34a3df9fd525bfe3e0`, focused 17 tests / 42 steps, and the exact one-pass
  `scaffold.runtime --cleanup --format pretty` rerun at 73 passed / 0 failed / raw exit 0.
- Worktree and root lock are clean; protected stash `7eb4ed16d...` remains unchanged; no owned
  AppHost/container survived and foreign/unproven resources were untouched. PR #1316 remains draft.

## 2026-08-06 — T1-B observational acceptance adjudication

- Independently inspected the tracked live proof before mutating the issue: the public local-path
  install generated producer/consumer references without a manual appsettings edit; catalog changed
  from HTTP 500 to HTTP 200 after reaching fixture-api `/ping`; trace
  `00766def76331c34a3df9fd525bfe3e0` links catalog client span `9c22af7526ff564a` to fixture server
  span `c7935b1b03518da5`, both 200.
- Checked #1189's final observational acceptance row with that exact evidence. This is an
  orchestrator evidence adjudication, not code-PR closure; the separate evaluator must still fail
  the claim if the artifacts do not support it.
- Reconciled #1189 and PR #1316 to exactly one lifecycle label, `status:impl-eval`, while preserving
  their approved taxonomy and `wave:v1`. Corrected the evaluator prompt to describe the live checked
  state before launch.
- A concurrent writer launched Qwen session `bd9e6431-23ac-4473-b331-3bc22333bf2e` from the earlier
  prompt, which still claimed the observational checkbox was unchecked and pending adjudication.
  Terminated only evaluator process group `203021` before verdict. That session is permanently
  ineligible under C-D15; T1-A was not interrupted. A fresh T1-B evaluator may launch only from the
  corrected pushed prompt.
- Launched the corrected read-only T1-B evaluator through the supported OpenRouter route at exact
  clean head `53d6c278d...`: Qwen 3.8 Max high, bypass, session
  `228b3382-c868-472b-8066-0af93d2ed01e`. The live process command contains the corrected
  checked-row contract; this is the only admissible T1-B evaluator session.
- C-D16: the root `deno task` launcher transiently changed the T1-B worktree lock while resolving
  the older target graph. Restored only that launcher-caused diff before the evaluator's own target
  preflight. Re-verified branch `fix/plugin-linking-seam-1189`, head `53d6c278d...`, zero worktree
  status entries, protected stash commit `7eb4ed16d...`, and stash patch hash `6f706f8f...`.
- Re-queried live GitHub state while both evaluators ran: PRs #1315 and #1316 exactly match their
  target heads, remain mergeable drafts on `canary/0.0.5-canary.14`, both issues have zero unchecked
  acceptance rows, and both review-thread gates pass with 0 unanswered. #1315's executed current-SHA
  hosted contexts are green; #1316's hosted contexts remain draft-policy skipped, so its independent
  local runtime evaluation is still the decisive gate.

## 2026-08-06 — single-writer enforcement and T1-B evaluator restart

- Detected the retained tmux root client issuing evaluator polls concurrently with this app-server
  turn. Terminated only that duplicate Codex client. The tmux/phone surface no longer displays an
  actual Codex CLI, so root observability is recorded failed/not-attached rather than substituted.
- The client termination severed T1-B evaluator `228b3382-c868-472b-8066-0af93d2ed01e`'s wrapper and
  orphaned its Claude process. Failed that session closed, terminated its exact process group, and
  excluded its partial output from verdict evidence under C-D17.
- The interrupted evaluator had caused a 20-add/25-delete `deno.lock` diff. Re-verified branch
  `fix/plugin-linking-seam-1189`, head `53d6c278d...`, protected stash `7eb4ed16d...`, and patch
  hash `6f706f8f...`; restored only that evaluator-caused worktree diff and confirmed zero status
  entries.
- Relaunched the exact corrected prompt once through the checked-in agentic OpenRouter runner with
  `deno run --no-lock`: Qwen 3.8 Max high, bypass, session `abe31571-0fa1-4ea4-9085-1c36ea14a5c7`.
  This is the sole admissible T1-B evaluator session.

## 2026-08-06 — T1-A formal IMPL-EVAL `FAIL_FIX`

- Canonical Qwen high session `f516aada-2a74-4dad-821e-b20963fe2983` finished at exact evaluated
  head `9f5ef7dcb...` with `FAIL_FIX`; both earlier attempts remain ineligible under C-D10.
- Independently reproduced 70 new private-type-reference errors (55 distinct sites, 14 files) across
  eight publishable roots versus canary.14, plus `packages/fresh` `check:streams-types` baseline
  exit 0 / head exit 1 (`Package 'zod' not found in catalog`). The evaluator also held the exact
  one-pass `scaffold.runtime` smoke as mandatory and unproven.
- The evaluator verified the graph guard, peer binding, emitted-samples RED/GREEN, focused tests,
  scoped source gates, quality gates, docs, serial publish dry-run, and lock hygiene. It restored
  its own lock footprint and left evaluated head `9f5ef7dcb...` clean.
- Recorded the complete evaluator artifact verbatim at
  `.llm/runs/fix-zod-v4-npm-alignment-1295--1295/evaluate.md`, committed it in `bcc3432bb`, removed
  one apply-patch-added blank line in `d0aa6a22d`, and pushed the exact PR branch without force.
- Posted structured PR phase comment `5207581542`. Reconciled issue #1295 and PR #1315 from
  `status:impl-eval` to exactly one `status:impl`; the PR remains draft and is not train-eligible.
- Prepared `slices/t1-a-1295/repair-1.md` for the existing sole owner thread. The supported sender
  registry requires same-thread resume; Sol-medium route drift remains C-D9 and is justified for the
  cross-package public-type/foreign-config repair.

## 2026-08-06 — T1-B formal IMPL-EVAL `PASS` and ready-merge trigger

- Sole admissible Qwen high session `abe31571-0fa1-4ea4-9085-1c36ea14a5c7` returned `PASS` at exact
  evaluated head `53d6c278d...`. Invalid sessions `bd9e...` (C-D15) and `228b...` (C-D17) remain
  ineligible.
- Independently verified all eight #1189 acceptance rows, including the orchestrator-checked
  observational row: RED HTTP 500, GREEN HTTP 200, and trace `00766def...` containing the correlated
  catalog client span and fixture-api server span. Focused rerun was 16 tests / 38 steps / 0; exact
  one-pass `scaffold.runtime` was 73 passed / 0 failed / `RAW-EXIT:0` with endpoint, background,
  OTEL, and cleanup coverage.
- Post-smoke leak reporter found zero run-owned resources and zero AppHosts; 15 foreign and 3
  unproven pre-existing containers were untouched. Protected stash commit `7eb4ed16...` and exact
  diff hash `6f706f8f...` remained intact.
- Evaluator classified the four package-plugin `@module` findings as unchanged canary.14 baseline,
  CLI lint/fmt wrappers as intentionally excluded by repo config with operative check/quality gates
  green, and canary.14 lock staleness as train-attributed. It restored its run-report/lock
  footprint; the orchestrator restored the same deterministic 45-line lock rewrite after its own
  local gate commands. Target tree is clean.
- Recorded the complete evaluator artifact verbatim in
  `.llm/runs/fix-plugin-linking-seam-1189--1189/evaluate.md`, committed/pushed as `31b898212`, and
  posted structured phase comment `5207616406`.
- At artifact head `31b898212...`, acceptance mirror dry-run made no changes, close-gate passed for
  closing issue #1189, review-thread gate passed 0/0, prohibited source diff scan passed, and the
  only delta from evaluated head is `evaluate.md`.
- Reconciled issue #1189 and PR #1316 to exactly one `status:ready-merge`, marked the PR ready for
  review, and triggered fresh current-head CI by the live label event. PR is mergeable but held
  outside the train until named checks report current-head success and the milestone pre-merge gate
  is re-run.

## 2026-08-06 — T1-A bounded repair terminal handoff

- The sole implementation thread finished cleanly with `READY_FOR_FRESH_QWEN_IMPL_EVAL` and `DONE`.
  Exact local/remote/PR head is `18c7a7e791552c6f346ef07a77a741dd70b058d6`; PR #1315 remains draft
  with exactly `status:impl` at handoff.
- Repair commits are product/config `b29879e9468d4c154bc67beb1cbe430984f8290c`, corrected evidence
  `91bc68099285b2c322fd895c25bca34ec3c0c99b`, and terminal train visibility `18c7a7e79...`.
- Reported decisive repair evidence: root check 2,630 files / 22 batches / zero diagnostics; focused
  check 635 files / six batches / zero; 46 focused tests / zero failures; detached Fresh consumer
  and full Fresh check pass; 40 emitted samples across 30 artifact paths compile; graph guard six
  tests pass with only the documented AG-UI/kvdex Zod 3 boundary.
- Parsed full-export comparison is at or below canary.14 for every one of 19 roots, with summed
  diagnostics 287 baseline to 279 repair. Serial `publish:dry-run` passes and restores manifests.
  Exact one-pass `scaffold.runtime --cleanup --format pretty` exits 0 at 73 passed / 0 failed with
  endpoint, background, OTEL, and cleanup proof; read-only leak report finds no smoke-owned
  survivor.
- `deno.lock` is restored to branch hash `d32ef0c1...`; target worktree is clean. Current-head
  hosted contexts are 17 terminal skipped because the PR remains draft and are explicitly not a
  green train verdict. Review-thread gate is 0/0.
- Prepared `slices/t1-a-1295/impl-eval-repair-1-prompt.md` for a new sender-free, read-only Qwen 3.8
  Max high session on exact head `18c7a7e79...`; prior evaluator sessions are not resumed.

## 2026-08-06 — T1-A repair-cycle formal IMPL-EVAL launch

- Reconciled issue #1295 and PR #1315 from exactly `status:impl` to exactly `status:impl-eval` while
  preserving all other taxonomy, milestone 0.0.5, draft state, canary.14 base, and head
  `18c7a7e791552c6f346ef07a77a741dd70b058d6`.
- Verified exact clean local/origin/PR head and launched once through checked-in
  `.llm/tools/agentic/claude/openrouter-run.ts` with `deno run --no-lock`: Qwen 3.8 Max high,
  bypass, separate read-only session `4c09a05f-a5da-4794-87e2-29b2d05f67f2`.
- The raw stream is captured at
  `.llm/tmp/release-0.0.5--orchestration/t1-a-impl-eval-repair1-raw.txt`; prior failed/premature
  evaluator sessions are not resumed and remain historical/ineligible as recorded.

## 2026-08-06 — T1-A evaluator provider-budget recovery

- Qwen session `4c09a05f-a5da-4794-87e2-29b2d05f67f2` independently reproduced the decisive repair
  evidence through the completed exact one-pass runtime smoke, but its post-compaction continuation
  was rejected by the provider because the transport's default 32,000-token output reservation
  exceeded the remaining paid-account budget. The session emitted no verdict, so the interrupted
  turn is failed closed rather than inferred as PASS.
- Preserved the original raw transcript and its terminal transport error. The transcript contains
  useful independent gate evidence but cannot itself advance the lifecycle without the contracted
  complete Markdown artifact and terminal verdict token.
- Confirmed the canonical provider policy copies non-provider runtime variables into the isolated
  child while still clearing rival credentials and route variables. Resumed the same formal Qwen
  high session through checked-in `openrouter-run.ts`, still bypass-enabled and read-only, with
  `CLAUDE_CODE_MAX_OUTPUT_TOKENS=16000` so the provider can reserve an affordable bounded response.
  The continuation is limited to the remaining smoke-log adjudication, read-only leak report, final
  hygiene checks, and artifact/verdict emission; its raw output is captured separately at
  `.llm/tmp/release-0.0.5--orchestration/t1-a-impl-eval-repair1-resume-raw.txt`.
- The bounded same-session resume reached the expected Qwen/bypass initialization but was rejected
  before inference with the provider's monthly-limit response. It produced no new evidence or
  verdict and is failed closed. Only the single canonical OpenRouter credential is configured; no
  alternate approved Qwen credential is present. T1-A stays draft at exactly `status:impl-eval`, and
  the orchestrator will continue independent non-merge work while holding this gate closed.
- Consulted the canonical OpenHands handoff routing card after the local transport failure. It
  explicitly forbids moving a local harness evaluator into cloud OpenHands, so no cloud trigger or
  fallback evaluator was dispatched and no GitHub state changed for T1-A.
- Re-queried the inherited train. PRs #1317 and #1318 remain mergeable, current-head green, and
  `status:ready-merge`, but T2 remains sequenced after T1 train mutations and therefore is held. PR
  #1316 remains mergeable and `status:ready-merge`; the repo-native latest-run classifier reports
  zero current failures, but its core visibility job is still queued and runner-starved jobs are
  canceled rather than green. It remains unmerged and outside the pre-merge gate.

## 2026-08-06 — repeated external-gate audit and T2 preparation

- Re-attempted the same bounded Qwen session through the canonical checked-in route on a new goal
  continuation. The provider again rejected the sole configured key at its monthly limit before
  inference; raw capture is
  `.llm/tmp/release-0.0.5--orchestration/t1-a-impl-eval-repair1-resume2-raw.txt`. No evidence or
  verdict was produced, and T1-A remains failed closed at `status:impl-eval`.
- Inspected PR #1316's exact Actions run `31121552268`. All six jobs require `ubuntu-latest`; five
  were canceled after waiting without executing a step and report no assigned runner, while
  `core CI
  lane visibility` remains queued with no runner. Repository Actions are enabled, but the
  current token cannot read account billing usage. The run was left untouched because
  cancel/retrigger would not repair absent capacity and would discard its current provenance.
- Prepared non-dispatchable T2-A and T2-B supervisor/preflight artifacts from live issues, PRs,
  worktrees, check rollups, and review-thread gates. They hold the approved post-T1 sequence and
  require fresh current-base validation plus separate Qwen IMPL-EVAL; neither inherited composed or
  pending evaluator artifact is accepted as the current formal gate.
- Both T2 worktrees contain the same pre-existing 45-line `deno.lock` patch, exact patch hash
  `cfc68984...`. Created non-mutating recovery commits `b7b335566...` for T2-A and `d953769b0...`
  for T2-B; left both worktrees unchanged and instructed future supervisors never to stage, restore,
  pop, drop, or overwrite that unowned state.

## 2026-08-06 — W1 live preflight preparation

- Re-read live #1312, #1148, #1024, #1328, #1324, and #1330 including owner comments and current
  lifecycle/milestone state. No new product PR exists for any W1 cluster; the orchestration PR only
  references them.
- Prepared non-dispatchable supervisor/preflight artifacts for W1-A, W1-B, and W1-C. Each records a
  planned worktree/branch, Sol-low bypass route, exact dependency hold, relevant skill set, decisive
  negative/runtime gates, separate Qwen evaluator requirement, and orchestrator-only merge/publish
  authority. No branch, worktree, label, PR, or agent session was created.
- W1-A now carries the unresolved authenticated publish-budget/reset/report decision, fail-before-
  mint side-effect contract, full/partial classification, same-semver policy, generated-TypeScript
  residue negative, exclusions, and scan-cost evidence required before canary.14.
- W1-B preserves the five #1024 criteria already delivered in merged PR #1092 and scopes only the
  remaining clone-independent consumer smoke plus #1328's owned TS/TSX/plugin/background quality
  surface. The historical `feat/1024-agent-tooling-bundle` worktree is evidence, not a branch seed.
- W1-C requires generated project MCP attachment, a pre-code tools/list + harmless lookup receipt,
  fail-closed measurement, discovery-source telemetry, provider-valid history normalization, and
  real OpenRouter attachment/resume. Its real-provider gates and formal evaluator remain
  additionally held by the same external OpenRouter limit.

## 2026-08-06 — W2 live preflight preparation

- Re-read live #1325, #1329, #1202, and #1327 including #1202's owner diagnosis/scope amendment.
  Prepared non-dispatchable supervisor/preflight artifacts for W2-A/B/C; no branch, worktree,
  lifecycle, PR, resource, or agent mutation occurred. Every lane is held behind the verified C14
  green pair and the fresh canary.15 train.
- Applied the Aspire operating contract to require isolated AppHosts, exact resource/health/log/OTEL
  evidence, exact-AppHost cleanup, and no foreign-resource mutation. Applied Fresh 2.x guidance to
  W2-B's generated/native EventSource consumer rather than allowing deprecated or parallel consumer
  conventions.
- W2-A carries RED generated-output behavior, both Redis/Garnet and Deno KV, real background health,
  and a shared/enumerated KV-runtime invariant rather than another triggers-only import patch.
- W2-B is contract-first: one exported versioned SSE envelope governs server, generated/Fresh
  consumer, docs, replay/error semantics, and W3C/correlation propagation, with a real end-to-end
  Aspire trace and public package gates. W3-A remains dependent on it.
- W2-C separates code and observational authority. Its PR may close #1327 but only reference #1202;
  the colliding Windows service/port and three consecutive clean runtime passes remain an
  orchestrator evidence closure. Migration success must prove created files and applied DB state in
  TTY/headless modes rather than exit zero.

## 2026-08-06 — W3 live preflight preparation

- Re-read live #1326, #1102, #1197, and #1119 including #1197's owner measurement, hand-close, and
  Wave 6 mechanical-attachment comments. Prepared non-dispatchable W3-A/B/C supervisor/preflight
  artifacts; no implementation or GitHub state was created.
- W3-A is held on W2-B's envelope and specifies a deterministic finite reconnect state machine,
  bounded buffer/overflow/loss semantics, injected clock/backoff, real outage/recovery, and standard
  OTEL rather than the current impossible “until reconnect” promise.
- W3-B is held on W1-C attachment. Its code PR may close #1102 but only reference #1197; intent
  corpus product acceptance and real-agent adoption measurement remain distinct. Available-tool
  count, discovery-source calls, built-in-vs-hand-rolled ledger, and the 0.0.4 baseline comparison
  are required before the orchestrator hand-closes #1197.
- W3-C inventories active/generated/compatibility/history references before renaming AI provider
  canaries to model-rollout terminology, preserving immutable historical evidence while reserving
  unqualified canary language for release cuts.

## 2026-08-06 — W4 live preflight preparation

- Re-read live #1333, #1208, and #1108 including the #1335 child-scope note, #1208 Phase 2/Loom
  comments, and the four #1108 criteria already delivered by #1292. Prepared W4-A/B/C supervisor/
  preflight artifacts without provisioning or dispatch.
- Applied the design skill to W4-A: the mandatory pre-code checkpoint now grounds a concrete
  reference subject/audience/job, inventories live registry/eis-chat/scaffold patterns, requires an
  intentional token/type/layout/signature system, self-critiques generic defaults, and records the
  canonical GLM design artifact without misrepresenting GLM's absent reasoning trace.
- W4-A is held behind C15 and reserves #1333's measured-agent row for orchestrator hand-close. It
  combines dynamic app naming, executable Fresh 2.x resource architecture, real rendered states,
  accessibility/responsive/light-dark browser proof, and the exact runtime gate.
- W4-B is held behind W4-A and uses `deno doc` plus retained executable patterns for a real runnable
  page-builder tutorial. It does not close #1208 while the owner-directed Phase 2 sweep remains
  unresolved on the same issue.
- W4-C preserves #1292's export authority and scopes only the eight-package repair, machine-readable
  intentional omissions, update procedure, negative fixtures, and docs-verification integration.

## 2026-08-06 — W5 live preflight preparation

- Re-read live #1137, #1138, #1332, and #1334. Prepared the final two planned cluster supervisor/
  preflight artifacts, leaving every one of the 18 PLAN-EVAL-approved PR clusters represented by
  current dependency/route/gate/closure instructions. No W5 branch, worktree, lifecycle, PR, or
  agent mutation occurred.
- W5-A derives an exhaustive first-party route inventory from live contract/OpenAPI authorities,
  requires meaningful summaries/natural tags and a firing guard, and documents every shipped MCP
  status/input/failure/exclusion seam with full contract/package/docs gates.
- W5-B consumes W4's design/pattern authority and #1254's generated multi-model barrel. It requires
  a compiling DB-generated-schema → narrowed versioned contract fixture, explicit private-field
  omission, DB-less/backed parity, bidirectional links, and a concise outcome-led homepage argument
  with current code/diagrams, one-click task routes, and responsive/accessibility browser proof.

## 2026-08-06 — Final evidence-closure preflight

- Re-read live #1004, #1090, #1126, #1166, and #1169 plus #1126's fourteen-child ledger, #1149, and
  deferred #1175. Confirmed that none may be auto-closed by a code PR.
- Recorded cut-time evidence contracts under `slices/f-evidence-closures/preflight.md`. #1004
  requires a real partial same-semver registry recovery; #1090 requires a single unprompted
  behavioral observation; #1166 requires a real update-merge topology and correctly derived canary
  payload; #1169 requires a one-pass OIDC cut with no operator rerun or override.
- Confirmed PR #1180 already delivered #1166's merge-aware code under `Refs #1166`; its remaining
  live canary rows stay open. Confirmed #1126 has S1–S10 closed, W5-A owns retained S11/S12, and
  deferred S13/S14 are now in 0.0.6.
- Made the no-manufactured-evidence rule explicit: if a genuine partial publish or qualifying merge
  topology does not occur in C14–C16, move the still-unearned issue to 0.0.6 with its checkbox
  intact. Likewise, no coached retry may turn #1090 into a pass.
- No GitHub state, product code, branch, worktree, agent, evaluator, merge, release, or resource was
  mutated. Root `deno.lock` remains unrelated user state and was not staged or changed.

## 2026-08-06 — Third external-gate audit and blocked transition

- Pushed the complete cluster and final-closure preparation at `983e741bf`. All eighteen PR clusters
  plus the five orchestrator-only evidence closures now have current dependency, route, gate, and
  authority records; no safe dependency-independent implementation lane remains.
- A generic live provider-canary probe reported `auth_required` because that probe does not resolve
  the configured user env file. It is not the decisive transport verdict. Re-ran the exact formal
  evaluator continuation through checked-in `openrouter-run.ts`, which does resolve the canonical
  credential, with Qwen 3.8 Max high, bypass, session `4c09a05f-a5da-4794-87e2-29b2d05f67f2`, and
  the supported 16,000-token output cap.
- The canonical route initialized on the exact target and then returned HTTP 403
  `Key limit
  exceeded (monthly limit)` before inference. Usage was zero input/output tokens and
  zero cost; no evaluator artifact or verdict exists. Raw capture is
  `.llm/tmp/release-0.0.5--orchestration/t1-a-impl-eval-repair1-resume3-raw.txt`.
- Re-queried #1316 Actions run `31121552268`. It is now terminal `failure`: all six required
  `ubuntu-latest` jobs were canceled, every job has an empty step list, and none received a runner.
  Repo-native `agentic:pr-checks` still reports zero current product failures while classifying the
  canceled contexts separately; canceled is not green. No cancel/retry was issued.
- Exact-head verification confirmed root/local/remote orchestration at `48b1e5eac`, T1-A
  local/remote/PR at clean `18c7a7e79`, and T1-B local/remote/PR at `31b898212`. T1-B's old 45-line
  `deno.lock` patch is present in the worktree and byte-identical to protected stash `7eb4ed16d...`,
  patch hash `cfc68984...`; it is unowned preservation state and was not restored, staged, popped,
  dropped, or overwritten. Root's unrelated `deno.lock` also remains unstaged.
- This is the third consecutive goal continuation with the same Qwen capacity blocker. Combined with
  the runner-capacity hold and exhausted independent preflight work, the milestone is at a genuine
  external-state impasse. The goal transitions to `blocked` without changing T1 lifecycle, merging,
  publishing, or substituting an unapproved evaluator route.

## 2026-08-06 — Owner-authorized DeepSeek route prerequisite resumed

- Owner raised the OpenRouter limit and explicitly replaced the pending/future formal IMPL-EVAL
  default with `deepseek/deepseek-v4-flash-0731` at `max`; formal PLAN-EVAL remains
  `minimax/minimax-m3` at `high`. Completed valid Qwen evidence, including T1-B session
  `abe31571-0fa1-4ea4-9085-1c36ea14a5c7`, remains immutable and accepted.
- Created scoped prerequisite issue #1338 and draft PR #1339 against `canary/0.0.5-canary.14`. A
  dedicated Codex GPT-5.6 Sol low supervisor generated the locked three-slice plan. Fresh separate
  Minimax session `a583f0da-69b3-4717-8271-bca95d9cd2db` returned PLAN-EVAL `PASS` against exact
  clean planning head `258034b1f...` with bypass; cost was unavailable and is not inferred as zero.
- Prerequisite S1 is clean and pushed: implementation commit `22d7d980f...`, current review-launch
  head `45b099e60...`. Focused contracts passed 46/46; lockless scoped check covered 149 files in
  two green batches; scoped lint/fmt covered 149 files with zero findings. The prerequisite lock is
  exact HEAD blob `ef28b1b...`; root and T1-B protected locks were untouched.
- The first scoped-check child omitted its own `--no-lock` and rewrote only the prerequisite
  worktree lock. The supervisor stopped without staging. After exact attribution, the orchestrator
  restored only that run-owned lock delta and the corrected child command
  `deno check --unstable-kv --no-lock` stayed byte-stable.
- Because the Claude plan remains exhausted until Saturday, dispatched the separate owner-authorized
  ordinary S1 review through the agentic OpenHands workflow with requested OpenRouter
  `x-ai/grok-4.5`, effort `medium`, PR-comment output. This is temporary REVIEW drift only, never a
  formal evaluator substitute. S2/S3 and the live DeepSeek proof remain pending review outcome.
- Re-queried T1-B Actions run `31121552268`: attempt 2 is current-head
  `31b8982123fda57294f4f7bf438c1157a622a41c` but still top-level `queued`. `deps-report` and
  `close-gate` executed successfully; `classify changes` remains queued, so the downstream required
  product jobs have not executed. This is partial current-head evidence, not the required executed
  green rollup; T1-B does not advance or merge.

## 2026-08-06 — #1338 landed; T1 resumed under streamlined policy

- Owner policy now makes PLAN-EVAL conditional for genuinely complex/decision-heavy work, keeps
  independent IMPL-EVAL mandatory absent explicit waiver, pauses OpenHands, and permits only an
  OpenRouter-limit fallback through the checked-in AGY/Google `gemini-3.6-flash-high` high route.
- PR #1339 passed its exact local DeepSeek V4 Flash 0731 max IMPL-EVAL in fresh bypass session
  `504a078c-5ed6-4891-8c7a-00aa41abd78f`; terminal cost `$2.623356`. Focused tests, scoped
  check/lint/fmt, mirror/docs gates, review-thread gate, current-head close-gate, prohibited-diff
  scan, and scope audit were green. It squash-merged into `canary/0.0.5-canary.14` as
  `10dbea37c09b815f1372a5241b60fdd5d7694652`.
- #1338 deliberately remains open at `status:impl`: its T1-A/T1-B rows are observational and were
  not closed by the policy PR. The PR used `Refs #1338`, preserving the no-observational-row closure
  rule.
- The checked-in leaf merge helper still recognizes only OpenHands status comments. Because
  OpenHands is owner-paused, its parser gate was explicitly skipped while the actual independent
  local IMPL-EVAL PASS remained mandatory and was manually verified; mergeability stayed clean and
  the exact head was pinned. This is recorded tooling drift, not an evaluation waiver.
- T1-A remains clean at local/remote/PR head `18c7a7e791552c6f346ef07a77a741dd70b058d6`. Launched
  one fresh local DeepSeek max evaluator against that exact repaired target through checked-in
  `openrouter-run.ts`; OpenHands was not used and the prior Qwen session was not resumed.
- T1-B Actions run `31121552268` attempt 2 remains top-level `queued` at exact current head
  `31b8982123fda57294f4f7bf438c1157a622a41c`; required downstream jobs still have no executed
  current-head green verdict. T1-B remains held and its protected lock/stash state is untouched.

## 2026-08-06 — T1 evaluator PASS and fresh workflow heads

- T1-A fresh local DeepSeek V4 Flash 0731 max evaluator session
  `d1fddd8c-12c9-4a44-9bbd-b07207d3db65` returned **PASS** against exact clean repaired head
  `18c7a7e791552c6f346ef07a77a741dd70b058d6`, bypass, cost `$3.565048`. It independently confirmed
  the prior Qwen blockers repaired: 19-root doc-lint 287→279, detached Fresh consumer green and
  CI-wired, exact runtime smoke 73/73 exit 0 with cleanup, all #1295 rows supported, and lock
  SHA-256 unchanged. Full artifact is `evaluate-repair-deepseek.md` on T1-A.
- Recorded the PASS in evidence-only head `1124897105242bcee540ed379dd7d959916b005f`, posted the
  formal phase comment, updated the PR body, and marked #1315 ready for review. It remains
  `status:impl-eval` until executed current-head Actions are green.
- T1-B run `31121552268` remained API-inconsistent: attempt 2 was reported queued, ordinary cancel
  rejected it as completed, rerun rejected it as already running, and force-cancel rejected it as
  not yet queued. Draft/ready and label cycles produced no new run. To force a real synchronize
  event without touching product/evaluator/lock state, pushed one evidence-only worklog commit
  `ca9f6cd15065f567482ce5a674efcac6c197b0b6`; the completed Qwen PASS remains valid against the
  unchanged product tree. The protected dirty lock and stash are byte-unchanged.
- Both PRs are clean/mergeable at their new evidence heads, but GitHub has not yet materialized
  their new workflow sets. Absence of checks is unproven, not green; neither may merge yet.

## 2026-08-06/07 — C14 queue shipped and green pair verified

- #1315 merged at `95a60cbaf8384f8c21e822f383dfcab6b8a8c189`; #1316 followed at
  `51787c3aef48fd6b7fe55005dfe19cd16b141b81`; mechanically refreshed #1317 and #1318 then merged at
  `765e8b7329bfba6d073791f5e067274349a7653e` and `a5c13ecdd0df3455e5c4ce0f08fcc59dae251826`. Valid
  prior IMPL-EVAL PASS evidence was preserved.
- Exact-tree local pre-merge evidence for the payload passed check, lint, fmt, release preflight,
  publish dry-run, production install, live-Redis controls, and 2,937 repository tests with zero
  failures. Payload PR #1340 then squash-merged to `main` as
  `d6db645a89d830e6c36e838e8e1dac98fc84fde5`; #1295/#1189/#1117/#1115 auto-closed and terminal
  PR/issue labels were reconciled to `status:shipped`.
- `v0.0.5-canary.14` published at `2026-08-06T21:39:04Z`, tag content
  `d405def432b46d8119162a605b7e988db9d3f1fc`. The initial pinned E2E hit a transient JSR 502 on
  `@netscript/fresh`; its separate quickstart walk passed. No code repair was warranted.
- Documented tag-bound same-semver recovery run `31128595811` completed success and reverified the
  production path, exact registry membership, and green pair. Exact pinned child E2E run
  `31128614286` completed success. Canary.14 is terminal green; canary.15 was not cut.
- Post-C14 workflow is small connected PRs directly to `main`; no aggregate train PR. W1-A/B/C is
  the first canary.15 group. Billing Run waits for W1-B/W1-C to exist in the published canary.15.
- Only mandatory terminal artifacts were changed. Root `deno.lock` and both quarantined interrupted
  worktrees remained untouched.

---

## Stage A — stable-cut activation, 2026-08-08

Read: `netscript-harness`, `agent-milestone-orchestrator`, `milestone-run.md`, `canary-cadence.md`,
`lane-policy.md`, `tooling.md`, `netscript-release` prerequisites, the inherited run dir at
`ac7a4892a`, live milestone 23, and live `origin/main`.

Re-baseline verified live, not recalled:

- `origin/main` = `6c6044da9` at first query; it advanced to `c383b2e84` mid-activation when #1337
  (the inherited continuation artifact PR) and #1347 (planning-only seed roadmap) merged. This
  branch was re-based onto `c383b2e84` before its first push, so the imported run dir is `main`'s
  copy plus this run's v4 sections — not a second copy of the same files.
- Latest prerelease = `v0.0.5-canary.16`, `2026-08-07T17:16:52Z`; pair recorded in
  `canary-16-recovery-receipt.md` (publish 31201279314, pinned E2E 31201560939, both success).
- Merges on `main` after canary.16's source `fac9e3390`: #1391 (`6c6044da9`), #1337 (`bb10be0e2`),
  #1347 (`c383b2e84`), #1215 (`a6b2e4c31`). **Correction (v4 PLAN-EVAL BLOCKER 1):** an earlier
  version of this line claimed none of them touches `packages/**` or `plugins/**` and listed only
  three. Both claims were false. `git show --name-only 6c6044da9` includes
  `packages/bench/bench.config.ts` and three `packages/fresh-ui/tests/**` files; #1215 merged after
  the line was written. #1337, #1347 and #1215 touch neither tree. All four enter C17's payload.
- Milestone 23 `0.0.5`: 21 open issues; 0 open PRs after #1337 merged.
- 0.0.6 = 32 open, 0.0.7 = 12 open — both swept in full for pull-forward (plan v4).

## Stage B — dispatch preconditions, 2026-08-08

Recorded before any wave dispatch, per `milestone-run.md` stage B. The proof is the check output,
not the intention.

| Precondition                    | Command                            | Result                                                                                                                                                                                                                                                                                                                      |
| ------------------------------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Runtime health                  | `deno task agentic:runtime doctor` | `no_change` (schema 1.0), mode inspect, changed no; observed `foundation:0ea51506…`; components 18                                                                                                                                                                                                                          |
| Codex daemon                    | `deno task agentic:codex-status`   | daemon `running`, managed codex `0.147.0`, app-server `0.146.1`, 3 app-server processes / 2 anchored                                                                                                                                                                                                                        |
| Writer conflicts                | same                               | 5 Codex sessions, **all idle**, none in `/home/codex/repos/ns005-stable-opus5`; the two active-recent threads are the RFC worktrees `ns-rfc-sdk-client` / `ns-rfc-command-kit` (PRs #1389/#1390) and are not this run's                                                                                                     |
| Paid-transport / route identity | `deno task agentic:routing-state`  | canonical native opposite-family formal routes present (`fable-5` medium evaluates openai, `gpt-5.6-sol` xhigh evaluates anthropic); OpenRouter Minimax/DeepSeek present as `policy=open_only` escalation; AGY Gemini as `fallback_on_openrouter_limit`; **no persisted routing transitions** (no silent fallback in force) |
| GitHub transport                | `deno task agentic:gh-token check` | OK — valid token resolved from `gh:windows` (rickylabs)                                                                                                                                                                                                                                                                     |
| Publish-side static gate        | `deno task release:preflight`      | PASS on all four checks (text-imports, import-attributes 0, file-url-import-meta 0, self-imports 0)                                                                                                                                                                                                                         |

No provider quota exhaustion is in force: the v3-era OpenRouter monthly limit that blocked T1-A
(C-D18) is not on this run's critical path, because v4's formal evaluator lane is native
opposite-family and OpenRouter is escalation-only.

---

## Milestone-move receipt — executed 2026-08-09, W3 dispatch predicate

Executed only after PLAN-EVAL cycle 5 returned `PASS`, per the v4.1 sequencing rule. Before and
after are live `gh issue view --json milestone,state` queries, not inferred.

| Issue | Before       | After            | Direction |
| ----- | ------------ | ---------------- | --------- |
| #1373 | 0.0.6 / OPEN | **0.0.5** / OPEN | inbound   |
| #1356 | 0.0.7 / OPEN | **0.0.5** / OPEN | inbound   |
| #1375 | 0.0.6 / OPEN | **0.0.5** / OPEN | inbound   |
| #1376 | 0.0.6 / OPEN | **0.0.5** / OPEN | inbound   |
| #1359 | 0.0.7 / OPEN | **0.0.5** / OPEN | inbound   |
| #1343 | 0.0.6 / OPEN | **0.0.5** / OPEN | inbound   |
| #1379 | 0.0.6 / OPEN | **0.0.5** / OPEN | inbound   |
| #1126 | 0.0.5 / OPEN | **0.0.6** / OPEN | outbound  |
| #1169 | 0.0.5 / OPEN | **0.0.6** / OPEN | outbound  |

Nine of nine. The set matches the nine IDs the receipt enumerates, so the predicate reads
**`passed`** rather than `MISMATCH`.

**Independent confirmation:** live 0.0.5 open-issue count after the moves is **26**, matching the
plan's declared scope exactly — `21 − 2 + 7 = 26`. The count and the enumeration agree, which is the
property cycle 3 found missing when they matched only by coincidence.

Both outbound moves carry a written reason **on the issue**, per the honesty rule: #1126 because an
epic cannot hand-close while #1139/#1140 are open in 0.0.6, and #1169 because its Definition of Done
names a release cut that 0.0.5 has not reached and its child #1175 is open in 0.0.6. Moving #1169
makes the 0.0.5 cut its evidence rather than its deadline.

**W3's dispatch predicate is now satisfied.** It remains held on C17 and, for W3-A, on W2-B's frozen
envelope.

## PLAN-EVAL — final verdict

Five cycles on the milestone plan, all in the same separate Codex · GPT-5.6 Sol · high session
(opposite family to the Claude generator):

| Cycle | Verdict     | What it caught                                                                                                                                                                                         |
| ----- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1     | `FAIL_PLAN` | false re-baseline (a `packages/**` claim contradicted by `git show`), unmaintained cut-trace, W3-B folded against #1376's own boundary, incomplete closure manifest                                    |
| 2     | `FAIL_PLAN` | scope arithmetic, #1169's unclosable DoD, #1004 closable by non-occurrence, missing authority column, #1379's unchosen lock policy, stale phase registry, approximate timestamps, missing W3 sub-order |
| 3     | `FAIL_PLAN` | a claimed authority column that did not exist; superseded manifest rows left live with stage F still pointing at them; a receipt that could never read `passed`                                        |
| 4     | `FAIL_PLAN` | four closure rows whose events could occur while the issue stayed acceptance-incomplete; #1208 Phase 2 with no non-occurrence path                                                                     |
| **5** | **`PASS`**  | no surviving findings; regression check confirmed the repair touched only the four rows                                                                                                                |

The gate earned its cost. Every cycle found something checkable, and cycles 1 and 4 each caught an
error that would have closed or blocked an issue against its own acceptance contract.
