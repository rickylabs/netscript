# Supervisor Identity — plan-fable5-remediation-roadmap--seed

Written at run start per `workflow/lane-policy.md` § Supervisor identity. A run dir without this
file is not activated. Other supervisors cross-peek a run by reading this file — it is how a run's
operating identity is discoverable without chat memory.

| Field | Value |
| --- | --- |
| Model | Claude Fable 5 (`claude-fable-5`), effort **high** (owner override, see below) |
| Session | Native Claude Code session, Anthropic subscription, permission mode `bypassPermissions`, native Remote Control **enabled** |
| Host | WSL2 (Linux 6.18.33.2-microsoft-standard-WSL2), user `codex` |
| Checkout | `/home/codex/repos/netscript-fable5-remediation-plan` (dedicated worktree for this run) |
| Worktree | `/home/codex/repos/netscript-fable5-remediation-plan` |
| Branch | `plan/fable5-remediation-roadmap` |
| Baseline | `origin/main` @ `fac9e339042c5394bf882311657d8981d353a1c3` (2026-08-08; verified `HEAD == origin/main` at run start) |
| Run ID | `plan-fable5-remediation-roadmap--seed` |

## Run shape

Planning-only **seed run** (`workflow/seed-run.md`), profile `SCOPE-docs`. Deliverable is a draft
long-range remediation roadmap under
`.llm/runs/plan-fable5-remediation-roadmap--seed/fable-5-remediation-plan/` — master plan,
milestone train, per-milestone issue drafts, RFC drafts, amendments, Wave-7 proposal, and
implementation handoff. **Drafts only:** zero GitHub board mutation (no issue/epic/milestone/
label/comment writes). The run's own branch, commits, draft PR, PR body/comments, and PR CI labels
are the only writable GitHub surface. Owner ratifies filing later (stage H is out of scope for this
run by owner direction).

## Routes in force

| Task lane | Provider / model / effort | Role in this run |
| --- | --- | --- |
| `planning_decisions` (orchestrator, Tier A) | Claude · Anthropic · Fable 5 · **high** | Sole supervisor: research direction, synthesis, plan lock, all commits |
| `claude_workflow` (Tier C/B research fan-out) | Claude · Anthropic · **Opus 5** subagents via Claude Workflows | Parallel research + synthesis contributors only — never evaluators, never committers; supervisor reviews and commits their output |
| `formal_plan_evaluation` (PLAN-EVAL) | — | **WAIVED by owner** for this run (see overrides) |
| `formal_impl_evaluation` (IMPL-EVAL) | — | **WAIVED by owner** for this run (see overrides) |
| Stage F adversarial reviewer | — | Not launched; owner will personally review the plan and decide whether later adversarial passes or board filing are needed |

Reference `.llm/harness/workflow/lane-policy.md`; the table above records only this run's
assignments.

## Recorded lane/eval overrides (owner directives, run charter 2026-08-08)

1. **Orchestrator effort low → high.** The owner explicitly overrides the repository's default
   `planning_decisions` effort (Fable 5 · low) to **high** because this is a long-range
   meta-framework roadmap. Mirrored in `drift.md` (D-1).
2. **PLAN-EVAL waived.** The owner explicitly waives the formal PLAN-EVAL pass for this
   research/planning run. No evaluator session is launched; the seed-run stage G hard stop is
   replaced by owner personal review after handoff. Mirrored in `drift.md` (D-2) and `worklog.md`.
3. **IMPL-EVAL waived.** The owner explicitly waives IMPL-EVAL (there is no implementation in this
   run; the waiver covers the run's docs/artifact output). Mirrored in `drift.md` (D-2) and
   `worklog.md`.
4. **Workflow subagent model.** Claude Workflows run with **Opus 5** subagents (owner directive)
   rather than the `claude_workflow` lane default (Opus 4.8 · low). They are research contributors,
   not evaluators; identities, assignments, and outputs are recorded in the run artifacts.
   Mirrored in `drift.md` (D-3).
5. **No board mutation / no filing.** Stage H (ratify + file) is explicitly out of scope; the run
   finishes at stage E/I artifacts (plan lock + handoff) with drafts only.

## Generator ≠ evaluator status

The two hard invariants are honored as follows: no lane self-certifies **as a pass** — the
supervisor substantively reviews every workflow/subagent output before committing it; and the
generator-session ≠ evaluator-session invariant is not exercised because both formal evaluator
passes are owner-waived (recorded above and in `drift.md`). No substitute evaluator is launched.
