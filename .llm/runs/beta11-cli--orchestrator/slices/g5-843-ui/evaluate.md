# IMPL-EVAL — fresh-ui desktop components (#843, G5)

## Run Metadata

| Field          | Value                                              |
| -------------- | -------------------------------------------------- |
| Run ID         | `beta11-cli--orchestrator/slices/g5-843-ui`        |
| Evaluator lane | `formal_evaluation` · opposite-family open model    |
| Session        | Claude Code + OpenRouter · `qwen/qwen3.7-max`      |
| Generator      | Codex Sol·medium · thread `019f7282-c03b…`          |
| Supervisor     | Claude Fable 5 · session `86d308d5…`                |
| Branch         | `feat/desktop-frontend-843-ui` (draft PR #855)      |
| Commit range   | `bde4fe50..a5093652` (worktree-local SHAs)          |
| Evaluated cwd  | `/home/codex/repos/wt-g5-843`                       |
| Archetype      | 4 · Public DSL / Builder, frontend overlay          |

## Process Checks

| Check                                          | Result  | Evidence                                                                                                                                                  |
| ---------------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Plan-Gate passed prior to slice 1              | PASS    | `worklog.md` slice-1 Plan-Gate PASS entry; plan commit `1a77712f` precedes first impl commit `bde4fe50`.                                                   |
| Design checkpoint exists in worklog            | PASS    | `worklog.md` § Design (Public Surface / Vocabulary / Ports / Constants) precedes § Progress Log.                                                           |
| Commit slices follow the design                | PASS    | S1 chrome runtime + web tests, S2 L2 components + manifest, S3 tray/menu/dialog/notification + scaffold + docs.                                             |
| Brief carries `## SKILL` chapter               | PASS    | `codex-thread-ids.md` (launch brief) and this eval brief each carry `## SKILL` listing `netscript-harness` plus relevant domain skills.                    |
| Draft-PR closing-keyword discipline            | PASS    | PR #855 body ends `Refs #843` + `Part of #840`. No `Closes` / `Fixes` / `Resolves` reference. Desktop-smoke (#457) box is correctly NOT claimed here.        |
| Hard stop-lines intact                       | PASS    | Stop-lines section of this eval prompt repeats the 5 hard stop-lines verbatim.                                                                            |
| Stop-line 2: no publish/tag triggered          | PASS    | Branch is only a draft-PR push; no `release:cut`, `deno publish`, tag-push, or milestone closure in the commit trail.                                       |
| Stop-line 3: milestone 13 untouched           | PASS    | No milestone-closure command in this run; PR is draft.                                                                                                     |
| Stop-line 5: #824 seed not exercised           | n/a     | Run scope is #843 desktop UI; #824 is out of frame.                                                                                                        |

## Evaluator-Run Gates

### 1. POC Gating Pattern (structural types, no ambient / `any` / casts / lint-ignores)

| Probe                                                                          | Result | Notes                                                                                                                                                                  |
| ------------------------------------------------------------------------------ | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rg any` over `src/desktop/`, `desktop.ts`, registry components, DesktopOnly   | 0 hits | No `any` anywhere in the new public surface.                                                                                                                           |
| `rg 'declare global|declare module'` over the same                            | 0 hits | No ambient augmentation introduced. Deno Desktop globals are probed via `Reflect.get(globalThis, 'Deno')` and `Reflection`.get(deno, 'BrowserWindow')` with structural narrowing only. |
| `rg ' as ' over registry L2 items / island`                                   | 0 hits | Zero type-casts in consumer-facing L2 TSX. DesktopOnly uses structural `Reflect.get` only — returns typed by guard predicate.                                          |
| `rg 'deno-lint-ignore'` over all new files                                   | 0 hits | No lint suppression.                                                                                                                                                   |
| `rg 'with \\{ type'` / text / JSON import attributes                        | 0 hits | No text- or JSON-import attributes in any fresh-ui source (entire package).                                                                                            |
| Internal adapter `as` usages (create-desktop-chrome.ts L52/54/67)              | note   | Narrowings on the untyped `Reflect.get(globalThis, …)` result to the package's own structural capability types. Bounded, local, tested; not an `any` bypass. Acceptable. |

**Finding: PASS.**

### 2. D6 — `DesktopUpdatePrompt` consumes #841's `AutoUpdateReadyEvent` exhaustively

- `@netscript/sdk/auto-update` `AutoUpdateReadyEvent` is a discriminated union on `applyMode:
  'automatic' | 'manual'` with `manualUpdateUrl` only on the `manual` arm (`types.ts:84-104` of
  SDK).
- `desktop-update-prompt.tsx` switches on `event.applyMode`:
  - `case 'automatic'` renders `data-state='automatic'`, copy `Update ready — restart to apply`,
    and `Version {event.version} has been verified and staged.` Test asserts `Restart now` action
    button and `Open installer` absent.
  - `case 'manual'` renders `data-state='manual'`, copy `Update ready — install manually`, and an
    anchor with `href={event.manualUpdateUrl}` and `rel='noreferrer noopener'`. Test asserts
    `Restart now` absent and the URL is rendered verbatim.
  - `default: return assertNever(event)` — compile-time exhaustiveness guard.

**Finding: PASS (exhaustive, manual arm renders `manualUpdateUrl` exactly, `assertNever` default).**

### 3. Web-Mode Inertness (browser / Aspire / SSR)

| Gate                                                              | Result         | Evidence                                                                                   |
| ----------------------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------ |
| Full `packages/fresh-ui/tests/` run                               | **PASS 154/0** | Evaluator-run: `deno test -A --lock=deno.lock --unstable-kv packages/fresh-ui/tests/`      |
| Focused `tests/desktop/` + `tests/registry/`                      | **PASS 96/0**  | Evaluator-run: same command scoped to both dirs.                                           |
| Desktop-gated island SSR/browser                                  | PASS           | `tests/registry/islands/desktop-only.test.tsx` — SSR default is empty, fallback supported. |
| Desktop chrome explicit `null` capability path                    | PASS           | `tests/desktop/desktop-chrome.test.ts` — `not-desktop` disabled lifecycle verified.        |
| Desktop update-prompt automatic + manual branches                 | PASS           | `tests/registry/components/ui/desktop.test.tsx` L78-110 renders both exhaustively.         |
| D7 window-chrome no fake minimize/maximize                        | PASS           | `desktop.test.tsx` asserts `html.includes('minimize') === false` and same for `maximize`. |
| Native desktop smoke (#457)                                       | NOT_RUN        | Explicitly outside #843 scope; owned by #457 only. No claim made in this run.              |

**Finding: PASS.**

### 4. L2 Authority Chain (token styling, generated-copy parity)

| Gate                                                              | Result | Evidence                                                                                                     |
| ----------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------ |
| CSS uses only `--ns-*` tokens + `color-mix`                       | PASS   | `rg '#[0-9A-Fa-f]{3,6}\|rgb\|rgba\|hsl' packages/fresh-ui/registry/components/ui/desktop-*.css` = 0 hits.      |
| `data-part` / `data-state` used throughout                        | PASS   | Verified grep results on every desktop L2 file.                                                              |
| `prefers-reduced-motion` declared in every L2 CSS                 | PASS   | Each of the 5 desktop CSS files carries a `@media (prefers-reduced-motion: reduce)` block.                   |
| Self-contained TSX/CSS pairs (no L2→L2 imports in components)     | PASS   | `desktop.test.tsx` L140-143 asserts no `from '../` import in any copy-source TSX.                          |
| Generated copy parity                                             | PASS   | `desktop.test.tsx` L145-147 asserts `FRESH_UI_REGISTRY_CONTENT[file.source] === source` for every TSX file. |
| Manifest declares desktop collection anchored by `theme-seed`     | PASS   | `desktop.test.tsx` L129-132 checks the collection order `[theme-seed, …six items]`.                           |
| Layer 2, `copyOwnership: 'app-owned-after-copy'` on every item    | PASS   | `desktop.test.tsx` L123-126 asserts both properties on all 6 items.                                           |
| No speculative port; structural capability only                   | PASS   | `D5` — no port interface exists; structural `DesktopChromeCapability` is the only adapter seam.              |

**Finding: PASS.**

### 5. JSR Rubric on the New `fresh-ui` Surface

| Gate                                                              | Result | Evidence                                                                              |
| ----------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------- |
| `doc:lint --root packages/fresh-ui --pretty` · `./desktop.ts`      | PASS   | `privateTypeRef: 0, missingJSDoc: 0, other: 0, total: 0` for the new entrypoint.       |
| `doc:lint` · `./mod.ts`, `./registry.ts`, `./primitives.tsx`, `./src/ai/…` | PASS   | All existing entrypoints report `total: 0` in this run.                                |
| Package-wide baseline                                             | PASS   | Total remains 123 (96 private-type-ref + 27 missing-doc), all in `./interactive.ts` pre-existing baseline — **not widened** vs. `research.md`. |
| `deno publish --dry-run --allow-dirty` (workspace)                | PASS   | Exit 0; `Success Dry run complete`; new `desktop.ts` and `src/desktop/**` included; no slow-type error. |
| Text / JSON import attributes                                     | PASS   | Grep on `with { type: 'text' }` / `with { type: 'json' }` across `packages/fresh-ui/` returns 0 hits. |

**Finding: PASS (new export zero-baseline; bounded baseline unchanged).**

### 6. Slice Quality / Architecture

| Gate                              | Result | Evidence                                                                                       |
| --------------------------------- | ------ | ---------------------------------------------------------------------------------------------- |
| `deno task quality:scan`          | PASS   | Evaluator-run: `{"ok":true,"findings":[],"allowCount":7}` — all 7 allowances are pre-existing, not introduced. |
| Scaffold `scaffold.runtime`       | **generator-evidenced, NOT RE-RUN per instructions** | `worklog.md` slice-3 record: `60/60 passed`. Re-run explicitly skipped for cost; evidence stands. |
| Generated registry + CLI embeds   | PASS   | `registry.generated.ts` and `embedded.generated.ts` regenerated by the checked-in generator; test-dir parity checks above. |
| Docs verification                 | PASS   | `deno task --cwd docs/site verify` reported 25,189 internal links resolved (worklog entry).      |
| Docs new page + navigation entries| PASS   | `docs/site/how-to/build-a-desktop-frontend.md` added; `docs/site/_data.ts` and `_data/xref.ts` updated. |

**Finding: PASS.**

## Scope vs Plan

- ✅ D1 — Explicit `@netscript/fresh-ui/desktop` export; root barrel unchanged (verified in
  `packages/fresh-ui/deno.json`).
- ✅ D2 — `createDesktopChrome(options): DesktopChromeLifecycle` (active | disabled); capability
  accepts an injected narrow structural seam; absent-capability path verified in tests.
- ✅ D3 — `DesktopMenuItem` declared as the tagged union `action | submenu | separator | role` with
  action IDs keyed by the callback dispatcher and unique per menu instance.
- ✅ D4 — Gated dialog (`alert`/`confirm`/`prompt`), notification (`notify`), title, show/hide/focus/close/reload, `dispose`;
  no process exit, no window creation, no updater scheduling.
- ✅ D5 — No speculative port. One adapter seam only (structural `DesktopChromeCapability`).
- ✅ D6 — `DesktopUpdatePrompt` consumes the #841 `AutoUpdateReadyEvent` union exhaustively with
  `assertNever`; manual arm renders `event.manualUpdateUrl` exactly.
- ✅ D7 — Window chrome labels only documented Deno Desktop actions; test explicitly asserts
  `minimize`/`maximize` strings are absent from rendered HTML.
- ✅ D8 — Desktop gating uses #842's `DEFAULT_DESKTOP_RPC_BINDING` via local structural types
  (no ambient `Window` augmentation, no `any`); SSR/browser output is null/disabled.
- ✅ D9 — L2 items are self-contained, proven through the real scaffold design gallery
  (Playwright evidence referenced in worklog slice-3), with a `desktop` registry collection.

Non-Scope respected: native desktop smoke (#457) NOT_RUN; minimize/maximize NOT added; no new
package-level RPC transport; no publish/tag/release-cut/milestone closure attempted.

## Anti-Pattern Sweep

| AP    | Risk from plan | Evaluator disposition                                                         |
| ----- | -------------- | ----------------------------------------------------------------------------- |
| AP-2  | abstraction-first | Resolved per D5 — no port added; structural capability only.             |
| AP-4  | barrel inflation   | Resolved per D1 — root barrel not widened; only `./desktop` added.       |
| AP-5  | import-direction erosion | Resolved — `./desktop` consumes SDK contracts; SDK does not import UI. |
| AP-14 | fake browser proof | Resolved — worklog records real scaffold-design-gallery Playwright pass. |
| AP-25 | hidden runtime behavior | Resolved — no implicit exit/create/start/bind in any public call path. |

## Findings Requiring Owner Action

None.

## Drift / Debt

- Drift: integration-base defects, JSR baseline, root `arch:check` re-run — all recorded in
  `drift.md` with fix actions. Resolved by integration commit `46e50cf2` and branch rebase; reviewed
  slice-1 SHA rewrite to `bde4fe50`.
- Debt: plan declared no new arch-debt; implementation introduced none.

## Stop-Line Compliance

| Stop-line                                                                        | Status |
| -------------------------------------------------------------------------------- | ------ |
| 1. Merge requires CI green + opposite-family eval PASS                          | awaiting CI + owner merge (this eval delivers its half) |
| 2. HARD STOP before any release publish                                          | complied — no publish/tag attempted                      |
| 3. HARD STOP before closing milestone 13                                         | complied — milestone 13 untouched                        |
| 4. Every sub-brief must carry stop-lines verbatim                               | complied — confirmed in this eval brief                  |
| 5. #824 seed drafts-only                                                         | n/a — outside #843 scope                                 |

## Verdict Line

All required static, fitness, and consumer gates pass. Approved scope is complete. No unrecorded
doctrine violation was introduced. Documentation and run artifacts are resumable. The draft sub-PR
carries the correct `Refs #843` / `Part of #840` references and no premature closing keyword.

**PASS**

PASS
