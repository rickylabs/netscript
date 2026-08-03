# Cut trace — 0.0.5

Instrumented merge record, captured during the run from `git log origin/main` (first-parent),
never reconstructed. Format follows `release-0.0.4--orchestration/cut-trace.md`.

## Merge record

| # | Time (UTC) | Commit | PR | Issues closed | Wave |
| --- | --- | --- | --- | --- | --- |
| 1 | 2026-08-03 (pre-dispatch) | `42274e7bd` | #1176 | #1168 (all 5 boxes ticked incl. measurement) | external — not orchestrator-dispatched |
| 2 | 2026-08-03 (pre-dispatch) | `dcfe75ca1` | #1177 | #1170 | external — not orchestrator-dispatched |
| 3 | 2026-08-03 (pre-dispatch) | `fb75cf6fc` | #1178 | #1142, #1174 | external — not orchestrator-dispatched |

| 4 | 2026-08-03T20:49:09Z | `3049ef027` | #1181 | #1171, #1105 | wave 1 (orchestrator-merged, full stage-D gate) |
| 5 | 2026-08-03T20:50:26Z | `c49bd1db2` | #1180 | — (`Refs #1166`; hand-close on canary.1 evidence) | wave 1 (orchestrator-merged, full stage-D gate) |

Retroactive merge audit (orchestrator, 2026-08-03T20:11Z, via the freshly-landed
`agentic:pr-checks`): PRs #1176/#1177/#1178 all `ok:true`, zero `current-fail` classifications
(head SHAs `7d64ef559`/`ac0252fbd`/`611e295b4`). These merges did **not** pass through the
orchestrator's stage-D gate — they landed via a parallel lane between plan commit and wave-1
dispatch, in exactly epic #1169's S1→S2→S4 order.

## Canary points

| Canary | Declared at | Published version | Payload (from merge history) | Label+note verdict |
| --- | --- | --- | --- | --- |

## Re-planning events

- **R2 (2026-08-03, wave 1 in flight):** owner filed #1184 (p1, sagas scaffold glue registers no
  KV adapter → saga runner crashes on default scaffold; found by the wave-4 DeepSeek run on
  published 0.0.4; downstream of #1064–#1066). Scheduled — not dispatched — as **W2-F** into the
  **canary.2 train** per owner instruction ("one canary train, not a train of its own"); no
  cross-cut with in-flight wave-1 surfaces. Wave 2 becomes: #1130, #1131, #1119, **#1184**
  (4 Codex) + agy #1106; #1184 holds the wave-2 `scaffold.runtime` expensive-gate slot.
- **R1 (2026-08-03, pre-dispatch):** W1-A (#1168), W2-A (#1170), W2-B (#1142+#1174) landed
  externally before wave-1 dispatch (merges 1–3 above). Absorbed per the profile: undispatched
  remainder re-clustered — revised wave 1 = proofs (#1127–#1129), #1166, #1134, plus W3-A
  (#1171+#1105, epic S3) pulled forward since S2/S4 are landed. Wave 2 remainder: #1130, #1131,
  agy #1106, #1119 (pulled from W3-D). Later waves compress accordingly; canary points stay at 4
  with canary.1 unchanged (its payload now also contains merges 1–3 — content-derived membership
  absorbs them by construction). Plan is not renumbered mid-run; this trace is the record.

## Failure table

_(time-costing failures, as they happen)_
