# Product definition — Ledgerline
*From the product owner. I own the what and why; you own the how.*

## Your thesis is ratified

I ran an independent market study before reading yours. You landed on the strongest finding in the
category, and I am accepting it as the product spine:

> **No billing product has a first-class run object you can inspect, pause and resume.**

Verified against primary docs: Stripe has no `billing_run` object, endpoint, status or event type
anywhere in its API — billing is strictly per-subscription-anchor. Chargebee, Recurly, Orb,
Metronome and Lago have none either. **Zuora is the only vendor with a named `Bill Run`** — a
2007-era enterprise product — and even there *"bill runs still processing cannot be canceled."*

Two things from Zuora you should deliberately copy, because they are right and nobody modern has:
- **`Completed` ≠ issued.** Compute and commit are separate operator actions. Your draft → compute →
  review → issue already has this shape. Hold it.
- Cancellability is state-dependent, and saying so honestly beats pretending everything is abortable.

The only public evidence about half-completed runs is *fear*, not postmortems — one engineer:
*"the thought of leaving the office knowing some batch job is going to run at 3am and the next
morning might be total chaos."* **The pain is unarticulated and therefore unserved. That is your
opening.**

## Who this is for

A finance operator closing a month. Their job is **not** "run billing" — it is *establishing that a
period is finished and that the number is defensible*. Industry median close is **6.4 calendar
days** (APQC, n=2,300), and most of that is *waiting on upstream systems*, not calculating. **94% of
finance teams still do this in Excel; 50% say Excel is why the close is slow.**

Their four anxieties, in order: *Did usage stop arriving? Is this invoice wrong, and can I still fix
it? Do my systems agree? Can I say what has been charged and what has not?*

## P0 — non-negotiable. Without these there is no product.

1. **The run object**, as you scoped it: persisted, resumable, per-invoice step state, restart with
   zero double-issuance. Compute materializes the full plan before any money moves.
2. **A dry run that produces the exact same artifacts without issuing.** This is the feature that
   makes the 3am fear go away. Do not skip it.
3. **Grace period as a *named state*, not a timer.** Metronome models it explicitly; Orb splits
   "grace period not passed" (Draft) from "passed, safe to issue" (Action Needed) from "submitted,
   finalizing" (Pending Issue). **Make the state machine the operator's work queue.** For reference,
   defaults in the wild: Stripe 1h (max 72h), Orb 12h, Metronome 24h, Chargebee 10min–50d.
4. **Never silently drop a billable event.** Every late, out-of-window, unmatched or dropped event
   lands in a visible quarantine with a reason code and a resolution action. This is the sharpest
   competitive wedge in the whole study: Stripe's own docs admit that when a price changed mid-cycle,
   usage in the grace period appears on *"neither the current nor subsequent invoices"* — silent
   revenue loss, no error, no event. Twilio wrote the rule after its 2013 incident: *"it failed
   dangerously."* **Fail loudly on ambiguity.**
5. **Settled vs provisional on every number the operator sees**, with the reason and expected settle
   time. The failure this prevents is real and documented: Metronome freezes the invoice but its
   breakdowns keep updating — two sources of truth for one period. Nobody surfaces freshness *on the
   number*. Stigg's `isFallback` proves the pattern works in an adjacent category.
6. **Correction that preserves invoice identity and date.** Stripe *structurally excludes* the
   invoices that need it most: *"Invoices attached to a subscription cannot be revised"*, nor ones
   carrying prorations, nor ones with credit notes. A named operator on the damage: *"if I had to
   void an invoice and recreate it, I'd lose the original invoice date entirely, which made
   reconciliation a mess."* Corrections must be a **versioned chain on a stable identity**, each
   link reason-coded, the original immutable and retrievable, rendering as one timeline.
7. **Terminal compensation.** A refund or a failed multi-step operation must reach a *terminal*
   compensated state and be provable as such. **No prior build in this series has ever proved this** —
   one left a saga stuck `compensating` forever. This is the single most differentiating piece of
   runtime evidence you can produce.

## P1 — what makes it feel like a product rather than a schema

8. **Event-to-invoice lineage.** Drill from any line item to the events that produced it and the
   configuration that applied. This is the most-cited operator need — *"why is this number what it
   is"* — and today it means emailing a data engineer.
9. **Reconciliation *explanation*, not detection.** Everyone says "these don't match" and stops.
   Decompose every gap into named buckets — fee, refund, disputed principal, dispute fee, payout
   cutoff timing, FX drift, unapplied cash — and prove the residual is zero. A practitioner's test:
   *"gross minus fees minus refunds minus disputed amount minus dispute fee minus anything past the
   cutoff should equal the deposit, to the cent."* Note dispute cost is **two lines, not one**.
10. **Unbilled revenue as a live surface**, not a post-close report. It is literally the operator's
    question. Stripe names the account but only exposes it after close.
11. **One timeline per customer-period** — plan changes, accrual, prorations, draft transitions,
    issuance, payment attempts with decline codes, dunning, corrections, refunds — each entry
    carrying actor (`user` vs `api_key`), both timestamps, and the monetary delta.
12. **Bitemporal by construction**: `effective_at` vs `recorded_at` on everything. This single choice
    answers the operator need, the audit need and the restatement need at once.

## Explicit non-goals — do not spend the night here

- **No tax engine.** Stub it honestly and say so.
- **No real payment processor.** Simulate, but simulate *honestly*: model decline codes, and
  distinguish hard declines from soft. Note the real constraint if you model retries — a European
  acquirer forbids reattempting a declined transaction *15 or more times in 30 days*, and Stripe's
  recommended default is 8 attempts over 2 weeks.
- **No ASC 606 SSP allocation.** Even Stripe does not do it (*"each invoice line item as its own
  performance obligation"*). Out of scope; say so rather than faking it.
- **No multi-entity, no consolidation, no ERP sync.**
- **Breadth of entities is not the goal.** A tenth entity is worth less than a proved compensation.

## Acceptance — how I will judge it

I will not accept a claim I can falsify with `git diff`, a green test, or a screenshot.

1. A run that **dies mid-flight and resumes** without double-issuing, proved by a persisted state
   transition — not a passing test.
2. A **refund whose compensation reaches a terminal state**, proved by a correlated trace that would
   look different if the saga were removed.
3. A **correction chain** where the original invoice's date and number survive.
4. **A quarantined event** with a reason code, and the operator action that resolves it.
5. **Two tabs, one screen, no reload** — captured.
6. Every number on the close screen declaring **settled or provisional**.
7. The bars in `beat-this.md` — especially: token source *and* JSON rewritten, your own components
   registered in the gallery, zero type escapes, and every reachable state designed.

Depth over breadth, always. If you must cut, cut entities and screens. Never cut the behaviour that
makes this worth building.
