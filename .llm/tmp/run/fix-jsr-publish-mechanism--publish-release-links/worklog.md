# Worklog: JSR Publish Mechanism and Release Links

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `fix-jsr-publish-mechanism--publish-release-links` |
| Branch | `fix/jsr-publish-mechanism` |
| Archetype | `N/A - repo release tooling`; Aspire touch `2 - Integration` |
| Scope overlays | `docs` |

## Design

### Public Surface

- `.llm/tools/run-publish.ts` — repo release tool invoked by GitHub Actions for dry-run and real JSR publish.
- `.llm/tools/publish-workspace.ts` — internal shared publish helper for member discovery, catalog materialization, slow-type carve-outs, and JSR link generation.
- `.github/workflows/publish.yml` — release-driven workflow entrypoint.
- `packages/aspire/src/public/mod.ts` — internal Aspire barrel repaired only enough to keep publish analysis valid.

### Domain Vocabulary

- `PublishMode` — `dry-run` or `publish`.
- `PublishableMember` — workspace member path plus package name.
- `APPROVED_SLOW_TYPE_PACKAGES` — finite accepted slow-type debt set.
- `Managed JSR links block` — release body section delimited by `<!-- jsr-links:start -->` and `<!-- jsr-links:end -->`.

### Ports

- Deno command execution — consumed through `Deno.Command` in the tooling helper to invoke `deno publish`.
- GitHub Release editing — consumed in workflow through `gh release view/edit`, not abstracted in TypeScript because it lives at the workflow edge.

### Constants

- `APPROVED_SLOW_TYPE_PACKAGES` — `packages/contracts`, `packages/plugin-triggers-core`, `packages/service`, `packages/plugin`.
- `PUBLISH_PARENT_DIRS` — `packages`, `plugins`.
- `JSR_SCOPE` — `@netscript`.
- `JSR_LINK_BLOCK_START` / `JSR_LINK_BLOCK_END` — release-note managed block markers.

### Commit Slices

| # | Slice | Gate | Files |
| - | ----- | ---- | ----- |
| 1 | Harness plan artifacts and PLAN-EVAL | PLAN-EVAL | `.llm/tmp/run/fix-jsr-publish-mechanism--publish-release-links/*` |
| 2 | Shared publish tool and workflow release links | `deno task publish:dry-run`; new tool `--dry-run`; YAML syntax | `.llm/tools/publish-workspace.ts`, `.llm/tools/run-publish-dry-run.ts`, `.llm/tools/run-publish.ts`, `.github/workflows/publish.yml` |
| 3 | Aspire internal public barrel cleanup | Aspire check; root dry-run diagnostic | `packages/aspire/src/public/mod.ts` |
| 4 | Final validation, PR body, and IMPL-EVAL | full requested validation set | run artifacts and PR metadata |

### Deferred Scope

- JSR README badges and dynamic version copy — owned by post-release doc-site task #112.
- Actual tag creation/GitHub Release creation/JSR publish — supervisor release action after PR merge.
- Broader Aspire doctrine cleanup such as `helpers/` rename.

### Contributor Path

A developer adding release behavior starts in `.github/workflows/publish.yml`, then reads `.llm/tools/run-publish.ts` and `.llm/tools/publish-workspace.ts`. A developer adding a publishable package only needs a valid member `deno.json`; the tool discovers publishable `packages/*` and `plugins/*` entries automatically.

## Progress Log

| Time | Slice | Step | Notes |
| ---- | ----- | ---- | ----- |
| 2026-06-25 | 1 | Baseline | Reproduced root `deno publish --dry-run` TS2305 failure in `packages/aspire/src/public/mod.ts`. |
| 2026-06-25 | 1 | Research | Verified existing dry-run wrapper, publish workflow, Aspire exports, and public barrel importers. |
| 2026-06-25 | 1 | PLAN-EVAL | First PLAN-EVAL returned `FAIL_PLAN`; gate table was too generic for selected surfaces. |
| 2026-06-25 | 1 | Baseline | Existing `deno task publish:dry-run` completed with exit 0 before implementation. |
| 2026-06-25 | 1 | PLAN-EVAL | Second PLAN-EVAL returned `PASS`; evaluator noted plugin import maps consume Aspire `src/public/mod.ts`. |
| 2026-06-25 | 2-3 | Implementation | Added shared publish helper, real publish runner, release-driven workflow, and Aspire direct re-export cleanup. |
| 2026-06-25 | 2-3 | Validation | New actual publish path dry-run completed exit 0 for all 31 members. |
| 2026-06-25 | 2-3 | Validation | Existing `deno task publish:dry-run` completed exit 0 through the refactored wrapper. |
| 2026-06-25 | 3 | Root dry-run | Root `deno publish --dry-run` no longer reports Aspire TS2305; it reached the final dirty-worktree abort before commit. |

## Decisions

| Decision | Reason | Source |
| -------- | ------ | ------ |
| Align real publish to per-member helper | Existing dry-run gate is green predictor only if publish uses the same mechanism. | `plan.md` LD-1 |
| Release event is the automatic trigger | GitHub Release is the object to back-link with JSR package URLs. | `plan.md` LD-3 |
| Fix Aspire direct re-exports rather than expand exports | Cleans root diagnostic without changing public package exports. | `plan.md` LD-6 |

## Drift

| Drift | Severity | Logged in drift.md |
| ----- | -------- | ------------------ |
| Exact OpenHands PLAN-EVAL path unavailable in this Codex session; using separate multi-agent evaluator fallback. | minor | yes |
| Plugin import maps consume `packages/aspire/src/public/mod.ts`; file is retained and repaired. | minor | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| ---- | ---------------- | ------ | ----- |
| Baseline root publish | `deno publish --dry-run` | FAIL expected | TS2305 in Aspire `src/public/mod.ts`; before-state recorded. |
| Baseline repo dry-run | `deno task publish:dry-run` | PASS | Existing per-member gate completed exit 0 before implementation. |
| Tooling type check | `deno check .llm/tools/run-publish.ts .llm/tools/run-publish-dry-run.ts` | PASS | New helper and entrypoints type-check. |
| Aspire check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/aspire --ext ts,tsx` | PASS | 45 files selected; 0 occurrences. |
| Workflow YAML parse | `deno eval 'import { parse } from "jsr:@std/yaml"; ...'` | PASS | YAML parsed successfully; incidental lock churn removed. |
| JSR link count | `deno run --allow-read .llm/tools/run-publish.ts --print-jsr-links --version v0.0.1-alpha.1 \| wc -l` | PASS | 31 links generated. |
| Release body updater | `run-publish.ts --update-release-body --version v0.0.1-alpha.1 ... && grep -c 'https://jsr.io/@netscript/'` | PASS | 31 JSR links written into the managed release-note block. |
| Tooling lint | `deno lint --no-config .llm/tools/publish-workspace.ts .llm/tools/run-publish.ts .llm/tools/run-publish-dry-run.ts` | PASS | Repo lint wrapper cannot lint `.llm/` because root config excludes `.llm/`; direct no-config lint checked 3 files. |
| Tooling fmt | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root .llm/tools --ext ts --include "run-publish\|publish-workspace"` | PASS | 3 files selected; 0 findings. |
| Aspire lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/aspire --ext ts,tsx` | PASS | 45 files selected; 0 findings. |
| Aspire fmt | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/aspire --ext ts,tsx` | PASS | 45 files selected; 0 findings. |
| Actual publish path dry-run | `deno run --allow-read --allow-write --allow-run .llm/tools/run-publish.ts --dry-run` | PASS | Exit 0 for all 31 publishable members. |
| Repo publish gate | `deno task publish:dry-run` | PASS | Exit 0 through refactored dry-run wrapper. |
| Root publish after Aspire cleanup | `deno publish --dry-run` | PARTIAL | TS2305 gone; command reached dirty-worktree abort before commit. Clean-tree rerun pending. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| F-6 | PASS | `deno task publish:dry-run`; `run-publish.ts --dry-run` | Existing gate and actual workflow dry-run path are green. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| Runtime behavior | N/A | No runtime package behavior changed. | Release tooling only. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| -------- | ------ | -------- | ----- |
| JSR consumers | NOT_RUN | Pending publish dry-runs. | No package version or README changes. |

## Handoff Notes

- Inspect `.llm/tools/run-publish-dry-run.ts` and the new publish helper for exact parity.
- Inspect `.github/workflows/publish.yml` for trigger, OIDC permissions, and managed JSR links block.
- Inspect `packages/aspire/src/public/mod.ts` to ensure no public export map change was introduced.
