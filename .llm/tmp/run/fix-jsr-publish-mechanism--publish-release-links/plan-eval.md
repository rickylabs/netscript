# PLAN-EVAL — fix-jsr-publish-mechanism--publish-release-links

- Plan evaluator session: Codex / 2026-06-25T10:30:41Z
- Run: `fix-jsr-publish-mechanism--publish-release-links`
- Surface / archetype: repo release tooling (`.llm/tools`, N/A package archetype with scoped Archetype 6 principles) plus limited `packages/aspire` internal barrel cleanup (Archetype 2 Integration touch)
- Scope overlays: docs for workflow release-flow comment/docs

## Checklist results

| Plan-Gate item                          | Result | Evidence / location |
| --------------------------------------- | ------ | ------------------- |
| Research present and current            | PASS   | `research.md` exists and has a `## Re-baseline` section tied to the current branch state and `main` baseline `97199040`; findings 1-8 re-derive the blocker, workflow state, dry-run mechanism, slow-type set, and Aspire export facts. Spot-check notes below correct one over-broad importer statement without invalidating the chosen retain-and-repair plan. |
| Decisions locked                        | PASS   | `plan.md` `## Locked Decisions` locks per-member real publish, the four-package slow-type set, release-driven trigger, workflow dispatch fallback, OIDC provenance, and Aspire barrel repair. |
| Open-decision sweep                     | PASS   | `plan.md` `## Open-Decision Sweep` resolves tag trigger, slow types, Aspire barrel retention, and marks README badges safe to defer. Evaluator found no additional open decision that would force implementation rework if deferred. |
| Commit slices (< 30, gate + files each) | PASS   | `worklog.md` `## Design` lists four ordered slices, each with gate and file/surface targets. |
| Risk register                           | PASS   | `plan.md` `## Risk Register` covers config restoration, release body clobbering, manual dispatch tag handling, and publish order; `plan.md` `## Risks` also records external limits around local `gh` and provenance validation. |
| Gate set selected                       | PASS   | `plan.md` `## Fitness Gates` now separates `.llm/tools` as repo release tooling where full F-CLI-1 ... F-CLI-31 are `N/A`, workflow YAML as release-contract validation, and Aspire as a limited Archetype 2 touch. The universal gate table marks required, manual, or `N/A` status with expected evidence, and the validation plan names the concrete commands. |
| Deferred scope explicit                 | PASS   | `plan.md` `## Non-Scope`, `## Open-Decision Sweep`, and `worklog.md` `## Design` defer release creation, README badges/dynamic versions (#112), version/lock churn, broadened slow-type carve-outs, and broader Aspire doctrine cleanup. |
| jsr-audit surface scan (pkg/plugin)     | PASS   | `research.md` `## jsr-audit surface scan` names the workflow/tooling and Aspire JSR surfaces, the real-publish-vs-gate mismatch, root publish internal-file behavior, slow-type carve-out risk, and OIDC provenance risk; `plan.md` slices address those risks. |

## Open-decision sweep (evaluator-run)

None. The plan resolves the tag-trigger choice, slow-type policy, Aspire barrel retention, release-note update shape, manual fallback behavior, and README badge deferral before implementation.

## Spot-check Evidence

- `git rev-parse --short HEAD` returned `97199040`, matching the plan's stated baseline.
- `.github/workflows/publish.yml` currently triggers on pushed `v*` tags, keeps `id-token: write`, grants only `contents: read`, and runs bare `deno publish` after `deno task publish:dry-run`.
- `.llm/tools/run-publish-dry-run.ts` has exactly the four approved slow-type packages and runs `deno publish --dry-run --allow-dirty` per member from each member cwd.
- `packages/aspire/deno.json` does not export `src/public/mod.ts`; root export is `mod.ts` and subpaths are config/schema/types/constants/application/adapters/testing.
- Importer spot-check: four plugin `deno.json` files map `@netscript/aspire` to `../../packages/aspire/src/public/mod.ts` (`plugins/triggers`, `plugins/streams`, `plugins/workers`, `plugins/sagas`). This makes `research.md` finding 7 too broad if read as "no product configuration points at the file"; however, the plan's LD-6 retains and repairs the file rather than deleting it, and the planned all-member publish dry-runs cover those consumers. No plan rework is required.

## Verdict

`PASS`

### If FAIL_PLAN — required fixes

None.

## Notes

The previous Plan-Gate blocker is resolved: the updated plan no longer classifies `.llm/tools` as a full published Archetype 6 package while omitting the corresponding F-CLI gate mapping. The implementation pass should preserve the plan's retain-and-repair stance for `packages/aspire/src/public/mod.ts` because plugin import maps currently depend on that path.
