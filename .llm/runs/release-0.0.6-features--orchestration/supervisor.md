# Supervisor — NetScript 0.0.6 runtime / public-surface lane

| Field            | Value                                                                          |
| ---------------- | ------------------------------------------------------------------------------ |
| Run id           | `release-0.0.6-features--orchestration`                                        |
| Profile          | `.llm/harness/workflow/milestone-run.md` (topical lane, not the whole milestone) |
| Role skill       | `.agents/skills/agent-milestone-orchestrator`                                  |
| Supervisor model | Claude · Anthropic · Opus 5 · high (`planning_decisions`)                      |
| Session surface  | Claude Code, native, mobile-visible via `/rc`                                  |
| Host             | WSL2 Linux 6.18.33.2-microsoft-standard-WSL2                                   |
| Checkout         | `/home/codex/repos/netscript-006-features`                                     |
| Control branch   | `chore/release-0.0.6-features-orchestration`                                   |
| Baseline         | `origin/main@01aa12b67`                                                        |
| Milestone        | GitHub milestone 26, `0.0.6`                                                   |
| Opened           | 2026-08-12                                                                     |

## Scope — exclusive ownership

This is a **topical lane**, not the whole 0.0.6 milestone. Sibling orchestration lanes run in
parallel checkouts (`netscript-006-docs`, `netscript-006-fixes`, `netscript-006-internals`). This
lane owns exactly two issues and takes no others:

| Order | Issue  | Title                                                                             | Shape                              |
| ----- | ------ | --------------------------------------------------------------------------------- | ---------------------------------- |
| 1     | #1405  | durable producer settles two inaccurate rejection reasons                          | small, specified, deterministic    |
| 2     | #1398  | job executions are never published to the durable job stream                       | substantive public/runtime behavior |

PR #1522 is unrelated and has been removed from the milestone — out of scope here.
#1398 builds on merged #1395 (versioned SSE/OTEL envelope) and #1402 (durable producer reconnect)
but is **not** satisfied by them; it stays its own reviewable PR with live E2E evidence.

## Control-branch contract

The control branch stores **orchestration evidence only** — this run dir and nothing else. It never
becomes an implementation umbrella. Both issues land through normal fresh leaf worktrees/branches
with draft PRs opened **directly against `main`**.

## Lane bindings

Routes selected from `.llm/harness/workflow/lane-policy.md`. Deviations are recorded in `drift.md`.

| Purpose                                | Route                                                                  |
| -------------------------------------- | ---------------------------------------------------------------------- |
| Orchestration (`planning_decisions`)    | Claude · Opus 5 · high — this session                                  |
| Research / plan sub-agents             | Claude · Opus 5 · medium/high (owner brief override — see D-1)         |
| Implementation #1405                   | Codex · GPT-5.6 Sol · **low** (`light_implementation`), mobile-visible |
| Implementation #1398                   | Codex · GPT-5.6 Sol · **medium** (`normal_implementation`), escalate to high only on genuine complexity |
| Slice review of #1405 (Sol·low pair)   | `review_codex_light`: Claude · Opus 5 · high — this session            |
| Slice review of #1398 (Sol·med pair)   | `review_codex`: Claude · Fable 5 · low                                 |
| PLAN-EVAL (#1398 only)                 | `formal_plan_evaluation` — MiniMax M3 high, fresh session              |
| IMPL-EVAL #1405 (small)                | `formal_impl_evaluation` small — DeepSeek V4 Flash 0731 max            |
| IMPL-EVAL #1398 (broad/complex)        | `formal_impl_evaluation` complex — Qwen 3.8 Max                        |
| CI / minor green-up watcher            | Codex · GPT-5.6 Sol · low                                              |

**Evaluator transport.** The owner brief routes evaluation through OpenHands *after #1524
passes/lands*; otherwise a fresh local Claude/OpenCode OpenRouter session using the toolchain.
Checked 2026-08-12: **PR #1524 is OPEN and unmerged** (`mergedAt: null`), with its own DoD boxes
`Bounded live DeepSeek smoke` and `Repository default variable is updated` still unticked. Therefore
this run uses the **local fresh-session fallback** for every evaluation until #1524 lands. Re-check
before each eval dispatch and record the observed state.

Generator and evaluator never share a session. No implementation lane self-certifies.

## PLAN-EVAL decision

- **#1405** — `PLAN-EVAL: N/A`. Owner brief authorizes it; the issue carries a complete contract
  (exact call sites, exact acceptance, reasons-only change with no accepted/rejected/delivered
  behaviour change). Per lane-policy owner decision 2026-08-08, small/mechanical issues with a
  complete contract record N/A.
- **#1398** — PLAN-EVAL **required**, separate session, before implementation. It changes public
  runtime behaviour and a published record shape.
- **Wave plan itself** — this lane is two sequential PRs, not a multi-wave board. Per
  `milestone-run.md` the wave-plan PLAN-EVAL is `[asserted]`, not observed; recorded decision:
  **no separate PLAN-EVAL for the two-PR sequencing plan**, because the #1398 PLAN-EVAL covers the
  only decision-heavy content in it. Recorded here rather than assumed.

## IMPL-EVAL decision

- **#1405** — owner brief permits an IMPL-EVAL waiver *provided exact negative tests exist*. Default
  is still to run the small IMPL-EVAL lane; the waiver is only exercised if the evaluator transport
  is genuinely blocked, and then recorded in `drift.md` with the passing negative-test evidence.
- **#1398** — IMPL-EVAL mandatory, separate session, with live runtime evidence attached.

## Merge authority

This orchestrator holds merge authority for both PRs and merges only through the `milestone-run.md`
pre-merge gate, recorded per PR in `worklog.md` and appended to `cut-trace.md`. Root orchestration
owns the canary and the stable cut; this lane does not publish.

## Environment proof (stage A)

- `git rev-parse --abbrev-ref HEAD` → `chore/release-0.0.6-features-orchestration`
- `git rev-parse --short HEAD` → `01aa12b67`, clean tree
- `git fetch origin main` → `origin/main@01aa12b67` (identical; lane starts at tip)
- `deno task agentic:runtime doctor` → `no_change (schema 1.0)`, components 18, **sessions 0**
  (no pre-existing Codex sessions to collide with)
