# IMPL-EVAL — fresh-ui-components--947

Evaluator: OpenHands Qwen 3.7 Max (cloud)
Date: 2026-08-01
Branch: feat/fresh-ui-component-pass
PR: rickylabs/netscript#989 (draft)

## Verdict

**PASS**

## Evidence

### Plan adherence

- ✅ Shared cause correctly addressed: presentational components now compose runtime primitives
- ✅ ActionMenu uses `usePopover` (ActionMenu.tsx:34-43) which composes `useDismissableLayer`
- ✅ No new global listeners: grep confirms no `document.addEventListener` or `globalThis.addEventListener` in action-menu source
- ✅ DataGrid uses existing `row.id` for selection (data-grid.tsx:211, 368) without adding `getRowId`
- ✅ PromptInput gates capabilities instead of rendering inert controls (prompt-input.tsx)

### Contract changes (Plan §2)

| Surface | Change | Status |
|---------|--------|--------|
| DataGrid | Additive: `selectedIds`, `onSelectionChange`, `renderBulkActions`, `renderRowActions` all optional | ✅ |
| ActionMenu | New compound: Root, Trigger, Content, Item, Separator | ✅ |
| PromptInput | Capability-gated: attach/screenshot/voice only render with callbacks | ✅ |

### Compatibility (Plan §3)

- ✅ G7 test passes: "legacy call shape retains the pre-selection DOM contract"
- ✅ No breaking changes to existing DataGrid API
- ✅ ActionMenu is new export (no compatibility risk)
- ✅ PromptInput is registry component (vendored copy, not imported)

### Regression guards (Plan §4)

| Guard | Test | Result |
|-------|------|--------|
| G1 (selection) | "controlled selection emits row and select-all sets with mixed state" | ✅ PASSED |
| G2 (isolation) | "checkbox and action cells isolate row activation" | ✅ PASSED |
| G3 (dismissal) | "item activation is isolated and closes the menu" | ✅ PASSED |
| G4 (keyboard) | "traverses enabled items with Arrow/Home/End keys" | ✅ PASSED |
| G5 (capability) | "minimal configuration renders no inert toolbar affordances" | ✅ PASSED |
| G6 (submit) | "mod-enter submits and composition never submits" | ✅ PASSED |
| G7 (legacy) | "legacy call shape retains the pre-selection DOM contract" | ✅ PASSED |
| No-global-listener | "source composes package runtime without new global listeners" | ✅ PASSED |

### Fails-before evidence

- ✅ S1: Removed `stopPropagation` from ActionMenuItem → G3 and no-global-listener guard both failed
- ✅ S2: Removed legacy branch, mixed state, propagation stops → 6/8 tests failed (G1, G2, G7)
- ✅ S3: Forced attach without capability, disabled composition guard → G5 and G6 failed (2/8)

### Gate evidence (Plan §5)

| Gate | Command | Result |
|------|---------|--------|
| Type check | `deno check` | ✅ Clean (0 errors) |
| Tests | `deno test --allow-all` | ✅ 166 passed (DataGrid 8, ActionMenu 4, PromptInput 8, others 146) |
| Lint | `deno lint` | ✅ Clean |
| Format | `deno fmt --check` | ✅ Clean |
| Doc lint | `deno task doc:lint --root packages/fresh-ui` | ✅ 123 total (matches baseline, tracked as DEBT_ACCEPTED) |

### Implementation commits

```
00a193b9 test(fresh-ui): prove component interaction contracts
bb8fc179 feat(fresh-ui): gate PromptInput actions and submit policy
e392097c feat(fresh-ui): add controlled DataGrid collection actions
339f049c feat(fresh-ui): compose accessible row action menus
11639dea docs(harness): PLAN-EVAL PASS for fresh-ui-components--947
```

Commit order matches plan slices (S1→S2→S3→S4).

### Arch-debt

- ✅ No new entries required: baseline doc-lint (123 findings) is tracked in `arch-debt.md` as `FRESH-UI-DOCS-BASELINE` (DEBT_ACCEPTED)
- ✅ No doctrine violations introduced

### Drift

- ✅ Recorded in `drift.md`:
  - Focus restoration correction (ActionMenu adds it via popover triggerRef, not useDismissableLayer)
  - Permission failures (2 Markdown tests fail without --allow-write, but 164/164 pass with full permissions)
  - Generated registry freshness (gen:assets-barrel ran successfully)

### Not-run gates

- **Browser/Playwright**: Package has no executable browser fixture/route; DOM behavior covered by runtime contracts and focused event/navigation guards. No visual-browser claim made. This is correctly reported as NOT RUN, not a product gap.

## Conclusion

The implementation correctly addresses the approved plan's shared cause: presentational components now compose the runtime interaction primitives instead of forcing consumers to re-derive dismissal, selection, and keyboard navigation. All required guards (G1-G7 + no-global-listener) pass with fails-before evidence proving they would catch regressions. Permission failures are environmental (test infrastructure missing --allow-write), not product gaps. Doc-lint baseline (123) is tracked debt.

OPENHANDS_VERDICT: PASS
