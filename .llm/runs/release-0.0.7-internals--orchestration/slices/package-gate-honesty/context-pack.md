# Context Pack: package-gate-honesty

## Run Metadata

| Field          | Value                                                                |
| -------------- | -------------------------------------------------------------------- |
| Run ID         | `release-0.0.7-internals--orchestration/slices/package-gate-honesty` |
| Branch         | `fix/package-gate-honesty`                                           |
| Current phase  | Rebased exact head validated; pending fresh internals Tier-A         |
| Archetype      | `6 — CLI / Tooling` (supporting MCP member A2)                       |
| Scope overlays | `docs`                                                               |

## Current state

PLAN-EVAL cycle 1 correctly returned `FAIL_PLAN` at evaluator commit `be2b18728`: root exclusion
cannot affect the optimized wrappers' explicit argv. The coordinator granted child-only marker
semantics plus nearest-config batching in both wrappers, then granted the exact formatting-only
twelfth path exposed by the honest 114-file finding. Both exact no-extra-flag prototypes are now
green at 114; all four healthy files remain selected, parsed meaning is equal, doctor is 4/4, and
the malformed hash is unchanged. Cycle 2 correctly returned `FAIL_PLAN` at evaluator commit
`c415daad2`: the lint wrapper is embedded in published CLI source. The coordinator granted the exact
generated barrel as path thirteen and ruled on root task selection, fixture-style wording, and
nearest-config memoization. The owner-authorized final cycle 3 then returned `FAIL_PLAN` at
`65c5e1ac4`: the planned top-level exclusion preserved fmt/lint acceptance but silently removed all
five doctor TS files from `deno check`. The owner granted the in-path correction to the existing
`fmt.exclude` list. The topic supervisor then returned Tier-A PASS at amended plan head `62811a9dd`,
discharging the plan gate under the owner exception. S1 was implemented and signed off at
`4b988a381`; S2 was implemented and signed off at `22dc3906e`; S3 was implemented and signed off at
`fd508978c`. S4 has executed the commit-bound matrix without product/config mutation. All required
gates pass except full MCP export-map doc lint, which fails identically on the immutable base and is
reported as baseline red for supervisor disposition.

## Completed

- Bootstrap commit `25c29575c` pushed with explicit refspec.
- Draft PR #1663 opened with exact closing keywords, checkable DoD, `type:fix`, `area:tooling`,
  `status:research`, milestone `0.0.7`; no acceptance-evidence blocks.
- All three issues re-read live.
- Three cwd failures and MCP fmt config crash reproduced through structured wrappers.
- `closeScoreGap` definition, consumption, and decorative test behavior traced.
- Thirteen-path repaired plan and per-member JSR audit plan locked; no fourteenth path.
- Exact no-extra-flag lint prototype green at 114; fmt reports exactly one genuine healthy-fixture
  finding at 114; separate fmt/lint negative controls red with real findings; doctor 4/4; all
  negative-control source files restored byte-exactly.
- Scratch-only formatting of the granted twelfth path makes exact fmt green at 114 while lint and
  doctor remain green; original/formatted exports are equal.
- All four healthy TS files were individually named selected by genuine or controlled fmt findings,
  and every controlled probe was restored byte-exactly.
- Cycle-2 archive proof established that canonical lint-wrapper regeneration changes only
  `agent-tools.generated.ts` among generated assets, including its embedded tool text and bundle
  hash; `check:assets-barrel` is now planned.
- Cycle 3 independently re-proved the prior repair at 114/2 and exposed the top-level-exclude check
  regression. Its executed `fmt.exclude` alternative preserves raw-walk protection, exact fmt/lint
  acceptance, root `fmt:check`, and scoped doctor check coverage at 5 selected / 0 failed batches.
- Tier-A passed the owner-amended plan at `62811a9dd`; the plan gate is discharged.
- S1 implements child-only marker selection, memoized nearest-config batching in both wrappers,
  bidirectional/group-membership tests, exact root formatter configuration, formatting-only healthy
  normalization, and canonical CLI asset regeneration.
- Exact MCP fmt and lint are green at 114 selected / 2 config batches / 0 failed batches; all four
  healthy TS files remain individually selected through both wrappers.
- Scoped doctor check is green at exactly 5 selected / 0 failed; wrapper plus doctor tests are
  24/24; doctor behavior remains 4/4; the malformed fixture hash is unchanged.
- Honest fmt and lint negative controls produced real findings and were restored byte-exactly; root
  `fmt:check` is green at 2038/36/0 and the quality gate is green.
- Tier-A signed off S1 at `4b988a381` after independently reproducing its wrapper, check, generated
  asset, quality, and test evidence.
- S2 anchors repository-owned CLI verification/docs/scratch paths to their modules without changing
  production gate command arguments or weakening assertions.
- The three focused CLI files pass from both package and repository cwd at 6/6; exact
  `deno task --cwd packages/cli test` passes at 828 tests (533 steps) / 0 failed.
- S2 scoped check/lint/fmt each select exactly 3 files and pass; docs accuracy, docs source format,
  and quality gate pass while both docs sources and `deno.lock` remain byte-identical.
- The wrong-directory negative control fails at 3 passed / 3 failed, then restores all three files
  byte-exactly and returns to 6/6; a read-only scratch sentinel also fails closed.
- Tier-A signed off S2 at `22dc3906e` after independently reproducing its cwd, assertion-retention,
  canonical package-test, and negative-control evidence.
- S3 keeps `closeScoreGap: 0.5`, records its measured gap/headroom/regeneration rationale, and uses
  exact-binary score differences to make both boundary directions observable through order.
- The implemented guidance test is green at 7/0; controlled widening to `5` and narrowing to `0.25`
  each produce raw exit 1 at 6/1, restore the policy source byte-exactly, and return to 7/0.
- MCP scoped check/test/lint/fmt pass at 115/136/114/114 non-empty selections; quality gate is green
  with allowance baseline 7.
- The MCP public `deno doc --json` surface remains byte-identical at 175 symbols; only an internal
  published-source comment changed and the ranking policy remains unexported.
- Tier-A signed off S3 at `fd508978c` after independently reproducing both boundary mutations and
  the quality/MCP evidence.
- S4 commit-bound check, test, quality, generated-asset, docs, exact-pin, isolated-declaration, and
  member/root publish gates pass at the signed-off S3 head. Doctor coverage is exactly 5 checked;
  healthy formatter coverage is exactly 4 selected; quality allowance count remains 7.
- The published CLI delta is honestly limited to embedded lint-wrapper text and bundle hash in the
  canonical generated asset; installed consumers receive child-marker and nearest-config batching
  semantics without an export/API/binary-command change.
- Full MCP export-map doc lint was executed and is red on two entrypoints with one private type
  reference each; the exact failure reproduces on immutable base `05fc3132b`.

## In progress

- Finalizing the evidence-only S4 commit, explicit push, and `[PHASE: IMPL]` PR comment before the
  final Tier-A slice review.

## Next steps

1. Topic supervisor performs the final Tier-A review of the pushed S4 evidence commit and disposes
   the unchanged-base MCP doc-lint red.
2. A separate-session IMPL-EVAL remains mandatory after Tier-A; this thread must not launch it.
3. `scaffold.runtime` remains waived `n/a` and must not run.

## Key decisions

| Decision                                     | Source         | Notes                                                          |
| -------------------------------------------- | -------------- | -------------------------------------------------------------- |
| Child marker + config batching owns boundary | plan L3/L4     | Both green at 114 after granted formatting-only normalization. |
| Published lint asset regenerated canonically | plan L7/S1     | Embedded tool text/hash change; no export/API-shape change.    |
| Root task parent skip removed                | plan S1/gates  | Existing `fmt.exclude` protects raw fmt walks only.            |
| Doctor check coverage preserved              | plan S1/gate 1 | Scoped doctor check must report 5 selected / 0 failed.         |
| Module-derived CLI paths                     | plan L1/L2     | No ambient cwd and no weakened assertion.                      |
| `0.5` pinned both directions                 | plan L5/L6     | Inside/outside identity conflict makes movement observable.    |
| Formal PLAN-EVAL required                    | plan judgement | This thread cannot self-launch or self-certify.                |

## Authoritative product/config edit surface

1. `deno.json`
2. `packages/cli/e2e/src/application/gates/scaffold/service-env/service-env-gates_test.ts`
3. `packages/cli/e2e/tests/presentation/quickstart-command-drift_test.ts`
4. `packages/cli/e2e/src/application/gates/scaffold/run-documented-stream-example.ts`
5. `packages/mcp/src/domain/docs/guidance-index.ts`
6. `packages/mcp/tests/guidance-retrieval_test.ts`
7. `.llm/tools/run-deno-fmt.ts`
8. `.llm/tools/run-deno-fmt_test.ts`
9. `.llm/tools/run-deno-lint.ts`
10. `.llm/tools/run-deno-lint_test.ts`
11. `packages/mcp/tests/fixtures/doctor/broken/.deno-fmt-lint-ignore`
12. `packages/mcp/tests/fixtures/doctor/healthy/netscript.config.ts`
13. `packages/cli/src/kernel/assets/agent-tools.generated.ts` (canonical regeneration only)

Everything else in the frozen outer bound is read-only, especially both docs sources and the broken
fixture config. A fourteenth path is rescope.

## Gates

| Gate family | Current status                        | Evidence                                        |
| ----------- | ------------------------------------- | ----------------------------------------------- |
| Plan-Gate   | DISCHARGED                            | Tier-A PASS at amended head `62811a9dd`.        |
| Static      | S1–S3 focused gates PASS              | S3 guidance 7/0; MCP 115/136/114/114.           |
| Fitness/JSR | PASS except MCP doc lint baseline RED | Audits/publish pass; MCP entrypoint lint 1/1/0. |
| Runtime     | N/A                                   | Explicit coordinator waiver; must not run.      |
| Consumer    | S2 + S3 acceptance PASS               | CLI package task and boundary mutations proven. |

## Open questions

- Fresh internals Tier-A disposition of the rebased branch. The already-disclosed MCP export-map
  doc-lint baseline remains red at 1/1/0; the responsible source/config blobs are byte-identical to
  live `origin/main`, so this rebase pass did not repair or deepen it.

## Drift and debt

- Drift: R8 falsified by execution; rejected parent-family false exclusion; corrected 114-file
  proof; authorized formatting-only twelfth path; cycle-2 published-asset discovery; authorized
  generated thirteenth path; corrected root-vs-fixture formatting semantics; cycle-3 top-level
  exclusion check regression; owner-granted existing-`fmt.exclude` amendment; raw formatter
  non-TypeScript collateral restored during S1 validation; unchanged-base MCP export-map doc-lint
  red surfaced during S4.
- Debt: no entry was added or closed; registered CLI baseline debt remains unchanged, and the
  unregistered MCP doc-lint baseline is awaiting supervisor disposition.

## S5 — owner-granted micro-slice after IMPL-EVAL advisory F1

- Head `cfa055bb8285406e92bd7b9a8f1e12637149d67e`; one line in
  `packages/mcp/tests/guidance-retrieval_test.ts` (already inside the granted thirteen paths):
  outside control `pages/00-outside#just-outside` moved from score `9.75` to `9.9375`.
- Why: the S3 guard pinned narrowing exactly but pinned widening only at `>= 0.75`, leaving
  `(0.5, 0.75)` undetected — wider than the `~0.198` headroom and `~0.0749` regeneration movement
  recorded in `guidance-index.ts`.
- Result: widening now detected at `>= 0.5625`, including `0.6` which passed before. Narrowing at
  `0.49`/`0.4` still fails. Residual blind band `(0.5, 0.5625)`, width `0.0625` — stated openly, and
  judged sound by the delta evaluator because absorbing one regeneration step needs `>= ~0.0749`,
  which lands at `>= 0.575`, inside the detected region.
- Gates: MCP tests 136/0; `quality:scan` `allowCount: 7`; `guidance-index.ts` restored byte-exact
  after every mutation.
- Tier-A PASS (supervisor). **Delta IMPL-EVAL `PASS`** at `b456f53f7`, session `117c4b77`, written
  to `evaluate-delta.md`; the prior full IMPL-EVAL `PASS` at `cf31de902` remains preserved in
  `evaluate.md`.

**Latest slice is S5, not S4.** Branch head after the delta verdict is `b456f53f7`.

## 2026-08-28 — exact-main rebase handoff

- Authorized pre-rebase identity: local branch, `origin/fix/package-gate-honesty`, and PR head all
  `e764be1620076bc19af09c07768e3c3306048a42`; live `origin/main` and the remote main ref both
  `c73d361eea14a7f40702638638e492f2ca961a59`.
- `git rebase origin/main` replayed all 17 leaf commits without a textual conflict. `git range-diff`
  maps every old commit to a patch-equivalent rebased commit; the rebased implementation/evaluator
  head before this evidence update is `995ac2ee83fdebe316f0c12fbbb28c5784839115`.
- The semantic `deno.json` union was checked explicitly: main's `docs:exports-drift` task remains;
  the leaf's bounded `fmt:check` command remains; the doctor path appears in the one existing
  `fmt.exclude` key and not in top-level `exclude`.
- The frozen diff remains exactly thirteen product/config paths plus the leaf run directory. The
  complete run-artifact tree hash is unchanged across the rebase
  (`aeca3a2d9bdc43c9dfe7bff04b35c98efa70620bb5a8c8297e2c5abc5b7beb34`), preserving all plan and
  implementation evaluator artifacts byte-for-byte.
- Commit-bound revalidation at `995ac2ee8` passed root check (2,925/25/0), doctor check coverage
  (5/1/0), focused tests (37/0), MCP tests (136/0), exact CLI package tests (828 passed, 533 steps),
  `ci:quality`, `quality:gate`, `quality:scan` (`allowCount: 7`), generated-asset freshness,
  docs-source-format, docs accuracy, exact JSR specifiers, CLI doc lint, and root publish dry-run.
  The exact no-extra-flag MCP fmt/lint wrappers remain green at 114 files / 2 batches / 0 failed.
- MCP export-map doc lint remains the disclosed baseline red (`./cli.ts` 1, `./mod.ts` 1,
  `./openapi-projection.ts` 0). Its entrypoints, package config, and diagnostic source blobs are
  identical to `origin/main`; no out-of-scope repair was attempted.
- `scaffold.runtime` remains coordinator-waived `n/a`; Aspire, Docker, `e2e:cli`, an evaluator, and
  all PR/issue mutations were not invoked.

## Commits

- Draft PR commit list + phase comments are authoritative; no `commits.md`.
