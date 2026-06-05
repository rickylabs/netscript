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
| Design section exists in worklog | PASS | `worklog.md` has `## Design` with public surface, vocabulary, constants, slices, deferred scope, contributor path. |
| Commit slices match design plan | FAIL | Design has 3 slices; current ancestry includes `2639d4e`, `37b935c`, `cc3b8f0`, `633bc43`, while `commits.md` omits `37b935c` and `633bc43` and lists `27b4bf3` not present in current local ancestry. |
| Each slice has a passing gate | PASS | Source/docs gates recorded in `worklog.md`; independent targeted gates below pass except environment-blocked JSR DNS gates. |
| No speculative seams (unused files) | PASS | Published files are reachable from `mod.ts`; legacy `utils/` remains workspace compatibility and is excluded from publish. |
| Constants used for finite vocabularies | PASS | `constants.ts` backs error codes, inspection status, and pagination defaults; schemas import the constants. |

## Static Gates

| Gate | Command or check | Result | Evidence | Notes |
|------|------------------|--------|----------|-------|
| Narrow typecheck | `cd packages/shared && npx --yes deno check mod.ts` | PASS | Command completed in evaluator session. | Used npm Deno 2.8.2 because no system `deno`. |
| Slice typecheck | `npx --yes deno task check` | NOT_RUN | Fails loading `https://jsr.io/@std/path/meta.json`. | Environment blocker/DNS to `jsr.io`, not a shared code failure. |
| Format | `npx --yes deno fmt --check packages/shared/mod.ts packages/shared/src packages/shared/README.md packages/shared/docs packages/shared/utils/mod.ts packages/shared/utils/zod/mod.ts` | PASS | Checked 19 files. |  |
| Lint | `npx --yes deno lint packages/shared/mod.ts packages/shared/src` | PASS | Checked 11 files. |  |
| Doc lint | `npx --yes deno doc --lint packages/shared/mod.ts` | PASS | Checked 1 file. |  |
| Publish dry-run | `cd packages/shared && npx --yes deno publish --dry-run --allow-dirty` | PASS | Simulated publish; 0 slow-types; `utils/**` excluded. |  |
| Package tests | `cd packages/shared && npx --yes deno test --allow-all .` | PASS | 2 tests passed. |  |
| Standards script | `npx --yes deno run --allow-read tools/fitness/check-netscript-standards.ts --root packages/shared --text` | NOT_RUN | Fails loading `https://jsr.io/@std/fs/meta.json`. | Environment blocker/DNS to `jsr.io`. |
| Link/path check | Manual docs tree check | FAIL | `docs/` lacks `getting-started.md`, `advanced/`, and reference pages required by `STANDARDS.md` §7; docs pages also lack required frontmatter. | Plan explicitly required `/docs` per §7. |

## Fitness Gates

| Gate | Function | Result | Evidence | Violations |
|------|----------|--------|----------|------------|
| F-1 | File-size lint | PASS | Largest published source file is `src/domain/schemas.ts` at 223 LOC. | None in published surface. |
| F-5 | Public surface audit | PASS | Root `mod.ts` is barrel-only to curated `src/public/mod.ts`; `deno doc --lint` passes. | None blocking. |
| F-6 | JSR publishability | PASS | `deno publish --dry-run --allow-dirty` passes with 0 slow-types. | None. |
| F-7 | Doc-score gate | PASS | `deno doc --lint packages/shared/mod.ts` passes. | Package docs structure still incomplete under plan scope. |
| F-8 | Workspace lib check | PASS | `packages/shared/deno.json` includes `deno.unstable` in `compilerOptions.lib`. | None. |
| F-10 | Test-shape audit | PASS | `src/domain/errors_test.ts` has Deno tests for changed helper behavior. | Broader README doctest standard not implemented, but outside current tooling. |
| F-11 | Forbidden-folder lint | DEBT_ACCEPTED | `packages/shared/utils/` remains unpublished for `@shared/utils` consumers; debt/drift recorded in `arch-debt.md` and `drift.md`. | Physical folder remains. |
| F-12 | Naming-convention lint | PASS | File names under new `src/**` are role-named and kebab-case where applicable. | None in new published surface. |
| F-14 | Console-log lint | PASS | No `console.*` in published source; `console.log` only in JSDoc/README examples. | None. |
| F-15 | Re-export-upstream lint | PASS | Public surface does not re-export Zod, oRPC, or `@std/*`. | None. |
| F-16 | Folder-cardinality lint | PASS | `src/domain` has 6 children; other new source folders are below cap. | None. |
| F-17 | Abstract-derived co-location | N/A | A1 small contract has no classes/inheritance. | None. |
| F-18 | Sub-barrel lint | PASS | Only allowed barrels: root `mod.ts`, curated `src/public/mod.ts`, legacy unpublished `utils` barrels. | None blocking in published surface. |

## Runtime Gates

| Gate | Validation | Result | Evidence |
|------|------------|--------|----------|
| Runtime behavior | A1 small-contract package | N/A | No runtime lifecycle/state introduced. |

## Consumer Gates

| Consumer | Validation | Result | Evidence |
|----------|------------|--------|----------|
| Workspace imports | `npx --yes deno task check` | NOT_RUN | Blocked by `jsr.io` DNS loading `@std/path`, not a local shared type error. |
| Published package contents | Publish simulation file list | PASS | Publish dry-run includes README, docs, `deno.json`, `mod.ts`, and `src/**`; excludes `utils/**`. |

## Anti-Pattern Check

| AP | Status | Evidence | Notes |
|----|--------|----------|-------|
| AP-1 | CLEAR | Published files are all below doctrine thresholds. | Deleted `utils/datetime.ts` monolith. |
| AP-2 | CLEAR | `utils/datetime.ts` deleted; no replacement shared datetime wrapper. | Other package date/time usage is drift-logged for owning waves. |
| AP-7 | CLEAR | Factories use options objects, not telescoping positional parameters. |  |
| AP-9 | CLEAR | Shared helpers are explicit schema factories and contract primitives. |  |
| AP-13 | CLEAR | No `console.*` in published source. |  |
| AP-14 | CLEAR | No upstream package re-export in `src/public/mod.ts`. |  |
| AP-15 | CLEAR | No `I*`/`*T` names found in new public surface. |  |
| AP-16 | DEBT_ACCEPTED | `packages/shared/utils/` remains, unpublished, for later-wave consumers. | Covered by `arch-debt.md` shared entry and drift. |
| AP-20 | CLEAR | `deno.unstable` is present in package `compilerOptions.lib`. |  |
| Other APs | N/A | Not affected by A1 package scope. |  |

## Arch-Debt Delta

| Metric | Count | Evidence |
|--------|-------|----------|
| New entries | 0 | No new `arch-debt.md` entries. |
| Resolved entries | 0 | Shared AP-2 entry remains open even though datetime was deleted. |
| Deepened violations | 0 | Published surface no longer includes `utils` or datetime anti-helper. |
| Unrecorded violations | 0 | Remaining physical `utils/` compatibility is recorded as drift/debt. |

## Findings

| Severity | Finding | Evidence | Required action |
|----------|---------|----------|-----------------|
| high | `/docs` does not meet the approved STANDARDS §7 scope. | `packages/shared/docs` only has README, architecture, concepts, one recipe, and reference README; it lacks `getting-started.md`, `advanced/`, and concrete reference pages, and pages lack required frontmatter. | Add the missing §7 docs/frontmatter or explicitly rescope the plan. |
| medium | Commit tracking artifact is stale/incomplete for current branch. | `commits.md` omits `37b935c` and `633bc43`; it lists `27b4bf3`, which is not in the current local ancestry. | Update `commits.md`/context so resume evidence matches current commits. |
| low | `arch-debt.md` still lists the shared datetime debt as open after deletion. | `packages/shared/utils/datetime.ts` is gone; `.llm/harness/debt/arch-debt.md` shared entry remains `Status: open`. | Either close/update the entry with gate evidence or clarify that only residual unpublished `utils/` compatibility remains. |

## Lessons for Promotion

| Lesson | Pattern | Applies to | Confidence |
|--------|---------|------------|------------|
| Standards scripts are weaker than STANDARDS.md §7. | Manual evaluator docs checks must verify required docs tree and frontmatter. | docs overlay + package README/docs work | high |

## Verdict

| Field | Value |
|-------|-------|
| Verdict | `FAIL_FIX` |
| Rationale | The implementation passes targeted package type/doc/publish/lint/test gates, and workspace/standards reruns are blocked by sandbox DNS to `jsr.io`. However, the approved plan required `/docs` per `STANDARDS.md` §7, and that docs structure/frontmatter is incomplete; run commit artifacts also need correction. |
