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
