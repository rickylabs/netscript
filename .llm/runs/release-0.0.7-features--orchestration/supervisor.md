# Supervisor — NetScript 0.0.7 features lane

| Field | Value |
| --- | --- |
| Run id | `release-0.0.7-features--orchestration` |
| Profile | `.llm/harness/workflow/milestone-run.md` (topic lane) |
| Topic orchestrator | `topic-features-0.0.7` |
| Active controller (from 2026-08-15 reset) | native Claude Opus 5 · high · Remote Control |
| Superseded controller (parked, preserved) | Codex · OpenAI · GPT-5.6 Sol · high, thread `019ffcc0-e1d2-7850-a308-354b670c6f3d` |
| Checkout | `/home/codex/repos/netscript-007-features` |
| Control branch | `orchestrator/release-0.0.7-features` (no upstream) |
| Immutable dispatch base | `01e0960494c95ce56eb35892c211a095eb13e6ed` |
| Approved plan head | `331f7c664` |
| Coordinator control head at dispatch | `5330285f65242eff639cfc5c7ed68a80740de910` |
| Merge/release authority | coordinator only (`codex-root-0.0.7`) |

## Exclusive scope

This lane owns only #1293, #1348, #1349, #1352, #1354, #1355, #1360, #1451, #1452, #1455,
#1458, #1466, #1467, #1502, #1590, #1591, and #1592. The control branch records orchestration
evidence only; content lands through fresh leaf PRs targeting `main`.

## Wave 0

- `rfc-a-stage0-ratification-board` (#1348) is a coordinator checkpoint. It receives no leaf PR and
  remains open until the coordinator verifies all implementation children.
- `rfc-plugin-cli-contribution` (#1502) is the sole implementation leaf. It delivers an RFC and a
  proposed later implementation epic, not the CLI seam itself.

## Lane bindings and ceilings

| Purpose | Route / constraint |
| --- | --- |
| #1502 research, plan, and RFC authoring | Codex · OpenAI · GPT-5.6 Sol · high (`complex_implementation`) |
| #1502 PLAN-EVAL | fresh native opposite-family Claude · Fable 5 · medium; bounded and mandatory |
| Codex slice review | Claude · Fable 5 · medium (`review_codex_complex`), plus topic Tier-A substantive review |
| #1502 IMPL-EVAL | fresh native opposite-family Claude · Fable 5 · medium; mandatory |
| WIP | at most two implementers and one evaluator in this topic; Wave 0 uses one implementer |
| Expensive gate | global singleton; #1502 must not start `scaffold.runtime` and has no approved need for it |

Generator and evaluators must be different sessions. The topic orchestrator does not merge,
publish, change milestone scope, or mutate the central cluster state.

## Controller reset — 2026-08-15 Europe/Zurich

The owner reset at `2026-08-15T00:00:00+02:00` replaces the Codex topic controller with a native
Claude Opus 5 Remote Control supervisor. The historical Codex thread is preserved and parked; it is
never resumed as a topic controller. Contract:
`/home/codex/repos/netscript-547-lffix/.llm/runs/release-0.0.7--orchestration/briefs/topic-claude-reset-common.md`.

| Field | Value |
| --- | --- |
| Claude session id | `19621a0b-c6a0-47c6-b826-93c1634a6875` |
| Bridge session id | `session_01LQBHX8KpA5aYtDraq46J8a` (non-empty) |
| Remote Control URL | `https://claude.ai/code/session_01LQBHX8KpA5aYtDraq46J8a` |
| Remote Control label / state | `netscript-007-features`; attached (registry PID + cwd + bridge id) |
| PID | `2430404` |
| Exact cwd | `/home/codex/repos/netscript-007-features` |
| Claude CLI | `2.1.233` at `/home/codex/.local/share/claude/versions/2.1.233` |
| Requested route | native Claude Opus 5 · high · Remote Control |
| Observed route | process argv `--model claude-opus-5 --effort high --permission-mode bypassPermissions --remote-control netscript-007-features` |
| Route verdict | matched |
| Parked Codex thread | `019ffcc0-e1d2-7850-a308-354b670c6f3d`; last record `task_complete` / `TOPIC_CONTROLLER_PARKED` at `2026-08-14T22:18:38Z` |

Reset-era authority is unchanged and narrower than the pre-reset lane table above: supervise only,
no implementation in this worktree, no merge, publish, ready-flip, relabel, issue close, milestone
change, central cluster-state mutation, or release-writer lease. Formal evaluators are fresh
separate sessions on the exact route in `briefs/reset-gates/dispatch.json`; one evaluator globally
at a time; Fable 5 requires a coordinator amendment. The pre-reset lane table's Fable bindings for
#1502 PLAN-EVAL / IMPL-EVAL are superseded by that dispatch file.

### Owner verdict — 2026-08-15 keep-and-narrow for #1651

The owner selected option 1. The coordinator's authoritative checkpoint is
`eb46e33fb6493ce6ef5350f7abd6e4da51854577` on `chore/release-0.0.7-orchestration` (clean, pushed);
its cluster state moves features from `blocked` to `implementing`. The owner-overlap hold on PR #1651
is **released**.

| Field | Value |
| --- | --- |
| Authority | owner verdict via coordinator `codex-root-0.0.7`, checkpoint `eb46e33fb` |
| Disposition | keep the distinct plugin CLI RFC; narrow C6 only |
| Author | preserved original Codex thread `019ffcc5-d3e1-7c13-9815-e9956ec43683` — resumed, never replaced |
| Leaf worktree | `/home/codex/repos/netscript-007-features-1502` |
| Dispatch head | local = remote = PR head `0e302ad3a5915b7a820adcac0a9d5bdc2d7d0019` |
| Brief | `slices/impl-1502-amendment.md` (8-point bounded contract) |
| PLAN-EVAL | **not authorized and not required** — the owner resolved the sole design choice |
| Gates | the six contracted gates rerun at the amended content head |
| Review | fresh opposite-family Tier-A by this supervisor, over the exact amendment vs RFC 0003 / #1490 |
| Final gate | exactly one fresh separate native Claude Opus 5 · **medium** · Remote Control IMPL-EVAL, bounded |
| Loop policy | no open-ended loop; a substantive `FAIL` returns **once** to the same author; editorial notes need coordinator authorization for another formal cycle |

Withheld from this lane and unchanged: reply to or resolution of owner comment `5300440887`, ticking
#1502, ready-flip, relabel, merge, publish, and starting the next features leaf. PR #1651 stays
**draft** at `status:impl`.

### Amendment closed — 2026-08-15 terminal `PASS`

| Field | Value |
| --- | --- |
| Content head | `67e12f02165089ec7431b72d1294147477906282` |
| Evidence head | `d45a92ba70e78cc1ff42617ca15f6782f4ea8c21` |
| Verdict head | `ec69100c89195adb776c4cef3724c8c3683c553c` — local = remote = PR |
| Tier-A | `ACCEPTED_WITH_FINDINGS`; AF-1 (dead SHA in body) closed by a body-only correction |
| IMPL-EVAL | terminal `PASS`, no substantive findings, two editorial notes |
| Evaluator | session `e8cd9765-9f6c-4418-bbc2-4a24f221f2d4`, bridge `cse_01Cwg2ukqsMkwpuca5xhzVaG`, PID `375750`, native Opus 5 · medium · Remote Control, requested = observed |
| PR comment | `https://github.com/rickylabs/netscript/pull/1651#issuecomment-5301336480` |
| PR state | open **draft**, exactly one `status:impl`, 0 review threads |

Nothing is running in this lane. Every gate it owes is closed. The ready-flip, the reply to or
resolution of owner comment `5300440887`, ticking #1502, merge, publish, and the next features leaf
all remain withheld and belong to `codex-root-0.0.7`.
