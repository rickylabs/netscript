# Feedback — S12 Dead-Letter Queues (gated preview)

**Screen:** `S12 Dead-Letter Queues` (lines 1164–1236) · route `dlq`
**Intent:** "how many messages are dead, why did they die, and can I replay them safely?"
**Verdict:** Newly built and doctrine-correct — the gated-preview framing is exactly right for a
Backlog/Triage (#553) screen with no contract route yet. Fixes are about tab fidelity and confirm
specificity.

## Working
- `ns-plugin-gated-view` "Preview — contract routes pending" banner naming `TriggerDlqPort` (#554)
  and `queue DeadLetterStore` (#555) — honest that the API hasn't landed. Depth stat grid
  (KV/Redis/Postgres with tone dots), message table (checkbox select, expandable payload, source,
  reason, destructive error-code badge, dead-at), footer with "N selected", "Open original run",
  and a confirm-gated destructive "Reprocess selected". Queue DLQ / Trigger DLQ segmented control.

## Findings

### P1 `[DATA]` The two tabs must show different data
`Queue DLQ` (queue `DeadLetterStore`) and `Trigger DLQ` (`TriggerDlqPort`) are different backends
with different records. Verify switching the segmented control changes `s12Rows` **and**
`s12Depths` — right now they may be single-sourced, which would make the tabs cosmetic. At minimum
the depth grid should differ (a trigger DLQ has no KV/Redis/Postgres depth split the way a queue
does).

### P1 `[UX]` The reprocess confirm must name backend + count, not "are you sure"
Bulk-replaying dead messages is dangerous. The confirm dialog should read "Reprocess **3** messages
from **redis**?" with the exact CLI-equivalent `netscript queue dlq reprocess --backend redis` (the
binding already exists). Generic confirms train users to click through; a specific one is the whole
point of the confirm gate. Also confirm the "Open original run" button routes to S6 for the
*selected* message's run, not a static run.

### P2 `[DATA]` Depth realism: dead≠0 should imply rows, and vice-versa
If Redis depth is 14 (warning) the table should reflect that scale (or paginate/"showing 2 of
14"); if KV depth is 0 the KV tab should show the drained `empty-state` "No dead-lettered
messages," not an empty grid. Keep depth and table consistent per selected backend.

### P3 `[UX]` Don't let the preview look shippable
It's correctly gated, but ensure the destructive Reprocess button is itself disabled/annotated
under the "contract routes pending" banner — an operable destructive action on a
not-yet-real API is a mixed message. Gate the action, not just the header.

## Best-in-class delta
No dev-console exemplar owns DLQ replay (it's niche) — the closest analogs are Inngest/Trigger.dev
"rerun." Frame reprocess as "rerun the original run from the dead message," which the "Open
original run → S6" link already sets up. The gated-preview honesty (naming the exact two missing
contract routes) is *better* practice than most tools, which hide unbuilt surfaces entirely — keep
it.
