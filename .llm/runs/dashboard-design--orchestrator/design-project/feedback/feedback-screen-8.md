# Feedback — S8 Sagas Console

**Screen:** `S8 Sagas` (lines ~809–888) · route `sagas`
**Intent:** "which step failed, what compensated, and what's the durability tier?"
**Verdict:** The archetypal complementary capability — `COMPENSATING` is a status no other local
tool has. Render the compensation path as the hero.

## Working
- Instance table (`order.fulfillment #a1f` COMPENSATING durable, `refund.flow #b2c` COMPENSATED
  durable, `signup.flow #c3d` completed at-most-once), from→to transition/compensation timeline
  (`pending → charged → reserving → (reserve failed) → compensating:charged → refunded`), "step 3
  of 5, compensating step 2, retried once", transitions feed, All/Compact/JSON.

## Findings

### P1 `[UX]` Make the compensation branch visually distinct from forward progress
The killer view is the *rollback path* — `compensating:charged → refunded` — which no local tool
renders. Right now it's likely a linear timeline. Show the compensation steps as a visibly
different track (reverse arrows / warning rail) so "it went forward to step 3, failed, then
compensated step 2 backward" reads at a glance. This is the screen's entire reason to exist;
don't let it look like a normal step list.

### P1 `[GATE]` Do NOT build an in-dashboard "Replay saga step N" confirm
Per the prompt, `IInteractionService` is confirmed absent from the Aspire TS AppHost SDK; the
future replay action arrives via Aspire `withCommand`, not an in-dash confirm dialog. Audit the
screen: if the agent added a replay confirm, remove it — a "replay" affordance may only be a gated
out-link. (This is the one place a confirm dialog is *wrong*, opposite to S3/S12.)

### P1 `[E2E]` `order.fulfillment #a1f` and its durability must match S2/S6/S13
Same instance id and durability tier (`durable`) as S2 node detail and the S6/S13 order run. If S2
says the saga is durable and S8 says at-most-once, the wiring story breaks.

### P2 `[DATA]` COMPENSATED vs COMPENSATING must render as distinct settled/in-flight states
`refund.flow` COMPENSATED (settled) and `order.fulfillment` COMPENSATING (in-flight) should not
share one warning badge — a settled rollback and an in-progress rollback are different moments.
Design both distinctly (e.g. COMPENSATED = muted/settled, COMPENSATING = active warning pulse).
**Reconcile to the real enum** (`POC-ground-truth.md` §4): the framework's instance status is
`active | completed | failed | pending | compensating` — there is no separate `COMPENSATED`
terminal; a rolled-back instance settles to `completed`/`failed`. Model "compensated" as
`compensating` → terminal, not as its own status value, so the mock matches the API.

### P2 `[DATA]` Frame the timeline as the real `getInstanceHistory` stream
The from→to transition/compensation timeline is not invented — it's `getInstanceHistory({ sagaName,
correlationId }) → history.history[]` (`POC-ground-truth.md` §4), and the instance detail *also*
resolves `listExecutionsByCorrelationId`, so the S8→S6 "the saga's worker runs" link is real. Frame
the timeline as this history stream and expose the linked executions.

## Best-in-class delta
Temporal Web UI is *the* reference: event history rendered git-tree-style connecting events in a
group, Compact/All/JSON altitudes. S8 adopts the altitude toggle. Temporal, though, doesn't have a
first-class *compensation* concept — NetScript sagas do. So S8's job is to out-render Temporal on
exactly the thing Temporal lacks: the compensation state machine. Prioritize that over matching
Temporal's generic history view.
