# Drift Log: scaffold TypeScript project boundaries (#1016)

## 2026-08-01 — Vite failure occurs on SSR request

- **What:** Starting `deno task dev` reaches Vite's ready state on baseline; requesting `/` triggers the upward-config failure.
- **Source:** Clean-room reproduction under `.llm/tmp/issue-1016-before-parent/repro-before`.
- **Expected:** The brief summarized the dev server as failing.
- **Actual:** Process startup succeeds; first SSR module evaluation fails with the same unresolved parent `extends`.
- **Severity:** minor
- **Action:** fix
- **Evidence:** Vite log: `Error when evaluating SSR module fresh:server_entry: failed to resolve "extends":"astro/tsconfigs/strict"` for `SidebarToggle.tsx`.

## 2026-08-01 — Local formal evaluator credential unavailable

- **What:** The policy-bound local Claude/OpenRouter Qwen evaluator could not launch.
- **Source:** `deno task agentic:provider-canary --live --profile claude-openrouter --model qwen/qwen3.7-max --effort high --worktree /home/codex/repos/fix-1016`.
- **Expected:** A separate local open-model PLAN-EVAL session.
- **Actual:** Exit 4, `status: blocked`, `credential: absent`, diagnostic `auth_required`.
- **Severity:** significant
- **Action:** resolved by owner waiver
- **Evidence:** Owner instruction on 2026-08-01 assigns PLAN-EVAL and IMPL-EVAL for the 0.0.3 fix train to a separate Opus 5 supervisor session. `plan-eval.md` records PASS; no further Qwen/OpenRouter probe is permitted or required.

## 2026-08-01 — Runtime gate blocked at Aspire certificate trust

- **What:** The required one-pass `scaffold.runtime` suite failed before database initialization.
- **Source:** `.llm/tmp/cli-e2e/plugin-smoke-20260801-214030.log`.
- **Expected:** Full runtime gate PASS.
- **Actual:** 16 gates passed; `database.init` timed out after 286424ms because Aspire could not establish certificate trust (`certutil` unavailable); cleanup passed. No tsconfig lookup error occurred.
- **Severity:** significant
- **Action:** defer rerun to an Aspire-capable evaluator/CI host; do not broaden #1016 into environment repair
- **Evidence:** Suite exit 1, `passed=16 failed=1`; failure stderr and Aspire log paths are captured in the JSONL gate log.
