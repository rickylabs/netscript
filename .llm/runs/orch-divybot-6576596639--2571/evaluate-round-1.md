# Evaluation: Northwind showcase — #2571

## Metadata

| Field | Value |
| --- | --- |
| Target | [PR #2595](https://github.com/rickylabs/netscript/pull/2595) |
| Candidate | `04149cb48ee54101f87773c5d4cab5229bc01103` |
| Archetype | 6 — CLI/tooling |
| Scope overlays | Frontend, service |
| Evaluator | Independent read-only review, 2026-11-02 |
| Phase | First terminal IMPL-EVAL; previous source reviews were nonterminal |

GitHub metadata, source, directory listings, workflow steps and runtime logs were independently inspected through read-only MCP. Local tests were not rerun: the host sandbox prevents shell execution. Local gate receipts, detailed browser reports and Astra’s visual verdict are supplied evidence.

## Process Verification

| Check | Result | Evidence |
| --- | --- | --- |
| Planning decision recorded before implementation | PASS | Planning commit `ce9a633`; worklog records justified `PLAN-EVAL: N/A` for bounded composition using existing contracts. |
| Design checkpoint exists | PASS | Supplied worklog `Design` names public surface, vocabulary, ports, constants, slices and contributor path. |
| Slices match design and carry gate evidence | PASS | Commit history and [S1](https://github.com/rickylabs/netscript/pull/2595#issuecomment-6578176791)/[S2](https://github.com/rickylabs/netscript/pull/2595#issuecomment-6579981188) review comments; final S3 receipts supplied. |
| Source repair findings closed | PASS | Reviewed finite catch-up, chronological listing, InstalledFrom resolution, lazy tooling import and recursive evidence-directory creation. |
| No speculative abstractions | PASS | Reviewed assets connect to the preset, setup recipe, manifest, generated consumers or regression tests. |
| Finite vocabulary uses existing contracts/registries | PASS | Preset registration, typed orders contracts and existing plugin/runtime APIs in reviewed source. |
| Normal main integration | PASS | Candidate has parents `d1edfbb…` and `59e6202…`; independently verified through GitHub. |
| Review threads | PASS | GitHub returned no review threads. |
| PR operating constraints | PASS | Independently verified draft, Refs-only, no labels, milestone `0.0.9`. |
| Issue-closing merge gate | N/A | Owner requests a draft READY handoff, without issue closure or merge. Formal-evaluation checkbox awaits this verdict. |

The supplied evaluation briefs carry `## SKILL`. No `profiles/` files were read.

## Static Gates

| Gate | Result | Evidence and limits |
| --- | --- | --- |
| Root structured typecheck | PASS | Supplied exact-candidate receipt: exit 0; 4,218 files, 36 batches. |
| All 16 configured root checks | PASS | Supplied `gate-evidence.json`: every task exits 0, including provider boundary and carrier freshness. |
| CLI lint and format | PASS | Supplied structured results: 1,284 linted and 1,156 formatted files; no dropped files or refusals. |
| Quality and architecture commands | PASS | Exact-candidate `quality:gate` and `quality:cli` receipts exit 0. This does not clear advisory doctrine findings. |
| Focused regressions | PASS | Supplied structured wrapper: 96 passed, zero failed or ignored. |
| Publish dry-run | PASS | Supplied exact-candidate `publish:dry-run` receipt exits 0. |
| Documentation completeness | DEBT_ACCEPTED | Existing CLI/Fresh public-documentation debt remains recorded; no blanket documentation-score claim. |
| Documentation and path review | PASS | CLI README includes the showcase entry path; generated walkthrough documents setup, credentials, persistence and deployment constraints. |

## Fitness Gates

| Gate | Result | Evidence |
| --- | --- | --- |
| F-1 — file size | PASS | Reviewed additions remain bounded; showcase adapter is 199 lines and runtime probe 221 lines. Template exemptions apply. |
| F-2 — helper reinvention | PASS | Uses native stream client/transport, installed plugin commands, typed RPC and existing scaffold machinery. |
| F-3 — layering | PASS | Reviewed changes retain adapter ownership and existing kernel/surface boundaries. |
| F-4 — inheritance | N/A | No new implementation inheritance hierarchy. |
| F-5 — public surface | PASS | Opt-in preset uses existing CLI registration; default output isolation and permission controls supplied. |
| F-6 — publishability | PASS | Exact-candidate publish receipt and packed consumer evidence. |
| F-7 — documentation score | DEBT_ACCEPTED | Existing named documentation debt; no new package export introduced. |
| F-8 — workspace lib settings | PASS | Reviewed preset changes do not weaken compiler-library configuration. |
| F-9 — permissions | PASS | Existing permission regressions pass; lazy Vite import preserves ordinary CLI permissions. Showcase prerequisites are documented. |
| F-10 — test shape | PASS | Semantic regressions, mounted browser, negative controls and real runtime walkthrough supplement source checks. |
| F-11/F-12 — folders and naming | PASS | New modules use role/concept names; cardinality is assessed separately below. |
| F-13 — runtime invariants | PASS | Real worker, saga, saved shipping mutations and activity assertions; CI runtime logs independently verified. |
| F-14 — console boundaries | PASS | Reviewed command changes do not introduce console output outside the permitted edges. |
| F-15 — upstream re-exports | PASS | No new upstream re-export surface. |
| **F-16 — folder cardinality** | **FAIL** | Two already over-cap directories grow without corresponding debt documentation; see finding D1. |
| F-17 — abstract co-location | N/A | No abstract/concrete family introduced or moved. |
| F-18 — sub-barrels | PASS | Reviewed additions introduce no unnecessary source barrel. |
| F-19 — structured gate runners | PASS | Supplied wrapper receipts and independently verified CI test invocation. |
| Dedicated F-CLI scripts | PENDING_SCRIPT | Selected profile requires manual structural evidence where dedicated scripts are absent. The composite architecture command is green; D1 remains independently established. |

## Runtime Gates

| Gate | Result | Evidence |
| --- | --- | --- |
| Canonical Postgres runtime | PASS | [Job 125346649654](https://github.com/rickylabs/netscript/actions/runs/41465808061/job/125346649654): independently inspected log reports `passed=124 failed=0 skipped=0`, including cleanup. |
| SQLite runtime | PASS | [Job 125346649705](https://github.com/rickylabs/netscript/actions/runs/41465808061/job/125346649705): independently inspected log reports `passed=116 failed=0 skipped=0`. |
| Documented showcase | PASS | Same SQLite job independently reports `passed=8 failed=0 skipped=0`, including cleanup. Supplied local walkthrough also passes 6/6. |
| Authenticated chat/browser CI step | PASS | Independently verified successful preparation and exact source-plus-browser command at the candidate. Supplied reports show two outer tests and 21 internal scenarios passing. |
| Native replay and guards | PASS | Supplied mounted-browser report proves first send, unused-thread reopening, native message/tool replay, exact-offset resume and auth/origin denial. |
| Static scaffold CI | PASS | Job `125346649292` succeeds at the exact candidate. |
| Desktop | DEBT_ACCEPTED | Successful job explicitly enforces the existing active #859 exception boundary; unconditional native acceptance is not claimed. |
| Lane visibility | N/A | Policy-skipped job; required runtime jobs actually ran. |
| Resource cleanup | PASS | Independently verified CI cleanup; supplied local reporter records zero owned survivors. Local Docker cleanup remains unproven. |
| External model/OAuth providers | NOT_RUN | No real credentials used. Acceptance covers supplied fixtures and native application boundaries. |
| Release publication | N/A | This leaf does not publish or cut a release. |

The [workflow run](https://github.com/rickylabs/netscript/actions/runs/41465808061) independently resolves to the exact candidate, completed successfully on attempt 1, and retains runtime artifacts.

## Consumer Gates

| Consumer | Result | Evidence |
| --- | --- | --- |
| Default init | PASS | Supplied current-main control: 220/220 byte-identical files, same destination, including agents; no normalization or exclusions. |
| Generated production application | PASS | Supplied actual client/server builds using 29 packed packages, compiled exports, closed first-party aliases and no copied source vendors. |
| Generated chat UI | PASS | Actual emitted island and registry components exercised by the supplied mounted-browser report. |
| Visual acceptance | PASS | Independent Astra’s supplied final review covers all 60 combinations and 12 viewport proofs; every score is at least 8/10. |
| Existing CLI inspection | PASS | Supplied registry and public CLI permission regressions remain green. |

## Anti-Pattern Check

| AP | Status | Evidence |
| --- | --- | --- |
| AP-1 | CLEAR | Bounded reviewed additions; no new monolith. |
| AP-2 | CLEAR | Existing platform/upstream primitives reused. |
| AP-3 | CLEAR | No god interface introduced. |
| AP-4/AP-5/AP-6 | N/A | No inheritance redesign. |
| AP-7/AP-8/AP-9 | CLEAR | Existing composition and test seams reused. |
| AP-10 | CLEAR | Reviewed handlers retain explicit failure responses rather than success-shaped suppression. |
| AP-11 | CLEAR | Effects remain at reviewed adapter/application boundaries. |
| AP-12 | CLEAR | Reviewed timestamps represent persisted metadata/runtime events; no replacement scheduler introduced. |
| AP-13/AP-14/AP-15 | CLEAR | No new prohibited logging, upstream re-export or interface naming pattern identified. |
| AP-16/AP-17 | CLEAR | No new forbidden framework folder vocabulary. |
| AP-18 | CLEAR | Semantic and runtime assertions supplement emitted-source checks. |
| AP-19 | CLEAR | Permissions and external prerequisites documented; permission regressions retained. |
| AP-20 | CLEAR | Compiler-library configuration preserved. |
| **AP-21 / R-FOLD-CARD** | **VIOLATION** | Unrecorded growth in over-cap directories, detailed below. |
| AP-22 | CLEAR | No unnecessary source barrel introduced. |
| AP-23 | CLEAR | Existing declarative command composition retained. |
| AP-24 | CLEAR | Existing preset/contract extension mechanisms reused. |
| AP-25 | CLEAR | Reviewed effects remain in their applicable edge code. |

## Arch-Debt Delta

| Metric | Count | Evidence |
| --- | ---: | --- |
| New recorded entries | 0 | Debt registry is byte-identical to merged main. |
| Recorded resolutions | 0 | Same registry blob: `29ccd9d495181cb0594f08cba13921231c6ca34a`. |
| Deepened cardinality locations | 2 | Independently counted main versus candidate directory listings. |
| Unrecorded location deltas | 2 | No matching exception/update for this showcase growth. |

## Findings

| ID | Severity | Finding | Required action |
| --- | --- | --- | --- |
| **D1** | **Medium — blocking debt** | Adding `showcase/` increases `packages/cli/src/kernel/adapters` from **18 to 19** immediate children and `packages/cli/e2e/src/application/gates/scaffold` from **93 to 94**. Both exceed the cap of 12. The unchanged debt registry does not record these deltas. | Record the bounded exceptions with measured growth, reason/cost, owner, target, linked plan, status and closure gate; add the matching Archetype 6 README deviation documentation and reconcile the plan/worklog’s “no deepened debt” claim. Alternatively remove the growth through an appropriate structural change. |

[R-FOLD-CARD](https://github.com/rickylabs/netscript/blob/04149cb48ee54101f87773c5d4cab5229bc01103/docs/architecture/doctrine/05-folder-structure.md#folder-cardinality-r-fold-card) explicitly counts files and subfolders. The existing scaffold debt entry does not authorize this new growth.

The historical 906-line runtime registry has already been split: the current file is 363 lines. D1 therefore does **not** assert that the historical monolith remains. It concerns the independently measured directory growth.

The architecture checker emits F-16 findings as `WARN`, explaining why its successful exit does not resolve the missing debt handling. No new functional repair is requested.

## Maintained-Tree Verification

These candidate hashes independently match the supplied gate projection:

| Surface | Git object |
| --- | --- |
| `packages` | `fcae53e7e12df20f313eca0733305f61e37be205` |
| `plugins` | `69a932b52040e14abd28939e18c1258a827e5b7f` |
| `.github` | `b93b11faa505bbcef1c00da97475f7c3fbb33c39` |
| `docs` | `3057e82801898dfac924c0edd185d042f5873dad` |
| `deno.json` | `d825215dc5f341dc93fd3a64073d0e6212da231f` |
| `deno.lock` | `e7cab3e1513951964a27e498f758cf6263b6a08b` |
| `.llm/tools` | `9e4528c107406a3b3c948c3dcc03abd2123a75be` |

A future evidence-only commit is not yet verified. Prose/image changes alone do not require runtime repetition when the relevant maintained source remains identical.

## Lessons for Promotion

| Lesson | Applies to | Confidence |
| --- | --- | --- |
| Compare changed parent-directory counts against main; advisory checker success does not establish valid debt handling. | CLI/scaffold reviews | High |

## Verdict

| Field | Value |
| --- | --- |
| **Verdict** | **FAIL_DEBT** |
| Rationale | Functional source repairs, runtime CI and supplied consumer/visual evidence satisfy the reviewed implementation scope. The remaining blocker is D1: unrecorded deepening of two folder-cardinality violations. The plan remains valid; no release-publication or external-provider gate is substituted for this PR’s acceptance. |
| Loop status | First terminal IMPL-EVAL failure. Previous S1/S2 source verdicts remain nonterminal subgates. |
