# Evaluation: agent model routing and subscription expense policy revamp

Fill this template during evaluation. Allowed result values: `PASS`, `FAIL`, `N/A`,
`PENDING_SCRIPT`, `DEBT_ACCEPTED`, `NOT_RUN`. Anti-pattern status values: `CLEAR`, `VIOLATION`,
`DEBT_ACCEPTED`, `N/A`.

## Metadata

| Field          | Value                                                                 |
| -------------- | --------------------------------------------------------------------- |
| Run ID         | `chore-revamp-agent-model-routing--model-matrix`                      |
| Target         | harness and agentic tooling; draft PR #1989                           |
| Archetype      | `6 - CLI / Tooling` (internal tooling, not a published Arch-6 package) |
| Scope overlays | docs                                                                  |
| Evaluator      | OpenCode Go / Grok 4.6 xhigh; 2026-09-04; exact head `9f8ee61a6`      |

Exact head evaluated: `9f8ee61a6d1ae443403ca74cedcae4a17c0225b8`. Baseline
`a2d7f5f6f686115b5c31bab085692df6e1582aa7`. Generator is OpenAI-family; this session is xAI-family
and separate. Architecture IMPL-EVAL round 1 of max 3 (notify after 2).

## Process Verification

| Check                                  | Result | Evidence |
| -------------------------------------- | ------ | -------- |
| Plan-Gate passed before implementation | PASS   | `plan-eval.md` cycle 2 `PASS` at `372409ab6`; first production slice is S1 `605ae0e02` |
| Design section exists in worklog       | PASS   | `worklog.md` `## Design` (surface, data flow, error contract, contributor path) |
| Commit slices match design plan        | PASS   | S1 `605ae0e02` → S2 `da80e6eec` → S3 `b2d3106f0` → S4 `e4bf9dd8c` → S5 `1f02dde27`; `9f8ee61a6` is the IMPL-EVAL brief only |
| Each slice has a passing gate          | FAIL   | S1–S4 focused gates independently reproduced; S5 catalog smoke left live CLI/Ollama slugs unfixed (Findings 1–2) |
| No speculative seams (unused files)    | PASS   | New files match S1–S3 named surfaces; `expense-watch` is wired in `deno.json` |
| Constants used for finite vocabularies | PASS   | `WORKLOAD_TIERS`, `LOGICAL_MODEL_IDS`, `MODEL_TRANSPORT_PRIORITY`, `EXPENSE_PROVIDERS` |

## Static Gates

| Gate             | Command or check | Result | Evidence | Notes |
| ---------------- | ---------------- | ------ | -------- | ----- |
| Narrow typecheck | `run-deno-check.ts --root .llm/tools/agentic --ext ts` | PASS | 185 files, 2 batches, 0 diagnostics | Independent at `9f8ee61a6` |
| Slice typecheck  | focused agentic tests via `run-deno-test.ts` | PASS | 54/54 named routing/expense/credential tests; 570/570 full `.llm/tools/agentic` | Independent |
| Format           | `run-deno-fmt.ts --file` on 15 changed TS files | PASS | 15 processed, 0 findings | Independent |
| Lint             | structured wrapper / `deno lint` on `.llm/**` | N/A | `deno.json` `lint.exclude` includes `.llm/` | Repo lint does not cover this surface |
| Doc lint         | package `deno doc --lint` | N/A | no `packages/**` / `plugins/**` | plan Archetype-gate applicability |
| Publish dry-run  | `deno publish --dry-run` | N/A | internal tooling only | |
| Link/path check  | lane-policy generated markers + README | FAIL | parity test PASS; README still names deleted `resolveCanonicalRoute` | Finding 4 |

## Fitness Gates

Package F-CLI / JSR / public-surface gates are `N/A` per the approved plan (internal `.llm/tools/agentic/**` only). Applicable universal properties:

| Gate | Function                     | Result | Evidence | Violations |
| ---- | ---------------------------- | ------ | -------- | ---------- |
| F-1  | File-size lint               | PASS   | `delegation-matrix.ts` 461 LOC; rewritten `routing-policy.ts` 222 LOC | none |
| F-2  | Helper-reinvention scan      | N/A    | internal tooling, not a package | |
| F-3  | Layering check               | N/A    | no `packages/**` | |
| F-4  | Inheritance audit            | N/A    | no new class lattice | |
| F-5  | Public surface audit         | N/A    | no JSR export | |
| F-6  | JSR publishability gate      | N/A    | | |
| F-7  | Doc-score gate               | N/A    | | |
| F-8  | Workspace `lib` override check | N/A  | | |
| F-9  | Permission declaration check | PASS   | `agentic:expense-watch` is `--allow-read` only | |
| F-10 | Test-shape audit             | FAIL   | S3 required a spawn spy; tests call `preflightOpenCodeExpense` only | Finding 3 |
| F-11 | Forbidden-folder lint        | N/A    | existing `lib/` under agentic tools, not package source | |
| F-12 | Naming-convention lint       | PASS   | finite vocabularies are const arrays | |
| F-13 | Saga and runtime invariants  | N/A    | | |
| F-14 | Console-log lint             | N/A    | CLI presentation (`expense-watch`, `opencode-run`) | |
| F-15 | Re-export-of-upstream lint   | N/A    | | |
| F-16 | Folder-cardinality lint      | N/A    | | |
| F-17 | Abstract-derived co-location lint | N/A | | |
| F-18 | Sub-barrel lint              | N/A    | | |
| F-19 | Scoped source gate runners   | PASS   | structured check/test/fmt used; lint excluded by config | |

## Runtime Gates

| Gate | Validation | Result | Evidence |
| ---- | ---------- | ------ | -------- |
| Matrix + family composition | owner cells, provider order, skip-same-family, coverage proof | PASS | `delegation-matrix_test.ts` + `routing-policy_test.ts` (independent 54/54) |
| Legacy boundary | new selection with old lane fails closed | PASS | `resolveLegacyRouteForNewSelection('normal_implementation')` throws deserialize-only |
| Credential isolation | prefix loader, rival-key clear, mode-600, value-free errors | PASS | `provider-credential_test.ts`; live files exist mode `0600`; key names only |
| Expense watcher | stale/unproven/exhausted/unresolved-tier fail closed | PASS | `subscription-expense_test.ts`; `runOpenCode` awaits preflight before `Deno.Command` |
| Spawn-denied proof | command-spawn spy | FAIL | no injectable spawn; preflight unit tests only | Finding 3 |
| Live catalog / CLI slugs | S5 catalog smoke | FAIL | Claude capability slugs still `fable-5-1` / `opus-5`; Ollama DeepSeek undated | Findings 1–2 |
| Repo tests (2 red) | environment vs product | PASS | classified as noexec `/ephemeral` (see Runtime notes) |
| Release gates | cut / scaffold.runtime | N/A | not a release cut |

### Two-test classification (independent)

Current `TMPDIR=/ephemeral/tmp`. `/ephemeral` is `tmpfs` with `noexec`.
`packages/cli/e2e/tests/application/gates/service-client-runtime-probe_test.ts` is byte-identical to
`a2d7f5f6f` (blob `ee54ee6af`). Independent rerun under executable `TMPDIR=/tmp`: 31 passed, 0
failed, 1377 ms. Those two repository failures are environment classification, not a product
regression, and do not block this verdict.

## Consumer Gates

| Consumer | Validation | Result | Evidence |
| -------- | ---------- | ------ | -------- |
| published package/plugin | none | N/A | no `packages/**` / `plugins/**` export changes |
| harness docs overlay | source alignment + stale-term scan | FAIL | workload/coordinator tables match typed matrix; README still cites `resolveCanonicalRoute` |

## Anti-Pattern Check

Only mark `CLEAR` when the run scope touched or could affect the pattern. Use `N/A` for patterns
outside scope. Use `DEBT_ACCEPTED` only with a matching `debt/arch-debt.md` entry.

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
| AP-11 | CLEAR  | credential reads are injected (`env`/`readTextFile`/`stat`) | |
| AP-12 | N/A    | | |
| AP-13 | N/A    | CLI edges | |
| AP-14 | N/A    | | |
| AP-15 | CLEAR  | no `IFoo` / `FooT` | |
| AP-16 | N/A    | pre-existing agentic `lib/`, not package source | |
| AP-17 | N/A    | | |
| AP-18 | CLEAR  | semantic assertions, not giant snapshots | |
| AP-19 | N/A    | no package README permissions block required | |
| AP-20 | N/A    | | |
| AP-21 | N/A    | | |
| AP-22 | N/A    | | |
| AP-23 | N/A    | | |
| AP-24 | CLEAR  | typed catalog + registry, not a dispatch switch over vendor unions | |
| AP-25 | CLEAR  | `Deno.Command` / file IO at CLI edges (`opencode-run`, `expense-watch`, credential loader) | |

## Arch-Debt Delta

| Metric                | Count | Evidence |
| --------------------- | ----- | -------- |
| New entries           | 0     | no `arch-debt.md` rows added for this run |
| Resolved entries      | 0     | |
| Deepened violations   | 0     | |
| Unrecorded violations | 0     | remaining defects are catalog/proof gaps, not new doctrine debt |

## Findings

| Severity | Finding | Evidence | Required action |
| -------- | ------- | -------- | --------------- |
| high | Native Claude capability slugs are not CLI-accepted dispatch ids | `ROUTING_MODEL_IDS.fable51Native='fable-5-1'`, `opus5Native='opus-5'`; `NATIVE_CANARY_MODEL_ARGS.claudeOpus` is already `claude-opus-5`; `resolveWorkloadRoute` returns `capability.model` as `RouteIdentity.model`; `planClaudeCommand` passes `command.route.model` to `--model`. Owner live comments 2026-09-04T15:07Z / 15:16Z: `claude --model fable-5-1` unrecognized, `claude-fable-5-1` accepted; same for `opus-5` vs `claude-opus-5`. Unanswered on head `9f8ee61a6`. | Put CLI-accepted slugs in the capability catalog, or add a tested translation used by `resolveWorkloadRoute`. Reply on PR #1989. |
| high | Ollama DeepSeek capability slugs omit live date tags | `deepseekV4FlashOllama='ollama-cloud/deepseek-v4-flash'`, `deepseekV4ProOllama='ollama-cloud/deepseek-v4-pro'`. Owner live `GET https://ollama.com/v1/models` returned `deepseek-v4-flash:0731` and `deepseek-v4-pro:0813` only. S5 `1f02dde27` removed nonexistent Qwen/Grok Ollama ids but left these. | Align Ollama DeepSeek capabilities to the dated live ids and pin them in tests. |
| medium | S3 named spawn-spy proof is missing | Plan S3: “a command-spawn spy proving denied expense decisions never spawn OpenCode”. `runOpenCode` does `await preflightOpenCodeExpense` then `new Deno.Command` with no injectible spawn. Tests only call `preflightOpenCodeExpense`. | Add a spawn seam and a test that a denied decision never calls spawn. |
| medium | Stale active routing term in tooling docs | `.llm/tools/agentic/README.md:640` still says `resolveCanonicalRoute` will not retain expired overrides. Function was deleted in S2. | Replace with the matrix resolver contract. |
| low | S4/S5 have no draft-PR slice comments | PR #1989 comments cover S1–S3 plus owner live-substrate notes; no S4/S5 commit comments. | Comment S4 `e4bf9dd8c` and S5 `1f02dde27` on the draft PR. |

Out of scope for this FAIL_FIX (do not treat as blocking against the approved plan): Astra rollout timing (owner downgraded; leave `gpt-6-astra`); live usage-endpoint fetcher (plan requires a fresh snapshot input, which is implemented); Muse contributor training (owner allowed paid-training participation).

## Lessons for Promotion

| Lesson | Pattern | Applies to | Confidence |
| ------ | ------- | ---------- | ---------- |
| Capability catalog slugs must be the CLI/API ids, not routing nicknames | `NATIVE_CANARY_MODEL_ARGS` already documented the split; the new matrix reintroduced it as dispatch identity | Arch 6 tooling / agentic routing | high |
| Noexec TMPDIR on NAS `/ephemeral` is not a product failure | byte-identical fixture + `TMPDIR=/tmp` rerun | harness evaluators | high |

## Verdict

| Field     | Value |
| --------- | ----- |
| Verdict   | `FAIL_FIX` |
| Rationale | Plan remains valid. Matrix, family composition, provider order, credential isolation, expense fail-closed, docs parity tables, and legacy rejection are in place and independently green. S5 catalog smoke did not correct live Claude CLI spellings or dated Ollama DeepSeek ids, which the owner already proved fail at dispatch; the named OpenCode spawn-spy proof is also missing. Two repo-test reds are environment (`noexec` `/ephemeral`), not product. Bounded repair: fix the three catalog/proof items, reply on #1989, then re-steer this same evaluator session. |
