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

## CI on #2408 (2026-10-21)

- Head `ab8695a`: every check passed. `ci` included close-gate, quality, all 8 check/test shards, browser, and check-test.
  Also passed: `code-quality`, `fresh-ui-quality`, the docs Pages build, `close-gate`, and `breaking-migration` (run 39644234117).
- Two earlier `pr-metadata-gates` runs on the same head (39644227100, 39644232991) were **cancelled** by the
  workflow's per-PR `cancel-in-progress` concurrency group. `gh pr ready` and the `status:ready-merge` label edit
  fired three runs within seconds. GitHub reported the PR `CLEAN`/`MERGEABLE`, but the rollup kept the CANCELLED
  `breaking-migration` entries, and the orchestrator read them as red. `gh run rerun` is not permitted for this
  token. Resolution: this commit gives the PR a fresh head with a single `synchronize` run, and no label edits follow it.

## S5 — cross-references after #2407 (2026-10-27)

- #2407 squash-merged first (`1582e1c`, 2026-10-27T16:12Z), so this PR owes the agreed cross-references. Rebased
  `orch/divybot-752` onto `origin/main` (clean, no conflicts; carriers fresh after the rebase).
- `agent-conventions.ts`: new reference `{ id: 'app-navigation', path: 'navigation.ts' }`. The `## Design and
  theming` Chrome bullet names `appNavigation`, `ui:add page` auto-linking, `--nav` / `--nav <label>` / `--no-nav`,
  and `chromelessRoutePrefixes` (the /design gallery, unbackticked per the path rule). `## Look and feel` names
  `navigation.ts`. Test exact lists and facts updated.
- `customize-fresh-ui.md` `## App chrome and navigation`: rewritten from the neutral wording to the shipped model
  (links, new pages, `ui:remove page`, opting out) plus the 0.0.8 allowlist note. Design guide rule 3 likewise.
- `skills/netscript-build/SKILL.md`: adds the `--ns-primary` / `--ns-primary-fg` rebrand line and the
  `web-layer/how-to/design-with-fresh-ui` slug next to `customize-fresh-ui`; `--nav` wording corrected (the label is
  optional, `--nav [label:string]`, a nit from the #751 side). `skills.generated.ts` regenerated.
- #2406 body: the four checkboxes sit under `## Suggested fixes` (not an acceptance/gate heading), and #2407 + this
  PR cover all four, so the PR body moves from `Refs #2406` to `Closes #2406`.

| Gate | Result |
| --- | --- |
| `check:publish-assets` / `check:agent-docs-prose` | PASS / PASS |
| `check:assets-barrel` | PASS after commit (it diffs against the index) |
| CLI tests (agent-conventions, public-command-tree, init-agent*, ui page + ui commands) | 117 passed, 0 failed |
| `packages/cli` `deno task check` | PASS |
| MCP `deno task test` | 199 passed, 0 failed |
| `generate-publish-assets_test.ts` (budget) | 6 passed |
| `docs:links` / `docs:accuracy` / `docs:snippets` | PASS / PASS / PASS |
| docs site build + `check:links` | PASS / PASS |
| fmt / lint on changed TS (temp no-exclude config), SKILL.md fmt | PASS |

## IMPL-EVAL round 3 (same session `ses_ea08ab886ffeD4MI4Ly0kKJlRJ`)

- Delta re-steer on head `e165232` (fresh snapshot, `--estimated-cost-usd 1.5`, receipt `impl-eval-launch-r3.jsonl`).
  The first launch failed preflight with `launcher-catalog-unavailable`: OpenCode 2 on PATH (see `drift.md` S5).
  The relaunch used `OPENCODE_BIN` pointed at the V1 binary that holds the session.
- **Verdict: PASS**, no new findings. Every navigation claim was verified against merged-main code (`navigation.ts.template`,
  `--nav [label:string]` / `--no-nav` wiring and its e2e test, `removeNavigationEntry`, the 0.0.8 allowlist). The
  backtick-path rule holds, carriers are fresh, and MCP is 199/199. `Closes #2406` is justified: all four Suggested-fixes boxes are covered by
  #2407 plus this PR, with no gate boxes. Body edit done with the push, and the spent merge-order bullet replaced.
- Before the push: `e2e-cli-gate` added so the postgres and sqlite runtime tiers run on the combined tree. The label goes on first,
  so the cancelled label-event runs attach to the old head.

## S6 — runtime tiers red on `af6041a`: design-route evidence in the MCP corpus (2026-10-27)

- With `e2e-cli-gate`, both runtime tiers failed at `scaffold.design-production-exclusion` (run 40541710537):
  `production build contains developer design route output (source-path:server/_fresh-route___examples_telemetry_index.mjs)`.
  Main `1582e1c` passes both tiers (run 40539973506), so the regression is this PR's.
- Cause: the scaffold's telemetry example imports `@netscript/mcp` (`telemetry-trace.ts.template`), so the MCP
  embedded-docs carrier ships in the app's production server bundle. S3 embedded `customize-fresh-ui`, whose S2
  sentence named the `/design` layout by its path `routes/(design)/design/_layout.tsx`. The probe treats any
  `routes/(design)/` string in `_fresh/` as a leaked design route. Main's carrier has 0 occurrences; this branch had 1.
- Fix: the sentence now says the layout sits "inside the `(design)` route group". New guard in
  `.llm/tools/generate-publish-assets_test.ts`: no embedded document may contain the probe's evidence strings.
  Negative control: the guard failed on the stale carrier
  (`pages/web-layer/how-to/customize-fresh-ui/index.md embeds "routes/(design)/"`) and passes after regeneration.
- Importing the probe's constants into the root test pulled `packages/cli/e2e` under the root `isolatedDeclarations`
  config (TS9010 on `ANY_PROBE_SOURCE`). The test keeps the two strings as literals, with a doc comment naming their home.
- A local probe run was not faithful: a `--no-aspire --db none` scaffold has no telemetry route and resolves
  `@netscript/mcp` from JSR 0.0.8. CI's runtime tiers on the new head are the proof.

| Gate | Result |
| --- | --- |
| `generate-publish-assets_test.ts` | 6 passed (guard red before regen, green after) |
| `check:publish-assets` / `check:agent-docs-prose` | PASS / PASS |
| MCP `deno task test` | 199 passed |
| `docs:links` | PASS |
| fmt / lint on the changed test | PASS |

## IMPL-EVAL round 4 (same session `ses_ea08ab886ffeD4MI4Ly0kKJlRJ`)

- Delta re-steer on head `826339d` (fresh snapshot, V1 `OPENCODE_BIN`, receipt `impl-eval-launch-r4.jsonl`). At the
  operator's direction ("fix it, and push"), `826339d` was pushed while this round ran.
- **Verdict: PASS**, no findings.
  - Root cause confirmed end to end: 0/1/0 carrier occurrences across `1582e1c`/`af6041a`/`826339d`.
  - The reworded sentence is true.
  - The guard literals are byte-identical to the probe constants. The evaluator's own negative control in a scratch
    worktree at `af6041a` (removed afterwards) was red.
  - The sweep found no other probe-trippable string. Gates: guard 6/6, `check:publish-assets`, `check:agent-docs-prose`, MCP 199/199.

## S7 — rebase onto `782893a` (merge-conflict, 2026-10-28)

- Main moved `1582e1c` → `782893a`: #2426, #2432 (token pipeline repair + `tokens:build --check`), #2427 (design
  guidelines + theme DESIGN.md/SKILL.md), #2399, #2437 (generated design-system section + theme gallery).
- Only conflict: the two embedded-docs carriers (`agent-docs-prose.generated.ts`, `publish-assets.generated.ts`) on
  the S2 commit. Resolved by taking main's carriers and regenerating from source (`gen:agent-docs-prose`,
  `gen:assets-barrel`, `gen:publish-assets`); later commits replayed cleanly. `build-tokens.ts` auto-merged (our header
  hunk, main's in-memory `--check` hunk). The docs build's `docs/site/deno.lock` churn was reverted every time.
- The branch patch outside `*.generated.ts` is byte-identical to the pre-rebase `1d71335` patch, so no product text
  changed and no IMPL-EVAL round is due.
- Main's design-system docs describe a future theme model (`data-theme="<language>"` + `data-scheme`, provisional until
  S1 #2414) and state that today's NS One code uses `:root` + `[data-theme='dark']`. That matches this PR's guides; S1
  must update them when it ships (`caveats.md`).

| Gate | Result |
| --- | --- |
| Carriers regenerated at the rebased head | no diff |
| `check:publish-assets` / `check:agent-docs-prose` / `check:assets-barrel` | PASS / PASS / PASS |
| fresh-ui `tokens:build --check` (main's new frozen check) | PASS |
| fresh-ui tests | 192 passed |
| `generate-publish-assets_test.ts` + MCP corpus/theming tests | 17 passed |
| CLI tests (agent-conventions, public-command-tree, init-agent*, ui) | 183 passed |
| `packages/cli` `deno task check` | PASS |
| MCP `deno task test` | 199 passed |
| `docs:links` / `docs:accuracy` / `docs:snippets` / site `check:links` / `design-system_test` | PASS ×5 |
| Probe strings (`routes/(design)/`, design marker) in the MCP carrier | 0 / 0 |

## S8 — rebase onto `f177c38` and a near-tie in the guidance smoke fixture (2026-10-28)

- Main moved `782893a` → `f177c38` (#2439, the docs site rebuilt in NetScript Utility). Every docs commit conflicted
  only in the two embedded-docs carriers; each was resolved by taking the rebased side and regenerating from source.
  The branch patch outside `*.generated.ts` is byte-identical to `133847a`'s.
- MCP `deno task test` then failed one row of `packages/mcp/tests/fixtures/guidance-evaluation.json`: the score-only
  intent "pick direct application ownership versus a reusable integration" swapped its #2 and #3 sections. Both are
  `use-a-second-database` sections that match the same three stems (`direct`, `applic`, `reusable`), so their order
  depends on whole-corpus BM25 IDF.

  | Corpus | #1 decision rule | `connect-an-external-database-by-hand` | `unsupported-by-netscript-…-turso-example` | #2 − #3 |
  | --- | --- | --- | --- | --- |
  | main `f177c38` | 23.2804 | 11.3217 | 11.2985 | +0.023 |
  | pre-rebase branch `133847a` | 23.4990 | 11.6781 | 11.6678 | +0.010 |
  | rebased branch | 23.5001 | 11.6439 | 11.6725 | −0.029 |

  Neither side alone flips it: main's corpus and the old branch corpus both pass. The rebuilt pages plus this branch's
  embedded pages do. #1 leads by about 12 points in all three.
- Fix: the fixture row is re-locked to the measured order. It keeps `exact` mode, so #1's position is still asserted;
  `required-set` would have dropped that. The ranking policy (PLAN-EVAL-locked) is untouched. RFC 0004 calls this file
  a deterministic smoke fixture, and only `guidance-evaluation_test.ts` reads it.
- Scores came from a temporary log in `orderGuidanceSections`, reverted before commit (`git status` clean apart from the
  fixture).

| Gate | Result |
| --- | --- |
| Carriers regenerated at the rebased head | no diff |
| `check:publish-assets` / `check:agent-docs-prose` / `check:assets-barrel` | PASS |
| fresh-ui `tokens:build --check` / fresh-ui tests | PASS / 192 passed |
| MCP `deno task test` | 198/199 before the fixture fix, 199/199 after |
| CLI tests / `packages/cli` `deno task check` | 183 passed / PASS |
| Other corpus readers (`carrier-parity`, `ci-classify-changes`, `cli-mcp-adapters`, `agent-mcp-stdio`) | 74 passed |
| `docs:links` / `docs:accuracy` / `docs:snippets` / site `check:links` / docs `_plugins` tests | PASS / PASS / PASS / PASS / 7 passed |
| Probe strings in the MCP carrier | 0 |

## IMPL-EVAL round 5 (same session `ses_ea08ab886ffeD4MI4Ly0kKJlRJ`)

- Delta re-steer on head `51fbd5f` (fresh snapshot, V1 `OPENCODE_BIN`, receipt `impl-eval-launch-r5.jsonl`), covering
  S7 and S8.
- **Verdict: PASS**, no findings.
  - Both rebases kept the evaluated product patch byte-for-byte, and the carriers are fresh with zero probe strings.
  - The fixture delta re-locks a measured near-tie: either corpus alone keeps the old order, #1 is still asserted in
    exact mode, and MCP is 199/199.
  - Main's design-system docs describe the `data-scheme` model as provisional and agree with today's selectors.
