# Context pack — fresh-ui-components (#947, #948, #949)

Milestone: 0.0.1-beta.12
Branch: `feat/fresh-ui-component-pass`
Lane: light_implementation (Codex · OpenAI · gpt-5.6-sol · low)

## The three issues

- **#947** — Fresh UI: add typed DataGrid multi-select, bulk actions, and per-row action menu.
- **#948** — Fresh UI: add an accessible ActionMenu composition over popover/dismissable-layer.
- **#949** — Fresh UI: make PromptInput production-capable with action slots and submit key policy.

## Shared-cause hypothesis

`@netscript/fresh-ui` ships these three surfaces as **presentational shells that stop at the
point where interaction state begins**. Each one hands the hard part — selection state,
dismissal, keyboard policy — back to the consumer island, and each consumer then re-derives
the same logic with document-global listeners and hand-rolled state.

The package already owns the runtime primitives that would close the gap:

- `packages/fresh-ui/src/runtime/_internal/use-dismissable-layer.ts`
- `packages/fresh-ui/src/runtime/_internal/collection-navigation.ts`
- `packages/fresh-ui/src/runtime/_internal/use-controllable-signal.ts`
- `packages/fresh-ui/src/runtime/_internal/compose-event-handlers.ts`
- `packages/fresh-ui/src/runtime/popover/use-popover.ts`

So the shared cause is not "primitives are missing" — it is that the presentational layer
(`src/presentation/`, `registry/components/ui/`) is **not wired to the runtime layer**. The
three issues are three instances of that same unwiring. The fix is one composition pass, not
three components built independently.

## Framing corrections to verify against the code

These are pre-flight observations for the implementer to confirm; the issues are believed
to be understated or misframed in the following ways:

1. **#947 says the DataGrid is local to eis-chat.** It is not only local —
   `packages/fresh-ui/src/presentation/data-grid.tsx` (323 lines) already exists in the
   shared package, is exported from `mod.ts`, and already has a typed generic
   `DataGridColumn<T>` / `DataGridRow<T>` contract with `render`, `cell`, and href/button row
   variants. The work is **extending an existing public contract**, not adding a new
   component. That changes the compatibility story: existing consumers of the current
   `DataGrid` must keep compiling.

2. **#948's premise about the runtime is correct**, but it understates what is already
   available. `collection-navigation.ts` already implements the ArrowUp/Down/Home/End
   collection traversal the issue asks for, and `use-dismissable-layer.ts` already handles
   outside-pointer/Escape dismissal and focus restore. ActionMenu should be a **composition
   over these**, and reviewers should reject any implementation that adds new
   document-global listeners.

3. **#949's body is partly corrupted in the issue text.** It contains literal mojibake where
   escape sequences were mangled: `\busy` should read `busy`, `^Gria-keyshortcuts` should
   read `aria-keyshortcuts`, and `\none, enter, mod-enter` should read `none, enter,
   mod-enter`. The substance is correct —
   `packages/fresh-ui/registry/components/ui/prompt-input.tsx` (145 lines) does render
   attach/screenshot/mic glyphs unconditionally with no callbacks — but the issue text needs
   correcting so the submit-key policy enum is unambiguous.

## Deliverable

ONE pull request that closes all three, fixing the presentational/runtime seam once and
demonstrating it across the three surfaces, with a regression guard per surface.

## Implementation status

- PLAN-EVAL PASS: OpenHands commit `11639dea4`.
- S1 ActionMenu composition implemented locally; focused/static/scoped evidence is recorded in
  `worklog.md`; landed as `339f049c3`.
- S2 DataGrid controlled selection/actions implemented locally with G1/G2/G7 fails-before evidence;
  awaits slice commit/push.
