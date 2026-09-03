# Plan: quality-scan-root-coverage

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `release-0.0.7-internals--orchestration/slices/quality-scan-root-coverage` |
| Branch | `fix/quality-scan-root-coverage` |
| Phase | `plan-eval` |
| Target | repository quality-scan/doctrine gate coverage |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `service`, `docs` (frozen contract) |

## Goal

Make the configured quality gate derive and enforce its coverage denominator from the live published
workspace, scan every published `packages/**` and `plugins/**` member, preserve dynamic doctrine
coverage, and report both configured roots and exclusions. The next newly declared publishable
member must be covered automatically or make the gate fail.

## Archetype and doctrine verdict

Archetype 6 applies because the changed surface is user/CI-run repository tooling with a task entry,
structured output, filesystem/config discovery, and failure exit semantics. The service overlay adds
no runtime-health work because no service behavior changes; the docs overlay governs the run
artifacts and frozen docs gates.

There is no single package verdict for repository tooling. The tool protects 35 published members
whose current package verdicts are listed in doctrine file 10; it does not change any verdict. The
current doctrine gate itself covers 36 top-level doctrine units and intentionally excludes the
non-published nested CLI E2E harness.

## Exact narrowed edit surface (locked)

| Path | Action | Justification |
| --- | --- | --- |
| `.llm/tools/quality/check-root-coverage.ts` | create | One focused CLI/tool module derives published members through the existing workspace authority, extracts the configured roots for both scan tasks, compares quality and doctrine coverage, emits structured coverage/exclusion data, and exits nonzero on a gap. |
| `.llm/tools/quality/check-root-coverage_test.ts` | create | Fixture-first regression proof for omission, descendant-only pseudo-coverage, broad-root future-member coverage, `publish:false` exclusions, structured reporting, and the live repository invariant. This is acceptance criterion 2. |
| `deno.json` | edit | Change configured `quality:scan` roots from `packages/cli/src` to broad `packages`; run the coverage checker as part of both scan tasks so `quality:gate` and the scheduled repo scan fail closed before compliance scanning. Preserve `plugins`, `docs/site`, allowance budget, and network/env permissions. |

No other path is authorized. In particular, do not edit `check-doctrine.ts`, scanner rule/default/CLI
logic, `docs/site`, any package/plugin, any CLI E2E source, workflows, gate catalog, doctrine, debt,
or `deno.lock`. If implementation proves one of those edits necessary, stop and rescope through the
coordinator.

## Locked decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Reuse `discoverWorkspaceMembers()` from `.llm/tools/deps/workspace.ts`; do not implement another workspace walker. | It expands root workspace patterns and owns the existing `publish !== false` rule. A7 and AP-2/AP-9. |
| D2 | Published denominator is members under `packages/**` or `plugins/**` with `publishable:true`; `packages/bench` and `packages/cli/e2e` are reported as named `publish:false` exclusions. | Matches the live issue wording and JSR/release semantics without treating examples/apps as package gate subjects. |
| D3 | A configured scan root covers a member only when equal to or an ancestor of the member root. | A descendant root such as `packages/cli/src` misses published entrypoints and cannot count as full-member coverage. |
| D4 | Validate both `quality:scan` and `quality:scan:repo` task roots, and compare `discoverDoctrineRoots()` against the same published denominator. | Prevents either configured quality task or the dynamic doctrine gate from silently losing a published member. |
| D5 | Invoke the checker from both scan tasks, before the scanner. | `quality:gate` fails before claiming compliance; the direct scheduled repo task receives the same fail-closed protection. |
| D6 | Configure `quality:scan` with broad roots `packages`, `plugins`, and `docs/site`. | Broad package ancestry automatically includes future nested/top-level members and fixes all 29 current gaps without a hand-maintained list. |
| D7 | Keep scanner reporting unchanged. | Its JSON already contains `scanned`; the checker adds the independently derived published denominator, uncovered list, doctrine roots, and named exclusions. Together the `quality:gate` stream distinguishes coverage from compliance. |
| D8 | The checker returns structured JSON on both pass and fail and exits 1 for empty denominator, malformed/missing task root configuration, or any uncovered published member. | Empty/malformed configuration must be refusal, never green. |
| D9 | Do not add flags to `scan-code-quality.ts`. | Avoids coupling the fix to #1653's pre-existing unknown-flag weakness and keeps scanner rule behavior unchanged. |

## Open-decision sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Checker output field names and stable sort order | resolved now | Lock `ok`, `publishedMembers`, `excludedMembers`, and per-gate `configuredRoots`/`uncoveredMembers`; all path arrays sort lexically for deterministic tests/receipts. |
| Whether non-published Bench should remain a doctrine root | resolved now | Yes. Doctrine's 36-root contract remains unchanged; coverage checker only requires that doctrine roots include all 35 published members. |
| Whether CLI E2E should become published or a doctrine root | safe to defer | Explicit `publish:false` and documented F-19 exclusion; this leaf only reports that reason. |
| Scanner duplicate diagnostics | safe to defer | #1653 low finding; unrelated to roots. |
| Scanner unknown-flag rejection | safe to defer | No new scanner flag is introduced; parser is outside the three-path edit surface. |

## Ordered implementation slices

### S1 — fail-closed root-coverage contract

- Files: `.llm/tools/quality/check-root-coverage.ts`,
  `.llm/tools/quality/check-root-coverage_test.ts`, and run artifacts.
- Introduces: pure normalized ancestry/coverage calculation, workspace/task/doctrine discovery,
  structured report, and CLI exit contract.
- Red proof: fixture with a publishable `packages/missing` member and only
  `packages/covered` configured must produce `ok:false`, name the missing member, and exit nonzero.
- Green proof: durable focused `test` receipt for the new test plus existing
  `.llm/tools/fitness/check-doctrine_test.ts`; scoped check/lint/fmt receipts for the two TypeScript
  files; no empty selection accepted.

### S2 — bind configured tasks to the contract

- Files: `deno.json`, the same root-coverage test (only if its live integration assertion needs
  binding), and run artifacts.
- Introduces: broad `packages` root and checker invocation in `quality:scan` and
  `quality:scan:repo`; preserves `--max-allow 7` byte-for-byte.
- Proof: durable `quality-scan`, `quality-scan-repo`, `arch-check`, and `quality-gate` receipts. The
  checker report must show 35 published members, zero uncovered members for both tasks and doctrine,
  and the two named `publish:false` exclusions. Scanner output must show the exact configured roots.

### S3 — final contract and publishability evidence

- Files: run artifacts only; no implementation path changes.
- Proof at a committed, branch-reachable head: durable `check`, full `test`, `quality-job`,
  `publish-dry-run`, `quality-gate`, `docs-source-format`, `docs-source-format-test`, and
  `docs-accuracy` receipts through `.llm/tools/gates/run-gate.ts`.
- Review: raw Git ground truth confirms no `deno.lock` churn and exactly the three authorized
  implementation paths; diff audit confirms no publishable member changed.
- Handoff: coordinator launches separate-session IMPL-EVAL only after Tier-A slice review and all
  receipts are history-bound.

## Validation plan

All durable evidence uses `.llm/tools/gates/run-gate.ts`. Invocation IDs and receipt paths will be
slice-specific and never reused with different argv. A command that does not execute is `NOT
FIRED`; an empty wrapper selection is a refusal.

| Order | Gate | Expected evidence |
| --- | --- | --- |
| 1 | focused `test` | Missing-member fixture is red by contract; full focused test process exits 0 after assertions. |
| 2 | scoped `check` / `lint` / `fmt-check` | New tooling files selected and clean through structured wrappers. |
| 3 | `quality-scan` / `quality-scan-repo` | Coverage JSON zero gaps + scanner JSON zero findings/allowance failures; `allowCount` stays 7. |
| 4 | `arch-check` / `quality-gate` | 35 published members included in 36 doctrine roots; composite gate exits 0 and prints roots. |
| 5 | `check`, `test`, `quality-job` | Frozen static/behavior/CI quality gates pass. `quality-job` supplies wrapper-backed lint/fmt/dependency coverage. |
| 6 | `publish-dry-run` | Canonical workspace dry-run passes at the final committed head. |
| 7 | `docs-source-format`, its test, `docs-accuracy` | Frozen docs overlay gates pass from `docs/site` where required. |

No `e2e:cli`, `scaffold.runtime`, Aspire, Docker, runtime smoke, publish, or release cut is planned.

## JSR audit plan

JSR audit is applicable to the gate claim, with a locked empty touched-member denominator:

1. At each slice and final head, derive changed paths from Git. If any `packages/**` or `plugins/**`
   member source/config/export enters the diff, stop before proceeding and rescope.
2. With no touched publishable member, public export and exact `@netscript/*` pin audits have zero
   per-member rows; record that explicitly rather than claiming package audits ran.
3. Run the canonical workspace `publish-dry-run` as the frozen regression gate. It exercises the
   current isolated-declaration publish plan without authorizing fixes to unrelated package debt.
4. Reject runtime asset or top-level `import.meta` reads by diff review: the only new TypeScript is
   non-published tooling and may read repository config only at CLI execution time. If publishable
   source appears, the empty-denominator decision is invalid and the run must rescope for the
   package-level preflight.
5. Do not change package versions, exports, publish filters, dependency pins, catalogs, or locks.

## Anti-patterns and fitness gates

| AP/F | Status / plan |
| --- | --- |
| AP-2, AP-9 | Avoid by importing the existing workspace discovery instead of duplicating glob/config rules. |
| AP-11, AP-25 | Repository reads occur only in the executable checker edge; pure coverage calculation is separately testable. |
| AP-18 | Tests assert semantic member/root sets and exit behavior, not giant output snapshots. |
| F-5, F-7 | No published API/doc surface changes; N/A per empty touched-member denominator. |
| F-6 | Full workspace publish dry-run required. |
| F-19 | Root coverage itself becomes executable and fail closed; wrapper/receipt rules remain in force. |
| F-CLI-1..31 | No product CLI package shape changes; manual review confirms the small tooling module is a single concern and no package architecture claim changes. |

## Risk register

| Risk | Mitigation |
| --- | --- |
| Task-string parsing drifts or silently yields no roots | Treat missing/malformed task commands and empty root arrays as hard failures; fixture each case. |
| Descendant root falsely counts as full coverage | D3 ancestry direction and explicit `packages/cli/src` regression fixture. |
| Workspace census and doctrine census diverge | Use existing independent authorities and report both sets; fail when any published member is absent from doctrine roots. |
| Broad package scan surfaces genuine findings | Do not suppress, budget-inflate, or edit package code. Record the gate red and return to coordinator; issue evidence says compensating scans were clean, and #1653's repo-wide scan was green. |
| Allowance owner network is unavailable | Scanner already fails closed; record the real failure, never call it a coverage pass. |
| Existing package debt is mistaken for new scope | Preserve debt registry; coverage proves execution, not compliance or debt closure. |
| Receipt attests an uncommitted/stash object | Run binding receipts only after the relevant slice commit and verify each receipt head is an ancestor of branch head. |
| Root edit causes lock churn | No dependency command is planned; inspect and reject any `deno.lock` change. |

## Explicit deferrals / non-scope

- #1653 low findings: duplicate `explicit-any`/`public-any` attribution and ignored unknown flags.
- Any scanner detection-rule, allowance, resolver, or budget change.
- Any package/plugin source, dependency pin, export, publish filter, doc, or debt remediation.
- Any doctrine/archetype/F-19 rewrite; current docs already name the E2E exclusion.
- CLI E2E/scaffold/Aspire/Docker/runtime validation and all release/publish operations.
- Acceptance-evidence blocks, issue checkbox mutation, ready flip, merge, or label progression beyond
  coordinator-authorized phase changes.

## PLAN-EVAL judgement

**PLAN-EVAL: REQUIRED.** The code volume is small, but the decision is not mechanical: it defines
the denominator and ancestry semantics for what a cross-repository merge gate proves, reconciles
two different existing root authorities (35 published vs 36 doctrine units), and must preserve the
intentional CLI E2E exclusion without recreating a silent gap. The harness requires adversarial
planning review for this decision-heavy gate change. A fresh native opposite-family Fable 5 medium
session must evaluate it; this implementation thread will not launch or self-perform that pass.

Implementation remains prohibited until the coordinator records a `PASS` in `plan-eval.md`.
