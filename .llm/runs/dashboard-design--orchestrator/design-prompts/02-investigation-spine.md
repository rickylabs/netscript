# P2 — Investigation Spine: Correlation Journey + Run Inspector

**Revamp the Live Flow and Run Inspector surfaces of the NetScript Dev Dashboard using the
published "NS One" design system**, inside the P1 shell (sidebar, breadcrumbs, ⌘K, locked
routes). This prompt produces four screens: `/flow`, `/flow/:correlationId`, `/runs`,
`/runs/:correlationId` — plus the "Open correlation journey" affordance every entity screen
carries. FINAL product framing: no beta prose, no fidelity disclaimers (delete the current
"flow assembled by correlation join — boundary events land in …" notice entirely; the design
assumes full-fidelity seam events).

**DX thesis:** one correlation id is the product's investigation home. "What did this request
cause, and where did it stop?" has an ADDRESS: `/flow/ch_3QK9dR2eZ` is shareable, refreshable,
and reachable from every entity that carries the id.

## `/flow` — live journey list

Three-zone console. Left rail: live flow list (SSE), newest first — method+route mono, primitive
count chips (⚡ trigger · ⛓ saga · ⚙ job · ≋ stream), status dot, relative time, correlation
short-id; `?route=`, `?status=running|halted|failed`, `?follow=1` all in the URL; paused
following shows the "N new flows" catch-up pill. Selecting navigates to `/flow/:correlationId`
(real navigation — Back returns to the filtered list). Empty state: "Hit an endpoint to see its
journey" with a mono `curl` example.

## `/flow/:correlationId` — ★ the causal journey (flagship)

**HARD CONSTRAINT — not a trace waterfall:** no span bars, no time-proportional widths, no log
tail. A causal, semantic seam chain; the moment raw timing matters, out-link "View raw trace in
Aspire ↗".

- **Center — the seam chain** (`ns-journey`): `HTTP POST /webhooks/stripe · 200` → `TRIGGER
  webhook.payment · evt_2210 · PROCESSED · 2 actions` → `SAGA PaymentWebhookSaga ·
  COMPENSATING STEP 2` → `WORKER job reserve-inventory · ATTEMPT 2 OF 3 · RETRYING` → `STREAM
  payment-events · 2/3 DELIVERED · 1 FAILED`. Each node: primitive badge, mono name, status,
  expandable payload-at-seam, and a deep-link INTO the owning entity URL
  (`/triggers/webhook.payment/events/evt_2210`, `/sagas/PaymentWebhookSaga/ch_3QK9dR2eZ`,
  `/workers/jobs/reserve-inventory/executions/exec_4183`, `/streams/payment-events?tab=deliveries`).
  The halted/failed variant visibly stops the chain at the failing node (dashed severed rail);
  the in-progress variant pulses the tail node (static badge under reduced motion).
- **Right — seam detail rail:** selected node KV (primitive, owner plugin, queue/topic,
  attempt, correlation id) + out-links (Aspire trace, Scalar for the contract node) + an
  embedded **AI assist chip row**: "Explain this failure", "Draft a fix", "Compare with last
  success" (behavior specified in the AI prompt; here design the chips + the returned
  inline-assist card shape).
- **Header:** the correlation id (mono, copy affordance), origin route, started/elapsed,
  overall verdict pill, and a "Runs view" toggle linking to `/runs/ch_3QK9dR2eZ` (same id, two
  renderings — design them as visibly sibling views, e.g. a segmented Journey|Inspector switch
  under the breadcrumb).

## `/runs` — cross-primitive run list

Professional list ergonomics (the URL owns everything): `?kind=saga|job|task|firing|delivery`,
`?status=`, time range, `?page/?sort/?order`, free-text search; column set incl. correlation
id, primitive, entity, status w/ attempt pill, duration, started. Saved-filter chips row
(e.g. "Failures · 24h"). Bulk selection with a compare affordance (select 2 runs → side-by-side
step timelines). Every row navigates to `/runs/:correlationId`.

## `/runs/:correlationId` — the inspector twin

The same id as `/flow/:id`, rendered as grouped execution detail: step timeline
(`ns-step-timeline`) with attempt pills and the compensation branch visually distinct (warning
rail, ⟲ tags, reverse direction cue); `?view=all|compact|json` altitude toggle (Compact
default); inputs/results payload blocks; a correlated read-only log STRIP that deep-links to
Aspire logs (never an owned log tail); right rail: run events + context KV + the same AI assist
chips. Cross-links: "Journey view" ↔ `/flow/:id`; "Open originating trigger event";
"Open saga instance".

**Writes on this spine:** "Re-run job from this step" and "Reprocess failed delivery" render as
first-class buttons opening the standard confirm dialog — plan summary, from→to, exact CLI line
(`netscript workers run reserve-inventory --from-step reserve`), Execute, then a result toast +
the new execution appearing live with a link. No disabled/preview affordances.

**States:** loading skeleton chain; empty; live/in-progress (pulsing tail); completed calm;
halted/failed (severed chain — design this variant explicitly, it is the money shot); zero-match
filters.

**Reach for:** `ns-journey`, `ns-step-timeline`, `ns-flowrow`, `entity-rail`, `ns-activity-feed`,
`connector`/`ns-kv`, `code-block`, `ns-seg`, `ns-newpill`, `ns-livedot`, `ns-confirm`,
`badge`, `select`, `empty-state`, `skeleton`.

**Market bar:** Temporal's event history (three altitudes) and Inngest's timeline-left/
details-right are the ergonomic bar for the inspector; neither has an addressable cross-primitive
journey URL or a causal seam chain — that is this product's category lead. The design must make
the journey↔inspector duality obvious in one glance.

**Non-goals:** no waterfall/gantt, no owned logs/metrics, no OTLP jargon (NetScript vocabulary:
job, saga step, delivery, seam).

**Theme:** NS One tokens; light+dark; `STATUS_VARIANT`; mono ids; reduced-motion fallbacks.
