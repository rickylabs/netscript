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
