use harness

# S3 Fable review — P3 auth-guarded spec fixture and wording

You are the separate opposite-family slice reviewer. Work only in
`/home/codex/repos/ns005-proofs-p3b-impl`. Do not edit implementation/evidence files, delegate,
commit, push, or contact GitHub. A read-only rerun of the single focused test is permitted; do not
start Aspire, scaffold an app, or touch shared resources.

Read plan D9/D10 and the skip-as-FAIL rule, `plan-eval.md`, issue #1129 and RFC #1123 §4 Wave 0, the
existing fixture source, and the stable S3 diff. Review at minimum:

- `packages/service/tests/auth/define-service-auth_test.ts`
- `proofs/P3-verdict.md`
- `proofs/evidence/P3-auth-fixture.json`
- `worklog.md`, `context-pack.md`, and `drift.md`

Adversarially verify that the selected fixture really performs all three requests against one live
auth-guarded `/api/openapi.json` service; asserts the exact 401 and 403 JSON envelopes; asserts the
authorized 200 without claiming an unasserted success-body shape; and was actually executed with the
recorded focused command and exit-zero result. Check repository-head, fixture-blob, assertion line,
runtime-version, and normalization claims where independently possible.

Confirm the ratified `spec_unavailable` wording is byte-for-byte the D9 text, is justified by the
measured 401/403/200 behavior, and does not weaken auth or imply authenticated-spec support exists.
Check scope/lock hygiene: S3 may add only run artifacts, must not edit product/test source, must not
add lint ignores, and must not represent a skipped branch as PASS.

Write exactly one artifact at `reviews/S3-fable.md`; first line exactly `APPROVED` or
`CHANGES_REQUESTED`. Rank findings by severity with concrete required actions. State separately
whether #1129's acceptance box may truthfully be checked after the reviewed artifacts are committed.
This is advisory slice review, not IMPL-EVAL.
