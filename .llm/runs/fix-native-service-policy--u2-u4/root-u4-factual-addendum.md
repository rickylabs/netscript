# Root U4 factual addendum — 2026-10-28

Root authorized implementation of the already accepted U4 revision 5 leaf after
re-reading its exact owners, health predicates/order/lifecycle, auth atomicity
and budgets. No additional implementation approval pause was required once its
faithful owner/gate brief was saved.

Root subsequently inspected `packages/service/src/primitives/health.ts:106–108`
and confirmed that `createHealthHandler()` snapshots `configuredChecks` at
handler construction. The readiness handler retains its checks array. The
evaluated plan's blanket statement about live health arrays is factually too
broad; its bytes and both original FAIL/recheck PASS verdicts remain unchanged.

The intended U4 proof is `withHealth()` then `withHealthCheck()` then `build()`:
deferred native handler construction includes the configured check. Readiness
retains its native late-array behavior. Health checks added after installation
remain outside the existing snapshot; no new after-build dynamic health
capability is required or authorized. Health factories stay inspect-only.

Root also authorized moving **only the new U4 authz
deny/throw-open/throw-closed/configuration snapshot rows** into the already
accepted `builder-auth_test.ts` owner to fit readable file budgets. These use
the real builder, build before mutating supplied arrays, and assert actual
semantics, authn/authz/handler counts and error bodies. Original baseline
tests/assertions stay intact; all four auth test files remain at most 480
physical lines after formatting, with no new owner or golf.

This records root's factual correction and test distribution instruction, not a
new PLAN or IMPL verdict. The U2 source checkpoint, all preserved hashes and
unwaived baseline failures remain.

## One consumer test owner added after the compatibility gate

The U4 consumer run reported 24 pass / 2 fail: the existing Windows
JavaScript-caller URL failure and
`plugin factory preserves native health routes and anonymous-prefix replacement`.
Root read that fixture at lines 123–145: it sets
`allowAnonymous: ['/api/openapi.json']`, explicitly replacing the health
default. Its health 200 expectation asserted exactly the registration-order
bypass that the accepted plan changes to 401.

Root authorized **one additional test owner**,
`packages/plugin/tests/service/create-plugin-service-auth_test.ts`, for only
that test's title and health expected status, 200 to 401. Keep spec 200, private
health 401, body consumption and every other assertion intact. The unrelated
Windows `.pathname` baseline failure is untouched. Re-run the complete accepted
consumer set and selected type/lint/fmt for this owner; expected result is 25
pass / 1 fail with only the existing URL failure remaining. This aligns an
active consumer oracle with the locked compatibility behavior; it adds no
public/API behavior change, ignored test, bypass or waiver. Twelve
implementation/test/doc owners plus the existing debt metadata stay within the
accepted less-than-30-path leaf budget.
