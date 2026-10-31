**FAIL_PLAN**

The research holds up, but three plan-gate boxes are unchecked.

**Spot-checks that passed:**
- The low-level token build still defaults to `ns-one` (`packages/fresh-ui/src/tokens/adapters/style-dictionary.ts:40`). The CLI token init falls back to the engine's default (`packages/cli/src/kernel/application/tokens/init-app-tokens.ts:19`).
- Studio Utility's Figma values match the research: control radius 0, card radius 0, badge radius 2. The disabled state opacity is stored as the percentage 38, so the "divide by 100" note is right.
- Registry buttons still use offset shadows (`packages/fresh-ui/registry/components/ui/button.css:54-85`).
- The plan matches #2419's folded generated-page items (raw JSON islands, bare button, `/health` overflow, dead Design link).
- Refs-only, no labels or session ids, exact-head green checks before READY, and separate read-only evaluations are all recorded.

**Boxes that pass:**
- Research is present and re-baselined to c6bce8f.
- Decisions are locked.
- The risk register is present.
- Deferred scope is explicit.
- The jsr-audit surface scan is done.

**Blockers:**

1. **Commit slices: no files listed, slice 2 is too large, and no per-slice gate.**
   - The protocol requires each slice to name the files it touches and the gate that proves it, and to stay under 30 files. The slices only name categories such as "CLI application/init and page/island templates" and "existing registry component CSS plus layout/island styles".
   - Slice 2 covers "every baseline registry visual item": 41 components and 11 blocks, plus islands and layouts. That is 49 CSS files in `registry/components/ui` alone (79 registry CSS files in total), before any `.tsx` state fixes or generated carriers.
   - Fix: split slice 2 into component-family sub-slices, each under 30 files, with explicit paths, the items covered, and the gate that proves each one. List slice 1's exact files too.
   - Slice 1 must also name which entry points change. There are three that pick a preset: the scaffold writer behind `netscript init`, `ui init`, and `tokens init`. Say whether `tokens init` or `ui init` with no preset on an app that has no token config gets Utility or `ns-one`. Otherwise the "new app vs old app" boundary is decided during implementation.

2. **Open-decision sweep: the Figma comparison has no method or threshold.**
   - #2419's acceptance requires the visual diff against Figma to be "within the agreed threshold". The plan only says "compact per-component Figma comparison" and "ledger wins".
   - Leaving this open forces rework at implementation review, because the evaluator has no pass criterion for slice 3.
   - Fix: lock the reference source (Figma frames vs ledger), the capture method (actual-component Playwright renders), the metric and threshold, and how a component over the threshold is handled. Or mark it as deferred acceptance and list it in the remaining scope the Refs-only PR will state.

3. **Gate set: the frontend overlay is incomplete.**
   - The Frontend scope overlay requires a route check with representative data, loading/empty/error states, and a responsive (mobile/desktop) check.
   - The plan's browser evidence covers schemes, interaction states, sizes, RTL and reduced motion. For the generated pages it says only "layout".
   - Fix: add these to the gate set:
     - mobile and desktop checks of the generated pages, including `/health` under the top bar;
     - loading/empty/error states for the reworked data-bound islands;
     - a production-mode check that the Design link is absent when the design routes don't ship, and present in development.
