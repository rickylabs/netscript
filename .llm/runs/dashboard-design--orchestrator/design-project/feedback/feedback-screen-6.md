# Feedback — S6 Run Inspector

**Screen:** `S6 Run Inspector` (lines ~569–691) · route `runs`
**Intent:** "where in the run did it fail, how many attempts, and what compensated?"
**Verdict:** The strongest complementary surface. Its value depends on sharing one fixture with
S8/S10/S13.

## Working
- Cross-primitive run list (saga / job / firing / delivery) with status+capability filters, step
  timeline with attempt pills and a compensation step, All/Compact/JSON toggle, a correlated
  `ns-log-stream` strip that is read-only and deep-links to Aspire logs, "View full trace in
  Aspire." Duplication gate holds (no owned waterfall, no owned logs).

## Findings

### P1 `[E2E]` This is the anchor of the one-canonical-journey story
The run here — "saga step 3/5, COMPENSATING step 2, retried once" — must be the **same run**, with
the **same correlation ID**, that S8 renders as a state machine, S10 as a stream fan-out, and S13
as a causal chain. The POC proves the join is real: every worker execution carries `concept`
(`job`|`task`) and `correlationId`, and `workersQueryUtils.listExecutionsByCorrelationId` is the
one API that resolves a run's whole cross-primitive fan-out (`POC-ground-truth.md` §1). Unifying
the ids is the highest-value change across the whole prototype (README cross-cutting #1).

### P1 `[E2E]` Wire "Open trigger event" — the back-link is real and bidirectional
The POC's jobs loader resolves an execution's `correlationId`; when it's a UUID
(`isTriggerCorrelation`) it looks the value up in `listEvents` and builds a back-link to the
**originating trigger event**. So a run row shouldn't only out-link "View trace in Aspire" — for a
trigger-originated run it should also link **back to the S9 trigger event that fired it**. That
bidirectional trigger↔run link is a NetScript-only affordance and it's already implemented.

### P1 `[UX]` Selected-step detail should land in the right rail, not push the feed away
Temporal and Inngest both use timeline-left / details-right so expanding a step doesn't reflow the
page. S6 is list→detail→timeline→feed (4 zones) — verify that expanding a step's I/O `code-block`
doesn't shove the activity feed below the fold on a laptop. If it does, route the selected step's
payload into the right `ns-content-rail` (Inngest's pattern) and keep the timeline compact.

### P2 `[DX]` Attempt/retry vocabulary is the differentiator — keep it loud
"attempt 2/5", "COMPENSATING", "retrying" are concepts Aspire's black-box process view and
Scalar's static schema have no words for. Ensure every run row and step carries this vocabulary,
not a generic "in progress."

### P3 `[UX]` Note the future "replay from step" as a gated out-link, not an in-dash confirm
Inngest's "Rerun from step" is attractive, but per the S8 constraint (IInteractionService absent
from the Aspire TS AppHost SDK) replay arrives via Aspire `withCommand`, not an in-dashboard
confirm. If you hint at replay, make it an out-link/gated affordance — do not build a confirm
dialog for it here.

## Best-in-class delta
Temporal (run-list → detail → event-history at three altitudes) and Inngest (timeline-left /
details-right, attempt badges, rerun-from-step) are the references, and S6 already adopts the run
list + altitude toggle. The NetScript edge over both: a *single* run that spans eischat → workers
→ streams as one logical thing, annotated with primitive semantics — which only pays off if the
cross-screen ids actually match (P1).
