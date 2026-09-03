# IMPL-EVAL delta: owner-ratified image-cache correction

Proportional delta review only. The original `evaluate.md` (verdict PASS_IMPL on `832e53720`) is
preserved unchanged and is NOT carried forward as an evaluation of this head.

## Delta under review

- New head: `4092014cfbf02f208dd16e320b35734d7b6b92f6` ("fix(release): allow image caches and scope
  Docker prerequisites"); prior evaluated: `832e53720baf7a8d11e132d93582c48879a4628e`. Direct
  child; worktree clean except this run dir's evaluator artifacts.
- Product delta (3 files): workflow baseline predicate; the regression test that pins it; root
  README prerequisite prose. Run-dir `plan.md`/`worklog.md` record the owner ruling.
- Evaluator (same resumed independent session, separate from generator): session
  `0039d1ad-72eb-4047-964c-8b326ff65902`, Claude Code + OpenRouter, model `z-ai/glm-5.3-flash`
  (max IMPL-EVAL preset), 2026-09-03. Read-only local review; no GitHub writes, commit, push,
  runtime, or Docker/Aspire lifecycle.

## Contract applied (owner-ratified, not reevaluated)

Blanket no-image-cache requirement superseded: normal Docker image caches are supported; Docker is
required only by configurations using container resources. Still required: fresh
application/project state, no manual recovery, unchanged README commands, exact owned cleanup,
preserve foreign resources. Judgment below is correctness under that contract — no empty-image
rule applied.

## Verification commands and results

| # | Command | Result |
| - | ------- | ------ |
| 1 | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all .llm/tools/release/release-canary-workflow_test.ts` | exit 0 — **8 passed / 0 failed** |
| 2 | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --file .llm/tools/release/release-canary-workflow_test.ts` | exit 0 — 1 file / 1 batch / **0 diagnostics** |
| 3 | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --file .llm/tools/release/release-canary-workflow_test.ts` | exit 0 — 1 file, 0 findings |
| 4 | `deno eval --no-config --no-lock '…@std/yaml…'` parse of `e2e-cli-prod.yml` | YAML parses; 17 steps; baseline gate lines now `jq -e '[.appHosts, .containers, .volumes, .networks] \| all(. == 0)'` + unchanged `test ! -e .llm/tmp/cli-e2e/my-app` |
| 5 | Amended test body (verbatim, assert shim) run against the `832e53720` workflow in `.llm/tmp/eval-red-check/` | **RED reproduced** — FAIL: `string does not include "[.appHosts, .containers, .volumes, .networks] \| all(. == 0)"` (matches worklog's recorded 7/1) |
| 6 | Same probe against current head `4092014cf` | **GREEN** — 1 passed / 0 failed |
| 7 | `deno run --no-lock --allow-read .llm/tools/validation/check-readme-standard.ts --pretty` | 1/36 non-conformant — `packages/bench/README.md` missing `## Install`; file untouched by this delta (see Obs 2) |

## Delta correctness under the ratified contract

- **Predicate scoped correctly.** The readiness gate now asserts exactly the four application-state
  fields (`appHosts`, `containers`, `volumes`, `networks`) and drops `images` from the gate while
  still collecting it (`--argjson images` retained, `images: $images` retained in the JSON,
  upload unchanged) — diagnostic-only, per the ruling. Fail-closed semantics fully preserved:
  `set -euo pipefail` + per-count `$(…)` assignments abort before JSON construction; any nonzero
  (or missing/null) gated field makes `all(. == 0)` false → `jq -e` exit 1 → step fails, nothing
  deleted. Fresh-project assertion `test ! -e .llm/tmp/cli-e2e/my-app` unchanged.
- **Test pins the new policy both ways.** Renamed to "starts with fresh application state and
  permits image caches"; positively requires the four-field predicate before the README step and
  rejects the old blanket `jq -e 'all(.[]; . == 0)'` form. All five `--argjson` fields still
  required, so the diagnostic cannot silently disappear. The retained `actions/cache@` absence
  assertion remains correct scoping: the ruling supersedes the image clause, not the removed
  Aspire **NuGet** cache restore.
- **README prose matches the ruling; commands untouched.** The only README delta is the
  prerequisite paragraph: Docker needed for this walkthrough's containerized Postgres/cache
  configuration, not universal to NetScript/Aspire; existing image caches supported and need not
  be cleared. The `readme-quickstart` command block is byte-identical (delta shows no command
  change).
- **No collateral change.** Workflow diff is 4 lines (predicate + two comment lines); no cache
  restore reintroduced, no image prune, no resource deletion, no version change, no daemon/Docker
  setup, no suite suppression. Ordering (baseline → README → global install → other scaffolds) and
  all step conditions are unchanged from the previously evaluated head.

## Findings (severity-ranked; all non-blocking)

1. **Observation (pre-existing, out of delta):** root `README.md` has one `deno fmt` rewrap finding
   at line 16 ("…same unified API. Aspire brings") — byte-identical at both heads, so not
   introduced here; root Markdown is outside the repo's fmt gate surface (`fmt:check` covers
   `packages/`+`plugins/` ts/tsx). The author's format-gate claim (1/1/0) was correctly scoped to
   the ts file.
2. **Observation (pre-existing, out of delta):** `docs:readme:check` reports 1/36
   non-conformant — `packages/bench/README.md` missing `## Install`. Unrelated file, untouched by
   this delta; root README passes the standard.
3. **Observation (test nit):** the "cached images must not gate readiness" absence check matches
   the old predicate's exact string including its `jq -e` wrapper; a differently formulated
   blanket predicate could evade it. The positive four-field assertion is the real pin, so this is
   informational only.

Not verified here (coordinator-owned, per scope): CI, the hosted rehearsal, and the real
exact-published-version runtime. The worklog's recorded rehearsal on run 33756743492 (old
predicate stopped on 6 preloaded images; all four application-state counts zero) is consistent
with this amendment's motivation and is accepted as recorded evidence, not independently rerun.

## Verdict

**PASS_IMPL** — the delta correctly implements the owner-ratified cache policy with fail-closed
fresh-application-state semantics intact, the regression test rejects the prior policy and pins
the new one, README commands are unchanged, and no unrelated source or cleanup behavior moved.
