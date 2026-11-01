# Independent implementation slice review (precommit)

## IMPL-EVAL #2290, feature tier, round 1: slice review before sign-off

I reviewed the full working tree against baseline 6b7f152, including the untracked files `packages/service/src/auth/contract/retired-procedures.ts` and `packages/service/tests/auth/procedure-availability_test.ts`. The review was read-only: I edited no source and started no resources. I found no blocking issues.

### Acceptance against the issue
1. **Authenticated request to a path not in the served contract gets 404 or 410 with a stable code: met.**
   - In `packages/service/src/auth/contract/contract-authorizer.ts`, an unmatched path returns `procedure_not_found` and a declared retired path returns `procedure_retired`.
   - In `packages/service/src/auth/auth-middleware.ts`, only those two codes become 404 `NOT_FOUND` or 410 `GONE`. Every other refusal keeps its exact earlier 403 response.
2. **Unauthenticated requests keep today's refusal: met.**
   - A retired path gets `RETIRED_PROCEDURE_POLICY`, which requires authentication. Authentication therefore runs first, even when the path is outside `protect` or inside `allowAnonymous`.
   - Unknown paths still go through the existing guard. When authz runs without authn, a missing principal still gets 401 before any typed error.
   - Tests cover no credentials, invalid bearer and Basic credentials, and the authz-only case. All give 401 with no `code`.
3. **Authz and service docs describe the behaviour: met.**
   - The README, the service reference, the tutorial and the CHANGELOG all match how the code works.
   - The response bodies, precedence rules, exact-path rules and the fact that overlay authorizers never set `retired` are documented correctly.

### Design checks
- **Precedence:** the resolver checks active REST, RPC and alias procedures first, then raw routes, then internal guards, and only then retired paths. Tests confirm that a scope denial on a live procedure stays 403, public procedures stay public, raw routes still return 200, and internal guards still return 403 when the same path is also declared retired.
- **Fallback:** the fallback is only consulted for a matched procedure with no metadata. A test counts calls and confirms it never runs for unknown or retired paths, and that no handler runs either.
- **Exact matching:** retirement matches on the raw, undecoded path. Declarations are validated when the authorizer is built, with the same character rules as `allowAnonymous` plus a dot-segment check, and copied so later changes to the input array have no effect. Tests confirm that trailing-slash, child, sibling, different-case and percent-encoded spellings all get 404. Duplicates and malformed declarations throw.
- **Public surface:** `PROCEDURE_ERROR_CODES` and `ProcedureErrorCode` are exported from the root and from `./auth`, with JSDoc and an example. The optional `code` and `retired` fields keep existing code compatible. A test checks that the root and `./auth` constants are the same object.

### Checks I ran myself
| Check | Result |
| --- | --- |
| Service auth tests | 149 passed (231 including steps), 0 failed |
| `deno check` on root, `./auth` and the new test | clean |
| `deno doc --lint` on root and `./auth` | clean |
| Service `publish --dry-run` | dry run completed |
| Guarded-client docs, plugin service auth and README examples tests | 11 passed |

### Evidence gaps (coordinator or evidence matters, not code defects)
- In `gate-evidence.json`, check, fmt and jsr-audit have `exitCode: null`, and jsr-audit shows zero findings in every bucket, including PASS. That record doesn't prove the audit actually ran. My own doc-lint and dry-run cover the publishing side.
- The full service test pass after restoring the files from the negative control was still running when I reviewed, so I haven't seen its result.
- The required CI e2e-cli runtime verdict and the review of the exact pushed head are both still pending and belong to the coordinator.

### Non-blocking notes
- The tutorial's API table still says "any other unmatched route is denied". It should say 404.
- `packages/service/CHANGELOG.md` has a stray double blank line after the new entry. Markdown files aren't covered by the repo's fmt gate.
- Retiring a path that a live procedure also serves silently does nothing, because the live procedure wins. Rejecting that overlap at bind time, as raw routes already do, would be a reasonable follow-up.
- Unknown paths under guarded coverage return 404 to every authenticated caller, so a caller can tell an existing procedure (403) from a missing one (404). This is the behaviour the issue asked for and stays behind authentication.

VERDICT: PASS
