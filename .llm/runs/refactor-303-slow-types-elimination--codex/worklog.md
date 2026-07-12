# Worklog: remove residual slow-type publish carve-outs

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `refactor-303-slow-types-elimination--codex` |
| Branch | `refactor/303-slow-types-elimination` |
| Archetype | 4 — Public DSL / Builder; triggers core also carries Archetype 3 runtime concerns |
| Scope overlays | service (static-only) |

## Design

### Public Surface

- No exported function, type, entrypoint, or runtime behavior changes.
- The only package-facing change is that each checked-in `publish:dry-run` task enforces the normal
  no-slow-types bar without a waiver.
- The shared workspace publisher uses the same bar for dry-run, preflight, and real publish.

### Domain Vocabulary

- Existing public vocabulary remains unchanged; no new type is justified.

### Ports

- None. This slice introduces no external dependency or testability seam.

### Constants

- None. The finite set is the four package paths locked by issue #303.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 1 | Prove all four residual packages and the workspace publisher run without the carve-out and close the stale debt | Four no-flag dry-runs, root dry-run, four doc-lints, scoped wrappers, four test tasks, lock check | Four package `deno.json` files; `.llm/tools/release/publish-workspace.ts`; `.llm/harness/debt/arch-debt.md`; this run directory |

### Deferred Scope

- Issue #303 consolidation remains open by owner direction.
- Plugin dynamic-import portability warnings remain outside the slow-types acceptance item.
- Broader doctrine verdict remediation is unchanged.

### Contributor Path

Future publish exceptions are diagnosed package-locally with `deno publish --dry-run --allow-dirty`;
annotations follow only explicit diagnostics, and an exception requires a named debt record.

## Progress Log

| Date | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-07-12 | 1 | preflight | Required SHA, branch, and clean worktree verified. |
| 2026-07-12 | 1 | research | All four no-flag dry-runs already green; no annotation diagnostics. |
| 2026-07-12 | 1 | plan | Owner-waived PLAN-EVAL recorded; config-only slice locked before implementation. |
| 2026-07-12 | 1 | implementation | Removed four package-task waivers and the independently discovered workspace-wide release waiver; closed four matching debt entries. |
| 2026-07-12 | 1 | validation | Acceptance, scoped quality, tests, and lock hygiene complete. |
| 2026-07-12 | 1 | commit/push | Implementation commit `c85431f6` pushed to `origin/refactor/303-slow-types-elimination`. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Do not touch TypeScript sources | No current slow-type diagnostic exists. | Four raw Deno 2.9 dry-runs; doctrine A1/A2 |
| Close rather than delete debt history | Preserve the accepted-debt audit trail. | Doctrine debt registry and each entry's F-6 close gate |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Four allegedly slow packages are already clean under current analysis | significant | yes |
| PLAN-EVAL owner-waived (carried D1) | minor | yes |
| Root publisher also carried a workspace-wide waiver not named in the brief | significant | yes |

## Gate Results

### Publishability

All commands ran from the named absolute package root with no slow-types flag.

| Package / scope | Command | Result | Notes |
| --- | --- | --- | --- |
| `service` | `deno publish --dry-run --allow-dirty` | PASS (exit 0) | `Success Dry run complete`; no slow-type diagnostic |
| `plugin-triggers-core` | `deno publish --dry-run --allow-dirty` | PASS (exit 0) | `Success Dry run complete`; no slow-type diagnostic |
| `plugin` | `deno publish --dry-run --allow-dirty` | PASS (exit 0) | Two pre-existing unanalyzable dynamic-import warnings; no slow-type diagnostic |
| `contracts` | `deno publish --dry-run --allow-dirty` | PASS (exit 0) | `Success Dry run complete`; no slow-type diagnostic |
| workspace | `rtk proxy deno task publish:dry-run` from `/home/codex/repos/ns-b9-303` | PASS (exit 0) | Re-run after removing the global release-helper waiver; no generic slow-types waiver warning |
| active allowance census | `rg` over the four configs, root config, and workspace publish helper | PASS (exit 1 / zero matches) | No active `--allow-slow-types` argument remains on the acceptance path |

### Documentation publish bar

The repo-native full-export wrapper runs `deno doc --lint` over every configured entrypoint. Its
process exit is 0 even when diagnostics exist, so the verdict below follows the skill's actual bar:
zero combined diagnostics is PASS; nonzero is FAIL.

| Package | Entrypoints | Combined verdict | Diagnostics |
| --- | ---: | --- | ---: |
| `service` | 2 | PASS | 0 |
| `plugin-triggers-core` | 12 | FAIL (pre-existing) | 2 `private-type-ref`, both in `triggers.contract.ts` |
| `plugin` | 13 | FAIL (pre-existing) | 13 `private-type-ref` across contract-base/service oRPC surfaces |
| `contracts` | 4 | FAIL (pre-existing) | 12 `private-type-ref` across contract primitives/CRUD |

These oRPC-bound doc-lint findings do not reproduce as Deno 2.9 slow-type publish failures and did
not require source annotations. Fixing them would be the genuine public-surface redesign the brief
explicitly permits this slice to avoid; they are reported, not hidden.

### Scoped source gates

| Root | Check wrapper | Lint wrapper | Fmt wrapper |
| --- | --- | --- | --- |
| `/home/codex/repos/ns-b9-303/packages/service` | PASS, 40 files / 0 findings | PASS, 40 / 0 | PASS, 40 / 0 |
| `/home/codex/repos/ns-b9-303/packages/plugin-triggers-core` | PASS, 75 / 0 | PASS, 75 / 0 | PASS, 75 / 0 |
| `/home/codex/repos/ns-b9-303/packages/plugin` | PASS, 151 / 0 | PASS, 151 / 0 | PASS, 151 / 0 |
| `/home/codex/repos/ns-b9-303/packages/contracts` | PASS, 20 / 0 | PASS, 20 / 0 | PASS, 20 / 0 |
| `/home/codex/repos/ns-b9-303/.llm/tools/release` | PASS, 21 / 0 | PASS, 21 / 0 | PASS, 21 / 0 |

Each used the absolute repo wrapper path with `--root <absolute-root> --ext ts,tsx`; check evidence
includes `--unstable-kv` as supplied by the wrapper.

### Test suites

| Suite | Result |
| --- | --- |
| `packages/service` | PASS — 77 passed, 0 failed |
| `packages/plugin-triggers-core` | PASS — 38 passed, 0 failed |
| `packages/plugin` | PASS — 74 passed, 0 failed |
| `packages/contracts` | PASS — 5 passed, 0 failed |
| `.llm/tools/release` targeted tests | PASS — 25 passed, 0 failed |

### Fitness, runtime, consumer, and hygiene summary

| Gate | Result | Evidence / notes |
| --- | --- | --- |
| F-6 JSR publishability | PASS | Four package dry-runs plus root workspace dry-run, all exit 0 without a waiver |
| F-7 documentation bar | PARTIAL / recorded | Service PASS; three oRPC-bound surfaces retain the exact private-type-ref counts above |
| F-19 scoped runners | PASS | All five touched roots: check/lint/fmt 0 findings |
| Runtime | N/A | No TypeScript source or runtime behavior changed |
| Consumer | PASS | Whole-workspace publish graph builds successfully |
| `deno.lock` | PASS | `git diff -- deno.lock` empty after all gates |
| Patch whitespace | PASS | `git diff --check` exit 0 |

## Reconcile and handoff

- Reconcile: issue #303 is intentionally not closed; consolidation scope remains. Four T4 debt
  entries are closed because their stated F-6 gate is satisfied.
- No PR was opened, per owner direction.
- Implementation slice: `c85431f6` (`refactor(publish): enforce no-slow-types workspace bar`),
  push succeeded to the requested remote ref.
- IMPL-EVAL remains a separate-session orchestrator responsibility; this Codex implementation lane
  does not self-certify it.
- Evaluator should inspect the release-helper argument removal, the four task strings, and the
  honest doc-lint distinction first.
