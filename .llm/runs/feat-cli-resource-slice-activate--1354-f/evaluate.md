# Evaluation: Slice F — converge init and activate `generate resource` (#1354, PR #1956)

## Metadata

| Field | Value |
| --- | --- |
| Verdict | **PASS_IMPL_WITH_FINDINGS** |
| Evaluator | separate native opposite-family session, Claude Fable 5.1 (Codex-authored slice) |
| Checkout | `/home/agent/projects/netscript/worktrees/007-eval-1354-f`, detached at `8c27ffe16`, product code read-only |
| Evaluated diff | `git diff be3e3dded 8c27ffe16` (base = #1664 head `9295eabaa` + Slice A #1950 + Slice E #1954) |
| Plan | `origin/feat/cli-resource-slice-plan:.llm/runs/feat-cli-resource-slice--1354/plan.md`, Slice F amended 2026-09-02 (item 33, ceiling 33) |
| PR head note | PR #1956 head is `de042d23e`, one commit past the evaluated head; that commit touches only `context-pack.md`/`worklog.md` (`git show --stat de042d23e`), zero product delta. |
| Date | 2026-09-03 |

## Process Verification

| Check | Result | Evidence |
| --- | --- | --- |
| Plan-Gate | `PASS` (recorded N/A) | `worklog.md` Progress Log: `PLAN-EVAL: N/A` — owner-supplied locked plan already evaluated upstream (`PASS_PLAN_WITH_FINDINGS`, per the Slice E verdict). |
| Design checkpoint | `PASS` | `worklog.md` § Design present (public surface, vocabulary, ports, constants, commit slice, test strategy). |
| Stop-and-amend clause honored | `PASS` | `drift.md` "retire-set consumer required plan amendment": worker stopped on `agent-conventions.ts`, owner added item 33; implementation resumed against the amended plan. |
| Commit trail | `PASS` | Two commits: `e371dda91` (run bootstrap), `8c27ffe16` (`feat(cli): converge init resource generation`). |
| Close-gate | `PASS` (partial work) | PR body `Refs #1354`, no closing keyword (`gh pr view 1956 --json body` → closing=false, refs=true); labels `type:feat area:cli priority:p2 wave:v1 status:impl orchestrator:features`, milestone `0.0.7`. |
| Supervisor identity / route | `PASS` | `supervisor.md` records Codex implementation lane and native opposite-family Fable IMPL-EVAL. |

## 1. Touch set, ceiling, and forbidden files

| Check | Result | Evidence |
| --- | --- | --- |
| Product files in diff | 33 | `git diff --name-status be3e3dded 8c27ffe16`: 40 paths = 7 run artifacts + 33 product. |
| Enumerated items touched | 32 of 33 | All items except 24 (MCP corpus — unchanged and proven fresh, see gates). Item 16 created (`write-example-service-app-files_test.ts`). |
| **Outside the enumeration** | **1 file** | `packages/cli/src/public/features/root/public-command-dependencies.ts` (+185/−?; adds `generateResourceCommandDependencies` bundle, `resolveResourceClient`, `createResourceSliceStager`, `resolveResourceProcedure`). This is Slice E's item 6, which Slice E's evaluator proved E left untouched (`git show be3e3dded:…public-command-dependencies.ts | grep -i resource` → no hits). See M-1. |
| `deno.lock` | unchanged | `git diff --stat be3e3dded 8c27ffe16 -- deno.lock` → empty. |
| `service-query.ts.template` | unchanged | same command on that path → empty; still present as `TEMPLATE_KEYS` key (manifest.ts:13). |
| `packages/` outside `packages/cli` | none | `git diff --name-only … -- packages | grep -v '^packages/cli/'` → empty. |
| Generated carriers | `embedded.generated.ts` regenerated; corpus untouched | ceiling-exempt per plan. |

## 2. Retire-set completeness

| Check | Result | Evidence |
| --- | --- | --- |
| Items 4–13, 25–32 deleted | `PASS` (18/18) | All 18 templates appear as `D` in name-status. |
| `manifest.ts` keys | `PASS` | 18 `appRoutesExamples*`/`appRoutesPartialsExamplesServiceSummary` keys removed; remaining `examples/` keys are demo-only (`service-query`, `examples-view`, `crud-view`, `index`, `crud`, `orders/[id]`, telemetry). |
| `scaffold-template-assets.ts` carriers | `PASS` | 18 `appExampleService*`/`appServiceExample*`/`appServiceSummaryPartial` fields removed; no retired key referenced. |
| `app-route-seeds.ts` | deleted | `D` in name-status; `grep -rn generateRouteManifestSeed packages` hits only the negative assertion in `write-app-files_test.ts:110`. |
| Repo-wide importer/consumer scan | `PASS` | `grep -rn` for all 18 retired basenames + seed symbols across `packages plugins tools .llm/tools docs` (excluding `embedded.generated.ts`): only hits are the neutral `resource-slice/` family's own `index.layout.tsx` (a resource-slice role, not the retired path) and two docs pages (`docs/site/web-layer/fresh-ui.md:176-189`, `docs/site/_plan/worklog/quickstart.md`) — Slice G owns consumer guidance. |
| Item 33 `agent-conventions.ts` | `PASS` | `service-route-contract` → `index.route.ts`; `service-island` → `(_islands)/<Pascal>Island.tsx`; `service-shared` → `(_shared)/<name>-loaders.ts`; `service-form` → `(_components)/<name>-form.tsx`; `service-authorization` dropped (id removed from the union). No compatibility asset added. `assertAppConventionsResolve` in `public-command-tree_test.ts` passes. |

## 3. Init convergence

| Check | Result | Evidence |
| --- | --- | --- |
| Planner delegation, exact preset | `PASS` | `write-example-service-app-files.ts` `planExampleServiceResourceSlice()` calls `planResourceSlice(normalizeResourceSliceInput({… variants: ['form','partial'] …}))`; leaves written via `renderResourceSlice`. Only README, `service-query.ts`, telemetry remain hand-written. `write-example-service-app-files_test.ts` asserts variants `['core','form','partial']` and exactly 10 canonical roles with ownership markers. |
| Golden byte-equivalence by role | `PASS` (with L-1) | `write-app-files_test.ts` "init preset and command-shaped planner render byte-identical canonical roles" compares `Object.fromEntries(role→content)` of init leaves vs `renderResourceSlice(commandPlan)`. Production-path corroboration: `public-command-tree_test.ts` runs the real `generate resource users --route /examples/users --form --partial --dry-run` on an init-scaffolded app; a divergent leaf would surface as a conflict → `ResourceSliceConflictError` (exit 1) and fail the test. |
| Fresh derivation after routes, no seed | `PASS` (with L-2) | `write-app-files.ts`: `writeFreshRouteManifestSync(appDir)` runs after `writeExampleServiceAppFiles` and the last route write; seed imports removed. `write-app-files_test.ts` "Fresh derivation follows route emission and no manual seed remains" (source-index proof). `route-templates_test.ts` "derives the service route from the neutral Form-B sidecar after rendering": `pageModuleForm === 'sidecar'`, `routeKeyPath ['examples','teamMembers','$route']`, `bindRoutePattern(routeContract`. |
| `router.ts.template` alias | `PASS` | Manual `createRouteReference('/examples/{{serviceName}}')` removed; `serviceExample` now `{{serviceExampleRouteReference}}` → `routes.examples.<camel>.$route`, plus `{{serviceResourceRouteAlias}}`; asserted in `route-templates_test.ts`. |

## 4. Activation

| Check | Result | Evidence |
| --- | --- | --- |
| Fourth registration | `PASS` | `generate-group.ts` `.command('resource', createGenerateResourceCommand(dependencies.generateResourceCommandDependencies))` after aspire/runtime-schemas/plugins. |
| Command/help visibility + composed deps | `PASS` | `public-command-tree_test.ts` "public generate group exposes resource fourth with composed dependencies and exact help": asserts `['aspire','runtime-schemas','plugins','resource']`, description, options `--procedure --client --app --form --partial --stream`, and `resolveClient`/`stage` presence from `createPublicCommandDependencies`. |
| `--client` seam fail-closed | `PASS` | Composition delegates to Slice A `selectClientBinding` (`client-selector.ts:57-63`): `candidates.length !== 1` without a flag → `bindingError('multiple query clients are ambiguous' / 'no query client found')`; explicit flag zero/duplicate matches are distinct failures (:41-50). No auto-pick added. |

## 5. Slice E LOW-1 / LOW-2

| Item | Status | Evidence |
| --- | --- | --- |
| LOW-1 conflict-free `--dry-run` at command level, exit 0, zero writes | **Absorbed** | `public-command-tree_test.ts`: two production-tree dry-runs (`audits` new resource; exact init preset rerun for `users`) assert `routes/audits` absent and `router.ts`, `.generated/manifest.ts`, `.generated/routes.ts`, `routes/examples/users/index.tsx` byte-equal before/after. Non-zero exit would throw `ResourceSliceConflictError` and fail `parse`. |
| LOW-2 non-reconciler pre-apply failures as `CliExitError` | **Explicitly deferred** | `worklog.md` Decisions / `context-pack.md` Debt: required `generate-resource-command.ts` edit is outside the amended 33-file set. Still true at this head: `generate-resource.ts:119,162,219,230` and the new composition resolvers throw plain `Error`. Must be carried into Slice G or a follow-up. |

## Gates (all run from the eval checkout at `8c27ffe16`)

| Gate | Exit | Evidence |
| --- | ---: | --- |
| `run-deno-check.ts --root packages/cli --ext ts,tsx` | 0 | 977 files, 9 batches, 0 failed, 0 diagnostics |
| touched tests (4 files) via `run-deno-test.ts -- --allow-all …` | 0 | passed 32, failed 0 |
| full `packages/cli` via `run-deno-test.ts -- --allow-all packages/cli` | 1 | passed 1708, failed 2 — both in `packages/cli/e2e/tests/application/gates/service-client-runtime-probe_test.ts` (:550, :620), `Failed to spawn … /ephemeral/tmp/…: Permission denied` = `noexec` temp mount in this sandbox. `packages/cli/e2e` has zero diff. Re-run with `TMPDIR=/home/agent/.cache/eval-tmp` → exit 0, 25/25. Classified environmental, not a regression. Worker's "1324" was the package-owned subset (excludes `e2e/`). |
| `deno task check:assets-barrel` | 0 | regenerated barrels have no diff |
| `deno task check:publish-assets` | 0 | freshness pass |
| `deno task check:emitted-samples` | 0 | 48 samples / 38 artifact paths |
| `deno task check:mcp-export-corpus` | 0 | sha `cc64442f…`, 35 packages / 273 subpaths / 7846 symbols — corpus is **not stale** at this head |
| `deno task arch:check` | 0 | `FAIL=0`; only baseline `DEPS-NPM-CATALOG` warnings |
| `deno task quality:gate` | 0 | existing `export default` allowances only |
| `deno task docs:readme-fences` | 0 | |
| `deno task docs:jsdoc-examples` | 0 | `checked=359 failures=0`, `unboundName=116` (≤116 ✔) |
| `deno task publish:dry-run` | 0 | `Success Dry run complete` |
| scoped lint (`run-deno-lint.ts --root packages/cli --ext ts,tsx --include <12 touched files> --config <scratch>`) | 0 | 12 selected / 12 processed / 0 dropped / 0 findings. Scratch config copies root `lint.rules` (`tags recommended,jsr` + `no-process-global,no-node-globals`) and `fmt` options (`lineWidth 100, singleQuote, semiColons`) verbatim, dropping only root's `packages/cli/` exclusion — the same legitimacy argument as the Slice E verdict. Unscoped root runs drop every CLI file (exit 2, `failedBatches`), which is the known root exclusion, not a finding. |
| scoped fmt (same include/config) | 0 | 12/12 processed, 0 findings |

## Findings

| Severity | Finding | Evidence | Required action |
| --- | --- | --- | --- |
| medium (M-1) | One touched file is outside the amended 33-item enumeration and the absorption is unrecorded. `public-command-dependencies.ts` gained the full resource dependency bundle, a temp-dir stager and a `deno eval` procedure probe. This is Slice E's item 6, which E deferred (E's verdict proves it untouched there). F's `drift.md` has no entry; `context-pack.md` "Files Changed" claims "33 product paths: 32 tracked paths plus the new focused writer test", which miscounts (the 33rd is this file, not the test — the test is enumerated item 16). | `git diff --name-status be3e3dded 8c27ffe16`; `.llm/runs/…-f/drift.md`; `context-pack.md` § Files Changed | Add a `drift.md` entry (severity minor/scope) stating Slice E item 6 was absorbed into F, and correct the file count in `context-pack.md`. Product code needs no change. |
| medium (M-2) | Adapter-grade IO lives in the composition root. `createResourceSliceStager` (`public-command-dependencies.ts:460-509`) calls `Deno.makeTempDir/mkdir/writeTextFile/remove` and `@std/fs copy` directly, and `resolveResourceProcedure` (:511-544) spawns `deno eval` and parses the client's service name by regex (`/export const \w+Name\s*=\s*['"]…/`, :248). D8 places "filesystem application and the Fresh manifest bridge" in adapters; the Slice E plan text asked for the bundle to be built "from existing filesystem/template/app-root ports plus the Fresh manifest adapter". The application layer itself stays `Deno.*`-free, and the path is exercised end-to-end by the command-tree integration test, so this is not blocking. | file:line above; `run-deno-check` clean; `public-command-tree_test.ts` dry-run cases | Follow-up (Slice G or a debt entry): move the stager and procedure probe under `kernel/adapters/scaffold/` behind the existing `FileSystemPort`/`ProcessPort`, and give the regex-based service-name extraction a focused unit test. |
| low (L-1) | The "golden equivalence" test builds the command-side plan by hand (`planResourceSlice(normalizeResourceSliceInput({…}))`) rather than invoking `generateResource`; both sides share one code path, so it proves preset identity, not end-to-end command output. The production dry-run rerun in `public-command-tree_test.ts` closes the gap indirectly (a divergent leaf would be a conflict). | `write-app-files_test.ts` (equivalence test); `public-command-tree_test.ts` (`users … --form --partial --dry-run`) | Optional: assert the rerun's JSON result (`status`, `conflicts: []`, all leaves `skip`) to make the byte-identity explicit instead of inferred from "did not throw". |
| low (L-2) | Fresh-derivation ordering is proven by string-index inspection of `write-app-files.ts` source, and derivation is skipped under `options.dryRun`, so an init `--dry-run` report omits `.generated/manifest.ts`/`routes.ts` that a real run produces. | `write-app-files.ts` `if (!options.dryRun) { writeFreshRouteManifestSync(appDir) … }`; `write-app-files_test.ts` "Fresh derivation follows route emission" | Optional: a behavioural order test (record write order through the injected `write`) and a dry-run note in the init report or docs (Slice G). |
| low (L-3) | Cosmetic reflow noise: many untouched statements in `write-app-files.ts` and `public-command-dependencies.ts` were re-wrapped to ~80 columns although root `fmt.lineWidth` is 100 (both forms pass `deno fmt --check`). Inflates the diff and obscures the real change. | `git diff be3e3dded 8c27ffe16 -- …/write-app-files.ts` (e.g. `allocateScaffoldDefaultPort(` split) | None required; note for the reviewer. Avoid non-root formatter settings in future slices. |
| low (L-4) | Slice E LOW-2 remains open: pre-apply failures in `generate-resource.ts` and the new composition resolvers throw plain `Error`, not `CliExitError`. Deferral is explicit and reasoned (outside F's file set). | `generate-resource.ts:119,162,219,230`; `public-command-dependencies.ts:253,486,494,523,540` | Carry into Slice G's scope or open a follow-up issue so it is not lost at merge. |
| low (L-5) | Full-package suite shows 2 sandbox-only failures (`noexec` `/ephemeral/tmp`). Not attributable to the diff. | see Gates row | None for the author; the merge coordinator should not read the raw exit 1 as a regression. |

## Anti-Pattern / Doctrine Check

- Application layer (`kernel/application/resource-slice/**`, `scaffold/writers/**`) remains free of `Deno.*` (grep clean); IO added only in the composition root (M-2) and the existing Fresh adapter.
- No second canonical template authority survives: the neutral `resource-slice/` family is the sole source for both callers (D4 satisfied).
- No new port, abstract, or registry introduced; R-BASE-L2 not triggered.
- `arch:check` census unchanged (`FAIL=0`); `quality:gate` clean; JSR publish dry-run clean → no new debt entry owed. No `FAIL_DEBT` condition.

## Verdict

**PASS_IMPL_WITH_FINDINGS**

Scope is complete against the amended Slice F: the 18-template retire set, manifest and carrier keys, the manual route seed and item 33 are all gone with no surviving importer; init emits exactly the planner's `core+form+partial` preset through the same renderer/formatter as the command; Fresh derives the manifest after route emission; `generate resource` is registered fourth with production-composed dependencies and a still fail-closed `--client` seam; every required gate passes with exit 0 in this session (the two full-suite failures are proven environmental), the MCP corpus is fresh, and `unboundName=116`. The two medium findings are bookkeeping (unrecorded absorption of Slice E item 6) and a layering nit that is functionally covered by integration tests; neither blocks merge. M-1 should be fixed in the run artifacts before `status:ready-merge`; M-2 and L-4 need a recorded owner (Slice G or follow-up issue).
