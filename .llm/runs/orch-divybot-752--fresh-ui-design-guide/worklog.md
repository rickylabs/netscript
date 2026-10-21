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
