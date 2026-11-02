PASS (slice 7c3b: PageHeader source and test approach, not the final IMPL-EVAL)

I found no blockers. You said the 461-test, browser and final quality reruns are still in progress, so this verdict isn't final until those results are recorded.

- **Compatibility** (`packages/fresh-ui/registry/components/ui/page-header.tsx`):
  - The `PageHeader.Layout/Main/Aside/Badges/Intro/Actions/Status` namespace and `children` keep their output, and children still render last in source order.
  - New declarative slots compose the same section parts: `breadcrumb`, `eyebrow`/`title`/`description` in the intro, `actions`, `tabs` and `status`.
- **Title:** `title` now renders one native `h1`. It's removed from the root's HTML attributes, so it can't also become a tooltip. The README (line 18) and the L2 contract notes (`src/contracts/catalog/layout-blocks/1.ts:349`) state the tooltip collision explicitly.
- **Empty-slot rule:** `hasContent` treats `null`, `undefined`, booleans, `''` and arrays whose contents are all empty (at any depth) as absent, so they create no wrapper. `0` still counts as content. Heading and intro wrappers only appear when they have content.
- **Variant:** `variant` is only a `data-variant` marker (`default`/`with-tabs`/`with-status`), and no breakpoint prop was invented.
- **CSS** (`page-header.css`):
  - It now ships the whole copied rhythm itself: intro, heading row, actions/status clusters and tabs.
  - The heading row switches to a row at 40 rem, and it only uses existing type roles with fallbacks.
- **Dependencies:** the `.ns-stack`/`.ns-cluster` seams come from the declared `layout-objects` dependency (`registry.json:3113-3116`). `tools/fresh-ui-browser/gap-server.ts:7-8` now loads the registered layout support stylesheet, so the browser fixture matches what a real install provides.
- **Scope:** AppShell, Sidebar and TopBar stay explicitly in phase 2b. The five-archetype mapping in `shell-archetype-audit.md` is presented as an audit, not as pixel or keyboard proof.

Non-blocking:

1. `title` always renders an `h1`. Pages that already have their own `h1` (for example a docs layout) would end up with two. Consider an optional heading-level override, or a README note saying PageHeader owns the page `h1`.
2. The declarative heading row and `PageHeader.Layout` both use `data-part='layout'`, though with different classes. That's fine for the contract checker, but a separate part name for the heading row would make style targeting less ambiguous.

Still to come:
- The full browser matrix with the shared layout stylesheet, the finalized gates and the carriers, followed by the evidence sign-off before push.
- The whole-phase IMPL-EVAL, which is separate.
