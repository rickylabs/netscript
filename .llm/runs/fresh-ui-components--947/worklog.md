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

## S3 — PromptInput capability and submit policy

- Capability-gated attach/screenshot/voice plus leading/trailing action slots; grounding/research
  toggles now also require callbacks, leaving no inert minimal toolbar controls.
- Added `busy`, Stop, send-disabled behavior and explicit `none | enter | mod-enter` policy with
  matching `aria-keyshortcuts` and IME/keyCode-229 protection. Registry source documents the
  re-add migration and generated content was refreshed through `gen:assets-barrel`.
- Fails-before proof: forced attach to render without a capability and disabled the composition
  guard; G5 and G6 both failed (2/8). Restored the implementation; suite passed 8/8.

## S4 — package gate evidence

| Gate | Result | Evidence |
| --- | --- | --- |
| G1/G2/G7 DataGrid | PASS | 8 focused tests; fails-before mutation failed 6/8 |
| G3/G4 ActionMenu | PASS | dismissal/focus/item helper + collection navigation tests; 4 menu + 3 popover tests |
| Menu no-global-listener static guard | PASS | fails-before sentinel failed 1/2; restored source passes |
| G5/G6 PromptInput | PASS | 8 focused tests; fails-before mutation failed 2/8 |
| Full fresh-ui tests | PASS | 164 passed / 0 failed with required temp-workspace permissions |
| Checked-in package `deno task test` | FAIL (tooling permission) | 162 passed / 2 existing Markdown tests failed because task omits `--allow-write`; rerun above proves tests |
| Scoped check/lint/fmt | PASS | fresh-ui wrappers, 148 TS/TSX files |
| Generated assets | PASS | `check:assets-barrel`, no generated diff |
| Root code quality/doctrine | PASS | `quality:gate` exit 0 (configured roots do not include fresh-ui) |
| Fresh-ui doctrine | PASS with baseline warnings | 0 FAIL; 5 existing folder/file-cardinality warnings |
| Design-system color gates | PASS | 160/161 files clean |
| Doc lint delta | PASS | baseline and final both 123 (96 private refs, 27 missing docs); new APIs add zero |
| JSR publish dry-run | PASS | all six entrypoints checked; no slow types; intended file set |
| Browser/Playwright | NOT RUN | package has no executable browser fixture/route for these library primitives; DOM behavior is covered by runtime contracts and focused event/navigation guards, but no visual-browser claim is made |

No new architecture debt was introduced. Existing doctrine warnings and the package test-task
permission omission were not widened or silently treated as product failures.
