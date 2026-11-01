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

## Repair S3 design checkpoint

Coordinator requested repairs for exact-head review comment
https://github.com/rickylabs/netscript/pull/2564#issuecomment-6556142159.

1. Public surface: named refusal for absent body/commit association and mismatched
   repository; explicit partial-state reporting after a successful checkbox PATCH.
2. Vocabulary: canonical repository, associated issue reference, provenance marker,
   confirmed comment, partial write.
3. Ports: MirrorClient adds paginated PR commit messages; repo metadata comes from
   normal issue/PR REST responses; comments retain the existing pagination flag.
4. Constants: named policy errors and bounded provenance attempts.
5. Commit slice S3: three validation files and run artifacts; red controls, focused
   tests, scoped wrappers, policy checks, independent review and CI prove the repair.
6. Deferred: shared parser grammar redesign and real issue/evidence mutations.
7. Contributor entry: mirror-acceptance-evidence.ts routes to the post-merge policy.

PLAN-EVAL N/A: fixed owner/coordinator contract, no unresolved architecture choices.
Owner/coordinator authorizes: “IMPL-EVAL with Opus read-only, then READY on #2562 with
the head once CI is green or policy-skipped.” Keep the same evaluation session.
Previous READY/evaluation at 83f0b63 is superseded until this repair is verified.

## S3 implementation and local gates

- Reproduced all repair findings before edits: 11 red controls failed, 2 positive
  controls passed. Full red details are retained privately.
- Added a separate red pagination control at commit 251; corrected the adapter to
  cursor-paginate the PR's own GraphQL commit connection.
- Current focused wrapper: 68 passed, 0 failed, exit 0. Source check/lint/fmt each
  cover three files and pass. Policy checks and release preflight pass.
- Re-ran all three live dry-runs without apply; same safe data refusals. Exact output
  is in repair-real-data-dry-runs.md. Live GraphQL adapter read three commits from
  merged PR #2558, confirming the production read query works.
- Provenance failures retry after checking all comment pages; exhaustion preserves
  the confirmed PATCH/snapshot and returns post-merge-provenance-incomplete.
- Fresh issue ownership is checked again immediately before PATCH. Fork head repos
  are permitted because PR ownership comes from the base repository.
- Independent Opus repair evaluation pending; PR is draft to supersede old READY.

## S3 independent review and bounded follow-ups

- Same-session Opus repair review: PASS for all three coordinator requirements,
  independently ran 68 tests.
- Widened named evidence ownership checks to Actions/blob/compare/root GitHub URLs.
  Existing foreign-link control failed before the change, then passed. Same-session
  follow-up PASS independently verified the delta.
- Added red controls for root URLs followed by text/Markdown delimiters and for
  non-repository GitHub upload/org/advisory routes; corrected boundary recognition
  and excluded those site routes from ownership inference. Final focused suite:
  69 passed. Scoped check/lint/fmt remain green for three files.
- Final same-session read-only Opus verdict pending. No source changes after that
  final review will be committed without renewed evaluation.

## S3 final sign-off and reconciliation

- Final same-session Opus verdict: PASS. Independently ran 69 tests; source check
  and format independently clean. Final reviewed hashes are in repair-evaluate.md.
- All scoped wrapper gates pass on those files. The source will be committed unchanged.
- Repeated the three live dry-runs on the final reviewed source; same safe refusals
  with zero writes, recorded in repair-real-data-dry-runs.md.
- origin/main advanced on unrelated source; no validation-tool commits overlap the
  repair and GitHub reports the PR mergeable. No conflict integration is needed.
- Declared scope matches the delta; no locks, shared parser, workflow or generated
  source changed. Public run paths are repository-relative. No runtime resources
  were started. No architectural debt introduced.
- Remaining delivery: normal commit/push, mark ready, verify fresh-head required
  checks, then canonical READY report-file handoff. Cockpit owns merge.
