# PLAN-EVAL — fix-e2e-prod-min-dep-age--p0-prod-e2e

- Plan evaluator session: claude-openrouter / 2026-07-17
- Run: fix-e2e-prod-min-dep-age--p0-prod-e2e
- Surface / archetype: Archetype 6 — CLI / Tooling
- Scope overlays: docs (README behavioral clarification)

## Checklist results

| Plan-Gate item                          | Result | Evidence / location |
| --------------------------------------- | ------ | ------------------- |
| Research present and current            | PASS   | `research.md` baselines against `8a8a953`; branch `fix/e2e-prod-min-dep-age` matches `origin/main`. |
| Decisions locked                        | PASS   | `plan.md` §"Locked decisions" — flag placement after `-A`, unit assertion strengthening, documentation scope, shipped CLI exclusion. |
| Open-decision sweep                     | PASS   | `plan.md` §"Open-decision sweep" — user-facing CLI policy marked safe to defer; no rework-forcing decision remains open. |
| Commit slices (< 30, gate + files each) | PASS   | `plan.md` §"Slice" — S1 enumerates files (`plugin-install-gates.ts`, `scaffold-gates_test.ts`, `packages/cli/e2e/README.md`, run artifacts) and gates (focused builder test, scoped check, changed-file quality scan). |
| Risk register                           | PASS   | `plan.md` §"Risks" — three risks with mitigations (flag placement parsed as script args, over-application to local files, docs implying universal disablement). |
| Gate set selected                       | PASS   | `plan.md` §"Gates" — focused `scaffold-gates_test.ts`, scoped Deno check over `packages/cli/e2e` with `--unstable-kv`, changed-file `quality:scan`, `arch:check` for `packages/**` touch. |
| Deferred scope explicit                 | PASS   | `plan.md` §"Deferred scope" — shipped CLI `deno x` and generated MCP command behavior explicitly deferred; `research.md` §"Deferred user-facing window" lists exact call sites. |
| jsr-audit surface scan (pkg/plugin)     | N/A    | `research.md` §"Public/publish surface scan" — no package export, dependency, manifest, or published API changes; JSR slow-type and export-map risk not applicable. |

## Open-decision sweep (evaluator-run)

**Spot-check of load-bearing finding:** `plugin-install-gates.ts` lines 114-135 confirm the AI lifecycle gate builds `['deno', 'x', '-A', publishedPluginCliSpecifier(...)]` without `--minimum-dependency-age=0` when `packageSource === PACKAGE_SOURCE.JSR`. The `gate-factory.ts` lines 14-26 and 34-42 confirm the override is already applied to published `jsr:@netscript/cli` runs and raw generated-workspace Deno subcommands. The `scaffold-gates_test.ts` line 79-91 confirms the existing test only asserts `command[3]` (the specifier), not the full command array.

**No rework-forcing decisions remain open.** The user-facing CLI policy decision is correctly scoped as safe to defer — it affects shipped CLI shell-outs (listed in `research.md` lines 26-33), not this bounded release-harness fix.

## Verdict

`PASS`

## Notes

The plan correctly identifies the single missing `--minimum-dependency-age=0` placement in the E2E suite's published JSR command surface. The existing test assertion at `scaffold-gates_test.ts:90` (`assertEquals(command[3], 'jsr:@netscript/plugin-ai@0.0.1-beta.9/cli')`) is insufficient — it validates the specifier position but not the flag array. The plan's decision to strengthen this to a full-array assertion is sound and directly mitigates the "flag placement parsed as script args" risk.

The deferred scope (shipped CLI `deno x` at `dispatch-plugin-verb.ts:102`, `ai-plugin-command.ts:101`, `init-agent.ts:119`) is correctly documented with exact call sites and requires a separate product policy decision. This slice is appropriately bounded.
