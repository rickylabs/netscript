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

## 2026-08-01 — Cold topology explains local 200 versus CI 500

- **What:** Reproduced the production failure and isolated the generated import map as the causal
  difference.
- **Source:** Exact `scaffold.runtime --source jsr --cli jsr:@netscript/cli@0.0.2-canary.5`
  topology under `.llm/tmp/cli-e2e`, with `DENO_DIR=/tmp/netscript-deno-cold-before-1007`.
- **Expected:** Determine whether repository nesting/root installs or the app catalog controls
  Vite-visible dependency installation.
- **Actual:** Root dependencies downloaded into the cold Deno cache, but the canary app's own
  `node_modules/.deno` lacked TanStack Preact Query and the exact app-home probe returned HTTP 500.
  A copy made without any `node_modules`, with only the four generated imports added and a second
  empty DENO_DIR, installed `@tanstack+preact-query@5.101.4`; the identical probe returned HTTP 200
  with 130,356 bytes of HTML.
- **Severity:** significant
- **Action:** fix confirmed; retain the catalog change and treat the earlier `/tmp` 200 as a warm
  generated-app false pass, not contradictory root-cause evidence.
- **Evidence:** `.llm/tmp/canary5-cold-repro.ndjson`; cold workspaces
  `plugin-smoke-20260801-040212` and `cold-after-manual-1007` (ephemeral, untracked).

## 2026-08-01 — SDK runtime subset is also required

- **What:** The first full runtime gate exposed incompatible `@tanstack/db` 0.6.16/0.6.17 types.
- **Source:** `.llm/tmp/cli-e2e/plugin-smoke-20260801-040631.log`, `generated.deno-check`.
- **Expected:** The Fresh runtime subset alone would make the generated workspace self-contained.
- **Actual:** SDK runtime dependencies also need app-level pins; without them the generated graph can resolve duplicate incompatible minors.
- **Severity:** significant
- **Action:** rescope within issue #1007 to derive SDK runtime dependencies from its existing `package.json` contract and enforce them in the same drift test.
- **Evidence:** full gate passed 20 steps and failed only generated type-check at the duplicate TanStack DB boundary.

## 2026-08-01 — Query DB collection range admitted an incompatible minor

- **What:** App-level SDK pins alone did not unify TanStack DB types.
- **Source:** `deno why` in the generated workspace after gate attempts 1 and 2.
- **Expected:** Direct scaffold imports would converge the SDK dependency graph.
- **Actual:** `@tanstack/query-db-collection@1.1.0` depends on DB 0.6.16 while current Fresh/SDK packages depend on DB 0.6.17.
- **Severity:** significant
- **Action:** use `deps:latest` stable-channel authority and align the root/SDK/scaffold range to `^1.2.1`, whose inspected graph uses DB 0.6.17.
- **Evidence:** `deps:latest --filter @tanstack/query-db-collection`; `deno info npm:@tanstack/query-db-collection@1.2.1`.

## 2026-08-01 — Local fixed-port collision masked the final runtime verdict

- **What:** The full suite twice failed only `behavior.service-health` after all dependency-sensitive gates passed.
- **Source:** Default `scaffold.runtime` runs `plugin-smoke-20260801-041634` and `plugin-smoke-20260801-042859`.
- **Expected:** Generated users service owns the scaffold's hardcoded port 3001.
- **Actual:** Windows `Get-NetTCPConnection` identified port 3001 as owned by out-of-scope `products.exe` PID 10700. The untruncated JSON response came from that service and referenced its stopped database at `127.0.0.1:50564`. The suite does not wait for `users`, so the bind failure surfaced only at the later probe.
- **Severity:** environmental
- **Action:** Do not terminate the unrelated process. Temporarily change only the local E2E fixture port to 13001, run the required one-pass command, then restore the source file before committing.
- **Evidence:** Isolated-port run passed all 62 gates, including `generated.deno-check`, `behavior.service-health`, and `behavior.app-home`; final branch has no E2E port change.
