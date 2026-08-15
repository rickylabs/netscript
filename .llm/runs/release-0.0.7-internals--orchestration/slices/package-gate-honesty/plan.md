# Plan: package-gate-honesty

## Run Metadata

| Field          | Value                                                                |
| -------------- | -------------------------------------------------------------------- |
| Run ID         | `release-0.0.7-internals--orchestration/slices/package-gate-honesty` |
| Branch         | `fix/package-gate-honesty`                                           |
| Phase          | `plan` — hard stop pending formal PLAN-EVAL                          |
| Target         | Gate honesty for #1604, #1618, and #1622                             |
| Archetype      | `6 — CLI / Tooling` (frozen leaf profile)                            |
| Scope overlays | `docs`                                                               |

## Archetype and doctrine verdict

The frozen leaf profile is Archetype 6 because the owning behavior is package/CLI verification and
the strongest consumer proof is the CLI scaffold harness. The supporting `@netscript/mcp` member is
currently classified Archetype 2; this plan preserves that package's token-bounded integration
boundary and does not reshape it.

- `packages/cli`: **Keep** — preserve the Archetype-6 kernel/surface split
  (`doctrine/10-codebase-verdict-and-handoff.md:33`).
- `packages/mcp`: **Keep** — keep MCP transports behind token-bounded tool contracts (`:42`).
- Relevant open accepted debt is baseline only: CLI public doc completeness; MCP horizontal-shape
  classification; MCP tool-contract file size; CLI E2E scaffold directory cardinality. None is
  closed or deepened by these six edits.

## Axioms in play

| Axiom | Why it matters                                                                                                         |
| ----- | ---------------------------------------------------------------------------------------------------------------------- |
| A1    | Published/exported boundaries remain unchanged; tests and comments describe the actual contract before implementation. |
| A7    | Use Deno's supported exclusion and `import.meta`/URL path primitives instead of bespoke cwd discovery.                 |
| A8    | Changes stay in the existing role-named files; no helper or new folder is introduced.                                  |
| A9    | Preserve CLI A6 and MCP A2 package shapes; the leaf profile does not authorize reshaping either.                       |
| A14   | Each repaired guard must have a negative control that proves it can fire; a non-fired command is not green.            |

## Goal

Make three misleading package gates truthful: their canonical commands run from their documented
cwd, configuration discovery cannot consume a deliberately invalid fixture, and the tuned ranking
boundary cannot move materially while tests stay green.

## Exact narrowed edit surface (authoritative)

These are the only product/config paths implementation may edit. Run artifacts under this slice
directory are updated alongside every future slice but are not product scope.

| Path                                                                                    | Justification                                                                                                                                                                      |
| --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `deno.json`                                                                             | Add the deliberately invalid MCP doctor-fixture directory to the supported root exclusion so Deno tooling never auto-discovers it as real config; leave the fixture itself intact. |
| `packages/cli/e2e/src/application/gates/scaffold/service-env/service-env-gates_test.ts` | Resolve the relative script argument against the already module-derived `REPO_ROOT` before `Deno.stat`; retain the real gate command and existence assertion.                      |
| `packages/cli/e2e/tests/presentation/quickstart-command-drift_test.ts`                  | Resolve `docs/site/quickstart.vto` from the test module/repository root while retaining exact command-parity assertions.                                                           |
| `packages/cli/e2e/src/application/gates/scaffold/run-documented-stream-example.ts`      | Resolve the authoritative streams doc and run-owned scratch directory from a module-derived repository root so the semantic example execution works from package cwd.              |
| `packages/mcp/src/domain/docs/guidance-index.ts`                                        | Record the empirical, non-scale-derived rationale adjacent to `closeScoreGap`; do not change the value or public exports.                                                          |
| `packages/mcp/tests/guidance-retrieval_test.ts`                                         | Replace the decorative boundary arrangement with observable just-inside and just-outside controls that fail for both widening and narrowing.                                       |

Adding any seventh product/config path is rescope and requires coordinator approval before editing.

## Frozen contract entries deliberately not touched

- `docs/site/durable-workflows/streams.md` — authoritative source is read and executed, not
  rewritten.
- `docs/site/quickstart.vto` — authoritative commands remain unchanged.
- `packages/mcp/tests/fixtures/doctor/broken/deno.json` — must remain deliberately malformed.
- The broad/duplicate `packages/cli/`, `packages/cli`, and `packages/*` entries — no other CLI file,
  package, generated asset, member config, or dependency pin is edited.
- The broad `packages/mcp` entry — no other MCP source, test, README, entrypoint, export, or config
  is edited.
- No `.llm/tools/**`, workflow, lock, cache, receipt implementation, Aspire, Docker, or release
  file.

## Hidden scope

- Both publishable members receive JSR audits even though the public export maps do not change.
- The CLI package's known doc-lint/isolated-declaration debt must be reported honestly rather than
  silently converted to pass.
- Docs accuracy and source-format gates still run because two tests consume docs as executable
  contracts even though those docs are read-only.
- Negative controls must show raw non-zero exit and distinguish a real finding from a config crash.
- `scaffold.runtime` is required because the changed documented-stream helper is called by the full
  scaffold consumer path; it remains coordinator-mutexed.

## Locked decisions

| ID | Decision                                                                                                                                            | Rationale                                                                                                                                                                                |
| -- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| L1 | Anchor repository-owned CLI test paths with `new URL(..., import.meta.url)` / `fromFileUrl`, not `Deno.cwd()`.                                      | Module location is stable under both root and package-cwd invocation; process cwd is explicitly the defect.                                                                              |
| L2 | Preserve production gate command arguments; resolve only when the test performs filesystem verification.                                            | The runtime gate correctly interprets `GATE_DIR` relative to `context.project.repoRoot`; changing it would expand behavior scope.                                                        |
| L3 | Root `exclude` owns the invalid doctor fixture boundary.                                                                                            | Deno documents it as the cross-tool exclusion for directories that must never be treated as real config; it makes the exact standalone wrapper command work without editing the wrapper. |
| L4 | The malformed fixture and its existing failing-doctor assertion remain unchanged.                                                                   | Validating the fixture would destroy the behavior under test and produce a false green.                                                                                                  |
| L5 | Keep `closeScoreGap = 0.5`; add one observable just-inside case at exactly the boundary and one early-sorting just-outside case at `0.5 + epsilon`. | Narrowing breaks the inside reorder; widening breaks the outside score order. Both directions become observable.                                                                         |
| L6 | Record the empirical rationale next to the policy: observed gap ≈0.3019801982, headroom ≈0.1980198018, regeneration movement ≈0.0748587452.         | The value is tuned from observed headroom, not mathematically derived from an arbitrary score scale.                                                                                     |
| L7 | No new public export, dependency, port, helper, asset, or runtime read.                                                                             | The work is regression hardening, not API or architecture change.                                                                                                                        |
| L8 | Evidence commands fire through structured wrappers/`run-gate.ts`; empty selection, crash, NOT_RUN, or missing mutex is not PASS.                    | This leaf exists to eliminate false verdicts.                                                                                                                                            |
| L9 | Do not run `scaffold.runtime`, Aspire, Docker, or any CLI runtime smoke until the coordinator grants the mutex.                                     | Explicit cluster-wide serialization contract.                                                                                                                                            |

## Open-decision sweep

| Decision                             | Status        | Notes                                                                                                |
| ------------------------------------ | ------------- | ---------------------------------------------------------------------------------------------------- |
| Root exclusion versus wrapper change | resolved now  | L3; wrapper path is outside the frozen bound and unnecessary.                                        |
| Test path mechanism                  | resolved now  | L1/L2; module-derived roots only.                                                                    |
| Close-score boundary data            | resolved now  | L5/L6; both directions observable and rationale exact.                                               |
| Public API/export changes            | resolved now  | None permitted.                                                                                      |
| Where `scaffold.runtime` runs        | safe to defer | Coordinator chooses the mutex holder/execution lane; the exact command and required head are locked. |

No unresolved decision would cause implementation rework.

## Ordered implementation slices

Every slice also updates `worklog.md` and `context-pack.md`, then is committed, pushed, and
commented before the next slice. No implementation begins before separate-session PLAN-EVAL `PASS`.

| #  | What it proves                                                                                                         | Exact product/config files                                                                        | Proving gates                                                                                                                                                                                                                                                                                  |
| -- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S1 | MCP formatting selects and checks real source while Deno ignores the intentionally invalid fixture as configuration.   | `deno.json`                                                                                       | Exact scoped fmt wrapper returns exit 0, `failedBatches: 0`, non-empty selection; `doctor-families_test.ts` remains green; sibling-invalid-config survey; temporary real MCP source formatting defect returns raw non-zero with a formatting finding, then exact file restoration is verified. |
| S2 | The canonical package-cwd CLI task no longer has three root-relative `NotFound` failures and no assertion is weakened. | The three exact CLI files listed above                                                            | Structured targeted three-file test first (6/6), then exact `deno task --cwd packages/cli test`; scoped check/lint/fmt on the three owned TS files; docs-source-format and docs-accuracy. The final consumer proof for this slice is deferred to S4 under mutex.                               |
| S3 | `closeScoreGap` is pinned from both sides and its empirical rationale ships with the policy.                           | `packages/mcp/src/domain/docs/guidance-index.ts`; `packages/mcp/tests/guidance-retrieval_test.ts` | Structured targeted guidance test; controlled `0.5 -> 5` and `0.5 -> below-inside-gap` mutations each raw non-zero, followed by exact restoration and green rerun; MCP scoped check/test/lint/fmt; quality gate.                                                                               |
| S4 | The integrated head meets the frozen proving contract and publish/docs claims are honest.                              | No new product/config files; run artifacts/evidence only                                          | Commit-bound `check`, `test`, `publish-dry-run`, `quality-job`, docs-source-format, docs-accuracy, per-member JSR suite; then coordinator-granted one-pass `deno task e2e:cli run scaffold.runtime --cleanup --format pretty`. Missing mutex remains NOT_RUN, never waived or inferred.        |

## JSR audit plan per touched publishable member

| Member           | Planned public surface delta                                                       | Exact-pin audit                                                                                | Isolated-declaration / publish audit                                                                                                                                             | Runtime asset / `import.meta` audit                                                                                                                                |
| ---------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `@netscript/cli` | None; all edits are under publish-excluded `e2e/`.                                 | Confirm six `@netscript/*` imports remain exact `0.0.6`; run `check:netscript-jsr-specifiers`. | Full export-map doc-lint and package/root publish dry-run; report existing `isolatedDeclarations: false` and doc-completeness debt as baseline, with no new diagnostic.          | Verify changed E2E-only module-relative reads do not enter the published file list; reject any published `import.meta`/filesystem asset read.                      |
| `@netscript/mcp` | None; policy stays internal. One comment in published `src/**`, one excluded test. | Confirm aspire and telemetry subpaths remain exact `0.0.6`; run exact-pin scan.                | `audit-jsr-package.ts --root packages/mcp`, full export-map doc-lint, targeted root isolated-declaration check, member/root publish dry-run, and published file-list inspection. | Static scan of the changed published source must show no `import.meta`, `fromFileUrl`, `Deno.read*`, or runtime asset dependency; release preflight remains green. |

For both, reject new slow types, self-bare imports, upstream re-exports, dependency ranges, runtime
asset reads, or publish-list drift. A dry-run is necessary but not sufficient; S4 keeps the
coordinator-owned consumer runtime gate.

## Anti-patterns to resolve or avoid

| AP/F         | Status              | Plan                                                                                                                  |
| ------------ | ------------------- | --------------------------------------------------------------------------------------------------------------------- |
| AP-18 / F-10 | risk                | Retain semantic assertions; no snapshots, skips, deletions, or renamed-only boundary claims.                          |
| AP-25        | avoid               | Module-relative filesystem access remains in publish-excluded E2E edge code; no MCP published-source effect is added. |
| F-5/F-6/F-7  | required            | Audit full export maps, docs, and publish file lists for both touched members.                                        |
| F-19         | required            | All static/test/fmt evidence comes from scoped structured wrappers; empty selection refuses green.                    |
| F-CLI-*      | no structural delta | `quality:gate`/manual review confirm no A6 boundary change; existing accepted debt is not deepened.                   |

## Gate plan and durable receipts

Durable final evidence is invoked through `.llm/tools/gates/run-gate.ts` with unique IDs and the
actual branch head. Receipts are not hand-edited; child JSON reports are attached where the command
already produces them. A receipt proves only its command. Before and after every gate, compare
`deno.lock` and source status with Git ground truth.

| Order | Frozen gate           | Command/check shape                                                                                                    | Passing condition                                                                                                      |
| ----- | --------------------- | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| 1     | check                 | Root/task structured check plus scoped owned-file checks (`--unstable-kv` where targeted).                             | Fired at current head; non-empty selection; exit 0.                                                                    |
| 2     | test                  | Structured targeted tests, MCP package tests, then exact CLI package task.                                             | All execute; no ignore/skip added; exit 0.                                                                             |
| 3     | quality-job           | `deno task ci:quality` plus `deno task quality:gate`.                                                                  | Both exit 0; no new allowance/cast/lint-ignore.                                                                        |
| 4     | docs-source-format    | Scoped formatter over the two read-only docs source files and changed TS files; never a directory containing receipts. | Non-empty selection, zero findings/crashes.                                                                            |
| 5     | docs-accuracy         | `deno task docs:accuracy`.                                                                                             | Exit 0 with sources unchanged.                                                                                         |
| 6     | publish-dry-run / JSR | Root/member publish dry-runs, full export-map doc-lint, per-member JSR audits, exact-pin and release preflight scans.  | No new warning/finding, correct publish lists, isolated-declaration expectations met or named baseline debt unchanged. |
| 7     | `scaffold.runtime`    | Exact one-pass command with `--cleanup --format pretty`, only after coordinator mutex grant.                           | Fired at current head, raw exit 0, suite report complete.                                                              |

## Risk register

| Risk                                                                 | Mitigation                                                                                                                                                  |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Root exclusion also hides a real project file from other Deno tools. | Exclude only the named doctor fixture directory; existing doctor test explicitly reads it and must stay green; survey shows no sibling invalid configs.     |
| `fmt.exclude` may select files differently than top-level exclusion. | Use the documented top-level config-discovery boundary and prove the issue's exact wrapper command, its non-empty count, and a negative formatting control. |
| Module-root arithmetic is off by one directory.                      | Derive from each file URL, assert/read known repo files, and run from `packages/cli` cwd first.                                                             |
| Fixing only doc reads leaves `.llm/tmp` cwd-sensitive.               | Anchor both authoritative doc and run-owned scratch paths in the helper; cleanup remains scoped to the created temp directory.                              |
| Boundary test still passes under one-sided policy drift.             | Separate observable inside/outside ordering plus explicit widen/narrow mutation controls.                                                                   |
| Floating-point equality makes the inside case ambiguous.             | Use exactly representable test values/differences where possible and a deliberately larger outside epsilon; assert order, not raw floating equality.        |
| Publish audit expands into known CLI debt.                           | Record baseline debt and require no new diagnostics; do not edit public CLI files or claim debt closure.                                                    |
| Expensive gate is run without ownership or omitted.                  | S4 cannot pass until the coordinator grants the mutex and the exact command fires.                                                                          |
| Validation churns locks/caches.                                      | Never reload/delete; inspect exact Git status and lock blob before accepting any receipt.                                                                   |

## Arch-debt implications

- No new entry expected.
- Do not close or modify existing CLI/MCP/E2E debt entries.
- Any newly discovered doctrine or JSR finding that cannot be fixed inside the six-file surface is
  `FAIL_DEBT`/rescope, not an implicit waiver.

## Explicit deferrals / non-scope

- No implementation in this turn; no evaluator launch by this thread.
- No full CLI/E2E/runtime execution without the coordinator mutex.
- No docs prose change, fixture repair, wrapper change, CI workflow change, dependency/version
  update, public export change, score-algorithm change, or package reshape.
- No merge, publish, ready flip, issue checkbox mutation, acceptance-evidence block, or phase
  relabel.
- No `deno.lock`, cache, generated asset, or receipt implementation change.

## PLAN-EVAL judgement

**Required.** This is one PR but not a ceremonial three-line plan: it spans the A6 CLI harness and
an A2 publishable MCP member, a root Deno config boundary, executable docs, JSR audits for two
members, bidirectional mutation controls, and a serialized global consumer gate. A wrong exclusion
or path decision can create another false green, and the coordinator explicitly retains plan-gate
authority. The topic supervisor must launch a fresh native opposite-family Fable 5 medium evaluator;
this thread stops after publishing the plan and must not create a self-authored verdict.
