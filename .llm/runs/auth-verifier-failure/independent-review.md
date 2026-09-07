# NetScript PR2001 — Auth Verifier Failure Correction: Independent Review

- **Verdict: PASS**
- **Source reviewed:** `aac551b5d26bab9b0f4f08fb019cc37752df2a31`
  (`/home/agent/repos/netscript-auth-failure-review`, clean tree after check)
- **Baseline:** `8ba53bc50`. Slice commits: `ec13d696a` (fix), `aac551b5d`
  (regression tests). No product/source/lock edits by reviewer; no
  runtime start/stop, deployments, or merges.

## Slice contents (exact)

Product delta is one function plus docs/tests; receipts carry the evidence:

- `packages/service/src/auth/auth-middleware.ts` — narrowed `try` to the
  `await options.authenticator.authenticate(...)` call only
- `packages/service/tests/auth/middleware_test.ts` — 4 new tests (sync throw,
  async rejection, downstream-handler ownership, direct `next` rejection)
- `packages/service/README.md` — failure-contract paragraph (+ unrelated
  whitespace reflow of tables/prose from `deno fmt`; content-neutral)
- `.llm/runs/auth-verifier-failure/` — context-pack, check/lint/fmt JSON,
  matrix outputs

No Aspire wiring changes, no new public API, no authz change, no version
bump/publication — verified by stat (9 files, none outside the above).

## Findings

1. **Failure classification — correct.**
   [observed - `auth-middleware.ts:53-66`] Only verifier throw/reject is
   caught → fixed `503 { error: 'SERVICE_UNAVAILABLE', message:
   'Authentication service unavailable' }`. [observed - `:68-75`] Explicit
   `AuthnResult { ok: false }` still → `401` via `unauthorized(c,
   result.reason)` with its original reason preserved. The old code's defect
   (thrown verifier errors surfaced as 401 with `exception.message`) is gone:
   the `catch (error)` / `error.message` path no longer exists in authn.
   Severity: none.

2. **Catch-boundary narrowing — correct, no behavior leak.**
   Policy resolution, anonymous-path bypass, principal set, response-header
   application, and `await next()` all sit outside the `try`
   [observed - `:48-51,77-84`]. Downstream errors therefore retain their
   owner: suite proves app `onError` still produces its own 502 and a direct
   `next` rejection propagates (not swallowed/converted)
   [observed - `middleware_test.ts` downstream tests]. Severity: none.

3. **Redaction / handler denial — holds.**
   The 503 body is a fixed literal; the caught error is not referenced,
   serialized, or logged with detail (deny log uses constant
   `'authn.error'`). Tests assert the private detail
   `'synthetic-private-verifier-detail'` never reaches the response, the
   protected handler never runs (`reached === false`), and no `Set-Cookie`
   is emitted [observed - `middleware_test.ts` redaction tests]. Severity:
   none.

4. **503 vs. retryability — acceptable, documented.**
   503 conventionally implies "try again later," which is the honest signal
   here: the credential was *not evaluated*, so clients must not treat this
   as invalid credentials. The README states this explicitly ("Clients
   should not clear a session merely because its verifier is unavailable")
   [observed - `README.md` new paragraph]. A transient-verifier outage is
   retryable in exactly the sense 503 claims; a hard-down verifier returning
   503 repeatedly is still correctly distinguished from 401. No `Retry-After`
   is emitted — fine, since no retry policy is asserted. Severity: none.

5. **Regression proof — independently reproduced.**
   Reviewer ran the new tests against baseline `8ba53bc` bytes: exactly 3
   failures (sync throw, async rejection, direct next rejection), 12 passing
   — matching the claimed receipt. Fixed bytes restored byte-identical
   (`git status` clean afterward); corrected suite passes. Severity: none.

6. **Scope discipline — holds.**
   Authz middleware untouched (its broad `catch` → fail-closed 403 is
   pre-existing, out of #2000 scope). `AuthenticatorPort`/`AuthnResult` types
   unchanged; only a type-only `AuthnResult` import added. No adoption claim:
   context-pack states published 0.0.7 consumers still fail the live outage
   until an exact release is installed and re-tested. Severity: none.

## Verification actually executed

- `deno test --allow-all packages/service/tests/`: **106 passed, 0 failed**.
- Middleware file alone: 15/15 pass; baseline-byte run: 12 pass / 3 fail
  (exactly the claimed cases), fix restored clean.
- Scoped wrappers re-ran: check / lint / fmt over `packages/service`
  (48 files) — 0 failed batches, 0 findings. Committed receipt JSON agrees.
- Publish dry-run and matrix outputs inspected, not re-run (coordinator
  evidence). Missing-clone dependency absence: none encountered; nothing
  treated as PASS on that basis.

## Required corrections

None. Safe to adopt as a bounded dependency correction; consumers must be
told (per README) that 503 means "verifier unavailable, do not erase
credentials" — a classification change, not just a bugfix. No certification
of whole auth, service authz, or live login beyond this slice.
