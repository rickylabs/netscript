# Native source repair — Plan & Design READY FOR REVIEW

Authority: coordinator #2474 comment6541660112, superseding the finishing stop condition.
Baseline4771da92972ac90c9cb4188ef9d043c628e1e73c already integrates mainf6839463.
Feature tier; Archetype4 native contract +Archetype5 plugin identity closure. Native MCP
find_guidance and search_docs consulted. This phase resumes the same independent reviewer
sessions under the newly authorized native source scope; old reviews remain immutable.

## Locked contract and one slice

Declare ProcedureErrorCode before the constant as exactly 'procedure_not_found' |
'procedure_retired'. Keep PROCEDURE_ERROR_CODES keys, readonly properties and literal values
identical, adding as const satisfies Record<string,ProcedureErrorCode>. No runtime or public
symbol changes. Extend the existing public root/auth procedure-availability test to assert
exact equality of the union and constant values, exact legacy literal union and const shape,
and public root/auth identities. Use @std/testing/types assertType/IsExact (existing workspace
std dependency) and the existing runtime root/auth identity check; no suppressions.

Add only ProcedureErrorCode as native identity type re-export to both singular facades;
update comments and the two named F-5 entries to EXACTLY23/22 names (21/20 native names).
State #2492 changed AuthzDecision, keep2026-11-10, no automatic extension/further growth.
Numeric F-5 remains DEBT_ACCEPTED; doc lint must be zero. Independent debt re-review follows.

## Public API proof

Capture all service exported entrypoint doc snapshots BEFORE edits using the existing
surface-diff.ts snapshotDocJson API. Repeat afterwards and use diffSurfaceSnapshots to report
EVERY raw syntax/signature hash change. A derived alias-to-union declaration is expected to
change syntax hashes at root/auth; do not conceal or relabel that. Prove semantic identity
with exact compiler assertions of the previous literal union/const shape, native root/auth
identity, unchanged exported names and no other signature changes. Report both raw changes
and compiler evidence. If any actual exported service name, value, readonly/literal type or
consumer behavior changes, STOP source repair; use only the coordinator-authorized24/23
fallback after recording why. Never call a syntactic alias rewrite alone a semantic break.

## Gates and commit

Before code: independent PLAN-EVAL on this NEWLY AUTHORIZED repair phase. One implementation
slice: native types, existing native test, two facades, the two debt entries, generated corpus
if stale and run evidence. Run both raw deno doc --lint and structured doc:lint on actual
facades; public type-refs_test unchanged must pass. Full service doc lint; full combined
suite EXACT testScope in reconciliation-gates.json via structured wrapper, --unstable-kv,
--allow-all; root check; scoped structured check/lint/fmt for four source/test owners; full
quality:gate; four canonical carrier freshness checks; service/workers/streams publication
dry-runs and JSR audit. Use run-gate.ts receipts for allowlisted gates; preserve exact exit
codes and honest ignored-control counts. Regenerate carriers only with canonical generators.

Separate read-only F-5 debt review checks amended entries and23/22 inventory. Substantive
review before commit, then commit/push existing branch with worklog/context; no force push,
rebase, new PR, labels/milestones or local scaffold.runtime. Same-session final IMPL-EVAL at
exact pushed head examines total delta since d3a52cb1b, including native source repair. Post
verdict and honest CI state. READY means delivered local source for coordinator runtime
arming; no skipped/pending hosted gate or actual published canary graph is claimed green.

## Risks and deferred scope

No open design decisions beyond measured API compatibility. Exact equality prevents widening
or enum drift; full public diff catches collateral signature changes; native procedure runtime
tests preserve404/410 semantics. No facade copies, suppression, subpath exclusion or test
weakening. No #829/#2364 redesign. Published graph remains existing release-owned first-canary
debt before stable. Hosted runtime remains coordinator-owned and required before merge.

## SKILL

netscript-harness, netscript-doctrine, netscript-tools, netscript-pr,
netscript-deno-toolchain, jsr-audit. Do not read profiles/.
