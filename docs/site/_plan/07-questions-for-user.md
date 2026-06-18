# Questions to Lock Before Authoring

Crisp decisions needed to lock **tone**, **content themes**, and **market positioning**. Grouped;
each has a recommended default so you can simply confirm or redirect. Phase 1 authoring (landing +
why) is blocked on Q1–Q5.

## Positioning & messaging
- **Q1 — Hero one-liner.** Three candidates in the positioning brief (A capability-led, B
  contract-led, C outcome-led). Which register do you want the *first sentence* to carry?
  *Recommended default: C (outcome-led) for the hero, with B (contract-led) as the sub-headline.*
- **Q2 — Tone.** Confirm "confident, precise, engineering-credible; TanStack-style honesty + Astro
  warmth; no hype adjectives, no internal doctrine vocab in marketing surfaces." Anything to add or
  forbid (e.g. humor, first-person "we", emoji)?
- **Q3 — Primary audience.** Confirm the primary persona = product/full-stack TS engineer at a
  small-to-mid team/agency building durable systems. Is there a stronger target we should lead with
  (e.g. platform/infra teams standardizing internal services)?
- **Q4 — Competitive framing.** On the "Why" page, do we **name competitors** (NestJS, Encore, tRPC+
  stack, Temporal, Hono-alone) or compare only to "assembling it yourself"?
  *Recommended default: compare to self-assembly; mention named tools only as "NetScript wraps/!=" in
  a single honest table.* Are there frameworks you explicitly want positioned against or away from?
- **Q5 — Maturity claims.** What can we truthfully promise publicly right now — production-ready?
  beta? "JSR-readiness push"? This governs how strong the landing language can be and whether we add a
  status/badge. Is there a version/stability statement to display?

## Content themes & scope
- **Q6 — Durable workflows as the headline differentiator?** Sagas/triggers/streams are the most
  unusual capability. Do you want them foregrounded as *the* reason to choose NetScript, or kept
  co-equal with the services/contracts story? *Default: co-headline with contract-first.*
- **Q7 — Aspire emphasis.** Aspire orchestration is distinctive but ties users to .NET tooling. How
  prominent should it be — a top USP, or a "nice default you can opt out of (`--no-aspire`)"? This
  affects whether the hero mentions it and how the audience perceives setup weight.
- **Q8 — "Own your UI" (copy-source fresh-ui).** Is the design-system / copy-source UI a marketing
  pillar (shadcn-style "the code is yours") or a secondary convenience? *Default: a named USP card,
  not hero-level.*
- **Q9 — Recipes/Blueprints lane.** Do you want a Medusa-style "production blueprint" lane later
  (a full webhook→job→saga→stream example app), beyond Diátaxis how-tos? Yes/no/wave-2.
- **Q10 — Tutorial depth.** Confirm the 4-tutorial core track (workspace → service → jobs → workflow)
  with webhook as wave-2. Any capability you'd swap into the core 4?

## Engine & process
- **Q11 — Authoring format.** Approve the **hybrid** (Markdown + GitHub-callout shim for prose; `.vto`
  for landing/why/hubs)? Or do you want everything in one format for consistency?
- **Q12 — "Edit this page" + community links.** Add GitHub edit links and a footer with GitHub/JSR/
  (Discord?) links? Is there a community channel to point at?
- **Q13 — Phasing/ownership.** Should this branch produce the **full rebuild** across phases, or only
  Phase 0–1 (components + front door) for review before committing to the long tail? Who authors the
  body content — this agent, or a handoff (WSL Codex / OpenHands) per the harness lane rules?
- **Q14 — Domain naming.** Confirm the 9 capability-hub names (intent-named) vs. keeping package
  names. Any house terminology you prefer ("background jobs" vs "workers"; "durable workflows" vs
  "sagas") for the public-facing labels?
