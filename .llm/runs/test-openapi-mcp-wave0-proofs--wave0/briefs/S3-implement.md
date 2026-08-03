use harness

# S3 implementation — P3 auth-guarded spec fixture

## SKILL

Read and follow `.agents/skills/netscript-harness`, `.agents/skills/netscript-pr`,
`.agents/skills/netscript-cli`, `.agents/skills/netscript-doctrine`,
`.agents/skills/netscript-tools`, and `.agents/skills/rtk` before acting.

## Assignment

You are a fresh tracked Codex implementation session at the required `gpt-5.6-sol` / medium route.
Work only in `/home/codex/repos/ns005-proofs-p3b-impl`. Read the required repo skills, current run
artifacts, approved S1/S2 Fable re-reviews, issue #1129, RFC §4, and plan D9/D10/D11/D12 before
acting.

Execute S3 only and stop for supervisor/Fable review. Do not commit, push, edit GitHub, modify the
seed RFC, run an AppHost/scaffold, or change any product/template/test source. Preserve all reviewed
S1/S2 evidence.

Required proof:

1. Re-run the focused existing auth fixture in
   `packages/service/tests/auth/define-service-auth_test.ts` using the smallest repository-valid
   targeted command. Do not edit the fixture. Record the actual exercised auth-guarded spec-route
   behavior and the observed 401 missing-credential, 403 missing-scope, and 200 authorized response
   envelopes/statuses. A copied source expectation without an executed passing fixture is FAIL.
2. Write normalized committed evidence under `proofs/evidence/` with command, exit code, versions,
   timestamp, exact test names/counts, statuses/envelope shapes, and enough attribution to prove the
   fixture executed. Omit credentials and volatile unrelated noise.
3. Write `proofs/P3-verdict.md` with exactly `PASS` or `FAIL`; any skipped/missing branch is FAIL.
   Ratify this exact wording if and only if the evidence supports it:

   `spec_unavailable: OpenAPI document could not be fetched. The spec route may require authentication; allow anonymous access to the OpenAPI route (for NetScript auth, add /api/openapi.json to auth.authn.allowAnonymous) or provide a reachable public spec URL.`

4. Explain how the observed 401/403 cases map to the generic MCP-facing wording without claiming the
   later production feature is implemented. Do not weaken auth or add a product envelope.
5. Run scoped check/lint/fmt wrappers for any owned TypeScript (if none, record N/A truthfully), the
   targeted fixture command, no-lint-ignore/scope/lock checks, and update worklog/context/drift.
   Leave a stable uncommitted S3 diff and stop.

Do not claim #1129 acceptance or issue an IMPL-EVAL disposition; the supervisor and separate Fable
review decide sign-off.
