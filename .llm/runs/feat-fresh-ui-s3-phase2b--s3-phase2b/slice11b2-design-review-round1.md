**FAIL_PLAN**: Docs 11b2 design checkpoint (RuledGrid X8 and Hero X9), before any product code. The failure streak is now 1. A second consecutive `FAIL_PLAN` on this leaf escalates to the owner, with no third attempt.

The overall design is sound: native frames, slots the caller fills with real controls, no hooks, existing tokens only, and the full gate list. Two plan-level gaps would force contract or layout decisions during implementation, so they have to be settled first.

**Blocker 1: the responsive policy between 768px and 1120px is undefined, and the docs Shell hits that range at a 1280 viewport**
- **The gap in the checkpoint:**
  - Automatic Hero switches on viewport media at 767px, with desktop geometry of 1120 = 680 + 80 + 360 (`slice11b2-checkpoint.md:28-33, 52-53`).
  - RuledGrid says "tablet may use 2 only when enough width, explicit deterministic CSS policy documented" (lines 54–56), but never states the policy.
- **Why it matters:** in the shipped `SidebarShell` `docs` layout with a rail, a 1280 viewport leaves content of roughly 1280 − 240 − 280 minus padding, which is under 768px. Viewport media still chooses desktop there. Fixed Hero tracks would overflow, and 3- or 4-column ruled grids would squeeze.
- **The live docs CSS you name as the geometry source already has a middle band.** At `max-width: 1100px` Hero uses `minmax(0, 1.5fr) minmax(0, 1fr)` with gap 40, and at 700px it stacks (`docs/site/styles/components.css:836-870`). The checkpoint drops this band.
- **Required in the checkpoint:**
  1. **Choose what the switch measures.** Recommend container queries for automatic mode, because both components are content blocks, and it's consistent with DataGrid. If you keep viewport media, the desktop tracks must be fluid (`minmax(0, …)` capped at the ledger's maximums) and proven not to overflow inside the Shell.
  2. **Write the exact bands.** For Hero: the track template and gap for each band, carrying over the live middle band. For RuledGrid: the column count for each `data-columns` value in each band, with the matching border resets for the last inline-end cell, the last row and the top rule, in LTR and RTL.
  3. **Test the bands.** Add browser geometry checks at the band edges (for example 767/768 and around 1100) and inside the real Shell `docs` layout with a rail at 1280, plus the existing 390 and 1280. Assert no overflow, no doubled or missing rules, and alignment.
  4. Forced `breakpoint='desktop'` may stay a fixed reference render, documented as such.

**Blocker 2: the catalog changes to unshipped placeholders aren't listed**

The checkpoint introduces API that `src/contracts/catalog/docs-kit/4.ts` doesn't declare, without stating the contract change. The strict checker and slice 12's harness need it decided first:
- **RuledGrid.Cell:**
  - its qualified member;
  - its parts (`eyebrow`, `icon`, `title`, `description`, `action`, `arrow`), each with its `when` clause;
  - its slots;
  - that it carries no axes.

  The contract currently has only `root` and `cell`.
- **Hero `headingLevel`:**
  - its contract kind and value type, recommending string enum values `'1'`…`'6'` to match the catalog's convention (Toc `level` uses `'2' | '3'`);
  - its default;
  - that it affects element rank only, never typography.
- **Hero `paths`:** a new slot mapped to `path-stack`. `path-stack` needs `when: paths supplied` (it currently has none), and `aside` needs to render when either `aside` or `paths` is present.
- **Hero `data-breakpoint`:** state in the contract that it appears only when forced (`desktop` or `mobile`) and is absent in automatic mode.
- **Labelling:** mark each item as an explicit normalization of, or addition to, an unshipped placeholder, and confirm that settled values such as `layout` and `columns` don't change.

**Not blocking, already sound**
- The Cell frame has no link role, click handler or tabindex, so there are no nested interactive elements. Controls the caller supplies keep their native behavior.
- Title rank is the caller's choice.
- Owned attributes win after the spread, and Cell strips illicit axes.
- `paths` stays inside `aside`.
- No hooks, observers or L2 imports.
- Existing tokens only, with role resolution checked.
- The 26-file budget, the full gates, Utility captures against the ledger PNGs, and 11b3, 12 and 13 deferred honestly.

**Next**: revise `slice11b2-checkpoint.md` and the worklog with both corrections, then bring it back to this same review. No product code before a PASS.

Still required after that:
- **11b3:** the actual six-component Desktop audit.
- **12:** the declared x-extensions and the all-style harness.
- **13:** the full runtime run, the IMPL-EVAL and green CI at the exact head.

No READY.
