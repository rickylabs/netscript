# IMPL-EVAL Evaluation Summary - PR #58

## Verdict: FAIL_FIX

## Summary
PR #58 attempts to clear 7 `private-type-ref` errors from `deno doc --lint` by exporting the 7 `*Namespace` types. While it successfully clears the primary gate (0 `deno doc --lint` errors), the implementation introduces 42 new `no-explicit-any` lint violations by degrading component types to `(props: any) => unknown`.

## Changes
- 1 commit (8c26459), 8 files changed (all under `packages/fresh-ui/`)
- Exports 7 namespace types from `interactive.ts`
- Changes each namespace member from `typeof Subcomponent` to `(props: any) => unknown`

## Validation

### Primary Gate (deno doc --lint): PASS
```
$ deno doc --lint packages/fresh-ui/mod.ts packages/fresh-ui/interactive.ts packages/fresh-ui/primitives.tsx
Checked 3 files
[exit code 0, no errors]
```

### Type Checking: PASS
```
$ deno check --unstable-kv packages/fresh-ui/mod.ts packages/fresh-ui/interactive.ts packages/fresh-ui/primitives.tsx
[exit code 0, all 3 files check successfully]
```

### Scope Verification: PASS
```
$ git show 8c26459 --stat
packages/fresh-ui/interactive.ts                      |  7 +++++++
packages/fresh-ui/src/runtime/accordion/Accordion.tsx | 13 +++++++------
packages/fresh-ui/src/runtime/dialog/Dialog.tsx       | 15 ++++++++-------
packages/fresh-ui/src/runtime/drawer/Drawer.tsx       | 15 ++++++++-------
packages/fresh-ui/src/runtime/popover/Popover.tsx     | 23 ++++++++++++-----------
packages/fresh-ui/src/runtime/sheet/Sheet.tsx         | 15 ++++++++-------
packages/fresh-ui/src/runtime/tabs/Tabs.tsx           | 11 ++++++-----
packages/fresh-ui/src/runtime/tooltip/Tooltip.tsx     | 15 ++++++++-------
8 files changed, 64 insertions(+), 50 deletions(-)
```
✓ All files under `packages/fresh-ui/`
✓ No `deno.json` version edits
✓ No `deno.lock` churn
✓ No deleted files

### Lint Verification: FAIL
```
$ deno lint packages/fresh-ui/ 2>&1 | grep -c "error\[no-explicit-any\]"
43
```

**Baseline comparison:**
- Pre-PR (parent commit 2a2aec70): 1 `any` total (1 in Dialog.tsx, 0 in other namespace files)
- Post-PR (commit 8c26459): 43 `any` total
- **Newly introduced by this PR: 42 `no-explicit-any` violations**

All 42 new violations are in the namespace type definitions across the 7 component files (Accordion, Dialog, Drawer, Popover, Sheet, Tabs, Tooltip).

## Ruling on Central Question: (b)

**Reject the minimal/lossy `(props: any) => unknown` approach.**

The implementation must preserve type precision by:
1. Exporting the underlying subcomponent functions (e.g., `AccordionItem`, `AccordionRoot`, `DialogClose`, etc.)
2. Keeping `typeof Subcomponent` in the namespace type definitions
3. This maintains full type information for API consumers without introducing `any`

**Rationale:**
- The repo's linter explicitly prohibits `any` via `no-explicit-any` rule
- Introducing 42 lint violations to fix 7 doc errors is a net regression
- Type precision matters for consumers of the public API
- The alternative approach (exporting subcomponents) solves both problems cleanly

## Remaining Risks

1. **Lint failure blocks merge**: The 42 new `no-explicit-any` violations must be resolved before this PR can merge
2. **Type information loss**: Current implementation degrades the public API's type precision, harming developer experience for consumers
3. **Incomplete solution**: The PR solves one problem while creating another of similar magnitude

## Recommendation

Re-issue this slice with direction (b): export the underlying subcomponent functions and preserve `typeof` typing. This requires:
- Export each subcomponent function (e.g., `export function AccordionItem`, `export function AccordionRoot`, etc.)
- Keep `typeof Subcomponent` in namespace type definitions
- Verify both `deno doc --lint` and `deno lint` pass with 0 errors
- Confirm no `no-explicit-any` violations introduced
