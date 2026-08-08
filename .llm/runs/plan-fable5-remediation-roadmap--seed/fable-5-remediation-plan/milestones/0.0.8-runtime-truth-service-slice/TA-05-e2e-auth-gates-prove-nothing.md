# test(e2e): the scaffold runtime auth gate proves only that an unauthenticated request succeeds — DRAFT (no GitHub mutation; owner ratification pending)

**Draft-ID:** TA-05 · **Proposed milestone:** 0.0.8 (post-shift "Runtime truth + service slice", SYNTHESIS §5.3) · **Labels:** `type:test` `area:cli` `area:auth` `area:tooling` `priority:p1` `status:triage` · **Depends on:** none for the harness capability; TA-01, TA-02 and TA-03a for the assertions themselves

## Summary

`scaffold.runtime`'s only auth behaviour gate is `behavior.auth-session`, an unauthenticated `GET
/api/v1/auth/session` that passes when the response is 2xx. It is a liveness probe wearing an auth
gate's name: it would pass identically if the auth service had no authorization at all, which is
exactly today's state. The harness cannot express anything better — `HttpGateDefinition` carries only
`{ kind, method, url }`, and `HttpGate` passes on `result.ok` and retries until the deadline
otherwise. So there is no way to write "expect 401" or "send this credential", and consequently no
gate anywhere proves an authenticated call succeeds or an unauthenticated call is refused.

## Evidence

- Corpus: `research/repo-audit/auth.md` §6 (last paragraph) and §7, gap **G12**.
- `packages/cli/e2e/src/application/gates/scaffold/runtime-gates.ts:404-418` — the three auth gates:
  `behavior.auth-live` (`/health/live`), `behavior.auth-ready` (`/health/ready`),
  `behavior.auth-session` (`/api/v1/auth/session`). All are plain `httpGate` calls.
- `packages/cli/e2e/src/application/gates/scaffold/gate-factory.ts:77-92` — `httpGate(id, title,
  url, method = 'GET')`; no expected-status, header, body, or credential parameter.
- `packages/cli/e2e/src/domain/gate-definition.ts:81-86` — `HttpGateDefinition { kind, method, url }`.
- `packages/cli/e2e/src/application/gates/http-gate.ts` — "Gate that succeeds when an HTTP endpoint
  returns a 2xx response"; the loop returns `passed` only on `result.ok` and otherwise retries until
  `httpTimeoutMs` elapses.
- `packages/service/tests/auth/define-service-auth_test.ts` is the only place a 401/403/200 triple is
  asserted, and it targets `/api/openapi.json` on a hand-built service — never `/api/rpc/*`, and
  never a generated project (`auth.md` §6).
- `packages/cli/e2e/src/domain/cli-surface.ts:138-140` — the three gate ids, for reference when
  adding new ones.

## Current surface

The generated-path auth evidence chain is: three 2xx probes against an unguarded service. A
regression that removed the auth service's authorization entirely would leave every gate green. This
is the same "green wrapper over absent runtime truth" failure mode SYNTHESIS §1.4 identifies across
the runtime plugins.

## Target contract

1. `HttpGateDefinition` gains optional `expectStatus?: number | readonly number[]` and
   `headers?: Record<string, string>` (or a credential-factory callback resolved from `RunContext`),
   and `HttpGate` asserts the expected status instead of `result.ok`. Retry semantics stay: a
   connection failure retries, a wrong-but-served status fails fast rather than burning the deadline.
2. New `scaffold.runtime` gates, ids following the existing `behavior.*` convention:
   - `behavior.auth-session-unauthenticated` — expects **401** on `GET /api/v1/auth/session`.
   - `behavior.auth-session-authenticated` — expects **200** with a valid credential.
   - `behavior.auth-rpc-unauthenticated` — expects **401** on `POST /api/rpc/v1/auth/*`.
   - `behavior.service-api-unauthenticated` — expects **401** on the generated user service's `/api`.
   - `behavior.service-api-authenticated` — expects **200** on the same route with a credential.
   - `behavior.auth-signout-foreign-session` — expects a refusal for a foreign session id (TA-03a).
3. The credential the gates use comes from the generated project's own configuration, not from a
   fixture the harness invents — the gate must fail if the generated project cannot produce one.
4. The pre-fix behaviour is recorded: each new negative gate must be demonstrated red on
   `fac9e339042c` before the corresponding fix lands.

## Acceptance

- [ ] `HttpGateDefinition` supports an expected status and request headers.
- [ ] `HttpGate` asserts the expected status rather than any 2xx.
- [ ] A wrong-but-served status fails the gate without consuming the full retry deadline.
- [ ] `behavior.auth-session-unauthenticated` expects 401 and is green after TA-02.
- [ ] `behavior.auth-session-authenticated` expects 200 with a credential.
- [ ] `behavior.auth-rpc-unauthenticated` covers the `/api/rpc/*` projection.
- [ ] `behavior.service-api-unauthenticated` and `behavior.service-api-authenticated` cover the generated user service.
- [ ] `behavior.auth-signout-foreign-session` proves a foreign session id is refused.
- [ ] The credential is produced by the generated project, not by a harness-only fixture.
- [ ] Each new negative gate is demonstrated red against `fac9e339042c` and the evidence is linked.
- [ ] gate: `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` green with the new gates.
- [ ] `behavior.auth-session` is either removed or renamed so no gate name implies auth coverage it does not provide.

## Boundaries

- **Do not** build the auth conformance, mocking, and scaffold test kit — **#885** owns the
  security-focused kit (fake OIDC/JWKS, signed tokens, WorkOS/Better Auth fixtures, SCIM, clock and
  replay controls, per-backend capability matrix) at milestone 0.0.12. This issue adds only the
  generated-path behaviour gates that must pass before that kit exists, and its gates should be
  re-expressible on #885's fixtures later without re-filing.
- **Do not** implement the auth fixes themselves — **TA-01**, **TA-02**, **TA-03a** own them.
- **Do not** extend gates to background children or `saga.*` spans — that is the T4 runtime-truth
  E2E work, tracked separately in this plan.
- **Do not** change Aspire port resolution in the gates — **#979** owns the hardcoded-port
  dependency of `runtime-gates.ts`.
- **Do not** re-file published-canary installed-consumer smoke — **#1343** owns it.

## Docs/consumer proof

The gate list is the consumer-visible claim: `deno task e2e:cli gates scaffold.runtime` currently
advertises `behavior.auth-session` as auth coverage. Adoption is proven when that listing names
explicit authenticated and rejected cases, and when a reviewer can point at a red-then-green gate id
as the evidence for each of TA-01/TA-02/TA-03a rather than at a hand-run `curl`.

## Provenance

Seed run `plan-fable5-remediation-roadmap--seed`, PR #1347, 2026-08-08. Sourced from
`research/repo-audit/auth.md` gap G12; all cited line numbers re-verified against worktree
`fac9e339042c` on 2026-08-08.

**Scope correction (recorded, not silently dropped).** The Stage-D brief paired this gate work with
"auth docs debt: arch-debt anchors cited by `add-authentication.md` do not exist"
(`research/repo-audit/auth.md` §7.1, gap G13). **That claim is false against this worktree.** The
audit searched `docs/architecture/`; the registry the checker actually resolves against is
`.llm/harness/debt/arch-debt.md`, where both ids exist —
`seamless-auth-roadmap` at line 1240 and `auth-single-active-backend-boundary` at line 1313 — and
`.llm/tools/docs/check-caveat-refs.ts:185-186` resolves `arch-debt:<ID>` against that file, wired as
`check:caveats` in `docs/site/deno.json:6-7` and run in CI by `.github/workflows/pages.yml:38-40`.
No dangling-anchor issue is drafted. The surviving docs defect from G13 — cookie claims contradicted
by code — is carried by **TA-03b**'s acceptance; the zero-SDK-auth-guidance half belongs to the T5
docs pack. This issue therefore stands alone as a test-coverage issue at `priority:p1` rather than
the briefed `priority:p2` docs-polish, because a missing negative security gate is not docs polish.
