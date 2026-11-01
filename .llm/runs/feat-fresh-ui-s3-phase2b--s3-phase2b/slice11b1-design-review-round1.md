**FAIL_PLAN**: Docs 11b1 design checkpoint (Toc X4 and AnchorNav X7, plus the original Shell Toc integration), before any product code. The failure streak is now 1. A second consecutive `FAIL_PLAN` on this leaf escalates to the owner rather than looping a third time.

The plan is mostly concrete and well-grounded. One contract decision is unresolved, and the implementation can't finish without making it, so it has to be settled before code. Four small precision gaps should be fixed in the same revision. Nothing else blocks.

**Blocker: Toc item `data-state` would declare a value nothing can render**
- **The current catalog:** `toc` (`src/contracts/catalog/docs-kit/2.ts:177-184, 241-247`) declares a root `state` prop and `data-state` with values `rest | hover | current`.
- **What the checkpoint does:** it moves this to a *derived* `data-state` on `Toc.Item`, keeps the `rest|hover|current` vocabulary, says native hover stays CSS, and forbids any writable visual state. So nothing can ever emit `data-state='hover'`, and the contract would advertise a value it can't produce.
- **The shipped precedent is different.** Breadcrumb and Pagination (`src/contracts/catalog/navigation/1.ts:20-27, 71-78, 128-136, 223-230`) keep `hover` in a real `state` prop or attribute that a caller can force for previews. The live states also use CSS, as the description notes.
- **Pick one option and write it into the checkpoint, the catalog plan and the strict-render plan:**
  - **(a) Narrow the placeholder explicitly.** Item `data-state` becomes `rest | current`, derived only from accepted current. Hover is documented as CSS `:hover` only. The note records it as an explicit change to an unshipped placeholder.
  - **(b) Follow the precedent.** Add a narrow forced-preview `state?: 'rest' | 'hover'` on `Toc.Item`, so `current` is never writable and can't compete with accepted `currentId`. Live hover stays CSS. Strict render covers the forced `hover` and the derived `current`.
- Either way, the unshipped root `level` moving to `Item.level` is fine as stated. Slice 12's harness and negative fixtures need a stable, renderable value set, which is why this can't wait.

**Precision gaps to fix in the same revision**
1. **When Toc actually runs on the client.** Hooks, `matchMedia`, observers and `onCurrentChange` only run when Toc is rendered inside a caller's island. State this in the API and the README. Add a strict SSR plus browser case for a server-only render with no forced breakpoint at 390px: static desktop branch, no overflow, links working, no marker unless `currentId` or `defaultCurrentId` is set. Recommend forced `mobile`/`desktop` composition for no-JS layouts, as the Shell integration does.
2. **Initial current precedence.**
   - SSR uses `currentId ?? defaultCurrentId`, and never reads the hash.
   - After hydration, a valid decoded initial hash is proposed once, in an effect, with `reason: 'hash'`. When uncontrolled it replaces the default, and when controlled it's only proposed. That avoids a hydration mismatch.
   - An empty, foreign or missing target proposes nothing.
   - Say whether a proposal that matches the current value fires the callback. Recommend that it doesn't.
3. **AnchorNav `state` versus `observe`.** Define precedence with types, or a documented rule, plus a strict test. Recommend: when `observe` is true, derived geometry owns `data-state` and the `state` prop isn't accepted, so the types make them mutually exclusive. When it's false, `state` is caller-owned, defaulting to `rest`.
4. **Attributes the component owns.** On `Toc.Item` and `AnchorNav.Link`, `aria-current`, `data-part`, `data-state`, `data-level` and `data-scope` are component-owned and win over native attributes passed through. Add a strict-render case where a caller passes `aria-current`.

**Non-blocking**: define the end-of-scroll case. When the container can't scroll further, the last heading that's at least partly visible becomes current, so short final sections can be reached. Test it in both window and nested containers.

**Not blocking, already sound**
- Native links with no `preventDefault`, hash writing, roving tabindex or live region, and refusal never moves the accepted marker.
- A native, uncontrolled `details` in mobile that survives re-renders.
- A single responsive branch with no duplicated children or IDs, and own-branch-only focus handoff.
- Passive capture scroll with coalesced `requestAnimationFrame`, cleanup on unmount, and discovery by ID without selector interpolation.
- Offsets from `scroll-padding-block-start` and `scroll-margin-block-start`.
- A copied support item with no L2-to-L2 imports. Shell composes through the existing `railContent` and `mobileRailContent` slots without importing Toc.
- Existing tokens only, and the full gate list including Firefox/WebKit native focus, and the same reviews.

**Next**: revise `slice11b1-checkpoint.md` and its worklog entry with the choice above and the four precision gaps, then bring it back to this same review. No product code before a PASS.

Still required after that:
- **11b2:** RuledGrid and Hero, the actual six-component Desktop audit.
- **12:** the declared x-extensions and the all-style harness.
- **13:** the whole-phase runtime run, the IMPL-EVAL and green CI at the exact head.

No READY.
