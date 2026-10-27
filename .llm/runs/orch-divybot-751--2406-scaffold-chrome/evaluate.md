# Evaluation: PR rickylabs/netscript#2407 (`orch/divybot-751`) — #2406 items 1 + 4

Independent IMPL-EVAL. Only write is this file (plus this session's final verdict line).

## Metadata

| Field | Value |
| --- | --- |
| Run ID | `orch-divybot-751--2406-scaffold-chrome` |
| Target | PR #2407, branch `orch/divybot-751` (upstream issue #2406 items 1 + 4) |
| Baseline / head | `a833dfa` (main, 0.0.8) / `85e5a783f6334e2a3805a8eb82b441e793b2116e` (matches `impl-eval-head.txt`) |
| Diff scope | `git diff a833dfa..HEAD -- packages skills`: 23 files, +1067/−354 (2 regenerated carriers) |
| Archetype | 6 — CLI tooling |
| Scope overlays | frontend (scaffold output), docs (skill) |
| Evaluator route identity | As observed by this session: `muse_spark` family via OpenRouter (`model=openrouter/meta/muse-spark-1.3`, `variant=xhigh`, workload role `implementation_evaluation`). Independent of the generator (Claude Opus 5.5, anthropic). |
| Evaluator | impl-eval session, 2026-10-21 |

Scope note (per brief): items 2 + 3 (theme-chain docs, MCP corpus, app `AGENTS.md`) belong to sibling PR
#2408 — not evaluated here, not a finding.

## Process Verification

| Check | Result | Evidence |
| --- | --- | --- |
| Plan-Gate passed before implementation | PASS (N/A, justified) | `worklog.md` §PLAN-EVAL records `PLAN-EVAL: N/A` with the `run-loop.md` §4 risk-selection reason (bounded scaffold/CLI change, additive knob, no sequencing/destructive step). Acceptable per protocol. |
| Design section exists in worklog | PASS | `worklog.md` §Design: public surface, domain vocabulary, ports, constants, 6 commit slices, deferred scope, contributor path. |
| Commit slices match design plan | PASS | S0 6b370ab, S1 cc5517e, S2 10766ea, S3 88b6d0e, S4 601e4bd, S5 85e5a78 — in design order; S5's generator-binding normalization recorded in `drift.md`, not silent scope creep. |
| Each slice has a passing gate | PASS | Per-slice PR comments on #2407 with gate tables; independently re-run below. |
| No speculative seams (unused files) | PASS | Every new file reachable: `navigation.ts.template` via manifest → `write-app-files.ts` (line 238); `app-navigation.ts` via `web-scaffold.ts` + `remove-ui-page.ts`; `navigation-registration` role via add/remove commands. |
| Constants used for finite vocabularies | PASS with note | `APP_NAVIGATION_FILE`, `APP_NAVIGATION_DECLARATION`, `APP_CUSTOM_STYLES_MARKER`, `UI_REGISTRATION_ROLES`, `GENERATED_LINE_WIDTH` all named. Note: design named a `NAVIGATION_MATCH` constant, but `NavigationMatch` is expressed as a TS union type (`NavigationMatch = 'exact' \| 'prefix'`) in the app template with no runtime constant needed on the CLI side — equivalent, not a violation. |

## Brief questions (explicit answers)

1. **Chrome on every page except `chromelessRoutePrefixes`; `/design` keeps only its SidebarShell; single `page` Partial in both branches?** YES. `_layout.tsx.template:14-21` returns `<Partial name='page'><Component/></Partial>` when `!rendersAppChrome(...)`, else the same partial wraps top bar + `<Component/>` (lines 24, 47-49): exactly one `page` partial per branch. `navigation.ts.template:32` ships `chromelessRoutePrefixes = [design href]` only; `isUnderPrefix` is segment-aware (`pathname === prefix || startsWith(prefix + '/')`), so `/designer` keeps the chrome. Consumer evidence: 200s with `ns-topbar` on `/`, `/dashboard`, `/notes`, `/admin/audit`, `/health`, `/examples`; dev `/design/tokens` has SidebarShell and no top bar; exactly one `page` partial marker on every rendered page.
2. **`ui:add page` nav correct, idempotent, fmt-canonical, safe without `navigation.ts`?** YES. One-segment default / `--nav [label]` force / `--no-nav` suppress (`app-navigation.ts:55`); idempotent via `routeReference` presence check (`app-navigation.ts:109`); entry rendering wraps past col 100 (`renderNavigationEntry`, lines 90-96); fmt-canonical proven by tests running the generated page + nav entry through `DenoGeneratedSourceFormatter` and asserting identity (notes, data-screen, 49-char name, static + island — worklog S2); missing/unrecognizable `navigation.ts` → `Next:` guidance by default, pre-write throw for explicit `--nav` (lines 70-80). `--nav` outside page scaffolds is rejected (`add-ui-command.ts:99-101`, tested at `add-ui-command_test.ts:137-147`).
3. **`ui:remove page` removes exactly what add wrote (incl. nav) and refuses author edits; normalization narrow?** YES. Removes page triad files + router entry (`removeScaffoldedAppRoute`) + nav entry (`removeNavigationEntry`, matched by route id), reports `navigation reconciled|unchanged` (`remove-ui-command.ts:66`). `withoutGeneratedRouteBinding` (`remove-ui-page.ts:140-144`) strips exactly two patterns — the `import { routes } from '…/.generated/routes.ts'` line and one `.withRoute(routes….$route)` chain link (regex anchored to `$route`) — before the unchanged comparison; the author-edit test still refuses (`remove-ui-page_test.ts:173-185`). Narrow enough: it cannot match app-owned `appRoutes[…]` bindings, so it cannot mask an author edit to the typed binding. Generator route shown as pre-existing on `main`, root-caused in #2409 rather than fixed here (packages/fresh outside run surface) — correct scoping.
4. **`styles.css` tail preserved without duplicating imports?** YES. `splitAppCustomStyles` splits at the marker, tail written back verbatim; per-item `@import` scan restricted to the managed head, excluding theme-base imports so tail `@import`s are neither hoisted nor duplicated (`registry-styles.ts:64-73`). Fresh output byte-identical (`…marker\n`). Two new tests (survival across two `ui:add ai` runs; fresh ends with empty custom section) — 42/42 in the ui kernel dir.
5. **Every `netscript-build` SKILL.md claim true against the code?** YES (verified line by line): verb map (`ui:remove page` → `remove-ui-command.ts`; `generate routes` → `generate-routes-command.ts` exists); stale "no generate routes / no ui:remove" paragraph replaced; chrome/nav files real (`routes/_layout.tsx`, `navigation.ts`, `chromelessRoutePrefixes`); `--nav`/`--no-nav` real flags with the stated semantics; page rhythm (`ns-shell ns-section ns-stack ns-stack--lg` + `PageHeader`) matches `pageTemplate` output; theme chain `styles.css → tokens.css (:root / [data-theme='dark']) + theme-bridge.css` matches the scaffold assets (`_app.tsx.template` sets `data-theme`); S3 tail preservation true; pre-`navigation.ts` fallback (allowlist top bar) true per old template behavior; no `data-ns-theme` invented (0 hits in template and skill — consistent with `drift.md`'s issue-premise note). The #752 design-guide slug is deliberately absent (page not on main); merge-order rule recorded in both PR bodies.
6. **Concept of Done per slice?** YES. Reachability (above); constants (above); one-line JSDoc one-liners on all new public functions (`planNavigationRegistration`, `navigationLabel`, `renderNavigationEntry`, `addNavigationEntry`, `removeNavigationEntry`, `writeStylesAggregator`, `removeUiPage`, `scaffoldUiPage`); contributor path named (`ui/page/app-navigation.ts` + rendered `navigation.ts`); folder cap holds after the `ui/page/` move (`ui/` = 8 children, `page/` = 7, verified by listing; cli WARN back to baseline 64). Gates pass (below).
7. **Unproven items (screenshots, `scaffold.runtime`) blocking?** NO. Browser screenshots / 390px (no `libnspr4.so` on host) and `scaffold.runtime` (no Docker daemon) are unproven locally, but the frontend overlay's route/browser/responsive gates are substantially met by the served-HTML evidence: all six chrome pages 200 with top bar + correct `aria-current`, chromeless dev route verified without the top bar, `deno task check` (fmt+lint+typecheck) exit 0 on the real generated app, plus unit-level fmt-canonical proofs. `scaffold.runtime` (which itself runs `ui:add page data-screen --island`) is CI's merge-readiness gate on the PR, not waived — recorded honestly as unproven, not claimed. Non-blocking for IMPL-EVAL.

## Static Gates (independently re-run on `85e5a78`)

| Gate | Command | Result | Evidence |
| --- | --- | --- | --- |
| Unit tests (ui kernel + ui features + app templates + agent features) | `run-deno-test.ts -- --allow-all packages/cli/src/kernel/application/ui/ packages/cli/src/public/features/ui/ packages/cli/src/kernel/templates/app/ packages/cli/src/public/features/agent/` | PASS | 222 passed / 0 failed (covers the 124-, 42-, 81-, 95-count slice subsets) |
| Typecheck | `run-deno-check.ts --root packages/cli/src --ext ts,tsx` | PASS | 863 files, 0 diagnostics |
| Lint (changed CLI files, no-exclude config) | `run-deno-lint.ts --config .llm/tmp/fmt-751/no-exclude.json --file <18 changed .ts files>` | PASS | 0 occurrences |
| Format (changed CLI files) | `run-deno-fmt.ts --config .llm/tmp/fmt-751/no-exclude.json --ext ts,tsx --file <15 changed CLI .ts files>` | PASS | 0 findings (4 fmt findings seen in a broader root run are pre-existing drift in untouched files: init/list/update/ui-app-root-test — not this PR, left alone) |
| Carrier freshness | `deno task check:assets-barrel`, `deno task check:publish-assets` | PASS | both exit 0 |
| Quality scan | `deno task quality:scan` | PASS | 0 findings (7 pre-existing allowances, none in changed files) |
| Doctrine readiness | `deno task arch:check` | PASS | FAIL=0 for all members; cli WARN=64, identical to baseline |

## Fitness Gates

F-CLI-* have no dedicated script (`PENDING_SCRIPT` with manual evidence, per ARCHETYPE-6). Structural
spot-checks on the changed files: F-16 folder cardinality PASS (`ui/` 8 ≤ 12, `page/` 7 ≤ 12);
F-CLI-21 naming PASS (`*-command.ts`, `<verb>-<noun>.ts`, `*-port.ts` untouched); F-CLI-26 console
PASS (no `console.*` in changed command/use-case files); F-CLI-15/16 `Deno.*` PASS (only `@std/path`
`resolve`/`dirname`/`relative` in use cases — same as pre-existing `web-scaffold.ts`); R-A6-N5
composition PASS (add/remove commands only add options + report lines, no inline command bodies);
`arch:check` FAIL=0 backs the mechanical doctrine surface. No `// deno-lint-ignore` added.

## Runtime Gates

| Gate | Validation | Result | Evidence |
| --- | --- | --- | --- |
| Scaffold route check | branch-CLI scaffold → add two pages → generate routes → `deno task check` → Vite build + serve, HTML parsed | PASS | `consumer-proof.md` + `consumer-chrome-evidence.txt` + `consumer-ui-add.log` + `consumer-ui-remove.log` (7 routes, top bar / aria-current / single partial / byte-identical nav restore) |
| Removal on generator-touched app | `ui:remove page notes` after `generate routes` on the real scaffold | PASS | `router reconciled; navigation reconciled`, app `check` exit 0 |
| Browser screenshots / 390px | cached Chromium missing `libnspr4.so`, no root | NOT_RUN | honestly recorded as unproven; HTML-level evidence above substitutes |
| `scaffold.runtime` (Aspire/Docker) | no Docker daemon on host | NOT_RUN | CI merge-readiness gate; unproven locally, not waived |

## Consumer Gates

| Consumer | Validation | Result | Evidence |
| --- | --- | --- | --- |
| Generated app (fmt/lint/typecheck) | app `deno task check` on CLI-written `navigation.ts` + pages | PASS | exit 0 (`consumer-proof.md` step 5) |
| Generated app (serve) | Vite build + `deno serve`, parsed HTML per route | PASS | `consumer-chrome-evidence.txt` |
| `scaffold.runtime` e2e (`ui:add page data-screen --island`) | CI tier | NOT_RUN | covered by fmt-canonical unit proofs for island pages in the meantime |

## Anti-Pattern Check

| AP | Status | Evidence |
| --- | --- | --- |
| AP-1 (pipeline/template monolith) | CLEAR | `pageTemplate`/`chainCall` split; S2's 49-char overflow fixed in wrapped form |
| AP-6 (base flow orchestration) | CLEAR | spine abstracts untouched |
| AP-11 (IO outside adapters) | CLEAR | new use-case code uses `FileSystemPort` + `@std/path` only |
| AP-18 (string snapshots) | CLEAR | semantic assertions + formatter-identity proofs, not snapshots |
| AP-19 (permissions) | N/A | no new permissions surface |
| AP-21 (flat command folder) | CLEAR | `ui/page/` sub-feature emergence keeps `ui/` at 8 children |
| AP-22 (sub-folder barrel) | CLEAR | no new `mod.ts`/`index.ts` under `src/` |
| AP-23 (inline composition) | CLEAR | composition stays declarative |
| AP-24 (switch over union) | N/A | no new variant dispatch |
| AP-25 (side effects at edge) | CLEAR | writes go through `FileSystemPort` |
| AP-2/3/4/5/7/8/9/10/12/13/14/15/16/17/20 | N/A | outside run scope |

## Arch-Debt Delta

| Metric | Count | Evidence |
| --- | --- | --- |
| New entries | 0 | none created; plan's "none created" holds |
| Resolved entries | 0 | none touched in `debt/arch-debt.md` |
| Deepened violations | 0 | cli WARN=64 unchanged from baseline |
| Unrecorded violations | 0 | deferred items (page-shell primitive, nested nav, pre-#2407 removal, #2409 root cause) recorded in plan/drift/PR, not debt-grade |

## Findings

| Severity | Finding | Evidence | Required action |
| --- | --- | --- | --- |
| low | Include-scope fmt run flags 4 untouched files (`init-ui-command.ts`, `list-ui-command.ts`, `ui-app-root-command_test.ts`, `update-ui-command.ts`) | `run-deno-fmt.ts` on `--root …/ui` (broader than the accepted per-file method) | none for this PR — pre-existing drift, do not fold in |
| low | Uncommitted `deno.lock` adds one `npm:pg@^8.21.0` line; `git diff a833dfa..HEAD -- deno.lock` is empty, so it is worktree-local (parallel full-suite run side effect per worklog), not part of the PR | `git status --short`, `git diff` | drop before merge (`git checkout -- deno.lock`) or leave for the author; not a gate failure |
| info | PR body carries `Refs #2406` (not a closing keyword) and `Closes rickylabs/harness#751` | PR #2407 body | correct per the agreed split — neither #2407 nor #2408 closes #2406 alone; close-gate n/a for a non-closing `Refs` PR |
| info | `health-view` keeps `min-h-screen`, so the newly-chromed `/health` scrolls by the bar height; long-name query-loader `as const` line can still overflow fmt | worklog S1/S2 caveats | handed to #752's design follow-up; non-blocking |

No high/medium findings. No doctrine violation. No missing evidence beyond the two honestly-recorded
`NOT_RUN` environment limits (no Docker/root on host), which CI covers.

## Lessons for Promotion

| Lesson | Pattern | Applies to | Confidence |
| --- | --- | --- | --- |
| none — single-run observations (fmt-scope discipline, lock hygiene around parallel runs) stay in the run dir | — | — | — |

## Verdict

| Field | Value |
| --- | --- |
| Verdict | `PASS` |
| Rationale | In-scope #2406 items 1 + 4 complete: opt-out chrome with data-driven nav, linked/idempotent/fmt-canonical `ui:add page`, reconciling `ui:remove page` with a correctly narrow generator-binding normalization, durable `styles.css` tail, and a skill verified claim-by-claim against the code. All independently re-run gates green (222 tests, 863-file check, lint/fmt, carriers, quality, arch FAIL=0 / cli WARN=64=baseline); consumer proof on a real scaffold with byte-identical nav restore; Concept of Done met per slice; no debt impact; unproven items (screenshots, `scaffold.runtime`) are environment limits covered by CI, not blocking. |

VERDICT: PASS
