# Design commission — Ledgerline component system

You are the design engineer for **Ledgerline**, a Stripe-class billing product built on NetScript
0.0.7. Your job is to build the product's **component system** to a standard that makes the app
recognisably its own on sight. You are not decorating a scaffold; you are extending a registry.

**Your worktree is `/home/agent/projects/netscript/wave7-design`, branch `design/ledgerline-ui`.**
Work only there. Another agent owns the main worktree — never touch it.

## The token identity already exists — build on it, do not redo it

`apps/ledgerline-web/assets/tokens.json` is the source and `tokens.css` is generated from it. The
identity is paper / ink / ledger-green / brass, with money and status tokens, tabular numerals and
green-tinted shadows, plus a distinct dark theme. **Read them first.** Every colour, radius, space
and shadow you use comes from a `--ns-*` token. If you need a value that does not exist, add a token
— never a hex literal, never a magic number.

## The bar, measured

`rickylabs/eis-chat` is a real shipped NetScript dashboard: **50 UI primitives, 18 composed blocks,
35 islands**, 44 per-component stylesheets and 18 per-surface stylesheets, **19 raw hex values across
16,734 lines of CSS**, and a `/design` gallery of 1,694 lines driven from a registry catalog and the
token manifest. Its charts are **hand-authored SVG over tokens** — no charting library — with
CSS-only hover so there is no hydration cost and no first-paint mismatch.

`CONSTRUCTION-REFERENCE.md` (attached) documents its patterns in detail. Read it before writing code.

## What to build

This is a finance product. The surfaces that need components: a **run console** (live progress,
per-item states, totals reconciling), **invoices** (line items, corrections, status timeline),
**customers**, **usage drill-down**, **webhook delivery log**, and **dashboard charts**.

1. **Extend the registry with project-tailored components.** Not generic re-skins — components that
   exist because *this* product needs them. Money cells with tabular numerals and sign treatment,
   invoice status badges across the full lifecycle, a run-progress meter, a per-item state row, a
   proration preview table, a dunning/retry timeline, a webhook delivery row with attempt history, a
   period selector, a reconciliation variance strip. Aim for **at least 12** genuinely new
   components, each with its own stylesheet under `assets/ui/` or `assets/blocks/`.
2. **Charts as hand-authored SVG over tokens.** The scaffold ships `chart-block` and `donut`; extend
   the family with what a billing dashboard needs — a billed-vs-collected area chart, a
   revenue-by-plan composed bar, a collection-rate radial, a sparkline for per-customer trend. Series
   colours come from a fixed token cycle so a series keeps its colour across renders. The chart never
   formats — values arrive preformatted. Carry the currency on the topmost tick only.
3. **Islands where interaction earns hydration**, and only there. Thin boundary, inner component does
   the work, data arrives as props. Filters are local state, never query keys.
4. **Register everything** in `apps/ledgerline-web/routes/(design)/design/(_shared)/registry.ts` and
   render it in `(_components)/components-view.tsx`, in the product skin. All three prior builds of
   this assignment shipped that file byte-identical — that is the fingerprint of a themed scaffold.
   Check `(_shared)/tokens.ts` `RAMP_ORDER` matches the real ramp names or a ramp silently vanishes
   from the gallery.
5. **Write `DESIGN.md` as a decision record with observable, testable rules** — not adjectives. Not
   "buttons should be clear" but rules that can fail, e.g. *"Destructive actions use Verb + Noun;
   never Confirm, OK, or a bare verb"*, *"A money value renders with tabular numerals and an explicit
   sign; absence is an em dash, never a zero"*. Name explicitly the generated-design patterns you
   refuse to ship. Given only prose, every model invents its own typography and spacing — that is the
   failure this prevents.
6. **Every reachable state gets a design**: draft, issued, paid, part-paid, failed, retrying,
   refunded, partially refunded, voided, in-flight, empty, loading, permission-denied. A component
   that only renders the happy path is unfinished. Absence is an em dash; a `0.00` where you meant
   "not measured" is a false statement about money.
7. **Light and dark both work**, driven purely by token role overrides. No component branches on
   theme.

## Rules

- **Ask the NetScript MCP before hand-rolling anything.** `deno run -A mcp-ask.ts . call find_guidance
  '{"intent":"..."}'` — see `AUDIT-HOWTO.md` (attached). Use `list_package_exports` on
  `@netscript/fresh-ui` to find what already exists before you build it. This build has already shipped
  four defects from not asking.
- **Customize through the seams**: the token source, `data-*` attributes a component already emits, a
  `class` prop merged by `cn()`, and per-surface CSS imported after the component file. **Never fork a
  component, never a parallel stylesheet, never `!important`.**
- Export every new component from `apps/ledgerline-web/components/ui/mod.ts` — a component missing
  from the barrel is invisible to the gallery.
- Commit frequently with clear messages. Do not push; I will review and merge.

Report at the end: components added, charts added, islands added, registry entries, and the
`DESIGN.md` rules you wrote.

## Owner authorisation — you may revamp the design system wholesale

If you have a materially better proposal than the existing paper/ink/ledger-green/brass identity,
**you are authorised to replace it outright** — ramps, scales, type, the lot. Do not treat the
current token source as fixed. The only constraints are that it stays token-driven (no hex literals
outside the token source, no magic numbers), that light and dark both work through role overrides,
and that `tokens.json` remains the source with `tokens.css` generated from it.

Judge it on one question: does a screenshot of this product look like *this product*, or like a
themed scaffold? If a revamp gets you further from the scaffold, do the revamp. Say plainly in your
report what you changed and why, so the decision is on the record rather than implied.

Ambition is the point here. Extend the registry hard — widgets, charts, composed blocks, islands —
the way eis-chat did, until the component system is the product's own vocabulary rather than a
re-skin of the starter set.

## The governing principle — composition, not customization

NetScript ships **primitives**. Customizing them is the floor, not the goal. The point is to compose
those primitives into **tailored, interactive widgets that do one specific job in this product** —
and then compose those into surfaces.

Three levels, and most builds never leave the first:

1. **Primitive** — `Button`, `Panel`, `Badge`, `DataGrid`. Customized through tokens and `data-*`.
2. **Tailored component** — a thing that exists only because Ledgerline exists. A money cell that
   knows sign, currency and "not measured". An invoice status badge that knows the whole lifecycle.
   A proration preview that shows the arithmetic. A retry timeline that shows attempts and the next
   scheduled one.
3. **Interactive widget / island** — a composed surface with real behaviour: a run console that
   streams and lets an operator approve or exclude items inline; a usage drill-down that filters
   client-side over one warm cache entry; a delivery log that replays a webhook and shows the new
   attempt appear; an invoice timeline that expands a correction chain.

**Do not stop at the seam.** A seam correctly used is table stakes. Build the composable vocabulary
on top: components that take other components, slots and `children` where that is the right shape,
compound components where a group shares state, and islands that hydrate only the interactive leaf.

Aim for a system where building the next billing screen is mostly *assembling your own vocabulary*,
not reaching for primitives again. That is what makes eis-chat feel like a product: 50 primitives,
18 composed blocks, 35 islands — the blocks and islands are where the product lives.
