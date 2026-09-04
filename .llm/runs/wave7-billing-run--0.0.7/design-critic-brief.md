# Design critic — vision pass on Ledgerline

You are a design critic with **eyes**. The design lane runs on a text-only model, so you are the only
agent in this build that can actually look at anything. Work READ-ONLY. Do not edit code.

## Look at these first — they are the authority

- `/home/agent/projects/netscript/wave7-design/design-references/finance-3.png`
- `/home/agent/projects/netscript/wave7-design/design-references/marketing-3.png`

**Open them with the Read tool.** They are the owner-supplied quality bar: eight fintech and
analytics widget cards. Then read `DESIGN-REFERENCES.md` in the same directory — my written
transcription — and **correct it**. I wrote it from memory of the rendered images; you can see the
originals. Anything I got wrong or missed is a defect in the brief the design agent is working from,
so say so explicitly.

## Then judge the build against them

The product is Ledgerline, a Stripe-class billing app. Two worktrees:
- `/home/agent/projects/netscript/wave7-design` — the design lane (branch `design/ledgerline-ui`)
- `/home/agent/projects/netscript/wave7-billing` — the main build

Read the token source (`apps/ledgerline-web/assets/tokens.css` and `tokens.json`), the component
library (`apps/ledgerline-web/components/`), the product components, and the `/design` gallery
(`routes/(design)/design/**`). Judge the **rendered result you can infer from the source**, and be
concrete about what a screenshot would look like.

Answer these, each with file evidence:

1. **Does the token identity hold up next to the references?** Compare ramp structure, contrast,
   radius scale, shadow treatment, type scale. The references are light-ground with generous
   whitespace, large radii and soft shadows. Is Ledgerline's identity as confident and as coherent,
   or does it read as a recoloured scaffold?
2. **Card anatomy.** The references use one consistent grammar: header glyph + title, an action
   affordance top-right, a hero metric roughly 3× the label with a tinted delta chip, a body
   visualisation, then a footer strip or full-width CTA. Do Ledgerline's components compose into that
   grammar, or is each surface improvising?
3. **The widget vocabulary.** The references imply specific reusable pieces: delta chip, segmented
   range control, two-tone semicircular gauge, segmented share bar with inline dot legend, metric
   list with directional deltas, chart crosshair + dark pointer tooltip, equal footer columns with
   hairline dividers, avatar-chip row with pager. **Which of these exist in Ledgerline, which are
   missing, and which are the highest value for a billing product?**
4. **Charts.** The references show an area chart with a translucent comparison layer, a bar chart with
   values printed inside the bars, a line chart with a hover readout, and a gauge. Ledgerline must
   hand-author SVG over tokens — no chart library. Assess what exists and what a billing dashboard
   still needs.
5. **Density and hierarchy.** The references get density from typographic hierarchy, not cramming. Is
   Ledgerline's hierarchy strong enough that the hero number dominates?
6. **Money rendering.** Tabular numerals, explicit currency, em dash for not-measured, never a
   fabricated zero. Verify against the actual components.
7. **Dark mode.** The references are light-only. Ledgerline must do both through role overrides.
   Judge whether the dark palette is a genuine second design or an inversion.

## Output

A prioritised critique the design agent can act on directly. For each item: what the reference does,
what Ledgerline does (`file:line`), the specific change. Rank by visual impact — what most makes the
product look like a themed scaffold rather than its own product.

Finish with **"The five components to build next"**, argued from the references, each with the
billing surface it serves.

Be specific and visual. Vague praise is useless; the design agent cannot see, so your words are its
only access to these images.
