# Slice 3 Review: composed publish readiness

## Review Route

- Requested opposite-family route: Fable.
- Availability result: unavailable (`model_not_found`).
- Canonical fallback: Claude Opus 4.8 medium, session `04ca3219-b714-4940-a107-bd876828f558`.
- Reviewer was independent of implementation and did not modify repository files.

## Initial Verdict

`SLICE_REVIEW_FAIL`

The reviewer found that the shared preparation refactor had orphaned the existing Markdown
version-pin audit. It also requested stronger evidence around partial registry failures,
publish-root derivation, and registry-absent-only first-publish checks.

## Repair

- Added `markdown-pins` as an ordered structured readiness row and a seeded stale-pin failure test.
- Kept discovered packages local until the complete registry scan succeeds so dependent checks skip
  on partial evidence.
- Derived versionless scan roots from intended plus effective publish members.
- Added explicit absent-versus-existing registry evidence proving only absent packages receive the
  first-publish checklist.

## Re-review Verdict

`SLICE_REVIEW_PASS`

The same independent reviewer confirmed all blocking findings were resolved, the focused suite
passed 19/19, and the live repository `publish:readiness` verdict passed with all eight checks. Two
non-blocking notes remain: the derived-root behavior is exercised by the live repository rather than
isolated independently in a unit test, and the pre-existing `check:scaffold-versions` task is
outside this gate's scope.
