# OpenHands Summary — Wave 4 · 4c sagas IMPL-EVAL (PR #20)

**Evaluators**: OpenHands agent session (Qwen-3.7-Max), separate from generator per harness protocol § Evaluator
**Run**: `feat-package-quality-wave4-runtimes--4c-sagas`
**PR**: #20 — [Wave 4 · 4c] sagas — package quality

## Summary

Conducted IMPL-EVAL for PR #20 following `.agents/skills/netscript-harness/SKILL.md` § Evaluator protocol. Evaluated 27 implementation slices (14 core + 13 plugin) across both `plugin-sagas-core` (A3 Runtime/Behavior) and `plugin-sagas` (A5 Plugin) packages. **Full E2E CLI suite executed per trigger request.**

## Verdict (Final)

**`FAIL_FIX`** — plan remains valid; 1 required gate has residual findings.

### Blocking Finding

`deno doc --lint packages/plugin-sagas-core/mod.ts` (independent evaluator run) produced **2 `private-type-ref` errors** — both trace to `SagaCorrelation` being missing from the public type closure in `src/public/mod.ts`:

1. `SagaBuilder["correlate"]` references private type `SagaCorrelation`
2. `SagaCorrelationRule` references private type `SagaCorrelation`

This contradicts the generator's C14 worklog claim of `private-type-ref-count=0`. Likely cause: the generator ran per-entrypoint lint but did not merge `builders/mod.ts` → `define-saga.ts` into the public-barrel doc-lint graph. The committed state at `85ee9c0` (HEAD) misses this export.

### Required Fix (1-line)

Add `SagaCorrelation,` to the domain type list in `packages/plugin-sagas-core/src/public/mod.ts`. Satisfies plan § 5 F-7 strategy ("First-party `@netscript/*` → Explicit type re-export through barrel"). No code change required.

After fix, rerun IMPL-EVAL and target PASS.

## Passing Gates

| Gate | Evidence |
|------|----------|
| **Type Check (core, 19 entrypoints)** | `deno check --unstable-kv`: exit 0 |
| **Publish Dry-Run (core)** | `deno publish --dry-run --allow-dirty`: exit 0 |
| **Unit Tests (core)** | `deno task test`: 17/17 passed (concurrency, idempotency, scheduler, store, testing helpers) |
| **F-1 File-Size (core)** | `redis-transport.ts` and `list-transport.ts` split into transport + commands modules |
| **Type Check (plugin, 12 entrypoints)** | `deno check --unstable-kv`: exit 0 |
| **Doc-Lint (plugin)** | `deno doc --lint` all 12 entrypoints: 0 errors per `slice-p13-doc-lint-report.json` |
| **Publish Dry-Run (plugin)** | `deno publish --dry-run --allow-dirty`: exit 0, slow-type-count=1 |
| **Lint & Format (plugin)** | `deno lint`: 54 files clean; `deno fmt --check`: 61 files clean |
| **Integration Tests (plugin)** | `deno task test`: 5/5 passed (manifest, CLI, aspire, E2E gates, public surface) |
| **F-1 File-Size (plugin)** | `v1.ts` 715 → split into handlers (265) + helpers (255) + types (343) + barrel (15) |
| **README (plugin)** | 205 lines (≥150 threshold); doctested examples present |
| **Test Layer Upgrade (plugin)** | 0 → 5 tests (manifest, CLI, aspire, E2E gates, public surface) |
| **Public Surface Lock (both)** | 19 + 12 entrypoints retained; no unplanned additions |

### E2E CLI Suite (Requested)

| Total | Passed | Failed |
|-------|--------|--------|
| 10 | 9 | 1 (pre-existing) |

**Failed gate**: `database.init` — aspire `--resources` argument forwarding issue. Pre-existing, outside Wave 4c sagas scope. Non-blocking for this PR.

**Passing gates**: `preflight`, `scaffold.runtime`, `scaffold.http`

## Changes Made

None to source code (per evaluator protocol, did not fix implementation).

**Evaluator artifacts written**:
- `.llm/tmp/run/feat-package-quality-wave4-runtimes--4c-sagas/evaluate.md` (FAIL_FIX verdict with gate evidence)
- `.llm/tmp/openhands/summary.md` (this file, updated from PLAN-EVAL)

**Required generator fix** (to follow): add `SagaCorrelation,` to `packages/plugin-sagas-core/src/public/mod.ts` line 29.

## Validation

| Command | Result |
|---------|--------|
| `deno doc --lint packages/plugin-sagas-core/mod.ts` | ❌ FAIL (2 `private-type-ref` errors on `SagaCorrelation`) |
| `deno check --unstable-kv packages/plugin-sagas-core/mod.ts` | ✅ PASS |
| `deno test --unstable-kv --allow-all` (plugin-sagas-core) | ✅ PASS (17/17) |
| `deno doc --lint packages/plugin-sagas/mod.ts` (plugin) | ✅ PASS (0 errors per `slice-p13-doc-lint-report.json`) |
| `deno test --unstable-kv --allow-all` (plugin-sagas) | ✅ PASS (5/5) |
| Full E2E CLI suite (`deno task e2e:cli full`) | ✅ 9/10 gates passing; 1 pre-existing `database.init` failure |

## Remaining Risks

1. **Generator worklog vs. committed-state discrepancy** — C14 worklog claims clean doc-lint; evaluator sees 2 errors. Post-fix, generator should re-measure with full-merge `deno doc --lint mod.ts`, not per-EP runs.
2. **Pre-existing E2E `database.init` failure** — Outside Wave 4c scope. Track separately.
3. **Global `deno task check` failures** — Pre-existing `isolatedDeclarations` errors in `packages/fresh-ui`, `packages/fresh`, `packages/telemetry`. Not sagas-related; deferred to Wave 6 CLI/CI setup.

## Next Steps

1. Generator applies the 1-line fix (`SagaCorrelation` export closure)
2. Re-run `deno doc --lint packages/plugin-sagas-core/mod.ts` to confirm clean
3. Re-run IMPL-EVAL for PASS verdict (2nd cycle — generator has 1 FAIL_FIX chance before escalation)
4. Merge to umbrella on PASS
