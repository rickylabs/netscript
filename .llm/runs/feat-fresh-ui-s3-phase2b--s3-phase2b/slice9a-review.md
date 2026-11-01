# Independent slice9a source review

PASS (slice 9a source review, round 2)

The Direction blocker is fixed, and the round-2 changes add no new blocker. The source can be committed once the gates are refreshed on the final code.

- **Direction (`packages/fresh-ui/registry/components/ui/direction.tsx`):**
  - The new `as` form takes a closed set of native container tags (`div`, `section`, `main`, `article`, `aside`, `nav`, `header`, `footer`, `form`, `span`; lines 17-40). Direction renders that one boundary itself with `h(as, …)`, so ordinary precompiled JSX children work and no wrapper is added.
  - Native props and handlers are forwarded. `boundaryRef` targets the DOM node, which avoids the function-component `ref` trap.
  - An `as` value outside the set, and scoped `data-scope`/`data-part` props, throw.
  - The clone path is kept for native VNodes and still rejects fragments, templates, custom components and scoped children. Its error now names `as='section'`.
  - There's no context, global `dir` change or wrapper. The contract (an `as` enum plus `boundaryRef`) and the README are updated, and the fixtures, browser RTL/LTR ToggleGroup cases and installed precompiled-JSX consumer use the `as` form.
- **Root counting (`tests/contracts/contract-render.ts:23-44`):**
  - `independentRoots` walks the trusted SSR open, close and void tags and counts only outermost roots of the scope. So a valid nested Direction isn't flagged, while side-by-side `html + html` still fails as a duplicate.
  - It doesn't relax the attribute, part, axis value or `data-x-*` checks, which still run on every scoped element, nested ones included.
  - Keyboard and prop checks are unaffected.
- **AspectRatio:** the undefined `--ns-surface-muted` is replaced by the existing `--ns-muted` (`aspect-ratio.css:7`), and the new computed-background check against the resolved token in all four projects is real evidence.
- My round-1 conclusions about ScrollArea, the strict checker, the inventory and registry counts, and the absence of token, dependency, lock or schema changes still stand.

**Non-blocking:**

1. **Nested-root allowance.** `independentRoots` now accepts a root nested inside the same component for *every* component. A mutated style that renders a second root inside its own root would no longer be caught as a duplicate. This isn't one of the four mutation classes, and the other checks still apply, but consider limiting the allowance to fixtures or contracts that declare self-nesting, such as Direction, in 12b. Add one negative test for an illegitimate nested duplicate root in a non-nesting component.
2. **Clone-path props.** Extra props passed to Direction replace the cloned child's props, including `class`, rather than merging. Document this alongside the "overrides the child's dir" note.
3. **Gates still to finish:** the contract tests (345 expected), the installed-consumer tests (10, rerunning), the browser wrappers and the asset/copy refresh need to be green on the final code. Then run the carriers after the source commit. Don't reuse earlier PASS results for this head.
