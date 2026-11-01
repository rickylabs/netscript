# IMPL-EVAL — PR #2467, phase 1 of #2416, head a3135799b

**Verdict: FAIL_FIX.** There is one blocker: ActionMenu has lost its dropdown positioning. Nothing else I reviewed blocks.

I didn't edit, run, post or delegate anything. Only Read/Grep/Glob were available, so I couldn't write `evaluate.md`; the supervisor will need to record this verdict.

## Blocker: ActionMenu content no longer gets the floating styles

**Where:**
- `packages/fresh-ui/src/runtime/action-menu/ActionMenu.tsx:114` sets `data-scope='dropdown-menu'` after spreading `menu.getContentProps(...)`, which overwrites the popover runtime's `data-scope='popover'`. Line 59 does the same on the trigger.
- The forced scope exists to satisfy the checker fixture at `packages/fresh-ui/tests/contracts/utility-composites.tsx:299`, which expects `scope: 'dropdown-menu'`.

**Trigger:** open an `ActionMenu` in an app that has `floating-styles` installed.

**Why it breaks:**
- `registry/components/ui/floating.css` is the stylesheet for the popover-based runtimes. It only matches `[data-scope='popover'][data-part='content']` (lines 1–4, 14–26, 37–44), and no other CSS targets `dropdown-menu`.
- With that rule gone, the menu falls back to the browser's default `[popover]` style: `inset: 0; margin: auto`. Previously `floating.css` set `margin: 0`, `inset: auto` and a non-anchor fallback inset.
- The inline `position-area` that `use-popover.ts:187-192` sets still applies. But with auto margins and zero inset, the menu sits centered in the space below the trigger instead of directly under it. Browsers without anchor positioning centre it in the viewport.
- This breaks the "preserve Utility visuals" requirement for a shipped component.

**Why existing apps can't be repaired by migration:** ActionMenu is package-owned, so apps get the change when they upgrade the package. Their `floating.css` is an app-owned copy, and `ui:migrate variants` doesn't rewrite it.

**Why the evidence missed it:** neither the 187-case parity tool nor the browser matrix renders ActionMenu (no match anywhere in `tools/fresh-ui-browser`). The contract checker only looks at attributes.

**Minimal fix:**
1. Remove the `data-scope='dropdown-menu'` overrides on `ActionMenu.Trigger` and `ActionMenu.Content`, so they keep the popover runtime's scope. This follows the Drawer precedent, which keeps the `dialog` scope (fixture at `utility-composites.tsx:233`).
2. Point the fixture at `scope: 'popover'`, and either move `item`/`separator` onto the same scope or give the checker per-part scope support.
3. Record the delegation in the dropdown-menu contract notes and in `naming-decisions.md`.
4. Add a check that ActionMenu content renders `data-scope='popover'`, or add an ActionMenu case to the parity/browser run.
5. Re-run the Fresh UI tests and parity.

Adding `dropdown-menu` selectors to `floating.css` alone would not be enough, because upgraded app-owned copies would still miss them.

## My earlier slice 3/4 concerns, checked against the final code

- **Badge scaffold templates:** fixed. `health-view.tsx.template:9` and `telemetry-view.tsx.template:74` now use `data-variant`, and no `ns-badge--` remains in kernel assets.
- **Spinner part override:** fixed. The spinner always renders `data-part='root' data-scope='spinner'` (`button.tsx:86-92`).
- **Axe re-key and parity recheck:** both recorded in the worklog and drift log.

## Checked, no blocker

- **CLI preflight and writes:** every file is analysed before any write, and any diagnostic aborts the batch with nothing written. Dry-run follows the same path. Originals are re-checked before writing. Rollback restores the file that failed as well, because each file is added to the written list before its write.
- **Versioned edits:** an edit applies only when its "before" text appears exactly once. Duplicated or customized spans fail closed. Idempotence is backed by the zero-change second run on the real 0.0.8 scaffold.
- **Tokenizer:** JSX/CSS edits leave strings, comments, regexes and `url(...)` untouched. Dynamic or conflicting class expressions are refused. Controlled component modifiers need a manual conversion, and only variant/size/icon are forwarded to triggers.
- **CSS specificity:** `:where(.base)[attr]` keeps (0,1,0). `ns-btn--icon` maps to an `:is(...)` with the same specificity. State selectors are tied to their known component base, layout classes keep their old aliases, and a second run doesn't double the aliases.
- **Getter delegation:** popover, tooltip, dialog, sheet, tabs and combobox keep the runtime's own part/scope unless a caller explicitly passes one.
- **Contracts:** the `./contracts` facade and `contracts.json` are exported. Tests require 87 identities (66 shipped), lossless serialization, and a checked JSON file that matches the typed catalog.
- **Checker:** it needs a fixture for every shipped identity, exactly one rendering backend per fixture, and has negative controls for missing parts and attributes, invalid values and duplicate roots.
- **Ownership:** no lock or registry-schema changes, and the CLI uses injected dependencies.

Disclosed limits I did not count against the PR: Docker/Aspire runtime acceptance is unproven, and the doc-lint and `react-no-danger` findings are baseline.

**Overall verdict: FAIL_FIX** (one blocker: ActionMenu positioning). One repair and re-review in this session is available.
