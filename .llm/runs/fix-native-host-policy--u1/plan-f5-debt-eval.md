# PLAN F-5 debt re-review — fix-native-host-policy--u1

- Plan evaluator session: `ses_e8149b729ffeT3e3Xjhrqyql5U` / 2026-10-27. Observed model
  `openrouter/x-ai/grok-4.7`. Requested `xhigh` is a label only, not reasoning-effort attestation.
  Same original evaluator session. Not S2 signoff, IMPL-EVAL, source acceptance, security
  acceptance, or release closure.
- Question: does the owner-accepted entry `WORKERS-SERVICE-NATIVE-TYPE-CLOSURE-F5-U1-20261027`
  validly carry the exact workers 22-name numeric F-5 violation as `DEBT_ACCEPTED`? It does not
  relabel 22 as cap-compliant.
- Prior finding left unchanged: `.llm/runs/fix-native-host-policy--u1/plan-type-closure-eval.md`,
  `FAIL_PLAN`, SHA256 `9c249a787acf5c3a00c4c2ee3bf8993a90aa74649a4df9cf28125a0c18fe1bf9`. Original
  U1 `plan-eval.md` PASS SHA256 `7ecfaef6f105f43b5532bdc34bb3e70ac1a043cfcd10d8b3ad0278f0042546a5`
  is unchanged. This file does not edit the registry or those verdicts.
- Registry judged: the canonical `.llm/harness/debt/arch-debt.md` entry quoted by root. Doctrine
  09's historical `.llm/arch-debt.md` string is not a second registry.

## Canonical rule applied

`gates/fitness-gates.md` Debt Rule: a known violation closes only as `DEBT_ACCEPTED` when
`../debt/arch-debt.md` has a matching, time-bounded entry. `PASS` means no violation.
`DEBT_ACCEPTED` means a violation with a valid registry entry. Doctrine 09 requires debt to be
named, owned, and time-bounded. Unrecorded violations are not accepted. A type-only discount is not
granted. Doc-lint is not waived.

## Entry check

| Required field     | Result | Evidence                                                                                                                                                                                                                    |
| ------------------ | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Named              | PASS   | ID `WORKERS-SERVICE-NATIVE-TYPE-CLOSURE-F5-U1-20261027`                                                                                                                                                                     |
| Matching violation | PASS   | Exact workers `plugins/workers/services/mod.ts` 22: 2 own plus 20 native identity re-exports. Count still exceeds 20. Entry says `DEBT_ACCEPTED`, not `PASS`.                                                               |
| Owned              | PASS   | Native-host policy migration coordinator and maintainer `rickylabs`                                                                                                                                                         |
| Time-bounded       | PASS   | Target 2026-11-10. No automatic extension. No growth past the named 22 while open.                                                                                                                                          |
| Reason             | PASS   | Approved signature forces the 22-name doc-lint closure. Authorized 7 yields 5 real `private-type-ref` errors. No type-only discount.                                                                                        |
| Linked plan        | PASS   | `plan.md`, `plan-review-addendum.md`, and the immutable type-closure `FAIL_PLAN`                                                                                                                                            |
| Status             | PASS   | open, `DEBT_ACCEPTED` by the milestone coordinator. The pending-review clause is this review, not a missing field.                                                                                                          |
| Closing gate       | PASS   | Reviewed solution that meets numeric F-5, or a separately reviewed doctrine amendment with fitness updates, plus type identity, exact inventory, doc-lint zero, and retained lifecycle/security gates. No close by analogy. |
| Exclusions         | PASS   | Streams, U2/U3/E1, security, release, and production E2E are outside the entry. Function `@example` and every other documentation obligation stay unwaived.                                                                 |

The registry append is process metadata on the existing debt registry. It is not a 13th product path
and not a runtime or design change. Product owners remain the approved 12.

## Verdict

`PASS`

This PASS accepts only the process disposition: the prospective workers plan may carry the exact
22-name export list with numeric F-5 recorded as `DEBT_ACCEPTED`, not `PASS`. Twenty-two remains a
real numeric violation. This is not source acceptance, not S2 signoff, and not permission to land
the additional 15 exports until root substantive source review.

### Binding scope

Only `plugins/workers/services/mod.ts`.

Own: `startWorkersService`, `WorkersServiceOptions`.

`@netscript/plugin/sdk`: `PluginServiceContext`.

`@netscript/service`: `CorsOptions`, `RunningService`, `RunningServiceAddress`, `ServeOptions`,
`ServiceApp`, `ServiceEnvironment`, `ServiceTlsOptions`.

`@netscript/service/auth`: `AuthenticatorPort`, `AuthnOptions`, `AuthnRequest`, `AuthnResult`,
`AuthorizerPort`, `AuthzDecision`, `AuthzOptions`, `AuthzRequest`, `Principal`, `ServiceAuthPolicy`,
`ServiceGuardedAuthPolicy`, `ServicePublicAuthPolicy`.

Signature remains
`startWorkersService(context: PluginServiceContext, options: WorkersServiceOptions): Promise<RunningService>`
with `auth: ServiceAuthPolicy`, `cors?: CorsOptions`, and `serve?: ServeOptions`. No alias,
structural interface, cast, suppression, extra API, path, dependency, lock, or behavior change is
covered.

While the entry is open, the export list must not grow beyond these 22 names. Target remains
2026-11-10 with no automatic extension.

### Unwaived conditions before source acceptance

1. Numeric debt covers only the F-5 count. Doc-lint must still exit 0 on the workers `./service`
   entrypoint. Live 7-total source is still doc-lint RED with 5 `private-type-ref` errors. Partial
   static green is not completed S2. The frozen 22 experiment is not accepted source.
2. `startWorkersService` function JSDoc has no `@example`. A module recipe does not satisfy the
   function-level F-5 clause. A meaningful function `@example`, proved by manual review and
   doc-lint, is a blocking S2 correction. This debt does not waive it.
3. Auth-before-I/O, inert import, port 0, native option identity, real plain and trusted TLS, the
   480-line test cap, retained suites, publish checks, production E2E, independent IMPL-EVAL, and
   root review remain mandatory.
4. Streams is not covered. It has no `PluginServiceContext` argument and must derive its own closure
   later.
5. No commit, PR, security, release, or S16 closure is approved here.
