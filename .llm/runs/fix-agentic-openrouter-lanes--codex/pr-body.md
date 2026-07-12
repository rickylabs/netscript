## Summary

Repair the repo's OpenRouter agentic lanes: supported Codex profile handling and exit semantics, a proven GLM 5.2 route, and exhaustive preset canaries. This PR is independent of design umbrella PR #685 and targets `main` directly.

Do not merge until the Plan-Gate and final IMPL-EVAL pass are complete.

## Scope

- Archetype / area: internal CLI/tooling (Archetype 6)
- Source finding: `.llm/runs/dashboard-design--orchestrator/run-eval.md`, “GLM 5.2 capability test”

## Problem / Fix / Evidence

| Problem | Fix | Evidence |
| --- | --- | --- |
| Unsupported/missing Codex named profile setup | launcher-owned isolated Responses profile with explicit app-server effort | focused config/launcher tests and v0.144 handshake |
| GLM turns fail or return empty | isolated Claude/OpenRouter runtime lane; structured unsupported Codex namespace capability | redacted live transcript and provider canaries |
| Successful launch misreported as failure | v0.144 identity parsing and truthful child exit | parser/launcher tests |
| Presets can silently rot | exhaustive static canaries, explicit live opt-in, and CI wiring | provider-canary task/tests and rollout-runner tests |

## Slices

- [x] S1 Codex profile, identity, and exit semantics
- [x] S2 GLM lane viability and structured capabilities
- [x] S3 exhaustive preset canaries and final gates

## Definition of Done

- [x] A real GLM 5.2 agentic turn completes with non-empty output and redacted evidence.
- [x] Launcher materializes and uses the supported Responses-only named profile format.
- [x] Successful sends exit 0 and v0.144 thread identity is parsed when present.
- [x] Every OpenRouter preset has a cheap structured canary in the test surface.
- [x] Scoped check/lint/fmt and relevant tests pass without lock churn.
- [ ] Separate-session IMPL-EVAL returns PASS.

## Validation

- S1 focused suite — 89 passed, 0 failed.
- S1 scoped check/lint/fmt — 99 files, 0 findings.
- Volatile-config guard — 4 passed, 0 failed.
- v0.144 no-turn effort handshake — requested `low` over global `max`; observed `low` with complete identity.
- Full agentic suite after S2 — 235 passed, 0 failed.
- Claude GLM live tool canary — PASS; Codex GLM canary — structured unsupported (`codex-native-namespace-tool`).
- Checked-in Claude runtime wrapper — non-empty `GLM_RUNTIME_ADAPTER_OK` after Bash `pwd`.
- Default preset canary with credentials unset — all four presets validated; no provider process.
- Full agentic suite after S3 — 239 passed, 0 failed.
- Final scoped check/lint/fmt — 105 files, 0 findings; `deno.lock` unchanged.

## Harness

- Run dir: `.llm/runs/fix-agentic-openrouter-lanes--codex/`
- Phase: impl (all slices complete; IMPL-EVAL next)

## Drift / Debt

- Minor carried-in launcher-path drift recorded in `drift.md`; no accepted debt.
