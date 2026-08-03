# Context Pack: agent init tooling and docs bundles

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-1024-agent-tooling-bundle--agent-init` |
| Branch | `feat/1024-agent-tooling-bundle` |
| Current phase | `plan-eval` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `docs` |

## Current State

Research and design are complete. The branch was clean and is now rebased onto `origin/main` at
`e5bae2858`, which includes merged PR #1079's docs task router. No implementation file has been
created or changed. The canonical local Qwen canary was blocked by missing OpenRouter credentials;
the hard stop is now a separate OpenHands/Qwen PLAN-EVAL with the same tracked-verdict contract.

## Completed

- Read the full #1024/#1061 issue bodies (eleven unchecked acceptance criteria).
- Loaded harness, CLI, tools, PR, RTK, doctrine, JSR-audit, docs overlay, Archetype-6, lane-policy,
  plan-gate, and Claude-manager instructions.
- Inspected `agent init`, skill asset generation, all eight proposed tools, docs builder, current
  public surface, debt, and merged #1079.
- Ran baseline CLI doc lint (0 diagnostics) and focused agent-init tests (9/9).
- Locked a two-slice plan and Design checkpoint.

## In Progress

- Separate-session PLAN-EVAL through the OpenHands/Qwen fallback.

## Next Steps

1. Dispatch the formal OpenHands/OpenRouter Qwen evaluator with a PLAN-EVAL-only prompt.
2. Accept only the tracked `plan-eval.md` verdict after verifying its commit and scope.
3. Begin slice 1 only on `PASS`; repair the plan and re-evaluate on `FAIL_PLAN`.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Eight-tool manifest boundary | #1024 / plan D1 | Consumer tools only; no harness/release internals. |
| Clone-independent public-CLI E2E | plan D3/D4 | Local maintainer mode remains available in repo. |
| Optional `.netscript/docs` corpus | #1061 / plan D6 | No docs corpus without flag. |
| Release-built prose + install-time API docs | plan D7/D8 | Router included from #1079; exact package versions and subpaths generated locally. |
| Fail before docs writes | #1061 / plan D8 | Missing binary/mismatch cannot leave partial output. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/feat-1024-agent-tooling-bundle--agent-init/**` | new | Harness research, plan, design, context, supervisor identity, drift. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | baseline PASS | CLI doc lint 0; agent-init tests 9/9. |
| Fitness | plan pending | PLAN-EVAL not yet run. |
| Runtime | not run | implementation absent. |
| Consumer | baseline only | pre-change agent-init fixture passes. |

## Open Questions

- None must resolve before PLAN-EVAL; evaluator is asked to challenge exact-version evidence and
  consumer E2E independence.

## Drift and Debt

- Drift: baseline advanced to include merged #1079; current session route identity is opaque; the
  local evaluator canary lacked credentials, so formal evaluation uses the OpenHands Qwen fallback.
- Debt: no new/deepened debt expected or accepted.

## Commits

- See the draft PR's commit list + per-slice PR comments (V3 retired `commits.md`).
