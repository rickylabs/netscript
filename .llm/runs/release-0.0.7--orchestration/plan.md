# Plan — release 0.0.7 milestone cluster

## Frozen scope and gate

The owner-ratified inventory contains **64 target issues**: **60 active**, **one moved** (#1453,
whose cited surface has never existed in this repository), and **three closed-fixed** after live
verification (#1306, #1564, and #1606). Two external issues were admitted before freeze under
`high-value-coherent`: #1249 and #1637. The auth defects #1384/#1385 remain in 0.0.8; #1384 cannot
be correctly completed without #1383, and a partial credential-only workaround is explicitly
rejected.

Exactly one composed `PLAN-EVAL` is required for this milestone plan. Mechanical leaves whose design is fully locked here may record leaf `PLAN-EVAL: N/A`; every implementation leaf still requires a separate-session, opposite-family `IMPL-EVAL` unless the owner records an attributed waiver.

## Execution invariants

1. **There is no synthetic implementation barrier.** #1564's seven-construct audit proved that all
   changed-file consumers already use merge-base semantics and #1403 fixed the affected two-dot
   construct, so #1564 is closed-fixed. PLAN-EVAL approval remains the sole dispatch barrier.
2. Exactly four topic orchestrators own `docs`, `internals`, `fixes`, and `features`. Each lane may run at most two implementation leaves and one evaluator; the cluster has one global expensive-gate slot.
3. Every leaf PR targets `main` directly, carries immutable-head structured receipts, and merges only after independent evaluation. The coordinator alone mutates cluster state and merges.
4. RFC 0001 is normative. #1348 realigns #1349–#1353 before SDK implementation; implementers must not follow contradicted/stale issue rows.
5. Canaries publish only from actual first-parent membership at the foundations and feature-complete checkpoints. Stable waits for all committed issues/leaves to be terminal and exact-`main` evidence to be sufficient.
6. Publication is GitHub Actions OIDC-only. Stable qualification requires the canary OIDC publish
   and its exact-version E2E pair, then the stable OIDC publish and the production E2E run pinned to
   the `version.txt` artifact from that exact publish workflow. Local publication is prohibited.

## Decisions locked before dispatch

- **#1461:** do not add a second public `queryEntry()` API. Correct the published loader to enter
  through the existing cache-aware `query()` path, then read entry metadata; prove fresh/miss/stale
  and concurrent-stale dedupe behavior with the executable example.
- **#1620:** use a runtime cardinality guard, not an unenforceable branded string or source-only
  lint. Admit at most 64 distinct normalized telemetry namespaces per process, collapse later novel
  values to one fixed `overflow` namespace, and emit one bounded warning that names the first
  offender. Static shipped call sites remain unchanged.
- **#1621:** keep the acceptance mirror fail-closed, but detect the zero-checkbox case before index
  matching and emit the specific removal-or-convert guidance. Update `netscript-pr`; do not make it
  a no-op and do not widen issue-template policy in this leaf.
- **#1590:** the issue's A→B→A/region-remount behavior is the framework contract. The implementing
  lane may read `rickylabs/eis-chat` at immutable commit
  `5191de83f3da97559f21d8891c6c8afdf1cf473a` through existing GitHub access, but the
  shipped proof is a NetScript-owned black-box fixture and does not copy consumer business code.
- **#1551:** one PR, three ordered commits: methodology/navigation; pinned Next.js-equivalence
  fixture plus measurement scripts; comparison/migration pages and matrices. Read the private
  EIS-Chat route at a recorded immutable commit, hold shared leaf presentation constant, publish
  raw measurement inputs, and label every unmeasured statement inspected/inferred. The 50-topic
  backlog remains follow-up work, as the issue explicitly permits. Its private EIS-Chat input is
  pinned to `5191de83f3da97559f21d8891c6c8afdf1cf473a`.
- **#1349/#1351/#1352/#1353:** the top-of-body 0.0.7 amendments and merged RFC 0001 are normative;
  the superseded proposal text is never an implementation input.
- **#1249:** run independent red-first probes for both filed defects. If the locked Zod-family probe
  does not reproduce, move only that half visibly to 0.0.8 with its output and reason; never tick it
  silently or broaden the fix.
- **#1451:** extend the existing typed `netscript.config.ts` `workers.groups[].jobs[]` seam and feed
  the validated policy into the installed workers registry generator. Do not add a second manifest.
- **#1385:** remains independently deferred because cookie/CORS transport topology belongs to the
  later auth pack; it is distinct from #1383's server-header propagation repair.

## Leaf contracts, gates, and JSR audit

`leaf-contracts.json` is dispatch input, not optional prose. Every one of the 43 leaves names its
expected file surfaces, smallest doctrine archetype, overlays, proving gates selected from the
archetype matrix, and either a publishable-member JSR audit or an explicit non-package N/A reason.
Implementers must update a contract before crossing its file boundary; the coordinator treats an
undeclared package/plugin touch as drift and pauses that leaf.

## Risk register and collision ownership

| Risk | Early signal | Containment / owner |
| --- | --- | --- |
| RFC/client semantics regress to stale issue prose | public link/callback/fetch or trace-contribution API appears | RFC 0001 plus rewritten Acceptance rows; SDK critical path remains serialized |
| Two leaves edit the same source seam | declared file surfaces overlap before dispatch | coordinator assigns one owner or orders leaves; no parallel overlapping mutations |
| JSR dry-run is green but published graph fails | asset/import-meta reads, stale exact pins, first-publish member | per-leaf JSR audit; release preflight; OIDC canary plus exact-version production E2E |
| Runtime leaves leak Aspire/Docker/process state | leak-check or final inventory reports owned resources | one global expensive gate; scoped teardown; final Aspire/Docker/WSL audit |
| Private consumer evidence drifts | EIS-Chat default branch moves | immutable SHA above; NetScript-owned black-box fixtures are the shipped proof |
| Canary quota/cadence is wasted | bookkeeping-only checkpoint or insufficient JSR quota | publish only meaningful first-parent checkpoints; fail closed before minting |

| Collision surface | Owning leaves / order |
| --- | --- |
| SDK contribution, transport, auth, trace | `sdk-typed-error-channel` → `sdk-procedure-metadata` → `sdk-client-contribution-seam` → wave-4 SDK leaves |
| Service showcase scaffold | single grouped `app-service-client-wiring` leaf (#1355/#1360) |
| Fresh navigation/forms/routes | framework foundations before `fresh-client-navigation-coordinator` and `fresh-typed-route-and-form-repair` |
| Workers generated registry | `workers-job-policy-metadata` before `workers-job-payload-typing` |
| Harness evidence/quality gates | foundation tooling leaves precede package-gate honesty and release evidence collection |
| Docs/JSR landing surfaces | docs leaf consumes pinned inputs; JSR observation remains closed-fixed and release E2E is authoritative |

## Open-decision sweep

All dispatch-blocking owner decisions are resolved in the issue Acceptance sections: bearer-only
auth topology; generic optional `sdkClients` references; ceiling 16; application-supplied bearer;
outer logical-call composition; procedure metadata in #1350/#1466; explicit incoming-header
selection; whole-family oRPC v1.15.0; and coordinator-only #1348 closure. oRPC v2, cookie/session
transport, environment token convenience, and the comparison-docs 50-topic backlog are explicitly
safe-deferred and are not hidden 0.0.7 gates.

## Dependency and dispatch waves

| Wave | Leaf groups | Issues |
| ---: | --- | --- |
| 0 | rfc-a-stage0-ratification-board<br>rfc-plugin-cli-contribution<br>legacy-port-pin-sweep<br>scaffold-generated-output-correctness<br>quality-scan-allowance-rail<br>harness-evidence-and-verdict-tooling<br>comparison-docs-programme | #1243, #1262, #1263, #1348, #1378, #1502, #1545, #1551, #1561, #1563, #1588, #1621 |
| 1 | sdk-typed-error-channel<br>prisma-mysql-adapter-surface<br>app-service-client-wiring<br>design-registry-catalog-drift-gate<br>quality-scan-root-coverage<br>openhands-dispatch-claim-and-refusal | #1293, #1350, #1355, #1358, #1360, #1542, #1611, #1613 |
| 2 | sdk-procedure-metadata<br>prisma-mysql-honest-example<br>ui-add-page-island-repair<br>workers-job-policy-metadata<br>reference-export-drift-gate<br>package-gate-honesty | #1112, #1296, #1357, #1451, #1466, #1604, #1618, #1622 |
| 3 | sdk-client-contribution-seam<br>ui-resource-slice-generator<br>ai-mcp-pool-isolation<br>sdk-cache-surface-and-telemetry<br>leak-check-process-descendants<br>jsdoc-example-compile-gate | #1349, #1354, #1429, #1448, #1533, #1598, #1619, #1620, #1623, #1637 |
| 4 | sdk-transport-policy-consolidation<br>sdk-auth-contribution-dogfood<br>sdk-trace-ownership-proof<br>workers-job-payload-typing<br>fresh-defer-test-capability | #1351, #1352, #1353, #1455, #1557, #1601 |
| 5 | sdk-locale-contribution-proof<br>plugin-discovery-contribution-references<br>sdk-cached-entry-swr | #1093, #1461, #1467 |
| 6 | plugin-service-context-factory<br>workers-execution-progress<br>sdk-browser-safe-entrypoints<br>scaffold-route-emission-and-gating | #1452, #1462, #1481, #1592, #1616 |
| 7 | ai-openai-responses-mapper<br>fresh-client-navigation-coordinator<br>fresh-typed-route-and-form-repair<br>cross-package-dependency-declarations | #1249, #1543, #1590, #1591, #1609, #1610 |
| 8 | fresh-ai-chat-response-options<br>cli-deploy-verb-surface | #1458, #1544 |

## Leaf map

| Wave | Leaf | Lane | Issues |
| ---: | --- | --- | --- |
| 0 | `rfc-a-stage0-ratification-board` | features | #1348 |
| 0 | `rfc-plugin-cli-contribution` | features | #1502 |
| 1 | `sdk-typed-error-channel` | fixes | #1350 |
| 2 | `sdk-procedure-metadata` | features | #1466 |
| 3 | `sdk-client-contribution-seam` | features | #1349 |
| 4 | `sdk-transport-policy-consolidation` | fixes | #1351 |
| 4 | `sdk-auth-contribution-dogfood` | features | #1352 |
| 4 | `sdk-trace-ownership-proof` | fixes | #1353 |
| 5 | `sdk-locale-contribution-proof` | features | #1467 |
| 5 | `plugin-discovery-contribution-references` | fixes | #1093 |
| 1 | `prisma-mysql-adapter-surface` | features | #1293 |
| 2 | `prisma-mysql-honest-example` | fixes | #1112 |
| 0 | `legacy-port-pin-sweep` | fixes | #1243 |
| 0 | `scaffold-generated-output-correctness` | fixes | #1262, #1263, #1588 |
| 1 | `app-service-client-wiring` | features | #1355, #1360 |
| 2 | `ui-add-page-island-repair` | fixes | #1357 |
| 3 | `ui-resource-slice-generator` | features | #1354 |
| 1 | `design-registry-catalog-drift-gate` | fixes | #1358 |
| 2 | `workers-job-policy-metadata` | features | #1451 |
| 4 | `workers-job-payload-typing` | features | #1455 |
| 6 | `plugin-service-context-factory` | features | #1452 |
| 6 | `workers-execution-progress` | features | #1592 |
| 3 | `ai-mcp-pool-isolation` | fixes | #1448 |
| 7 | `ai-openai-responses-mapper` | features | #1591 |
| 8 | `fresh-ai-chat-response-options` | features | #1458 |
| 7 | `fresh-client-navigation-coordinator` | features | #1590 |
| 7 | `fresh-typed-route-and-form-repair` | fixes | #1249, #1609, #1610 |
| 3 | `sdk-cache-surface-and-telemetry` | fixes | #1598, #1619, #1620, #1623, #1637 |
| 5 | `sdk-cached-entry-swr` | fixes | #1461 |
| 6 | `sdk-browser-safe-entrypoints` | fixes | #1462 |
| 6 | `scaffold-route-emission-and-gating` | fixes | #1481, #1616 |
| 7 | `cross-package-dependency-declarations` | fixes | #1543 |
| 8 | `cli-deploy-verb-surface` | fixes | #1544 |
| 2 | `reference-export-drift-gate` | internals | #1296 |
| 0 | `quality-scan-allowance-rail` | internals | #1378, #1545 |
| 1 | `quality-scan-root-coverage` | internals | #1542 |
| 3 | `leak-check-process-descendants` | internals | #1429 |
| 3 | `jsdoc-example-compile-gate` | internals | #1533 |
| 4 | `fresh-defer-test-capability` | internals | #1557, #1601 |
| 0 | `harness-evidence-and-verdict-tooling` | internals | #1561, #1563, #1621 |
| 1 | `openhands-dispatch-claim-and-refusal` | internals | #1611, #1613 |
| 2 | `package-gate-honesty` | internals | #1604, #1618, #1622 |
| 0 | `comparison-docs-programme` | docs | #1551 |

## Canary checkpoints

- **Foundations:** after the shared SDK, quality, harness, and generator foundations are merged and
  independently green; membership is derived from actual first-parent history.
- **Feature complete:** after every code leaf is merged, immediately before stable release qualification.

## Deferred and observational work

- #1306 is closed-fixed: Aspire 13.4.6 and the generated NetScript skill already expose the native
  JSON inventory path the issue requested.
- #1564 is closed-fixed after the consumer-by-consumer audit; #1403 owns the completed red-first fix.
- #1606 is closed after live JSR registry and landing-page verification; it requires no code PR.
- #1453 was moved to Backlog / Triage with a public reason and evidence.
- #1384/#1385 remain owned by 0.0.8; this release will not ship a partial security workaround that fails their acceptance contract.

## Live re-intake and leaf plan — 2026-08-30T09:51:00Z

The frozen DAG now carries 99 active issues through waves 0–19. Late admitted work is ordered, not
globally serialized: #1749 is docs wave 11 after #1745; Aspire S8 owns #1720 and newly admitted #863
in features wave 14 after #1718. Terminal inventory-only exclusions and duplicate #1733 remain
outside committed active scope.

| Leaf / PR | Lane | Exact state | Next gate |
| --- | --- | --- | --- |
| #1731 / #1466 | features | slice 2 product `2863d29e`; evidence `dce16175`; host addendum `bbff7cf9`; slice 3 active | finish slice 3 G-4, Tier-A, final all-slices IMPL-EVAL |
| #1739 / #1673 | fixes | focused PLAN-EVAL passed; bounded S7 implementation at `e24e7ce1`; cycle-1 `FAIL_FIX` preserved | finish implementation, Tier-A, cycle-2 IMPL-EVAL |
| #1747 / #1732 | internals | product `fc3ea177`; PASS evidence `c1e03922`; ready | coordinator pre-merge gate, human merge |
| #1736 / #1734 | internals | second terminal IMPL-EVAL failure `eb765629`; owner boundary | no cycle 3 without explicit owner authorization |
| #1738 / #1716 | fixes | `73299241`; baseline-blocked `status:ci-fail` | no merge handoff until the shared baseline is corrected |
| #1740 / #979/#1365/#1370/#1717 | fixes | `aa822069`; baseline-blocked `status:ci-fail`; expensive gate terminal | do not rerun or hand off until the shared baseline is corrected |
| #1741 / #1715 | internals | `9525f1ae`; two authorized runtime attempts terminal on remote-DinD topology | parked; no third attempt authorized |
| #1754 / #1720/#863 | features | S8 static S1–S4 through `1efd1a17`; stacked on S6 | continue S5–S6, separately leased Phase B off the NAS topology, IMPL-EVAL |
| #1746 / #1745 | docs | `84a5fd11`; exact-head IMPL-EVAL PASS, CI and threads green | shippable human merge handoff |
| #1748 / #1000 | docs | `22e79dcc`; exact-head IMPL-EVAL PASS, CI and threads green | shippable human merge handoff |
| #1755 / #1749 | docs | direct-to-main draft `2c844565`; Tier-A and 13 gates PASS | exact-head IMPL-EVAL; corpus queue behind #1746/#1748 |

Merged leaves are terminal at authoritative PR heads: #1669 `313cc08d` (merge `0ef48c2e`) and
#1729 `608f68b0` (merge/main `13878a80`). Serial queues remain per orchestrator, never global.
