# Evaluation: agent model routing and subscription expense policy revamp

> **Coordinator supersession notice (2026-09-04):** This historical cycle-2 `PASS` applies only to
> head `8740b16de` and the evaluator's then-approved scope. Subsequent owner dashboard evidence and
> the authenticated Go usage API disproved the expense-limit and workload-tier assumptions. The PR
> is not merge-ready; a bounded repair and new independent IMPL-EVAL are required. The historical
> verdict below is preserved rather than rewritten.

Fill this template during evaluation. Allowed result values: `PASS`, `FAIL`, `N/A`,
`PENDING_SCRIPT`, `DEBT_ACCEPTED`, `NOT_RUN`. Anti-pattern status values: `CLEAR`,
`VIOLATION`, `DEBT_ACCEPTED`, `N/A`.

## Metadata

| Field          | Value                                                                 |
| -------------- | --------------------------------------------------------------------- |
| Run ID         | `chore-revamp-agent-model-routing--model-matrix`                      |
| Target         | harness and agentic tooling; draft PR #1989                           |
| Archetype      | `6 - CLI / Tooling` (internal tooling, not a published Arch-6 package) |
| Scope overlays | docs                                                                  |
| Evaluator      | OpenCode / Grok 4.6 xhigh; 2026-09-04; exact head `8740b16de`         |

Exact head evaluated: `8740b16de5724e76124c8e42ad52d5a8de8a1be6` (local and `origin` PR #1989
agree). Baseline `a2d7f5f6f686115b5c31bab085692df6e1582aa7`. Generator is OpenAI-family; this
session is xAI-family and separate. Architecture IMPL-EVAL cycle 2 of max 3 (notify after 2).
Cycle 1 `FAIL_FIX` at `9f8ee61a6` is preserved in git history of this file.

Owner rulings retained: Astra (`gpt-6-astra`) remains active; paid-training participation is
allowed; live usage-endpoint fetchers are outside approved scope; two repo-test reds remain
environment classification (`noexec` `/ephemeral`).

## Process Verification

| Check                                  | Result | Evidence |
| -------------------------------------- | ------ | -------- |
| Plan-Gate passed before implementation | PASS   | `plan-eval.md` cycle 2 `PASS` at `372409ab6`; first production slice is S1 `605ae0e02` |
| Design section exists in worklog       | PASS   | `worklog.md` `## Design` |
| Commit slices match design plan        | PASS   | S1 `605ae0e02` → S2 `da80e6eec` → S3 `b2d3106f0` → S4 `e4bf9dd8c` → S5 `1f02dde27`; cycle-1 repair `8740b16de` |
| Each slice has a passing gate          | PASS   | S1–S5 gates plus independent cycle-2 focused check/test/fmt; five cycle-1 findings closed below |
| No speculative seams (unused files)    | PASS   | spawn seam is used by `runOpenCode` and its denial test |
| Constants used for finite vocabularies | PASS   | `WORKLOAD_TIERS`, `LOGICAL_MODEL_IDS`, `MODEL_TRANSPORT_PRIORITY`, `EXPENSE_PROVIDERS` |

## Cycle-1 finding closeout

| # | Cycle-1 finding | Result | Evidence |
| - | --------------- | ------ | -------- |
| 1 | Dispatchable Claude ids | PASS | `ROUTING_MODEL_IDS.fable51Native='claude-fable-5-1'`, `opus5Native='claude-opus-5'`; `delegation-matrix_test.ts` asserts `claude-fable-` / `claude-opus-` prefixes |
| 2 | Dated Ollama DeepSeek ids | PASS | `ollama-cloud/deepseek-v4-flash:0731` and `ollama-cloud/deepseek-v4-pro:0813`; tests require `:0731` / `:0813` suffixes |
| 3 | Denied expense cannot spawn OpenCode | PASS | `runOpenCode` injects `dependencies.spawn` after `preflightOpenCodeExpense`; test `denied paid-route expense decision prevents OpenCode process spawn` asserts `spawnCalls === 0` on `allowance_exhausted` |
| 4 | README resolver wording | PASS | `.llm/tools/agentic/README.md:640-642` names `resolveWorkloadRoute` / `resolveCoordinatorRoute`; no remaining `resolveCanonicalRoute` in `.llm/tools/agentic/**` |
| 5 | S4/S5 PR comments | PASS | PR #1989 comments 2026-09-04T15:33:54Z (`e4bf9dd8c`) and 15:33:55Z (`1f02dde27`); repair comment 15:35:52Z at `8740b16de` |

`MODEL_IDS.opus='opus-5'` remains a distinct canary/routing nickname, not the matrix dispatch slug.

## Static Gates

| Gate             | Command or check | Result | Evidence | Notes |
| ---------------- | ---------------- | ------ | -------- | ----- |
| Narrow typecheck | `run-deno-check.ts --root .llm/tools/agentic --ext ts` | PASS | 185 files, 2 batches, 0 diagnostics | Independent at `8740b16de` |
| Slice typecheck  | focused `run-deno-test.ts` on matrix/resolver/parity/run/expense/credential | PASS | 43 passed, 0 failed, 1141 ms | Independent |
| Format           | `run-deno-fmt.ts --file` on 4 repaired TS files | PASS | 4 processed, 0 findings | Independent |
| Lint             | structured wrapper / `deno lint` on `.llm/**` | N/A | `deno.json` `lint.exclude` includes `.llm/` | |
| Doc lint         | package `deno doc --lint` | N/A | no `packages/**` / `plugins/**` | |
| Publish dry-run  | `deno publish --dry-run` | N/A | internal tooling only | |
| Link/path check  | lane-policy markers + README | PASS | parity tests in the 43; README names live resolvers | |

## Fitness Gates

Package F-CLI / JSR / public-surface gates are `N/A` per the approved plan.

| Gate | Function                     | Result | Evidence | Violations |
| ---- | ---------------------------- | ------ | -------- | ---------- |
| F-1  | File-size lint               | PASS   | matrix 461 LOC; routing-policy 222 LOC | none |
| F-2  | Helper-reinvention scan      | N/A    | internal tooling | |
| F-3  | Layering check               | N/A    | no `packages/**` | |
| F-4  | Inheritance audit            | N/A    | | |
| F-5  | Public surface audit         | N/A    | | |
| F-6  | JSR publishability gate      | N/A    | | |
| F-7  | Doc-score gate               | N/A    | | |
| F-8  | Workspace `lib` override check | N/A  | | |
| F-9  | Permission declaration check | PASS   | `agentic:expense-watch` is `--allow-read` only | |
| F-10 | Test-shape audit             | PASS   | spawn-spy now observes the process boundary | |
| F-11 | Forbidden-folder lint        | N/A    | pre-existing agentic `lib/` | |
| F-12 | Naming-convention lint       | PASS   | finite vocabularies are const arrays | |
| F-13 | Saga and runtime invariants  | N/A    | | |
| F-14 | Console-log lint             | N/A    | CLI edges | |
| F-15 | Re-export-of-upstream lint   | N/A    | | |
| F-16 | Folder-cardinality lint      | N/A    | | |
| F-17 | Abstract-derived co-location lint | N/A | | |
| F-18 | Sub-barrel lint              | N/A    | | |
| F-19 | Scoped source gate runners   | PASS   | structured check/test/fmt used | |

## Runtime Gates

| Gate | Validation | Result | Evidence |
| ---- | ---------- | ------ | -------- |
| Matrix + family composition | owner cells, provider order, skip-same-family, coverage | PASS | focused matrix + routing-policy tests in the 43 |
| Legacy boundary | new selection with old lane fails closed | PASS | `resolveLegacyRouteForNewSelection('normal_implementation')` |
| Credential isolation | prefix loader, rival-key clear, mode-600, value-free errors | PASS | `provider-credential_test.ts` |
| Expense watcher | stale/unproven/exhausted/unresolved-tier fail closed | PASS | `subscription-expense_test.ts` |
| Spawn-denied proof | command-spawn spy | PASS | `opencode-run_test.ts` zero spawn on exhausted Go window |
| Live catalog / CLI slugs | cycle-1 catalog defects | PASS | Claude CLI ids + dated Ollama DeepSeek pinned |
| Repo tests (2 red) | environment vs product | PASS | cycle-1 classification retained: `noexec` `/ephemeral`; 31/31 under `TMPDIR=/tmp` |
| Release gates | cut / scaffold.runtime | N/A | not a release cut |

## Consumer Gates

| Consumer | Validation | Result | Evidence |
| -------- | ---------- | ------ | -------- |
| published package/plugin | none | N/A | no `packages/**` / `plugins/**` export changes |
| harness docs overlay | source alignment | PASS | generated workload/coordinator tables match typed matrix; README resolver wording current |

## Anti-Pattern Check

| AP    | Status | Evidence | Notes |
| ----- | ------ | -------- | ----- |
| AP-1  | CLEAR  | rewritten routing policy 222 LOC; matrix 461 LOC | |
| AP-2  | N/A    | | |
| AP-3  | N/A    | | |
| AP-4  | N/A    | | |
| AP-5  | N/A    | | |
| AP-6  | N/A    | | |
| AP-7  | N/A    | | |
| AP-8  | N/A    | | |
| AP-9  | N/A    | | |
| AP-10 | N/A    | | |
| AP-11 | CLEAR  | credential and spawn seams are injected | |
| AP-12 | N/A    | | |
| AP-13 | N/A    | CLI edges | |
| AP-14 | N/A    | | |
| AP-15 | CLEAR  | no `IFoo` / `FooT` | |
| AP-16 | N/A    | pre-existing agentic `lib/` | |
| AP-17 | N/A    | | |
| AP-18 | CLEAR  | semantic assertions | |
| AP-19 | N/A    | | |
| AP-20 | N/A    | | |
| AP-21 | N/A    | | |
| AP-22 | N/A    | | |
| AP-23 | N/A    | | |
| AP-24 | CLEAR  | typed catalog, not a vendor switch | |
| AP-25 | CLEAR  | `Deno.Command` / file IO at CLI edges | |

## Arch-Debt Delta

| Metric                | Count | Evidence |
| --------------------- | ----- | -------- |
| New entries           | 0     | none added |
| Resolved entries      | 0     | |
| Deepened violations   | 0     | |
| Unrecorded violations | 0     | cycle-1 catalog/proof gaps were repaired, not debt |

## Findings

| Severity | Finding | Evidence | Required action |
| -------- | ------- | -------- | --------------- |
| —        | none blocking | five cycle-1 items closed; independent 43/43 + 185-file check | none |

Out of scope (owner): Astra rollout timing; live usage-endpoint fetcher; Muse contributor training.

## Lessons for Promotion

| Lesson | Pattern | Applies to | Confidence |
| ------ | ------- | ---------- | ---------- |
| Capability catalog slugs must be the CLI/API ids | cycle-1 FAIL_FIX; repaired in `ROUTING_MODEL_IDS` | Arch 6 tooling / agentic routing | high |
| Named spawn-spy proofs need an injectable process seam | S3 preflight-only tests were insufficient | paid-route launchers | high |

## Verdict

| Field     | Value |
| --------- | ----- |
| Verdict   | `PASS` |
| Rationale | Approved scope is complete. Cycle-1 FAIL_FIX items are repaired and independently proven at exact head `8740b16de`: dispatchable Claude ids, dated Ollama DeepSeek ids, denied expense never spawns OpenCode, current README resolver wording, and S4/S5 PR comments. Focused check/test/fmt are green. No new doctrine debt. Owner rulings on Astra, paid training, usage fetchers, and noexec temp remain. |
