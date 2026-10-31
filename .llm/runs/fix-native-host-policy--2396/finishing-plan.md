# Finishing #2396 / PR #2421 — mc009e-r3

Plan & Design — READY FOR REVIEW. Feature tier, Archetype 5 (plugin); native
public type closure only, with incoming main merged normally. Prior authored feature
source and all historical reviews stay intact. Baseline d3a52cb1bf09e9baf0faf857a76e5102fa3c60a4;
fetched main f6839463668c5dae4ca7234d26909e74e10b89c0.

## Research and locked decisions

Native MCP find_guidance(intent) then search_docs consulted. Prior memory identifies the
private-type-ref as an actual public closure regression: main #2492 added optional
ProcedureErrorCode to AuthzDecision. Both current singular facades omit that native type.
Original workers/streams signatures require all existing native names recursively.
Before applying the repair, run bounded scratch omission probes to check for redundant
names at current main. If any existing name is redundant, preserve 22/21 bounds. Otherwise
add only ProcedureErrorCode via export type from @netscript/service/auth and amend the two
named debt entries to exactly 23/22, with the #2492 cause, the same 2026-11-10 target, no
automatic extension and no further growth. No signature redesign or structural type copy.
Both numeric F-5 violations remain DEBT_ACCEPTED, never numeric PASS.

Merge current origin/main without rebase or force push; resolve carriers only using canonical
generators. Preserve all incoming debt and authored main source verbatim. Regenerate corpus,
prose, asset barrel and publish assets in dependency order if stale or conflicted.

## Slices and gates

One coherent finishing implementation slice (<30 authored files): two facades, two debt
entries, canonical carriers if required, and this run record. Before implementation require
independent PLAN-EVAL PASS. Before commit require separate read-only F-5 debt re-review and
substantive source review. Prove both real facades with deno doc --lint and structured
doc:lint; preserve and pass workers/tests/public/type-refs_test.ts; run the exact combined
testScope from reconciliation-gates.json via run-deno-test.ts with native --unstable-kv and
--allow-all. Run all four canonical freshness gates, quality:gate, scoped structured
check/lint/fmt on both facades, native plugin member publication dry-runs, and JSR audits.
Root check is retained for complete acceptance evidence. Gate commands use run-gate.ts
allowlisted receipts where available. Dirty-tree receipts attest the tested source, not
an untested future commit; the pushed-head evaluator verifies source equality.

Update worklog/context and sanitized finishing-gates.json in the implementation commit,
then push existing branch, post the slice evidence, review all current PR threads, and run
one owner-authorized exact-pushed-head IMPL-EVAL on the delta since d3a52cb1b. Keep final
verdict in the PR comment and excluded canonical report, avoiding a post-review commit
that would move its head. Existing PR is already ready; retain that state. Correct current
implementation-caused red CI if observed; never wait for hosted runtime arming.

## Risks, decisions and deferred scope

Must resolve now: ProcedureErrorCode transitively references PROCEDURE_ERROR_CODES.
After the normal main merge, repeat the scratch doc-lint probes before applying any repair.
Proceed only if the single approved type export reaches zero diagnostics at 23/22 names.
If any further name is required, STOP implementation, preserve the original debt bounds,
record the blocker and ask the coordinator for a disposition in the canonical BLOCKED
report. Do not add the constant (including as a type-only value export), redesign native
contracts, copy types, waive doc lint or grow the bounds by analogy. A merge-only checkpoint
may be committed/pushed with run evidence; do not claim accepted implementation or READY.
Risk:
extra export grows F-5 debt; exact inventory probes and independent debt review bound it.
Risk: stale generated corpus; canonical generators and all four freshness gates prove it.
Risk: transitive typeof closure exceeds approved scope; the explicit stop rule above applies.
Risk: upstream main changes runtime; the full retained combined suite proves the union.
No suppression, excluded subpath, changed assertion, added skip, cache/lock deletion or
leaf lock churn. No new dependency, runtime behavior or abstract port. Existing source
publications have recorded full-export baseline diagnostics; both singular facades must
be zero. Existing release-owned published graph debt remains honest and unchanged.
Hosted e2e-cli is required at the final head and coordinator-owned; local scaffold.runtime
is explicitly forbidden. READY reports pending/skipped CI as unproven, never green.
Only coordinator merges; no labels/milestones, new PR, tag or release.

## SKILL

netscript-harness; netscript-doctrine; netscript-tools; netscript-pr;
netscript-deno-toolchain; jsr-audit. Read their canonical instructions; do not read profiles/.
