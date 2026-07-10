# Research — rickylabs-epic-574-wsl-agentic-runtime--supervisor

## Re-baseline

- Carried-in source: GitHub epic #574 and children #575-#582.
- Re-derived against `main` @ `f7898dba` on 2026-07-10.
- What changed vs the carried-in version:
  - The checked-in lane policy still names WSL Codex GPT-5.5-high; the owner-approved epic requires
    GPT-5.6 routing and assigns GPT-5.6 Sol high to foundation work.
  - The existing agentic suite already provides checked-in launch, status, watch, resume, OpenHands,
    GitHub token, and PR lifecycle tools.
  - Current Codex daemon status is managed and exposes a control socket, but reports CLI/managed
    Codex `0.144.1` with app-server `0.142.5`; #575/#580 must classify this version skew.
  - Issues #574-#582 were created without milestones despite the repository requirement that every
    open issue carry one.

## Findings

| # | Finding | How to verify |
| - | ------- | ------------- |
| 1 | #575 is the first dependency layer and blocks controller, routing, research, fallback, policy migration, and rollout work. | `gh issue view 574..582 --json body` |
| 2 | Source edits under `.llm/tools` require Tier-D daemon-attached Codex and a separate evaluator. | `.llm/harness/workflow/lane-policy.md` |
| 3 | No implementation may start before the child run has research, a locked plan, a Design checkpoint, and PLAN-EVAL PASS. | `.llm/harness/workflow/run-loop.md` |
| 4 | The checked-in launcher validates `use harness`, `## SKILL`, worktree branch/base, no upstream, and writes the thread artifact. | `.llm/tools/agentic/launch-codex-slice.ts` |
| 5 | Current daemon health is managed with a known socket and zero active app-server workers. | `deno task agentic:codex-status -- --pretty` |
| 6 | Native WSL ext4 worktrees are mandatory for full runtime gates. | `.agents/skills/codex-wsl-remote/SKILL.md` |
| 7 | GitHub authentication is available through the secret-safe durable resolver. | `deno task agentic:gh-token check` |

## jsr-audit surface scan

- N/A for the supervisor run: this epic coordinates agentic infrastructure and does not itself
  change a package or plugin publish surface. Child runs must assess their own surfaces.

## Open questions

- None block PR 0A planning. Version-skew repair semantics and Node installation method must be
  locked in the #575 child plan before its PLAN-EVAL.

