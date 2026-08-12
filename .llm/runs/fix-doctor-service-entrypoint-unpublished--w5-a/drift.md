# Drift Log: W5-A plugin doctor service entrypoint release window

## D1 — Evidence relocation

An owner-side closeout commit `41ef373ab` moved the requested evidence file from the repository-root
`slices/w5-a-doctor/evidence.md` path into this tracked run directory to avoid a new top-level
folder. The evaluator accepted the relocation and reported only stale internal references, which the
harness-only closeout updates.

## D2 — Automatic evaluator transport

The first automatic draft-to-ready run (`31644251307`) was cancelled before the agent ran after its
new persistent status comment triggered a competing workflow in the same concurrency group. The
phase workflow correctly restored draft/`status:impl`. A single automatic rerun was made. Two phase
events then queued duplicate evaluator runs; queued duplicate `31644474350` was cancelled while the
already-active run `31644442984` continued and produced `OPENHANDS_VERDICT: PASS`.

The successful workflow wrote its official summary artifact and PR verdict but skipped committing
run artifacts. `evaluate.md` records the external verdict, evaluated SHA, independent gates, and
immutable URLs without re-performing or self-certifying the evaluation.
