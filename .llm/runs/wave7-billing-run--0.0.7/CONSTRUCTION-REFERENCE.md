# How a real NetScript dashboard is built — extracted from `rickylabs/eis-chat`

898 commits, one human plus agents. Its domain is irrelevant to you; its **construction** is the
point. Everything here is quoted from that repo. Copy the shapes.

## 1. A route module is a composition root, and it is small

Median page route module: **62 lines**. The whole distribution: 37, 44, 45, 52, 52, 56, 62, 64, 68,
73, 88, 104, 142, 275 — against a 191-file `lib/`, 68 components and 35 islands.

A route module contains only `withRoute` / `withResource` / `withLayer` / `withLayout` / `withMeta`.
Deliberately kept **out**: service calls (loaders call `lib/` functions), JSX beyond the layout,
param validation (goes to `_middleware.ts`), error branching (goes to the region's `Failed`), URL
construction (goes through a hand-curated `appRoutes` facade over the generated routes).

## 2. Split a screen into layers by cost profile, cheapest first

The `/usage` page — your closest analogue — is three layers over **one** shared resource read, so
decomposing costs zero extra round trips:

- `head` — blocking, no I/O, route identity paints immediately
- `summary` — cache-first top cards, own partial, own stale window
- `analytics` — the deferred island carrying the cube, charts and table

Each layer: `{ loader, partial, partialName, fallback, staleTime, staleReloadMode: 'background' }`.
For billing: invoice header / balance summary / transaction cube.

## 3. Define each deferred region ONCE as a `{Settled, Fallback, Failed}` triple

```tsx
export const transcriptRegion = defineRegion('transcript', SessionView, TranscriptSkeleton, TranscriptFailure);
```

The page and its partial import the *same* triple. The factory also emits the a11y + test contract:

```tsx
<div data-region={name} data-region-settled={String(settled)}
     aria-busy={settled ? undefined : 'true'}
     role={settled ? undefined : 'status'}>
```

That `data-region-settled` pair is what a skeleton-fidelity gate later keys off. Design it in now.

## 4. The cache discipline — the single most transferable rule

**Page loaders read cache only. Partials do authoritative I/O. A cache read never throws. A failed
authoritative read returns `status: 'unavailable'` as DATA, not an exception.**

```ts
/** Cache failures degrade to a diagnosed miss; authoritative reads still throw. */
export async function readOrMiss<T>(label: string, read: () => Promise<T | null>) {
  try { return await read(); }
  catch (error) { /* diagnose once per label */ return null; }
}
```

Why it matters, in their words: a failed read rendered as an exception turns *"an ordinary first
load into what looks like a broken page"*, and it stops *"a transient failure being rendered as
'you have no usage'"*. **Degrade the expensive half, never the cheap one** — if the rollup fails but
the registry read succeeded, still return the registry.

Also: refuse a cache hit that is semantically stale. Their rule — a session whose last message is
not an assistant tail must load the partial, so run state cannot hide behind a valid cache hit.
**Your equivalent: an invoice whose last event is `payment_intent.processing`.**

## 5. Two-tier invalidation, behind two named functions

```ts
export async function invalidateRead<TInput>(action: ExactRead<TInput>, input: TInput) {
  await invalidateServerQueryCache(action.key(input) as ServerKey);   // exact SERVER key
  await invalidateClient(action);                                     // clientKey() PREFIX
}
export async function invalidateReadPrefix(action: ClientPrefix) { … }
```

26 lines that delete a whole class of "the list didn't refresh" bugs. Their law:
**"Use `clientKey()` only as a client prefix. It is never a server cache key."**

And seed TanStack honestly — only when the real production time is known:

```ts
export function authoritativeQuerySeed<T>(initialData: T | undefined, cachedAt: number | undefined) {
  return initialData === undefined || cachedAt === undefined
    ? {} : { initialData, initialDataUpdatedAt: cachedAt };
}
```

## 6. Islands stay small because data arrives as props

13 of 35 islands are ≤100 lines. The boundary is always two lines:

```tsx
export default function UsagePanel(props) { return <QueryIsland><UsagePanelInner {...props} /></QueryIsland>; }
```

The canonical whole island is 102 lines: optimistic set, revert on error, two-tier invalidate on
success, and **no success toast** — *"the pressed state IS the confirmation"*.

**Filters are local component state, never query keys.** They are projections over data already on
the page, so no filter combination can fragment the one warm cache entry. Use `'all'` as the
sentinel, never `''` — an empty string is the falsy value that silently turns an exact key into a
prefix.

## 7. Live state: the stream contract is a module both sides import

Never redefine the schema on the client — reuse the producer's, so it cannot drift. The island
subscribes with a StreamDB live query and **always keeps the server seed as fallback**:

```tsx
const entries = live.length ? live : shared;   // prefer live once it materializes
```

Two more things they learned the hard way:
- **Prepare the stream in the loader, not on mount.** On a brand-new entity the producer has not
  written yet, so the client read 404s and does not retry — the first turn stalls until a refresh.
  Ensure the stream exists and resolve the read offset server-side.
- **A stream carries one entity; adjacent caches still need invalidating.** Their import created a
  channel, and the share stream said nothing about the catalog.

Cross-island coordination is a module-level signal, not a context provider or an event bus.

## 8. Charts and dense data — no charting library

Hand-authored SVG over tokens: `area-chart` 204 lines, `chart-block` 329, `composed-bar-chart` 193,
`radial-chart` 128, `donut` 127. Hover is CSS, not JS — *"no hydration cost and no first-paint
mismatch"*. **The chart never formats**; values arrive preformatted.

Editorial rules worth stealing verbatim:
- The series colour cycle is fixed so a provider keeps its colour across renders.
- Carry the currency on the topmost tick only — *"repeating a currency code down every tick is five
  copies of a fact the reader learned from the first one"*.
- Recency first in an audit trail — *"leading with the channel made the reader scan sideways for the
  one fact that orders the whole table"*.
- The audit-trail card has **no** headline figure: *"its whole content is the evidence, and a big
  number on top of it would be decoration"*. It scrolls inside its own panel so hundreds of rows
  cannot size the page.

**Absence renders as an em dash, never a zero.** In billing this is correctness, not polish — a
`0.00` where you meant "not measured" is a false statement about money. Encode it so it cannot be
forgotten at a call site: helpers return `null` when the denominator cannot support a ratio, and a
failed read renders a labelled unavailable frame rather than five zeros.

**Declare dense-surface geometry once in TypeScript**, consume it from the island, the skeleton and
the CSS, and test that all three agree. Widget names live in one `as const` array; the CSS places
`[data-widget='…']` into named grid areas with **explicit row heights** (they tried height-quantised
bento with `grid-auto-rows: minmax(10rem, auto)` and it did not quantise anything — same declared
span rendered at 511, 431, 347, 306 and 170px).

## 9. The design system as files

```
assets/tokens.css     248 lines — the ONLY place a hex literal lives
assets/tokens.json   generated manifest, 156 tokens
assets/styles.css    the ordered import manifest, with cascade order annotated
assets/ui/           44 files — one per component
assets/blocks/       18 files — one per SURFACE
```

65 stylesheets, 16,734 lines, **19 raw hex values outside the token file**. Dark mode is 35 role
overrides under `[data-theme='dark']`; components never branch on theme. Derived states use
`color-mix()`, never a new hex.

**An override is expressed three ways, in order of preference**, and never by forking a component:
1. a `data-*` attribute the component already emits (`data-widget`, `data-priority`, `data-align`);
2. a `class` prop merged last by `cn()`;
3. a per-surface block file imported *after* the component file, with the cascade order commented.

No `!important`, no forked copies, no per-surface variants bolted onto the primitive's union.

**The gallery is generated from data**: a `registryCatalog` array plus a token manifest reader that
imposes `RAMP_ORDER` / `INTENT_ORDER` / `FOUNDATION_ORDER`. Counts are quoted from the manifest,
never typed by hand. Add a product component to the catalog and it appears in the gallery.

## 10. How the project GROWS — the RFC loop

```
docs/architecture/   PRESENT TENSE — what is implemented now (+ 4 machine-readable JSON inventories)
docs/rfcs/           PROPOSED CHANGE — numbered
docs/adr/            ACCEPTED BOUNDARY — append-only
docs/plans/          ORDERED DELIVERY — phases, DoD, completion gates
docs/audits/         MEASURED CURRENT STATE — findings tables with severities
```

An **ADR fixes a boundary**; an **RFC designs a change**. Architecture docs describe what *is*; RFCs
describe what *will be*.

Every RFC carries the same sections. Three are unusual and worth copying wholesale:
- **`## NetScript version feasibility`** — separates *"we can't yet"* from *"we haven't yet"*, naming
  the upstream issue that gates each.
- **`### Scoped sub-issues`** — the RFC ships the issue tracker: a table of Slice | Dependencies |
  Issue title | Scope and acceptance.
- **`## Adversarial review record`** — a *different model* reviews the RFC read-only before
  acceptance, and the verdict, findings and dispositions are minuted. A FAIL blocks acceptance.

The cycle: **audit** (measured findings + severities) → **RFC** → **adversarial review** → **plan**
(phases; gates land in Phase 1, one vertical proves the shape in Phase 3, parallelise in Phase 4) →
**S0 slice writes the inventory + the gate that reads it** → **burn-down slices delete a seam and
its ledger row together** → **CI step** → **architecture doc rewritten in present tense**.

The enforcement trick: **hardcode the frozen set in the checker, not the JSON**, so editing the
ledger alone cannot add an exception. Their gate also fails when a listed allowance *disappears*
without its row being removed. And they test the gate's own failure modes.

## Three things to avoid — their scars, not mine

1. **Do not let the debt ledger become the architecture.** Their gate passes today only by freezing
   11 raw-fetch islands and 18 direct client calls. Their own RFC says the allowlist *"is a burn-down
   ledger, not an accepted architecture"* and that keeping it forever *"makes the architecture gate
   cosmetic"*. If you start a ledger, start the slice that empties it.
2. **Do not duplicate a layout system, and never indirect a width through a custom property.** A
   shared surface grid had to be extracted *after* the fact and the original page never adopted it.
   A related bug — two independent width declarations on the same element in two stylesheets,
   neither overriding the other — *"cost a day"*.
3. **Do not put anything server-only on a module the client bundle can reach. `deno check` will not
   catch it.** A KV-backed settings store dragged node built-ins into the browser bundle; only the
   client build caught it. The same class of bug produced a hydration teardown with a clean
   type-check, green unit tests and correct SSR HTML — and a blank page. Draw the server-only
   boundary at route and partial modules from day one.
