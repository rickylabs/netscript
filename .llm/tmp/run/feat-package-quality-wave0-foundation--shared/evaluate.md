# Evaluation: @netscript/shared

## Metadata

| Field | Value |
|-------|-------|
| Run ID | `feat-package-quality-wave0-foundation--shared` |
| Target | `packages/shared` / `@netscript/shared` |
| Archetype | `1 - small contract` |
| Scope overlays | `docs` |
| Evaluator | separate evaluator session, 2026-06-05 |

## Process Verification

| Check | Result | Evidence |
|-------|--------|----------|
| Design section exists in worklog | PASS | `worklog.md` has `## Design` with public surface, domain vocabulary, ports, constants, commit slices, deferred scope, and contributor path. |
| Commit slices match design plan | PASS | Current ancestry is `2639d4e`, `37b935c`, `cc3b8f0`, `633bc43`, `9c64021`; `commits.md` now lists all five. Slice order still follows baseline/source-docs/fix-artifact progression. |
| Each slice has a passing gate | PASS | Worklog records baseline, package gates, review-fix gates, and docs validation; evaluator reran targeted package gates below. |
| No speculative seams (unused files) | PASS | Published files are reachable through `mod.ts` -> `src/public/mod.ts`; legacy `utils/` is excluded from publish and retained only for deferred workspace compatibility. |
| Constants used for finite vocabularies | PASS | `src/domain/constants.ts` backs error codes, inspection status, and pagination defaults; schemas import the constants. |

## Static Gates

| Gate | Command or check | Result | Evidence | Notes |
|------|------------------|--------|----------|-------|
| Narrow typecheck | `cd packages/shared && npx --yes deno check mod.ts` | PASS | Command completed in evaluator session. | Used npm Deno 2.8.2. |
| Slice typecheck | `npx --yes deno task check` | NOT_RUN | Fails loading `https://jsr.io/@std/path/meta.json`. | Environment/DNS blocker to `jsr.io`, not a local shared code failure. |
| Format | `npx --yes deno fmt --check packages/shared/mod.ts packages/shared/src packages/shared/README.md packages/shared/docs packages/shared/utils/mod.ts packages/shared/utils/zod/mod.ts .llm/harness/debt/arch-debt.md .llm/tmp/run/feat-package-quality-wave0-foundation--shared/commits.md` | PASS | Checked 32 files. |  |
| Lint | `npx --yes deno lint packages/shared/mod.ts packages/shared/src` | PASS | Checked 11 files. |  |
| Doc lint | `npx --yes deno doc --lint packages/shared/mod.ts` | PASS | Checked 1 file. |  |
| Package tests | `cd packages/shared && npx --yes deno test --allow-all .` | PASS | 2 tests passed. |  |
| Publish dry-run | `cd packages/shared && npx --yes deno publish --dry-run --allow-dirty` | PASS | Simulated publish succeeds with 0 slow-types; publish set includes README/docs/src and excludes `utils/**`. |  |
| Standards script | `npx --yes deno run --allow-read .llm/tools/fitness/check-netscript-standards.ts --root packages/shared --text` | NOT_RUN | Fails loading `https://jsr.io/@std/fs/meta.json`. | Environment/DNS blocker to `jsr.io`. |
| STANDARDS §7 docs tree/frontmatter | Manual required-file/frontmatter check | PASS | All required `docs/`, `recipes/`, `reference/`, and `advanced/` pages exist; each has `title`, `description`, `package`, and `order` frontmatter. | Prior FAIL_FIX finding fixed. |
| README length | `wc -l packages/shared/README.md` | PASS | 366 lines. | Exceeds 150-line requirement. |

## Fitness Gates

| Gate | Function | Result | Evidence | Violations |
|------|----------|--------|----------|------------|
| F-1 | File-size lint | PASS | Largest published source file is `src/domain/schemas.ts` at 223 LOC. | None in published surface. |
| F-5 | Public surface audit | PASS | Root `mod.ts` is barrel-only to curated `src/public/mod.ts`; `deno doc --lint` passes. | None blocking. |
| F-6 | JSR publishability | PASS | `deno publish --dry-run --allow-dirty` passes with 0 slow-types. | None. |
| F-7 | Doc-score gate | PASS | `deno doc --lint packages/shared/mod.ts`; §7 docs tree manual check passes. | None. |
| F-8 | Workspace lib check | PASS | `packages/shared/deno.json` includes `deno.unstable` in `compilerOptions.lib`. | None. |
| F-10 | Test-shape audit | PASS | `src/domain/errors_test.ts` uses Deno tests for changed helper behavior. | README doctest runner remains a broader standards/tooling gap, not newly introduced by this fix. |
| F-11 | Forbidden-folder lint | DEBT_ACCEPTED | `packages/shared/utils/` remains unpublished for `@shared/utils` consumers; debt/drift record residual compatibility. | Physical legacy folder remains outside published surface. |
| F-12 | Naming-convention lint | PASS | New `src/**` files use role-named folders and kebab-case names where applicable. | None in new published surface. |
| F-14 | Console-log lint | PASS | No `console.*` in published source; only README/JSDoc examples mention `console.log`. | None. |
| F-15 | Re-export-upstream lint | PASS | `src/public/mod.ts` exports package-owned symbols and does not re-export Zod, oRPC, or `@std/*`. | None. |
| F-16 | Folder-cardinality lint | PASS | `src/domain` has 6 children; other new source folders are below cap. | None. |
| F-17 | Abstract-derived co-location | N/A | A1 small contract has no inheritance hierarchy. | None. |
| F-18 | Sub-barrel lint | PASS | Allowed barrels only: root `mod.ts`, curated `src/public/mod.ts`, and legacy unpublished utility barrels. | None blocking in published surface. |

## Runtime Gates

| Gate | Validation | Result | Evidence |
|------|------------|--------|----------|
| Runtime behavior | A1 small-contract package | N/A | No runtime lifecycle/state introduced. |

## Consumer Gates

| Consumer | Validation | Result | Evidence |
|----------|------------|--------|----------|
| Workspace imports | `npx --yes deno task check` | NOT_RUN | Blocked by `jsr.io` DNS loading `@std/path`, not a local shared type error. |
| Published package contents | Publish simulation file list | PASS | Publish dry-run includes README, complete docs tree, `deno.json`, `mod.ts`, and `src/**`; excludes `utils/**`. |

## Anti-Pattern Check

| AP | Status | Evidence | Notes |
|----|--------|----------|-------|
| AP-1 | CLEAR | Published files are below doctrine thresholds; `utils/datetime.ts` is deleted. |  |
| AP-2 | CLEAR | No shared datetime wrapper remains in `mod.ts`, `src/**`, or `utils/mod.ts`. | Prior debt updated to partially closed. |
| AP-7 | CLEAR | Factories use options objects rather than telescoping positional parameters. |  |
| AP-9 | CLEAR | Shared helpers are explicit schema factories and contract primitives. |  |
| AP-13 | CLEAR | No `console.*` in published source. |  |
| AP-14 | CLEAR | No upstream package re-export in `src/public/mod.ts`. |  |
| AP-15 | CLEAR | No `I*`/`*T` naming found in the new public surface. |  |
| AP-16 | DEBT_ACCEPTED | `packages/shared/utils/` remains, unpublished, for later-wave consumers. | Covered by `arch-debt.md` shared entry and drift. |
| AP-20 | CLEAR | `deno.unstable` is present in package `compilerOptions.lib`. |  |
| Other APs | N/A | Not affected by A1 package scope. |  |

## Arch-Debt Delta

| Metric | Count | Evidence |
|--------|-------|----------|
| New entries | 0 | No new `arch-debt.md` entries required. |
| Resolved entries | 0 partial | Shared AP-2 entry now says datetime is partially closed: `utils/datetime.ts` deleted; residual unpublished `utils/` compatibility remains. |
| Deepened violations | 0 | Published surface no longer includes `utils` or datetime anti-helper. |
| Unrecorded violations | 0 | Remaining physical `utils/` compatibility is recorded as drift/debt. |

## Findings

| Severity | Finding | Evidence | Required action |
|----------|---------|----------|-----------------|
| none | No blocking findings. | Prior FAIL_FIX findings for docs tree/frontmatter, commit tracking, and shared datetime debt are fixed in the current tree/artifacts. | None. |

## Lessons for Promotion

| Lesson | Pattern | Applies to | Confidence |
|--------|---------|------------|------------|
| Manual §7 docs verification matters | Standards script can be blocked by network or not cover the complete docs skeleton; evaluators should verify required files and frontmatter directly. | docs overlay + package README/docs work | high |

## Verdict

| Field | Value |
|-------|-------|
| Verdict | `PASS` |
| Rationale | Approved scope is complete for `@netscript/shared`; targeted type, format, lint, doc, test, and publish gates pass; `jsr.io` DNS failures are environment blockers for broader standards/workspace reruns; prior FAIL_FIX findings are resolved and residual unpublished `utils/` compatibility is accepted debt. |
