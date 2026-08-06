use harness

## SKILL

- Read root `AGENTS.md` completely.
- Use `netscript-harness`, `netscript-pr`, and `netscript-tools`.
- This is a harness/tooling/configuration slice for issue #1331.
- Follow draft-PR-on-start, run-artifact, slice-review, and evaluator-separation rules.

## Mission

Keep `minimax/minimax-m3` as the canonical formal PLAN-EVAL default and make
`qwen/qwen3.8-max` the canonical formal IMPL-EVAL default across the NetScript harness, agentic
tooling, skills, generated mirrors, provider presets, guards, tests, and documentation. Remove
active Qwen 3.7 IMPL-EVAL bindings; retain the old id only in explicit rejection/migration fixtures
where necessary.

## Owner decisions

- Formal PLAN-EVAL default: OpenRouter `minimax/minimax-m3`.
- Formal IMPL-EVAL default: OpenRouter `qwen/qwen3.8-max`.
- Implementation agent: Codex GPT-5.6 Sol low, bypass permissions.
- Claude subscription is exhausted until Saturday. Do not dispatch an Anthropic-plan reviewer.
- Formal PLAN-EVAL is a separate OpenRouter Minimax M3 session; formal IMPL-EVAL is a separate
  OpenRouter Qwen 3.8 session.
- Ordinary adversarial review temporarily uses owner-authorized OpenRouter Kimi K3 or Grok 4.5.

## First turn — hard stop at planning

1. Re-baseline issue #1331 against current `origin/main` and search every 3.7 reference.
2. Bootstrap all required tracked run artifacts, including `supervisor.md`, `research.md`,
   `plan.md`, `worklog.md`, `context-pack.md`, and `drift.md`.
3. Record the owner-authorized routing overrides and exact launch identity.
4. Make the first commit containing the run bootstrap, push the branch, and open a draft PR with
   the repository template, labels, milestone 0.0.5, and `Closes #1331`.
5. Finish `research.md` and a concrete test/generation-aware `plan.md`.
6. Stop before implementation and report `READY_FOR_PLAN_EVAL` with the draft PR URL.

Do not edit implementation/configuration/model files before PLAN-EVAL passes.

## Required implementation scope after PLAN-EVAL

- Central model IDs and approved-open-model allowlist.
- Canonical routing policy and provider/preset resolution.
- Runtime guards, canaries, rollout fixtures, and tests.
- Harness workflow/evaluator docs and relevant skills.
- Canonically generated Claude/consumer skill mirrors.
- Volatile-value/hardcoded-model validation.
- Exact search audit for remaining 3.7 references.

## Gates

- Focused tests for every changed routing/config module.
- Agentic suite check and routing-policy tests.
- Generated-surface synchronization checks.
- `deno task quality:gate` if package/plugin publishable code is touched.
- Bounded live provider canaries for exact `minimax/minimax-m3` and `qwen/qwen3.8-max` phase
  defaults.
- Separate-session formal PLAN-EVAL on Minimax M3 and IMPL-EVAL on Qwen 3.8.
- Tier-A substantive slice review before sign-off.

Never self-certify, merge, or publish. The milestone orchestrator retains merge authority.
