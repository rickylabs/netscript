# Resume worker trace isolation

Issue #2393 / inbox harness#750. Branch `orch/divybot-750`, baseline a833dfa8. Draft PR #2399.
Root cause: inbound extraction fell back to ambient worker context, and without a registered
propagator that ambient span even masked valid message headers.

## State: S1 complete and signed off

Fix landed in `packages/telemetry/src/context/{w3c,message}.ts` (extract from ROOT_CONTEXT, keep the
full tracestate list) and `plugins/triggers/src/runtime/trigger-runtime-processor.ts` (every
delivery follows its durable carrier). Eight reviewed files are pinned by
`receipts/source-manifest.json`. Independent substantive review by Claude Opus 5
(`claude-opus-5`, Anthropic), xhigh, session `0faa9365-3561-462c-96f1-45c3216cd292` — different
vendor and session from the Codex implementation — returned PASS_SLICE_REVIEW, then reaffirmed it
after verifying the F1-F6 repair delta. Details in `slice-review.md`; gate table in `worklog.md`.
The supervisor owns the S1 sign-off commit; the implementer pushes it and posts the S1 scope and
evidence comment on #2399.

## Next: S2 only

1. Full `deno task e2e:cli run scaffold.runtime --cleanup` merge-readiness smoke — the final gate
   per AGENTS.md, not a per-slice implementation gate. It was still running at sign-off and is
   **not** claimed green.
2. Final IMPL-EVAL in that same reviewer session once the smoke terminates, over the full evidence
   set: smoke outcome, quality:gate, publish dry runs, doc-lint baseline comparison, cleanup.
3. Only then ready-merge, PR out of draft, and close-gate handling for #2393. `release-note.md`
   carries the published-behaviour text the PR body must state.

No self-certification at any step. Do not commit assignment or final-report files
(`.divybot-goal.md` stays excluded). Operational evidence and memory live outside the repo in
`/home/agent/projects/orchid/runs/2026-10-18-worker-traces/`.
