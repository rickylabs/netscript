# Evaluation: JSR publish mechanism and release links

## Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `fix-jsr-publish-mechanism--publish-release-links` |
| Target | release tooling plus `packages/aspire` public-surface cleanup |
| Archetype | `N/A - repo release tooling`; Aspire touch `2 - Integration` |
| Scope overlays | `docs` |
| Evaluator | `Codex separate evaluator / 2026-06-25` |

## Process Verification

| Check | Result | Evidence |
| ----- | ------ | -------- |
| Plan-Gate passed before implementation | PASS | `plan-eval.md` final verdict is `PASS`; `git log --oneline` shows plan commit `4628e106` before implementation commit `0dc7cddb`. |
| Design section exists in worklog | PASS | `worklog.md` has `## Design` with public surface, domain vocabulary, ports, constants, commit slices, deferred scope, and contributor path. |
| Commit slices match design plan | PASS | Design names four slices; commits inspected: `4628e106` harness plan artifacts, `0dc7cddb` publish/workflow/Aspire implementation, `8f4d81a1` validation artifact update. |
| Each slice has a passing gate | PASS | `worklog.md` records PLAN-EVAL PASS, tooling/workflow/Aspire gates PASS, actual publish dry-run PASS, repo dry-run PASS, and clean-tree root publish dry-run PASS. |
| No speculative seams (unused files) | PASS | `run-publish.ts` and `run-publish-dry-run.ts` both consume `publish-workspace.ts`; workflow invokes `run-publish.ts`; Aspire change is in an existing import-map-consumed barrel. |
| Constants used for finite vocabularies | PASS | `APPROVED_SLOW_TYPE_PACKAGES`, `PUBLISH_PARENT_DIRS`, `JSR_SCOPE`, and managed-block markers are centralized in `publish-workspace.ts`. |

## Static Gates

| Gate | Command or check | Result | Evidence | Notes |
| ---- | ---------------- | ------ | -------- | ----- |
| Tooling typecheck | `deno check .llm/tools/run-publish.ts .llm/tools/run-publish-dry-run.ts` | PASS | Evaluator rerun exited 0. | Shared helper and both entrypoints type-check. |
| Aspire typecheck | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/aspire --ext ts,tsx` | PASS | Evaluator rerun: 45 files, 0 occurrences. | Required because Aspire barrel was touched. |
| Tooling lint | `deno lint --no-config .llm/tools/publish-workspace.ts .llm/tools/run-publish.ts .llm/tools/run-publish-dry-run.ts` | PASS | Evaluator rerun: `Checked 3 files`. | Matches worklog rationale that repo lint wrapper excludes `.llm/`. |
| Format | Recorded evidence | PASS | `worklog.md` records tooling fmt and Aspire fmt wrapper PASS. | `git diff --check 97199040..HEAD` also passed in evaluator run. |
| Workflow YAML | `printf ... \| deno run --allow-read -` using `jsr:@std/yaml` parse | PASS | Evaluator rerun printed `ok`. | Initial evaluator `deno eval` flag placement failed; rerun used valid Deno 2 syntax and transient lock noise was removed. |
| JSR link generation | `deno run --allow-read .llm/tools/run-publish.ts --print-jsr-links --version v0.0.1-alpha.1 \| wc -l` | PASS | Evaluator rerun printed `31`. | Matches all publishable members. |
| Release body update | `run-publish.ts --update-release-body ...` against scratch release notes | PASS | Evaluator rerun wrote 31 `https://jsr.io/@netscript/` links and preserved existing notes before the managed block. | Scratch files removed after validation. |
| Repo publish gate | `deno task publish:dry-run` | PASS | Recorded in `worklog.md`; not rerun by evaluator due cost. | Existing gate now uses the shared helper. |
| Actual workflow publish path dry-run | `deno run --allow-read --allow-write --allow-run .llm/tools/run-publish.ts --dry-run` | PASS | Recorded in `worklog.md`: exit 0 for all 31 publishable members. | This is the workflow publish command in dry-run mode. |
| Root publish dry-run | `deno publish --dry-run` | PASS | Recorded in `worklog.md`: clean-tree rerun exit 0. | Confirms Aspire TS2305 blocker is gone. |

## Fitness Gates

| Gate | Function | Result | Evidence | Violations |
| ---- | -------- | ------ | -------- | ---------- |
| F-1 | File-size lint | PASS | Touched files are focused; `publish-workspace.ts` is 218 lines, `run-publish.ts` is 72 lines, Aspire barrel remains small. | None found. |
| F-2 | Helper-reinvention scan | N/A | `.llm/tools` is repo release tooling; helper uses `Deno.Command`, JSON, and filesystem APIs directly. | None found. |
| F-3 | Layering check | PASS | Aspire change only replaces fragile barrel re-exports with direct source re-exports; no new cross-layer behavior. | None found. |
| F-4 | Inheritance audit | N/A | No classes or inheritance added. | None. |
| F-5 | Public surface audit | PASS | Aspire export map unchanged; `packages/aspire/src/public/mod.ts` retained for plugin import-map consumers. | None found. |
| F-6 | JSR publishability | PASS | `deno task publish:dry-run`, workflow dry-run path, and root `deno publish --dry-run` recorded PASS; evaluator checked link generation. | None found. |
| F-7 | Doc-score gate | N/A | No public package docs or README badge work in scope; #112 explicitly deferred. | None. |
| F-8 | Workspace lib check | PASS | No compiler option or workspace lib changes in `git diff --name-only 97199040..HEAD`. | None found. |
| F-9 | Permission declaration check | N/A | No package runtime permission contract changed. | None. |
| F-10 | Test-shape audit | N/A | No package tests added or reshaped. | None. |
| F-11 | Forbidden-folder lint | PASS | Changed-file list is limited to allowed scope: workflow, `.llm/tools`, run artifacts, and `packages/aspire/src/public/mod.ts`. | None found. |
| F-12 | Naming-convention lint | PASS | New tool names are lowercase hyphenated and match repo tool naming. | None found. |
| F-13 | Saga/runtime invariants | N/A | No saga/runtime behavior touched. | None. |
| F-14 | Console-log lint | N/A | Console output is limited to repo tooling/workflow edge, not published package code. | None. |
| F-15 | Re-export-upstream lint | PASS | Aspire direct re-exports target package-owned files only. | None found. |
| F-16 | Folder-cardinality lint | N/A | No package folders added or removed. | None. |
| F-17 | Abstract-derived co-location | N/A | No abstract/concrete classes touched. | None. |
| F-18 | Sub-barrel lint | PASS | Existing Aspire internal barrel was retained and repaired; no new sub-barrel introduced. | None found. |

## Runtime Gates

| Gate | Validation | Result | Evidence |
| ---- | ---------- | ------ | -------- |
| Runtime behavior | No runtime package behavior changed. | N/A | Scope is release tooling and an Aspire barrel re-export cleanup. |

## Consumer Gates

| Consumer | Validation | Result | Evidence |
| -------- | ---------- | ------ | -------- |
| GitHub Actions publish workflow | Manual workflow review plus YAML parse. | PASS | `publish.yml` uses `release.published` and `workflow_dispatch`, keeps `id-token: write`, runs the shared dry-run and publish tool, then updates the release body through `gh release view/edit`. |
| JSR package consumers | Per-member dry-run publish. | PASS | `worklog.md` records `run-publish.ts --dry-run` and `deno task publish:dry-run` PASS for all 31 members. |
| Aspire local-source plugin import maps | Existing barrel retained and checked. | PASS | `rg` spot-check found plugin import maps still point at `packages/aspire/src/public/mod.ts`; Aspire check PASS. |

## Anti-Pattern Check

| AP | Status | Evidence | Notes |
| -- | ------ | -------- | ----- |
| AP-1 | CLEAR | New tooling is split into a shared helper and two thin entrypoints; file sizes remain modest. | No god file introduced. |
| AP-13 | N/A | No published package `console.*` added. | Workflow/tool output is acceptable. |
| AP-16 | CLEAR | No generic package helper folders added. | `.llm/tools/publish-workspace.ts` is repo tooling, not package vocabulary. |
| AP-17 | CLEAR | Aspire ports/adapters layout unchanged. | Direct re-export uses existing files. |
| AP-22 | CLEAR | Existing Aspire internal barrel was not expanded into a new public export; it was retained for import-map compatibility and repaired. | Drift recorded. |
| Other APs | N/A | Not touched by this scope. | No evidence of new violations in changed files. |

## Arch-Debt Delta

| Metric | Count | Evidence |
| ------ | ----- | -------- |
| New entries | 0 | `drift.md` records implementation drift; no new accepted architecture debt required. |
| Resolved entries | 0 | Existing slow-type carve-outs remain open and limited to four packages. |
| Deepened violations | 0 | Slow-type set unchanged; Aspire export map and architecture unchanged. |
| Unrecorded violations | 0 | No unrecorded doctrine violation found in touched files. |

## Findings

| Severity | Finding | Evidence | Required action |
| -------- | ------- | -------- | --------------- |
| low | `commits.md` and `context-pack.md` list the first two run commits but do not list the final validation artifact commit `8f4d81a1`. | `git log --oneline` shows `8f4d81a1`; `commits.md` stops at `0dc7cddb`. | Non-blocking for this evaluation because the actual git history was verified and the final commit only records validation artifacts. Update during close/PR-comment housekeeping if desired. |

## Lessons for Promotion

| Lesson | Pattern | Applies to | Confidence |
| ------ | ------- | ---------- | ---------- |
| Keep real publish and dry-run publish on the same helper | A release gate is only predictive when the real workflow invokes the same member discovery, catalog materialization, and slow-type policy. | JSR release tooling | high |

## Verdict

| Field | Value |
| ----- | ----- |
| Verdict | `PASS` |
| Rationale | The approved plan was followed: the real publish path now uses the shared per-member mechanism, the dry-run gate uses the same helper, the release workflow is GitHub-Release-driven with OIDC provenance preserved, JSR links are generated for all 31 members and inserted into the release body, slow-type carve-outs remain limited to the four accepted packages, and the Aspire TS2305 root-publish blocker is fixed by direct re-exports without changing the export map. Independent evaluator spot checks passed, and the only finding is non-blocking artifact bookkeeping for the final validation commit. |
