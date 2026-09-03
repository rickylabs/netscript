# IMPL-EVAL final delta: SDK cache restoration + explicit read-only inventory

Bounded integration review of `4092014cfbf02f208dd16e320b35734d7b6b92f6` →
`6e9bb276cdb7039ff62b01fb540c0f7afbc4e42c` ("fix(release): retain SDK cache and explicit
read-only inventory"). Both prior evaluations (`evaluate.md`, `evaluate-cache-delta.md`) are
preserved; neither is carried forward as an evaluation of this head.

Evaluator (same resumed independent session, separate from generator): session
`0039d1ad-72eb-4047-964c-8b326ff65902`, Claude Code + OpenRouter, model `z-ai/glm-5.3-flash`
(max IMPL-EVAL preset), 2026-09-03. Read-only local review of this delta only; no broad sweeps,
runtime, Docker/Aspire lifecycle, GitHub writes, PLAN-EVAL, or publication.

## Contract applied (owner-ratified, not reopened)

Downloaded dependency caches are permitted alongside Docker images; NuGet packages are **SDK
dependencies, not generated AppHost/application state** — this corrects the first evaluation's
conflation of the NuGet cache restore with cold-start intent. Still required: no prior
application runs/state, unchanged README commands, exact owned cleanup, fail-closed baseline.

## Product delta (2 source files)

1. `.github/workflows/e2e-cli-prod.yml`: restores the pinned `Restore pinned Aspire NuGet package
   cache` step (`actions/cache@v4`, `path: ~/.nuget/packages`,
   `key: nuget-aspire-${{ runner.os }}-13.5.3-v1`) after `.NET` setup, before the Aspire CLI tool
   install — a dependency-cache position, identical to the original pre-`832e53720` step. Updates
   the baseline comment to "Downloaded SDK packages and images are allowed; no prior application
   runs or state". Replaces the container count source `docker ps -aq` with
   `docker container ls --all --quiet`. Four-field jq predicate, `test ! -e`, `set -euo pipefail`,
   ordering, conditions, upload list: unchanged.
2. `.llm/tools/release/release-canary-workflow_test.ts`: the cold-state regression now **requires**
   `path: ~/.nuget/packages` + the exact pinned key before the README step and **rejects**
   `path: ~/.aspire` ("generated AppHost state must stay fresh") in place of the former blanket
   `actions/cache@` absence assertion. All other assertions unchanged (no `deno task e2e:cli run`
   before README, no global CLI install/init smoke before README, four-field predicate, five
   `--argjson` fields, baseline JSON uploaded).

## Verification commands and results (run by this evaluator at head `6e9bb276c`)

| # | Command | Result |
| - | ------- | ------ |
| 1 | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all .llm/tools/release/release-canary-workflow_test.ts .github/scripts/aspire-nuget-cache-policy.test.ts .llm/tools/agentic/teardown/forbidden-commands_test.ts` | exit 0 — **11 passed / 0 failed** (8 workflow + 2 NuGet policy + 1 forbidden-commands; matches claimed GREEN 11/0) |
| 2 | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --file .llm/tools/release/release-canary-workflow_test.ts` | exit 0 — 1 file / 1 batch / 0 diagnostics |
| 3 | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --file .llm/tools/release/release-canary-workflow_test.ts --file .github/scripts/aspire-nuget-cache-policy.test.ts` | exit 0 — 2 files, 0 findings |
| 4 | `git diff --check 4092014cf..6e9bb276c` | clean (no whitespace errors) |
| 5 | YAML parse of `e2e-cli-prod.yml` (@std/yaml) | 18 steps; **exactly 1** cache step (`~/.nuget/packages`); container line is `docker container ls --all --quiet \| wc -l`; four-field predicate intact |

**RED consistency (static, from the diff — matches worklog's 8/3):** at `4092014cf` the revised
regression fails (required `path: ~/.nuget/packages` absent), `aspire-nuget-cache-policy.test.ts`
fails (cache/action/path/key counts 0 ≠ 1 for `e2e-cli-prod.yml`), and
`forbidden-commands_test.ts` fails (the baseline contained the guarded phrase `docker ps -aq`).
The delta resolves all three without touching any guard.

## Correctness judgment

- **Policy boundary drawn exactly where the ruling puts it.** The restored cache is a downloaded
  SDK dependency cache (NuGet packages), positioned as such; the regression simultaneously forbids
  caching `~/.aspire`, so the SDK-vs-generated-application-state line is enforced in both
  directions. `aspire-nuget-cache-policy.test.ts` additionally pins exactly one cache step per
  workflow, so a future `~/.aspire` cache would break the count as well — redundant cross-guard,
  by design.
- **Container inventory substitution is semantics-preserving and not weakened.**
  `docker container ls --all --quiet` enumerates all container IDs including stopped — identical
  set to `docker ps -aq` — and remains read-only. Had the swap dropped `--all`, stopped containers
  would have been under-counted; it did not. The forbidden-commands guard still passes repo-wide
  (test 1), so no other guarded bulk-teardown phrase exists at this head.
- **Cold application-state contract intact.** Baseline still gates `appHosts`, `containers`,
  `volumes`, `networks` to zero with `jq -e`, images diagnostic-only, fresh-project `test ! -e`,
  README still the first runtime before global CLI install and every other scaffold, cleanup and
  uploads unchanged. No source runtime change, no version change, no guard disabled.
- **CI failure reconciliation.** Worklog records CI 33757937139 = 5266 pass / exactly 2 fail —
  the same two policy intersections verified above; both are resolved by this delta. Hosted run
  33760126265 passed the cache-permitting baseline and is executing the unchanged README but is
  **not yet a completed runtime verdict** — correctly claimed as pending, coordinator-owned, not
  rerun or claimed here.

## Findings (all non-blocking)

1. **Observation:** the worklog's RED/GREEN claims (8/3 → 11/0) are fully reconciled by static
   diff analysis plus the 11/0 rerun; no claim needed independent re-execution of RED.
2. **Observation:** runtime verification remains incomplete by design (hosted run still
   executing); this evaluation makes no cold-runtime claim — only that the workflow now expresses
   the ratified policy and its regression suite enforces it.

## Verdict

**PASS_IMPL** — the delta correctly restores the pinned SDK dependency cache, keeps the
application-state gate and cold ordering intact, satisfies both previously failing policy tests
without weakening any guard, and its regression now enforces the owner-ratified
SDK-cache-yes / generated-application-state-no boundary.
