VERDICT: CHANGES_REQUESTED

## Findings

- C3 (survives) `.llm/harness/workflow/canary-cadence.md:166` — The reference table still claims
  `milestone-run.md` performs “cut-time verification of note accumulation,” preserving the
  nonexistent mechanism C3 identified — the corrected contract at cadence lines 102–111 and
  `milestone-run.md:113-118` says the notes are only read manually and no mechanism feeds them into
  the stable note.
- C7 (survives) `.llm/harness/workflow/milestone-run.md:76` — Pre-merge check 3 remains an active
  gate although its negative predicate has never been observed firing — this directly violates the
  profile's own admission rule at lines 86–87 and #1120's acceptance requirement that every gate's
  negative case be shown. The PR body's checked acceptance row does not become true by disclosing
  the failure; it explicitly admits this predicate is not demonstrated.
- C9 (survives) `PR #1161 body, Acceptance evidence D2` — D2 is still checked despite evidence in
  the same sentence that 0.0.5 delivery PRs #1153/#1155 merged before ratification — issue #1120
  says *no 0.0.5 delivery work* begins first, and its only owner amendment narrowly permits the
  canary surface. A future merge cannot retroactively ratify an unrecorded “orchestrated delivery”
  rewrite, so the conditional mapping is not truthful acceptance evidence.
- C10 `.llm/harness/workflow/canary-cadence.md:94` — The revised observable contract falsely says
  the tool enforces publication on an **existing** `v<version>` tag —
  `canary-label.ts:360-377` only looks up an existing release and, on 404, POSTs a release with that
  tag; it never verifies that the git tag already exists. This is new mechanism drift introduced by
  the fix wording.
- M1 (survives) `.agents/skills/agent-milestone-orchestrator/SKILL.md:33-36` — The fix changes the
  meaning of `[observed]` to include issue prose and design observations instead of backing every
  marker with the cut trace as this review's source-of-record rule requires. The unsupported earned
  rules remain, including host load 160 (lines 60–62), attached-launch behavior (101–108), evaluator
  triggers (109–112), truncated-log behavior (120–122), and AppHost stop behavior (159–161), none of
  which appears in `cut-trace.md`.
- M2 (survives) `.llm/harness/workflow/milestone-run.md:127-142` — The evaluator section remains
  promoted as `[observed]` without cut-trace support for draft→ready/OpenHands triggers, #1113's
  three-family path, reviewer substitution, or the inline-`jq` incident. Broadening the document's
  evidence definition at lines 14–16 does not satisfy the required trace verification.
- M4 (survives) `.llm/harness/workflow/milestone-run.md:94-100` — The latest-run-per-check timestamp
  algorithm remains a mandatory “must” rule while simultaneously marked `[asserted]` and
  not-yet-exercised — asserted content is still phrased as settled doctrine, contrary to the same
  document's proof-before-entry rule at lines 86–87.
- M7 `.llm/harness/workflow/canary-cadence.md:129-131` — The cadence says target-scoped drift is
  “not yet” implemented and cites #1160 as a live defect, but #1160 is closed with all four
  acceptance boxes checked. The reference is stale and no longer says what the artifact claims.

Cycle-1 findings C1, C2, C4, C5, C6, C8, M3, M5, and M6 are resolved. Exact-paragraph comparison
found no duplicate paragraph across the three artifacts, and the generated orchestrator mirror is
byte-identical to its source.
