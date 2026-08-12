# Drift Log: W5-A plugin doctor service entrypoint release window

## D1 — Evidence relocation

An owner-side closeout commit `41ef373ab` moved the requested evidence file from the repository-root
`slices/w5-a-doctor/evidence.md` path into this tracked run directory to avoid a new top-level
folder. The evaluator accepted the relocation and reported only stale internal references, which the
harness-only closeout updates.

## D2 — Automatic evaluator transport

Corrected against the run/job record; the earlier account of this section was wrong on three points
and is retracted here.

**The first draft-to-ready run (`31644251307`) was cancelled by the owner**, before credential
resolution and before the `Run OpenHands` step, because the evaluated head at that moment still
tracked the forbidden repository-root `slices/` path. Its job record shows `authorize: success` and
`agent: cancelled` — the agent job was stopped mid-step, so there was **zero provider spend**. It was
not cancelled by a concurrency-group collision with its own status comment.

**The owner also restored the lifecycle manually**: PR #1625 was converted back to draft by hand and
`status:impl-eval` was reset to `status:impl` by hand. **The workflow did not restore either.**
Recording this as automatic behaviour would credit the harness with a containment it did not perform.

**The other issue-comment/phase runs in that window were workflow shells blocked or cancelled before
provider spend — not duplicate evaluators.** `31644474350` is the clearest case: `total_jobs=0`, so
it never ran anything at all. A run existing is not evidence that an evaluator ran; the discriminator
is the job record, not the run's presence or its `conclusion` string.

**Exactly one paid evaluation exists for the corrected head**: `31644442984`, `agent: success`,
verdict `OPENHANDS_VERDICT: PASS`. It followed the single ready transition made after relocation
commit `41ef373ab` landed.

The successful workflow wrote its official summary artifact and PR verdict but skipped committing
run artifacts. `evaluate.md` records the external verdict, evaluated SHA, independent gates, and
immutable URLs without re-performing or self-certifying the evaluation.
