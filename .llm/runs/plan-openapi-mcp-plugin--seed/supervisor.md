# Supervisor Identity — plan-openapi-mcp-plugin--seed

Written at run start per `workflow/lane-policy.md` § Supervisor identity.

| Field | Value |
| --- | --- |
| Model | Claude Fable 5 (`claude-fable-5`), effort medium |
| Session | https://claude.ai/code/session_01ENni2Z21cDmBuphNfyUJix |
| Host | WSL2 (Linux 6.18.33.2-microsoft-standard-WSL2), user `codex` |
| Checkout | `/home/codex/repos/plan-openapi-mcp` |
| Worktree | same as checkout (dedicated clone for this run) |
| Branch | `plan/openapi-mcp-plugin` |
| Baseline | `a8a129feb` (== `origin/main`, 2026-08-03) |
| Run ID | `plan-openapi-mcp-plugin--seed` |

## Routes in force

| Task lane | Provider / model / effort | Role in this run |
| --- | --- | --- |
| Seed generator (this session) | Anthropic / Claude Fable 5 / medium | Discovery, synthesis, canonical design, worked examples, RFC draft — drafts only |
| Research fan-out sub-agents | Anthropic / session-inherited (Explore + general-purpose) | Read-only repo exploration, GitHub issue/PR corpus, upstream prior-art verification feeding `research.md` |
| Adversarial pass (stage 2) | OpenAI / Codex GPT-5.6 Sol / xhigh — **supervisor-dispatched, not by this session** | Attack the seed design; generator integrates legitimate findings |

Reference `.llm/harness/workflow/lane-policy.md`; do not copy its complete route table here.

## Recorded lane/eval overrides

- **No draft PR for this run** (deviation from `seed-run.md` stage A): the generator brief forbids
  opening the PR ("Do not open the PR"). Commit trail is direct commits on
  `plan/openapi-mcp-plugin`. Mirrored in `drift.md`.
- **Custom pipeline** (per generator brief): generator → Codex GPT-5.6 Sol xhigh adversarial →
  integration, dispatched by the human-side supervisor. This session does not self-arrange the
  adversarial pass and stops at `STAGE-COMPLETE: generator`.
- **No board filing, no implementation**: deliverable is the design + RFC draft under this run dir
  only. Tracking issue #1117 (milestone 0.0.5) already exists; no GitHub mutations from this
  session.
- **Shared machine constraint** (brief): no AppHost, no docker, no scaffold runs — runtime claims
  in the design are cited from source, not exercised live.
