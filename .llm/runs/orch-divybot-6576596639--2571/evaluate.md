# Evaluation: Northwind showcase — #2571

## Metadata

| Field | Value |
| --- | --- |
| Target | [PR #2595](https://github.com/rickylabs/netscript/pull/2595) |
| Candidate | `350b328ee0b31ce79cec1dac1498112aca658446` |
| CI-tested source | `04149cb48ee54101f87773c5d4cab5229bc01103` |
| Archetype | 6 — CLI/tooling |
| Scope overlays | Frontend, service |
| Evaluation | Same independent read-only evaluator; terminal round 2 |
| Date | 2026-11-02 |

GitHub source, comparison, tree identities, PR metadata and review threads were independently inspected through read-only MCP. Tests were not independently rerun. Previously accepted runtime, consumer and visual evidence remains applicable because the relevant source trees are unchanged.

## Process Verification

| Check | Result | Evidence |
| --- | --- | --- |
| Planning and Design checkpoint | PASS | Previously reviewed planning commit, justified `PLAN-EVAL: N/A`, and worklog Design section. |
| Slice history and reviews | PASS | Previously verified commit trail and S1/S2 source reviews; retained first formal evaluation. |
| Repair scope | PASS | Independent comparison contains only run evidence, CLI README prose and the central debt entry. |
| Plan/context reconciliation | PASS | Committed plan, context, drift and worklog accept the precise bounded debt and supersede earlier contradictory claims. |
| PR constraints | PASS | Independently verified exact candidate, draft, Refs-only, no labels and milestone `0.0.9`. |
| Review threads | PASS | GitHub returned no review threads. |
| Issue-closing merge gate | N/A | Owner requests a READY handoff while retaining the draft PR. |

## D1 Closure

| Requirement | Result | Evidence |
| --- | --- | --- |
| Accurate measured growth | PASS | Independently recounted adapters **18→19** and scaffold gates **93→94**; each adds only `showcase/`. |
| Bounded central debt entry | PASS | [`cli-showcase-cardinality-2571`](https://github.com/rickylabs/netscript/blob/350b328ee0b31ce79cec1dac1498112aca658446/.llm/harness/debt/arch-debt.md#packagescli--showcase-adapter-and-scaffold-gate-cardinality-cli-showcase-cardinality-2571) records reason, cost, owners, target, linked plan, status and closure gates. |
| Matching README deviation | PASS | [Archetype 6 v2 deviations](https://github.com/rickylabs/netscript/blob/350b328ee0b31ce79cec1dac1498112aca658446/packages/cli/README.md#archetype-6-v2-deviations) matches both locations and bounds the exception. Relative target and heading anchor verified. |
| Existing debt preserved | PASS | Historical scaffold debt remains open; the repair correctly distinguishes the already-split registry from remaining directory cardinality. |
| Further-growth stop condition | PASS | Another adapter or scaffold-gate family requires organization of the affected parent first. |
| Historical claims reconciled | PASS | Plan and run context explicitly acknowledge the accepted growth. |

**D1 is closed.** The physical cardinality excess remains documented debt; it is not represented as structural remediation.

## Static Gates

| Gate | Result | Evidence and basis |
| --- | --- | --- |
| Root structured typecheck | PASS | Retained exact-source receipt: 4,218 files, 36 batches, exit 0. |
| All 16 configured root checks | PASS | Retained `gate-evidence.json`, including carrier freshness and provider boundary. |
| CLI lint and format | PASS | Retained structured results: 1,284 linted and 1,156 formatted files. |
| Quality/architecture and CLI quality | PASS | Retained exact-source receipts. Repair worklog additionally reports `arch:check` exit 0. |
| Focused regressions | PASS | Retained structured report: 96 passed, zero failed or ignored. |
| Publish dry-run | PASS | Retained exact-source receipt, exit 0. |
| Complete CLI export doc-lint | PASS | Committed structured report covers `mod.ts`, `scaffolding.ts` and `testing.ts`: all exit 0, zero diagnostics. Execution is supplied evidence. |
| Repair links and scope | PASS | Independently inspected debt entry, README anchor and complete comparison. |

No functional gate rerun is claimed for the prose/evidence repair.

## Fitness and Anti-Pattern Checks

| Check | Result | Evidence |
| --- | --- | --- |
| Previously accepted F-1–F-6, F-8–F-15, F-18–F-19 assessments | PASS | Retained source review, structured receipts and consumer/runtime evidence; applicable source unchanged. |
| F-7 — CLI documentation score | PASS | Complete three-entrypoint doc-lint report now records zero diagnostics. This does not automatically close historical registry entries. |
| **F-16 / R-FOLD-CARD** | **DEBT_ACCEPTED** | Bounded central entry and matching README deviation cover both measured additions. |
| F-17 — abstract co-location | N/A | No abstract/concrete family introduced or moved. |
| Dedicated F-CLI scripts | PENDING_SCRIPT | Retained profile-specific manual evidence and composite architecture results. |
| **AP-21 / cardinality assessment** | **DEBT_ACCEPTED** | D1 bookkeeping now satisfies the selected archetype’s exception requirements. |
| Other applicable AP checks | PASS | Prior CLEAR assessments retained; repair introduces no implementation changes. |

## Runtime Gates

| Gate | Result | Evidence |
| --- | --- | --- |
| Postgres `scaffold.runtime` | PASS | Previously independently inspected [job logs](https://github.com/rickylabs/netscript/actions/runs/41465808061/job/125346649654): 124 passed, zero failed or skipped, including cleanup. |
| SQLite runtime and showcase | PASS | Previously independently inspected [job logs](https://github.com/rickylabs/netscript/actions/runs/41465808061/job/125346649705): SQLite 116/116; showcase 8/8, including cleanup. |
| Chat source and mounted browser | PASS | Previously verified successful CI step; supplied reports show two outer tests and 21 internal scenarios passing. |
| Replay and access boundaries | PASS | Retained browser evidence: first send, unused-thread reopening, exact-offset resume, native message/tool replay and auth/origin denial. |
| Static scaffold CI | PASS | Previously verified successful exact-source job. |
| Desktop | DEBT_ACCEPTED | Existing active #859 exception boundary remains explicit. |
| Lane visibility | N/A | Policy-skipped; required runtime jobs ran. |
| External model/OAuth providers | NOT_RUN | Real credentials were not used; acceptance covers fixtures and native application boundaries. |
| Release publication | N/A | Outside this leaf’s scope. |

The [CI run](https://github.com/rickylabs/netscript/actions/runs/41465808061) was independently reconfirmed successful at `04149cb…`, attempt 1. It is reused through verified source identity, not described as a run at the repair commit.

## Consumer Gates

| Consumer | Result | Evidence |
| --- | --- | --- |
| Default init | PASS | Retained 220/220 byte-identical control, including agents, at the same destination without normalization or exclusions. |
| Packed production application | PASS | Retained actual client/server builds against 29 packed packages, compiled exports and closed aliases, without copied source vendors. |
| Mounted generated chat | PASS | Retained actual emitted island and registry-component browser regression. |
| Visual acceptance | PASS | Retained independent Astra report: all 60 combinations score at least 8/10, with 12 viewport proofs. This evaluator did not repeat the pixel review. |
| Existing CLI inspection permissions | PASS | Retained regression evidence; source and tests are unchanged. |

## Source Identity Verification

All following objects independently match between the repair candidate and CI-tested source:

| Surface | Matching Git object |
| --- | --- |
| `packages/cli/src` | `d9919000633e4e0bd37fc336ce7906bd64d333e7` |
| `packages/cli/e2e` | `c814028109d3f9decde9bde036e2cdaba19c1445` |
| `packages/cli/tests` | `b48cfaf9cc0338276b2c4d20ede40df8f91b6c9e` |
| `plugins` | `69a932b52040e14abd28939e18c1258a827e5b7f` |
| `.github` | `b93b11faa505bbcef1c00da97475f7c3fbb33c39` |
| `docs` | `3057e82801898dfac924c0edd185d042f5873dad` |
| `deno.json` | `d825215dc5f341dc93fd3a64073d0e6212da231f` |
| `deno.lock` | `e7cab3e1513951964a27e498f758cf6263b6a08b` |
| `.llm/tools` | `9e4528c107406a3b3c948c3dcc03abd2123a75be` |

The whole `packages` and CLI package trees **do change** because README prose changes. Equality is established for the source/test trees above.

## Arch-Debt Delta

| Metric | Count | Evidence |
| --- | ---: | --- |
| New recorded entries | 1 | `cli-showcase-cardinality-2571` |
| Physical locations covered | 2 | Adapters 18→19; scaffold gates 93→94 |
| Existing entries resolved | 0 | Historical scaffold debt remains open |
| Unrecorded introduced/deepened violations | 0 | D1’s two location deltas are now explicitly covered |

## Findings

No remaining blocking findings. The sole first-round finding, D1, is closed through verified debt bookkeeping.

## Verdict

| Field | Value |
| --- | --- |
| **Verdict** | **PASS** |
| Rationale | D1 is fully documented and bounded. Previously accepted functional, runtime, consumer and visual evidence remains applicable through independently verified source identity. |
| Handoff | Formal IMPL-EVAL is complete for `350b328…`. Proceed with the owner’s READY handoff. A subsequent verdict/resume-only commit requires source-identity verification; merge and publication remain outside this evaluation. |
