# Supervisor Identity — plan-deploy-plugin--seed

Written at run start per `workflow/lane-policy.md` § Supervisor identity. A run dir without this
file is not activated. Other supervisors cross-peek a run by reading this file — it is how a run's
operating identity is discoverable without chat memory.

| Field | Value |
| --- | --- |
| Model | Claude Fable 5 (`claude-fable-5`), effort **xhigh** (kickoff-directed) |
| Session | background job `948c0e39` — https://claude.ai/code/session_01EWs7xBg7oNqCCkxipVM5HR |
| Host | WSL2 (Linux 6.18.33.2-microsoft-standard-WSL2), user `codex` |
| Checkout | /home/codex/repos/netscript-547-lffix |
| Worktree | /home/codex/repos/wt-deploy-plugin-seed |
| Branch | `plan/deploy-plugin` |
| Baseline | `290c68ef` (origin/main, 2026-07-18) |
| Run ID | `plan-deploy-plugin--seed` |

## Run shape

Modified **seed run** (planning-only, drafts-only). This session is the **generator stage only** of
a supervisor-defined three-stage pipeline (see `kickoff.md`):

1. **Generator (this session)** — full seed corpus: `research.md`, `plan.md`,
   `design/canonical/*` (architecture, migration map, contribution matrix, scaffold stories),
   worklog, drift. Ends with `STAGE-COMPLETE: generator` in `worklog.md`, then stops.
2. **Adversarial (supervisor-dispatched)** — GPT-5.6 Sol · xhigh, constructive/collaborative
   enhancement pass.
3. **Doc-driven story (supervisor-dispatched)** — Kimi K3 pass forecasting public documentation to
   make API/DX concrete.

Generator is resumed afterward to integrate findings. Downstream stages are **never** dispatched
from this session (kickoff stop-line: no self-arranged evals/stages).

## Routes in force

| Task lane | Provider / model / effort | Role in this run |
| --- | --- | --- |
| `planning_decisions` (orchestrator) | Claude · Anthropic · Fable 5 · **xhigh** | Seed generator: synthesis + all canonical design authoring |
| `chore_code` / research fan-out | Claude · Anthropic · Opus 4.8 (sub-agents) | Read-only evidence gathering (prior-run corpus, auth anatomy, deploy inventory, doctrine, board parity, provider APIs) |
| Stage-2 adversarial | Codex · OpenAI · GPT-5.6 Sol · xhigh | Supervisor-dispatched, not this session |
| Stage-3 doc story | Kimi K3 | Supervisor-dispatched, not this session |
| `formal_evaluation` (PLAN-EVAL) | open-model lane per `lane-policy.md` | Deferred; supervisor triggers after stages 2–3 integrate |

Reference `.llm/harness/workflow/lane-policy.md`; the complete route table is not copied here.

## Recorded lane/eval overrides

- **Orchestrator effort xhigh** (default is Fable · low): owner-directed via `kickoff.md` for this
  planning-heavy run.
- **No draft PR at stage A**: kickoff stop-line "no GitHub issues, PRs, labels, or milestones may
  be created or changed by this run" overrides `workflow/seed-run.md` stage A. The commit trail is
  the pushed branch `plan/deploy-plugin` (explicit refspec pushes). Mirrored in `drift.md` D-1.
- **Fable not used for sub-agent swarms** (owner directive 2026-07-11): research fan-out runs on
  Opus 4.8.
- **Stage F/G (adversarial, PLAN-EVAL) replaced** by the kickoff's supervisor-dispatched Sol-xhigh
  + Kimi-K3 pipeline; the formal PLAN-EVAL remains a later supervisor decision. Mirrored in
  `drift.md` D-2.
