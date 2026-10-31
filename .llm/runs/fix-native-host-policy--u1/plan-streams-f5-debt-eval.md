# PLAN streams F-5 debt review — fix-native-host-policy--u1

- Plan evaluator session: `ses_e8149b729ffeT3e3Xjhrqyql5U` / 2026-10-28. Observed model
  `openrouter/x-ai/grok-4.7`. Requested `xhigh` is a label only, not reasoning-effort attestation.
  Same original U1 PLAN evaluator. Not a new evaluator, not IMPL-EVAL, and not source acceptance.
- Checkout claimed by the packet: `C:/Users/ericc/source/repos/netscript-native-host-policy-008`,
  branch `fix/native-host-policy`, HEAD `ced4232a10c32132f70a3edff6c6fce793ec94a2`. Not re-hashed
  here.
- Immutable priors, not amended: original U1 PLAN PASS SHA256
  `7ecfaef6f105f43b5532bdc34bb3e70ac1a043cfcd10d8b3ad0278f0042546a5`; workers type-closure
  `FAIL_PLAN` SHA256 `9c249a787acf5c3a00c4c2ee3bf8993a90aa74649a4df9cf28125a0c18fe1bf9`; workers
  debt-process PASS in `plan-f5-debt-eval.md`. Workers ID
  `WORKERS-SERVICE-NATIVE-TYPE-CLOSURE-F5-U1-20261027` excludes streams and does not cover this
  surface.
- No production streams factory, facade, manifest, or canonical debt entry was reviewed as accepted
  source. The type-only probes are not production source.

## Question

Can the exact proposed streams process disposition and revised S5 footprint proceed to root
source-implementation authorization, with numeric F-5 remaining `DEBT_ACCEPTED` because 21 > 20?

## Findings

S4 RED is meaningful missing-surface RED. Root acceptance records a 382-line
`plugins/streams/services/src/service_test.ts` (SHA256
`d4b383c13f6f30dfa40de4842dd680cb33819321485de7e90dec7f2620d44678`): 2 fixture controls pass, 2
product tests fail exactly on unknown export `./service`. That is not permission, setup, or timeout
failure, and it is not product GREEN. This review does not re-accept those tests or the 106
protected owners.

Closure probes, Deno 2.9.7, `--frozen --deny-import`, are type-only:

- 6 names: exit 1, 5 `private-type-ref` (`ServiceApp`, `RunningServiceAddress`, `ServiceTlsOptions`,
  `ServiceGuardedAuthPolicy`, `ServicePublicAuthPolicy`).
- 20 names omitting `Principal`: exit 1, 2 `private-type-ref` (`AuthnResult` and
  `AuthzRequest["principal"]`).
- Exact 21: exit 0, stderr `Checked 1 file`. Doc JSON inventory count is 21 and matches the names
  below. No `PluginServiceContext`.

`probe-21.ts` is `export declare function`. It has `@param` and `@returns` and no function
`@example`. Automated doc-lint exit 0 does not prove the function-level F-5 `@example` clause.
Production doc-lint, inventory, and consumer checks are still required on the real facade.

Native shutdown docs agree with the lifecycle choice: `onShutdown` runs during drain of a returned
running service (`running.stop()` or signal). A front bind that returns no `RunningService` has no
native coordinator to invoke that hook. Factory ownership of that failure path is required. It is
not proved by S4 or these probes.

## Scope

Streams `./service` only. Signature
`startStreamsService(options: StreamsServiceOptions): Promise<RunningService>` with
`auth: ServiceAuthPolicy`, `cors?: CorsOptions`, `serve?: ServeOptions`. No context argument.

Exact 21, all counting:

- Own: `startStreamsService`, `StreamsServiceOptions`.
- `@netscript/service`: `CorsOptions`, `RunningService`, `RunningServiceAddress`, `ServeOptions`,
  `ServiceApp`, `ServiceEnvironment`, `ServiceTlsOptions`.
- `@netscript/service/auth`: `AuthenticatorPort`, `AuthnOptions`, `AuthnRequest`, `AuthnResult`,
  `AuthorizerPort`, `AuthzDecision`, `AuthzOptions`, `AuthzRequest`, `Principal`,
  `ServiceAuthPolicy`, `ServiceGuardedAuthPolicy`, `ServicePublicAuthPolicy`.

Nineteen native names are direct type-only identity re-exports. No local structural substitute,
wildcard, type erasure, cast, suppression, alias, extra runtime symbol, subpath workaround,
dependency, or lock change.

## Process verdict

`PASS`

Root may authorize S5 source implementation only after it accepts and appends the exact debt entry
below to canonical `.llm/harness/debt/arch-debt.md`, and only for the three production owners plus
that explicit registry metadata. This PASS does not authorize the edit, does not accept source, and
does not record the debt.

## Numeric F-5 disposition

`DEBT_ACCEPTED`

Not numeric `PASS`. Twenty-one exceeds the F-5 cap of 20. No type-only discount. Workers 22 does not
apply.

### Exact debt conditions

Record only after this review and root acceptance, before facade application. Do not apply by
analogy.

- **ID:** `STREAMS-SERVICE-NATIVE-TYPE-CLOSURE-F5-U1-20261028`
- **Owner:** native-host migration coordinator and repository maintainer `rickylabs`
- **Target:** 2026-11-10. No automatic extension. No growth beyond the exact 21 names while open.
- **Status:** open, `DEBT_ACCEPTED`. This names the violation. It is not F-5 `PASS`.
- **Reason:** the approved streams signature's doc-lint closure is these 21 names. The 6-name and
  20-name probes are really red. Doc-lint and every other F-5 clause still have to pass on their
  own.
- **Linked plan:** `.llm/runs/fix-native-host-policy--u1/plan.md`, `plan-review-addendum.md`, and
  `s5-streams-factory-proposal.md`, plus this file.
- **Closing gate:** a separately reviewed native public-signature/doc-lint solution that meets cap
  20, or an explicit doctrine amendment with matching fitness updates; then exact public type
  identity, exact inventory, doc-lint zero, and retained lifecycle/security gates. No close by
  analogy.
- **Excluded:** workers entry, streams legacy `main.ts` until S6, U2/U3/E1, release, and production
  E2E. Function `@example` and all other documentation obligations stay unwaived.

## CORS correction

Original plan prose 6/11/14 is not authorized. Actual legacy arrays are 6 methods, 9 allowed
headers, and 12 exposed headers. Preserve those values. Do not invent headers. Freeze internal
defaults. Copy default arrays only where native mutable-array types require a copy. Caller-supplied
arrays keep identity. Omitted `origin` stays absent. `credentials` and `maxAge` appear only when
supplied. Wildcard `origin: '*'` stays only in the existing legacy owner until a separate S6 review.

## Lifecycle choice

`assertServiceAuthPolicy(options?.auth)` is first, before `PORT`, storage, dynamic import, native
start, or listen. Explicit `serve.port`, including 0, wins; then `PORT`; then `STREAMS_PORT`, with
the existing parse and error text. Only then dynamically import composition, proxy, storage, and
version owners.

After `createStreamsServer` returns, upstream `start` and every later front composition/`serve` step
are in one try/catch. Success installs `onShutdown: [async () => await server.stop()]` and native
idempotent stop/drain owns that hook. Failure awaits `server.stop()` and rethrows the identical
primary error. A secondary stop rejection is not successful cleanup and must not replace the primary
error. No direct store close, private patch, duplicate coordinator, cast, or suppression. Pinned
`@durable-streams/server` 0.3.9 remains the upstream owner. S5 does not prove port release.

## Three production owners

1. New `plugins/streams/services/src/service.ts`: target 170–200, cap 200.
2. New `plugins/streams/services/mod.ts`: target 75–90, cap 90. Factory, options, and the exact 21
   closure only. `startStreamsService` needs its own `@example`. A module recipe is not enough.
3. `plugins/streams/deno.json`: add `./service` and two check-task paths. Two existing lines
   touched, at most +2 lines.

S4 `service_test.ts` stays frozen at 382 lines. No other product owner, helper, permission mode,
legacy `main.ts`, README, proxy, durability, store, or log edit. Debt metadata is a separate process
owner, not a hidden fourth source owner. Growth past a cap stops and returns to root.

## Residual gates

S5, still required, not inferred from probes: frozen four tests GREEN; nonempty type/lint/fmt on
factory, facade, test, and legacy `main.ts`; quality zero new allowances; production doc-lint 0;
exact 21 inventory and type identity; positive consumer and intended `TS2322` negative consumer; 106
protected bindings unchanged except the streams manifest; unchanged fixture argv and owned cleanup.
Ordinary frozen/cached Deno 2.9.7. Ordering controls stop at denied `PORT` and grant no startup
privilege.

S6 is not authorized. It still needs its own scope review for legacy delegation, real plain and
trusted TLS listeners, front-collision port release, primary-error identity, normal stop, and caller
abort.

## Open questions

- Production facade doc-lint and consumer identity are unrun. Probe exit 0 does not answer them.
- Whether the function `@example` and permission block fit the 90-line facade cap is unproved. Do
  not raise the cap silently.
- S6 permission and runtime fixture are undecided.
- No doctrine amendment is selected. If debt is not appended exactly as above, numeric F-5 is
  unresolved and S5 facade application is unauthorized.

## Not accepted

No production implementation was reviewed or accepted. No registry write, source edit, commit, PR,
security, release, or S16 closure is approved.
