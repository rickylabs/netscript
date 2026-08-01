# Drift Log: scaffold runtime npm dependencies

## 2026-08-01 — Reproduction prerequisites and cache masking

- **What:** The carried brief's literal reproduction did not fail in one local attempt.
- **Source:** Published canary.5 CLI and Aspire runs under `/tmp/netscript-canary5-before-*`.
- **Expected:** `new` creates a project whose home immediately returns 500 for missing TanStack.
- **Actual:** Canary.5 exposes `init`, not `new`; a service app first failed for absent generated Zod files. After DB init/generate/seed, a warm local `node_modules` contained TanStack and both tested routes returned 200.
- **Severity:** significant
- **Action:** accept the prerequisite correction; preserve the production uploaded artifact as authoritative cold-install evidence; add deterministic structural regression coverage.
- **Evidence:** production run 30677734061; `.llm/tmp/canary5-prod-artifact/cli-e2e-prod-report.json`.

## 2026-08-01 — Formal evaluator tool compatibility

- **What:** The first formal Qwen PLAN-EVAL attempt failed after three reads because Claude Code
  exposed deferred tools unsupported by the non-Anthropic model.
- **Source:** evaluator session `679f1239-1950-4790-997a-872f0b6926b1`.
- **Expected:** The live provider canary passed and the evaluator could read all plan files.
- **Actual:** OpenRouter returned HTTP 400 for deferred custom tools.
- **Severity:** minor
- **Action:** retry the same mandated route with all evidence embedded and tools explicitly unused.
- **Evidence:** provider canary passed immediately before the failed evaluator launch.
