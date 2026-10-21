# Worklog — orch-divybot-752--fresh-ui-design-guide

## S0 — Bootstrap, research, plan (2026-10-21)

- Reset stale worktree (`6f6cbdf`) to `origin/main` `a833dfa` (0.0.8 cut).
- Routing: `deno task agentic:matrix -- --tier feature --json` → see `supervisor.md`.
- Sibling harness#751 (same upstream #2406) is live; agreed file split over SendMessage. #751 owns
  chrome/nav/`ui:add page`/`registry-styles.ts`/`netscript-build` skill; this run owns docs, MCP corpus,
  app guidance builder, fresh-ui primitives, caveats issue.
- Baselines: `deno task check:agent-docs-prose` → fresh (10 s, Lume 669 files). `tokens:build` under the frozen
  lock fails (lru-cache); `--no-lock` build reproduces committed `registry/theme/*` byte-for-byte.

### Design checkpoint

1. **Public surface** — theme-seed `tokens.css`/`tokens.json` (same names, derived values, documented header);
   generated `apps/<app>/AGENTS.md` + `WEB-LAYER.md` Design and theming section; docs pages
   `/web-layer/how-to/design-with-fresh-ui/` (new) and `/web-layer/how-to/customize-fresh-ui/` (theme chain);
   MCP embedded corpus + `find_guidance` routing for theme/design intents.
2. **Domain vocabulary** — brand knobs; derived tokens; theme chain; app chrome (see `plan.md`).
3. **Ports** — none new; existing `GuidanceConcept` table and `DocsCorpusPort` carriers.
4. **Constants** — `MCP_EMBEDDED_DOC_PATHS`, `MCP_EMBEDDED_DOCS_MAX_BYTES` (+ rationale), alpha percentages in
   DTCG sources only, concept `theming-and-design`, convention reference ids.
5. **Commit slices** — S0 plan; S1 derived tokens; S2 docs; S3 MCP; S4 app guidance; S5 close (see `plan.md`).
6. **Deferred scope** — #751's items; second theme item / runtime switcher; `Page` shell component;
   tokens lock repair; `contrast-color()` foregrounds. Filed in the caveats issue.
7. **Contributor path** — `docs/site/web-layer/how-to/design-with-fresh-ui.md`; token derivation in
   `packages/fresh-ui/tokens/semantic.tokens.json`.

PLAN-EVAL: not selected (justification in `plan.md`).

## S1 — Derived intent tokens (2026-10-21)

- DTCG sources: `semantic.tokens.json` (dark defaults) and `themes/light.tokens.json` now derive every
  `--ns-<intent>-subtle` / `-border` with `color-mix(in oklab, var(--ns-<intent>) N%, transparent)` at the
  previous per-theme alphas; `primary-hover` / `secondary-hover` = `color-mix(in oklab, var(--ns-<intent>) 86%, black)`;
  `accent` → `var(--ns-primary)`, `accent-fg` → `var(--ns-primary-fg)`, `ring` → `var(--ns-primary)`.
- `scripts/build-tokens.ts`: replaced the stale "planned direction" header with an agent-facing map of the
  theme chain + brand knobs (it is copied into every app as `assets/tokens.css`).
- Regenerated `registry/theme/{tokens.css,tokens.json}` (`theme-bridge.css` unchanged) with the `--no-lock`
  recipe; `deno task gen:assets-barrel` → `packages/fresh-ui/registry.generated.ts`.
- New `tests/registry/theme-tokens.test.ts` (5 contract tests). Negative control against the 0.0.8 `tokens.css`: 4/5 fail.

### Gate evidence (S1)

| Gate | Result |
| --- | --- |
| `deno task check` (packages/fresh-ui) | exit 0 |
| `deno task lint` (packages/fresh-ui) | exit 0 |
| `deno task test` (packages/fresh-ui) | 191 passed, 0 failed |
| `deno fmt --check` changed TS | clean |
| `deno task check:assets-barrel` / `check:publish-assets` | exit 0 / exit 0 |
| Browser render (see `browser-probe.json`) | `/`, `/dashboard`, `/design/tokens`, `/design/components` 200 in light+dark, 0 page errors |
| Rebrand proof | 2-line `:root` edit → badge tint/border + ring follow indigo in both themes; same edit on 0.0.8 tokens leaves `rgba(200, 149, 108, …)` tints and a copper ring |

Slice review (supervisor): diff limited to token values + generator header + test; component CSS untouched;
default theme computes the same hue family (copper tint at 10%/8% alpha) — accepted.

## S2 — Design guide + theme chain docs (2026-10-21)

- New `docs/site/web-layer/how-to/design-with-fresh-ui.md`: seven rules, the theme chain, "these do not exist"
  callout, brand knobs vs derived tokens, contrast-checked presets (NS One, Indigo, Emerald, Rose, Graphite),
  type/radius recipe, 0.0.8 upgrade note, page anatomy, layout objects, block-by-job table, list + detail recipes,
  do/don't, verify checklist.
- `customize-fresh-ui.md`: `assets/` row now names theme-bridge/layouts; `_layout.tsx` text is neutral about which
  routes get chrome (harness#751 changes that); token card names `:root`/`[data-theme='dark']`; new "The theme chain"
  and "Make one theme apply app-wide" sections + "There is no per-page theme" callout; `--theme` flag clarified.
- `_data/xref.ts` key `howto:design-with-fresh-ui`; how-to catalog row; web-layer "Start here" card.
- Regenerated `agent-docs-prose.generated.ts` (`gen:agent-docs-prose`) and `packages/mcp/src/publish-assets.generated.ts`
  (embedded `llms.txt` changed).
- Agent-Markdown quirks found and avoided in my text (xref links double-prefix `/netscript/`, `<code>` inside callouts
  fragments, `<intent>` in an apiTable string is eaten as a tag). Recorded in `caveats.md` (16, 17).

### Gate evidence (S2)

| Gate | Result |
| --- | --- |
| `deno task --cwd docs/site build` (source-format + Lume + rendered-output) | exit 0, 237 HTML files |
| `deno task --cwd docs/site check:links` / `check:caveats` | 39,167 links resolve / exit 0 |
| `deno task docs:links` / `docs:accuracy` | 0 broken / PASS |
| `deno task docs:snippets` | PASS (scanned 660, malformed 0) |
| Guide recipes type-checked inside the local-source scaffold (`deno check --unstable-kv`) | exit 0 (3 snippets) |
| Recipes rendered as routes, headless Chromium, light + dark | 200, 0 page errors |
| `check:agent-docs-prose` / `check:publish-assets` / `check:assets-barrel` | 0 / 0 / 0 |

Slice review (supervisor): every component/prop/class named in the guide was checked against
`packages/fresh-ui/registry/**`; presets computed for WCAG (text ≥ 4.5:1, ring ≥ 3:1 on both backgrounds).

## S3 — MCP corpus + find_guidance routing (2026-10-21)

- `.llm/tools/generate-publish-assets.ts`: `customize-fresh-ui` and `design-with-fresh-ui` added to
  `MCP_EMBEDDED_DOC_PATHS`; `MCP_EMBEDDED_DOCS_MAX_BYTES` 294,912 → 335,872 (328 KiB) with the rationale at the
  constant. Embedded total after this run ≈ 325.8 KB (headroom ≈ 10 KB, close to the previous margin).
- `packages/mcp/src/domain/docs/guidance-concepts.ts`: three concepts — `app-theming` (no bare "theme" alias, so
  Scalar's `theme:` option stays unaffected), `page-design`, `app-chrome` — route to `rebrand-the-whole-app`,
  `the-rules`, and the new customize section `app-chrome-and-navigation`.
- `customize-fresh-ui.md`: new `## App chrome and navigation` section (route-hint target), phrased so it stays true
  before and after harness#751's universal chrome. Design guide lead sentence names the brand knobs (the
  filesystem corpus strips Vento tables from excerpts).
- Tests: new `packages/mcp/tests/theming-guidance_test.ts` (filesystem + standalone embedded corpus); updated
  enumerations in `tests/release-embedded-docs-corpus_test.ts` and `.llm/tools/generate-publish-assets_test.ts`.
  Negative control: with the 0.0.8 concept table, 3 of 6 new tests fail.

### Gate evidence (S3)

| Gate | Result |
| --- | --- |
| `deno task test` (packages/mcp) | 198 passed, 0 failed |
| `deno task check` (packages/mcp) | exit 0 |
| `deno test .llm/tools/generate-publish-assets_test.ts` | 6 passed |
| `deno fmt --check` / `deno lint` changed TS | clean |
| `check:agent-docs-prose` / `check:publish-assets` / `check:assets-barrel` | 0 / 0 / 0 |
| `docs/site check:links`, `docs:links` | exit 0 / 0 broken links or anchors |

## S4 — App guidance + standalone get_doc slugs (2026-10-21)

- `54166ef` fix(mcp): `ReleaseEmbeddedDocsCorpus.get` resolves an unprefixed docs-site slug to its `pages/` page
  (`redirectedFrom` set). Probe before the fix: `get('web-layer/how-to/design-with-fresh-ui')` → `undefined`.
- `agent-conventions.ts`: `DESIGN_REFERENCES` (`assets/tokens.css`, `client.ts`, `routes/_app.tsx`,
  `routes/_layout.tsx`, `/design/components`) appended to the declared references (not to the canonical data-screen
  example list); new `## Design and theming` section in `apps/<app>/AGENTS.md` and `## Look and feel` in `WEB-LAYER.md`;
  doc slugs as constants (`DESIGN_GUIDE_SLUG`, `CUSTOMIZE_GUIDE_SLUG`) rendered unbackticked (the conventions test
  treats any backticked token with `/` as a path that must resolve in the scaffold).
- Tests: updated exact reference lists; new "one app-wide theme and chrome model" case; `/design/components` route map
  in `public-command-tree_test.ts`.

### Gate evidence (S4)

| Gate | Result |
| --- | --- |
| `deno test --allow-all --unstable-kv` agent-conventions + public-command-tree tests | 9 passed (includes real-scaffold path resolution) |
| `deno task check` (packages/cli) | exit 0 |
| fmt / lint (temp no-exclude config; packages/cli is excluded from root fmt/lint) | clean / clean |
| `deno task test` (packages/mcp) after slug fix | 199 passed, 0 failed |
| Fresh `netscript init` render of `apps/dashboard/AGENTS.md` / `WEB-LAYER.md` | sections present, reviewed |
| `check:assets-barrel` | exit 0 |

## Repository gates on head `f1442f3` (`run-gate.ts`, receipts `.llm/tmp/gate-receipts/752/`)

| Gate (catalog id) | Result |
| --- | --- |
| `check` (root `deno task check`) | PASS, 241 s |
| `lint-report` (packages + plugins, cli excluded by catalog) | PASS |
| `fmt-check-report` | PASS |
| `arch-check` | PASS |
| `fresh-ui-lock-regression` | PASS |
| `mcp-export-corpus` | PASS |
| `publish-dry-run` | PASS, 45 s |
| `quality-gate` | PASS |
| `doc-lint` | catalog form exits 1 on a missing `--root` (invocation error, not a finding). Per package: `packages/mcp` 0 errors, `packages/cli` 0 errors, `packages/fresh-ui` 123 errors, all in untouched `src/runtime/*` and `src/ai/render-ui.ts` (pre-existing namespace-type debt; overlap with this diff: none) |
| `scaffold.runtime` / `e2e:cli` | **unproven here**: no Docker daemon on this host (`docker info` cannot connect) |

## IMPL-EVAL round 1 (2026-10-21)

- Route: `muse_spark_1_3` = `openrouter/meta/muse-spark-1.3`, variant `xhigh`, via `deno task agentic:opencode`
  (`--workload-tier feature --workload-role implementation_evaluation --estimated-cost-usd 3`), usage snapshot
  `openrouter-usage-snapshot.json` (balance 9.36 USD at 17:14Z), receipt `impl-eval-launch.jsonl`. Family meta ≠
  generator anthropic; `opus_5` fallback skipped as same-family.
- Head `f1442f3`. **Verdict: PASS** (`evaluate.md`). No high/medium findings. Two lows (both doc truth nits in
  `design-with-fresh-ui.md`): `EmptyState` has no action prop; `withForm` is `definePage().withForm()`. One info
  (no mixed-concept ranking test).
- Supervisor disposition: both lows fixed in this round's follow-up commit (one-line apiTable edits + next-steps bullet),
  carriers regenerated, `check:agent-docs-prose` / `check:publish-assets` / `check:assets-barrel` 0/0/0, MCP tests
  199/199, `docs:links` 0 broken. Same evaluator session re-steered for a delta confirmation (round 2). Info item
  left as-is (activation and ranking gates already bound the collision risk; noted in #2410's spirit, not filed).

## IMPL-EVAL round 2 (same session `ses_ea08ab886ffeD4MI4Ly0kKJlRJ`)

- Delta re-steer on head `703a953` (fresh snapshot, `--estimated-cost-usd 1`, receipt `impl-eval-launch-r2.jsonl`).
  **Verdict: PASS**. Both round-1 lows verified fixed against `empty-state.tsx` and the `definePage` builder;
  `check:agent-docs-prose`, `check:publish-assets`, MCP tests 199/199 re-run green. Lease released.

## Close (2026-10-21)

- Leak check (`maint:leak-check --owned-root <scaffold>`): 48 survivors, all `ownership: unproven / owner: unknown`
  (Aspire apphosts + processes from `~/projects/deploy-d3327a7` and `~/projects/llm-bench`). Reported, not mutated.
  This run's only long-lived resource (the scaffold's Vite dev server on :5873) was stopped by PID after matching
  `/proc/<pid>/cwd`; the temp scaffold and the rootless Chromium library dir in `$TMPDIR` were removed.
- Debt: none added. Follow-ups filed as rickylabs/netscript#2410.
- Lesson: `.llm/2026-10-21-fresh-ui-design-guide.md`.
- Sibling: #2407 not merged at close. Second merger adds the `navigation.ts` / `--nav` / `--no-nav` cross-references
  (list in `context-pack.md`).
