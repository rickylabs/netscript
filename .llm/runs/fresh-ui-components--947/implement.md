use harness

## SKILL

netscript-harness, netscript-doctrine, netscript-cli, netscript-tools, netscript-pr

## Assignment — beta.12 grouped fix: fresh-ui-components

You are implementing ONE pull request that resolves 3 issue(s):
#947, #948, #949.

Branch: `feat/fresh-ui-component-pass` (already checked out, already has a draft PR: #989).
Run dir: `.llm/runs/fresh-ui-components--947/`
Milestone: 0.0.1-beta.12

### Why these are one change, not 3

One component-library pass over the same public surface: #947 typed DataGrid multi-select, bulk actions and per-row action menu; #948 an accessible ActionMenu composition over popover/dismissable-layer; #949 a production-capable PromptInput with action slots and submit keys. New public API, so it plans and the plan is challenged.

**Read `.llm/runs/fresh-ui-components--947/plan.md` before you start.** It is committed on this
branch and carries the shared-cause analysis, the contract change, the compatibility story, and
the seven regression guards you are required to deliver. `context-pack.md` in the same dir
carries the pre-flight framing corrections.

The short version of the shared cause: `@netscript/fresh-ui` already owns the runtime
primitives (`src/runtime/_internal/use-dismissable-layer.ts`, `collection-navigation.ts`,
`use-controllable-signal.ts`, `compose-event-handlers.ts`, `popover/use-popover.ts`) but the
presentational layer (`src/presentation/`, `registry/components/ui/`) is not wired to them.
All three issues are instances of that one unwiring. Fix the seam once. If you find a
different shared cause, say so explicitly in the PR body and fix that one instead.

### The issues as filed

---

#### #947 — Fresh UI: add typed DataGrid multi-select, bulk actions, and per-row action menu

## Problem
Applications using `@netscript/fresh-ui` need a reusable data-grid/list pattern for managing collections. eis-chat now has the same requirement on both Knowledge Base assets and channel sessions, but its local `DataGrid` only supports a single `selected` row plus `onSelect`/`href`.

## Requested API / behavior
- controlled multi-selection (`selectedIds`, select row, select all, indeterminate header)
- accessible keyboard and screen-reader semantics for checkboxes and rows
- bulk-action toolbar slot with selection count
- per-row actions slot/menu (for example Rename, Archive, Delete, Reprocess)
- destructive action styling and disabled/loading states
- event isolation so checkbox/menu clicks do not trigger row navigation
- responsive behavior for narrow layouts
- typed generic row/column API compatible with Fresh/Preact

## Concrete consumers
1. KB documents: bulk Delete/Reprocess, rename, labels, OCR provenance.
2. Channel sessions: bulk Archive/Delete and per-row Rename/Archive/Delete menu.

## Acceptance criteria
A consumer should not need to hand-roll selection state, select-all logic, keyboard behavior, menu event propagation, and bulk-toolbar layout for every grid. Include a reference example and tests for selection + row actions.

## Current workaround
`eis-chat/apps/dashboard/components/blocks/data-grid.tsx` is being extended locally to unblock product work; it should migrate to the shared Fresh UI primitive once available.

---

#### #948 — Fresh UI: add an accessible ActionMenu composition over popover/dismissable-layer

## Problem

@netscript/fresh-ui already has the right low-level runtime (usePopover and useDismissableLayer), but it does not expose a reusable action-menu composition for application rows/cards. Consumers fall back to native <details> menus and document-level event listeners. In eis-chat this caused every row menu to remain open after outside clicks, Escape, or item activation until a global workaround was added.

This is distinct from the DataGrid selection API in #947: DataGrid should consume the menu, while ActionMenu should also work on cards, list items, and arbitrary triggers.

## Requested surface

- typed compound API such as ActionMenu.Root, Trigger, Content, Item, Separator`n- controlled and uncontrolled open state
- built on the existing popover/dismissable-layer runtime, not new document-global listeners
- close on outside pointer interaction, Escape, and item selection
- restore focus to the trigger after dismissal
- ArrowUp/ArrowDown/Home/End navigation and correct menu/menuitem semantics
- collision-aware placement and portal behavior consistent with Popover
- event isolation suitable for clickable DataGrid/list rows (menu actions must not navigate the row)
- destructive, disabled, and loading item states

## Acceptance criteria

A consumer can place the menu inside a selectable/linkable row without invalid nested interactive markup, without custom click-away code, and with keyboard/focus behavior covered by tests.

## Dogfood evidence

eis-chat PR #152 currently carries DismissableOverlays.tsx as a scoped fallback. Once this primitive ships, that global compatibility layer and the hand-rolled <details> action menus should be removed.

Related: #947, #509

---

#### #949 — Fresh UI: make PromptInput production-capable with action slots and submit key policy

## Problem

The registry PromptInput renders attach, screenshot, and voice controls unconditionally, but those controls have no callbacks/capability props. It also leaves keyboard submission and busy/stop behavior to every app island. A real consumer therefore either shows inert buttons or forks the component.

eis-chat had to evolve its copy to remove unavailable actions, wire file/image attachment, block submission during OCR preflight, show stop while streaming, and support Ctrl/Cmd+Enter.

## Requested API

- optional onAttach / attachment capability, or typed leading/trailing action slots
- do not render screenshot/voice/attach affordances unless the consumer supplies the capability
- \busy, onStop, and sendDisabled states with accessible labels
- explicit submit key policy (\none, enter, mod-enter) rather than undocumented island code
- matching ^Gria-keyshortcuts and IME-safe handling
- consistent icon-button sizing between attach and send
- retain the presentational/form-first API and model/grounding/research controls

## Acceptance criteria

- no inert toolbar actions in the default/minimal configuration
- Ctrl/Cmd+Enter can submit without inserting a newline; plain Enter remains available for multiline when configured
- composition events do not accidentally submit
- busy/preflight state prevents duplicate submits and can expose Stop
- tests cover keyboard policy, disabled/busy state, and optional action rendering

## Dogfood evidence

eis-chat PR #152 contains the production behavior and can serve as an API/interaction reference. This can be delivered under the registry quality umbrella #509 without making chat transport or OCR concerns part of Fresh UI.

---

### Known defects in the issue text (verify, then correct on the issue)

Pre-flight reading of the code suggests all three issues are misframed. Confirm each against
the code yourself, then correct the issue with `gh issue comment --repo rickylabs/netscript`.

1. **#947 says the DataGrid is local to eis-chat.** But
   `packages/fresh-ui/src/presentation/data-grid.tsx` (323 lines) already exists in the shared
   package, is exported from `mod.ts`, and already has the typed generic `DataGridColumn<T>` /
   `DataGridRow<T>` contract the issue asks for. You are extending a live public contract, not
   adding a new component — which means existing call sites must keep compiling (guard G7).

2. **#948 understates what the runtime already provides.** `collection-navigation.ts` already
   implements the ArrowUp/Down/Home/End traversal, and `use-dismissable-layer.ts` already
   handles outside-pointer/Escape dismissal and focus restore. Compose these. Adding a new
   `document.addEventListener` is a failed implementation even if its tests pass — global
   listeners are the defect #948 exists to remove.

3. **#949's body is textually corrupted** where escape sequences were mangled: `\busy` means
   `busy`, `^Gria-keyshortcuts` means `aria-keyshortcuts`, and `\none, enter, mod-enter` means
   the policy enum `none | enter | mod-enter`. #948's body has a stray `` `n `` mid-list too.
   The substance is right; correct the text so the enum is unambiguous.

## Non-negotiables (learned the hard way — do not rediscover these)

1. **VERIFY THE ARTEFACT, NEVER THE EXIT CODE.** A previous session produced two false "pushed"
   reports from an `&&` chain short-circuiting on a no-op commit, and silently lost a file.
   After any commit/push, confirm the object exists: `git log`, `git ls-remote`, `gh pr view`.
2. **ALWAYS pass `--repo rickylabs/netscript` to every `gh` command.** Running `gh pr edit` from the
   wrong directory once destroyed an unrelated merged PR's body.
3. **Root `deno task lint` and `fmt:check` EXCLUDE `packages/cli` by their own exclude regex.**
   A green root wrapper proves NOTHING about a change under `packages/cli`. Re-run scoped:
   `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root <pkg> --ext ts,tsx`
   (same for `run-deno-fmt.ts` and `run-deno-check.ts`). Gate evidence must cover the files you
   actually changed.
4. **THE ISSUE IS PROBABLY WRONG.** Every single fix agent in round one found its issue understated
   or misframed; two found the stated cause was not the real cause; one found the described
   component did not exist at all (`grep HealthCheck` returned zero hits for an issue that said
   "the probe checks the port"). Verify the framing against the code BEFORE fixing. When the issue
   is wrong, **correct the issue itself** with `gh issue comment` — do not let the correction die
   in a PR body.
5. **Closing keyword.** Per AGENTS.md the PR body MUST carry `Closes #N` for every issue it fully
   resolves. Bare `#N` and `Refs #N` do not auto-close — that omission stranded 40+ merged PRs
   with stale-open issues.
6. **Report failures as failures.** A gate you could not run is declared NOT RUN with the reason.
   Never quietly drop it, never claim a pass you did not observe.


## What "done" means for this slice

- The fix is at the **root cause**, not at each symptom. If you find the issues share one cause,
  say so explicitly in the PR body and fix it once.
- A **regression guard** exists that fails when the defect is reintroduced. Prove it: break the fix,
  watch the guard fail, restore it, watch it pass. Report that as fails-before evidence.
  The plan lists seven required guards (G1-G7) plus a static guard asserting the new menu code
  adds no `document`/`globalThis` listeners.
- Gate evidence covers the changed files (see non-negotiable 3).
- Any issue that turned out to be wrong is corrected **on the issue**.
- Commit and push to `feat/fresh-ui-component-pass`. Do NOT merge, and do NOT take the PR out of draft —
  the supervisor does that after verifying.
