# Audit guard — never suppress cache reads/seeds on `ctx.isPartial`

**Source:** EIS Chat PR #191 / closed upstream #1550. **Status:** audit guard for #1459 review and
#1568/#1569 implementation. **Explicitly not scope for #1584 (#1227).**

## The rule

**Fresh client navigation is itself a page partial.** NetScript therefore treats
*component + authoritative `cachedAt`* as **partial-hit → skip**, and only **genuine absence** as
**partial-miss → submit**.

Do **not** add or preserve any helper that suppresses a cache read or seed *merely because*
`ctx.isPartial` is true. Named offenders to reject on sight:
`readWhenFullRequest`, `seedWhenFullRequest`, `readInitialRenderSeed`.

## Verified clean on current `main`

| Check | Result |
| --- | --- |
| `readWhenFullRequest` | **0 files** |
| `seedWhenFullRequest` | **0 files** |
| `readInitialRenderSeed` | **0 files** |

`getCachedEntry` does **not exist in `packages/**` source** under that name — the only hits are
`.llm/runs/` design/research artifacts describing the **SDK server-only** cache-provider surface
(`packages/sdk/src/cache/cache-provider.ts`). So "preserve non-fetching `getCachedEntry`" binds to the
SDK cache surface, not to a Fresh defer-path symbol. Stated so a future reader does not hunt for a
Fresh helper that was never there.

## The distinction that matters — do not "clean up" these lines

`isPartial` **is** referenced on the defer path, and those uses are **legitimate**. They gate
**outbound prewarm fetches and a metric**, not cache reads —
`packages/fresh/src/application/defer/DeferPage.tsx:182-184,190`:

```ts
const shouldPrewarmStale = !isPartialRequest && hasCachedData && isStale && resolvedPolicy.prewarmOnStale;
const shouldPrewarmMiss  = !isPartialRequest && !hasCachedData && resolvedPolicy.prewarmOnMiss;
const fallbackVisible    = !isPartialRequest && !isPrewarmRequest && !hasCachedData;
```

Not prewarming during a partial request is correct. **Removing these would break prewarm; adding a
cache-read suppression alongside them, by analogy, would violate the guard.** The two look similar
and are opposite in meaning.

The actual hit/miss decision is `hasCachedData = !!component` (`DeferPage.tsx:169`) — the cache read
happened **upstream**, and `DeferPage` receives `component` + `cachedAt` as props. That is exactly the
shape the guard requires, and it is already correct.

## Obligations when implementing #1568 / #1569 and reviewing #1459

1. **Preserve non-fetching cache reads on full *and* client-navigation renders.** Client nav is a
   partial; it must still read.
2. **Return `{ data, cachedAt }` unchanged** — no reshaping, no dropping `cachedAt`, which is the
   authoritative freshness signal the partial-hit decision depends on.
3. **Test partial-hit vs genuine partial-miss as distinct cases.** A single "partial" test proves
   nothing here — the whole defect class lives in conflating the two.
4. Any new `isPartial` reference must be justified as gating a **fetch or metric**, never a read.

## Binding on #1568 / #1569 / #1576 — checked at slice-review time

Every one of these three touches the Fresh route/partial surface. Each brief and each slice review
must confirm, explicitly:

1. **No `isPartial`-gated cache read or seed helper is introduced.** Not under the named offenders,
   and not under a new name. A helper whose *effect* is "skip the read because this is a partial" is
   the same defect regardless of what it is called.
2. **`{ data, cachedAt }` is returned unchanged.** No reshaping, no dropping `cachedAt` — it is the
   authoritative freshness signal the partial-hit decision depends on.
3. **Partial-hit and genuine partial-miss are tested as distinct cases.** One "partial" test proves
   nothing; the entire defect class is conflating the two.

**#1576 deserves particular attention.** Its symptom — `ctx.path` resolving to `{}`, `makeHref()`
throwing a missing path param, the client partial request returning 500 — sits on the same partial
path. A plausible-looking "fix" there is to short-circuit on `ctx.isPartial`, which would trade a
route-resolution bug for this cache-suppression bug. Reject that shape.

## The pinning gap, and where it went

Verified on `origin/main`: `decideDeferClientAction` has **zero** direct test assertions, and
`partial-miss` appears in exactly one test — `packages/fresh/tests/defer-island-client-bundle_test.ts:58`
— which is a **client-bundle content check**, not a policy assertion.

**Invert the two branches and that test still passes**, because the string remains present in the
bundle. The regression would be invisible to the suite while reproducing the EIS Chat #191 symptom.
The two exact assertions were therefore carried into **#1557** (2026-08-12), not into #1550 (closed
`NOT_PLANNED`, left alone) and not by broadening an active PR.
