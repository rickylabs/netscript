# Worklog

## Design

1. Public surface: five navigable command/relay guides plus expanded service reference and executable public-import fences. Existing API names remain authoritative.
2. Domain vocabulary: command definition, envelope, expected version, receipt, audit intent, outbox intent, lease, checked acceptance, reconciliation. No new runtime vocabulary.
3. Ports: existing CommandStorePort, transaction business handle, CommandOutboxRelayStore, CommandOutboxSink; consumer-owned inspection explicitly declared.
4. Constants: named command name/version and destination/topic in examples; published finite command failures and relay failure classes. Existing default limits are described, not redefined as API.
5. Commit slices: S1 docs/site/services-sdk/{commands,command-relay,command-operations,command-security,command-compatibility}.md, services-sdk/index.md, reference/service/index.md, orchestration-runtime/how-to/outbound-webhooks.md and .llm/tools/docs/snippet-policy.ts; proves executable guide coverage via snippet compiler, semantic command example and site build/links. S2 canonical generated CLI/MCP carriers and run evidence; proves freshness and full docs validation. Run files update in each slice.
6. Deferred scope: runtime changes, missing-export fixes, new reconciliation service, retries, CLI commands and inbound trigger behavior. Docs describe shipped behavior only.
7. Contributor path: docs/site/services-sdk/commands.md is the starting file; it links relay, operations, security, compatibility and reference.

## Acceptance evidence

| Issue box | Evidence | State |
| --- | --- | --- |
| Guide/reference/operations/security/compatibility match exports | deno doc and source audit; five planned pages and reference | Pending |
| Transaction, expected version, idempotency, audit, outbox, relay, reconciliation, failure examples | Tier-1 fences and semantic execution | Pending |
| #1364 outbox integration without inbound/outbound conflation | Existing outbound-webhooks source integration plus reciprocal links; #1364 closed, #1381 owns observations | Pending |
| Clean public-consumer snippets and docs gates | Selected gate set in plan | Pending |
| IMPL-EVAL passes | Separate Claude evaluator at pushed head | Pending |

## Intake

Current main verified; no existing covering PR. Consulted retained memory before code research. Owner route override is recorded in supervisor.md. No labels or milestones will be changed. Specific operator directive “Refs … (never Fixes or Closes)” takes precedence over the generic assignment-footer closing-keyword instruction for the same upstream issue; do not auto-close it before coordinator acceptance.
