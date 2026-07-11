# Feedback — S10 Streams Console

**Screen:** `S10 Streams` (lines ~998–1085) · route `streams`
**Intent:** "did the message fan out to every subscriber, and did any delivery retry or fail?"
**Verdict:** Lowest-shipped console — the graceful "not yet wired" state is a first-class
requirement, not an afterthought. The fan-out view is the payoff.

## Working
- Delivery feed (`payment-events msg_88f published` → per-subscriber `→ receipt-worker delivered`
  / `→ ledger-sync delivered attempt 2` / `→ analytics FAILED`), fan-out step timeline
  (one step per subscriber, attempt pills), subscriber wiring pulled from the S2 graph.

## Findings

### P1 `[DATA]` Verify the "delivery read-model not yet wired" state renders first-class
The prompt makes this the primary risk: if no delivery read-model exists yet, show a prominent
`empty-state` "Stream delivery inspection is coming — contract not yet wired" — never a broken or
faked-full table. Confirm this state exists and is designed (not a thin afterthought). And align
its wording with S2's `streams:payment-events` coverage `unwired` note (feedback-screen-2 P1) —
one story about streams telemetry maturity across both screens.

### P1 `[DX]` The per-subscriber fan-out is the hero — foreground the headline
"1 publish → 3 subscribers, 1 retried, 1 failed" is the stream analog of a saga's steps, and no
local tool renders per-subscriber delivery fan-out. Lead with a one-line verdict
("`msg_88f`: 2/3 delivered · 1 failed") above the per-subscriber timeline so the answer to "did it
reach everyone" is instant.

### P1 `[E2E]` `payment-events` / `msg_88f` must be the tail of the flagship order run
S13's final node is `stream payment-events · 3/3 delivered`. This screen is where that node
expands. Use the same stream + message id so "Open Streams console" from S13's stream node lands
here on the same fan-out. (Note a status mismatch risk: S13 shows 3/3 delivered but S10's sample
shows analytics FAILED — pick one outcome for the canonical message, or make clear they're
different messages.)

## Best-in-class delta
No dev-console exemplar renders stream fan-out (Encore has pub/sub *topics* on its Flow map, but
not per-subscriber delivery attempts). This is genuinely new ground — which raises the bar on the
"not yet wired" honesty: because there's no precedent to lean on, a faked-full table would be the
most misleading screen in the app. The empty/gated state is the feature here.
