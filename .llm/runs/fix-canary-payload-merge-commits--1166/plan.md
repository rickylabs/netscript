# Plan: Merge-aware canary payload derivation (#1166)

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-canary-payload-merge-commits--1166` |
| Branch | `fix/canary-payload-merge-commits` |
| Phase | `plan` |
| Target | Internal release tooling |
| Archetype | N/A — repository-internal release derivation, not shipped package/plugin/CLI code |
| Scope overlays | none |

## Archetype

N/A. The change stays under `.llm/tools/release/`; the package/plugin doctrine and archetype matrix
do not govern this internal tool. The applicable gates are the focused release-tool tests and the
scoped TypeScript wrappers required by the repo tooling rules.

## Current Doctrine Verdict

N/A. No `packages/**` or `plugins/**` surface changes and no architecture-debt entry is implicated.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| Contract first | Define merge-aware derivation evidence and empty/failure outcomes before changing traversal. |
| Research before writing | Reproduce the exact second-parent DAG in a synthetic git repository. |
| Drift is explicit | Keep the live-canary acceptance boxes deferred and use `Refs #1166`; do not claim evidence the PR cannot produce. |

## Goal

Make canary payload membership include PR merge commits buried behind a release-branch merge commit,
and make a genuinely empty range observably different from a non-empty range whose derivation found
no PRs, while preserving label, note, and drift behavior.

## Scope

- Replace the first-parent-only commit port with a merge-aware range-commit port.
- Add derivation evidence to the payload result: inspected commit count and explicit
  `populated`/`genuine-empty` outcome.
- Fail the named merge-history check when a non-empty range yields zero PRs.
- Update note/check language so genuine empty is explicit and merge-aware derivation is accurately
  described.
- Add a synthetic git-history regression test containing a PR commit on the second-parent lineage
  of a release-branch update merge, plus genuine-empty and suspicious-empty coverage.
- Preserve and rerun regression coverage for unpublished-version refusal, idempotent release-note
  update behavior, and drift scoping/mismatch semantics.

## Non-Scope

- No `.github/workflows/**` changes; #1004 owns workflow mechanics.
- No `packages/**`, `plugins/**`, dependency, catalog, version, or `deno.lock` changes.
- No canary publish, release cut, stable publish, rollback, or republish mechanics.
- No live canary.1 claims. Acceptance boxes 2–4 of #1166 remain for the milestone orchestrator.
- No change to GitHub's PR association, closing-issue, label-application, note upsert, or drift APIs.

## Hidden Scope

- The synthetic fixture must identify actual commit SHAs so the old `--first-parent` traversal can
  be shown RED and the merge-aware traversal GREEN against the same DAG.
- Payload ordering must remain deterministic; use reverse topological git order and existing PR
  de-duplication.
- Failure output must flow through the already-preallocated `merge-history-payload` check so later
  label/note/drift checks remain visibly `NOT_RUN`.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| L1 | Enumerate `git rev-list --topo-order --reverse <previous>..<head>` without `--first-parent`. | Git's range set difference excludes old ancestry while including merge-buried new work. |
| L2 | Rename the dependency port to `rangeCommits`; do not retain a misleading compatibility alias. | The old name encodes the defect and is internal to the tool/tests. |
| L3 | Extend `CanaryPayload` with `commitCount` and `outcome: 'populated' | 'genuine-empty'`. | Every successful empty output states why it is empty. |
| L4 | Treat `commitCount > 0 && pullRequests.length === 0` as a derivation error. | This is the exact false-green signature from #1166 and must not proceed to label/note mutation. |
| L5 | Keep GitHub association filtering, closed-issue lookup, note upsert, unpublished refusal, and drift calculation unchanged except for accurate derivation wording. | The slice fixes derivation only and preserves the payload/label/note contract. |
| L6 | Test with `Deno.makeTempDir` plus real `git init`/commit/merge commands and remove the fixture in `finally`. | A real DAG proves traversal behavior without mutating repository history. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| What counts as genuine empty | resolved now | Only a zero-commit range. |
| How suspicious empty is surfaced | resolved now | Throw; named check becomes `FAIL`, downstream checks stay `NOT_RUN`. |
| Ordering across merged histories | resolved now | `--topo-order --reverse`, then existing stable de-duplication. |
| Direct non-PR commits on the range | safe to defer | Protected-branch release flow is PR-based; if intentionally introduced later, define an explicit allow-policy rather than silently accepting ambiguity. |
| Live cut verification | safe to defer | Requires merge + canary.1 and is explicitly outside this PR's evidence boundary. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Full traversal re-includes commits already shipped | Synthetic fixture places shared ancestors behind `previous`; assert set-difference excludes them. |
| Update merge is mislabeled as a PR | Preserve strict `merge_commit_sha === commit` and `base.ref === 'main'` association filter. |
| Legitimate empty becomes a false failure | Classify zero commits before PR lookup as `genuine-empty` and regression-test note/check text. |
| Suspicious empty proceeds to mutation | Throw inside derivation before note, label, release, or drift operations. |
| Fixture depends on global git identity/default branch | Set repository-local user identity and create named branches explicitly. |
| Existing contract regresses | Run adjacent release tests, focused check/lint/fmt wrappers, lint-ignore scan, and lockfile diff check. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| Silent false-green empty derivation | existing | Make successful empty evidence possible only for a zero-commit range. |
| Commit-subject parsing | avoided | Continue to use GitHub commit association. |
| Duplicate publish mechanics | avoided | Change derivation only. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| Merge-aware payload | yes | Synthetic git DAG shows old first-parent list omits the buried PR commit and new derivation includes it. |
| Empty/failure distinction | yes | Genuine-empty success and suspicious-empty rejection tests plus named output assertions. |
| Regression contract | yes | Unpublished refusal, release-note idempotency path, and drift tests remain green. |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| `.llm/harness/debt/arch-debt.md` | none | Internal tooling correction creates no package/plugin doctrine debt. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | RED proof | Focused new test against baseline derivation before implementation | Fails because buried PR SHA is absent / old dependency contract cannot satisfy expectation. |
| 2 | Focused GREEN | `deno test --allow-all .llm/tools/release/canary-label_test.ts` | All tests pass, including synthetic merge fixture and empty/failure cases. |
| 3 | Adjacent regression | `deno test --allow-all .llm/tools/release/*_test.ts` | Existing release-tool suite passes. |
| 4 | Scoped check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root .llm/tools/release --ext ts` | PASS, zero diagnostics. |
| 5 | Scoped lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root .llm/tools/release --ext ts` | PASS, zero findings. |
| 6 | Scoped format | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root .llm/tools/release --ext ts` | PASS, zero findings. |
| 7 | No new ignores | Diff/search for `deno-lint-ignore` in touched production/test files | No new ignore. |
| 8 | Lock hygiene | Ground-truth `git diff origin/main -- deno.lock` | Empty. |

## Risks

- The non-empty/no-PR policy intentionally fails closed. If the repository later allows direct
  commits as canary payload content, that needs a separately designed payload representation rather
  than weakening this check back into ambiguity.

## Dependencies

- Git range semantics and the existing `runCommand` adapter.
- Existing GitHub commit association/closing-issue APIs.
- Deno permissions used by the current release-tool test surface.

## Drift Watch

- Any required workflow or publish-mechanics change is significant scope drift and must stop for
  rescoping.
- Any fixture that cannot prove the old first-parent list omits the buried commit is a failed
  negative case, not acceptable evidence.
- Any valid non-empty range without PRs discovered in current release history requires revisiting L4
  before implementation continues.
