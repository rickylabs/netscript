# Final evidence closures — cut-time preflight

## Authority and state

This is an orchestrator-only evidence lane, not an implementation cluster. It creates no branch,
worktree, Codex thread, evaluator session, PR, or closing keyword. Live GitHub was re-read on
2026-08-06 after the PLAN-EVAL-approved milestone moves.

| Issue | Live state                                      | Already delivered                                                                        | Remaining proof                                                                                                                                        | Final authority                                                                           |
| ----- | ----------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| #1004 | open, `status:plan`, milestone 0.0.5            | same-semver recovery and content-identity refusal                                        | a real partial same-semver retry publishes only missing members and logs skips for already-published members                                           | orchestrator hand-close after registry/workflow evidence, otherwise move intact to 0.0.6  |
| #1090 | open, `status:triage`, milestone 0.0.5          | activation surfaces from earlier waves; Wave 6 recorded a zero-use baseline              | one unprompted measured agent trial per arm covering diagnostic MCP use, UI CLI use/reasoned non-use, conventions behavior, and Web Layer discovery    | orchestrator hand-close after the observation ledger, otherwise move intact to 0.0.6      |
| #1126 | open umbrella, `status:plan`, milestone 0.0.5   | S1–S10 (#1127–#1136) are closed                                                          | W5-A closes retained S11/S12 (#1137/#1138); deferred S13/S14 (#1139/#1140) remain explicitly assigned to 0.0.6                                         | orchestrator hand-close after child-ledger reconciliation; never via W5-A closing keyword |
| #1166 | open, `status:triage`, milestone 0.0.5          | merge-aware derivation and suspicious-empty refusal merged in PR #1180 with `Refs #1166` | a real post-`gh pr update-branch` cut reports buried PRs, distinguishes a genuine empty range, and re-verifies #1149 against correct derivation        | orchestrator hand-close after qualifying canary evidence, otherwise move intact to 0.0.6  |
| #1169 | open umbrella, `status:triage`, milestone 0.0.5 | owner ledger records S1–S6 and the original seven failure issues complete                | a clean, green release cut reaches publish in one pass with no rerun or override; current linked/deferred rows and release-pair lineage are re-queried | orchestrator hand-close after the qualifying cut; never by a code PR                      |

## Live child and dependency ledger

### #1126 — OpenAPI to MCP umbrella

- Closed with live GitHub timestamps: #1127, #1128, #1129, #1130, #1131, #1132, #1133, #1134, #1135,
  and #1136.
- Retained implementation scope: #1137 and #1138 remain open in 0.0.5 and are owned by W5-A.
- Deferred scope: #1139 and #1140 remain open in milestone 25 `0.0.6`; their execution and
  observational acceptance must not be silently treated as delivered by W5-A.
- Close procedure: after W5-A merges, re-query all fourteen children and the epic body. Record the
  ten closed predecessors, the two newly closed retained children, and the two explicit 0.0.6
  dispositions. Reconcile stale epic checkboxes to that live ledger, then close #1126 by hand with
  an evidence comment. W5-A closes only #1137 and #1138.

### #1169 — one-pass publish umbrella

- The owner's 2026-08-03 implementation ledger records #1168, #1170, #1171, #1172, #1173, #1174, and
  #1142 complete, with the live one-pass release observation as the sole remaining original
  definition-of-done row.
- #1175 was later accepted as deferred S8 and is now open in milestone 25 `0.0.6` by explicit
  sequencing decision. It is not rewritten as 0.0.5 evidence. At closure time, the comment must
  identify that deferred disposition rather than implying the JSR-propagation poll shipped.
- The owner also added release-PR canary-pair lineage acceptance in an issue comment. Before close,
  re-query the linked fix/current workflow and demonstrate that the qualifying cut neither orphans
  nor fabricates the green pair. A missing pair, rerun, or override fails the row closed.

## Qualifying evidence contracts

### #1004 — partial-publish recovery

A qualifying event must be real registry state from a planned OIDC canary workflow, not a fixture.
Capture the version/tag, content SHA, workflow run, pre-retry published/missing package sets,
same-semver retry run, and log lines showing missing packages published while registered packages
were skipped. Re-query every expected package after the retry and continue the normal label,
production-E2E, and pair chain.

If C14–C16 never produce a genuine partial publish, do not induce one. Before final milestone
closure, move #1004 to 0.0.6 with the remaining box unchanged and a comment that all planned cuts
were green, so the required registry-driven recovery event did not occur.

The canary.10 `published but unverified` incident remains useful recovery-class evidence but does
not satisfy the unchecked “only missing members” row because all packages had already published.

### #1090 — behavioral adoption

Use one unprompted trial per arm, with identical brief/version/bundle/budget where the conventions
comparison requires it. Do not hint, coach, retry for compliance, or convert non-use into PASS.
Record:

1. Quickstart receipt and host `tools/list` proving which tools were actually available.
2. Goal-to-capability map and invocation ledger for NetScript MCP diagnostics.
3. `ui:add` invocation or the agent's own contemporaneous reason for not invoking it.
4. Conventions-arm comparison: component-barrel/golden-example inspection and app-owned primitive
   imports versus recreated equivalents.
5. Web Layer/Scalar discovery timing relative to the first product-route edit.
6. Aspire resource graph, correlated trace evidence, and built-in-versus-hand-rolled decisions.

W3-B and W4-A may supply parts of this ledger, but #1090 closes only when all four live issue rows
are supported by the controlled observation. Tool absence must be reported separately from
available-but-unused tooling. An incomplete observation moves forward intact.

### #1166 — merge-buried canary membership

The qualifying range must naturally contain a PR merged behind the release/train PR through an
update merge. Before cutting, record the previous content point, head, update-merge SHA, and buried
PR number. After the cut, record the derived PR/issue payload, applied labels, release note, drift
verdict, and production pair. Demonstrate both:

- the known buried PR is present; and
- a genuinely zero-commit range is the only accepted empty payload, while a non-empty/no-PR range
  fails the named derivation check.

Then re-adjudicate #1149's payload-difference criterion using the correct derivation, not the
historical false-empty result. If no planned cut contains the required topology, move #1166 to 0.0.6
rather than manufacturing ancestry.

### #1169 — one-pass release

A qualifying cut begins only after current `origin/main` and the complete pre-merge verdict are
green. One uninterrupted OIDC release workflow must reach publish and its normal verification chain
without manual step replay, job rerun, admin override, synthetic status, or out-of-band repair.
Capture exact content SHA, tag/version, workflow run, attempts/retry classifications, all package
registry proofs, pinned production E2E, canary-pair status, and leak/ownership report.

A visible command-gate retry that is automatically class-gated under the shipped retry contract is
not an operator rerun; it must still be recorded with attempt durations. Any manual rerun or
override keeps #1169 open and triggers fix-forward before another qualifying cut.

## Cut-time procedure

1. Re-query all five issue bodies, labels, milestones, comments, and closing references.
2. Freeze cut membership from live GitHub and merge history; do not infer from this preflight.
3. Run the normal milestone pre-merge, close-gate, review-thread, changed-doc, scoped quality,
   runtime, ownership, publish-budget, and pair gates.
4. Capture qualifying observations above as immutable run evidence before checking any box.
5. Hand-close only fully earned issues with an evidence comment and terminal taxonomy.
6. Move every unearned issue directly to milestone 25 `0.0.6`, preserve its unchecked acceptance,
   and post the exact missing-evidence reason. Do not use a closing keyword on an umbrella or
   observational issue.
