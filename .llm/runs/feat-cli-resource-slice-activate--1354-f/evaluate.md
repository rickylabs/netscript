IMPL-EVAL: PASS

# IMPL-EVAL — Slice F activation (#1354), PR #1956

| Field | Value |
| --- | --- |
| Evaluator | Claude / Fable 5 (`claude-fable-5`), fresh native opposite-family session — separate from the Codex generator session |
| Route | `formal_impl_evaluation` per `supervisor.md` lane table (native opposite-family Claude evaluates Codex-authored work) |
| Date | 2026-09-03 |
| Branch / worktree | `feat/cli-resource-slice-activate` at `/home/agent/projects/netscript/worktrees/007-leaf-1354-f` |
| Evaluated range | integration baseline `be3e3dded` → HEAD `de042d23e` (product commit `8c27ffe16`, gate-evidence commit `de042d23e`) |
| Plan authority | `origin/feat/cli-resource-slice-plan:.llm/runs/feat-cli-resource-slice--1354/plan.md`, amended Slice F item 33 / ceiling 33 |
| Constraints honored | read-only verification only; no Aspire/Docker/browser/`e2e:cli`; no product edit, commit, push, or GitHub mutation |

**Verdict: `PASS`. No blocking finding remains.** All findings below are low-severity or
observational; none requires a change before this slice's sign-off, and none is a doctrine
violation, an unproven gate, or a scope breach requiring `FAIL_FIX`/`FAIL_RESCOPE`/`FAIL_DEBT`.

## Process gates (protocol rules 1–3, 12–13)

- **Plan-Gate.** `worklog.md` Progress Log records `PLAN-EVAL: N/A` before implementation, justified
  by the owner supplying the locked, separately evaluated #1354 plan (the parent plan itself carries
  a passing PLAN-EVAL per the Slice E run's L-3 note). Recorded, justified — pass.
- **Design checkpoint.** `worklog.md § Design` exists with public surface, vocabulary, ports,
  constants, commit-slice table, extension axes, and test strategy; the single commit slice follows
  it. Pass.
- **Generator ≠ evaluator.** Generator was the Codex supervisor session; this evaluation is a fresh
  Claude/Fable session. Pass.
- **Commit trail.** PR #1956 carries RESEARCH, PLAN(N/A), and IMPL(PASS) phase comments; product
  commit `8c27ffe16` pushed; non-draft with `status:impl` is a recorded owner override in
  `supervisor.md`. Labels are taxonomy-compliant (`type:feat`, `area:cli`, `priority:p2`, `wave:v1`,
  exactly one `status:`), milestone `0.0.7`. Pass.
- **Close-gate / MEDIUM-3 (D10).** PR body says `Refs #1354 (partial)` with remaining scope
  (Slice G) and contains **no** closing keyword anywhere, including prose. Pass.
- **SKILL chapter.** See finding LOW-2 — `implement.md` has no `## SKILL` chapter.

## Scope verification — exact 33-path compliance

Product diff `be3e3dded..HEAD` (excluding `.llm/runs/**`) touches 33 files. Mapped against the
amended plan enumeration:

- **31 of the 33 enumerated items appear exactly** (items 1–23, 25–33; item 19
  `embedded.generated.ts` regenerated, ceiling-exempt).
- **Item 24** (`export-surface-corpus.generated.ts`) has **no diff**: clean-tree regeneration was
  deterministic (worklog), and I independently re-ran `deno task check:mcp-export-corpus` → exit 0,
  hash `cc64442f…` matching the worklog. Registering the fourth Cliffy subcommand adds no package
  export, so an unchanged corpus is the correct outcome, and the plan itself classifies this file
  as freshness evidence only. Compliant.
- **One path outside the Slice F enumeration**: `public-command-dependencies.ts` (+~185 lines,
  composed resource command dependencies). See finding **LOW-1**: the edit is the locked plan's
  Slice E expected-touch item 6, implemented verbatim to its description ("typed resource command
  dependency bundle … from existing filesystem/template/app-root ports plus the Fresh manifest
  adapter"), was deliberately left out of landed Slice E ("the command deliberately unregistered"
  — Slice E `evaluate.md`), and this run's `plan.md` declared "Production composition for Slice E"
  in scope up front. Substantively plan-listed and recorded; formally not in the amended F set.
- **`deno.lock`**: zero diff; `git hash-object deno.lock` = `202d4c9bfb…`, byte-identical to the
  research-recorded clean blob. Pass.
- **`service-query.ts.template`**: zero diff (`git diff … | wc -l` = 0); its manifest key
  `appRoutesExamplesServiceLibServiceQuery` survives. #1664 ownership respected. Pass.

## Retire-set completeness and absence of extra consumers

- All **18** old canonical/dependent templates are deleted (plan items 4–13, 25–32), and
  `manifest.ts` removes exactly the **18 corresponding keys**;
  `scaffold-template-assets.ts` removes the matching carrier fields, and
  `app-template-test-support.ts` drops every retired export. `app-route-seeds.ts` is deleted.
- Repo-wide scan (`packages/`, `plugins/`; ts/tsx/template) for every retired identifier/path
  (`ServiceShowcaseLab`, `service-showcase`, `managed-form`, `summary-card`, `summary-panel`,
  `lab-panel`, `page-layout`, `notes-card`, `hero.tsx`, `optimistic-list-mutation`,
  `route-contract.ts.template`, `service-summary`, `authorization.ts.template`,
  `app-route-seeds`, `generateRouteManifestSeed`, `generateRoutesSeed`) finds only:
  descriptive prose in `examples/index.tsx.template` (see LOW-4), the *negative* assertions in
  `write-app-files_test.ts:110-111`, the re-pointed convention ids in `agent-conventions.ts`,
  the regenerated `embedded.generated.ts` carrier, and unrelated `packages/fresh` test fixtures.
  **No surviving importer or rendered consumer of the retired set exists.** The asset no-orphan
  claim (98 disk / 98 declared) is consistent with `check:assets-barrel` and
  `check:publish-assets`, both re-run green.

## Init emits exactly the planner preset (D4/F)

`write-example-service-app-files.ts` now writes only: the demo `README.md`, `service-query.ts`
(#1664-owned template), the **planner leaves** from
`planResourceSlice(normalize({variants: ['form','partial'], …}))`, and the telemetry demo files.
`write-example-service-app-files_test.ts` proves the effective variant set is exactly
`['core','form','partial']`, the leaf roles are exactly the 10 canonical roles (page, layout, view,
island, loaders, route-contract, form-component, form-contract, summary-component, partial-route),
and every leaf starts with the `// @netscript/resource-slice` ownership marker. No hero/notes/
authorization/viewer/policy/telemetry page binding or optimistic mutation survives in init's
canonical slice.

## Byte equivalence by all canonical roles

- `write-app-files_test.ts` `'init preset and command-shaped planner render byte-identical
  canonical roles'` builds **both** role→content maps with `Object.fromEntries` and `assertEquals`
  over the complete objects, so key-set equality (all roles, both directions) and byte equality per
  role are both asserted — not just an intersection.
- End-to-end, `public-command-tree_test.ts` runs the **production-composed** command with the exact
  init preset (`generate resource users --procedure list --client users --route /examples/users
  --form --partial --dry-run`) against a real `init`-generated app and asserts the shared files are
  byte-identical and nothing was written. A conflict would throw
  `ResourceSliceConflictError` (`generate-resource-command.ts:69`), so the passing parse proves the
  rerun is conflict-free — i.e. the on-disk init output byte-matches the command's canonical
  rendering for every leaf, markers included. This is the strongest available equivalence proof and
  also absorbs Slice E **LOW-1** (a second, conflict-free dry-run for a new resource `audits`
  additionally proves zero writes with no conflict present).

## Formatted ownership markers

`createResourceSliceTemplateRenderer` (scaffold-template-assets.ts) wraps the template port so the
`DenoGeneratedSourceFormatter` formats each rendered body **before**
`markOwnedResourceSliceLeaf` computes the marker's `bodySha256`. Both callers use it: init via
`renderExampleServiceResourceSlice` and the production command via
`generateResourceCommandDependencies.templateRenderer`. The worklog records this as the fix for the
supervisor-review finding (post-marker init formatting drift making an exact rerun `owned-edited`),
and the exact-preset rerun test above mechanically confirms markers survive init's pipeline intact.

## Fresh derivation after route emission; no manual seed

`write-app-files.ts` invokes `writeFreshRouteManifestSync(appDir)` (lines 388–402) after every
route/sidecar write, including the example-service planner leaves, partials, and telemetry routes
(vite.config, written after, is not a route); dry-run skips derivation. `app-route-seeds.ts` is
deleted and no `generateRouteManifestSeed`/`generateRoutesSeed` reference remains anywhere.
`write-app-files_test.ts` asserts both the ordering (source-order assertion; see OBS-2) and the
seed absence; `public-command-tree_test.ts` verifies the derived `.generated/routes.ts` contains
`bindRoutePattern(` and `routePatterns.examples.users.$route` in a real init output, and
`route-templates_test.ts` now derives via `writeFreshRouteManifestSync` with Form-B assertions
replacing the old seed/manual-route assertions. The `router.ts.template` keeps the `serviceExample`
alias pointed at the Fresh-derived generated route (via `{{serviceExampleRouteReference}}`) so
`routes/examples/index.tsx.template` remains a surviving consumer unchanged — exactly plan item 20.

## Fourth registration, composed dependencies, help through the composed tree

`generate-group.ts` registers `resource` as the fourth `.command(…)` after aspire/runtime-schemas/
plugins. `public-command-tree_test.ts` `'public generate group exposes resource fourth with
composed dependencies and exact help'` builds the tree from **`createPublicCommandDependencies`**
(the production graph, not a stub), asserts the exact child-name order
`['aspire','runtime-schemas','plugins','resource']`, renders the resource help through
`getHelp()` and asserts the description plus `--procedure/--client/--app/--form/--partial/--stream`,
and asserts the composed `resolveClient`/`stage` bindings exist. The composed graph binds
`selectClientBinding` (Slice A's shared selector — `--client` forwarded unchanged, ambiguity stays
fail-closed in the selector), the formatter-wrapped renderer, `loadResourceSliceTemplateAssetsSync`,
`resolveUiAppRoot`, a runtime procedure probe, and a Fresh staging stager built on
`writeFreshRouteManifestSync`. No parallel selection or template authority is introduced.

## Item 33 — convention resolution

`agent-conventions.ts` matches the amendment exactly: `service-route-contract` → `index.route.ts`,
`service-island` → `${Pascal}Island.tsx`, `service-shared` → `${service}-loaders.ts`,
`service-form` → `${service}-form.tsx`, and `service-authorization` **dropped** (id removed from the
union; no standalone planner leaf). No compatibility asset or extension point was added. The
existing `assertAppConventionsResolve` runs inside the passing tree test (declared-vs-parsed path
equality plus on-disk existence in the generated app), so F's obligation — keep it green against
the retired set — is met. Slice G retains the guidance rewording and the new focused test.

## Slice E LOW findings

- **LOW-1 (conflict-free command dry-run): absorbed.** Covered at the command level through the
  composed tree (`audits` dry-run: zero writes, shared files byte-identical, no conflict thrown).
- **LOW-2 (blank `--procedure` guard test): deferral valid.** Any fix touches
  `generate-resource-input.ts`/`generate-resource-command*.ts`, none of which is in the amended
  33-path Slice F set; the Slice E evaluator classified it optional. Recorded in `worklog.md`,
  `context-pack.md`, and the PR body. Not blocking, not arch-debt.

## Gate evidence — independently re-verified

| Gate | My run | Result |
| --- | --- | --- |
| Focused four-file suite | `run-deno-test.ts -- --allow-all` on the two writer tests + `route-templates_test.ts` + `public-command-tree_test.ts` | exit 0; **32 passed, 0 failed** — matches worklog exactly |
| Package `src` unit suite | `run-deno-test.ts -- --allow-all packages/cli/src` | exit 0; **1316 passed, 0 failed** (see LOW-3 on the worklog's 1324 count basis) |
| Full `packages/cli` incl. e2e tests | same wrapper on `packages/cli` | 1708/1710; the 2 failures are **environment-caused** (fake browser executables under the noexec temp mount fail to spawn, `Permission denied (os error 13)`) in `e2e/tests/.../service-client-runtime-probe_test.ts` — a file this slice does not touch (`git log be3e3dded..HEAD -- packages/cli/e2e` is empty); not a Slice F regression |
| `check:assets-barrel` | re-run | exit 0 (regeneration + `git diff --exit-code` clean → `embedded.generated.ts` is fresh) |
| `check:publish-assets` | re-run | exit 0 |
| `check:emitted-samples` | re-run | exit 0; 48 samples / 38 paths — matches worklog |
| `check:mcp-export-corpus` | re-run | exit 0; sha256 `cc64442f…`, 35 pkgs / 273 subpaths / 7846 symbols — matches worklog |
| `arch:check` | re-run | exit 0 (WARN-only census; no FAIL) |
| `quality:gate` | re-run | exit 0 |
| `deno.lock` | `git diff` + `git hash-object` | unchanged, blob matches recorded baseline |

JSR audit, `publish:dry-run`, `deps:prod-install`, and the two docs gates were not re-executed
(publish-surface inputs are covered by the re-run `check:publish-assets`/corpus gates and the
slice adds no new export); their worklog exit-0 records are accepted as evidence. Prohibited
runtime gates (Aspire/Docker/browser/`e2e:cli`) were correctly **not** run by any lane; hosted
`scaffold.runtime` acceptance remains Slice G's, per D11 and the run plan.

## Findings

| Severity | Finding | Evidence | Disposition |
| --- | --- | --- | --- |
| LOW-1 | The "**33/33 planned paths**" claim (PR #1956 body, IMPL comment, `context-pack.md`) is arithmetically coincidental, not exact: plan item 24 (MCP corpus) is unchanged, while `packages/cli/src/public/features/root/public-command-dependencies.ts` — **not** in the amended Slice F enumeration — is modified (+~185). The edit is the locked plan's **Slice E item 6** implemented to its letter, deliberately deferred by landed Slice E, and declared in this run's `plan.md` scope ("Production composition for Slice E"), so it is plan-listed and recorded — but the F enumeration was never formally amended to carry it the way item 33 was for `agent-conventions.ts`, and the evidence surface silently substitutes one path for another. | diff `be3e3dded..HEAD`; plan Slice E item 6; Slice E `evaluate.md` ("public-command-dependencies.ts … provably untouched"); run `plan.md § Scope` | Non-blocking. Accurate accounting belongs in the final #1354 acceptance matrix: state "32 amended-F paths + Slice E item 6 composition" rather than "33/33". |
| LOW-2 | `implement.md` carries no `## SKILL` chapter (protocol rule 13 names this a finding for implementation briefs). Mitigated: the supervisor implemented in-session rather than briefing a sub-agent, and the run artifacts otherwise record skills/lanes. | `implement.md` (5 lines) | Non-blocking hygiene; add a SKILL line if the brief is reused. |
| LOW-3 | Worklog's "full package-owned CLI unit suite … 1324 passed" does not state its path basis; `packages/cli/src` reproduces **1316/1316 exit 0** and full `packages/cli` yields 1710 results. The verdict (exit 0 on package-owned code) is confirmed either way; only the count's provenance is imprecise. | this session's wrapper runs | Non-blocking; name the test root next to the count in future gate tables. |
| LOW-4 | `examples/index.tsx.template` still describes the canonical example as an "optimistic-mutation flow" although the optimistic mutation was retired with the old showcase. Slice G owns the guidance/wording pass; this stale copy should be swept there. | `packages/cli/src/kernel/assets/app/routes/examples/index.tsx.template:24` | Defer to Slice G. |
| OBS-1 | `createResourceSliceStager` and `resolveResourceProcedure` embed raw `Deno.*`/subprocess adapter logic inline in the composition root (`public-command-dependencies.ts`) instead of under `kernel/adapters/`. D8's letter is honored (no `Deno.*` in the application layer; the composition root instantiates adapters), and `arch:check`/`quality:gate` are clean — but these are the largest inline adapter bodies in that file and a natural extraction candidate if they grow. | `public-command-dependencies.ts:460-543` | Observation only; no action required. |
| OBS-2 | The Fresh-derivation-ordering proof is a source-text index assertion (`indexOf` ordering in `write-app-files_test.ts:98-112`) rather than instrumented write-order. Sequential `await`s make source order execution order here, and the end-to-end test observing real derived `.generated/*` after init closes the gap. | `write-app-files_test.ts` | Acceptable; instrumented ordering would be sturdier if the writer is ever parallelized. |
| OBS-3 | Stacked base: the PR targets `feat/app-service-client-wiring`, so the required `ci` workflow does not run on this PR (non-main base skips required checks) and the Slice A/E commits appear in its diff until they merge. Pre-existing stacked-base material (selector, unregistered command, planner/templates/adapters) was **excluded** from this evaluation's scope and was separately evaluated in runs `--1354-a`…`--1354-e`; only `be3e3dded..HEAD` is judged here. The merge coordinator must ensure real CI runs before any merge. | PR #1956 `baseRefName`; drift.md "stacked base advanced" | Known, recorded drift; coordinator-owned. |

## Arch-debt delta

None owed. `arch:check` FAIL=0 on every root; `quality:gate` exit 0 with only pre-existing
allowances; no new `deno-lint-ignore`, no new `as unknown as` in the slice diff (the one
`quality-allow` cast in `public-command-dependencies.ts` predates this slice and carries its #1276
annotation); no retire-set debt concealed.

## Verdict

| Field | Value |
| --- | --- |
| Verdict | **`PASS`** |
| Rationale | The amended locked Slice F contract is implemented completely and provably: the 18-template retire-set plus manifest/carrier/support keys and the manual route seed are gone with no surviving consumer; init emits exactly the planner's `form + partial` preset with formatted, hash-valid ownership markers; init and the production-composed command render byte-identical output for **all** canonical roles, proven both by role-map equality and by a conflict-free exact-preset dry-run of the real command against real init output; Fresh manifest/routes derivation follows all route emission with no seed remaining; `generate resource` is registered fourth with exact help and child-order assertions through the production dependency graph; item 33's five conventions are re-pointed or dropped exactly as amended with `assertAppConventionsResolve` green; Slice E LOW-1 is absorbed and LOW-2 validly deferred; `deno.lock` and `service-query.ts.template` are byte-untouched. Every load-bearing gate was independently re-run in this session and reproduced green (focused 32/32, src suite 1316/1316, all four carrier/publish/sample/corpus checks, `arch:check`, `quality:gate`); the only full-suite failures are environment-caused browser-probe spawns in files this slice does not touch. The four LOW findings are accounting/hygiene items that do not change behavior, scope, or doctrine standing. |
| Blocking findings | **None.** |
| Next step | Supervisor commits/pushes this evaluation and posts the IMPL-EVAL phase comment on PR #1956; Slice G proceeds (guidance wording — including the LOW-4 stale copy — and hosted `scaffold.runtime` acceptance); the final #1354 acceptance matrix should carry the LOW-1 path-accounting correction. |
