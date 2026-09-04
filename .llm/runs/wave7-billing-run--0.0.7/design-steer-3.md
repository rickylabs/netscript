# Design steer #3 — the bar just moved. Read DESIGN-AMBITION.md first.

The owner saw the product and called the design **"absolutely hideous"** and **"multiple leagues
behind"**. Important context so you calibrate correctly: **he was looking at the build tree, which
had none of your work merged into it.** Your 46 components and all five widgets existed only on this
branch. That was a coordination failure on my side, not a verdict on your components.

But the new bar is real and it is higher than anything asked so far:

> **"I want a SaaS product that looks BETTER than Stripe."**

Not competitive with. Better. `DESIGN-AMBITION.md` (attached) says what that means concretely and
where Stripe is actually beatable — it is weak on *in-between* states, and this product is entirely
about a run that advances over time. That is the opening.

## What to do now

1. **Assume your components are about to be merged into the build tree.** They are. Stop building in
   isolation and start making them look like a product.
2. **Compose real surfaces, not a gallery.** The gallery proves the vocabulary exists. It does not
   prove the product looks good. Build the actual screen compositions — run console, invoice detail,
   overview — as composed blocks under `components/blocks/`, so the build lane can drop them in.
3. **One card anatomy, everywhere.** Header with glyph + title and an action affordance on the right,
   optional segmented control, hero metric roughly 3× the label with a delta chip beside it, body
   visualisation, then footer columns or a full-width CTA. Every card in the owner's reference sheets
   obeys this. **That consistency is the polish** — it is what makes eight different widgets read as
   one product.
4. **Nothing renders bare.** A screen without the app shell — nav, breadcrumb, theme toggle — reads
   as broken, and that is literally what the owner saw. Make the shell unavoidable.
5. **Design the in-between states properly**, because that is where you beat Stripe: retrying,
   part-paid, partially refunded, in-flight, reconciling, provisional-vs-settled. Stripe shows a
   zero; you show the truth, and in finance that reads as confidence.
6. **Commit to the identity completely.** Paper, ink, ledger-green, brass. Distinctive display type
   where it earns attention, real elevation, generous radii, the green-tinted shadow. **A screenshot
   with the logo cropped out should still be identifiable as this product.**
7. **Motion where it means something** — the gauge fills, a row resolves, a total counts up. Never
   decorative.

## The test

Put your run console beside Stripe's billing dashboard. A stranger should prefer yours and be able to
say why in one sentence. If the honest answer is "Stripe looks more finished", keep going.

Commit frequently. I merge to the build lane continuously from now on, so nothing sits unmerged
again.
