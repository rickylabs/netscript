# IMPL-EVAL: #2453 native Pagefind reproducibility

**Verdict: PASS.** The scoped feature is complete, with the limitations below disclosed. This is the local IMPL verdict at `b756ee6`, not hosted readiness. Merge remains with the cockpit.

**Evaluator:** the same independent, separate-family, read-only session (Anthropic Opus 5.5, high effort, feature tier) that did PLAN cycle 2 and both slice content reviews. **Head evaluated:** `b756ee6a971d0d705c35cf2a39ca763a265b5714`. Since baseline `1e4e58f`, ten product files changed; everything uncommitted is run evidence only. I edited nothing; the only scratch was lock copies in `$TMPDIR`.

## Protocol rules

| Rule | Evidence | Result |
|---|---|---|
| Plan-Gate passed before implementation | `plan-eval.md` PASS (cycle 2) is committed in `ed7d08a`, before the first product commit `5e77d73` | ✔ |
| Design checkpoint exists, and slices follow it | `worklog.md` `## Design`; commits run bootstrap (`c027397`/`ed7d08a`), then native integration (`5e77d73`), then strict CI (`b756ee6`), matching `plan.md` | ✔ |
| Each slice's named gate passed | Slice 2 and slice 3 content reviews passed (`slice-review-native.md`, `slice-review-strict.md`); the exact-head proof at `5e77d73` came before the bounded mode was removed | ✔ |
| Scope and drift | Changes stay inside the declared write surface. The classifier test was added to scope in `drift.md` before implementation. No S8 layout, token, registry or binary-postprocessing changes. | ✔ |
| Debt and doctrine | No `packages/` or `plugins/` touched; `arch-debt.md` has no change. No AP violation applies. | N/A ✔ |
| Close-gate (rule 12) | The PR body is `Refs #2453` with no closing keyword, the PR is a draft, and it has no labels (owner override). The close-gate does not apply until someone adds a closing keyword. | N/A |
| Release gate (rule 14) | This is not a release cut. | N/A |
| `## SKILL` chapter in briefs (rule 13) | All evaluator briefs in this session have one. I cannot see the implementation brief from the repository. The public `/swarm` issue comment names the skills in prose rather than under a `## SKILL` chapter. | Process note, not blocking |

## Issue acceptance criteria

| # | Criterion | Evidence I verified | Result |
|---|---|---|---|
| 1 | Strict comparison passes for every output file across independent builds, with no allowances | `exact-implementation-proof.json` at `5e77d73`: 1116 files, zero differences, recorded while the bounded mode still existed. At `b756ee6`, `gate-evidence-strict-ci.json` reports 1116, 316, 311 and 262 with `differences: []`, and the checker no longer has an allowance path. On a rerun, the native shuffle fixture passed, and the unsorted negative control produced different output, so cross-machine ingestion order (#1395) is covered. | ✔ (see limitation 3) |
| 2 | Full Utility browser suite stays green | `browser-strict-ci.json`: its hash matches the evidence (`d8b488d8…`), `gitHead` and `actualGitHead` are both `b756ee6`, and exit code is 0. I tallied the child report `tools/fresh-ui-browser/test-results/docs/results.json` independently: 158 expected, 6 skipped, 0 unexpected, 0 flaky, across all four projects. The 6 skips are the two `components.spec.ts` census tests, which `test.skip(info.project.name !== 'light-1280')` limits to one project; `tools/fresh-ui-browser` is unchanged from main. The search specs passed in all four projects: Pagefind filters, hash navigation, empty, unavailable and stale states, plus search screenshot/axe, keyboard lanes, and twin/search exclusion. | ✔ |
| 3 | Bounded mode removed only after exact-head proof; original failure kept | The proof ordering is above. `baseline-strict.md` is kept and has a raw-log SHA. `--allow-pagefind-metadata` is absent from the workflow, checker and README, and passing it now fails with `Unknown argument` before any build starts (I reran this). | ✔ |

## Gates I reran (no full build or browser run)

| Command | Result |
|---|---|
| `deno test --frozen --config deno.json --allow-all _plugins/pagefind-fixture.ts` (run from `docs/site`) | 1 passed: ordered vs shuffled output byte-identical, unsorted control differs, `entry.version` is 1.6.0 |
| `deno test … docs/site/_plugins/pagefind_test.ts` (the root bridge) | 1 passed |
| `deno test … .github/scripts/ci-classify-changes.test.ts` | 70 passed |
| `check-reproducible.ts --allow-pagefind-metadata` | Rejected with `Unknown argument` before building |
| Lock integrity | `docs/site/deno.lock` and the root `deno.lock` are byte-identical before and after the reruns, `pagefind@1.3.0` count is 0, and the working tree has no product changes. Earlier, the 1.6.0 integrity hashes matched the npm registry. |
| Receipts under `.llm/tmp/gate-receipts/pagefind-2453/` | The SHA-256 of all six receipts (quality, browser, agent-docs-prose, mcp-export-corpus, assets-barrel, publish-assets) matches `gate-evidence-strict-ci.json`. Each records `gitHead` `b756ee6`, outcome PASS and exit code 0. `quality-strict-ci` ran `deno task quality:gate`. |

The supervisor reported the following and I accepted them without rerunning: 94 tooling/workflow/bridge tests, 39 source fixtures, scoped check/lint/fmt, frozen Lume and empty-cache `deno ci` without the age bypass, and the 804-output baseline comparison (the `catalog.json` `inputHash` change is explained in `drift.md`).

## Limitations

1. **No CLI runtime proof.** The local `scaffold.runtime` run was attempted once and exited 1 at `preflight.aspire` and `cleanup.aspire-stop`, because the worker has no Docker daemon. That is unproven, not passed and not policy-skipped, and the PR body says so accurately. The change surface (docs build, Pagefind and the Pages workflow) does not reach scaffold output, so this does not block the scoped IMPL PASS. It must still not be reported as runtime proof.
2. **Hosted checks are not yet green.** Changing the classifier test selects every impact. On the draft PR, the draft policy skips the core/scaffold/Fresh jobs, which proves nothing about runtime. The hosted Pages build and browser jobs must finish green at the exact final head before READY. A terminal PASS from `agentic:pr-checks` while jobs are pending is not all-green.
3. **The strict two-build at `b756ee6` has no durable receipt.** It is a supervisor-reported result in `gate-evidence-strict-ci.json`; the `5e77d73` proof has a raw-log SHA. The planned repeat at the evidence-only final head and the hosted Pages strict step will each independently confirm it.
4. **Audit baseline.** The optional high audit shows the same 6 high / 10 total advisories as baseline, all in unchanged dependencies (markdown-it, linkify, sharp). Pagefind adds no advisory.
5. **Browser libraries.** The local browser run used isolated runtime libraries. The assertions and the test suite are unchanged from main.

## Attestation needed at the final head (resume this session)

- The commit containing only evidence and `evaluate.md` changes nothing under `docs/site/`, `tools/`, `.github/` or the locks; check with `git diff b756ee6 <final> -- ':!.llm/runs'`, which should be empty.
- The strict two-build at the final head shows 1116 files with zero differences, and the built-output manifest matches the browser-tested manifest (`2f564f7c…`).
- The hosted Pages build and browser jobs are green at that exact head. Any other row is legitimately draft-policy-skipped, and nothing about runtime is inferred from a skip.

**IMPL-EVAL: PASS** for the scoped feature at `b756ee6`, with limitations 1–3 disclosed. Hosted readiness and final-head attestation are still pending.
