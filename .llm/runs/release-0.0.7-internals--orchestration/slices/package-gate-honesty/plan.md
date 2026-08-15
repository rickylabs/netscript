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
  closed or deepened by these twelve edits.

## Axioms in play

| Axiom | Why it matters                                                                                                           |
| ----- | ------------------------------------------------------------------------------------------------------------------------ |
| A1    | Published/exported boundaries remain unchanged; tests and comments describe the actual contract before implementation.   |
| A7    | Use explicit marker semantics and `import.meta`/URL path primitives instead of ambient cwd or implicit config discovery. |
| A8    | Changes stay in existing role-named files plus one narrowly named fixture marker; no new folder is introduced.           |
| A9    | Preserve CLI A6 and MCP A2 package shapes; the leaf profile does not authorize reshaping either.                         |
| A14   | Each repaired guard must have a negative control that proves it can fire; a non-fired command is not green.              |

## Goal

Make three misleading package gates truthful: their canonical commands run from their documented
cwd, configuration discovery cannot consume a deliberately invalid fixture, and the tuned ranking
boundary cannot move materially while tests stay green.

## Exact narrowed edit surface (authoritative)

These are the only product/config paths implementation may edit. Run artifacts under this slice
directory are updated alongside every future slice but are not product scope.

| Path                                                                                    | Justification                                                                                                                                                                                     |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `deno.json`                                                                             | Add the doctor fixture family to root `exclude` only as non-load-bearing protection for native directory-walk tools; wrapper acceptance is owned by the marker mechanism below.                   |
| `packages/cli/e2e/src/application/gates/scaffold/service-env/service-env-gates_test.ts` | Resolve the relative script argument against the already module-derived `REPO_ROOT` before `Deno.stat`; retain the real gate command and existence assertion.                                     |
| `packages/cli/e2e/tests/presentation/quickstart-command-drift_test.ts`                  | Resolve `docs/site/quickstart.vto` from the test module/repository root while retaining exact command-parity assertions.                                                                          |
| `packages/cli/e2e/src/application/gates/scaffold/run-documented-stream-example.ts`      | Resolve the authoritative streams doc and run-owned scratch directory from a module-derived repository root so the semantic example execution works from package cwd.                             |
| `packages/mcp/src/domain/docs/guidance-index.ts`                                        | Record the empirical, non-scale-derived rationale adjacent to `closeScoreGap`; do not change the value or public exports.                                                                         |
| `packages/mcp/tests/guidance-retrieval_test.ts`                                         | Replace the decorative boundary arrangement with observable just-inside and just-outside controls that fail for both widening and narrowing.                                                      |
| `.llm/tools/run-deno-fmt.ts`                                                            | Skip only a marker's own subtree, then batch selected files by effective nearest Deno config before constructing explicit-file argv; preserve non-empty refusal and finding/crash classification. |
| `.llm/tools/run-deno-fmt_test.ts`                                                       | Prove a marked subtree is skipped while an unmarked sibling remains selected, and prove nearest-config groups cannot poison one another.                                                          |
| `.llm/tools/run-deno-lint.ts`                                                           | Apply the same child-only marker and nearest-config batching semantics to lint so the optimized tool family cannot diverge.                                                                       |
| `.llm/tools/run-deno-lint_test.ts`                                                      | Prove marked-skip and unmarked-selection behavior for lint, retaining real lint-finding and empty-selection refusals.                                                                             |
| `packages/mcp/tests/fixtures/doctor/broken/.deno-fmt-lint-ignore`                       | Declare only the deliberately invalid `broken/` subtree excluded from automatic fmt/lint selection; the unmarked `healthy/` sibling remains selected.                                             |
| `packages/mcp/tests/fixtures/doctor/healthy/netscript.config.ts`                        | Formatting-only normalization of the one real finding exposed by honest 114-file selection; preserve the parsed plugin value and valid-project doctor behavior exactly.                           |

These twelve paths are coordinator-authorized. Adding a thirteenth path is rescope and requires
coordinator approval before editing.

## Frozen contract entries deliberately not touched

- `docs/site/durable-workflows/streams.md` — authoritative source is read and executed, not
  rewritten.
- `docs/site/quickstart.vto` — authoritative commands remain unchanged.
- `packages/mcp/tests/fixtures/doctor/broken/deno.json` — must remain deliberately malformed.
- The broad/duplicate `packages/cli/`, `packages/cli`, and `packages/*` entries — no other CLI file,
  package, generated asset, member config, or dependency pin is edited.
- The broad `packages/mcp` entry — no other MCP source, test, fixture, README, entrypoint, export,
  or config is edited.
- No other `.llm/tools/**`, workflow, lock, cache, receipt implementation, Aspire, Docker, or
  release file.

## Hidden scope

- Both publishable members receive JSR audits even though the public export maps do not change.
- The CLI package's known doc-lint/isolated-declaration debt must be reported honestly rather than
  silently converted to pass.
- Docs accuracy and source-format gates still run because two tests consume docs as executable
  contracts even though those docs are read-only.
- Negative controls must show raw non-zero exit and distinguish a real finding from a config crash.
- `scaffold.runtime` is frozen in the incoming contract but the archetype gate matrix classes it
  `n/a` for this surface; the coordinator has explicitly waived it, so it is neither `NOT_RUN` nor
  pending a mutex.

## Locked decisions

| ID  | Decision                                                                                                                                                                     | Rationale                                                                                                                                                                                                                                                                               |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| L1  | Anchor repository-owned CLI test paths with `new URL(..., import.meta.url)` / `fromFileUrl`, not `Deno.cwd()`.                                                               | Module location is stable under both root and package-cwd invocation; process cwd is explicitly the defect.                                                                                                                                                                             |
| L2  | Preserve production gate command arguments; resolve only when the test performs filesystem verification.                                                                     | The runtime gate correctly interprets `GATE_DIR` relative to `context.project.repoRoot`; changing it would expand behavior scope.                                                                                                                                                       |
| L3  | `.deno-fmt-lint-ignore` excludes only the directory that carries it; both wrappers group all remaining files by effective nearest Deno config before batching explicit argv. | The child-only marker removes exactly `broken/netscript.config.ts` (115→114) while retaining all four unmarked healthy files. Config-aware batching prevents one config from poisoning another; lint becomes green and fmt honestly reports the one genuinely unformatted healthy file. |
| L4  | The malformed fixture and its existing failing-doctor assertion remain unchanged.                                                                                            | Validating the fixture would destroy the behavior under test and produce a false green.                                                                                                                                                                                                 |
| L5  | Keep `closeScoreGap = 0.5`; add one observable just-inside case at exactly the boundary and one early-sorting just-outside case at `0.5 + epsilon`.                          | Narrowing breaks the inside reorder; widening breaks the outside score order. Both directions become observable.                                                                                                                                                                        |
| L6  | Record the empirical rationale next to the policy: observed gap ≈0.3019801982, headroom ≈0.1980198018, regeneration movement ≈0.0748587452.                                  | The value is tuned from observed headroom, not mathematically derived from an arbitrary score scale.                                                                                                                                                                                    |
| L7  | No new package public export, dependency, port, runtime asset, or runtime read; wrapper behavior changes only at selection.                                                  | The work is regression hardening, not API or architecture change.                                                                                                                                                                                                                       |
| L8  | Evidence commands fire through structured wrappers/`run-gate.ts`; empty selection, crash, NOT_RUN, or a waived gate reported as green is not PASS.                           | This leaf exists to eliminate false verdicts.                                                                                                                                                                                                                                           |
| L9  | Do not run `scaffold.runtime`, Aspire, Docker, `e2e:cli`, or any runtime smoke for this leaf.                                                                                | The matrix classes the expensive gate `n/a` and the coordinator explicitly waived it; no lease will be granted.                                                                                                                                                                         |
| L10 | Normalize `doctor/healthy/netscript.config.ts` with Deno formatting only; no value, schema, or behavioral change is permitted.                                               | Coordinator granted the twelfth path because the 114-file gate correctly exposed one genuinely unformatted real file. Scratch imports produce identical `{ "plugins": ["workers"] }`; fmt/lint are green and doctor remains 4/4.                                                        |

## Open-decision sweep

| Decision                         | Status       | Notes                                                                                                                          |
| -------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| Invalid-fixture boundary         | resolved now | Child-only marker plus nearest-config batching in both wrappers; root `exclude` is non-load-bearing only.                      |
| Test path mechanism              | resolved now | L1/L2; module-derived roots only.                                                                                              |
| Close-score boundary data        | resolved now | L5/L6; both directions observable and rationale exact.                                                                         |
| Public API/export changes        | resolved now | None permitted.                                                                                                                |
| `scaffold.runtime` applicability | resolved now | Gate-matrix `n/a`; coordinator waiver recorded; it must not run.                                                               |
| Healthy fixture formatting       | resolved now | Coordinator granted the exact formatting-only twelfth path after the scratch proof; no semantic/config-value delta is allowed. |

No unresolved decision would cause implementation rework. The twelve-path plan has an executed,
reachable green acceptance state; implementation remains prohibited until fresh Tier-A approval and
separate-session PLAN-EVAL cycle 2 `PASS`.

## Ordered implementation slices

Every slice also updates `worklog.md` and `context-pack.md`, then is committed, pushed, and
commented before the next slice. No implementation begins before separate-session PLAN-EVAL `PASS`.

| #  | What it proves                                                                                                         | Exact product/config files                                                                                                                                                                                                                                                           | Proving gates                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| -- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S1 | MCP fmt/lint isolate deliberately invalid config without removing the unmarked healthy sibling from verification.      | `deno.json`; `.llm/tools/run-deno-fmt.ts`; `.llm/tools/run-deno-fmt_test.ts`; `.llm/tools/run-deno-lint.ts`; `.llm/tools/run-deno-lint_test.ts`; `packages/mcp/tests/fixtures/doctor/broken/.deno-fmt-lint-ignore`; `packages/mcp/tests/fixtures/doctor/healthy/netscript.config.ts` | Wrapper tests prove child-only marked skip, unmarked-sibling selection, and nearest-config batching. After formatting-only normalization, both exact no-extra-flag wrappers return raw exit 0 at 114 selected files in two config batches; fmt has `failedBatches: 0`. All four healthy TS files are individually proven selected. Doctor stays 4/4; malformed config hash remains `6815999d…37361`; parsed config meaning is equal; separate real fmt/lint defects are detected and restored byte-exactly. |
| S2 | The canonical package-cwd CLI task no longer has three root-relative `NotFound` failures and no assertion is weakened. | The three exact CLI files listed above                                                                                                                                                                                                                                               | Structured targeted three-file test first (6/6), then exact `deno task --cwd packages/cli test`; scoped check/lint/fmt on the three owned TS files; docs-source-format and docs-accuracy. The helper's focused semantic unit test is the final consumer proof; the matrix-waived runtime gate is not substituted or run.                                                                                                                                                                                    |
| S3 | `closeScoreGap` is pinned from both sides and its empirical rationale ships with the policy.                           | `packages/mcp/src/domain/docs/guidance-index.ts`; `packages/mcp/tests/guidance-retrieval_test.ts`                                                                                                                                                                                    | Structured targeted guidance test; controlled `0.5 -> 5` and `0.5 -> below-inside-gap` mutations each raw non-zero, followed by exact restoration and green rerun; MCP scoped check/test/lint/fmt; quality gate.                                                                                                                                                                                                                                                                                            |
| S4 | The integrated head meets the applicable frozen proving contract and publish/docs claims are honest.                   | No new product/config files; run artifacts/evidence only                                                                                                                                                                                                                             | Commit-bound `check`, `test`, `publish-dry-run`, `quality-job`, docs-source-format, docs-accuracy, and per-member JSR suite. `scaffold.runtime` is recorded `n/a` by coordinator waiver and is not executed.                                                                                                                                                                                                                                                                                                |

## JSR audit plan per touched publishable member

| Member           | Planned public surface delta                                                       | Exact-pin audit                                                                                | Isolated-declaration / publish audit                                                                                                                                             | Runtime asset / `import.meta` audit                                                                                                                                |
| ---------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `@netscript/cli` | None; all edits are under publish-excluded `e2e/`.                                 | Confirm six `@netscript/*` imports remain exact `0.0.6`; run `check:netscript-jsr-specifiers`. | Full export-map doc-lint and package/root publish dry-run; report existing `isolatedDeclarations: false` and doc-completeness debt as baseline, with no new diagnostic.          | Verify changed E2E-only module-relative reads do not enter the published file list; reject any published `import.meta`/filesystem asset read.                      |
| `@netscript/mcp` | None; policy stays internal. One comment in published `src/**`, one excluded test. | Confirm aspire and telemetry subpaths remain exact `0.0.6`; run exact-pin scan.                | `audit-jsr-package.ts --root packages/mcp`, full export-map doc-lint, targeted root isolated-declaration check, member/root publish dry-run, and published file-list inspection. | Static scan of the changed published source must show no `import.meta`, `fromFileUrl`, `Deno.read*`, or runtime asset dependency; release preflight remains green. |

For both, reject new slow types, self-bare imports, upstream re-exports, dependency ranges, runtime
asset reads, or publish-list drift. A dry-run is necessary but not sufficient; S4 combines the
applicable static, test, docs, quality, and publish evidence while recording the runtime gate `n/a`.

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

| Order | Frozen gate           | Command/check shape                                                                                                                                                                    | Passing condition                                                                                                               |
| ----- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| 1     | check                 | Root/task structured check plus scoped owned-file checks (`--unstable-kv` where targeted).                                                                                             | Fired at current head; non-empty selection; exit 0.                                                                             |
| 2     | test                  | Structured targeted tests, MCP package tests, then exact CLI package task.                                                                                                             | All execute; no ignore/skip added; exit 0.                                                                                      |
| 3     | quality-job           | `deno task ci:quality` plus `deno task quality:gate`.                                                                                                                                  | Both exit 0; no new allowance/cast/lint-ignore.                                                                                 |
| 4     | docs-source-format    | Scoped formatter over the two read-only docs sources, three CLI TS files, MCP policy/test TS files, and both wrapper implementation/test pairs; never a directory containing receipts. | Every intended set is non-empty; zero findings/crashes; the marker is plain text and the malformed JSON remains byte-identical. |
| 5     | docs-accuracy         | `deno task docs:accuracy`.                                                                                                                                                             | Exit 0 with sources unchanged.                                                                                                  |
| 6     | publish-dry-run / JSR | Root/member publish dry-runs, full export-map doc-lint, per-member JSR audits, exact-pin and release preflight scans.                                                                  | No new warning/finding, correct publish lists, isolated-declaration expectations met or named baseline debt unchanged.          |
| 7     | `scaffold.runtime`    | `n/a` — gate-matrix classification and explicit coordinator waiver for this surface.                                                                                                   | Not executed; no lease requested; focused semantic coverage is the applicable proof.                                            |

## Risk register

| Risk                                                                                                    | Mitigation                                                                                                                                                                                                                                                                     |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Marker handling becomes a blanket `tests/fixtures`/parent skip or silently empties selection.           | The marker applies only to its own directory; tests pair a marked subtree with an equivalent unmarked sibling and assert the sibling remains selected. Wrapper empty-selection refusal remains intact.                                                                         |
| Config-aware batching reveals a real finding and implementers are tempted to exclude its unmarked file. | Require 114 selected files. The only allowed drop is `broken/netscript.config.ts`; tests pin all four healthy files as selected. Normalize the granted healthy file with Deno formatting only and prove parsed meaning/doctor behavior unchanged; never add another exclusion. |
| Module-root arithmetic is off by one directory.                                                         | Derive from each file URL, assert/read known repo files, and run from `packages/cli` cwd first.                                                                                                                                                                                |
| Fixing only doc reads leaves `.llm/tmp` cwd-sensitive.                                                  | Anchor both authoritative doc and run-owned scratch paths in the helper; cleanup remains scoped to the created temp directory.                                                                                                                                                 |
| Boundary test still passes under one-sided policy drift.                                                | Separate observable inside/outside ordering plus explicit widen/narrow mutation controls.                                                                                                                                                                                      |
| Floating-point equality makes the inside case ambiguous.                                                | Use exactly representable test values/differences where possible and a deliberately larger outside epsilon; assert order, not raw floating equality.                                                                                                                           |
| Publish audit expands into known CLI debt.                                                              | Record baseline debt and require no new diagnostics; do not edit public CLI files or claim debt closure.                                                                                                                                                                       |
| Waived expensive gate is accidentally run or reported `NOT_RUN`.                                        | Record `scaffold.runtime` as coordinator-waived `n/a`; do not request a lease or invoke Aspire, Docker, or `e2e:cli`.                                                                                                                                                          |
| Validation churns locks/caches.                                                                         | Never reload/delete; inspect exact Git status and lock blob before accepting any receipt.                                                                                                                                                                                      |

## Arch-debt implications

- No new entry expected.
- Do not close or modify existing CLI/MCP/E2E debt entries.
- Any newly discovered doctrine or JSR finding that cannot be fixed inside the twelve-path surface
  is `FAIL_DEBT`/rescope, not an implicit waiver.

## Explicit deferrals / non-scope

- No implementation in this turn; no evaluator launch by this thread.
- No Aspire, Docker, `e2e:cli`, `scaffold.runtime`, or other runtime smoke; the expensive gate is
  coordinator-waived `n/a`, not pending.
- No docs prose change, malformed-fixture repair, other wrapper change, CI workflow change,
  dependency/version update, public export change, score-algorithm change, or package reshape.
- No merge, publish, ready flip, issue checkbox mutation, acceptance-evidence block, or phase
  relabel.
- No `deno.lock`, cache, generated asset, or receipt implementation change.

## PLAN-EVAL judgement

**Required.** This is one PR but not a ceremonial three-line plan: it spans the A6 CLI harness and
an A2 publishable MCP member, a root Deno config boundary, executable docs, JSR audits for two
members, bidirectional mutation controls, and marker-aware optimized tooling. A wrong exclusion or
path decision can create another false green, and the coordinator explicitly retains plan-gate
authority. The topic supervisor must launch a fresh native opposite-family Fable 5 medium evaluator;
this thread stops after publishing the plan and must not create a self-authored verdict.
