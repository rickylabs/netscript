# Context Pack: JSR Publish Mechanism and Release Links

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `fix-jsr-publish-mechanism--publish-release-links` |
| Branch | `fix/jsr-publish-mechanism` |
| Current phase | `gate` |
| Archetype | `N/A - repo release tooling`; Aspire touch `2 - Integration` |
| Scope overlays | `docs` |

## Current State

Implementation is complete and validation is in progress. The workflow now publishes from GitHub Release events using a per-member helper shared with the dry-run gate. Root `deno publish --dry-run` no longer reports the Aspire TS2305 failure; before commit it reached the final dirty-worktree abort.

## Completed

- Loaded requested skills: `netscript-harness`, `netscript-deno-toolchain`, `jsr-audit`, `netscript-doctrine`, `netscript-tools`, `netscript-pr`, and `rtk`.
- Loaded harness activation/run-loop, plan gate, plan protocol, archetype matrix, relevant doctrine, and Archetype 6 profile.
- Reproduced the root publish dry-run failure.
- Drafted research, plan, design checkpoint, drift, context pack, and commits log.
- Ran first PLAN-EVAL fallback; it returned `FAIL_PLAN` because gate applicability was too generic.
- Updated the plan to classify `.llm/tools` as repo release tooling rather than a full Archetype 6 package and expanded the gate matrix.
- Ran second PLAN-EVAL fallback; verdict `PASS`.
- Implemented shared publish helper, real publish runner, release-driven workflow release-note back-links, and Aspire direct re-export cleanup.
- Validated `run-publish.ts --dry-run` and `deno task publish:dry-run` exit 0 for all 31 publishable members.

## In Progress

- Commit split and clean-tree root publish dry-run.

## Next Steps

1. Commit harness and implementation slices.
2. Rerun clean-tree `deno publish --dry-run`.
3. Run IMPL-EVAL fallback.
4. Push explicit refspec, open/update PR, and post validation evidence.

## Key Decisions

| Decision | Source | Notes |
| -------- | ------ | ----- |
| Use per-member publish for real workflow path. | `plan.md` LD-1 | Keeps dry-run and publish identical. |
| Remove automatic tag-push trigger. | `plan.md` LD-3 | GitHub Release becomes the source of truth; manual fallback remains. |
| Keep slow-type carve-outs limited to four packages. | `plan.md` LD-2 | No blanket `--allow-slow-types`. |
| Keep Aspire export map unchanged. | `plan.md` LD-6 | Cleanup only fixes internal barrel re-export paths. |

## Files Changed

| Path | Status | Notes |
| ---- | ------ | ----- |
| `.llm/tmp/run/fix-jsr-publish-mechanism--publish-release-links/research.md` | new | Harness artifact. |
| `.llm/tmp/run/fix-jsr-publish-mechanism--publish-release-links/plan.md` | new | Harness artifact. |
| `.llm/tmp/run/fix-jsr-publish-mechanism--publish-release-links/worklog.md` | new | Harness artifact with Design checkpoint. |
| `.llm/tmp/run/fix-jsr-publish-mechanism--publish-release-links/drift.md` | new | Harness artifact. |
| `.llm/tmp/run/fix-jsr-publish-mechanism--publish-release-links/context-pack.md` | new | Harness artifact. |
| `.llm/tmp/run/fix-jsr-publish-mechanism--publish-release-links/commits.md` | new | Harness artifact. |
| `.github/workflows/publish.yml` | changed | Release-driven trigger, OIDC publish, managed JSR links update. |
| `.llm/tools/publish-workspace.ts` | new | Shared member discovery, catalog materialization, publish, and release-note utilities. |
| `.llm/tools/run-publish-dry-run.ts` | changed | Refactored to call shared helper. |
| `.llm/tools/run-publish.ts` | new | Real publish runner plus JSR link/release-body modes. |
| `packages/aspire/src/public/mod.ts` | changed | Direct source re-exports for symbols that root publish analysis misread through barrels. |

## Gates

| Gate family | Current status | Evidence |
| ----------- | -------------- | -------- |
| Static | mostly green | Tooling check/lint/fmt, Aspire check/lint/fmt, YAML parse all pass; clean-tree root publish pending after commit. |
| Fitness | green for F-6 actual path | `deno task publish:dry-run` and `run-publish.ts --dry-run` exit 0 for all 31 members. |
| Runtime | N/A | No runtime behavior change planned. |
| Consumer | pending | Publish dry-runs after implementation. |

## Open Questions

- None blocking; open decisions resolved in `plan.md`.

## Drift and Debt

- Drift: evaluator launch fallback; root bare publish checks internal Aspire barrel; plugin import maps consume Aspire `src/public/mod.ts`.
- Debt: no new accepted architecture debt planned.

## Commits

- None yet.
