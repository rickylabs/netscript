# Review Evaluation: fix-db-collection-runtime-family--c2 (bounded independent amendment IMPL-EVAL, issue #2039 / draft PR #2089)

## Metadata

| Field          | Value                                                                       |
| -------------- | --------------------------------------------------------------------------- |
| Run ID         | `fix-db-collection-runtime-family--c2`                                      |
| Target         | Issue #2039 / draft PR #2089, branch `fix/db-collection-runtime-family`      |
| Archetype      | `ARCHETYPE-2-integration` (`packages/sdk` + `packages/fresh`); S6 amendment additionally touches owning CLI Archetype 6 catalog overlay (`packages/cli` scaffold catalog) and the Fresh UI private consumer lock |
| Scope overlays | `SCOPE-frontend` (Fresh live-query/stream surface) — unchanged by the amendment |
| Evaluator      | Independent amendment IMPL-EVAL session, 2026-10-08, Zhipu GLM family. Generator: lane C2 (OpenAI family, per `supervisor.md`). Session and vendor-family separation satisfied; same evaluator route lineage as the original S5 evaluation. |
| Brief          | `ci-amend-evaluate-brief.md` — bounded delta review since the original independently passed report; no repetition of broad original gates |

Exact evaluated HEAD, full hash (matches PR #2089 head and `origin/fix/db-collection-runtime-family`):

```
22b9e0b38ad067c3318e2de225951493afb91350
```

Supporting identities:

- Amendment source commit: `a82a4968138d0af4c757283ad5271ac50b0bbae1` (contains both source deltas and the S6 run-artifact record)
- Docs/receipt close-out commit: `22b9e0b38` (adds this brief and receipt records only)
- Original independently passed head (baseline of the bounded delta): `c9a2005ca1ab7ccf260ff09d9995a460bf09069d` — its PASS report `evaluate.md` is retained **unchanged** at `51d074443efa241af0d24153a6de608f78ef429b` verification scope
- Bounded delta (`c9a2005ca..22b9e0b38`): 7 files — the two source files below plus run artifacts (plan S6, worklog, context-pack, drift, brief). **No production/runtime/test file touched.**
- Working tree at evaluation end: clean (`git status --porcelain` = 0 lines); no source edits, no branch changes, no history/public writes by the evaluator.

## Bounded Delta — source review

### 1. `packages/cli/src/kernel/constants/scaffold/scaffold-app-catalog.ts` (12 lines)

Exactly three existing scalar dependency constants moved to the D1 exact pins:

- `TANSTACK_DB`: `^0.6.8` → `0.6.17`
- `TANSTACK_QUERY_DB_COLLECTION`: `^1.2.1` → `1.2.1`
- `TANSTACK_REACT_DB`: `~0.1.95` → `0.1.95`

Plus owning-format line wrapping only: the `@orpc/tanstack-query` and `@tanstack/query-core` entries collapsed from two lines to one (they fit the owning `lineWidth: 100`, see Fmt verification below). No other catalog constant, import map entry, command, flow, spine, composition, registry, or permission changed. `@durable-streams/state` is correctly absent from the scaffold app catalog (it is a Fresh runtime dependency, not a scaffolded app dependency), so "three pins" is the complete owning set.

Causality of the fix is real: `scaffold-app-catalog_test.ts` (pre-existing, unchanged by the delta) asserts every runtime catalog dependency's scaffold output specifier equals `npm:<dep>@<root-catalog-version>` and that the root catalog matches Fresh/SDK manifests. The stale ranged pins were a causal FAIL of that existing test; the exact pins now align `deno.json` catalog (`@tanstack/db: 0.6.17`, `@tanstack/query-db-collection: 1.2.1`, `@tanstack/react-db: 0.1.95`, `@durable-streams/state: 0.3.1`) → scaffold catalog → owning manifests.

### 2. `packages/fresh-ui/deno.lock` (38 lines)

Exactly four family specifier keys moved ranged→exact, matching the root catalog/owning manifests:

- `npm:@durable-streams/state@~0.3.1` → `@0.3.1`
- `npm:@tanstack/db@~0.6.8` → `@0.6.17`
- `npm:@tanstack/query-db-collection@^1.2.1` → `@1.2.1`
- `npm:@tanstack/react-db@~0.1.95` → `@0.1.95`

plus the same four keys' workspace-array alias occurrences inside the lock's package records. All right-hand resolved mappings are byte-identical. Nothing else changed.

### 3. Non-family change scan

- Filtered the full lock diff for any changed line not containing one of the four family names: **zero lines**.
- Filtered the full delta for suppression tokens (`deno-lint-ignore`, `deno-fmt-ignore`, ignores, `as unknown as`): **zero occurrences**.
- No lint/fmt suppression was introduced to green any gate.

## Semantic lock identity — independently re-derived

Full structured JSON comparison of `packages/fresh-ui/deno.lock` at `c9a2005ca` vs `a82a49681` (and byte-identical at HEAD):

| Property | Before | After | Delta |
| --- | --- | --- | --- |
| npm specifier count | 511 | 511 | 0 |
| npm keys added / removed | — | — | 0 / 0 |
| npm resolved values changed | — | — | **0** |
| jsr specifier count | 55 | 55 | 0 |
| jsr keys/values changed | — | — | **0** |
| specifier keys changed | — | — | exactly the four family keys, ranged→exact |

This proves the claimed "every 511 npm identity and full JSR mapping byte-unchanged": every resolved version+peer identity (including `0.6.17_typescript@7.0.2`, `1.2.1_@tanstack+query-core@5.101.1_typescript@7.0.2`, `0.1.95_react@19.2.8_typescript@7.0.2`, `0.3.1_@tanstack+db@0.6.17…typescript@7.0.2`) is preserved. **React and BetterAuth peer identities are unaffected** (no npm key and no resolved value changed at all). D1 identity preservation holds at both specifier and resolved level.

## Process Verification

| Check | Result | Evidence |
| --- | --- | --- |
| Plan-Gate state for the amendment | PASS | Original `plan-eval.md` PASS (docs-only, pre-source) governs the run; the S6 amendment records a concrete, justified `PLAN-EVAL: N/A` rationale in `plan.md` S6 ("mechanical completion of approved D1 exact-family/generated consumers, no material contract/lifecycle decision") and in `worklog.md`/`context-pack.md`. The amendment changes only existing scalar constants and lock specifier keys — no new contract, port, or lifecycle decision animating a PLAN-EVAL. Recorded before the source handoff. |
| Amendment bounded to approved scope | PASS | Delta fileset is exactly the two source files + run artifacts; no command/flow/spine/composition/registry/permission change verified by full diff + non-family scans. |
| Commit slices + commit trail | PASS | PR #2089 draft, head `22b9e0b38` = evaluated HEAD = origin branch head; amendment source commit `a82a49681` and evidence commit `22b9e0b38` present; S6 per-slice PR comment exists naming the repair, the identity preservation, and the honest scaffold.runtime state. |
| Original PASS retained | PASS | `evaluate.md` unchanged (original full verification at head `51d074443…`); this report only evaluates the bounded delta. |
| Evaluator separation | PASS | Separate session/vendor family from the generator lane; no delegation, no CI polling. |
| Labels | PASS | `e2e-cli-gate` (CI runtime qualification opted in), `status:impl-eval`, `type:fix`, `area:cli` (correctly added for the scaffold catalog touch), `area:fresh`, `area:sdk`, `area:deps`, `priority:p1`. |

## Independent re-runs executed live this session at exact HEAD (not copied from receipts)

| # | Command (abridged) | Result |
| --- | --- | --- |
| 1 | Existing scaffold catalog tests, frozen (`scaffold-app-catalog_test.ts`) | exit 0 — **2 passed / 0 failed** (the causal CI failure class is restored; see count note in Findings) |
| 2 | Fresh UI frozen check (`deno task --cwd packages/fresh-ui check`, `--lock=deno.lock --frozen`) | exit 0 — **150 files, 0 failed batches, 0 diagnostics**; the stale-lock refusal of exact-head CI cannot recur at this lock state |
| 3 | Fresh UI lint | exit 0 — 150 files, 0 occurrences |
| 4 | Fresh UI frozen test suite | exit 0 — **172 passed / 0 failed / 0 ignored** (matches receipt) |
| 5 | Full `deno task quality:gate` (quality:scan + arch:check incl. chained `deps:check:db`) | exit 0 — pre-existing legacy WARNs only (F-5/F-6), unchanged in kind from the original evaluation |
| 6 | Scoped frozen structured check on the amended catalog source + its test | exit 0 — 2 files, 0 diagnostics |
| 7 | Scoped fmt on the amended catalog source under the owning settings (`singleQuote: true`, `lineWidth: 100` — root config values) | exit 0 — 0 findings; a control run under default 80-width correctly reproduces a format finding, confirming the owning-config agreement rather than accidental pass |
| 8 | `deno task check:mcp-export-corpus` (with the documented session `LD_LIBRARY_PATH` unset quirk — same evaluator-session provisioning quirk recorded by the original evaluator, not a repo property) | exit 0 — sha256 `2d4f9e2863f7f6b939948e05ea18554d686faf1ac8fde6f620d49f0055bb0e10`, 35 packages / 275 subpaths / 7908 symbols — **identical checksum** to the S4/S6 receipts and the original evaluation; corpus unchanged by the amendment |
| 9 | Suppression scan over the full delta | 0 lines |
| 10 | `git status --porcelain | wc -l` after all runs | 0 (checkout unmodified) |

## Receipt corroboration (generator's private receipts)

Every claimed S6 receipt was independently corroborated against the retained private receipts and/or a live re-run:

| Receipt | Claim | Corroboration |
| --- | --- | --- |
| `db-ci-catalog-tests` | catalog tests pass | receipt exit 0 (2 passed) + live re-run exit 0 |
| `db-ci-static-check` | scoped frozen check on amended source | exit 0 (equivalent live re-run) |
| `db-ci-fresh-ui-check` | frozen Fresh UI check 150 files | receipt 150 files / 0 failed batches / 0 occurrences + live re-run |
| `db-ci-fresh-ui-lint` | lint pass | receipt exitCode 0, 150 files + live re-run |
| `db-ci-fresh-ui-tests` | 172 tests pass | receipt "0 failed" + live re-run 172 passed |
| `db-ci-quality` | quality/architecture pass | receipt (legacy WARNs only, `deps:check:db` chained) + live re-run exit 0 |
| `db-ci-lint-corrected` / `db-ci-owning-fmt-final` | owning-config lint/fmt pass | receipts exitCode 0 / 0 findings + equivalent live fmt corroboration |
| `db-ci-fmt` / `db-ci-fmt-final` (intermediate fails) | honestly retained refusals/failures | receipts show the excluded-root refusal and the interim wrapping failure before the owning format was applied — no evidence fabrication |
| `db-ci-cli-doc` | CLI doc lint pass | receipt: all entrypoint exit codes 0, combined exit 0 |
| `db-ci-cli-jsr` | CLI JSR pass | receipt: pre-existing F-DOCT-5 cardinality / F-JSR-7 slow-types WARN classes only, same pre-existing categories as the original evaluation |
| `db-ci-cli-publish` | raw publish dry-run | receipt ends `Success Dry run complete` |
| `db-ci-carrier` / `db-ci-committed-corpus` | carrier + corpus freshness | receipts + live re-run with matching checksum |
| `db-ci-scaffold-runtime` | honest raw-exit-one attempt | receipt: `passed=1 failed=2 skipped=0` with Aspire doctor/Docker cleanup `RemoteError` infrastructure failure trace; retained rather than bypassed |

No unsigned or markdown-fabricated verdict was relied upon; placeholder-scan of receipts found only real artifacts.

## Inherited scope (explicitly carried from the original unchanged PASS report)

The original evaluation at `51d074443…` (retained word-for-word) remains the governing source-level qualification. Its evidence surface is structurally unaffected by this amendment (no runtime/test/corpus/debt file changed in the bounded delta), so the following statuses are **inherited, not re-verified here**:

- Full SDK/Fresh suite 524 pass / 0 fail / 0 ignored; focused production three pass.
- Cold complete-identity guard (mixed + Fresh-only), guard mutations fail→restored, factory mutations fail→restored.
- Production Fresh SSR/hydration/updates/teardown fixture with zero browser errors.
- JSR audits and raw publish dry-runs (SDK, Fresh) pass; all-export doc lint baseline unchanged — debt `db-doc-baseline-2039` remains **DEBT_ACCEPTED** (explicitly adjudicated in the original report; the delta does not deepen it — doc-relevant surface untouched).
- Publication of qualified versions and the exact qualified published-consumer sweep remain **owner release work**; the PR correctly carries `Refs #2039` without a closing keyword. No Fixes claim is made by this evaluation.

## Runtime qualification — still open, not passed by this report

The one-pass local `scaffold.runtime` attempt failed on unavailable Aspire doctor / Docker cleanup infrastructure (raw exit 1; `1 passed/2 failed/0 skipped` — retained honestly in worklog and PR comment. Per plan S6, a CLI literal change requires the *actual* qualified runtime receipt; `e2e-cli-gate` opts this source into qualified exact-source CI runtime validation.

**This evaluation reviews source/static correctness only and does NOT certify the runtime qualification.** The generator's remaining obligation after this source review is to record the matching qualified exact-source CI runtime receipt — or an explicit owner qualification block if CI cannot complete — before merge readiness. Merge-readiness is `PENDING` on that item; this PASS must not be read as "every gate green".

## Verdict

| Field     | Value |
| --------- | ----- |
| Verdict   | `PASS` (bounded amendment evaluation; source-pass with merge-readiness pending the qualified CI runtime receipt) |
| Rationale | The bounded delta is exactly and only what the S6 amendment scope authorized: three existing scaffold catalog scalar pins aligned to the D1 exact family (plus owning-format wrapping verified against the owning fmt settings) and four Fresh UI private-lock family specifier/workspace aliases moved ranged→exact. Every resolved npm identity (511) and the full JSR mapping (55) is independently proven byte-unchanged; React/BetterAuth peer identities untouched; zero suppression tokens introduced. The pre-existing causal failures at exact-head CI — the scaffold catalog consistency test and the Fresh UI frozen stale-lock refusal — are independently re-proven fixed (catalog tests, frozen check at 150 files, frozen tests 172, lint, scoped checks pass live), quality/architecture pass live, corpus freshness corroborated with the unchanged checksum, and the successful original-run scope carries over with its DEBT_ACCEPTED doc-baseline intact. The local scaffold.runtime infrastructure failure is honestly retained and its qualification path (`e2e-cli-gate` CI receipt or explicit owner qualification block) is correctly left open: this evaluation distinguishes source PASS from merge-readiness and does not falsely pass the open runtime gate. |

## Findings

| Severity | Finding | Evidence | Required action |
| --- | --- | --- | --- |
| LOW | Count inaccuracy in S6 wording: "existing scaffold catalog three tests" — the owning catalog test file contains exactly **two** test units (`scaffold runtime npm imports match …`, `standalone workspace Zod catalog …`), as both the receipt (`2 passed`) and live re-run show | receipt + live re-run | Text-only count correction at next artifact touch; no impeding effect — the substantive claim (existing catalog tests pass, causal FAIL restored) is proven |
| INFO | Scoped lint/fmt via structured wrappers requires an owning-config selection for `packages/cli` and `packages/fresh-ui/deno.lock` (root include scope excludes them); passing `--config` with the owning root fmt settings reproduces the receipts exactly | this session's fmt verification | none |
| INFO | `check:mcp-export-corpus` required unset `LD_LIBRARY_PATH` in this evaluator session (same provisioning quirk recorded by the original evaluator, not a repo property) | session env | none |
| INFO | `origin/main` continues to move independently of this branch; pre-merge rebase/refresh remains owner-side standard practice | git | none |

## Evaluator obligations honored

No source edits, branch changes, history/public/EIS writes, CI polling, delegation, dependency downloads/upgrades, unrelated audits, or repetition of the original broad 524-test/production-browser surfaces. Work confined to this checkout and sibling task receipt evidence. This report is the exit deliverable; evaluation exits before any generator commit action.

*— End of bounded independent amendment IMPL-EVAL (fix-db-collection-runtime-family--c2, delta c9a2005ca…22b9e0b38) — evaluator session independent of the generator; original PASS report retained unchanged; runtime qualification correctly left open.*
