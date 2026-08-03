# Supervisor Identity — plan-frontend-contrib--seed

Written at run start per `workflow/lane-policy.md` § Supervisor identity.

| Field | Value |
| --- | --- |
| Model | Claude Fable 5 (`claude-fable-5`), effort high |
| Session | background job `50b02c18` — https://claude.ai/code/session_015fc7SaneZJ9mzrAhRW4tma |
| Host | WSL2 (Linux 6.18.33.2-microsoft-standard-WSL2), user `codex` |
| Checkout | `/home/codex/repos/netscript` (main checkout) |
| Worktree | `/home/codex/repos/wt-frontend-contrib` |
| Branch | `plan/frontend-contrib` |
| Baseline | `290c68ef` (main, 2026-07-18) |
| Run ID | `plan-frontend-contrib--seed` |

## Routes in force

| Task lane | Provider / model / effort | Role in this run |
| --- | --- | --- |
| Seed generator (this session) | Anthropic / Claude Fable 5 / high | Discovery, synthesis, design docs, worked examples — drafts only |
| Research fan-out sub-agents | Anthropic / Claude Opus 4.8 (per `subagent-model-routing` memory: Fable prohibited for swarm use) | Read-only repo exploration feeding `research.md` |
| Adversarial pass (stage 2) | OpenAI / GPT-5.6 Sol / high — **supervisor-dispatched, not by this session** | Enhance/critique the seed design |
| Docs/API concretion (stage 3) | Moonshot / Kimi K3 — **supervisor-dispatched, not by this session** | Public-facing API + documentation story |

## Recorded lane/eval overrides

- **No draft PR for this run** (deviation from `seed-run.md` stage A): kickoff stop-line forbids
  creating PRs/issues/labels/milestones. Commit trail is direct commits on `plan/frontend-contrib`
  pushed with explicit refspec. Mirrored in `drift.md`.
- **Custom pipeline** (deviation from seed-run stages F/G/H): kickoff prescribes
  generator → Codex Sol adversarial → Kimi K3 docs pass, all dispatched by the human-side
  supervisor. This session does not self-arrange evals and stops at `STAGE-COMPLETE: generator`.
- **No board filing stage**: deliverable is design drafts, not GitHub issues. Stage H/I do not
  apply to this leg.
