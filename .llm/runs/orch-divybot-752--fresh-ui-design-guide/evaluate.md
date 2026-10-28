# Evaluation: rickylabs/netscript PR #2408 (`orch/divybot-752`) — Fresh UI brandable tokens + agent design guide

## Metadata

| Field | Value |
| --- | --- |
| Run ID | `orch-divybot-752--fresh-ui-design-guide` |
| Target | PR rickylabs/netscript#2408 (upstream issue #2406, items 2+3; `Refs #2406` partial) |
| Archetype | 4 — DSL/Builder (`packages/fresh-ui`) + 6 — CLI tooling (guidance builder); scope overlays frontend, docs |
| Evaluator route (observed) | Muse Spark (`meta/muse-spark-1.3`) via OpenCode/OpenRouter freeload variant; session `01a15f75…`; non-Anthropic, independent of the Claude Opus 5.5 generator lane |
| Evaluated head | `f1442f37c479630b294b1159a27fb2c88c89bf7a` (matches `impl-eval-head.txt`; = brief head; includes the eval-brief commit on top of S4b `bd0e54d`) |
| Baseline | `a833dfa` (main, 0.0.8 cut) |
| Date | 2026-10-21 |

## Process Verification

| Check | Result | Evidence |
| --- | --- | --- |
| Plan-Gate passed before implementation | PASS (N/A justified) | `plan.md` § PLAN-EVAL: risk-selected skip (no public API/archetype change; additive/value-preserving); `worklog.md:29` records it before S1 |
| Design section exists in worklog | PASS | `worklog.md:13-29` seven-point checkpoint (surface, vocabulary, ports, constants, slices S0–S5, deferred scope, contributor path) |
| Commit slices match design plan | PASS | `git log a833dfa..HEAD`: S1 `0d28fe8`, S2 `dec6450`, S3 `0dcf39a`, S4a `54166ef`, S4b `bd0e54d`, in plan order; S4 split into two commits is a faithful sub-slice (slug fix + guidance), no scope change |
| Each slice has a passing gate | PASS | `worklog.md` §§ S1–S4 gate tables; all re-run independently below |
| No speculative seams (unused files) | PASS | S1: token files + one test; S2: one guide + edits to existing pages; S3/S4: concepts/corpus/conventions + tests; every new file reachable from public surface or a test |
| Constants used for finite vocabularies | PASS | `MCP_EMBEDDED_DOC_PATHS`/`MCP_EMBEDDED_DOCS_MAX_BYTES`, `DESIGN_GUIDE_SLUG`/`CUSTOMIZE_GUIDE_SLUG`, `DESIGN_REFERENCES` ids, `INTENTS`/`HOVER_INTENTS` in tests |
| Sibling scope respected | PASS | No touch of #751 files (`_layout.tsx.template`, `navigation.ts.template`, `web-scaffold.ts`, `remove-ui-page.ts`, `registry-styles.ts`, `route-templates_test.ts`, `netscript-build` skill); chrome wording neutral by agreement |

## Static Gates (all re-run by the evaluator on head `f1442f3`)

| Gate | Command | Result | Evidence |
| --- | --- | --- | --- |
| fresh-ui check | `deno task check` in `packages/fresh-ui` | PASS | 154 files, 0 diagnostics |
| fresh-ui lint | `deno task lint` in `packages/fresh-ui` | PASS | 154 files, 0 occurrences |
| fresh-ui test | `deno task test` in `packages/fresh-ui` | PASS | 191 passed, 0 failed |
| mcp check | `deno task check` in `packages/mcp` | PASS | exit 0 |
| mcp test | `deno task test` in `packages/mcp` | PASS | 199 passed, 0 failed |
| publish-assets test | `deno test --no-lock -A .llm/tools/generate-publish-assets_test.ts` | PASS | 6 passed |
| CLI slice tests | `deno test --allow-all --unstable-kv …/agent-conventions_test.ts …/public-command-tree_test.ts` | PASS | 9 passed (incl. real-scaffold path resolution) |
| CLI check | `deno task check` in `packages/cli` | PASS | exit 0 |
| CLI fmt/lint (temp config, root options only) | `deno fmt --check` / `deno lint` on the 3 changed CLI files | PASS | 3 files clean / clean (config + files removed after; not committed) |
| assets barrel | `deno task check:assets-barrel` | PASS | exit 0, no diff |
| publish assets | `deno task check:publish-assets` | PASS | exit 0, `_check` fresh, 237 HTML files |
| agent docs prose | `deno task check:agent-docs-prose` | PASS | exit 0 |
| docs links/accuracy/snippets | `deno task docs:links`, `docs:accuracy`, `docs:snippets` | PASS | 0 broken links/anchors; accuracy PASS; snippets exit 0 |
| docs site build + links | `deno task --cwd docs/site build`, `… check:links` | PASS | 237 HTML files; 39,168 links resolve |
| arch check | `deno task arch:check` | PASS | exit 0 (only pre-existing `export default` WARNs) |
| token reproducibility | brief's `--no-lock build-tokens.ts` + `git diff --exit-code registry/theme` | PASS | `REPRODUCIBLE`, byte-identical |
| lock hygiene | `git status -- deno.lock packages/*/deno.lock` | PASS | untouched |
| Token test negative control | 0.0.8 `tokens.css` swapped under the new test | PASS | 1 passed / 4 failed (matches worklog `4/5 fail`); restored byte-clean |

## Fitness / Concept-of-Done Gates

| Gate | Result | Evidence |
| --- | --- | --- |
| F-5 public surface (no new token names; bridge/components unchanged) | PASS | `git diff --name-only` on fresh-ui: only `tokens/*.json`, `build-tokens.ts`, `registry/theme/*`, test; component/island CSS untouched; bridge unchanged |
| F-7 doc score (one-liner comments on new public fns) | PASS | `readBlock` helper and `RELEASE_PAGE_PREFIX`/`DESIGN_REFERENCES` constants documented; guidance concepts are data with inline rationale |
| Reachability per slice | PASS | theme test reads generated CSS+JSON; MCP tests hit filesystem + standalone embedded corpus; CLI tests resolve refs in a real scaffold |
| Contributor path | PASS | guide for people/agents + `tokens/semantic.tokens.json` for derivation changes (plan §7, worklog §7) |
| Budget raise justified | PASS | 288→328 KiB with rationale at the constant; measured 326,595 B → 9,277 B headroom, same order as the previous margin |
| AP scan (AP-1/7/9/14/15/22/23/24/25, AP-11/18/19/21) | CLEAR | value-only token edits; additive concept table + guidance strings; no new barrels, no `Deno.*`/`console.*` outside edges, no giant snapshots (tests assert semantic substring/structural properties) |
| Arch-debt delta | CLEAR | no new/changed debt entries needed; follow-ups live as product issues in #2410 (see Q6) |
| Close-gate (#387) | PASS | PR body uses `Refs #2406` (partial) + `Closes rickylabs/harness#752`; no `Closes #2406` claim; milestone 0.0.9 + taxonomy labels present |

## Runtime / Consumer Gates

| Gate | Result | Evidence |
| --- | --- | --- |
| Browser render (generator evidence, pre-existing) | PASS (accepted) | `browser-probe.json`: `/`, `/dashboard`, `/design/tokens`, `/design/components` 200 in light+dark, 0 page errors; 2-line `:root` rebrand → badge tint/border + ring follow indigo in both themes; same edit on 0.0.8 tokens leaves copper `rgba(200,149,108,…)` tints and copper ring. Evaluator verified the mechanism statically (see Q1) rather than re-running Chromium |
| `scaffold.runtime` / `e2e:cli` | NOT_RUN (justified, non-blocking) | no Docker daemon on this host (`docker info` cannot connect); recorded as unproven in worklog close table and `caveats.md`; brief Q6 explicitly scopes this out |
| Consumer: scaffolded AGENTS.md/WEB-LAYER.md | PASS | CLI test resolves every backticked path in a real scaffold; evaluator confirmed all 12 referenced ids declared and the `/design/components` route file exists |

## Questions from the brief (explicit answers)

### 1. Primitive — YES, correct in all four parts

- **Derivation per theme.** Light (`semantic` root = dark defaults + `themes/light` overrides) and dark both derive every `--ns-<intent>-subtle`/`-border` (primary, secondary, accent, success, warning, destructive) via `color-mix(in oklab, var(--ns-<intent>) N%, transparent)` at the previous per-theme alphas (light 10/20–25%, dark 7–8/14–18%); hovers are `color-mix(… 86%, black)`; `accent`/`ring` → `var(--ns-primary)`, `accent-fg` → `var(--ns-primary-fg)`. Verified by parsing both blocks of the generated `tokens.css`: zero stale `copper-7`/`slate-6` refs; the only remaining `rgba()` are neutral overlay/border/shadow roles that were never intent tints.
- **Inheritance.** Both blocks sit top-level on `<html>` (`:root` + `[data-theme='dark']`). The dark block declares no `primary`, `primary-fg`, `accent`, `accent-fg`, `ring`, or hover — all inherit `:root`, so one `:root` edit rebrands both themes (the test `one :root edit rebrands both themes` asserts exactly this; note `accent-subtle`/`accent-border` derive through `var(--ns-accent)`, so they transitively follow `primary` too).
- **Default look preserved.** `primary` is still `var(--ns-copper-6)`; at the default value `color-mix(10%)` of copper ≡ the old `rgba(200,149,108,0.1)` hue family (supervisor slice review + browser defaults-after-change runs confirm). One nuance, not a defect: hover is now "86% of base mixed toward black" rather than the old fixed `copper-7` step — visually the same family, but it is a computed approximation, which is precisely what makes it follow a rebrand.
- **No component CSS changed: safe.** `git diff --name-only` over `registry/components/**`, `registry/islands/**`, `registry/styles/**`, `registry/lib/**` is empty; components consume only semantic `--ns-*` tokens, so derived values flow through untouched selectors.

### 2. Truth — YES, with two low-severity nits (non-blocking)

Checked every major claim against code: component names/parts/props (`PageHeader.*` ×7, `StatsGrid.Card` + label/value/detail/badge, Card/Header/Title/Description/Body/Footer, `Panel` tone `default|muted|raised`, `ResponsiveTable` columns/rows/getRowKey/caption/emptyState/summary + column key/label/cell/align/priority, `DataTable`+`Pagination.Meta/Actions`, `FilterForm` Body/Actions + method, `FormField` label/name/required/error/helpText, `DetailLayout` Main/Aside, `Skeleton` table|stats|detail|form + rows, `EmptyState` heading + children, `Badge` 6 variants, `Alert`/`InlineNotice` info|success|warning|destructive + title, `Breadcrumb` items, `SectionDivider` label, `Button` link/outline/sm/submit, `Select` options, `Input`/`Textarea`/`Checkbox`/`Switch`/`Progress`/`Spinner` present); layout objects and all 27 class variants in `layouts.css` (widths 1060/1280/720 px, 280 px grid min confirmed); theme chain (`client.ts` imports `styles.css`; `styles.css` generated from theme `styles.css` via `registry-styles.ts`; `_app.tsx` seeds `data-theme` from `ns-theme`/OS default and stamps `<html>`; `ThemeToggle` flips it); "these do not exist" (no `data-ns-theme`, no `assets/themes/`, no `html:has` selector, exactly one `kind:'theme'` item `theme-seed` anywhere in code outside denial/alias/test); `--theme` flag (exists on `ui:add` + `ui:init`, default official theme; one theme item today); 0.0.8 upgrade note (old header starts "Initial token seed", verified via `git show`; `--force` overwrites copied files); `define.page/define.layout` from `createDefine`, `dashboard-view.tsx` as the `PageHeader` example, `/design/tokens` reading app-owned `tokens.json`, bridge utilities (`bg-ns-*`, `text-ns-muted-fg`, `p-ns-4`, `gap-ns-*` via spacing scale, `rounded-ns-*`, `shadow-ns-*`), overlays from `@netscript/fresh-ui/interactive` (Dialog/Drawer/Popover/Tabs/Tooltip all exported), `ui:add chart-block|donut|ai` item names in the manifest.
Contrast claims recomputed independently (oklch→sRGB→WCAG): NS One 5.64, Indigo 5.17, Emerald 5.21, Rose 5.40 (≥4.5 ✓); Graphite 19.17 both themes ✓; ring ≥3:1 on each theme's own background for all five presets (3.40–19.17 ✓).
Nits: (a) `design-with-fresh-ui.md:198` — "`EmptyState` takes a heading and a next action": `EmptyState` takes `heading` + `children`, there is no action/next-action prop (low; "next action" reads as composition advice, and the recipe passes none). (b) `design-with-fresh-ui.md:196` — "Pair it with `withForm` for server validation": `withForm` is a `definePage()` builder method (`@netscript/fresh`), not a form-component helper — the very next clause links the server-validated-form guide so the reference resolves, but the phrasing suggests it is called alongside `FormField` in the view (low).

### 3. Reachability — YES, no hijack

- Embedded corpus: both guides in `MCP_EMBEDDED_DOC_PATHS` (16 docs, 326,595 B ≤ 335,872 B); `get_doc` bare slug `web-layer/how-to/design-with-fresh-ui` resolves via the S4a `pages/` fallback with `redirectedFrom` (test asserts slug + redirect + exact-`pages/`-slug passthrough + `undefined` for unknown slugs). `normalizeDocsSlug` trims slashes/extensions, so the fallback only fires on genuinely unprefixed site slugs.
- `find_guidance`: the MCP tests assert first-recommendation slug+section+excerpt for all 8 intents on both corpora (filesystem and standalone embedded).
- Hijack: activation is substring-on-alias, but aliases are multi-word and specific; evaluator probes: Scalar `theme:` ("set the scalar theme option…", "how do I pass theme: to the Scalar component") → `[]`; `withLayout` / `define.layout` route-layout intents → `[]`; true intents ("change the primary color of the whole app", "add a dark mode", "my new page has no top bar", "make the notes page look polished") route to `app-theming`/`app-chrome`/`page-design` exactly. `requiredAnyTerms` (`theme`/`brand` for app-theming; `design`; `chrome`) additionally gates ranking. The one short alias, `restyle`, is only a substring risk for text literally containing "restyle", which is the intent itself.

### 4. Generated guidance — YES, accurate, concise, backtick-path safe

`## Design and theming` (AGENTS.md) + `## Look and feel` (WEB-LAYER.md): every backticked reference resolves through declared ids (`app-tokens`, `app-client`, `app-shell`, `app-layout`, `design-gallery-route`, plus pre-existing `ui-barrel`, `dashboard-view`); doc slugs are constants rendered unbackticked, satisfying the `public-command-tree_test.ts` rule (any backticked token with `/` must resolve in the scaffold — `/design/components` maps to `routes/(design)/design/components.tsx`, which exists). Content matches the new reality (knobs, derived tokens, no per-page theme, layout owns chrome, `ns-shell ns-section ns-stack ns-stack--lg` composition, `bg-ns-surface`/`text-ns-muted-fg`/`p-ns-4` utilities, light+dark verification incl. empty/loading/error). Concise: two sections, no duplicated recipes (points to `get_doc` slugs).

### 5. Concept of Done per slice — YES, all five hold; budget raise justified

Reachability, constants-vs-literals, one-line doc comments, one-file contributor path all verified per slice (see Fitness table). The 288→328 KiB raise carries its rationale at the constant (`#2406`, ~42 KiB for the two how-tos, agents without the filesystem corpus), and the measured +31.7 KiB with ~9 KiB headroom matches the "close to the previous margin" claim — the corpus cannot absorb another page without a further raise, which is disclosed, not hidden.

### 6. Unproven blockers — NONE

`scaffold.runtime`/`e2e:cli` cannot run here (no Docker daemon) — explicitly out of scope per the brief and recorded as unproven, not as a pass. Remaining follow-ups (second theme item, token-only upgrade path, `Page` shell, tokens-lock repair, `contrast-color()` foregrounds, CLI/data-island items) are product issues filed in #2410, correctly kept out of this PR's definition of done. The generator's S5 working-tree edits (`context-pack.md`, `worklog.md` close table) and untracked launch receipts are run-dir bookkeeping, not product drift; `deno.lock` untouched; temp files cleaned up.

## Findings

| Severity | Finding | Evidence (file:line) | Required action |
| --- | --- | --- | --- |
| low | `EmptyState` has no action prop; guide says it "takes a heading and a next action" | `docs/site/web-layer/how-to/design-with-fresh-ui.md:198` vs `packages/fresh-ui/registry/components/ui/empty-state.tsx:5-9` | Fix (follow-up PR welcome, not merge-blocking): "EmptyState takes a heading; compose the next action inside it" |
| low | "Pair it with `withForm`" suggests a view-level helper; `withForm` is a `definePage()` builder method | `docs/site/web-layer/how-to/design-with-fresh-ui.md:196` vs `packages/fresh/src/application/builders/define-page/builder/mod.tsx:314` | Fix (follow-up, not merge-blocking): "Pair it with `definePage().withForm()` (see …server-validated-form)" |
| info | MCP tests do not cover `find_guidance` ranking when a query matches both a new concept and an old one (e.g. "theme my dashboard query page") | `packages/mcp/tests/theming-guidance_test.ts` | None required: aliases gate activation, `requiredAnyTerms` gates ranking, first-recommendation assertions pin the benchmark intents; noted for future intent-collision coverage |

No high/medium findings. No doctrine violations. No debt entries required.

## Lessons for Promotion

| Lesson | Pattern | Applies to | Confidence |
| --- | --- | --- | --- |
| none (single-run observation; the alias-specificity and negative-control patterns are already captured in the run's own tests) | — | — | — |

## Verdict

| Field | Value |
| --- | --- |
| Verdict | `PASS` |
| Rationale | Approved scope (items 2+3: derived theme primitive, design guide + theme chain, MCP corpus + routing, app AGENTS.md/WEB-LAYER.md) is complete; every gate in the brief's suite re-run green by the evaluator, including token reproducibility, the 0.0.8 negative control, and temp-config CLI fmt/lint; token derivation, inheritance, default-look preservation, all factual claims (incl. WCAG contrast recomputed), MCP reachability without hijack, and generated-guidance safety verified against code; two low doc nits are follow-up material, not merge-blockers; `scaffold.runtime` unavailability is brief-scoped and recorded; no debt or close-gate issues (`Refs #2406` partial, sibling split honored). |

VERDICT: PASS

## Round 2 (delta re-steer, same evaluator session)

| Field | Value |
| --- | --- |
| Evaluated head | `703a9530415ac2a828162ed5f67182522fc46b1c` ("docs(web-layer): correct the EmptyState and withForm guidance") |
| Delta range | `git diff f1442f3..HEAD` — product files: `docs/site/web-layer/how-to/design-with-fresh-ui.md` (3 lines), `packages/cli/src/kernel/assets/agent-docs-prose.generated.ts`, `packages/mcp/src/publish-assets.generated.ts` (regenerated carriers); rest is run-dir bookkeeping |
| Evaluator route (observed) | same session, Muse Spark (`meta/muse-spark-1.3`) via OpenCode/OpenRouter |

### Wording fixes verified true against code

1. **EmptyState** (`design-with-fresh-ui.md:198`): now "EmptyState takes a heading; put the next step or a Button in its children." TRUE — `packages/fresh-ui/registry/components/ui/empty-state.tsx:5-9` declares `EmptyStateProps` with `children: Renderable` (required) and `heading?: Renderable`, no action prop. The recipe at lines 300-304 passes heading + children text, consistent with the new wording.
2. **withForm** (`design-with-fresh-ui.md:196`): now "For server validation, bind the form on the page with definePage().withForm()." TRUE — `withForm<` is a `PageBuilder` method (`packages/fresh/src/application/builders/define-page/builder/mod.tsx:314`), and the target guide opens with "Use `definePage().withForm()`…" (`build-a-server-validated-form.md:11`).
3. **Next-steps bullet** (line ~387): now "`FormField` and the controls bound through `definePage().withForm()`." TRUE, same grounding as (2).

### Gates re-run on `703a953`

| Gate | Result | Evidence |
| --- | --- | --- |
| `deno task check:agent-docs-prose` | PASS | exit 0, fresh, 237 HTML files |
| `deno task check:publish-assets` | PASS | exit 0, `gen:publish-assets --check` clean (carriers regenerated, no drift) |
| `deno task test` in `packages/mcp` | PASS | 199 passed, 0 failed (embedded corpus with corrected prose intact) |

Evaluator touched no product files (`git status` clean outside `.llm/`). Both Round 1 low findings are resolved; no new findings in the delta; all prior verdict conditions still hold.

| Field | Value |
| --- | --- |
| Verdict | `PASS` |
| Rationale | The delta fixes exactly the two low doc nits with wording verified true against `empty-state.tsx`, the `definePage` builder, and the server-validated-form guide; regenerated carriers are check-clean and the MCP suite stays green at 199/199. |

VERDICT: PASS

## Round 3 (post-#2407 rebase + navigation cross-references, same evaluator session)

| Field | Value |
| --- | --- |
| Evaluated head | `e165232c503ff71e929e6ca0a5e25089b615836c` ("docs(web-layer): link the navigation.ts chrome model from the design guidance"), rebased onto `origin/main` incl. #2407 squash-merge `1582e1c` |
| Delta | `e165232` on top of the rebased branch; product files: `agent-conventions.ts` (+`app-navigation` ref, Chrome/Look-and-feel text), `agent-conventions_test.ts`, `customize-fresh-ui.md` (App chrome section), `design-with-fresh-ui.md` (rule 3), `skills/netscript-build/SKILL.md`, + 3 regenerated carriers (`skills.generated.ts`, `agent-docs-prose.generated.ts`, `publish-assets.generated.ts`) |
| Evaluator route (observed) | same session, Muse Spark (`meta/muse-spark-1.3`) via OpenCode/OpenRouter |

### (1) Chrome bullet + Look and feel vs merged-main code — TRUE in every clause

- `navigation.ts` at the app root next to `router.ts`: `write-app-files.ts:234-238` writes both `router.ts` and `navigation.ts` into `appDir`. Template (`navigation.ts.template:20-26,32`) exports `appNavigation` (href from `appRoutes`, label, `match: exact|prefix`) and `chromelessRoutePrefixes` (ships `[design]`).
- Auto-link semantics: `planNavigationRegistration` (`app-navigation.ts:55`) links when `nav ?? !segment.includes('/')` — one-segment pages by default; `--nav [label:string]` (`add-ui-command.ts:73-75`) links a nested page with optional label; `--no-nav` maps to `nav: false` (`add-ui-input.ts:13-14`) and skips; `--nav`/`--no-nav` on non-page kinds errors (`add-ui-command.ts:106-108`). End-to-end test `add-ui-command_test.ts:123` proves `--nav <label>` links nested and `--no-nav` skips top-level.
- Opt-out: `rendersAppChrome` false under `chromelessRoutePrefixes` (`navigation.ts.template:44-46`); current `_layout.tsx.template:4,15` renders chrome around every page except those prefixes; "/design gallery is the example" matches the shipped `[design]` prefix + own `SidebarShell` layout (`(design)/design/_layout.tsx.template:48,72`).
- "Never copy a header…" retained; `_layout` owns chrome — matches the template's "App chrome for every page" header comment.
- Backtick-path rule holds: 9/9 CLI tests pass; the only new backticked path `navigation.ts` is a declared ref resolving to a real scaffold file (`write-app-files.ts:238`); `/design/components` route map unchanged. Test exact lists + facts (`appNavigation`, `--no-nav`, `chromelessRoutePrefixes`, `navigation.ts` in WEB-LAYER.md) all pass.

### (2) Docs sections — TRUE, including both cross-checks

- Customize `## App chrome and navigation`: links (`appNavigation` href/label/match incl. `exact` vs `prefix`-keeps-current — template:3-14,21-25), new pages (`--nav`/`--nav <label>`/`--no-nav`), `ui:remove page` removing the link, opt-out via `chromelessRoutePrefixes`, `/design` SidebarShell exception, "fix `navigation.ts` or the layout", 0.0.8 allowlist note.
- `ui:remove page` claim: `remove-ui-page.ts:104-115` reads `navigation.ts`, applies `removeNavigationEntry` (removes exactly the route's entry, `app-navigation.ts:114-124`), writes back only when changed. TRUE.
- 0.0.8 allowlist note: `git show a833dfa:…/_layout.tsx.template` shows the `showScaffoldChrome` allowlist (home/dashboard/examples-prefix) with chromeless branch — the note is exactly right.
- Design guide rule 3: same four facts compressed; `chromelessRoutePrefixes` opt-out named. TRUE.

### (3) SKILL.md edits — accurate; `skills.generated.ts` fresh

- `--nav` wording now "Pass `--nav` to link a nested page, `--nav <label>` to set the label" — matches `--nav [label:string]` optionality and the e2e test (fixes the #751-side nit noted in the worklog).
- `Next:` lines claim: `add-ui-command.ts:147` prints `Next: ${step}` for `PAGE_FRAME_GUIDANCE` (chrome/navigation.ts/opt-out + tokens) plus nav next-steps — TRUE.
- Rebrand line (`--ns-primary`/`--ns-primary-fg`, derived tints/borders/hovers/accent/ring in both themes) — TRUE per Round 1 Q1.
- Marker claim: custom styles below the marker are preserved by the styles writer (`registry-styles.ts:50-54,115`) on any `ui:add` aggregator rewrite — the skill's "`ui:add` preserves" is the accurate generalization. `get_doc` slugs both in the embedded corpus (Round 1 Q3). Pre-existing 0.0.8-allowlist sentence retained and still true.
- `deno task check:assets-barrel` exit 0 (fresh after commit).

### (4) Carriers / MCP / docs gates — all green, re-run by evaluator

| Gate | Result | Evidence |
| --- | --- | --- |
| CLI slice tests (`agent-conventions_test.ts` + `public-command-tree_test.ts`, `--allow-all --unstable-kv`) | PASS | 9 passed, 0 failed |
| `deno task check:assets-barrel` | PASS | exit 0 |
| `deno task check:publish-assets` | PASS | exit 0 |
| `deno task check:agent-docs-prose` | PASS | `"fresh":true`, exit 0 |
| `deno task test` in `packages/mcp` | PASS | 199 passed, 0 failed |
| `deno task docs:links` | PASS | 105 docs, 0 broken links/anchors |

### Closes vs Refs #2406 — YES, `Closes #2406` is now justified

#2406's four checkboxes sit under `## Suggested fixes` (summary + §§1–3 are problem statements; no `Acceptance`/`gate:` heading, no unchecked gate boxes — close-gate rule 12 has nothing to block on). Coverage: box 1 (chrome default + opt-out) by #2407's `navigation.ts`/`rendersAppChrome`/`--nav`/`--no-nav`; box 2 (theme chain + app-wide recipe) by this PR's derived tokens + both guides; box 3 (corpus + AGENTS.md/skills pointers) by the embedded corpus, `find_guidance` concepts, generated AGENTS.md/WEB-LAYER.md sections, and the skill slugs; box 4 (`generate routes` + `ui:remove page` in the skill) by SKILL.md lines 29-30 and the route-lifecycle section (still accurate: remove deletes triad + router registration + nav link + refreshes derived modules). The live PR body still says `Refs #2406` (verified via `gh pr view`) — the S5 note records the intent; the change is a one-line body edit with no code impact. (The body also still carries the spent "Merge order with #2407 / Whichever lands second…" bullet — now that #2407 merged first, delete it in the same body edit.)

No new findings in the delta. No doctrine violations. No debt entries required. Evaluator touched no product files.

| Field | Value |
| --- | --- |
| Verdict | `PASS` |
| Rationale | The e165232 delta adds exactly the navigation specifics the Round 1 brief deferred: every new claim verified true against merged-main code (navigation.ts template, --nav/--no-nav wiring with e2e test, removeNavigationEntry, 0.0.8 allowlist, SKILL.md Next:/marker/slug claims); backtick-path rule holds (9/9 CLI tests); carriers fresh and all re-run gates green (assets-barrel, publish-assets, agent-docs-prose, MCP 199/199, docs:links); `Closes #2406` justified since all four Suggested-fixes boxes are covered across #2407 + this PR with no gate boxes outstanding. Remaining: one-line PR body edit (Refs→Closes + drop the spent merge-order bullet). |

VERDICT: PASS

## Round 4 (CI runtime-tier regression + corpus guard, same evaluator session)

| Field | Value |
| --- | --- |
| Evaluated head | `826339d52d1aad0e49ca19a17da9254fb10d5c0e` ("fix(docs): keep design-route paths out of the MCP corpus that apps bundle") |
| Failing base | `af6041a` — CI run 40541710537, both scaffold runtime tiers red at `scaffold.design-production-exclusion`; main `1582e1c` green (run 40539973506) |
| Delta | `826339d`: reworded sentence in `customize-fresh-ui.md`, new `DESIGN_ROUTE_EVIDENCE` guard in `generate-publish-assets_test.ts`, regenerated `publish-assets.generated.ts` + `agent-docs-prose.generated.ts`, caveats entry; rest is run-dir bookkeeping |
| Evaluator route (observed) | same session, Muse Spark (`meta/muse-spark-1.3`) via OpenCode/OpenRouter |

### (1) Root cause — CONFIRMED exactly as diagnosed

- Import chain: `telemetry-trace.ts.template:2` imports `AspirePsDashboardReader, resolveTelemetryEndpoint` from `@netscript/mcp` (package root), so `publish-assets.generated.ts` (the `MCP_EMBEDDED_DOCS` carrier) bundles into the app server output (`_fresh-route___examples_telemetry_index.mjs` in the CI message).
- Probe: `findDesignRouteEvidence` (`generated-quality-probes.ts:181-200`) walks `<app>/_fresh/` and flags any file whose path contains `routes/(design)/`, whose content contains `routes/(design)/` (`source-path:`), or contains `Composition rules — NetScript design system` (`route-marker:`) — constants at lines 45-46.
- Counts: `1582e1c` carrier 0 occurrences of `routes/(design)/`; `af6041a` exactly 1 (the S2 sentence "…layout in `routes/(design)/design/_layout.tsx`"); HEAD 0. Marker count 0 on all three (the marker is a template title in `composition.tsx.template:8`, never docs prose).
- So the single embedded string rode the telemetry bundle into `_fresh/` and tripped `source-path:`. The worklog's local-probe caveat (no telemetry route in `--no-aspire --db none` scaffolds; JSR-resolved mcp) correctly explains why this only failed in CI runtime tiers.

### (2) Reworded sentence — still TRUE

"`it has its own `SidebarShell` layout inside the `(design)` route group" (`customize-fresh-ui.md:185`): the layout file exists at `routes/(design)/design/_layout.tsx.template` and renders `SidebarShell` (3 hits). The `(design)` group naming is correct Fresh route-group vocabulary, and no `routes/(design)/` literal remains anywhere in the how-to guides (grep empty). The sentence loses the copy-pasteable path but keeps the correct location + component facts; agents needing the file still find it via the sibling "`routes/(design)/design/_layout.tsx`" references elsewhere in the docs corpus (out of the embedded set, probe-safe).

### (3) Guard matches the probe exactly; negative control proven

- `DESIGN_ROUTE_EVIDENCE = ['routes/(design)/', 'Composition rules — NetScript design system']` — byte-identical to the probe's `DESIGN_ROUTE_SOURCE_PATH` / `DESIGN_ROUTE_MARKER` (verified by direct comparison); the doc comment names their home file. The literal-instead-of-import choice is justified in the worklog (importing the probe pulls `packages/cli/e2e` under the root `isolatedDeclarations` config, TS9010).
- Negative control: scratch worktree at `af6041a` (under `.llm/tmp`, removed afterwards) with HEAD's test file → `FAILED | 5 passed | 1 failed`, `AssertionError: pages/web-layer/how-to/customize-fresh-ui/index.md embeds "routes/(design)/"` — the exact stale-carrier failure, then green after regeneration.

### Gates re-run on `826339d`

| Gate | Result | Evidence |
| --- | --- | --- |
| `deno test --no-lock -A .llm/tools/generate-publish-assets_test.ts` | PASS | 6 passed (incl. new guard); proven red on stale carrier |
| `deno task check:publish-assets` | PASS | exit 0 |
| `deno task check:agent-docs-prose` | PASS | `"fresh":true`, exit 0 |
| `deno task test` in `packages/mcp` | PASS | 199 passed, 0 failed |

### (4) Residual probe-trip risk — NONE found in this PR's scope

- Full-carrier sweep on HEAD for probe-adjacent strings: only `(design)`, `_layout.tsx`, `chromeless`, `appNavigation`, `navigation.ts`, `--nav` remain in the two Fresh UI guides — none matches either evidence literal (`(design)` without the `routes/` prefix is probe-invisible; verified the probe checks the full `routes/(design)/` string).
- Only `customize-fresh-ui` + `design-with-fresh-ui` are design-path-adjacent carrier docs; both swept clean.
- Structural note (recorded in `caveats.md` S6 entry, correctly kept out of this PR): ~330 KB of embedded docs still ships in app server bundles via the telemetry root import — a narrow `@netscript/mcp` subpath export or lazy corpus import is the follow-up, filed not fixed. Any future embedded string matching the probe literals would re-trip the tiers; the new guard now fails the build before CI.

No new findings blocking merge. No doctrine violations. No debt entries required. Evaluator touched no product files; scratch worktree removed (`git worktree list` shows only this worktree).

| Field | Value |
| --- | --- |
| Verdict | `PASS` |
| Rationale | Root cause confirmed end-to-end (telemetry root import → carrier in server bundle → single `routes/(design)/` string → probe `source-path:` failure; 0/1/0 counts across 1582e1c/af6041a/HEAD); reworded sentence true against the SidebarShell layout template; guard literals byte-identical to the probe constants with a proven red-on-stale/green-after negative control; all re-run gates green (guard tests 6/6, publish-assets, agent-docs-prose, MCP 199/199); residual sweep finds no other trippable string; the bundle-size follow-up is filed in caveats, not owed here. CI runtime tiers on the new head are the remaining proof, as the worklog states. |

VERDICT: PASS

## Round 5 (post-rebase patch identity + guidance-fixture near-tie, same evaluator session)

| Field | Value |
| --- | --- |
| Evaluated head | `51fbd5f9f5380fef3789c16815a89b180eef9441` ("test(mcp): re-lock a near-tied guidance smoke row after the docs rebuild") |
| Rebases since round 4 | S7 onto main `782893a` (#2426, #2432, #2427, #2399, #2437); S8 onto main `f177c38` (#2439 docs-site rebuild). Pre-rebase patch reference: `git diff 1582e1c 1d71335`; current: `git diff origin/main HEAD` |
| Evaluator route (observed) | same session, Muse Spark (`meta/muse-spark-1.3`) via OpenCode/OpenRouter |

### (1) Patch byte-identity — CONFIRMED

- File lists of both diffs are identical except the expected S8 fixture addition (`packages/mcp/tests/fixtures/guidance-evaluation.json`).
- Content: all 21 non-generated, non-run-dir files byte-identical between the old-patch result (`1d71335`) and HEAD where the base is unchanged on main.
- The single changed-base file, `packages/fresh-ui/scripts/build-tokens.ts` (main's #2432 token-pipeline repair), carries the byte-identical hunk: the S1 header-block replacement diffs cleanly against both bases (only blob hashes differ). Main's `--check` hunk sits elsewhere and is untouched.
- So no product text changed across either rebase; the S7 "no IMPL-EVAL round is due" claim holds for the rebase itself, and this round covers only the S8 fixture delta.

### (2) Carriers fresh, probe strings absent — CONFIRMED

| Gate | Result | Evidence |
| --- | --- | --- |
| `deno task check:publish-assets` | PASS | exit 0 |
| `deno task check:agent-docs-prose` | PASS | `"fresh":true`, exit 0 |
| `deno task check:assets-barrel` | PASS | exit 0 |
| Probe strings in MCP carrier | 0 / 0 | `MCP_EMBEDDED_DOCS` sweep: no `routes/(design)/`, no `Composition rules — NetScript design system` |

### (3) Fixture near-tie — RE-MEASURED, re-lock justified, nothing weakened

- The delta swaps only expected #2/#3 of the score-only row "pick direct application ownership versus a reusable integration"; #1 (`4-decision-rule-…`) stays first and the row keeps `exact` mode, so #1's position is still asserted. Test logic (`guidance-evaluation_test.ts`) and ranking code (`packages/mcp/src/`, only the regenerated carrier changed) untouched; the other 7 fixture rows untouched.
- Near-tie mechanism confirmed on HEAD's corpus: both #2/#3 sections match the same three stems — `direct` 7/7, `applic` 7/5, `reus` 2/2 — with neither mentioning ownership/integration in-section; the order is decided by whole-corpus IDF + length norm, i.e. exactly the kind of margin any corpus change can flip.
- Corpus isolation, measured by the evaluator in scratch worktrees under `/home/agent/projects/orchid/worktrees/` (removed afterwards):
  - main `f177c38` corpus alone (14 docs, 283,387 B): old order (connect-by-hand #2) — deterministic across 2 runs;
  - pre-rebase branch `133847a` corpus alone (16 docs, 329,073 B): old order — deterministic across 2 runs;
  - rebased HEAD corpus (16 docs, 327,810 B): new order (unsupported-by-netscript #2) — deterministic across 2 runs, matching the re-locked fixture.
  - The second-db page itself is byte-identical across all three corpora (21,162 B; same SHA), proving the flip comes from whole-corpus IDF shifts (rebuilt pages + embedded pages combined), not from any edit to the ranked sections — precisely the worklog's claim.
- `deno task test` in `packages/mcp`: **199 passed, 0 failed**.
- Note: the caveats entry floats a future "rank-one + top-3 set" mode for this row; that mode does not exist in the test harness and was correctly NOT applied (it would have dropped the #1 exactness assertion the row exists to pin). Filed as a suggestion, not a weakening.

### (4) Main design-system docs agree with this PR's guides — CONFIRMED

- `docs/design-system/GUIDELINES.md` marks the new model provisional throughout ("Status: token names are provisional… S1 (#2414) turns them into DTCG 2025.10 tokens"; theme SKILL.md files repeat "provisional until S1 #2414").
- The migration passage (§2.2, lines ~118-123) states verbatim: "Code today (NS One) scopes light on `:root` and dark on `[data-theme='dark']`. The new model moves the scheme to `data-scheme` and gives `data-theme` to the language… S1 acceptance requires that … NS One renders unchanged." It further requires keeping `[data-theme='dark']` resolving or shipping a migration with a `ui:migrate` step, and forbids renaming `--ns-*` without one.
- This PR's guides document exactly today's selectors (`:root` light, `[data-theme='dark']` dark) — no contradiction. The S7 caveat correctly records the S1 update obligation (four surfaces + `ui:migrate` + preset cross-links), filed not fixed.

No new product findings. No doctrine violations. No debt entries required. Evaluator touched no product files (only this report); scratch worktrees removed (`git worktree list` shows only this worktree); temp probe files removed.

| Gate | Result | Evidence |
| --- | --- | --- |
| Patch identity (old vs new diff, excl. generated/run-dir/fixture) | PASS | 21/21 byte-identical; 1 changed-base file, identical hunk |
| `check:publish-assets` / `check:agent-docs-prose` / `check:assets-barrel` | PASS / PASS / PASS | exits 0, `"fresh":true` |
| Probe strings in carrier | PASS (0 / 0) | full-carrier sweep |
| MCP `deno task test` | PASS | 199 passed, 0 failed |
| Fixture isolation (main-alone / pre-rebase-alone / HEAD) | PASS | old / old / new order, each deterministic ×2; ranked page byte-identical |
| Design-system agreement | PASS | GUIDELINES.md provisional + migration passage matches guides |

| Field | Value |
| --- | --- |
| Verdict | `PASS` |
| Rationale | Both rebases preserved the evaluated product patch byte-for-byte (identical file list modulo the fixture; identical hunks including the auto-merged build-tokens header); carriers fresh with zero probe strings; the single fixture delta re-locks a proven near-tie (same-stem overlap measured, flip reproduced as a whole-corpus IDF effect with old order on either corpus alone, #1 still asserted via exact mode, ranking policy and test logic untouched, MCP 199/199); main's design-system docs explicitly describe today's :root/[data-theme='dark'] selectors with the new model provisional to S1 #2414, so no contradiction. S1 update obligation filed in caveats. |

VERDICT: PASS

## Round 6 (tokens v2 reconciliation, same evaluator session)

| Field | Value |
| --- | --- |
| Evaluated head | `747cc7bc2991234a75ed195bc7393c0c5fc81cc1` ("docs(web-layer): teach the tokens v2 theme model in the design guidance"), rebased onto main `96d13d2` (merges #2442/#2457/#2463/#2449/#2435) |
| Pre-rebase tip | local branch `backup/divybot-752-pre-v2` (`b7e0ee0`) |
| Evaluator route (observed) | same session, Muse Spark (`meta/muse-spark-1.3`) via OpenCode/OpenRouter |

### (1) Dropping the S1 token-derivation commit — CORRECT

- v2 (#2435) deleted exactly the files S1 edited: `tokens/semantic.tokens.json`, `tokens/themes/light.tokens.json` (plus `dark`, `primitives`), confirmed via the #2435 file list; the S1 test file (`theme-tokens.test.ts`) is likewise gone on main.
- `packages/fresh-ui/tokens/README.md`: "Figma owns values", "Never fix a failing Figma value in code", NS One legacy CSS byte-locked (exact byte prefix, gzip budget). Porting the derivation by hand would violate that doctrine — the drop (not a port) is the only correct move.
- The branch now changes zero `packages/fresh-ui` files (`git diff origin/main HEAD -- packages/fresh-ui/` empty). Drift.md S9 records the drop and the rationale.

### (2) Theme claims vs tokens v2 — all reproduced on a local-source scaffold

Scaffold: `netscript-dev.ts init r6probe … --db none --no-aspire --no-git --ci --yes` (removed afterwards). Verified:

- **Five files**: `tokens build` prints "Built 5 token assets"; `assets/{tokens.css,tokens.json,theme-bridge.css,theme-preset.json,fonts.json}` all refreshed.
- **Stamping**: `_app.tsx` template stamps `data-theme={preset.language}`, `data-scheme`, `data-density`, `data-flavor`; seed script sets `data-scheme` from `ns-theme`/OS. `ThemeToggle` (`applyScheme`) flips `data-scheme` and retains language/flavor/density; keeps legacy `ns-theme` key.
- **18 presets**: preset JSON ids + `generatedThemes` names both enumerate exactly the guide's list (NS One, 7 Studio flavors, tonal/bloom/cupertino/liquid/fluent/brutal/filigrane/terminal/pixel/tactile). Theme registry items `theme-ns-one` … `theme-tactile` confirmed (18).
- **`tokens init`**: creates `tokens/source/`, `tokens.config.json`, empty `tokens/semantic.tokens.json`; `--force` resets the override file (reproduced: custom content replaced by `{"semantic": {}}`).
- **Alias-only overrides**: `$extensions` on an override fails with "Overrides cannot change metadata" before any asset is replaced (reproduced).
- **Primary-only override leaves copper**: reproduced — `primary` → `var(--ns-blue-9)` while hover/subtle/border/accent/ring stay copper, in both scheme blocks. The guide's "set all seven together" is therefore required, not stylistic.
- **Seven-role override works**: `accent`/`ring` → `{semantic.primary}` render `var(--ns-primary)`; ramp steps resolve per scheme (`blue-3` `#e6f4fe`/`#0d2847`); v2 scheme blocks come after the byte-locked legacy prefix, so they win the cascade.
- **Ramps**: semantic tier carries full 1–12 for blue/indigo/violet/teal/grass/tomato/orange; copper stops at 8 — "no step 9 or 10" TRUE. `teal-3` identical in both schemes (`#77cac4`) — TRUE.
- **Contrast table spot-check** (WCAG, evaluator-computed): blue-9/gray-12 6.13 (guide 6.1), blue-10 light 5.52 (5.5), dark 7.17 (7.2), indigo-9/gray-1 4.99 (5.0), indigo-10 dark 4.11 (4.1). All match within rounding.
- **No contrast check on overrides**: orange-9 + gray-1 built cleanly (reproduced) — the guide's "check yourself" warning is earned.
- **Radius alias**: `radius-md` → `{semantic.radius-lg}` builds to `var(--ns-radius-lg)` (reproduced).
- `--previews` flag, `/design/tokens?preset=<id>` dev preview, `lib/theme.ts` reading preset+fonts, design-system section link: all confirmed present in code. The `/reference/cli/commands/#tokens-…` anchor is Lume-generated from the `## tokens — …` heading; `docs:links` (green) validates it.

### (3) No pre-v2 remnants — CLEAN

- Added-line scan over the four guidance surfaces for `:root` recipes, `color-mix` derivation, oklch preset blocks, single-`theme-seed` claims: only hits are the *denials* ("there is no data-ns-theme") and the corrected "one theme item per preset plus theme-seed".
- Head-file scan: the only `:root`/`[data-theme='dark']` mentions in either guide are the legacy-compat notes ("Older apps that still use `[data-theme='dark']` keep working", "Existing `[data-theme='dark']` and `[data-theme='light']` still resolve NS One") — correct under v2's supported-legacy-selectors rule.
- The MCP test now asserts `data-scheme`, `netscript tokens build`, `semantic.tokens.json` in both guides AND `!designText.includes(':root')` — the anti-regression guard for exactly this.
- Concept aliases `data-scheme`/`theme preset` + hints `brand colors on a preset`/`pick a preset` resolve to real headings in the rewritten guide.

### (4) Gates — all green, re-run by evaluator

| Gate | Result | Evidence |
| --- | --- | --- |
| MCP `deno task test` | PASS | 199 passed, 0 failed |
| CLI `agent-conventions_test.ts` + `public-command-tree_test.ts` (`--allow-all --unstable-kv`) | PASS | 10 passed (was 9; new `theme-preset.json` assertions) |
| `deno task check:publish-assets` | PASS | exit 0 |
| `deno task check:agent-docs-prose` | PASS | `"fresh":true`, exit 0 |
| `deno task check:assets-barrel` | PASS | exit 0 |
| `deno task docs:links` | PASS | 105 docs, 0 broken |
| Probe strings in MCP carrier | PASS (0 / 0) | full-carrier sweep |

Findings: none — no severity, no file, no fix. The S9 caveats (Figma-owned seven-role fix, override contrast-checking, `init --force` reset warning) are correctly filed as owner follow-ups, not this PR's scope. Drift.md S9 accurately records the S1 drop and the `:root`→v2 rewrite.

| Field | Value |
| --- | --- |
| Verdict | `PASS` |
| Rationale | S1 drop correct (v2 deleted its files; README forbids hand-porting; zero fresh-ui files in the branch diff); every v2 theme claim reproduced on a local-source scaffold (five-file build, stamping, 18 presets, init/force semantics, $extensions rejection, copper-left-behind, seven-role fix, per-scheme ramps, teal/copper edge cases, contrast numbers within rounding, no override contrast check, radius alias); no pre-v2 recipes remain (only correct legacy-compat notes + denials, guarded by the new no-`:root` test assertion); all gates green (MCP 199/199, CLI 10/10, three carrier checks, docs:links, probe strings 0/0). |

VERDICT: PASS
