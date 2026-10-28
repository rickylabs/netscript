# S8 worklog

## Design

1. Public surface: six-lane Utility docs shell, stable Vento components, light/dark, accessible mobile navigation and Pagefind palette.
2. Domain vocabulary: lane = curated docs branch; scheme = light/dark; location marker = ink square; code frame = tabs, path header, copy and scrollable numbered code; token = named role resolved from Figma contexts.
3. Ports: Lume page data and nav plugin; Pagefind search/results API; DOM dialog/IntersectionObserver/Clipboard; optional localStorage; filesystem only in generation/check tools.
4. Constants: scheme and lane sets in site data/browser modules; Figma collection modes in generator; shared browser viewport/scheme/route matrix; red-role allowlist limited to logo/error declarations.
5. Commit slices: tokens/fonts → shell/layout → components/prose → search/mobile → checks/evidence, as detailed in plan.md with owned files and proving gates.
6. Deferred scope: S8b content, package runtime and tokens v2 implementation, backend work, publishing and merge.
7. Contributor path: `tools/docs-site/README.md`.

## Owner override

“Run PLAN-EVAL before implementing and IMPL-EVAL after, both with claude -p --model claude-opus-5-5 --effort high, read-only, stdin closed, blockers only. Fix once, record both verdicts.” This overrides the default feature evaluator matrix, preserving separate session/family.

## Bootstrap

- Routing resolved via matrix JSON, baseline synchronized to main; no existing implementation found.
- No labels per assignment. PR body uses Refs per operator-specific instruction (generic closing-keyword boilerplate conflicts). Final canonical reply uses assignment-file handoff.
- PLAN-EVAL pending; no implementation started.

PLAN-EVAL round 1: FAIL_PLAN (diagram strategy and durable token-source/CI triggering). Fixed once: locked inline generated SVG transform; preserved renderer output; durable snapshot under tools/docs-site/figma-variables; explicit Pages trigger paths and shipped browser module paths. Round 2 pending. Baseline docs build passed (236 HTML pages). Draft PR #2439 open.

## Plan gate — terminal decision record

- Round 1: FAIL_PLAN; diagram ownership/theming strategy and durable token source/CI triggering. Fixed once; evaluator confirmed those items resolved in round 2.
- Round 2: FAIL_PLAN; inlining removes the source image and alt from Markdown twins/llms.txt.
- Concrete amendment prepared: keep a hidden source `<img src alt>` for twin extraction; accessible inline SVG with unique IDs; verify the built twin and accessible diagram name. This amendment is unreviewed.
- Per supplied leaf profile and feature plan protocol, two FAIL_PLAN verdicts end the loop. No third round, no implementation, no self-certification. Escalated through PR #2439 and canonical assignment report.
- Evaluator read-only processes completed. No managed evaluator lease was acquired; none remains to release. Local MCP research processes were terminated after their responses. No app, browser server, database or container was started by this run.

## Baseline checks

| Command | Result | Meaning |
| --- | --- | --- |
| `deno task --cwd docs/site build` | exit 0 | Baseline only: 236 HTML pages; existing source-format/rendered-output gates pass. |
| `npm ci --ignore-scripts` in S0 harness | exit 0 | Existing pinned browser dependencies installed; no dependency source changes. |
| `npx playwright install chromium` in S0 harness | exit 0 | Browser preparation only; no test or screenshot claim. |
| `deno task --cwd docs/site diagrams:check` | exit 1 | Unproven baseline: pinned Mermaid browser could not launch because a system shared library is absent. Generated assets were not changed. |

No implementation checks, axe results, keyboard proof, Pagefind proof, link-check verdict or screenshot artifact exist for this PR. The full CLI E2E gate has not been run because implementation did not pass the prerequisite plan gate.

Reconcile: current head contains only this scoped run record; unrelated files, assignment and lock files remain uncommitted. Draft PR stays open for coordinator review; no labels, readiness, merge, tag or release actions taken.

## Owner-directed continuation

After both plan failures were surfaced, the owner directed: “If more work remains, keep going and mark ready when done.” This resumes the work on the concrete B3 amendment. Preserve both historical FAIL_PLAN verdicts and get independent confirmation of the corrected plan before implementation. Keep the PR in draft until the actual revamp and gates are complete.

Coordinator disposition: “approves amendment B3 with two conditions: the source img uses the hidden attribute and loading=lazy, and IMPL-EVAL verifies the twin and accessible-name assertions. The plan gate is closed by this approval. Proceed through slices 1-5 now from head 74d15bd, push every step to PR 2439, and stop at READY. Everything is approved, never wait.”

## Slice 1 — tokens and fonts

- Generated `styles/tokens.css` from the durable Figma snapshot using target-context alias resolution; Scheme colour roles take precedence over similarly named geometry properties. Cycle/missing-alias/missing-mode paths fail closed.
- Self-hosted Latin WOFF2 Host Grotesk variable and Fragment Mono normal/italic, with OFL files. Root context is Studio/Utility/Neutral/Ink/Compact and data-scheme; saved scheme parsing catches unavailable storage.
- Gates passed: generator freshness; two resolver tests through structured test wrapper; structured check (includes unstable-kv by default), lint and TS format wrappers; existing docs build (236 HTML pages) and git diff check. Lint explicitly uses docs/site config because the root config excludes tooling; no rule suppressions.
- Environment fix: browser shared libraries unpacked into untracked project run evidence; no system mutation or cache deletion.
- Independent slice review pending before sign-off commit.

Slice 1 independent review: PASS. Reconcile: no foreign edits or lock changes. PR #2439 stays draft; same branch and protected ownership. Next slice removes legacy token references and scheme selectors as the reviewer noted.

## Slice 2 — shell and layout

- Full-width Utility topbar, six lanes, active-lane-only tree, 272px sidebar, 544px prose / 720px wide blocks, desktop TOC and native mobile disclosure, reference section anchors, breadcrumbs/footer and modal navigation drawer. Existing tab/runtime/comparison/copy scripts were extracted without removing behavior.
- Gates: docs build/rendered-output PASS (236 HTML pages); scoped site-config/data typecheck PASS; structured browser-JS lint and format PASS; no undefined semantic CSS roles and no old scheme selectors; real Chromium article renders at 390/1280 Dark had no page errors or horizontal overflow; mobile drawer opens and Escape closes.
- Full link check currently fails solely on newly requested `/design-system/`: that content belongs to completed sibling PR #2437, which is still draft and absent from main. No broken-link exemption or placeholder was added. Verify the composed site once S8b lands; this remains explicit integration work.
- Independent shell slice review pending.

Shell review requested a fix for overlapping mobile reference/TOC bars. Fixed by showing the native disclosure only on article/landing pages; reference keeps its section nav. Drawer height cap and mobile scroll padding also corrected. Exploratory axe found the inherited link-inside-summary pattern; replaced it with native summary plus separate Overview link. Duplicate automatic pagers are suppressed when the article already includes a pager.

The isolated pinned Mermaid run now passes all 16 source SVG comparisons; only missing worker libraries/sandbox launch setup were addressed, without source or gate changes.

Slice 2 repair review: PASS. Chromium article at 1280 Dark has zero serious/critical axe findings. At 390 Dark, the scrolled CLI section link remains visible/focusable; adding explicit focus to scroll regions resolves the table keyboard finding. Full strict matrix follows in slice 5. Reconcile: no ownership/lock drift, design-system destination still waits on sibling #2437; final composed link gate remains required.

## Slice 3 — components and prose

- Rebuilt all 16 existing Vento components while preserving arguments. Added the Utility signature kit and shared CodeBlock: path headers, gutters, tabs/runtime synchronization, clean copy text, ruled cards, two-column object API rows, native file lists, pager, status badges and semantic callouts.
- Homepage now follows the reference hierarchy: display/install aside, pillars, quickstart runtime tabs, owned-source tree/code, four-column capability grid, learning path and footer. The existing contract explanation remains available in a disclosure; rendered homepage semantic checks remain intact.
- Diagram filter maps only presentation to semantic ink roles, isolates all IDs and names inline SVG. Original renderer-owned assets stay byte-identical. Source `<img>` has `hidden` and `loading=lazy`; its raw source URL is base-prefixed once by the existing plugin, so the Markdown twin retains the correct canonical image URL/alt rather than a duplicate base path.
- Gates passed: build and source/rendered-output checks; four tool tests (alias failure modes and real-SVG ID/name/paint contracts); structured tools/site typecheck, lint and TS format; docs snippets; representative home Light/1280, article Dark/390 and reference Dark/1280 browser/axe checks with zero serious/critical findings, zero page errors and no horizontal overflow.
- B3 full built-twin/accessible-name assertions and two-diagram browser fixture are required in the final browser suite and IMPL-EVAL. Independent slice review pending.

Slice 3 repair: preserved the existing fileTree single-root `tree` alias alongside items. Built runtime-config now includes runtime/current/features, and afterRender rejects any empty root file tree. Learning-path current state and scroll-surface tabindex now render without JavaScript; duplicate API row IDs yield to heading anchors. Heading permalinks are added after twin extraction to keep Markdown headings clean.

B3 browser assertions PASS: hidden/lazy source image, canonical twin URL/alt, named inline diagram, and duplicate-free two-diagram fixture. Clipboard excludes gutter, runtime ArrowRight choice persists/reloads, all four no-JS panels remain visible, and blocked localStorage does not break drawer/content. Evidence: slice3-browser-evidence.json. A real assertion caught an async filter integration issue; the filter now returns its build-time SVG synchronously and the build itself rejects missing named SVGs.

The old copper favicon is now a generated sharp N mark; its two semantic paint declarations come from the same Figma resolver in an embedded generated token layer. Freshness checks cover both outputs. No hand-authored palette.

Slice 3 repair review: PASS; reviewer confirmed all B3 guards and source/twin contracts, fileTree alias, server-rendered keyboard/current-step states, generated favicon and no-JS paths. Applied the suggested short Permalink label to avoid repeating heading text in its accessible name. Reconcile: only owned site/tooling and run files changed, no generated Mermaid/source-content or lock changes. Full design-system link still depends on #2437. Next: Pagefind palette and mobile search.

## Slice 4 — Pagefind palette and mobile search

- Native dialog palette uses the generated Pagefind API at the deployed base path; lazy metadata/index loading, lane filters/counts, grouped page/heading results, bounded fragment loading with more-results control, safe text/mark rendering, and same-origin result URLs.
- Keyboard: Cmd/Ctrl-K and Space/Enter trigger, Arrow navigation with valid active-descendant state, Enter opens the selected result (including same-page hashes), Escape closes and restores focus. Empty/loading/error/reload states and generation checks prevent stale render after query changes or closing/reopening.
- Standard Pagefind UI remains an independent fallback through the native details section, loaded on demand by shell.js. No Pagefind request occurs before search interaction.
- Gates PASS: existing build/rendered checks, structured site check and browser lint/format, no undefined semantic roles, and live Chromium tests at Light/1280 and Dark/390. Those cover real query/filter results, keyboard, zero serious/critical axe findings, empty state (quoted impossible phrase), standard fallback results, unavailable index/reload state and delayed stale responses. Evidence: slice4-browser-evidence.json.
- The latest CI failure was read and is still only the reserved design-system route from pending sibling #2437. No source/build failure or gate exemption introduced. Independent slice review pending.

Slice 4 independent review: PASS. Added the suggested no-JavaScript fallback message with a real reference link. Final slice will replace thin exploratory PASS strings with Playwright JSON, per-route/scheme/width axe reports, screenshots, browser provenance and durable command receipts. Reconcile: no labels or lock drift; current CI remains blocked solely by sibling design-system content.

## Slice 5 — browser, policy and CI evidence

- Added a separate docs suite using S0 pinned tooling: home/article/reference/design-system/search, Light/Dark at 390/1280; viewport and full-page PNGs, full axe, public browser/source provenance, keyboard, Pagefind fallback/error/stale response, clipboard, no-JS/denied storage, B3 twin/name/ID assertions and fileTree compatibility. No skips or accessibility exclusions.
- Added CSS grammar policy with alias resolution, raw colour/undefined role/red-state checks across maintained UI and inline rendered diagrams. Real negative controls fail with exit1 for gradient literals and semantic red borders. Independent review found shorthand/paint coverage gaps; fixed canonical cssText declaration capture, logical/SVG/filter/text paints and all-property alias checks. Focused normal and expanded negative-contract tests pass. Historical FAIL_FIX retained; repair review pending.
- CI keeps all existing exports/snippets/build/link/caveat checks. An independent browser job builds the actual site and uploads reports/traces/PNGs/atomic gate receipt even on failure. Deploy requires the browser gate. New tooling triggers are covered by the existing Pages workflow test.
- Fixed a doubled deployment base in component links in Markdown twins; all B3 browser assertions now pass. Corrected font fallback families and reject unknown token-name collisions. Original Mermaid assets remain unchanged; the inline presentation now also normalizes named red paint.
- Structured checks/lint/format pass for tools, browser tests and touched site code. Six tool/workflow tests pass; root quality scan passes with no new allowances. Full previous browser run:44 PASS /4 FAIL /0 skipped, solely the design-system route missing from still-open sibling PR2437. Final repaired matrix is running. Docs build/source-format/rendered-output passes236HTML pages; links remain blocked by that single destination.
- Full `deno task e2e:cli` was attempted once: UNPROVEN, stopped in environment preflight (Aspire doctor and unavailable Docker daemon). No generated AppHost/database was started. Readonly leak audit found foreign/unproven resources and left them untouched; details are private.
- Reconcile: S1 PR2435 remains draft/unmerged; local Figma generation remains necessary. S8b PR2437 is ready/green/clean but unmerged. PR2439 remains draft while the dependency and final evidence are incomplete. No labels, force push or GitHub merge.
- Additional readiness check `deno task check:agent-docs-prose` correctly fails: the changed rendered Markdown twins require native generated CLI/MCP carrier refresh. This is upcoming generation/integration work; no gate exemption.

Slice5 repair review PASS. Final repaired matrix again44PASS/4FAIL/0skipped, only reserved design-system404; all20 completed axe audits have zero serious/critical findings (full reports retained). Evidence JSON is explicitly marked uncommitted working-tree evidence, not immutable-head sufficiency. Both final actual negative controls exit1. Six focused tests, token freshness and structured checks/lint/fmt pass. Sign-off commit ships checks while integration dependency and generated-carrier work remain explicit.

Slice5 pushed69f231b. Hosted e2e-cli workflow manually dispatched at that source head without labels or gate changes, because the local full suite is environment-unproven. Native carrier reconciliation scope is declared before generation. Doctrine navigator read; existing generated data boundary, no handwritten framework code.

Native generation completed: only CLI prose carrier and MCP publish payload changed. Native decode audit:190entries before/after,142changed,0removed, both non-site context entries unchanged,0doubled canonical bases. MCP selected prose282008/294912bytes. Native prose/MCP/publish freshness commands and structured generated-file typecheck pass. Quality/architecture gate exit0 (existing warnings retained). Assets-barrel generation/check and independent generated-data review follow; final git-diff freshness must run after reviewed data is committed.

Independent generated-data review PASS: native provenance,190entries/0removed, preserved contexts, corrected canonical links and unchanged MCP budget verified. CI69f independently reproduced44PASS/4FAIL, only actual design-system404, and uploaded artifact12805328505. All owned feature/keyboard/B3 tests passed in CI; the build failure is solely links to the missing same prerequisite. Committing reviewed native payloads; final assets-barrel freshness follows at the committed head.

## Composed-site readiness

- Normal local composition imports approved S8b9bc3445 unchanged; protected-file diff against that head is empty. Only generated CLI/MCP payloads conflicted and were regenerated from the combined site. Main/GitHub PRs are not merged by this run.
- Real integration found an empty Themes disclosure because Lume synthetic groups have slug/basename but no page title/URL. Shared nav now derives its label, opens for active children and omits fake Overview links. The DS browser test pins this behavior.
- Addressed evaluator Markdown notes in owned markup: decorative hint/language/counter text omitted, inline spacing preserved, quickstart link retained and homepage H1 added only when the article DOM has none. The twin regression ignores fenced code before counting headings. Intermediate runs during rebuilding and the initial incorrect heading assertion are invalidated; final stable output is separate.
- Final stable combined browser command PASS48/0/0,24completed axe audits with0serious/critical,36PNG captures (viewport+full), no horizontal overflow/page errors. Build251HTML,23996internal links and15caveat markers pass. Seven structured root tests include the complete S8b renderer fixture bridge. Frozen entrypoint typecheck and scoped lint/format pass.
- Generated-content audit:190->205entries; all15Design system twins included;0removed and non-site contexts unchanged; one home H1 outside code and working quickstart URL. MCP283387/294912bytes. New docs lock entries are only the existing pinned Lume sharp adapter closure from approved S8b thumbnail generation; no prior entry changed or removed. Native info provenance and audit retained; independent review required.
- First hosted e2e source69f: static and sqlite runtime PASS; Postgres one-pass suite FAIL34/1/0 at behavior.generated-guarded-service (command143), cleanup step passed. Desktop exception-boundary job also failed. No workflow/full-runtime green claim. Final unchanged suite will be rerun on reconciled source; no gate or unrelated service changes.
- Owned manual preview stopped. Playwright servers terminate with each run; foreign resources untouched.

Independent composition review PASS. Final stable browser result subsequently completed48PASS/0FAIL/0skipped;24axe audits have0serious/critical. Keep safe landing order #2437 before #2439; local composition enables complete review/CI without changing ownership or merging a GitHub PR. No claim that the owner requested S8a to land before S8b. Main reconciliation will use a normal merge (no force/rebase).

Reconciled current main21dada0 by normal merge after composed source4e0560e. This brings the already accepted telemetry isolation fix and its generated export corpus, without conflicts or docs UI changes. Protected S8b source still matches9bc3445. Native committed freshness and final CI/evaluation follow on this reconciled head.

Final IMPL-EVAL round1 FAIL_FIX found18missing legacy spacing/type roles in the composed protected stylesheet. Repair generates compatibility aliases through authoritative Utility density/type roles, rejects alias/collision gaps, checks all shipped CSS for unresolved roles (maintained sibling CSS also gets raw/red checks; only generated Pagefind CSS uses role-only validation), asserts real nav gaps, and removes duplicate layout identity row. Repaired full browser48PASS/0/0 before the further policy coverage strengthening;8focused policy cases follow for that stricter source collection. No protected source or token source snapshot changed. Native twins/carriers remain identical because this is presentation-only.

Final IMPL-EVAL repair PASS for S8 implementation, with merge readiness explicitly NOT READY pending committed proof and configured fullCLI runtime green/owner waiver. Final stable repair matrix48/0/0 with24axe0serious/critical, all shipped styles checked including protected section; both actual negative controls exit1. Synthetic-group breadcrumbs fixed and regression-tested on Studio. No carrier or protected-source changes. Committing/pushing reviewed repair now, then exact-head native freshness/browser/negative/Pages proof and one final unchanged full runtime run. No gate, exception or landing-order waiver is invented. The PR remains draft while those conditions are open.

## Coordinator slice5 follow-up — canonical design sources

- Added `docs/design-system/**` to both Pages workflow event filters. The classifier now treats site and canonical design sources as Pages inputs in Markdown, other docs and nested-config branches.
- Regressions verify source-only PR builds and main-push deployment selection, both trigger lists, and deployment consumption of `needs_pages`. New assertions failed before the fix (65PASS/2FAIL) and all67tests pass after it. Structured check/lint/format pass for all3editedTSfiles. The classifier test now uses the existing `@std/assert` import-map alias; no dependency or lock change.
- Scope is CI selection only; rendering/runtime/package inputs remain unchanged from the reviewed implementation. Existing 120/0/0 Postgres smoke and48/0/0 browser evidence are retained for3a7a4a5; no fresh-head broad runtime claim.
- Privacy: run notes contain only relative paths and compact counts; evaluator identifiers, absolute paths and raw outputs stay outside tracked runs. Independent focused review pending before sign-off commit.

Focused independent addendum review PASS. Source-only design edits are now connected to both workflow filters and classifier outputs consumed by build/deploy. Review-thread gate PASS with zero unanswered threads. Committing/pushing the scoped follow-up; existing broad UI/runtime proof remains identified by its tested3a7a4a5 head. No new raw receipts or private execution context added to tracked runs.
