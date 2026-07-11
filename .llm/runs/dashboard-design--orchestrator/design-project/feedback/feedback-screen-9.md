# Feedback — S9 Triggers Console

**Screen:** `S9 Triggers` (lines ~890–996) · route `triggers`
**Intent:** "when does this fire next, and can I silence it now?"
**Verdict:** The schedule-preview (future fires) is a real differentiator; reconcile the DLQ tab
now that S12 exists.

## Working
- Firing-history feed by kind (cron / webhook / file-watch / queue.retry), per-trigger
  enable/disable `switch` with CLI-equivalent `netscript triggers disable payment-webhook`,
  schedule-preview (`computeNextFireTimes`, next 5 fires honoring tz + backfill), webhook
  test-delivery form, and a DLQ tab.

## Findings

### P1 `[UX]` Reconcile the DLQ tab with the now-built S12 screen
When this screen was authored, the DLQ tab was a gated placeholder ("pending `TriggerDlqPort`
contract route"). S12 now renders that surface fully. Decide: the S9 DLQ tab should either
**link to S12** ("Trigger DLQ →") or keep the identical gated placeholder — but it must not be a
*second, divergent* DLQ surface. Same wording as S5's `DLQ port degraded` and S12's banner.

### P1 `[DATA]` Render the per-event **action chain**, not a flat firing feed
The POC's richest trigger data is `event.actionResults[]` — each event fires an ordered chain of
actions (`enqueueJob | publishSaga | executeTask | executeBatch`), each with its own `status`,
`result`, `error`, `duration`, and each **deep-linking to the entity it produced** (job execution /
saga instance / task / batch) via `getLinkedResource` (`POC-ground-truth.md` §2). So one trigger
event is itself a mini causal fan-out — the S13 idea in miniature, per event. The firing feed should
expand an event into its action chain with linked outcomes, not show a single "fired" line. Also use
the full **8 trigger types** the framework defines: file · webhook · schedule · cron · kv · polling
· composite · manual (§5) — the current cron/webhook/file-watch/queue.retry subset under-sells the
registry.

### P1 `[DX]` Headline the future-fire preview — nobody else computes it
Inngest / Trigger.dev show *past* runs. NetScript computes the **next** fires from the declared
cron (tz + backfill aware). That's uniquely answerable and it's the answer to "when does this
actually fire next." Give it prominence (not a buried panel): "Next: 02:00, 03:00, 04:00
(America/New_York) · backfill on." This is the screen's signature.

### P2 `[GATE]` Keep the webhook test clearly separate from a Scalar call
The webhook test form is *ingress simulation* (POST to `/webhooks/{id}/test`), explicitly not a
Scalar app-route try-it. Verify the copy says "simulate inbound delivery," not "call endpoint," so
it doesn't read as a duplication-gate violation.

### P2 `[UX]` Enable/disable is a live mutation — apply the beta.6 read-only convention
The disable `switch` is a write. Whatever convention S3 lands on for beta.6 read-only (README
cross-cutting #2), apply it identically here (gated+tooltip, or operable-against-mock+preview
badge). Optimistic toggle + confirm + CLI-equivalent is the right shape once writes are live.

## Best-in-class delta
Inngest and Trigger.dev own the run-inspector half (firing history), which S9 matches. Neither
computes forward schedule from declared config — that's the NetScript-only half and the reason
this console beats a generic event-runs list. Weight the screen toward "next fire + silence it
now" (control with immediate feedback) rather than re-litigating past-firings, which S6 already
covers.
