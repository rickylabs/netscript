# Evaluation: beta4-cut-A-ai--impl (RE-EVALUATION)

## Metadata

| Field | Value |
| --- | --- |
| Run ID | `beta4-cut-A-ai--impl` |
| Target | Issue #388, plugins/ai flagship parity |
| Archetype | 5 - thin plugin plus core package |
| Scope overlays | service/e2e/docs |
| Evaluator | OpenHands IMPL-EVAL re-evaluation, qwen 3.7 max, 2026-07-05 |

## Re-evaluation Scope

This is a RE-EVALUATION after two blockers from the previous FAIL_FIX round:

1. **Protocol defect (rule 13):** `.llm/harness/evaluator/protocol.md` rule 13 previously required
   `## SKILL` chapters in PR bodies. PR #477 fixed this on main to scope the requirement to agent
   briefs/prompts only.
2. **Close-gate (acceptance boxes):** Issues #388 (5 boxes) and #260 (gate:e2e box) had unchecked
   acceptance criteria.

Both blockers have been verified resolved.

## Close-Gate Verification (Protocol Rule 12)

| Issue | Box | Status | Evidence |
| --- | --- | --- | --- |
| #388 | `gate:e2e` — scaffold.runtime ai case | ✅ [x] | Evidence comment posted; full suite passed=50 failed=0 |
| #388 | `verify-plugin.ts` for plugins/ai | ✅ [x] | Evidence comment posted; `plugins/ai/verify-plugin.ts` exists |
| #388 | In-repo `/v1/ai` binder + contract-soundness test | ✅ [x] | Evidence comment posted; `createAiRouter` + soundness test exist |
| #388 | Scaffolder golden tests + plugin doctor test | ✅ [x] | Evidence comment posted; golden/doctor tests exist |
| #388 | Recorded parity review | ✅ [x] | Evidence comment posted; `.llm/runs/beta4-cut-A-ai--impl/parity-review.md` exists |
| #260 | `gate:e2e` — scaffold.runtime ai case | ✅ [x] | Evidence comment posted; full suite passed=50 failed=0 |

## Protocol Rule 13 Verification

| Check | Result | Evidence |
| --- | --- | --- |
| Rule 13 on `origin/main` scopes SKILL to briefs/prompts only | PASS | `git show origin/main:.llm/harness/evaluator/protocol.md` confirms "PR bodies are governed by the `netscript-pr` templates and do NOT require a `## SKILL` chapter" |
| Old rule 13 on PR branch | N/A | Protocol defect fixed on main via PR #477; not a PR defect |

## Independent Verification (Spot-Check)

| Check | Result | Evidence |
| --- | --- | --- |
| Contract soundness test | PASS | `deno test --unstable-kv packages/plugin-ai-core/tests/contracts/ai-contract-soundness_test.ts` → 1 test passed |
| Full runtime smoke | PASS | `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` → exit 0, `passed=50 failed=0` |
| Commit trail | PASS | 9 commits on `feat/ai-flagship-parity-388` since divergence from main |

## Process Verification

| Check | Result | Evidence |
| --- | --- | --- |
| Plan-Gate passed before implementation | PASS | `plan-eval.md` cycle 2 verdict is `PASS`. |
| Design section exists in worklog | PASS | `worklog.md` records boundaries, vocabulary, commit slices, gates. |
| Commit slices match design plan | PASS | `commits.md` records slices 1-9. |
| Each slice has a passing gate | PASS | `worklog.md` gate tables record targeted tests, scoped wrappers, publish dry-runs, and final runtime smoke. |
| No speculative seams | PASS | AI runtime binder is in `plugin-ai-core`; `plugins/ai` remains adapter/scaffold glue. |
| Constants used for finite vocabularies | PASS | E2E suite/gate/plugin constants added under `packages/cli/e2e/src/domain/extension-axes.ts`. |

## Static Gates

| Gate | Command or check | Result | Evidence |
| --- | --- | --- | --- |
| Narrow typecheck | `deno test --unstable-kv packages/plugin-ai-core/tests/contracts/ai-contract-soundness_test.ts` | PASS | 1 test passed (independently re-run by evaluator). |
| Slice typecheck | scoped `run-deno-check.ts` over `packages/plugin-ai-core`, `plugins/ai`, `packages/cli/e2e` | PASS | 114 files pass. |
| Format | scoped `run-deno-fmt.ts --ext ts,tsx` | PASS | 114 files pass. |
| Lint | scoped `run-deno-lint.ts --ext ts,tsx` | PASS | 114 files pass. |
| Doc lint | `deno task doc:lint --root packages/plugin-ai-core`; `deno task doc:lint --root plugins/ai` | WARN | Wrapper exits 0 but reports transitive private-type references; package publish dry-runs pass. |
| Publish dry-run | `deno publish --dry-run --allow-dirty` in both packages; root `deno task publish:dry-run` | PASS | All dry-runs completed. |
| Link/path check | Exact `plugins/ai/deno.json` export map | PASS | Exports: `.`, `./adapter-cli`, `./public`, `./plugin`, `./adapter`, `./scaffold`, `./contracts`. |

## Fitness Gates

| Gate | Function | Result | Evidence |
| --- | --- | --- | --- |
| F-5/F-6 | Public surface and JSR publishability | PASS | Exact export map; package/root publish dry-runs pass. |
| F-10 | Test-shape audit | PASS | Contract soundness, scaffold golden, doctor, verify, CLI registry/runtime tests. |
| F-11/F-12 | Forbidden-folder and naming conventions | PASS | Generated AI artifacts stay under `ai/`; golden tests assert paths and emitter names. |
| F-19 | Scoped source gate runners | PASS | Scoped check/lint/fmt wrappers used for touched roots. |

## Runtime Gates

| Gate | Validation | Result | Evidence |
| --- | --- | --- | --- |
| `scaffold.runtime` | `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` | PASS | Raw exit 0; `passed=50 failed=0`; `behavior.ai-chat-route` passed (independently re-run by evaluator). |
| Aspire CLI | `aspire --version`, `aspire doctor`, `aspire ps`, suite `aspire restore/start/wait/describe/stop` | PASS | Aspire 13.4.6; doctor passes; no AppHosts after cleanup. |

## Consumer Gates

| Consumer | Validation | Result | Evidence |
| --- | --- | --- | --- |
| Generated scaffold workspace | Type-checks generated workspaces and imports generated AI chat route | PASS | `generated.deno-check` and `behavior.ai-chat-route` passed. |
| `@netscript/plugin-ai` consumers | Package publish dry-run with included scaffold manifests | PASS | `plugins/ai` dry-run includes manifest files. |

## Anti-Pattern Check

| AP | Status | Evidence | Notes |
| --- | --- | --- | --- |
| AP-1/AP-2 layering | CLEAR | Router binding lives in `plugin-ai-core`; plugin adapter stays thin. | Doctrine thin-plugin law followed. |
| AP-11 forbidden generated paths | CLEAR | Golden tests assert generated paths. | No scaffold output under framework internals. |
| AP-15 re-export upstream | CLEAR | Plugin exports adapter/public/plugin/scaffold/contracts explicitly. | No wildcard export map. |

## Arch-Debt Delta

| Metric | Count | Evidence |
| --- | --- | --- |
| New entries | 0 | Drift recorded in `drift.md`. |
| Resolved entries | 0 | N/A |
| Deepened violations | 0 | No accepted doctrine violation. |
| Unrecorded violations | 0 | Known install-variant gap recorded in `drift.md`. |

## Findings (Non-Blocking)

| Severity | Finding | Evidence | Required action |
| --- | --- | --- | --- |
| medium | Public `plugin install` does not yet expose `--persist-threads`/`--mcp` variants. | `drift.md` | Track in follow-up; beta.6 stub recorded. |
| low | Doc lint reports transitive private-type references despite publish dry-run success. | `worklog.md` | No publish blocker observed. |

## Verdict

| Field | Value |
| --- | --- |
| Verdict | PASS |
| Rationale | Both previous FAIL_FIX blockers are resolved: (1) protocol rule 13 fixed on main via PR #477 to scope SKILL requirement to briefs only; (2) all acceptance boxes on #388 (5/5 checked with evidence) and #260 (gate:e2e checked with evidence) are satisfied. The full `scaffold.runtime` suite was independently re-run by this evaluator and passed (50/50, exit 0). No new findings or regressions. |
