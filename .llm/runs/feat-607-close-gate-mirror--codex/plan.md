# Plan — #607 close-gate evidence mirror

- Surface: repository validation tooling and CI (Archetype 6/tooling; no package/public JSR surface).
- Overlay: docs for the canonical PR skill and generated Claude mirror.
- PLAN-EVAL: owner-waived in the slice brief; recorded as drift D1.

## Locked decisions

1. Share pure markdown parsing/mapping logic between the checker and mirror.
2. Accept `## Acceptance evidence` sections from the PR body and PR issue comments.
3. Require one verbatim evidence line for every currently unchecked close-gated box; reject unknown
   or duplicate evidence lines before any mutation.
4. Patch only issues reached through PR closing keywords, then post one provenance comment per
   changed issue. `--dry-run` performs all reads and validation but no writes.
5. Run the mirror only for `status:ready-merge`, immediately before the independent close-gate.

## Open-decision sweep

- None. All mutation, trigger, matching, and provenance choices are locked.

## Risks

| Risk | Mitigation |
| --- | --- |
| Partial issue mutation | Validate all mappings before the first PATCH. |
| Comment syntax ambiguity | Parse only checkbox lines inside the exact Acceptance evidence heading. |
| CI race | Mirror and close-gate execute sequentially in one job. |
| Umbrella mutation | Only closing-keyword references are candidates. |

## Deferred scope

- Evidence-quality judgment remains evaluator/coordinator responsibility.
- No general label/Project lifecycle automation.

## Gates

- Focused unit tests; scoped check/lint/fmt wrappers; existing validation tests; Claude mirror sync
  check; workflow YAML validation when available; real PR dry-run.
