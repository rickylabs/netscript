FAIL_PLAN

## Repair dispositions

| Item | Disposition | Evidence gathered |
| --- | --- | --- |
| 1 — Superseding F manifest | **NOT FIXED** | `plan.md:663-681` contains exactly the requested eight rows and excludes #1126, #1169, and #1202. Every row has non-empty Adjudicator, Event, Admissible evidence, and If-it-does-not-occur cells. `phase-registry.md:42` points only to v4.3 and says the v4.1 table must not be used; `plan.md:663-670` says the same. The authority split is defensible: the milestone orchestrator owns evidence adjudication, while the repo owner owns #1208's Phase-2 scope decision. The rows are not all truthful closure contracts, however: #1090, #1166, and #1197 describe observations that can occur without satisfying their live acceptance criteria, and #1208 has no complete non-occurrence path. |
| 2 — Milestone-move receipt | **FIXED** | `plan.md:687-699` and `phase-registry.md:33` both enumerate the same seven inbound IDs (#1373, #1356, #1375, #1376, #1359, #1343, #1379), the same two outbound IDs (#1126, #1169), require all **nine**, and compare `MISMATCH` against those nine IDs. Live `gh issue view` queries returned inbound issues in 0.0.6/0.0.7 and outbound issues in 0.0.5, matching the current `NOT_RUN` state. The live 0.0.5 milestone has 21 open issues; the planned immediate change is 21 − 2 + 7 = 26. No tenth immediate move is implied: #1139/#1140/#1175 are already in 0.0.6, and the F rows' future moves are conditional non-occurrence dispositions, not part of the pre-W3 receipt. |
| 3 — Phase-registry Plan row | **FIXED** | `phase-registry.md:27` reports cycle 3 `FAIL_PLAN`, the three v4.3 repairs, cycle 4 pending, and says the Option-A owner escalation is closed. That matches `escalations/plan-gate-scope.md` and drift C-D42. |

## Surviving finding

### BLOCKER — Four F rows do not define a truthful closure transition

The v4.3 table is structurally superseding, but an event in its “Event that closes it” column can
occur while the issue remains acceptance-incomplete:

- **#1090:** `plan.md:675` permits one unprompted trial plus per-tool counts to close it. Live
  `gh issue view 1090 --json body` has four acceptance rows: non-zero MCP diagnostics, `ui:add` or a
  recorded reason, a controlled conventions-file comparison holding the other inputs constant, and
  reaching a Web Layer page before route authoring. The issue body specifies six agents per arm for
  the controlled check. One transcript with tool-call counts does not prove that contract.
- **#1166:** `plan.md:676` names one payload containing a behind-merge PR. Live #1166 also requires
  a genuinely empty canary to be distinguishable from a failed derivation and requires #1149's
  payload-difference criterion to be re-verified. The named output-versus-first-parent comparison
  does not state either required result.
- **#1197:** `plan.md:677` makes a re-measured run and before/after MCP counts the closing event and
  evidence. Live #1197 additionally requires routing to diagnostics at the moment of failure,
  either actual use of the gated drift path or removal of the unenforceable gate, and a repeatable
  extraction script. A real run can occur with zero adoption; the issue explicitly says such a run
  does not close it.
- **#1208 Phase 2:** assigning the scope decision to `@Rickylabs` is correct, but the
  non-occurrence cell at `plan.md:678` says a 0.0.6 issue is filed and #1208 closes only if the owner
  says so. If the event does not occur, there is no owner decision, so #1208 neither closes nor has
  a stated move and stage F cannot finish. Filing a separate Phase-2 issue is itself part of the
  scope disposition; the orchestrator cannot do it as the fallback to an absent owner decision.

These are live acceptance mismatches, not objections to the adjudicator roles. The other four rows
have a truthful path: #1004 names the remaining demonstrated-recovery acceptance; #1333 combines
W4-A's landed implementation with its final measured smoke; #1338 combines merged #1339 policy
evidence with the T1 observations; and #1343 has one installed-consumer acceptance event with a
complete receipt.

Required change: make each closing event outcome-qualified and make its evidence cover the live
acceptance contract. For #1090, require all four observations and the controlled comparison; for
#1166, require the behind-merge payload, distinguishable-empty result, and #1149 re-verification;
for #1197, require the implementation/route/drift/script evidence plus a measured run satisfying
the adoption alternative. For #1208, require Phase-1 evidence plus an explicit owner disposition;
if no owner disposition exists at F, move #1208 intact to 0.0.6 rather than filing or closing scope
on the owner's behalf.

## Regression check

The v4.3 edit did not leave an executable conflict between the old and new tables. `plan.md:663-670`
marks every earlier manifest superseded and says to ignore the v4.1 table; `phase-registry.md:42`
points stage F at v4.3 and repeats that prohibition. The surviving finding is inside the new
manifest's closure predicates.
