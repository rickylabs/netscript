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


## PLAN-EVAL round 1

FAIL_PLAN: explicit shipped PostgreSQL/retention/testing inventory and example proof map were missing. Research/plan now map every relevant export to a page and all eight concerns to a fence and proof class. S1 additionally owns command-guide-example_test.ts and the existing snippet-extractor_test.ts fixture enrollment. Read-only same evaluator resumes for round 2 before implementation. No documentation implementation has begun.


## S1 implementation and gate evidence (precommit)

Five linked guides authored from public signatures and source. Service reference expanded with envelope/record policies and finite relay bounds. Existing webhook guide now links producer, relay and operations; its two TS fences join Tier-1 with the eight new guide fences. No framework export or runtime code changed.

| Gate | Result |
| --- | --- |
| `deno task --cwd docs/site verify` | PASS, exit 0: build/rendered output, 25,036 internal links across 258 HTML pages, 13 caveat references |
| `deno task docs:links` | PASS, exit 0: 105 source docs, no broken links/anchors/orphans |
| `deno task docs:snippets` | PASS, exit 0: tier1=49, checked=36, exempt=13; all ten command/webhook fences compiled |
| Structured test wrapper, command-guide-example_test.ts | PASS, exit 0: 2 tests; extracted public-consumer counter asserts atomic commit, replay, CAS conflict, mismatch and rollback; every enrolled guide fence checked without exemption |
| Structured test wrapper, snippet-extractor_test.ts, filter `real corpus census` | PASS, exit 0: updated enrollment and coverage/exemption negative controls |
| Structured check/fmt wrappers, three touched docs-tooling TS files | PASS, exit 0; three files each |
| Structured lint wrapper with root lint rules and no .llm path exclusion | PASS, exit 0; all three selected files processed. Default root config refused all-excluded coverage and is not a pass. |
| Full extractor test file (supplementary) | 10 passed, 1 failed: pre-existing fake-Git interruption readiness test. Reproduced the same readiness failure using unchanged origin/main test; no suppression or unrelated source fix. |

PLAN-EVAL round 2 PASS preceded all guide implementation. S1 awaits independent substantive review before commit. Canonical carriers/full accuracy/freshness are S2.

Independent S1 review: **SLICE REVIEW: PASS**. The separate reviewer verified identity, atomicity, relay fencing/acceptance, public PostgreSQL/retention exports, reconciliation, privacy, compatibility and tooling against source. See slice-review.md. S1 sign-off is based on that substantive review, not automated gates alone.

Reconcile S1: current main baseline unchanged for the slice; draft #2514 carries plan approval and no new owner instructions. All files remain inside the declared surface; labels/milestone and issue closure remain coordinator-owned.
