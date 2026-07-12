# Agentic OpenRouter lane repair

Harness run `fix-agentic-openrouter-lanes--codex` completed on 2026-07-12.

- PLAN-EVAL: separate Claude Opus 4.8 session `PASS` before implementation.
- Implementation: Codex profile/effort/identity/exit fixes; real isolated Claude/OpenRouter GLM
  launch/resume; observed Codex namespace incompatibility; exhaustive static preset canaries with
  explicit live opt-in and CI coverage.
- Live acceptance: checked-in Claude wrapper completed a GLM 5.2 Bash `pwd` turn with non-empty
  `GLM_RUNTIME_ADAPTER_OK`; evidence is credential-redacted in the run directory.
- Gates: 239 tests passed; scoped check/lint/fmt covered 105 files with zero findings; all four
  presets passed the credential-free static canary; `deno.lock` unchanged.
- IMPL-EVAL: separate Claude Opus 4.8 session `PASS`; no provider credit spent by the evaluator.
- Delivery: PR #696 targets `main` independently of design umbrella PR #685.
