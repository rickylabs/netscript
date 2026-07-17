# Evaluation: fix-e2e-prod-min-dep-age--p0-prod-e2e

## Metadata

| Field          | Value                                                    |
| -------------- | -------------------------------------------------------- |
| Run ID         | `fix-e2e-prod-min-dep-age--p0-prod-e2e`                  |
| Target         | Published JSR `deno x` minimum-dependency-age override   |
| Archetype      | `6 — CLI / Tooling`                                      |
| Scope overlays | `docs (README behavioral clarification)`                 |
| Evaluator      | `claude-openrouter / qwen3.7-max / 2026-07-17`           |

## Process Verification

| Check                                  | Result | Evidence                                                                                                                                  |
| -------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Plan-Gate passed before implementation | PASS   | `plan-eval.md` verdict = `PASS`; committed as `4d9ca0f8` (2026-07-17). Implementation commit `7bc751ea` is strictly after.                |
| Design section exists in worklog       | PASS   | `worklog.md` §"Design" present with public surface, domain vocabulary, ports, constants, commit slices, deferred scope, contributor path. |
| Commit slices match design plan        | PASS   | 1 slice (S1) — matches `plan.md` §"Slice" and `worklog.md` §"Design" commit-slice entry.                                                  |
| Each slice has a passing gate          | PASS   | Focused test, scoped check, lint, fmt, quality:scan, arch:check — all independently verified (see Static/Fitness Gates below).            |
| No speculative seams (unused files)    | PASS   | Changed files: `plugin-install-gates.ts` (used in gate factory), `scaffold-gates_test.ts` (test runner), `README.md` (docs). Zero orphans. |
| Constants used for finite vocabularies | PASS   | Existing `PACKAGE_SOURCE.JSR`, `GATE.SCAFFOLD_PLUGIN_AI_LIFECYCLE`; no new finite-domain vocabulary introduced.                           |

## Static Gates

| Gate             | Command or check                                                                                  | Result | Evidence                                                                                                          | Notes                                            |
| ---------------- | ------------------------------------------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| Narrow typecheck | `deno run .llm/tools/run-deno-check.ts --root packages/cli/e2e --ext ts,tsx`                     | PASS   | 88 files selected, 1 batch, 0 findings. `--unstable-kv` carried by wrapper.                                      |                                                  |
| Lint             | `deno run .llm/tools/run-deno-lint.ts --file …plugin-install-gates.ts --file …scaffold-gates_test.ts` | PASS   | 2 files selected, 1 batch, 0 occurrences.                                                                         |                                                  |
| Format           | `deno run .llm/tools/run-deno-fmt.ts --file …plugin-install-gates.ts --file …scaffold-gates_test.ts` | PASS   | 2 files selected, 1 batch, 0 findings.                                                                            |                                                  |
| Focused test     | `deno test --allow-all packages/cli/e2e/tests/application/gates/scaffold-gates_test.ts`           | PASS   | 5 passed \| 0 failed. "published AI lifecycle gate reuses the published CLI version … ok (247µs)."                | Full-array `assertEquals` asserts the 10-element command array. |
| Quality scan     | `deno task quality:scan`                                                                          | PASS   | All scanned package roots: FAIL=0. 7 pre-existing allowances (none in `packages/cli/e2e/`).                       |                                                  |
| Doc lint         | n/a                                                                                               | N/A    | No `mod.ts` or JSDoc surface changed.                                                                             |                                                  |
| Publish dry-run  | n/a                                                                                               | N/A    | No package export, manifest, or dependency changes.                                                               |                                                  |
| Link/path check  | `README.md` inline prose                                                                          | PASS   | Added sentence at line 53 is self-contained and does not reference paths or URLs.                                 |                                                  |

## Fitness Gates

| Gate      | Function                         | Result         | Evidence                                                                                                                                                       | Violations |
| --------- | -------------------------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| F-1       | File-size lint                   | PASS           | Changed files: `plugin-install-gates.ts` ≈ 140 LOC, `scaffold-gates_test.ts` ≈ 120 LOC. Both within cap.                                                     |            |
| F-2       | Helper-reinvention scan          | PASS           | Single flag addition to existing builder; no new utility introduced.                                                                                           |            |
| F-3       | Layering check                   | PASS           | `plugin-install-gates.ts` stays in `application/gates/scaffold/`; no cross-layer import.                                                                       |            |
| F-5       | Public surface audit             | N/A            | E2E suite is not a published package.                                                                                                                          |            |
| F-6       | JSR publishability gate          | N/A            | No `deno.json` exports, `mod.ts`, or JSDoc change.                                                                                                             |            |
| F-10      | Test-shape audit                 | PASS           | The strengthened assertion uses `assertEquals(command, [...])` — a full structural match, not a snapshot string.                                                |            |
| F-16      | Folder-cardinality lint          | PASS           | No files added; folder membership unchanged.                                                                                                                    |            |
| F-17/F-18 | Sub-barrel + abstract co-loc    | N/A            | No barrel files or abstract classes touched.                                                                                                                    |            |
| F-CLI-*   | Archetype-6 specific             | PENDING_SCRIPT | All F-CLI-* gates have no dedicated script (per ARCHETYPE-6 §"Fitness Gates"). `deno task arch:check` backs them: exit 0, WARN/INFO only (pre-existing, unrelated). |            |

## Runtime Gates

| Gate     | Validation | Result | Evidence                                                                                                   |
| -------- | ---------- | ------ | ---------------------------------------------------------------------------------------------------------- |
| Prod E2E | n/a        | N/A    | This is a bounded builder fix; the production workflow itself will exercise the corrected gate after merge. |

## Consumer Gates

| Consumer     | Validation | Result | Evidence                                                                     |
| ------------ | ---------- | ------ | ---------------------------------------------------------------------------- |
| Generated workspaces | n/a | N/A | No generated output, template, or scaffold shape changed.                     |

## Anti-Pattern Check

| AP    | Status | Evidence                                                                                     | Notes                                            |
| ----- | ------ | -------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| AP-1  | N/A    | No command pipeline or template monolith change.                                             |                                                  |
| AP-4  | CLEAR  | No cross-package implementation inheritance. Single flag addition in existing gate builder.  | Plan §"In-scope anti-patterns".                   |
| AP-5  | CLEAR  | No new base or derived class. No lattice change.                                             | Plan §"In-scope anti-patterns".                   |
| AP-6  | N/A    | No base-with-concrete orchestration.                                                         |                                                  |
| AP-11 | N/A    | No `Deno.*` calls outside adapters.                                                          |                                                  |
| AP-18 | N/A    | No generated output snapshot. Test asserts a typed string array.                              |                                                  |
| AP-19 | N/A    | README already documents permissions; new sentence scopes the exception precisely.            |                                                  |
| AP-21 | N/A    | No folder-shape change.                                                                      |                                                  |
| AP-22 | N/A    | No barrel file change.                                                                       |                                                  |
| AP-23 | N/A    | No composition change.                                                                       |                                                  |
| AP-24 | N/A    | No tagged-union variant change.                                                              |                                                  |
| AP-25 | N/A    | No side effect introduced.                                                                   |                                                  |

## Arch-Debt Delta

| Metric                | Count | Evidence                                                                                          |
| --------------------- | ----- | ------------------------------------------------------------------------------------------------- |
| New entries           | 0     | No doctrine violation introduced.                                                                 |
| Resolved entries      | 0     | No existing debt entry affected by this slice.                                                    |
| Deepened violations   | 0     | `arch:check` WARN list identical to `origin/main` baseline.                                       |
| Unrecorded violations | 0     | Deferred shipped-CLI call sites are explicitly scoped as follow-up (PR body §"Follow-up"), not debt. |

## Findings

No blocking findings.

| Severity | Finding | Evidence | Required action |
| -------- | ------- | -------- | --------------- |
| —        | —       | —        | —               |

### Sweep verification (independent evaluator re-run)

The evaluator independently verified the published-JSR command sweep across every file under `packages/cli/e2e/src/`:

- `gate-factory.ts` `cli()` (lines 14-26): `['deno', 'run', '-A', '--minimum-dependency-age=0', cliEntrypoint, ...]` when entrypoint starts with `jsr:@netscript/cli@`. ✅
- `gate-factory.ts` `denoCommand()` (lines 34-42): `['deno', subcommand, '--minimum-dependency-age=0', ...args]` when `packageSource === PACKAGE_SOURCE.JSR`. ✅
- `plugin-install-gates.ts` plugin install (lines 62-64): JSR mode delegates to `cli()` above. ✅
- `plugin-install-gates.ts` AI lifecycle (lines 115-126): `['deno', 'x', '-A', '--minimum-dependency-age=0', specifier, 'add', 'tool', ...]` when JSR mode. ✅ **The fix.**
- `plugin-install-gates.ts` local-mode (lines 127-136): `['deno', 'run', '-A', join(repoRoot, ...)]` — local files, not published JSR. ✅ N/A.
- `prepare-flow-b-fixture.ts` workers CLI (lines 136-144): `['run', '-A', '--minimum-dependency-age=0', workersCli, ...]`. ✅ Pre-existing.
- `prepare-flow-b-fixture.ts` cache warmup (lines 314-317): `['cache', '--minimum-dependency-age=0', ...]`. ✅ Pre-existing.
- `runtime-gates.ts`, `otel-gates.ts`, `database-gates.ts`, `scaffold-gates.ts`: all `deno run`/`deno eval`/`deno --version`/`deno task` targeting local files or tasks — not published `jsr:@netscript/*` targets. ✅ N/A.

No unprotected published-JSR execution found in the E2E suite.

### Deferred shipped-CLI call sites (independent spot-check)

| File | Line | Command | Status |
| ---- | ---- | ------- | ------ |
| `packages/cli/src/public/features/plugins/dispatch/dispatch-plugin-verb.ts` | 102 | `['x', '-A', resolvePluginCliSpecifier(...), verb, ...]` | Confirmed present without override; correctly deferred. |
| `packages/cli/src/public/features/plugins/ai/ai-plugin-command.ts` | 101 | `['x', '-A', AI_CLI_SPECIFIER, ...]` | Confirmed present without override; correctly deferred. |
| `packages/cli/src/public/features/agent/init/init-agent.ts` | 119-122 | `['run', '-A', netscriptJsrSpecifier('cli'), 'agent', 'mcp', ...]` | Confirmed present without override; correctly deferred. |

All three deferred sites match the exact call sites documented in `research.md` §"Deferred user-facing window" and the PR body §"Follow-up: user-facing window." None are in scope for this PR.

### `deno.lock` hygiene

`git diff origin/main...HEAD -- deno.lock` — empty. No lock churn. ✅

## Lessons for Promotion

| Lesson | Pattern | Applies to | Confidence |
| ------ | ------- | ---------- | ---------- |
| — | — | — | — |

## Verdict

| Field     | Value  |
| --------- | ------ |
| Verdict   | `PASS` |
| Rationale | All applicable gates pass with independent evaluator evidence. The single published-JSR `deno x` command (`plugin-install-gates.ts` AI lifecycle) now carries `--minimum-dependency-age=0` immediately after `-A`, consistent with the existing gate-factory convention. The anchored unit test asserts the complete 10-element command array, directly mitigating the "flag parsed as script args" risk. The README precisely scopes the exception to release E2E. The deferred shipped-CLI call sites are correctly documented and excluded. No plan drift, no doctrine drift, no lock churn, no speculative seams. |
