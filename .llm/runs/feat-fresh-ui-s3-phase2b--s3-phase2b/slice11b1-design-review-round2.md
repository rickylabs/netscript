**PASS**: the round-2 Docs 11b1 design (Toc X4, AnchorNav X7 and the original Shell Toc integration) is ready to implement, with one binding condition. The failure streak resets to 0.

**Why it holds**
- **The round-1 blocker is resolved with the precedent option** (`slice11b1-checkpoint.md:14-16, 25-28, 156-159`).
  - `Toc.Item.state` is a forced-preview port taking only `rest | hover`. `current` is owned by the root, is never writable, and always overrides the preview.
  - So every declared `data-state` value (`rest`, `hover`, `current`) is renderable, and the strict fixtures exercise all three. That matches the Breadcrumb and Pagination pattern (`src/contracts/catalog/navigation/1.ts:20-27, 71-78`), with live hover still CSS.
  - The root `state` and `level` in the current catalog (`src/contracts/catalog/docs-kit/2.ts:170-184, 235-247`) are recorded explicitly as unshipped placeholders moving to the qualified `Item.level` and `Item.state`. No shipped caller loses a prop.
- **Where the code runs** (lines 161–165): hooks, media queries, observers and callbacks run only inside an island the caller owns. A server-only Toc with no forced breakpoint is static desktop navigation, proven by strict SSR and a 390px browser case with scripts disabled: no overflow, working links, and no marker unless an explicit id is set. Forced no-JS composition is recommended.
- **Initial precedence** (lines 167–174):
  - SSR uses `currentId` whenever it's defined, with an explicit `null` meaning nothing is selected; otherwise `defaultCurrentId`; otherwise `null`. It never reads the hash.
  - One proposal with `reason: 'hash'` is made in an effect after hydration. When uncontrolled it's accepted; when controlled it's only proposed.
  - Invalid targets propose nothing, a value equal to the current one fires no callback, and refused candidates are deduplicated to prevent loops.
- **Attributes the components own** (lines 176–180): `aria-current`, `data-scope`, `data-part`, `data-state` and `data-level` are applied after the native attributes are spread, so callers can't override them. `AnchorNav.Link` emits no `data-level` or `data-state`, even if a caller supplies them. Strict negative controls cover a caller passing `aria-current` and `data-*`.
- **The end-of-scroll case** (lines 182–184) is defined for window and nested containers.
- **The rest is unchanged and sound:** native links and `details`, no duplicated children or IDs, own-branch-only focus handoff, offsets from `scroll-padding` and `scroll-margin`, the copied support item without L2-to-L2 imports, caller composition into Shell's slots, existing tokens only, and the full gate list.

**Binding condition: make the AnchorNav `observe`/`state` precedence explicit in source**

The worklog says it's discriminated (`worklog.md:709`), but the checkpoint body only states the rule in prose (lines 56–58), and there's no corrections-section entry or strict test for it. Implement it as:
- **Types:** `{ observe: true; state?: never } | { observe?: false; state?: 'rest' | 'scrolled' }`. Passing both is a type error, which the type-check fixture proves.
- **Runtime:** when `observe` is true, derived geometry owns `data-state` and any `state` prop is ignored. When it's false, `state` is caller-owned, defaulting to `rest`.
- **Tests:**
  - strict SSR cases for `observe=false` with the default, `rest` and `scrolled`;
  - a strict SSR case for `observe=true` showing `rest` before hydration;
  - a browser case for derived `scrolled` after pinning.
- Add one line recording this to the checkpoint's corrections section when you commit.

**Next**
1. The source slice under 30 files.
2. Its full gates.
3. This same source review, then evidence review.
4. The carriers, the public audit and the explicit-stage push.

Still required after that:
- **11b2:** RuledGrid and Hero, the actual six-component Desktop audit.
- **12:** the declared x-extensions and the all-style harness.
- **13:** the whole-phase runtime run, the IMPL-EVAL and green CI at the exact head.

No READY.
