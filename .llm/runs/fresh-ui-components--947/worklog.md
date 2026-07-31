# Worklog — fresh-ui-components (#947, #948, #949)

## Design

### Public surface

- `ActionMenu.Root`, `Trigger`, `Content`, `Item`, `Separator` and their public prop/state types from
  `@netscript/fresh-ui/interactive`.
- Additive `DataGridProps<T>` selection identity/state callbacks plus typed bulk-action and row-action
  render contexts from the root package.
- Copied `PromptInputProps`, `PromptSubmitMeta`, and submit policy/capability props in the registry
  source; regenerated embedded registry output.

### Domain vocabulary

- Menu open-change reason, item intent (`default | destructive`), disabled/loading item state.
- Row identity, selected ID set, selection-change callback, bulk/row action render context.
- Prompt submit policy (`none | enter | mod-enter`) and capability/action slots.

### Ports

- Existing Preact/Signals component runtime, `usePopover`, `useDismissableLayer`, collection
  navigation, controllable signal, and composed event handlers. No new external port or global event
  subscription is introduced.

### Constants

- Submit policy and action intent finite values are exported readonly constants with derived union
  types where consistent with package convention.

### Commit slices

S1 ActionMenu runtime → S2 DataGrid additive selection/actions → S3 PromptInput registry capability
policy → S4 full regression/gate evidence. Each slice and its files/gates are detailed in `plan.md`.

### Deferred scope

Sorting/filtering/virtualization, typeahead/submenus, attachment/OCR/chat transport, and downstream
consumer migration.

### Contributor path

Menu behavior extends the action-menu runtime folder and focused tests; collection presentation
extends `data-grid.tsx` and its CSS/tests; copied chat composition extends the PromptInput registry
source then runs the checked-in asset generator. Public consumers start at `mod.ts`/`interactive.ts`.

## Pre-implementation evidence

- PLAN-EVAL: pending separate-session formal evaluation; implementation is stopped.
- Baseline doc-lint: FAIL (123 pre-existing `interactive.ts` findings); delta gate selected.
- Issue framing corrections: posted and verified on #947/#948/#949.

## S1 — ActionMenu composition

- Added the compound ActionMenu runtime over `usePopover` and collection navigation; no new global
  event listener set. Item activation is isolated, disabled/loading/destructive state is semantic,
  and dismissal restores trigger focus through the shared popover runtime.
- Fails-before proof: inserted a `document.addEventListener` regression sentinel in the new menu
  source; the static guard failed (1 failed / 1 passed). Restored the source; focused tests and
  scoped gates then passed.

## S2 — DataGrid controlled collection actions

- Added opt-in controlled selection using the existing row IDs, real mixed header checkbox state,
  selection-count bulk toolbar, typed row-action slot, isolated nested controls, keyboard row
  activation, real href fallback, and horizontal overflow for narrow layouts.
- The no-selection/no-actions branch calls the legacy renderer unchanged (G7).
- Fails-before proof: simultaneously removed the legacy branch, mixed state, and propagation stops;
  the focused suite failed 6/8 tests including G1, G2, and G7. Restored the implementation and the
  suite passed 8/8.
