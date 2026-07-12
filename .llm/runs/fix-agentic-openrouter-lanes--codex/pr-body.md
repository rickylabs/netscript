## Summary

Repair the repo's OpenRouter agentic lanes: supported Codex profile handling and exit semantics, a proven GLM 5.2 route, and exhaustive preset canaries. This PR is independent of design umbrella PR #685 and targets `main` directly.

Do not merge until the Plan-Gate and final IMPL-EVAL pass are complete.

## Scope

- Archetype / area: internal CLI/tooling (Archetype 6)
- Source finding: `.llm/runs/dashboard-design--orchestrator/run-eval.md`, “GLM 5.2 capability test”

## Problem / Fix / Evidence

| Problem | Planned fix | Evidence |
| --- | --- | --- |
| Unsupported/missing Codex named profile setup | launcher-owned isolated Responses profile | focused config/launcher tests |
| GLM turns fail or return empty | prove one bounded non-empty GLM turn; encode unsupported lanes | redacted live transcript |
| Successful launch misreported as failure | v0.144 identity parsing and truthful child exit | parser/launcher tests |
| Presets can silently rot | exhaustive static canaries, explicit live opt-in | provider-canary test/task |

## Slices

- [ ] S1 Codex profile, identity, and exit semantics
- [ ] S2 GLM lane viability and structured capabilities
- [ ] S3 exhaustive preset canaries and final gates

## Definition of Done

- [ ] A real GLM 5.2 agentic turn completes with non-empty output and redacted evidence.
- [ ] Launcher materializes and uses the supported Responses-only named profile format.
- [ ] Successful sends exit 0 and v0.144 thread identity is parsed when present.
- [ ] Every OpenRouter preset has a cheap structured canary in the test surface.
- [ ] Scoped check/lint/fmt and relevant tests pass without lock churn.
- [ ] Separate-session IMPL-EVAL returns PASS.

## Validation

- Not run yet; implementation is blocked on PLAN-EVAL.

## Harness

- Run dir: `.llm/runs/fix-agentic-openrouter-lanes--codex/`
- Phase: plan-eval

## Drift / Debt

- Minor carried-in launcher-path drift recorded in `drift.md`; no accepted debt.
