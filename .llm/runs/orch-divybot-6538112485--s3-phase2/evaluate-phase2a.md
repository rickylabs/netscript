# PASS — S3 phase 2a implementation evaluation at head `4c4f41e52e9bf35d943dc85e06ac323842940993` (`evaluate-phase2a.md`)

This PASS covers only the phase 2a review unit (PR #2488). It is not READY, not mergeable as reported, and not completion of #2416. Two things still block READY: the `scaffold.runtime` gate is UNPROVEN, and the required remote checks at the final head are still pending.

**Reviewed:** final head `4c4f41e5…` on main `15cffa2`. The product source is commit `0d399a1`; later commits change only evidence, debt and plan text.

**Evaluator:** the same independent Anthropic session that ran the PLAN-EVAL and every slice review below. I'm not the implementer, and I used read-only tools only.

## Scope verified against the approved plan

| Area | Result | Where the evidence is |
| --- | --- | --- |
| Plan gate | PASS | `plan-eval.md` is PASS after one FAIL_PLAN round; the four blockers were fixed before any implementation |
| Contracts | 104 identities, 87 shipped, 17 left for phase 2b | `tests/contracts/catalog.test.ts:20-29` |
| 21 new Utility components | Present, registered, reviewed | `tests/registry/post-v1-items.ts` (21 components + `calendar-date` and `menu-items` support); `registry.json` and the style map |
| Registry | 115 items (92 base + 21 + 2) | `phase2a-validation.json`; frozen `legacy-v1.json` with named, minimal repairs and negative tests (`registry-authoring.test.ts`, `runtime-dependencies.test.ts`) |
| Audited existing components | CodeBlock, Label, Card, Pagination, Alert, Prose, CommandPalette, PageHeader | Each slice passed, with every FAIL_FIX resolved |
| Archetype | ARCHETYPE-4, existing compound UI and registry API | No new builder facade |

I checked that every slice-review fix is present in the committed source, not just recorded in a review file:

| Fix | Where it is |
| --- | --- |
| Slider: lower thumb on top when thumbs meet at the upper end | `slider.tsx` |
| Calendar: range-middle days use their own state | `calendar.tsx:341` |
| NavigationMenu: Escape only handled when a disclosure is open | `navigation-menu.tsx` |
| HoverCard: tap opens it on touch | `hover-card.tsx`, pointer type and press tracking |
| ActionMenu: `autofocus` cleanup | `ActionMenu.tsx` |
| Popover: `focusOnOpen` defaults to `true` | `use-popover.ts` |
| CodeBlock: legacy `header='tabs'` falls back | `code-block.tsx`, mode chosen from `tabs.length` |
| CommandPalette: works without `RegExp.escape` | `command-palette.tsx`, capability check |
| Alert: default and visually hidden tone labels | `alert.tsx`/`alert.css` |
| Menu items: destructive labels use the measured text role | `menu-items.css` |
| AlertDialog and CodeBlock contrast fixes | 7c4 changes |

Behavior properties verified across the slices:
- Native elements first: radio, range, `details`, `dialog`, popover, `kbd`, scroll snap.
- APG keyboard behavior: roving focus, right-to-left arrow swapping, Home/End, PageUp/PageDown, Shift+F10.
- Controlled refusal is respected for dialogs, pickers, menus, collapsibles and alerts.
- IME composition is respected. Clipboard copies the exact source, and a late copy result can't mark the wrong file.
- Sanitization is unchanged, and no backend responsibility moved into UI.

## Gate evidence

- **Full package:** 608 passed, 0 failed, 0 ignored, exit 0 (`phase2a-validation.json`).
- **Full browser:** 302 passed, 0 failed, light/dark × 390/1280 plus real touch. Strict axe: zero serious or critical findings and no allowances added. The gap server loads the real registry layout CSS.
- **Fidelity:** 462/0 tests plus 3/0 catalog checks; 57/0 browser cases; 112 Utility colour measurements at or above 4.5:1. The negative control failed against the old CSS as expected.
- **Per-slice wrappers:** passed with no dropped files. Quality/architecture passed with no new suppressions.
- **Docs:** preflight, docs accuracy and export drift passed; the docs build produced 259 pages.
- **Carriers:** all four freshness checks passed at the source commit.
- **Installed consumer:** every new and audited component is installed through the real `ui:add`, and the consumer type-checks, lints and server-renders (SSR) against the shared contracts. The Fresh UI root mapping is shown before any local prerelease aliases are added.
- **Publish dry-run:** exit 0, no slow types.
- **Review threads:** 0 threads, 0 unanswered.
- **Privacy:** the public run directory contains no absolute home paths or UUID-style identifiers; I checked this independently. The leak and resource reports are counts only, and the reporter made 0 mutations.

## Findings and dispositions

1. **Runtime gate is UNPROVEN.**
   - The single required one-pass `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` exited 1: 1 passed, 2 failed (`preflight.aspire`, `cleanup.aspire-stop`), with Aspire doctor failing and Docker unavailable. Runtime behavior never started.
   - The approved plan says Docker-unavailable is UNPROVEN, never success, and the result is recorded honestly.
   - **This is not a PASS on runtime.** The phase changes CLI-embedded registry assets and templates, which are scaffold output, so AGENTS.md requires this smoke.
   - **Required before READY:** a green raw-exit run in a Docker-capable environment (for example the documented OpenHands trigger), or a recorded owner waiver.
2. **Inherited documentation baseline debt is accepted as recorded.**
   - The structured doc-lint fails with 124 diagnostics: 123 TypeScript (96 private-type references, 27 missing JSDoc) plus 1 `contracts.json` data-export JSDoc limitation.
   - All 123 TypeScript diagnostics exactly match the measured baseline by kind, message and repo-relative path: 0 new, 0 removed. The only changed diagnostic source is the documented optional `focusOnOpen` field in `popover.types.ts`.
   - `arch-debt.md` entry `fresh-ui-doc-export-baseline-2531` has a reason, owner (Fresh UI maintainers, #2412/#2531), target (before the next stable design-system publication), open status, linked evidence, cost and a strict closing gate.
   - Phase 2a doesn't deepen this debt, and asking for an unrelated runtime-namespace documentation rewrite here would be out of scope. **No FAIL_DEBT.** The raw gate stays red and is not called green.
3. **Colour evidence is Utility-only.** Contrast and fidelity are proven for Utility and studio-utility only, not for every token preset. The CodeBlock 80/20 syntax mix on tinted rows must be re-measured across presets in the phase 2b style harness or in token contrast certification.
4. **Captures and shell audit.** Captures are local Linux review artifacts, not pixel hashes across environments. `shell-archetype-audit.md` is a composition and gap audit, not proof of application-level or pixel parity.
5. **Private trail files.** I didn't independently read the private commit-trail and PR-snapshot files or the raw logs. My conclusions rest on the committed source, the public run records, and the slice reviews I ran in this session.

## Material limitations and obligations (no READY, no closing keyword, no labels, no merge)

- **Before READY:**
  - `scaffold.runtime` must be green, or the owner must record a waiver.
  - All required remote checks must be green at the final reported head. Checks skipped because the PR is a draft don't count.
  - PR #2488 keeps `Refs #2416` only.
- **Phase 2b, still open:**
  - The 17 Layout/AI/Docs-kit components and the Desktop audit.
  - Page shell, responsive top bar and docs/chat geometry.
  - The baseline shell, StatsGrid and DataTable audit.
  - The all-style harness that implements the owner's additive-extension decision:
    - `registry:style` declarations (component, name, type, default, maps-to);
    - `data-x-*` presentational attributes;
    - optional structural slots and blocks over an immutable base;
    - base tests run against every registered source style;
    - fixtures for declared additions (must pass) and undeclared additions or mutations (must fail).

  The current phase 2a fixture seam is preparation only.
- **Later phases:** alternate source styles are S4–S6, and token-value changes are #2450.
- **Debt:** #2531 stays open until its closing gate passes.
