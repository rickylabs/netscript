# Supervisor identity — release 0.0.7

| Field | Value |
| --- | --- |
| Profile | `milestone-cluster` |
| Run id | `release-0.0.7--orchestration` |
| Coordinator | `codex-root-0.0.7` |
| Coordinator worktree | `/home/codex/repos/netscript-547-lffix` |
| Control branch | `chore/release-0.0.7-orchestration` |
| Harness | `.llm/runs/release-0.0.7--orchestration` (`milestone-cluster`) |
| Baseline `main` | `01e0960494c95ce56eb35892c211a095eb13e6ed` |
| Target milestone | GitHub milestone `0.0.7` (`#27`) |
| Started | `2026-08-13T18:35:10.000Z` |
| Coordinator runtime | Codex via ChatGPT subscription; current app session on WSL |
| PLAN-EVAL session | Claude `2439b19d-5df7-4920-9fce-fa5831ec4fdf`; opposite family |
| PLAN-EVAL cycle | 2 of 2: `APPROVED` at plan head `331f7c664` |

The coordinator is the sole merge authority. Exactly four topic orchestrators will own the
`docs`, `internals`, `fixes`, and `features` lanes after Step 0 validates. The release captain and
writer lease remain inactive until every committed issue is terminal and exact-`main` gates pass.

| Lane | Orchestrator id | Active issues | Capacity |
| --- | --- | ---: | --- |
| docs | `topic-docs-0.0.7` | 1 | two implementers + one evaluator |
| internals | `topic-internals-0.0.7` | 16 | two implementers + one evaluator |
| fixes | `topic-fixes-0.0.7` | 26 | two implementers + one evaluator |
| features | `topic-features-0.0.7` | 17 | two implementers + one evaluator |

Read-only watchers are `milestone-main-watcher-0.0.7` and `milestone-ci-watcher-0.0.7`; both carry
`mutationAuthority:false`. The first evaluation was mistakenly routed to Claude Opus/high instead
of the canonical Fable/medium plan-evaluator route. The family separation was valid, but the route
deviation is recorded. Fable completed the cycle-2 evidence pass but hit its monthly spend limit;
the same conversation used the recorded Opus fallback for final synthesis and approved dispatch.

Quota at the checkpoint: Codex primary window had 77% remaining (weekly reset 2026-08-20 05:31
Europe/Zurich); Claude Max showed 6% all-model weekly remaining and 2% Fable weekly remaining
(reset 2026-08-15 00:00), with its current-session window resetting 2026-08-13 23:10. Implementation
therefore routes through WSL Codex; Claude is reserved for the bounded opposite-family re-review.

At dispatch, all four topic-control sessions use the documented Codex Sol/high route fallback
because native Claude capacity is insufficient for four persistent orchestrators. Their clean
control worktrees are `/home/codex/repos/netscript-007-{docs,internals,fixes,features}` at exact
`main` `01e096049`; thread identities and steering commands are recorded after launch.

| Lane | Topic thread | Worktree | Same-thread steering |
| --- | --- | --- | --- |
| docs | `019ffcc0-e19b-71d1-95ce-8c72559eb026` | `/home/codex/repos/netscript-007-docs` | `codex exec resume 019ffcc0-e19b-71d1-95ce-8c72559eb026 -- "<follow-up>"` |
| internals | `019ffcc0-e1b5-74f0-96eb-cdeb298d6b17` | `/home/codex/repos/netscript-007-internals` | `codex exec resume 019ffcc0-e1b5-74f0-96eb-cdeb298d6b17 -- "<follow-up>"` |
| fixes | `019ffcc0-e1ae-7b70-b3b8-8804ebd6f773` | `/home/codex/repos/netscript-007-fixes` | `codex exec resume 019ffcc0-e1ae-7b70-b3b8-8804ebd6f773 -- "<follow-up>"` |
| features | `019ffcc0-e1d2-7850-a308-354b670c6f3d` | `/home/codex/repos/netscript-007-features` | `codex exec resume 019ffcc0-e1d2-7850-a308-354b670c6f3d -- "<follow-up>"` |

All four sessions were launched attached through `agentic:launch-codex-slice`; live status reports
one working Sol/high agent at each exact worktree and no route or worktree ownership collision.

Owner visibility invariant: every 0.0.7 session assigned a Claude supervisor/orchestrator role must
run with native Claude `/remote-control`. Attachment is proven only by the native session registry
matching PID and cwd and exposing a non-empty `bridgeSessionId`; custom-endpoint/OpenRouter Claude
sessions do not satisfy this invariant. The four active topic controls above are Codex daemon lanes,
so they use the corresponding daemon/thread visibility proof instead.

The user-visible native Claude milestone control surface was attachment-proved with `/remote-control` at
`https://claude.ai/code/session_016HFNiTigGUb7ieFxqFDvJb`: PID `2163112`, cwd
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
formal evaluators; existing Codex sessions may continue research, implementation already backed by
a valid plan gate, and artifact-only housekeeping.

The docs topic then attempted three automatic S1 resumes from the advisory #1652 result despite the
formal hold. The coordinator interrupted each leaf turn, stopped the dedicated docs topic process
group and watcher, removed the uncommitted/untracked S1 patch with `apply_patch`, and verified the
leaf worktree exactly clean at pushed plan head `d35cbca30`. The docs lane remains intentionally
offline until the Saturday gate; the other three Codex topic controls are unaffected.

The fixes topic later attempted a DeepSeek/OpenRouter IMPL-EVAL for #1643. The coordinator stopped
that process before verdict, removed its temporary transport artifact, amended the evaluator brief
to require a fresh native Claude/Fable gate after reset, and stopped the fixes topic control to
prevent automatic relaunch. #1643's substantive Codex implementation and Tier-A review remain
valid at pushed head `e6ba15ec6`; #1654 remains plan-only at `14d8b38b4`.

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

The owner-authorized cost override selects the lowest-cost reliable native Claude supervision
route: Claude Sonnet 5 at low effort. This is an explicit override of the older Opus/high planning
default, not a silent fallback. Every replacement uses the same preserved topic branch/worktree,
native Remote Control, and launcher evidence; implementation remains delegated to WSL Codex.

| Lane | Preserved Codex topic thread | Pre-transition state | Claude requested route | Worktree / branch | Replacement identity |
| --- | --- | --- | --- | --- | --- |
| docs | `019ffcc0-e19b-71d1-95ce-8c72559eb026` | absent/offline; park recorded | native Claude · Sonnet 5 · low | `/home/codex/repos/netscript-007-docs` / `orchestrator/release-0.0.7-docs` | pending attachment proof |
| internals | `019ffcc0-e1b5-74f0-96eb-cdeb298d6b17` | stalled over 24h; park required | native Claude · Sonnet 5 · low | `/home/codex/repos/netscript-007-internals` / `orchestrator/release-0.0.7-internals` | pending attachment proof |
| fixes | `019ffcc0-e1ae-7b70-b3b8-8804ebd6f773` | stalled over 25h; park required | native Claude · Sonnet 5 · low | `/home/codex/repos/netscript-007-fixes` / `orchestrator/release-0.0.7-fixes` | pending attachment proof |
| features | `019ffcc0-e1d2-7850-a308-354b670c6f3d` | stalled over 24h; park required | native Claude · Sonnet 5 · low | `/home/codex/repos/netscript-007-features` / `orchestrator/release-0.0.7-features` | pending attachment proof |

No replacement is considered active until the previous controller is durably parked and the new
process has a Claude session ID, non-empty `bridgeSessionId`, PID, exact cwd, process-argv
model/effort evidence, and owner-visible Remote Control URL/state. Blank or inherited model settings
are forbidden; the installed user default is Opus/high, so the agentic launcher must pass the
selected model and effort explicitly.

### Corrected evaluator matrix

The six formal gates remain independently required: the recheck found no prior formal verdict that
can satisfy them. What is deduplicated is broad shared review and model cost, not independent
phase evidence. Each gate still uses a fresh session separate from its Codex generator and is
serialized under the one-evaluator cluster limit. Native Claude Sonnet 5 is the owner-authorized
opposite-family route: low for the two mechanical gates, medium for the four substantive gates.
Fable is not pre-dispatched; it may be considered only after a concrete Sonnet capability failure,
with a new coordinator amendment proving why the same evidence contract cannot be met efficiently.
The exact assignments and rationales live in `briefs/reset-gates/dispatch.json`.
