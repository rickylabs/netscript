# The bar is not "a good scaffold". It is: better than Stripe.

Owner verdict, verbatim: *"I want a SaaS product that looks BETTER than Stripe. We're not there yet."*

Read that literally. Not "competitive with". Not "clean and professional". **Better.** That is the
standard every remaining design decision is measured against.

## What "better than Stripe" actually means

Stripe's dashboard is very good at three things, and beatable on all three because its constraints
are not yours.

1. **Density with calm.** Stripe puts a lot on screen without it feeling loud: quiet greys, one
   accent, generous line-height, hairline rules instead of boxes. Where it loses is *sameness* —
   every screen is the same table in the same shell. **You can beat it by making each surface look
   like the job it does**, while the token layer keeps them one family.
2. **Numbers you trust on sight.** Tabular figures, aligned decimals, currency always present,
   deltas as small tinted chips. **Match this exactly — it is table stakes, not an advantage.**
   Anything less and the product reads as a toy regardless of the rest.
3. **State legibility.** Every object carries an unambiguous status. Where Stripe is weak is
   *in-between* states — retrying, partially refunded, in-flight, reconciling. **This product is
   about a run that advances over time. That is the opening.** Make the passage of state beautiful
   and Stripe has nothing equivalent.

## Where you beat it

- **The run as a live object.** Stripe has no billing-run object at all. A live console with a
  gauge filling, items resolving one by one, totals reconciling in place, two tabs in sync — that is
  a screen Stripe cannot show. **Make it the hero and make it move.**
- **Evidence on the surface.** Drill from a number to the events that produced it. Show *why* an
  invoice is what it is, inline, not in a support ticket.
- **Honest absence.** An em dash for not-measured, a labelled unavailable frame for a failed read,
  provisional versus settled on every figure. Stripe shows zeros. **You show the truth**, and in
  finance that reads as confidence.
- **A real identity.** Stripe is purple-on-white because it is infrastructure for everyone. You are
  one product with a point of view: paper, ink, ledger-green, brass. **Commit to it completely** —
  serif or distinctive display type where it earns attention, real elevation, generous radii,
  green-tinted shadow. A screenshot should be identifiable with the logo cropped out.

## The non-negotiables

1. **One card anatomy everywhere**: header (glyph + title, action affordance right) → optional
   segmented control → hero metric ~3× the label with a delta chip beside it → body visualisation →
   footer columns or a full-width CTA. Every reference card obeys it. That consistency *is* the
   polish.
2. **Nothing renders bare.** Every product screen sits inside the app shell with nav, breadcrumb and
   theme toggle. A page that renders without chrome reads as broken — and it is what the owner saw.
3. **No default-looking chrome anywhere.** If a control looks like an unstyled browser default, it
   is a defect.
4. **Every reachable state designed**: draft, issued, paid, part-paid, failed, retrying, refunded,
   partially refunded, voided, in-flight, empty, loading, permission-denied. Empty and loading are
   *designed states*, not absences — a skeleton that matches the settled layout, an empty frame with
   a reason and an action.
5. **Light and dark are two designs**, not an inversion. Both must look deliberate.
6. **Motion where it means something**: the gauge fills, a row resolves, a total counts up. Never
   decorative.

## How to know you are there

Put a screenshot of your run console beside a screenshot of Stripe's billing dashboard.
**A stranger should prefer yours** — and should be able to say why in one sentence.

If the honest answer is "Stripe's looks more finished", keep going. That is the bar.
