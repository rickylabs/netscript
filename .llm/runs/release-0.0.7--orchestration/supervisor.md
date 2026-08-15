# Supervisor identity — release 0.0.7

| Field                     | Value                                                                                                           |
| ------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Profile                   | `milestone-cluster`                                                                                             |
| Run id                    | `release-0.0.7--orchestration`                                                                                  |
| Coordinator               | `codex-root-0.0.7`                                                                                              |
| Coordinator Codex session | `019ffaa3-32ae-7b02-92a5-d7ae146d8cbd`                                                                          |
| Coordinator transcript    | `/home/codex/.codex/sessions/2026/08/13/rollout-2026-08-13T12-20-27-019ffaa3-32ae-7b02-92a5-d7ae146d8cbd.jsonl` |
| Same-session resume       | `codex exec resume 019ffaa3-32ae-7b02-92a5-d7ae146d8cbd -- "<follow-up>"`                                       |
| Recovery predecessor      | `019ff0c0-ca4b-7ea0-893b-e8ab1f4811ea` (daily-assistant/recovery anchor, not the active milestone coordinator)  |
| Coordinator worktree      | `/home/codex/repos/netscript-547-lffix`                                                                         |
| Control branch            | `chore/release-0.0.7-orchestration`                                                                             |
| Harness                   | `.llm/runs/release-0.0.7--orchestration` (`milestone-cluster`)                                                  |
| Baseline `main`           | `01e0960494c95ce56eb35892c211a095eb13e6ed`                                                                      |
| Target milestone          | GitHub milestone `0.0.7` (`#27`)                                                                                |
| Started                   | `2026-08-13T18:35:10.000Z`                                                                                      |
| Coordinator runtime       | Codex via ChatGPT subscription; GPT-5.6-SOL at high effort (`max` is not authorized)                            |
| Coordinator transport     | Remote Control app-server socket `unix:///home/codex/.codex/app-server-control/app-server-control.sock`         |
| Coordinator attachment    | resume PID `2452378`; app-server PID `5027` running with `--remote-control`; verified `2026-08-14T23:08:28Z`    |
| PLAN-EVAL session         | Claude `2439b19d-5df7-4920-9fce-fa5831ec4fdf`; opposite family                                                  |
| PLAN-EVAL cycle           | 2 of 2: `APPROVED` at plan head `331f7c664`                                                                     |

The coordinator identity was recovered and transcript-verified at `2026-08-14T22:41:15Z` rather than
inferred from a child thread. Its `session_meta` identifies Codex Desktop/OpenAI, its persistent
goal names the 0.0.7 milestone coordinator mandate, it created this canonical harness run, and it
committed/pushed the coordinator checkpoints. Topic and implementation sessions remain excluded.
Resume this exact session; never create a replacement coordinator while it is recoverable.

The owner-corrected coordinator route is **GPT-5.6-SOL / high, never max**. Two interrupted
standalone turn contexts at `2026-08-14T22:47:31Z` and `22:53:43Z` recorded `max`; they are
historical transport drift and confer no continuing authority. The active same-thread process is PID
`2452378`, launched through `codex resume --remote` with model `gpt-5.6-sol` and reasoning effort
`high`, against app-server PID `5027`, whose argv includes `app-server --remote-control`. The
app-server owns both the canonical rollout file and thread-writer lock for
`019ffaa3-32ae-7b02-92a5-d7ae146d8cbd`. This transport repair does not alter, relaunch, or reassign
any Claude topic supervisor.

The coordinator is the sole merge authority. Exactly four topic orchestrators will own the `docs`,
`internals`, `fixes`, and `features` lanes after Step 0 validates. The release captain and writer
lease remain inactive until every committed issue is terminal and exact-`main` gates pass.

| Lane      | Orchestrator id         | Active issues | Capacity                         |
| --------- | ----------------------- | ------------: | -------------------------------- |
| docs      | `topic-docs-0.0.7`      |             1 | two implementers + one evaluator |
| internals | `topic-internals-0.0.7` |            16 | two implementers + one evaluator |
| fixes     | `topic-fixes-0.0.7`     |            26 | two implementers + one evaluator |
| features  | `topic-features-0.0.7`  |            17 | two implementers + one evaluator |

Read-only watchers are `milestone-main-watcher-0.0.7` and `milestone-ci-watcher-0.0.7`; both carry
`mutationAuthority:false`. The first evaluation was mistakenly routed to Claude Opus/high instead of
the canonical Fable/medium plan-evaluator route. The family separation was valid, but the route
deviation is recorded. Fable completed the cycle-2 evidence pass but hit its monthly spend limit;
the same conversation used the recorded Opus fallback for final synthesis and approved dispatch.

Quota at the checkpoint: Codex primary window had 77% remaining (weekly reset 2026-08-20 05:31
Europe/Zurich); Claude Max showed 6% all-model weekly remaining and 2% Fable weekly remaining (reset
2026-08-15 00:00), with its current-session window resetting 2026-08-13 23:10. Implementation
therefore routes through WSL Codex; Claude is reserved for the bounded opposite-family re-review.

At dispatch, all four topic-control sessions use the documented Codex Sol/high route fallback
because native Claude capacity is insufficient for four persistent orchestrators. Their clean
control worktrees are `/home/codex/repos/netscript-007-{docs,internals,fixes,features}` at exact
`main` `01e096049`; thread identities and steering commands are recorded after launch.

| Lane      | Topic thread                           | Worktree                                    | Same-thread steering                                                      |
| --------- | -------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------- |
| docs      | `019ffcc0-e19b-71d1-95ce-8c72559eb026` | `/home/codex/repos/netscript-007-docs`      | `codex exec resume 019ffcc0-e19b-71d1-95ce-8c72559eb026 -- "<follow-up>"` |
| internals | `019ffcc0-e1b5-74f0-96eb-cdeb298d6b17` | `/home/codex/repos/netscript-007-internals` | `codex exec resume 019ffcc0-e1b5-74f0-96eb-cdeb298d6b17 -- "<follow-up>"` |
| fixes     | `019ffcc0-e1ae-7b70-b3b8-8804ebd6f773` | `/home/codex/repos/netscript-007-fixes`     | `codex exec resume 019ffcc0-e1ae-7b70-b3b8-8804ebd6f773 -- "<follow-up>"` |
| features  | `019ffcc0-e1d2-7850-a308-354b670c6f3d` | `/home/codex/repos/netscript-007-features`  | `codex exec resume 019ffcc0-e1d2-7850-a308-354b670c6f3d -- "<follow-up>"` |

All four sessions were launched attached through `agentic:launch-codex-slice`; live status reports
one working Sol/high agent at each exact worktree and no route or worktree ownership collision.

Owner visibility invariant: every 0.0.7 session assigned a Claude supervisor/orchestrator role must
run with native Claude `/remote-control`. Attachment is proven only by the native session registry
matching PID and cwd and exposing a non-empty `bridgeSessionId`; custom-endpoint/OpenRouter Claude
sessions do not satisfy this invariant. The four active topic controls above are Codex daemon lanes,
so they use the corresponding daemon/thread visibility proof instead.

The user-visible native Claude milestone control surface was attachment-proved with
`/remote-control` at `https://claude.ai/code/session_016HFNiTigGUb7ieFxqFDvJb`: PID `2163112`, cwd
`/home/codex/repos/netscript-547-lffix`, Claude session `6e65c618-c957-443a-b713-d0399a891463`, and
non-empty bridge id `session_016HFNiTigGUb7ieFxqFDvJb`. The owner then directed it stopped to
preserve the remaining 4% allowance; the process and registry record are gone. The four Codex topic
lanes remain the active supervisors.

PR #1651 PLAN-EVAL separately uses a bounded native Claude Remote Control session at
`https://claude.ai/code/session_018f6pxZjiFPaYJF6AFLyLxn`: PID `2159276`, exact leaf cwd, Opus
5/medium fallback, and bridge id `session_018f6pxZjiFPaYJF6AFLyLxn`. It was interrupted before
verdict and cleanly exited on the same owner directive; no verdict or repository mutation survived.
Formal Claude-family gates may resume after the Saturday 2026-08-15 00:00 Europe/Zurich reset.

After that owner directive, the internals topic briefly launched a Claude-compatible OpenRouter
PLAN-EVAL for #1653. It had already committed a `FAIL_PLAN` artifact before the coordinator's stop
signal reached it; the process then exited and no replacement was launched. Its three substantive
findings are retained as advisory planning evidence and resolved by coordinator decisions, but it
does not waive the fresh formal opposite-family PLAN-EVAL required after reset. Until that reset,
topic and leaf lanes must not launch native Claude, Claude-compatible OpenRouter, or substitute
formal evaluators; existing Codex sessions may continue research, implementation already backed by a
valid plan gate, and artifact-only housekeeping.

The docs topic then attempted three automatic S1 resumes from the advisory #1652 result despite the
formal hold. The coordinator interrupted each leaf turn, stopped the dedicated docs topic process
group and watcher, removed the uncommitted/untracked S1 patch with `apply_patch`, and verified the
leaf worktree exactly clean at pushed plan head `d35cbca30`. The docs lane remains intentionally
offline until the Saturday gate; the other three Codex topic controls are unaffected.

The fixes topic later attempted a DeepSeek/OpenRouter IMPL-EVAL for #1643. The coordinator stopped
that process before verdict, removed its temporary transport artifact, amended the evaluator brief
to require a fresh native Claude/Fable gate after reset, and stopped the fixes topic control to
prevent automatic relaunch. #1643's substantive Codex implementation and Tier-A review remain valid
at pushed head `e6ba15ec6`; #1654 remains plan-only at `14d8b38b4`.

The internals tooling leaf #1644 completed its exact nine-surface implementation at `634b257ea`,
including the coordinator-authorized #1621 operator guidance. Substantive Tier-A review passed and
fresh structured check/test/quality receipts all passed at that implementation head. Evidence-only
child `4d9fb1967` packages the receipts and formal handoff without a self-referential gate rerun.
The draft remains `status:impl` and blocked only on native opposite-family IMPL-EVAL after reset.

## 2026-08-15 reset transition

The reset boundary arrived at `2026-08-15T00:00:00+02:00`. The owner revoked the temporary Codex
topic-orchestrator fallback while retaining Codex as milestone coordinator. The historical Codex
topic threads, branches, worktrees, leaf threads, PRs, and harness records remain evidence; they are
parked and must never be resumed as topic controllers while their Claude replacements own the lane.

The pre-mutation recheck at `2026-08-14T22:12:38Z` found unchanged `main` `01e096049`, exactly 60
open milestone issues, all seven milestone draft PRs at their recorded heads, zero current CI
failures or pending checks, clean coordinator/topic/leaf worktrees, no Docker containers, no
milestone resource lease, and no active milestone evaluator. The unrelated database-RFC Fable
session in `/home/codex/repos/netscript-db-rfc` is outside this cluster and is not touched.

### Corrected topic control plane

The owner rejected the Sonnet 5/low supervision canary as below the acceptable intelligence floor.
The canonical topic-orchestrator route is restored: native Claude Opus 5 at high effort. Every
replacement uses the same preserved topic branch/worktree, native Remote Control, and launcher
evidence; implementation remains delegated to WSL Codex with effort matched to documented task
complexity.

| Lane      | Preserved Codex topic thread           | Pre-transition state                                    | Claude requested route        | Worktree / branch                                                                    | Replacement identity                                                                                      |
| --------- | -------------------------------------- | ------------------------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| docs      | `019ffcc0-e19b-71d1-95ce-8c72559eb026` | parked: prior controller absent/offline; clean worktree | native Claude · Opus 5 · high | `/home/codex/repos/netscript-007-docs` / `orchestrator/release-0.0.7-docs`           | `fcf04b0f-…` · PID `2429469` · bridge `session_01PL…` · topic head `3e554349b`                            |
| internals | `019ffcc0-e1b5-74f0-96eb-cdeb298d6b17` | parked: `TOPIC_CONTROLLER_PARKED`, idle, clean          | native Claude · Opus 5 · high | `/home/codex/repos/netscript-007-internals` / `orchestrator/release-0.0.7-internals` | `f7691917-…` · PID `2429478` · bridge `session_01Hq…` (`cse_01Hq…` daemon alias) · topic head `98661da4f` |
| fixes     | `019ffcc0-e1ae-7b70-b3b8-8804ebd6f773` | parked: `TOPIC_CONTROLLER_PARKED`, idle, clean          | native Claude · Opus 5 · high | `/home/codex/repos/netscript-007-fixes` / `orchestrator/release-0.0.7-fixes`         | `c7597d28-…` · PID `2430399` · bridge `session_014p…` · topic head `1a5c3d5a9`                            |
| features  | `019ffcc0-e1d2-7850-a308-354b670c6f3d` | parked: `TOPIC_CONTROLLER_PARKED`, idle, clean          | native Claude · Opus 5 · high | `/home/codex/repos/netscript-007-features` / `orchestrator/release-0.0.7-features`   | `19621a0b-…` · PID `2430404` · bridge `session_01LQ…` · topic head `fed3f8119`                            |

No replacement is considered active until the previous controller is durably parked and the new
process has a Claude session ID, non-empty `bridgeSessionId`, PID, exact cwd, process-argv
model/effort evidence, and owner-visible Remote Control URL/state. Blank or inherited model settings
are forbidden; the documented native Claude CLI route must pass Opus 5, high effort, Remote Control,
and the initial brief explicitly.

Parking proof was completed at `2026-08-14T22:18:41Z`. The three extant Codex threads received the
same no-edit same-thread parking instruction through `agentic:codex-resume`, returned exactly
`TOPIC_CONTROLLER_PARKED`, reached `idle`, and left their worktrees clean at the preserved heads.
The docs topic had no live session or process and was already clean/offline. No topic controller,
leaf, evaluator, watcher, or resource process now owns any of the four topic worktrees.

Four Sonnet 5/low replacement canaries were subsequently started only long enough to reconcile and
journal their lanes. After the owner's model-floor correction, each returned
`TOPIC_CONTROLLER_PARKED_MODEL_FLOOR` and exited without launching an implementation leaf or formal
evaluator. They are historical evidence, not active controllers.

At `2026-08-14T23:00:08Z`, all four native Opus 5/high replacements satisfied the attachment gate:
each has an exact Claude session ID, non-empty bridge ID, PID/cwd match, explicit process-argv model
and effort, owner-visible Remote Control URL, a clean pushed topic checkpoint, and no premature leaf
or evaluator dispatch. The central controller state is now `active`; each topic's serialized
formal-gate queue may begin at its first eligible entry.

### Corrected evaluator matrix

The six already-recorded formal holds remain independently required because their live issues, prior
invalid/advisory gates, or implementation complexity still justify them. This is not a standing
six-gate template: no additional PLAN-EVAL is opened unless an existing issue, unresolved
architectural decision, or demonstrated complexity makes it necessary. Shared adversarial review is
deduplicated without replacing required independent phase evidence.

Each retained gate uses a fresh session separate from its Codex generator. Serialization is **per
topic orchestrator**: internals must finish order 1 before order 4, and fixes must finish order 2
before order 5; docs order 6 and features order 3 may run alongside those lane-local queues. One
evaluator per topic remains binding. The cluster-wide expensive-gate limit applies only to shared
resource-heavy gates such as full E2E/Aspire work, not formal evaluator sessions. Native Claude Opus
5 is the normal opposite-family evaluator; effort ranges from low through high according to the
evidence contract. Fable 5 is not pre-dispatched. It is reserved for genuinely architectural PLAN
questions or the few exceptionally complex implementations/reviews that materially need its
additional intelligence, with model and effort plus the concrete necessity recorded before launch.
All generator/evaluator separation, opposite-family, immutable-head, and coordinator-only authority
laws remain binding. The exact current assignments and rationales live in
`briefs/reset-gates/dispatch.json`.

### Live reset-gate checkpoint — 2026-08-14T23:54:29Z

| Order | Lane | PR | Gate | Result / current action |
| ----- | ---- | -- | ---- | ----------------------- |
| 1 | internals | #1644 | IMPL-EVAL | `PASS`; merged by coordinator as `dd472102d`; #1561/#1563/#1621 closed completed |
| 2 | fixes | #1643 | IMPL-EVAL | `PASS`; merged by coordinator as `0b3ed5d5a`; #1243 closed completed |
| 3 | features | #1651 | PLAN-EVAL cycle 2 | `PASS` at `3e0c8858b`; preserved Codex thread `019ffcc5-…` authorized to implement |
| 4 | internals | #1653 | PLAN-EVAL cycle 2 | `PASS` at `c694cfb31`; preserved Codex thread `019ffcc9-97d6-…` authorized to implement |
| 5 | fixes | #1654 | PLAN-EVAL cycle 2 | `PASS` at `b8fc5eb53`; preserved Codex thread `019ffcca-8be0-…` authorized to implement |
| 6 | docs | #1652 | PLAN-EVAL cycle 1 | `PASS` at corrected evaluator commit `a790e91e2`; preserved Codex thread `019ffcc9-16c2-…` authorized to implement |

The four PLAN-EVAL passes do not authorize replacement implementation sessions: each topic
supervisor must resume the recorded existing Codex leaf thread. `expensiveGates` is still empty.

### Active completion checkpoint — 2026-08-15T03:50:58Z

The coordinator must remain active through terminal lane handoffs; a topic checkpoint is not a
completion condition. The four topics continue concurrently, with serialization only inside each
topic:

| Lane | Live action |
| --- | --- |
| docs | S2 resumed on original Codex thread `019ffcc9-16c2-…` after coordinator provisioned exact immutable EIS-Chat input `5191de83` at `/home/codex/repos/eis-chat-007-input` |
| internals | #1653 fresh IMPL-EVAL running in Opus 5/high session `430d5f91-a073-…`, bridge `session_01NFwTgbof8vAYdg9wex15fM`, source `2d5e4f5ae` |
| fixes | T-1 bounded MSSQL regression repair resumed on original Codex thread `019ffcca-8be0-…`; slice 6 and its singleton lease remain pending |
| features | #1651 IMPL-EVAL ended conditional `PASS` at `0e302ad3a`; owner comment `5300440887` now holds merge/readiness pending a fresh delegated RFC-0003 duplicate/overlap audit |

Neither formal evaluator consumes the global expensive-gate mutex. At `2026-08-15T04:02:33Z`,
fixes T-1 passed Tier-A at `ebad68c80`; a clean `aspire ps`/Docker/central-state preflight then
granted the one `scaffold.runtime`/Aspire/Docker lease to #1654. No other expensive gate may start
until that isolated pass is terminal and its mandatory cleanup is verified.

### Active completion checkpoint — 2026-08-15T05:06:31Z

| Lane | Current serial action | Hard boundary |
| --- | --- | --- |
| docs | Rewrite #1551 comments `5265826161` and `5265971722` in place from authoritative EIS-Chat `5191de83`; the comments predate the route improvements already contained in that pin | Preserve original Codex thread; `834a2b36` is evidence-only, no invented newer product head, appended follow-up, ready flip, merge, or false PLAN-EVAL shortcut |
| internals | #1653 merged as `473e8d75b`; next serial leaf `quality-scan-root-coverage` (#1542) is dispatched for harness bootstrap/research/plan | Preserve the Opus 5/high topic supervisor; no concurrent `openhands-dispatch-claim-and-refusal` leaf inside this topic |
| fixes | #1654 runtime head `0b2cf5e7c` is under independent Tier-A review after 89/0/0 terminal PASS and exact cleanup | Shared expensive lease is complete; no IMPL-EVAL before the coordinator receives the Tier-A terminal checkpoint |
| features | Owner decision hold for #1651 after RFC 0003/#1490 overlap audit | Keep draft; no amendment, reply, resolution, readiness, or merge before explicit option 1/2/3 verdict |

Coordinator transport remains GPT-5.6-SOL/high, never max. The resumed Claude controller PIDs may
change after an unattended-process interruption, but their session IDs, branches, worktrees, and
Remote Control bridges remain authoritative and must not be replaced. Continue supervising useful
work in the other topics while #1651 waits; the owner hold is lane-local, not a cluster stop.

### Active completion checkpoint — 2026-08-15T05:52:01Z

| Lane | Current serial action | Hard boundary |
| --- | --- | --- |
| docs | #1652 formal cycle 1 is `FAIL_FIX`; original author thread repairs F1–F5, then fresh Tier-A | No cycle 2, ready flip, merge, or expensive gate before a new coordinator grant |
| internals | #1656 PLAN-EVAL cycle 1 is `PASS`; original author thread implements the approved three-file plan | Carry changed-file and denominator-boundary advisories; stop before IMPL-EVAL |
| fixes | #1654 shipped as `da574111a`; #1358 is the next serial leaf and is implementing | Stop before `fresh-browser` and request the singleton expensive-gate lease |
| features | #1651 is draft and owner-blocked on explicit option 1/2/3 | Do not amend, reply, resolve, ready, or merge before the verdict |

Main post-merge CI, Pages, and code quality are green. Aspire and Docker are empty, and no expensive
lease is held. Formal evaluator serialization is independent per topic; only resource-heavy
Aspire/Docker/E2E uses the cluster-wide mutex.

### Active completion checkpoint — 2026-08-15T06:07:53Z

| Lane | Current serial action | Hard boundary |
| --- | --- | --- |
| docs | #1652 repair Tier-A `PASS` at `c7ce58a19`; dispatching fresh IMPL-EVAL cycle 2 | One fresh Opus 5/medium evaluator only; no repair, readiness, merge, or next leaf inside the evaluation session |
| internals | #1656 S1 Tier-A requested one drift-only JSON field-name record at `dbbedde34` | Same author thread, F1 only, then supervisor sign-off; do not start S2 yet |
| fixes | #1657 one `fresh-browser` lease running at `4a3c40321` | Playwright/Chromium only; durable receipt and exact process/Aspire/Docker cleanup before Tier-A |
| features | #1651 remains draft and owner-blocked on explicit option 1/2/3 | Do not amend, reply, resolve, ready, or merge before the verdict |

All checked PR heads equal their remote refs and current workflows have no failures. The singleton
runtime mutex is held only by #1657 until its browser receipt and cleanup are terminal.

### Active completion checkpoint — 2026-08-15T06:19:11Z

| Lane | Current serial action | Hard boundary |
| --- | --- | --- |
| docs | #1652 fresh IMPL-EVAL cycle 2 working against `c7ce58a19` in session `4ed649d5-…` | Wait for one terminal verdict; a further failure escalates and does not begin another loop |
| internals | #1656 S2 author is finishing receipts after local evidence head `a7e9ee0d5` | No central completion claim, push assumption, or IMPL-EVAL before the author stops and Tier-A signs off |
| fixes | #1657 browser gate is terminal PASS at evidence head `c792327c9`; substantive Tier-A is running | No IMPL-EVAL, ready flip, merge, issue mutation, or next fixes leaf before the Tier-A verdict |
| features | #1651 remains draft and owner-blocked on explicit option 1/2/3 | Do not amend, reply, resolve, ready, or merge before the verdict |

The singleton expensive-gate mutex is free: Aspire is empty, Docker has no containers or volumes,
and the browser gate left no Chromium/Playwright survivors. Topic serialization remains local to
each orchestrator; these three active gates run concurrently without cross-topic waiting.
