# PLAN-EVAL — fix-ui-add-data-screen-triad--0.0.7

- Plan evaluator session: separate native Fable 5 (medium) session, 2026-08-30, branch
  `eval/plan-eval-1357-cycle-2`, worktree `007-eval-1357` — independent of the Codex
  implementation-author session, of the fixes topic supervisor, and of the cycle-1 evaluator
- Run: `fix-ui-add-data-screen-triad--0.0.7`
- Surface / archetype: `packages/cli`, Archetype 6 — CLI / Tooling
- Scope overlays: frontend
- Evaluated commit: `53e696b5` (cycle-1 repair; verified harness-artifacts-only:
  `git diff --name-only de57fab0..53e696b5` lists exactly 7 files, all under the run dir)
- Base: `de57fab0`
- Cycle: 2 of 2 — **terminal**

## Checklist results

| Plan-Gate item                          | Result | Evidence / location                                                                                                                                                                                                            |
| --------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Research present and current            | PASS   | `research.md` at `de57fab0`; findings 5 (optional `initialDataUpdatedAt?: number`, `query-types.ts:136`), 7 (both D2 seams render `createQueryFactories`: `client-scaffolder.ts:45` + `(_lib)/service-query.ts.template:22`), and 10 (no ui symbol on `mod.ts`/`scaffolding.ts`/`testing.ts`) independently re-verified this cycle. |
| Decisions locked                        | PASS   | D1–D17 with rationale; D10 wording now correctly states the option is optional while the generator contract always supplies it.                                                                                                 |
| Open-decision sweep                     | PASS   | Both cycle-1 must-resolve decisions are resolved in the plan itself (findings 1–2 below); my fresh sweep surfaced no new must-resolve-now decision.                                                                             |
| Commit slices (< 30, gate + files each) | PASS   | 5 slices; S2C ("gate definition + explicit `scaffold.runtime` selection, ceiling 7–12") is now deliverable entirely in-ceiling (finding 1).                                                                                     |
| Risk register                           | PASS   | Unchanged from cycle 1: router-mutation, binder over-match, partial-write, help-drift, base-red tooling, runtime-host, stale-corpus — all with concrete mitigations.                                                            |
| Gate set selected                       | PASS   | Same archetype-correct selection; cascade row 16 rewritten as green-by-consequence with `check:assets-barrel` `NOT_RUN` and the write-before-diff hazard named. One stale file-count in rows 5–7 (finding 5, minor).            |
| Deferred scope explicit                 | PASS   | Four known-stale docs recorded in `drift.md` with passages, rationale, and supervisor/docs-lane ownership; Non-Scope and worklog Deferred Scope agree (finding 3).                                                              |
| jsr-audit surface scan (pkg/plugin)     | PASS   | Re-verified: no ui symbol on any of the three published export subpaths; audit/publish/specifier checks green at base.                                                                                                          |

## Findings

| # | Severity | Finding                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| - | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 | resolved | **Cycle-1 fix 1 genuinely closed.** The full gate chain is in-ceiling: id in `cli-surface.ts` (path 7, `GATE.*` at :76-77 pattern), definition in new `ui-data-screen-gates.ts` (8), registration via the factory aggregation in `scaffold-capability-gates.ts` (9, imports at :16-23), tests (10–11), selection in `RUNTIME_GATES` in `capability-suites.ts` (12, :50+). The builder's throw-on-unregistered (`capability-suites.ts:273-277`) and silent-drop-unselected behaviors are both contained; `scaffold-suite-builder.ts` needs no edit.       |
| 2 | resolved | **Cycle-1 fix 2 closed, not relocated.** With the how-to dropped, no ceiling path feeds any generated carrier: `gen:assets-barrel` reads `TEMPLATE_MANIFEST`/skills/agent-tools/agent-docs asset sources only; `gen:agent-docs-prose` builds `docs/site` (no docs path in ceiling); `gen:publish-assets` derives from the barrels; the MCP export corpus derives from `deno doc` over the three export subpaths, none of which reaches `ui/add`. The green expectations now read as consequences, correctly. |
| 3 | resolved | **Cycle-1 fix 3 closed.** `drift.md` records the how-to plus `quickstart.vto:247-260`, `cli-reference.md:104`, `fresh-ui.md:245-249` as known-stale with exact passages and deferral to the owning docs/generated-carrier work; no plan section claims to deliver them; issue acceptance has no docs checkbox (see finding 6 for the one word that comes close).                                                                                                                                                 |
| 4 | clean    | **Fresh behavioural-consumer sweep found no thirteenth path.** Old-emission strings (`queryLoaders`, `useSignal(0)`) exist only in `web-scaffold.ts` across all file types in `packages/`, `plugins/`, `tools/`, `.llm/tools/`, `.github/`; the triad help prose is asserted only in `add-ui-command_test.ts` (ceiling 4); invocation-string assertions (`public-command-tree_test.ts:83-89`, `init-agent_test.ts:132-133`, `local-contributor-command-tree_test.ts:28`) survive because D7/D8 change no invocation form; `ui-ai-gates.ts` exercises registry-copy `--force` only, preserved by D6; `check:emitted-samples` contains no `ui:add` scaffolding; the quickstart drift test extracts bash fences inside markers (lines 20–162) while the falsified block sits at 240+; runtime-suite assertions in `suite-registry_test.ts` use `.some()` (exact lists cover other suites), and no test outside the ceiling asserts a GATE enum count or the runtime gate list. |
| 5 | minor    | **Stale count in validation rows 5–7.** They still say "9 existing ceiling TS files"; the repaired ceiling has **10** existing TS files (`capability-suites.ts` is TypeScript; the dropped how-to was Markdown). Non-blocking: I re-ran the structured check over all 10 at this head → exit 0, `filesSelected: 10, batches: 1, failedBatches: 0`; base rows 3–4 already compile `capability-suites.ts`, and the S2 promise is over "all changed/new TS files". Correct the count opportunistically in the S2 worklog — do not respin the plan for it.                                                                                                     |
| 6 | advisory | **Acceptance wording watch for close-gate.** Acceptance box 6 says `--force`/`--dry-run` are "supported **and documented**"; inside this ceiling "documented" can only mean the command's own rendered help (D13 role vocabulary + option help). The public `cli-reference.md:104` mutation map will remain falsified (it says no dry-run) until the deferred docs work lands — this is recorded honestly in `drift.md`, but the supervisor must carry the caveat into close-gate mirroring rather than reading box 6 as public-docs coverage.                                                                                                                 |
| 7 | concur   | **Cycle-1's five PASS areas re-judged, not rubber-stamped.** I independently re-derived D10 (optional field at `packages/fresh/src/application/query/query-types.ts:136`), the D2 binding seams, the `mod.ts`/subpath surface, the `deno.lock` hash (blob `a1522e6e...`, SHA-256 `edfa0c24...` — byte-identical match to row 18), and one measured gate. No cycle-1 PASS area is wrong. Cycle-1 advisory A2 (plain-page path) is now resolved explicitly in D7 and the worklog public surface.                                                                                                     |

## Independent verification performed (evaluator session)

- **S1 purity**: `git diff --name-only de57fab0..53e696b5` → 7 run-dir files only; repair commit
  `402c552f..53e696b5` → 4 run-dir files. No product or test code exists.
- **PR/branch state**: PR #1781 draft, `status:plan-eval`, head `53e696b5` = remote
  `fix/ui-add-data-screen-triad` tip = evaluated commit.
- **Consistency after the drop**: every remaining mention of the how-to in `plan.md`,
  `worklog.md`, and `context-pack.md` is a deferral statement; rows 4a/4b are demoted to
  measured-baseline-only, which is safe because no docs-site test executes or introspects
  `ui:add` (verified against the drift test's marker extraction and a `ui:add` sweep of
  `docs/site` tests).
- **Gate spot-check at this head** (product tree identical to base): structured check over all 10
  existing ceiling TS files → exit 0, 10/10, 0 failed batches.

## Verdict

`PASS_PLAN`

S2 may begin at `53e696b5` inside the locked 12-path ceiling. Carry finding 5's count correction
and finding 6's close-gate caveat into the S2 worklog; neither requires a plan respin. The runtime
`scaffold.runtime` gate remains REQUIRED / supervisor-coordinated / author-`NOT_RUN` per D16, and
`check:assets-barrel` remains supervisor-owned per D17.
