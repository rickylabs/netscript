# Worklog

## Design

1. Public surface: `createContractAuthorizer(contract, { retiredPaths })`, `AuthzDecision.code`,
   `PROCEDURE_ERROR_CODES`, derived `ProcedureErrorCode`; existing root and auth subpaths. `ProcedurePolicyResolution` gains an optional public
   `retired?: true` matched-branch marker (overlay authorizers never set it), with JSDoc,
   full-export doc lint and reference coverage.
2. Domain vocabulary: missing procedure (404 `procedure_not_found`), retired procedure (410
   `procedure_retired`), exact mounted retired path, resolver retirement marker.
3. Ports: existing AuthenticatorPort, AuthorizerPort and ProcedurePolicyResolver; Hono is the HTTP
   adapter. Composition root stays the service builder. No new port or external IO.
4. Constants: PROCEDURE_ERROR_CODES for stable wire values; internal frozen retired auth policy
   and retirement validation error prefix. No new lifecycle or resource ownership.
5. Commit slices: bootstrap; cohesive implementation+tests+docs proven by scoped and broad gates;
   evidence handoff. See plan.md for exact file surface and validation.
6. Deferred: parameterized retired routes, automatic alias retirement, SDK-specific UI/errors,
   scaffold changes and local E2E; no requirement needs these.
7. Contributor path: packages/service/src/auth/contract/contract-authorizer.ts shows resolution
   precedence and links the retirement compiler. README explains application declaration.

## Routing owner override

Verbatim: “Run PLAN-EVAL before implementing and IMPL-EVAL after, both in a separate session with
claude -p --model claude-opus-5-5 --effort high, read-only, stdin closed, blockers only.”
Matrix feature lookup completed; this explicit grant selects the evaluator, not an inferred
fallback. Generator and evaluator remain separate sessions and vendor families.

## Bootstrap

Read assignment in full. Specific operator directives take precedence over contradictory generic
footer guidance: PR starts with Refs, no closing keyword; no labels or milestones; canonical final
uses the excluded report handoff. No implementation before PLAN-EVAL PASS.

## Baseline evidence

- Structured auth suite: 220 passed, zero failed, zero ignored.
- Repository quality:gate receipt: PASS, exit 0 (before source changes).
- Draft PR: https://github.com/rickylabs/netscript/pull/2492, bootstrap head
  7d27bf03c53f6a7d705798ea38274ec1db226700.
- Reconcile: issue remains open; no prior covering PR; no labels/milestones changed.
- Owning package archetype aligned to doctrine table: Archetype 4, Refactor; auth integration
  stays inside existing builder package. No public export keys or runtime permissions change.

Planned regression matrix: REST/RPC/custom alias unknown; declared retired REST/RPC/raw paths;
missing/invalid credentials; authz-only missing principal; denyByDefault false; active scope and
role denials; raw and internal guard precedence; exact path/query/encoding variants; declaration
validation and snapshot; fallback cannot revive a retired endpoint; handler invocation counters.

## PLAN-EVAL cycle 1

FAIL_PLAN: documentation/consumer validation was underspecified and the public resolver marker
was not in the surface inventory. Plan now names the docs-executing tests, exports drift, snippet
and README compilation gates, root/auth consumer checks, and public marker documentation.
The owning package archetype was corrected to Archetype 4 from the doctrine table.
No implementation started. Re-steer the same reviewer for cycle 2.

## PLAN-EVAL cycle 2

PASS before source implementation. Same independent Claude session reviewed the corrected plan;
see plan-eval-round-2.md. Generated docs carrier refresh is main-branch workflow owned and outside
this leaf's surface, as confirmed by the evaluator.

## Implementation progress

Structured full auth suite now passes 231 results (baseline 220), zero failures or ignored tests.
New cases exercise typed REST/RPC/alias failures, explicit retirement, authentication refusal,
active/raw/internal precedence, exact raw matching, snapshots, fail-open options, and validation.

## Slice 1 local gates

| Gate | Result |
| --- | --- |
| Structured service package check | PASS, zero diagnostics |
| Structured auth source/tests + root lint | PASS, zero diagnostics |
| Structured auth source/tests + root format | PASS, 38 files, zero findings |
| Structured auth suite | PASS, 231 results, zero ignored |
| Documentation executable tests + plugin service consumer | PASS, 11 results |
| quality:gate | PASS, exit 0; repo dependency and doctrine checks included |
| Service full-export doc:lint | PASS, all eight entrypoints, zero diagnostics |
| Service member publish:dry-run | PASS, exit 0, dry run complete |
| JSR package audit | PASS, no WARN/FAIL; member dry-run reported separately |
| deps:prod-install | PASS, exit 0 |
| docs:exports-drift | PASS, exit 0 |
| docs:snippets | PASS, exit 0, full corpus compilation |
| docs:readme-fences | PASS, exit 0; existing ratchet reports 5 type errors in 4 unrelated READMEs |
| Reverted-fix negative control | EXPECTED FAIL: two tests, 403 instead of 404/410; restored byte-for-byte |

See gate-evidence.json for compact report hashes and negative-control.md for the reproduction.
Raw reports remain private because tool reports contain environment paths. No raw receipt here is
claimed to certify a clean committed head: final review and CI bind the pushed implementation.
No local scaffold.runtime was launched. Runtime auth wiring still requires coordinator-armed
e2e-cli CI evidence before merge.

Restored **full service suite: PASS, 642 results, zero failures, zero ignored**, wrapper exit 0.
This includes auth, CORS, lifecycle, builder, command and middleware regressions.

Slice reconciliation: issue #2290 remains open; draft PR #2492 still references it without a
closing keyword per operator instruction. No labels or milestone were changed. No foreign
resources were touched. No lock-file delta or unrelated source change is present.

Documentation corpus details: docs:snippets PASS (671 scanned fences, 26 compiled in the owned
floor, 13 documented exemptions, no malformed blocks). docs:exports-drift PASS (35/35 reference
pages). README gate checked 104 TypeScript-like fences with no new exemption or syntax failure.
JSR audit initially lacked --allow-write for its requested output and was rerun with that required
permission; final exit 0, no WARN/FAIL. No implementation was changed to pass the audit.

Latest-main reconciliation: origin/main advanced to ad252e8c8ce14b05390d70d94fa876ae81376958.
Fetching and comparing against the run baseline found no intervening changes to packages/service,
the service reference, or the route-authz tutorial. No merge/rebase or force-push was needed.

## Independent slice sign-off

IMPL-EVAL round 1: PASS, no blockers; independent Claude Opus 5.5 high session. The reviewer
reran auth tests (149 top-level tests, 231 including steps), public checks/doc lint, service dry-run
and documentation/plugin consumers (11 passed). Full visible review is evaluate.md.

Addressed nonblocking evidence/docs notes before sign-off: gate-evidence.json now records the
observed successful check/format/audit process exits, and the JSR audit records inspected file and
entrypoint counts plus its empty finding list (the tool emits findings only, not PASS rows). The
restored full service pass is 642 results. Tutorial API-table wording now names 404/410, and the
CHANGELOG duplicate blank line was removed. Live-route precedence remains the approved contract;
rejecting retired/live overlap is intentionally not added. No source behavior changed after review.

Reconcile: all issue acceptance bullets have local proof; exact pushed-head review and coordinator
CI E2E remain separate. Sign-off commit includes the run record with implementation and evidence.
