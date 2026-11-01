# Worklog

## Design

1. Public surface: `--repo owner/name --issue n --pr m [--apply] [--pretty]`.
   Default output previews changes; CI calls without `--issue` retain their behavior.
2. Domain vocabulary: explicit issue target, merged PR, cited SHA, main ancestry,
   proposed checkbox update, existing provenance snapshot.
3. Ports: existing `MirrorClient` plus a commit-ancestry query; GitHub compare is the
   production adapter. Tests supply deterministic clients/fetch responses.
4. Constants: ready label and retry budget remain; name the main branch, SHA matching
   rules, and comments page size at their single policy point.
5. Commit slices: S0 run bootstrap (this directory; plan inspection); S1 implementation
   and red/green regression coverage (the two declared mirror files plus this run;
   focused tests, structured check/lint/fmt, policy scans, real dry-runs, independent
   review); S2 final evidence and delivery (this run and dated lesson; CI review).
6. Deferred scope: parser grammar fixes, automatic issue closure, workflow edits,
   post-merge-only box policy, and applying real issue mutations belong elsewhere.
7. Contributor path: `.llm/tools/validation/mirror-acceptance-evidence.ts`.

## Routing and process

The matrix was queried as JSON at feature tier. Owner grant, verbatim:
“IMPL-EVAL: `claude -p --model claude-opus-5-5 --effort high`, read-only.”
This overrides the evaluator cell while preserving session and vendor independence.
The supplied leaf's two consecutive terminal-failure limit applies. No private
session identifiers will be published.

PLAN-EVAL: N/A, with rationale in `plan.md`, recorded before implementation.
The operator's specific no-label, Refs-only, stop-at-READY contract takes precedence
over generic assignment-footer and repository labeling conventions.

## Evidence

| Stage | Result |
| --- | --- |
| Bootstrap | Baseline clean; no duplicate PR; memory and relevant guidance read |
| S0 reconciliation | Declared surface matches assignment; no implementation yet |

## S1 implementation evidence

- Added behavioral tests before implementation. Wrapper baseline: 0 passed, 1 failed,
  exit 1 (`--no-check --filter 'post-merge reads comment evidence'` because the new
  contract was not yet typed). Failure: old CI path returns no dry-run default.
- Implemented selected-issue mode, merged guard, SHA ancestry guard, comment pagination,
  safe CLI defaults, and unchanged CI evidence/provenance path.
- Green wrapper: 50 passed, 0 failed (mirror, parser, close-gate tests), exit 0.
- Structured check and format: 2 files processed, zero findings, exit 0.
- Root lint explicitly excludes `.llm/`; wrapper correctly refused with `all-excluded`
  (exit 2). Repeated through the same wrapper with a private explicit config retaining
  root lint rules and removing selection exclusions: 2 files processed, zero findings,
  exit 0. No lint ignores or repository config changes.
- `release:preflight`, `check:netscript-jsr-specifiers`, `check:aspire-host-ports`,
  `check:aspire-version-parity`: exit 0. No check task targets this mirror specifically.
- Three required live dry-runs: exit 1 with safe data refusals; full output in
  `real-data-dry-runs.md`. Zero real issue mutations.
- Independent IMPL-EVAL pending.

## Independent review, first pass

Opus 5.5 (observed model matches request), separate read-only evaluator: PASS, no
blockers; independently ran all 50 tests. The reviewer noted optional citation
hardening. Before sign-off, extended explicit SHA recognition to `Merged as`,
`/commits/`, and short Git abbreviations (4–6 digits) following explicit labels.
Added these cases to the existing citation test; ordinary numeric run IDs remain
excluded. Same evaluator will re-review this narrow change. Other optional ideas
(base-branch policy, PR-number target exclusion, and skill documentation) are outside
the specified acceptance contract and remain deferred.

## S1 sign-off and reconciliation

- Same-session independent follow-up: PASS. The reviewer independently reran all
  50 tests and confirmed no other implementation changes. Final scoped check, lint
  and format also pass after citation hardening.
- Evaluated file hashes are recorded in `evaluate.md`; code is committed unchanged.
- Remote main still equals the baseline; no merge/conflict resolution is needed.
- Declared write surface matches the delta. No dependency/lock/generated changes,
  public host paths, session identifiers, or assignment-file additions.
- No runtime resources were started; ownership ambiguity/leak cleanup does not apply.
- Remaining delivery is GitHub metadata only: push normally, mark ready, inspect the
  current required checks, then queue the final READY report for Cockpit. No merge.
