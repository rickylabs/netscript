# Context Pack: typed SDK client contribution RFC

## Run Metadata

| Field          | Value                                                                   |
| -------------- | ----------------------------------------------------------------------- |
| Run ID         | `docs-rfc-sdk-client-contribution--rfc`                                 |
| Branch         | `docs/rfc-sdk-client-contribution`                                      |
| Current phase  | `plan-eval`; cycle-1 remediation ready for owner-directed Fable cycle 2 |
| Archetype      | `2 + 4 + 5 + 6` described; docs-only PR                                 |
| Scope overlays | `SCOPE-docs`                                                            |
| PR             | `https://github.com/rickylabs/netscript/pull/1390`                      |

## Current State

The RFC is authored at `rfcs/0000-sdk-client-contributions.md` and keeps `0000`/Draft. It rejects
the starting single “everything” envelope and ratifies a narrow, versioned request-header
preparation axis. Research, type proof, current JSR/doc-lint baselines, live board state, and
primary upstream sources are recorded. A root-requested post-generator audit amendment made the seam
explicitly upstream-major-neutral and separated the oRPC v2 migration. Formal Fable PLAN-EVAL cycle
1 then returned authoritative `FAIL_PLAN / CHANGES_REQUESTED`; this authoring pass resolves F-A1
through F-A10 without claiming PASS. No framework implementation is included; the only TypeScript
addition is a compile-only RFC type fixture.

## Decision Snapshot

- `defineSdkClientContribution<TContext>()` produces a named major-1 descriptor with a runtime
  required/optional context declaration, exclusive lower-case header ownership, mandatory cache
  effect, and async `prepare`.
- Literal tuples intersect context and diagnose duplicate id/context/header ownership; runtime
  repeats checks. Limit: 16 contributions/service.
- Each contributor sees the same immutable snapshot; successful composition is order-independent.
- Query-safe contributions are `invariant` or supply a synchronous non-secret id-sorted partition.
  `direct-only` service keys are omitted from generated query maps.
- Bearer auth is the first dogfood in `plugin-auth-core`; locale/`accept-language` is the non-auth
  proof.
- `NetScriptProcedureMeta.access.authentication` is `none | optional | required`; unmarked auth
  defaults to `none`.
- SDK transport retains discovery/codec/fetch/retry/dedupe/trace/errors. Trace fields are reserved;
  #1353 is a trace-ownership proof, not a contribution.
- Named new RFC-A declaration nodes and all generated client declarations contain zero raw oRPC
  symbols; existing `ContractLike`/contracts leakage is a non-growing #1350/#1278 baseline. Three
  internal NetScript ports live only at `packages/sdk/src/internal/client-contributions/`, with
  negative doc and packed-import gates.
- Contributors see only their declared-context projection plus signal; SDK retry/cache/trace/dedupe
  semantics and the private prepared-call channel remain transport-owned.
- Preparation runs once per unary logical-call epoch above retry; each ordinary retry sees
  byte-equivalent immutable contributor headers/context. Iterator-phase reconnect starts a fresh
  epoch and refreshes credentials. Outer wrapper versus memo remains an internal realization choice.
- Every widened public generic has an old-shape default. Default server keys remain exact
  three-tuples; partitioning adds one canonical two-element suffix for exact five-tuples through
  factories, cache bridge/persister/collections, and recursive TanStack wrappers.
- RFC-A is HTTP-only. Desktop MessagePort clients reject contribution selection in types,
  construction, and generation rather than silently omitting auth.
- RFC-A implements against stable v1 (optionally v1.15.0 after a separate lock-only whole-family
  decision). The v2 spike must choose preserve-current-GET with replacement inference plus
  `allowMethods`/CSRF or retire GET and replace dedupe; protocol/errors/OTel/serialization/streaming
  migration remains separate.
- The server request-header handler is only an optional incoming companion and may be absent for
  direct calls.
- Plugin discovery registers static module/export/targets; generated/app config explicitly selects
  contributions per service.
- Preparation failures are stable local errors, never server-defined contract errors.

## Files Changed

| Path                                                                    | Status      | Notes                                                             |
| ----------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------- |
| `rfcs/0000-sdk-client-contributions.md`                                 | new         | Cycle-1-remediated architecture RFC; no framework implementation. |
| `packages/sdk/tests/type-fixtures/sdk-client-contributions-rfc_type.ts` | new         | Compile-only real-surface inference/default/key proof.            |
| `.llm/runs/docs-rfc-sdk-client-contribution--rfc/`                      | updated/new | Mandatory harness evidence, formal verdict, and handoff records.  |

## Live Board Snapshot

- #1348 is open `status:triage`, milestone 0.0.6; it remains tracking and needs post-FCP body
  reconciliation.
- #1349–#1353 are open `status:triage`, milestone 0.0.7.
- #1093 is generic discovery; #451 remains sole custom-link owner.
- #928/#934 align protocol/metadata vocabulary at 0.0.9; #884 is a later tenant candidate.
- PR #1347 remains an open draft planning record and says it must not merge.
- No issue/milestone was mutated by this run.

## Gate Snapshot

| Gate                            | Status             | Evidence                                                                        |
| ------------------------------- | ------------------ | ------------------------------------------------------------------------------- |
| RFC formatting                  | pass               | `deno fmt --check`                                                              |
| RFC internal links              | pass               | focused repo link checker, 0 broken                                             |
| Repository docs links/accuracy  | pass               | both tasks exit 0                                                               |
| Type fixture                    | pass               | In-tree Deno check; real defaults/key shapes plus 16 accepted/17 rejected       |
| Package dry-run baseline        | pass               | contracts/sdk/plugin/auth-core all report dry-run OK                            |
| JSR package audit               | baseline finding   | plugin audit exit 1 on pre-existing module tags/cardinality; other three exit 0 |
| Doc-lint baseline               | baseline finding   | combined private refs 9/3/15/4 respectively; RFC adds none                      |
| Doctrine                        | pass               | `deno task arch:check` exits 0; existing warnings are baseline                  |
| PLAN-EVAL cycle 1               | fail/remediated    | Fable F-A1–F-A10 accepted; cycle-2 PASS remains external                        |
| Audit amendment evidence        | pass               | 59-line input hashed; 91/74 file scan; seven v1 dependencies behind to 1.15.0   |
| Audit amendment gates           | pass               | format, links, accuracy, type proof, doctrine, and diff hygiene                 |
| Pre-amendment PR reconciliation | pass               | draft, required labels, sole `status:plan-eval`, no milestone/closing keyword   |
| Cycle-1 remediation gates       | pass               | format/lint/type, RFC/repo links, accuracy, doctrine, and diff hygiene exit 0   |
| Cycle-2 PR reconciliation       | pending final step | final pushed HEAD and sole `status:plan-eval` will be recorded in phase comment |

## JSR Consequences

- No new contracts/SDK/plugin subpaths; root/client/ports/config symbols expand.
- Auth core adds `./sdk` and possibly a constrained `./sdk/server` export.
- No oRPC identity may leak into the named new RFC-A protocol nodes or generated client
  declarations.
- The implementation gate uses symbol-filtered `deno doc --json` on the new nodes plus a full
  generated-declaration scan; unchanged `ContractLike`/contracts leakage is allowlisted only under
  #1350/#1278 and cannot grow.
- Private adapter identifiers must be absent from SDK root/client/ports/desktop docs and fail packed
  consumer imports from both root and guessed subpaths.
- Implementation must reduce or isolate existing private-type references, preserve precise error and
  metadata types, and pass doc-lint/publish/consumer gates.

## Board Reconciliation Proposal (no mutation yet)

1. Amend #1348 acceptance to the narrow header/context/cache law after RFC acceptance.
2. Narrow #1349 to descriptor/composer/context/query-safety work.
3. Keep #1350's filed `safe()` error repair as Stage 1a; Stage 0 must either explicitly expand it or
   select a dependent Stage 1b owner for procedure metadata. Keep #1351 SDK-owned transport
   consolidation.
4. Place bearer convention in auth core under #1352.
5. Re-scope #1353 to final trace injection/reserved-key conformance.
6. File a locale proof child only after acceptance.
7. Cross-link #1093 and keep #451 independent.
8. Propose, but do not file in this run, a separate oRPC v2 migration RFC/spike with stable/beta,
   atomic family, rollout/endpoints, route/meta/OpenAPI/Scalar, error/status, middleware-count,
   replacement method inference, `allowMethods`/GET/CSRF, dedupe effectiveness, OTel topology,
   Desktop MessagePort serialization, SSE/reconnect credentials, cache, runtime matrix,
   package/CLI/scaffold E2E, docs snippets, and publish gates.

## External Reviewer Entry Point

Read, in order:

1. `plan-eval.md` in full as the authoritative cycle-1 finding set;
2. `rfcs/0000-sdk-client-contributions.md`, checking F-A1 through F-A10 against its normative laws
   and gates;
3. `packages/sdk/tests/type-fixtures/sdk-client-contributions-rfc_type.ts`;
4. `research.md` formal-amendment table and API/board evidence;
5. `plan.md` locked decisions, gates, and issue reconciliation;
6. `worklog.md` Design and gate results;
7. `drift.md` for formal evaluator drift and owner-authorized routing; and
8. `.llm/tmp/orpc-v2-audit-followup.md` as the earlier root-requested research input.

The reviewer must not implement product code, assign an RFC number, merge, close issues, or mutate
milestones. Findings should cite RFC headings and classify blocking versus safe FCP feedback.

## Commits

- Bootstrap: `158849031bba78025d0ec16c8361628211fbc4ed`.
- RFC/research: `89ae608ea935ba8b2776d55e7cb5a09cc29e2520`.
- Handoff baseline: `e78ac0a65f5475ed37152272b16ba7d89deca8c3`.
- Audit amendment: `7a0d398087a6608ff1a55bb9fe4c47158edb72a7`.
- Formal evaluator artifact: `f1a29fe1a65d59f71a59bf4b6b2a48fc49e1e86f`.
- Cycle-1 remediation: `78a7cecd1d5eaafa7a65bc25a21af497567128dc`.
- The final handoff commit is recorded here after creation; the PR comment records the final pushed
  HEAD because an artifact cannot contain its own commit id.
