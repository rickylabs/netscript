# Plan — fresh-ui-components (#947, #948, #949)

PR: rickylabs/netscript#989 (draft)
Branch: `feat/fresh-ui-component-pass`
Milestone: 0.0.1-beta.12

## Harness profile and doctrine

- **Archetype:** Archetype 3 (Runtime / Behavior), because the changed public surface owns
  controlled/uncontrolled interaction state, dismissal, focus, and keyboard lifecycle. This is the
  smallest doctrine archetype that covers stateful behavior; the component API itself is not a
  builder/DSL.
- **Overlay:** `SCOPE-frontend.md` for browser accessibility, responsive behavior, and real rendered
  interaction checks.
- **Current doctrine verdict:** `@netscript/fresh-ui` has no package-specific restructure verdict or
  open debt row in doctrine file 10 / `arch-debt.md`; existing `interactive.ts` doc-lint debt is a
  measured baseline (123 findings) and must not be deepened.
- **In-scope anti-patterns:** AP-1 (monolith/file size), AP-3/AP-4/AP-5 (public contract and
  composition), AP-8 (unnecessary abstraction), AP-11 (hidden globals), AP-13 (console), AP-16
  (generic folders), AP-19/AP-20 (tests and public surface), AP-22 (sub-barrels), AP-25 (browser
  side effects outside the established runtime edge).
- **Required gates:** scoped check/lint/fmt; package tests; `doc:lint` delta; publish dry-run / JSR
  audit; `quality:gate`; consumer import/render guard; generated-registry freshness; browser DOM
  interaction tests; responsive CSS assertions/manual render evidence.

## Locked decisions

1. ActionMenu is a new package-owned compound runtime exported from `interactive.ts`; it composes
   `usePopover`, `getNextCollectionIndex`, controllable state already inside Popover, and existing
   event composition. It adds no document/global listener of its own.
2. Focus restoration is not currently supplied by `useDismissableLayer` (contrary to the original
   inventory). ActionMenu will restore focus through the trigger reference/popover composition
   without duplicating global dismissal listeners.
3. DataGrid selection is controlled and opt-in. Existing `DataGridRow<T>.id` + `selectedIds` +
   `onSelectionChange` form the selection contract; no redundant `getRowId` callback is added and no
   selection props means the legacy DOM stays unchanged. Bulk and row-action render slots receive
   typed context rather than a package-owned action schema.
4. PromptInput remains a copied registry component. Capability callbacks/slots are optional;
   default attach/screenshot/voice markup disappears. Submission stays form-first and keyboard
   policy augments native submit rather than owning transport state.
5. Generated registry content is regenerated through `gen:assets-barrel`; generated files are not
   hand-edited.

## Open-decision sweep

- **Resolved now:** ActionMenu follows every existing interactive namespace and renders its Trigger
  as a native button. DataGrid rows with action controls render a non-interactive `role=row` wrapper
  and preserve navigation through an inner real title link / isolated row-activation seam, avoiding
  buttons inside anchors/buttons. Legacy rows without action controls retain their exact element.
- **Resolved now:** `DataGridRow<T>` already requires a stable string `id`, so controlled selection
  keys use it directly; adding `getRowId` would duplicate the live contract.
- **Safe to defer:** typeahead menu navigation; issue acceptance requests directional/Home/End only.
- **Safe to defer:** data sorting/filtering/virtualization and PromptInput attachment preview/OCR.
- **Safe to defer:** broad remediation of the 123 pre-existing `interactive.ts` doc-lint findings;
  this slice must add zero new findings.

## Commit slices

1. **S1 ActionMenu composition** — public types/runtime/CSS/export plus G3/G4 and no-global-listener
   guard. Files: `src/runtime/action-menu/*`, `interactive.ts`, focused tests. Gate: focused runtime
   tests + scoped static wrappers.
2. **S2 DataGrid controlled collection actions** — additive selection/bulk/action slots, responsive
   styles, reference example, G1/G2/G7. Files: presentation DataGrid, its CSS/docs/tests. Gate:
   DataGrid tests + consumer render/type check.
3. **S3 PromptInput capabilities** — optional actions, busy/stop/disabled and submit policy, generated
   registry refresh, G5/G6. Files: registry source/CSS/tests plus generated assets. Gate: focused
   registry tests + generation freshness.
4. **S4 package gate and evidence** — fails-before mutations for G1-G7/static guard, full package
   tests, scoped wrappers, quality/doctrine, doc-lint delta, JSR dry-run, browser/responsive evidence,
   run/PR reconciliation. Files: tests/examples/run artifacts/PR metadata. Gate: complete matrix.

## Risk register

- **Native popover behavior differs in DOM shims:** keep pure prop/keyboard guards and browser DOM
  tests; report any unavailable browser gate as NOT RUN.
- **Controlled state stale closure:** derive every next selection from the controlled set supplied
  for the render and assert emitted IDs exactly.
- **Nested interactivity in href/button rows:** isolate controls and keep row activation on the
  non-interactive wrapper/title-link seam; G2 covers propagation.
- **Generated registry drift:** regenerate and assert `check:assets-barrel` clean.
- **Public slow/private types:** explicit exported annotations/JSDoc and doc-lint delta comparison.
- **Scope growth into a general table/chat transport:** hold deferred scope below.

## Deferred scope

Sorting, filtering, virtualization, column resizing, menu typeahead/submenus, attachment transport,
OCR, chat streaming transport, and consumer migration in eis-chat are explicitly outside this PR.

## 1. The shared cause

`@netscript/fresh-ui` is split into two layers that were never joined:

| Layer | Location | State |
| --- | --- | --- |
| Runtime (behaviour) | `src/runtime/`, `src/runtime/_internal/` | Complete. Owns dismissal, collection keyboard navigation, controllable state, event composition, popover placement. |
| Presentation (markup) | `src/presentation/`, `registry/components/ui/` | Renders markup and stops at the boundary where interaction state begins. |

The runtime layer already contains, today, on `main`:

- `_internal/use-dismissable-layer.ts` — outside-pointer + Escape dismissal, focus restore
- `_internal/collection-navigation.ts` — ArrowUp/ArrowDown/Home/End traversal over a collection
- `_internal/use-controllable-signal.ts` — the controlled/uncontrolled state pattern
- `_internal/compose-event-handlers.ts` — handler composition with `preventDefault` respect
- `popover/use-popover.ts`, `popover/Popover.tsx` — collision-aware placement and portalling

Every symptom in the three issues is a consumer re-deriving one of those five primitives by
hand, badly, because the presentational component did not expose a seam to plug them into:

- #947's "hand-roll selection state, select-all logic, keyboard behavior, menu event
  propagation" is `use-controllable-signal` + `collection-navigation` + `compose-event-handlers`
  re-implemented per grid.
- #948's "document-level event listeners ... every row menu remained open after outside
  clicks, Escape, or item activation until a global workaround was added" is
  `use-dismissable-layer` re-implemented, globally and wrongly.
- #949's "leaves keyboard submission and busy/stop behavior to every app island" is the same
  omission on the composer.

**Therefore: fix the seam once.** Do not build three independent components. Build the menu
composition over the existing runtime, then have DataGrid consume it, and give PromptInput the
same capability-slot discipline. If implementation reveals a *different* shared cause, say so
explicitly in the PR body and fix that one instead — do not silently fall back to three
independent fixes.

## 2. The contract change

Three public surfaces move.

### 2.1 `DataGrid` — additive generic extension

`packages/fresh-ui/src/presentation/data-grid.tsx` is already exported from `mod.ts` with
`DataGridColumn<T>`, `DataGridRow<T>` (plain / button / href variants), `DataGridCellVariant`,
and a `render(row: T)` per-column template. This is a live public contract.

New surface is **additive and entirely optional**:

- `selectedIds` / `onSelectionChange` — controlled multi-selection
- select-all header cell with a real `indeterminate` state
- a bulk-action toolbar slot receiving the selection count
- a per-row actions slot rendered through `ActionMenu`
- destructive / disabled / loading affordances on actions

Constraint: **a call site that passes only `columns` and `rows` today must compile and render
byte-identically after this change.** No new required props. No change to the meaning of an
existing prop. Selection chrome (the checkbox column) must not appear unless the consumer opts
in by supplying selection props — otherwise every existing grid silently grows a column.

### 2.2 `ActionMenu` — new public export

New compound component: `Root`, `Trigger`, `Content`, `Item`, `Separator`. Purely additive, no
compatibility risk. The binding constraint is on *how* it is built: it must compose
`use-popover` and `use-dismissable-layer`. An implementation that registers its own
`document.addEventListener` is a failed implementation regardless of whether its tests pass —
that is precisely the defect #948 exists to remove.

### 2.3 `PromptInput` — a semantic change to the default configuration

This is the one genuine behaviour change, and it is deliberate.

Today `registry/components/ui/prompt-input.tsx` renders attach, screenshot, and mic glyphs
unconditionally with no callbacks attached — three buttons that do nothing. #949's acceptance
criterion is "no inert toolbar actions in the default/minimal configuration", so after this
change those affordances render **only when the consumer supplies the corresponding
capability**.

A consumer who renders `<PromptInput />` today and expects to see three (non-functional)
buttons will see none. That is the fix, not a regression. It is called out here, in the PR
body, and in the component's JSDoc.

Also added: `busy`, `onStop`, `sendDisabled` with accessible labels, and an explicit
`submitKey` policy of `'none' | 'enter' | 'mod-enter'` with matching `aria-keyshortcuts`.

Note the issue text for #949 is corrupted where escapes were mangled (`\busy`,
`^Gria-keyshortcuts`, `\none, enter, mod-enter`). Correct the issue with `gh issue comment`
so the policy enum is unambiguous for anyone reading it later.

## 3. Compatibility story for existing workspaces

1. **DataGrid** — additive only; no selection props means no selection chrome and no
   behavioural change. Guarded by a test that renders the pre-change call shape and asserts
   the rendered structure is unchanged.
2. **ActionMenu** — new export; nothing to break.
3. **PromptInput** — this is a registry component, so workspaces hold a *vendored copy* rather
   than importing it. Existing vendored copies are untouched until the consumer re-adds the
   component. The change surfaces on re-add, and the migration note belongs in the component
   JSDoc so it travels with the vendored file. Confirm this vendoring assumption against
   `registry.generated.ts` and the registry add path before relying on it — if registry
   components are in fact imported rather than copied, the compatibility story changes and
   the plan must be revised.
4. **Public API surface** — if the repo enforces an API report or export snapshot for
   `fresh-ui`, update it in the same commit.

## 4. Required regression guards

One guard per surface, each proven by breaking the fix, watching the guard fail, restoring,
watching it pass. Record that fails-before evidence in the run dir — a guard that has never
been observed failing is not evidence.

| # | Guard | Fails when |
| --- | --- | --- |
| G1 | Selection state and select-all/indeterminate over a controlled `selectedIds` | Selection is re-derived internally or the indeterminate state is dropped |
| G2 | A click on a row checkbox or row action menu does not trigger row navigation | Event isolation regresses (the #947 propagation defect) |
| G3 | ActionMenu closes on outside pointer, on Escape, and on item activation, and restores focus to the trigger | The dismissal path regresses to the #948 stuck-open defect |
| G4 | ActionMenu keyboard traversal (ArrowDown/ArrowUp/Home/End) with `menu`/`menuitem` roles | Collection navigation or ARIA semantics regress |
| G5 | No inert affordance renders in the default PromptInput configuration | An affordance is re-added without a capability gate |
| G6 | Submit-key policy: `mod-enter` submits without inserting a newline; a composition event never submits; `busy` blocks duplicate submits | Keyboard policy or IME safety regresses |
| G7 | Pre-change DataGrid call shape still compiles and renders unchanged | The additive-only promise is broken |

Plus a **static guard on the doctrine**, not just the behaviour: assert that the new menu code
introduces no `document.addEventListener` / `globalThis.addEventListener`. #948 is explicitly a
complaint about global listeners, so a behavioural test alone would let the defect back in via
a different route.

## 5. Gate evidence

Root `deno task lint` / `fmt:check` exclude `packages/cli` by their own exclude regex. This
change is under `packages/fresh-ui`, so confirm the root wrapper actually covers it — and if
there is any doubt, re-run scoped and report the scoped output:

```
deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts  --root packages/fresh-ui --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts   --root packages/fresh-ui --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/fresh-ui --ext ts,tsx
```

Evidence must cover the files actually changed. Any gate that could not be run is reported as
NOT RUN with the reason — never dropped, never claimed.
