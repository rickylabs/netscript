# PRIORITY 0 — the "broken screen" is a one-line authorizer bug, not design

The owner saw the screenshots and called the product broken. He was right, and the cause is not the
UI. **Every request to `runs` and `webhooks` returns 403**, so those screens can only ever render
permission-denied boxes.

The differential proves it — `billing` nests its contract and its screens render real data:

```ts
// services/billing/src/auth.ts:71   ← WORKS
export const authorizer = createContractAuthorizer({ v1: { billing: BillingContractV1 } });

// services/runs/src/auth.ts:46      ← 403s on every call
export const authorizer = createContractAuthorizer(RunsContractV1);

// services/webhooks/src/auth.ts:46  ← 403s on every call
export const authorizer = createContractAuthorizer(WebhooksContractV1);
```

The web client calls `/api/rpc/v1/runs/*`, so the authorizer's contract shape must mirror that mount.
Fix both to `{ v1: { runs: RunsContractV1 } }` and `{ v1: { webhooks: WebhooksContractV1 } }`, restart,
and confirm a real 200 with data — then verify the negative cases still deny (401 unauthenticated,
403 wrong scope). **Do not weaken the guard to make the screen render.**

This is why the run console — the product's entire thesis — shows three identical grey boxes.

# PRIORITY 1 — then merge the design lane (see steer-merge.md) and compose the run console

An independent UX study against eis-chat and the owner's reference sheets returned a full spec. The
short version of what is wrong beyond the 403:

- **No page has a header.** No title, no lede, no primary action — every screen drops you straight
  onto a data card. eis-chat renders a blocking header layer before any fetch.
- **No breadcrumbs anywhere**, so `/runs/[id]` gives no sense of place.
- **One grey notice for every situation** — denied, unavailable and empty all render identically, so
  three different problems look like one alarm repeated three times.
- **No hero metric anywhere in the product.** Every number is the same size, weight and colour.
- **The status filter is nine bare text links** with no active state — functionally a filter,
  visually not one.
- **Money is left-aligned and inconsistently formatted** (`$179.472` beside `$199.00`) because
  `money-text.tsx` still reimplements formatting instead of using `lib/money.ts`.
- **Every screen is the same stack of equal-weight boxes**, so a customer profile, a run summary and
  an invoice are visually indistinguishable.

## The one screen to get right first — the run console

Compose it from components that already exist on the design branch:

- **Page header**: `run` badge + the period as the large heading (`Aug 1 → Sep 1, 2026`), run id small
  and mono beneath, lifecycle `StatusBadge` inline.
- **Hero widget** (`WidgetCard`): header band with glyph + "Run progress" left and one pill action
  right · hero band with `SemicircularGauge`, two-tone arc, flat baseline caps, centre showing a
  quiet uppercase `ISSUED` over the large tabular total · a `DeltaChip` beside it versus the prior
  run, **omitted entirely if not measured — never a fabricated 0%** · footer band with
  `FooterColumns`: Approved / Excepted / Excluded, equal columns, hairline dividers.
- **Actions in their own register** — a `Panel`, not another grey card, with explanatory text quiet
  and the buttons in an action slot. A disabled button carries a `title` saying *why*.
- **Live transitions as a real activity feed** with a heading and timestamped rows — not two orphaned
  `ISSUING` badges floating beside an empty card.

The bar is `DESIGN-AMBITION.md`: better than Stripe. Fix the 403 first — no amount of polish rescues
a screen that can only render an error.
