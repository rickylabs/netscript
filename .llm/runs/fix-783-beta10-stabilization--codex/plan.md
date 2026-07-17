# Plan: render fresh-ui Markdown directly with Preact

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-783-beta10-stabilization--codex` |
| Branch | `fix/783-beta10-stabilization` |
| Phase | `plan` |
| Target | `packages/fresh-ui` copy-source Markdown registry item |
| Archetype | `4 — Public DSL / Builder` (doctrine-assigned package archetype) |
| Scope overlays | `frontend` |

## Archetype

Doctrine assigns `@netscript/fresh-ui` to Archetype 4. This slice does not reshape the package or
invent an integration port: it preserves the existing app-owned-after-copy component contract and
replaces only the renderer implementation behind it. The frontend overlay adds generated-route,
production-build, browser, and hydration proof.

## Current Doctrine Verdict

`Keep` — confirm the runtime registry shape. This slice keeps the registry/component shape and
removes an unnecessary upstream wrapper boundary.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| A1/A2 | Preserve the current `MarkdownProps` caller contract while simplifying its implementation boundary. |
| A6/A7 | Use the upstream unified/rehype compiler directly; do not add a NetScript wrapper around a wrapper. |
| A8/A9 | Keep the existing registry files and Archetype-4 package shape. |
| A14 | Add renderer and generated Fresh production/browser regression evidence at the previously untested layer. |

## Goal

Make the copied Markdown item Preact-native: no React, `react-markdown`, or `preact/compat`
requirement; direct unified-to-Preact rendering; preserved security/rendering behavior; generated
Fresh type-check, production build, and hydration proof.

## Scope

- Replace `react-markdown` with a reusable unified processor ending in `rehype-react` configured
  with `Fragment`, `jsx`, and `jsxs` from Preact.
- Preserve source processing, mandatory sanitize ordering, inline-style normalization, citation
  mapping, and the public `MarkdownProps` API.
- Replace registry dependencies/documentation and regenerate the embedded registry mirror.
- Add renderer-level regression assertions and a generated Fresh build/browser fixture.

## Non-Scope

- No visual redesign, CSS/token change, public package export, CLI command/scaffold algorithm,
  dependency catalog, lockfile, or unrelated JSR debt change.
- No Windows host can be exercised from this native WSL lane; the checked-in consumer fixture and
  CI/browser path must remain OS-neutral, and the PR will state the local Linux evidence honestly.
- No evaluator launch or self-certification; the supervisor owns both evaluation passes.

## Hidden Scope

- `unified` becomes an explicit direct registry dependency when the wrapper is removed.
- The structural sanitize schema must accept upstream nullable fields.
- `registry.generated.ts` must be regenerated from the owning source files.
- The `ai` collection already includes `markdown`, so its generated-app gate can exercise this item
  without changing product scaffold behavior.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Use `unified → remark-parse → remark-gfm/remark-math/remarkCitations → remark-rehype → rehype-katex/rehype-highlight → rehype-sanitize → rehypeInlineStyles → rehype-react`. | Matches issue #783 and preserves the load-bearing security/render order. |
| D2 | Configure `rehype-react` with Preact `Fragment`, `jsx`, `jsxs`, `elementAttributeNameCase: 'html'`, and `stylePropertyNameCase: 'dom'`. | This is the upstream-supported Preact runtime configuration. |
| D3 | Retain `rehypeInlineStyles` after sanitize. | Scratch rendering proves it preserves KaTeX layout styles and adds no content. |
| D4 | Declare `unified@^11`, `remark-parse@^11`, `remark-rehype@^11`, and `rehype-react@^8` directly; remove `react-markdown`. | Every imported package is direct; no transitive reliance or React boundary remains. |
| D5 | Preserve `MarkdownProps` and citation behavior unchanged. | This is an implementation fix, not a caller migration. |
| D6 | Put regressions at the copied renderer/generated Fresh layer in addition to helper tests. | The missing failing-layer test is the cause of the false green baseline. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Inline style adapter | must resolve now — resolved | Keep per D3. |
| Explicit unified dependency | must resolve now — resolved | Add per D4. |
| Public API or folder changes | must resolve now — resolved | None. |
| Exact final bundle delta | safe to defer until gate | Capture comparable production output in PR validation; issue supplies the original 24,033-byte consumer experiment. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Sanitization becomes optional or moves too early | Hard-wire ordered `.use()` calls and assert unsafe HTML/event handlers are absent. |
| KaTeX/highlight/citation rendering regresses | Renderer assertions cover all three plus GFM and streaming repair. |
| Custom citation tag typing regresses | Keep the component map as a named structural object and type-check the copied file. |
| Generated mirror/docs drift | Run the canonical asset-barrel generator and assert a clean regeneration diff. |
| Static render passes while browser hydration fails | Build and browse a Fresh island fixture; assert interaction plus zero browser console errors. |
| Scope expands into CLI scaffold behavior | Reuse the existing `ai` collection/gate; no CLI production command or template algorithm changes. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-2/AP-14 | existing risk | Remove the React wrapper without re-exporting any upstream surface. |
| AP-9 | risk | Keep one direct processor factory; add no speculative renderer abstraction. |
| AP-11/AP-25 | risk | Processor construction is pure; no module-load effects beyond immutable schema data. |
| AP-19 | risk | Registry dependencies remain explicit in the consumer manifest. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| F-1..F-19 applicable to Archetype 4 | yes | `quality:scan`, `arch:check`, scoped check/lint/fmt wrappers, focused tests |
| F-5/F-6/F-7 | yes/no regression | `deno doc`, doc-lint/publish dry-run where applicable; no new export |
| Frontend route/browser | yes | generated Fresh check/build + Playwright hydration/console assertions |
| Consumer import | yes | copied `components/ui/markdown.tsx` check and render fixture |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| Existing fresh-ui interactive doc-lint debt | none | Unrelated and not deepened. |
| New debt | none | This slice must add no suppressions or accepted debt. |

## Commit Slices

| # | Slice | Proving gate | Files |
| --- | --- | --- | --- |
| 1 | Bootstrap issue-grounded harness plan and draft PR | artifact review + clean git scope | `.llm/runs/fix-783-beta10-stabilization--codex/*` |
| 2 | Direct Preact Markdown processor, registry dependencies/docs, generated mirror, and renderer regression | focused copied-renderer check/tests + scoped wrappers | `packages/fresh-ui/registry/**`, `registry.manifest.ts`, `registry.generated.ts`, `packages/fresh-ui/tests/**`, run artifacts |
| 3 | Generated Fresh production build/hydration regression and final evidence | focused fixture + required package gates + `scaffold.runtime` because copied scaffold output changed | focused E2E/fixture files if required, run artifacts |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | Renderer unit | Focused Markdown renderer/pipeline tests | All content/security assertions pass. |
| 2 | Consumer check | Scoped generated/copied Markdown check | Exit 0, no React dependency. |
| 3 | Fresh production/browser | Fixture build + Playwright hydration/console check | Build exits 0; interaction hydrates; zero errors. |
| 4 | Scoped package gates | `.llm/tools/run-deno-{check,lint,fmt}.ts --root packages/fresh-ui --ext ts,tsx` | Exit 0. |
| 5 | Code-quality/doctrine | `deno task quality:scan` and `deno task arch:check` | Exit 0, no new suppression. |
| 6 | Package tests | `deno test --allow-all packages/fresh-ui/tests/` | Exit 0. |
| 7 | Generated mirror | `deno task gen:assets-barrel` / `check:assets-barrel` | Canonical mirror current. |
| 8 | Full scaffold runtime | `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` | Exit 0; required because registry copy output changes. |

## Drift Watch

- A renderer contract or build fixture requiring a CLI production-code change is a rescope trigger.
- Failure to preserve sanitize ordering, KaTeX styles, or citation interaction blocks the slice.
- Any new suppression, lockfile change, or broad package restructure blocks the slice.

