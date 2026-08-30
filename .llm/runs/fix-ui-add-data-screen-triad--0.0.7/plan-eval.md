# PLAN-EVAL — fix-ui-add-data-screen-triad--0.0.7

- Plan evaluator session: separate native Fable 5 (medium) session, 2026-08-30, branch
  `eval/plan-eval-1357-cycle-1`, worktree `007-eval-1357` — independent of the Codex
  implementation-author session and of the fixes topic supervisor
- Run: `fix-ui-add-data-screen-triad--0.0.7`
- Surface / archetype: `packages/cli`, Archetype 6 — CLI / Tooling
- Scope overlays: frontend
- Evaluated commit: `402c552f` (S1, verified harness-artifacts-only:
  `git diff --name-only de57fab0..402c552f` lists exactly 7 files, all under the run dir)
- Base: `de57fab0`
- Cycle: 1 of 2

## Checklist results

| Plan-Gate item                          | Result | Evidence / location                                                                                                                                                                                                              |
| --------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Research present and current            | PASS   | `research.md` re-baselined at `de57fab0`; findings 1, 2, 5, 6, 7, 10, 14 independently re-verified against the tree (`web-scaffold.ts`, `add-ui-command.ts`, `add-ui-input.ts`, `client-scaffolder.ts:32-51`, `deno doc`).        |
| Decisions locked                        | PASS   | D1–D17 each carry rationale; D10 independently verified true (see Notes A1).                                                                                                                                                     |
| Open-decision sweep                     | FAIL   | Evaluator sweep found two undeclared must-resolve-now decisions: the e2e gate-selection path (required fix 1) and the derived agent-docs corpus route for the ceiling's own how-to edit (required fix 2).                          |
| Commit slices (< 30, gate + files each) | FAIL   | 5 slices, ordered, gates named — but S2C cannot deliver its stated "gate definition/**selection**" inside ceiling files 7–12: selection lives only in `packages/cli/e2e/suites/scaffold/capability-suites.ts` (required fix 1).    |
| Risk register                           | PASS   | Router-mutation, binder over-match, partial-write, help-drift, base-red, runtime-host, and stale-corpus risks all present with concrete mitigations.                                                                              |
| Gate set selected                       | PASS   | F-1/F-15, F-CLI-12/13/16/17/23/24/31 + SCOPE-frontend from the archetype matrix; 19-row measured base table. Row 16's S2 promise must be rewritten under required fix 2, but the selection itself is correct and measured.         |
| Deferred scope explicit                 | FAIL   | Three docs the change falsifies are neither owned nor explicitly deferred: `docs/site/quickstart.vto:247-260`, `docs/site/cli-reference.md:104`, `docs/site/web-layer/fresh-ui.md:245-249` (required fix 3).                       |
| jsr-audit surface scan (pkg/plugin)     | PASS   | `research.md` surface scan; no `mod.ts` export change (finding 10 verified: symbols are CLI-internal); audit/publish/specifier checks green at base.                                                                              |

## Independent verification performed (evaluator session)

- **S1 purity**: `git diff --name-only de57fab0..402c552f` → 7 run-dir files only. No product code.
- **D10 / #1360 boundary (brief item 2)**: verified at `de57fab0` via `deno doc` and source.
  `IslandQueryOptions` carries `initialData?: TData` and `initialDataUpdatedAt?: number`
  (`packages/fresh/src/application/query/query-types.ts:127`); `useIslandQuery(options:
  IslandQueryOptions)` and `QueryIsland` are exported from `@netscript/fresh/query`; factory
  `queryOptions`/`clientKey` exist (`packages/sdk/src/ports/query-factory.ts:96,110`;
  `packages/sdk/src/query/query-factory.ts:145,179`); `createNetScriptQueryClient` exists
  (`packages/sdk/src/query-client/query-client-factory.ts`). Both D2 binding candidates render the
  same `createQueryFactories` template (`client-scaffolder.ts` uses
  `TEMPLATE_KEYS.appRoutesExamplesServiceLibServiceQuery`; `init --service` renders
  `(_lib)/service-query.ts.template`), so the narrow D3 binder is feasible. **D10 is TRUE: #1360
  is not a landing dependency.** One wording defect: research finding 5 and the worklog call
  `initialDataUpdatedAt` "required"; it is optional. Substance unaffected (see Notes A1).
- **Gate baselines (brief item 3)**: spot-checked one red and one green at base.
  - Row 8 (claimed BASE RED): `deno task --cwd packages/cli lint` → exit 1, `Module not found
    ".../packages/cli/.llm/tools/run-deno-lint.ts"` — reproduces the recorded wrapper-path defect.
  - Row 5 (claimed PASS): structured check over the 9 existing ceiling TS files → exit 0,
    `filesSelected: 9, batches: 1, failedBatches: 0` — matches the plan verbatim.
  - Row 19: `deno.lock` blob `a1522e6e...`, SHA-256 `edfa0c24...`, zero-line diff — matches.
- **Ceiling completeness (brief item 1)**: full consumer sweep across `packages/`, `plugins/`,
  `tools/`, `.llm/tools/`, `docs/`, e2e suites, and checked-in corpora for file-count assertions,
  help/CLI-surface assertions, suite registries, and derived-corpus membership. Results below.

## Open-decision sweep (evaluator-run)

Two decisions the plan left open would force rework if deferred (each is a required fix below):

1. **How the new e2e gate becomes part of `scaffold.runtime`.** Gate ids are selected into the
   runtime suite exclusively by the `RUNTIME_GATES` list in
   `packages/cli/e2e/suites/scaffold/capability-suites.ts` (lines 50–141); the suite builder maps
   `capability.gates` over registered gates and **silently drops** any registered-but-unselected
   gate (and throws on selected-but-unregistered ids, `capability-suites.ts:265-282`). That file is
   outside the 12-path ceiling. As locked, S2C either ships a gate that never executes or breaches
   the ceiling mid-implementation.
2. **The derived agent-docs corpus route for the how-to edit.** Ceiling path 12
   (`docs/site/web-layer/how-to/customize-fresh-ui.md`) is itself a member of the agent-docs prose
   corpus (`packages/cli/src/kernel/assets/agent-docs.generated.ts:181` lists
   `pages/web-layer/how-to/customize-fresh-ui/index.md`; the page also appears in
   `packages/mcp/src/publish-assets.generated.ts`). `check:agent-docs-prose` rebuilds the bundle
   and byte-compares against the checked-in `.llm/assets/agent-docs/prose.json.gz` /
   `provenance.json` (`build-agent-docs-bundle.ts:195-211`), so editing the how-to makes it red;
   `check:publish-assets` and the `check:assets-barrel` git-diff on `agent-docs.generated.ts`
   follow. The plan's Generated-Derivative Cascade predicted "None" movement for these checks —
   it analyzed only the `agent-conventions.ts` trigger and missed that the ceiling's own doc edit
   feeds the corpus. Gate row 16's "Required unchanged PASS" is therefore unachievable as written,
   while D17 simultaneously forbids the in-leaf regeneration that would green it. The leaf is
   guaranteed to hit its own stop-and-report at S2C; the routing decision must be made now, not
   then.

## Verdict

`FAIL_PLAN`

### Required fixes

1. **Amend the ceiling for gate selection.** Add
   `packages/cli/e2e/suites/scaffold/capability-suites.ts` to the product ceiling (scope: insert
   the new gate id(s) into `RUNTIME_GATES` / the relevant capability), or redesign S2C so the new
   gate is genuinely executed without that file — no such mechanism exists today, so amendment is
   the expected route. Update S2C's file list and `suite-registry_test.ts` expectations to match.
2. **Rewrite the derived-docs cascade and gate promises.** Correct the cascade rows for
   `check:agent-docs-prose` / `check:publish-assets` / `check:assets-barrel` to reflect that the
   ceiling-12 how-to edit stales `.llm/assets/agent-docs/prose.json.gz`, `provenance.json`,
   `packages/cli/src/kernel/assets/agent-docs.generated.ts`, and
   `packages/mcp/src/publish-assets.generated.ts`, and lock ONE route now: (a) extend the ceiling
   with those four derived artifacts and obtain explicit owner authorization to regenerate them
   in-leaf (amending D17 for this named set), (b) move the how-to correction out of this leaf, or
   (c) pre-arrange the supervisor-owned regeneration handoff as a planned step with row 16/17
   promises rewritten to expected-red-then-regenerated. Option (a) with the regeneration commands
   named per slice is the cleanest for a leaf that owns the doc change.
3. **Make deferred docs scope explicit.** The change falsifies three docs outside the ceiling:
   `docs/site/quickstart.vto:247-260` (states the exact 3-file emission set and a 2-path
   `deno check` line that omit the new loader/router outputs), `docs/site/cli-reference.md:104`
   (mutation-map dry-run column says `No` for `ui:add`), and
   `docs/site/web-layer/fresh-ui.md:245-249` (`--force` semantics prose). None is CI-gated (the
   quickstart block sits outside the `quickstart-walk` markers covered by
   `quickstart-command-drift_test.ts`). Either add them to the ceiling or record their deferral
   explicitly with rationale in Non-Scope/drift.

## Notes

- **A1 (minor, fix with the amendment):** research finding 5 and the worklog say
  `initialDataUpdatedAt` is a *required* field of `IslandQueryOptions`; it is optional
  (`initialDataUpdatedAt?: number`). D10's conclusion stands either way.
- **A2 (advisory):** the plan does not state whether plain `ui:add page <path>` (no `--island`)
  also moves to `router.ts` registration and the preflight/dry-run path, or keeps its inline
  `createRouteReference`. D7's "page files never declare inline route references" reads universal;
  the public-surface section names only the two data-bound modes. Both resolutions live inside
  ceiling files 1–5, so this defers safely — but record the choice when amending.
- **A3 (watch items, defused by the plan as written — keep them true):**
  - `public-command-tree_test.ts:83-89` asserts the literal invocations
    `netscript ui:add page <path> --island` / `netscript ui:add island <Name> --query` from
    `agent-conventions.ts:155-157` (twin: `assets/agent/guidance.md.template:8`). D8's name-only
    standalone-island syntax keeps these true; any invocation-form change drags all three plus
    `embedded.generated.ts`.
  - The router mutation must target the shipped `router.ts.template` shape (lines 28–49) via
    validation only; needing an anchor/shape change in the template would drag
    `embedded.generated.ts` and `route-templates_test.ts:93-118` — a rescope, per the plan's own
    rule.
  - `ui-ai-gates.ts:30` passes `--force` on the registry path; the Hidden-Scope wording ("not
    only registry copies") correctly preserves registry semantics — keep it that way.
  - Cleared consumer classes (no action): MCP tool-count tests (22) are unaffected;
    `EXPECTED_PUBLIC_DIRECT_COMMAND_COUNT = 91` counts command paths, not options;
    `check:emitted-samples` contains no `ui` references; `check:mcp-export-corpus` covers export
    symbols only; `command-policy.ts:38` matches the `ui:add` prefix without flags; Fresh
    `(_islands)` discovery/hydration already supports the target layout.
- **Strengths worth keeping:** the measured 19-row base table (both spot-checks reproduced
  exactly), the honest base-red lint/fmt handling, the D5 all-validation-before-first-write
  sequence (a genuine precondition design — current `writeGeneratedFiles` interleaves
  exists-checks with writes, which D5 removes), and the D13/D14 seam, which is real coupling
  provided the S2 test renders actual command help and compares it against the *planned role set*
  (help→plan), not constant-to-constant. The #1354/#1355 boundary discipline (D1–D3, Non-Scope) is
  exact against both live issue bodies.
- Cycle 2 scope: on resubmission, verify only the amended ceiling, the rewritten cascade/gate
  rows, and the explicit docs deferral; everything else in this plan is sound.
