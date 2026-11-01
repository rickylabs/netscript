# Plan & Design — READY FOR REVIEW

Implement #2562 by extending the mirror's existing orchestration and client port.
Keep the parser, mapping validator, checkbox renderer, retry path, and provenance format.

1. Bootstrap this run and open a draft PR on the dispatch branch.
2. Add behavioral tests first and capture the failing baseline through the test wrapper.
3. Add explicit issue selection, merged-state and main-ancestry preconditions, and
   dry-run-by-default CLI parsing. Retain existing CI defaults without `--issue`.
4. Verify focused tests, scoped check/lint/fmt, relevant policy checks, and the three
   required live dry-runs. Publish their exact output, including safe refusals.
5. Obtain a separate read-only Claude Opus evaluation; fix findings in the same lane.
6. Commit/push, mark the PR ready, and hand off READY only after required checks are
   green or skipped by workflow policy. Cockpit owns merge.

PLAN-EVAL: N/A. The owner fixed the contract and seams; this small extension has no
unresolved architecture decisions. Mandatory independent IMPL-EVAL remains selected.

## Risks and locked decisions

- Regressing CI: pin label-gated, closing-reference-only behavior and write default.
- Squashed heads: check every cited SHA in selected evidence, including checked boxes;
  fail closed for unreachable or ambiguous commits. Compare SHA to literal `main`.
- False SHA matches: recognize 7–40 digit hexadecimal citations and 4–40 digit explicitly labelled citations; ordinary numeric run
  IDs are not implicit commits. Explicit commit links and SHA/commit labels allow
  numeric-only hashes. Deduplicate checks. No SHA requirement is added to the grammar.
- Comment pagination: read all pages so later evidence is reachable.
- Concurrent issue edits: continue using the existing fresh-body validation and retry.
- Public privacy: store only repository-relative paths in tracked run artifacts.
- Deferred: parser #1964, post-merge checkbox semantics, evidence authoring changes,
  automatic issue closure, workflow/label changes, and any real `--apply` invocation.

Contributor entrypoint: `.llm/tools/validation/mirror-acceptance-evidence.ts`.
