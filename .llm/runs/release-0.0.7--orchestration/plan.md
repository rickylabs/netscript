# Plan — release 0.0.7 milestone cluster

## Frozen scope and gate

The owner-ratified inventory contains **64 target issues**: **63 active** and **one moved** (#1453, whose cited surface has never existed in this repository). Two external issues were admitted before freeze under `high-value-coherent`: #1249 and #1637. The auth defects #1384/#1385 remain in 0.0.8; #1384 cannot be correctly completed without #1383, and a partial credential-only workaround is explicitly rejected.

Exactly one composed `PLAN-EVAL` is required for this milestone plan. Mechanical leaves whose design is fully locked here may record leaf `PLAN-EVAL: N/A`; every implementation leaf still requires a separate-session, opposite-family `IMPL-EVAL` unless the owner records an attributed waiver.

## Execution invariants

1. **#1564 is the sole wave-0 merge barrier.** No other implementation leaf may dispatch until its CI range fix is merged to `main` and its stale-base fixture is green.
2. Exactly four topic orchestrators own `docs`, `internals`, `fixes`, and `features`. Each lane may run at most two implementation leaves and one evaluator; the cluster has one global expensive-gate slot.
3. Every leaf PR targets `main` directly, carries immutable-head structured receipts, and merges only after independent evaluation. The coordinator alone mutates cluster state and merges.
4. RFC 0001 is normative. #1348 realigns #1349–#1353 before SDK implementation; implementers must not follow contradicted/stale issue rows.
5. Canaries publish only from actual first-parent membership at the foundations and feature-complete checkpoints. Stable waits for all committed issues/leaves to be terminal and exact-`main` evidence to be sufficient.

## Dependency and dispatch waves

| Wave | Leaf groups | Issues |
| ---: | --- | --- |
| 0 | ci-diff-range-base-sha-barrier | #1564 |
| 1 | rfc-a-stage0-ratification-board<br>rfc-plugin-cli-contribution<br>legacy-port-pin-sweep<br>scaffold-generated-output-correctness<br>quality-scan-allowance-rail<br>harness-evidence-and-verdict-tooling<br>comparison-docs-programme<br>sdk-jsr-landing-verification | #1243, #1262, #1263, #1348, #1378, #1502, #1545, #1551, #1561, #1563, #1588, #1606, #1621 |
| 2 | sdk-typed-error-channel<br>prisma-mysql-adapter-surface<br>app-service-client-wiring<br>design-registry-catalog-drift-gate<br>quality-scan-root-coverage<br>openhands-dispatch-claim-and-refusal | #1293, #1350, #1355, #1358, #1360, #1542, #1611, #1613 |
| 3 | sdk-procedure-metadata<br>prisma-mysql-honest-example<br>ui-add-page-island-repair<br>workers-job-policy-metadata<br>reference-export-drift-gate<br>package-gate-honesty | #1112, #1296, #1357, #1451, #1466, #1604, #1618, #1622 |
| 4 | sdk-client-contribution-seam<br>ui-resource-slice-generator<br>ai-mcp-pool-isolation<br>sdk-cache-surface-and-telemetry<br>leak-check-process-descendants<br>jsdoc-example-compile-gate | #1349, #1354, #1429, #1448, #1533, #1598, #1619, #1620, #1623, #1637 |
| 5 | sdk-transport-policy-consolidation<br>sdk-auth-contribution-dogfood<br>sdk-trace-ownership-proof<br>workers-job-payload-typing<br>fresh-defer-test-capability | #1351, #1352, #1353, #1455, #1557, #1601 |
| 6 | sdk-locale-contribution-proof<br>plugin-discovery-contribution-references<br>aspire-agent-resource-inventory<br>sdk-cached-entry-swr | #1093, #1306, #1461, #1467 |
| 7 | plugin-service-context-factory<br>workers-execution-progress<br>sdk-browser-safe-entrypoints<br>scaffold-route-emission-and-gating | #1452, #1462, #1481, #1592, #1616 |
| 8 | ai-openai-responses-mapper<br>fresh-client-navigation-coordinator<br>fresh-typed-route-and-form-repair<br>cross-package-dependency-declarations | #1249, #1543, #1590, #1591, #1609, #1610 |
| 9 | fresh-ai-chat-response-options<br>cli-deploy-verb-surface | #1458, #1544 |

## Leaf map

| Wave | Leaf | Lane | Issues |
| ---: | --- | --- | --- |
| 0 | `ci-diff-range-base-sha-barrier` | internals | #1564 |
| 1 | `rfc-a-stage0-ratification-board` | features | #1348 |
| 1 | `rfc-plugin-cli-contribution` | features | #1502 |
| 2 | `sdk-typed-error-channel` | fixes | #1350 |
| 3 | `sdk-procedure-metadata` | features | #1466 |
| 4 | `sdk-client-contribution-seam` | features | #1349 |
| 5 | `sdk-transport-policy-consolidation` | fixes | #1351 |
| 5 | `sdk-auth-contribution-dogfood` | features | #1352 |
| 5 | `sdk-trace-ownership-proof` | fixes | #1353 |
| 6 | `sdk-locale-contribution-proof` | features | #1467 |
| 6 | `plugin-discovery-contribution-references` | fixes | #1093 |
| 2 | `prisma-mysql-adapter-surface` | features | #1293 |
| 3 | `prisma-mysql-honest-example` | fixes | #1112 |
| 1 | `legacy-port-pin-sweep` | fixes | #1243 |
| 1 | `scaffold-generated-output-correctness` | fixes | #1262, #1263, #1588 |
| 2 | `app-service-client-wiring` | features | #1355, #1360 |
| 3 | `ui-add-page-island-repair` | fixes | #1357 |
| 4 | `ui-resource-slice-generator` | features | #1354 |
| 2 | `design-registry-catalog-drift-gate` | fixes | #1358 |
| 6 | `aspire-agent-resource-inventory` | features | #1306 |
| 3 | `workers-job-policy-metadata` | features | #1451 |
| 5 | `workers-job-payload-typing` | features | #1455 |
| 7 | `plugin-service-context-factory` | features | #1452 |
| 7 | `workers-execution-progress` | features | #1592 |
| 4 | `ai-mcp-pool-isolation` | fixes | #1448 |
| 8 | `ai-openai-responses-mapper` | features | #1591 |
| 9 | `fresh-ai-chat-response-options` | features | #1458 |
| 8 | `fresh-client-navigation-coordinator` | features | #1590 |
| 8 | `fresh-typed-route-and-form-repair` | fixes | #1249, #1609, #1610 |
| 4 | `sdk-cache-surface-and-telemetry` | fixes | #1598, #1619, #1620, #1623, #1637 |
| 6 | `sdk-cached-entry-swr` | fixes | #1461 |
| 7 | `sdk-browser-safe-entrypoints` | fixes | #1462 |
| 7 | `scaffold-route-emission-and-gating` | fixes | #1481, #1616 |
| 8 | `cross-package-dependency-declarations` | fixes | #1543 |
| 9 | `cli-deploy-verb-surface` | fixes | #1544 |
| 3 | `reference-export-drift-gate` | internals | #1296 |
| 1 | `quality-scan-allowance-rail` | internals | #1378, #1545 |
| 2 | `quality-scan-root-coverage` | internals | #1542 |
| 4 | `leak-check-process-descendants` | internals | #1429 |
| 4 | `jsdoc-example-compile-gate` | internals | #1533 |
| 5 | `fresh-defer-test-capability` | internals | #1557, #1601 |
| 1 | `harness-evidence-and-verdict-tooling` | internals | #1561, #1563, #1621 |
| 2 | `openhands-dispatch-claim-and-refusal` | internals | #1611, #1613 |
| 3 | `package-gate-honesty` | internals | #1604, #1618, #1622 |
| 1 | `comparison-docs-programme` | docs | #1551 |
| 1 | `sdk-jsr-landing-verification` | docs | #1606 |

## Canary checkpoints

- **Foundations:** after #1564 plus the shared SDK, quality, harness, and generator foundations are merged and independently green.
- **Feature complete:** after every code leaf is merged, immediately before stable release qualification.

## Deferred and observational work

- #1606 is observational and closes from a recorded JSR landing-page check at a canary/release checkpoint; it does not require a code PR.
- #1453 was moved to Backlog / Triage with a public reason and evidence.
- #1384/#1385 remain owned by 0.0.8; this release will not ship a partial security workaround that fails their acceptance contract.
