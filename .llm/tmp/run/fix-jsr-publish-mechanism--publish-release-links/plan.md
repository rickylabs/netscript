# Plan: JSR Publish Mechanism and Release Links

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `fix-jsr-publish-mechanism--publish-release-links` |
| Branch | `fix/jsr-publish-mechanism` |
| Phase | `plan` |
| Target | release tooling plus `packages/aspire` public-surface cleanup |
| Archetype | `N/A - repo release tooling`; `2 - Integration` for Aspire touch |
| Scope overlays | `docs` for workflow release-flow comment/docs |

## Archetype

Primary implementation is repo release tooling under `.llm/tools`, not a published package and not a CLI package under `packages/*`; therefore full Archetype 6 package gates do not apply. The plan still borrows Archetype 6 principles for small command-line tooling at the workflow edge: keep Deno side effects in the tool entrypoint/helper, use explicit constants, and validate with focused `deno check`/lint/fmt plus workflow syntax.

The Aspire touch is Archetype 2 Integration, but the change is limited to a non-exported internal barrel and does not alter package architecture, exports, ports, adapters, or runtime behavior.

## Current Doctrine Verdict

- `@netscript/aspire`: Archetype 2, verdict `Keep`; headline action is only a future `helpers/` rename. This slice must not deepen Aspire debt.
- Release tooling: N/A in doctrine package table; apply A14/F-6 because publish gates are the release contract.

## Axioms in Play

| Axiom | Why it matters |
| ----- | -------------- |
| A1 | Published JSR surface must be defined by exports, not accidental workspace-root behavior. |
| A2 | The release path should be simple: one validated member-publish mechanism used for dry-run and real publish. |
| A7 | Use `deno publish`, GitHub Actions OIDC, and `gh` instead of custom registry/auth code. |
| A8 | Keep release tooling in `.llm/tools`; keep Aspire cleanup scoped to the existing public barrel file. |
| A14 | `deno publish --dry-run`, doc/public-surface checks, and workflow validation are the gates. |

## Goal

Make the real GitHub Actions publish path match the repo's per-member JSR dry-run gate, preserve OIDC provenance, trigger publishing from a published GitHub Release, and add JSR package links back into the release notes after publish.

## Scope

- Add a real-publish sibling tool in `.llm/tools/` that shares the dry-run member discovery, catalog materialization, and slow-type carve-outs.
- Update `.github/workflows/publish.yml` to trigger from `release.published` plus `workflow_dispatch`, run the same tool in dry-run and publish modes, and update release notes with one JSR link per publishable member.
- Repair `packages/aspire/src/public/mod.ts` direct re-exports if needed to make root dry-run diagnostics clean without changing Aspire's `exports` map.
- Add a short workflow comment documenting supervisor release steps.

## Non-Scope

- Do not publish tags or create GitHub Releases.
- Do not edit the 31 package READMEs for badges; post-release doc-site task #112 owns badges and dynamic version copy.
- Do not change package versions or regenerate `deno.lock`.
- Do not broaden slow-type carve-outs beyond the four accepted packages.

## Hidden Scope

- Release-note back-linking needs `contents: write` and must safely preserve existing release body text.
- Manual workflow dispatch has no release event payload, so it needs an explicit tag input for release-note updates.
- The publish helper must restore member `deno.json` files after materializing catalog imports even on failure.

## Locked Decisions

| ID | Decision | Rationale |
| -- | -------- | --------- |
| LD-1 | Real publish uses the same per-member mechanism as dry-run, without `--dry-run`. | Makes the checked gate a true predictor and avoids root workspace publish's internal-file bug. |
| LD-2 | Keep `--allow-slow-types` limited to four approved packages. | Matches existing accepted debt and prevents accidental public slow types elsewhere. |
| LD-3 | Use `release.published` as the automatic trigger; do not keep `push.tags`. | A GitHub Release is the human release object and can be updated with JSR links; tag pushes alone cannot reliably identify notes to update. |
| LD-4 | Keep `workflow_dispatch` with an optional tag input as manual fallback. | Enables supervised recovery without requiring a new tag or release creation path. |
| LD-5 | Preserve `id-token: write` and call standard `deno publish`; do not add registry tokens or disable provenance. | JSR OIDC provenance comes from GitHub Actions identity. |
| LD-6 | Retain Aspire `src/public/mod.ts` but fix its fragile barrel re-exports by direct source re-exports. | Low-risk cleanup, keeps generated-template assumptions intact, and makes root diagnostic clean. |

## Open-Decision Sweep

| Decision | Status | Notes |
| -------- | ------ | ----- |
| Secondary tag push trigger | resolved now | Removed to make Release the single automatic source of truth. |
| Slow-type carve-outs | resolved now | Keep existing four only. |
| Aspire internal barrel retention | resolved now | Retain and repair direct re-exports. |
| JSR badges in READMEs | safe to defer | Explicitly deferred to post-release doc-site task #112. |

## Risk Register

| Risk | Mitigation |
| ---- | ---------- |
| Real publish mutates member configs during catalog materialization. | Snapshot and restore every touched `deno.json` in `finally`. |
| Release body update clobbers human notes. | Read current body first, replace only managed `<!-- jsr-links:start/end -->` block, and append if absent. |
| Manual dispatch without tag cannot update release notes. | Add `tag` input and fail clearly only for release-note update when no tag is available. |
| Per-member publish order differs from dependency needs. | Preserve sorted deterministic member discovery used by dry-run; Deno publish handles workspace specifier rewriting per member. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| -- | ------ | ---- |
| AP-1 | risk | Keep new tooling small and share helpers instead of duplicating large scripts. |
| AP-13 | risk | Workflow shell output is acceptable; no published package console logging introduced. |
| AP-22 | existing/risk | Aspire `src/public/mod.ts` is an internal barrel; avoid expanding its role and repair only the failing re-export paths. |

## Fitness Gates

### Gate Applicability

| Surface | Gate authority | Applicability decision |
| ------- | -------------- | ---------------------- |
| `.llm/tools` publish scripts | Repo tooling validation, with Archetype 6 principles only | Full F-CLI-1 ... F-CLI-31 are `N/A`: these scripts are not a published `packages/*` CLI package, do not ship a binary, do not contain `src/kernel`/`src/public` surfaces, and are invoked as repo-maintenance scripts. Required evidence is focused `deno check`, scoped lint/fmt, and end-to-end dry-run execution. |
| `.github/workflows/publish.yml` | Workflow syntax and release contract | Doctrine F gates are `N/A`; required evidence is YAML parse/syntax plus shell command review. |
| `packages/aspire/src/public/mod.ts` | Archetype 2 Integration package touch | Universal package gates apply only where touched. Since the export map, ports, adapters, and runtime code are unchanged, most structure gates are manual `N/A`; F-5/F-6 and package check are required. |

### Universal Gates

| Gate | Required | Expected evidence |
| ---- | -------- | ----------------- |
| Static check | yes | Focused `deno check` for `.llm/tools/run-publish.ts` and `.llm/tools/run-publish-dry-run.ts`; Aspire check wrapper if Aspire touched. |
| Static lint/fmt | yes | Scoped `.llm/tools/run-deno-lint.ts` and `.llm/tools/run-deno-fmt.ts` on touched `.ts` roots/files. |
| F-1 File-size lint | manual | New/changed `.llm/tools` files remain small; Aspire file not materially expanded. |
| F-2 Helper-reinvention scan | N/A | No platform wrapper helper introduced; tool uses `Deno.Command`, JSON, and filesystem APIs directly. |
| F-3 Layering check | manual/N/A | Aspire barrel re-export paths only; no new Aspire imports across domain/ports/application/adapters. `.llm/tools` is outside package layering. |
| F-4 Inheritance audit | N/A | No classes or inheritance planned. |
| F-5 Public surface audit | yes | Aspire export map unchanged; publish/doc analysis sees valid symbols. |
| F-6 JSR publishability | yes | `deno task publish:dry-run` exit 0 and new `run-publish.ts --dry-run` exit 0. |
| F-7 Doc-score gate | N/A | No public JSDoc or README package docs changed; README badge/docs deferred to #112. |
| F-8 Workspace lib check | manual | No compiler option changes. |
| F-9 Permission declaration check | N/A | No package runtime permission contract changes. |
| F-10 Test-shape audit | N/A | No package tests added or reshaped. |
| F-11 Forbidden-folder lint | manual | No new package folders; `.llm/tools` files stay in approved tooling location. |
| F-12 Naming-convention lint | manual | New tool names are lowercase hyphenated and match repo tool naming. |
| F-13 Saga/runtime invariants | N/A | No saga/runtime behavior touched. |
| F-14 Console-log lint | N/A | Repo CLI/tooling output is allowed; no published package `console.*` added. |
| F-15 Re-export-upstream lint | manual | Aspire cleanup does not re-export upstream packages. |
| F-16 Folder-cardinality lint | N/A | No package folder cardinality changes. |
| F-17 Abstract-derived co-location | N/A | No abstract/concrete classes touched. |
| F-18 Sub-barrel lint | manual | Existing Aspire internal barrel is not expanded; direct re-export cleanup only. |

### Archetype 6 F-CLI Gates

F-CLI-1 through F-CLI-31 are `N/A` for this run because no `packages/<cli-pkg>` source tree, binary, command surface, kernel, `src/public`, or `src/maintainer` implementation is being created or modified. The scoped replacement evidence is:

- `deno check .llm/tools/run-publish.ts .llm/tools/run-publish-dry-run.ts`
- scoped lint/fmt on touched `.llm/tools` TypeScript
- `deno run --allow-read --allow-write --allow-run .llm/tools/run-publish.ts --dry-run`
- workflow YAML syntax validation for `.github/workflows/publish.yml`

## Arch-Debt Implications

| Entry | Action | Notes |
| ----- | ------ | ----- |
| `packages/contracts` slow-type carve-out | none | Existing accepted carve-out remains. |
| `packages/plugin-triggers-core` slow-type carve-out | none | Existing accepted carve-out remains. |
| `packages/service` slow-type carve-out | none | Existing accepted carve-out remains. |
| `packages/plugin` slow-type carve-out | none | Existing accepted carve-out remains. |
| `packages/aspire` helpers rename | none | Not in scope. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| ----- | ---- | ---------------- | --------------- |
| 1 | Baseline | `deno publish --dry-run` | Before state recorded as TS2305 failure. |
| 2 | Repo publish gate | `rtk proxy deno task publish:dry-run` | exit 0. |
| 3 | Actual workflow path dry-run | `deno run --allow-read --allow-write --allow-run .llm/tools/run-publish.ts --dry-run` | exit 0 for all publishable members. |
| 4 | Aspire check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/aspire --ext ts,tsx` | clean if Aspire touched. |
| 5 | Touched tooling check | focused `deno check` for new `.llm/tools` scripts | clean. |
| 6 | Scoped lint | `.llm/tools/run-deno-lint.ts` on touched roots/files | clean. |
| 7 | Scoped fmt | `.llm/tools/run-deno-fmt.ts` on touched roots/files | clean. |
| 8 | Workflow syntax | parse `.github/workflows/publish.yml` with a YAML-capable tool available in repo or Deno std | valid YAML. |

## Risks

- GitHub `gh` behavior cannot be fully exercised locally without a real release object; mitigate by syntax checking and keeping the shell script simple.
- The exact JSR provenance display is external to local validation; preserving OIDC permissions and using standard `deno publish` is the local proof.

## Dependencies

- Deno 2.8.3.
- GitHub Actions OIDC for JSR publish auth.
- `gh` CLI in GitHub-hosted runner for release body edits.

## Drift Watch

- If root `deno publish --dry-run` remains failing after aligning workflow, record whether root bare publish is intentionally no longer the real path.
- If per-member real publish requires extra permissions beyond OIDC, record and rescope.
- If a package outside the four accepted carve-outs needs slow types, fail rather than broaden silently.
