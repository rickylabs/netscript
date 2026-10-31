# PLAN type-closure clarification — fix-native-host-policy--u1

- Plan evaluator session: `ses_e8149b729ffeT3e3Xjhrqyql5U` / 2026-10-27. Observed model
  `openrouter/x-ai/grok-4.7`. Requested `xhigh` is a label only, not reasoning-effort attestation.
  Same original evaluator session. Not a new research turn, S2 signoff, IMPL-EVAL, source
  acceptance, or release closure.
- Scope: exact workers `./service` 22-name facade only. Streams is excluded. Streams has no
  `PluginServiceContext` parameter and must later derive its own closure from its own public
  signatures and doc-lint. This verdict is not streams proof and does not authorize exporting
  `PluginServiceContext` there.
- Subject: frozen unapproved experiment, not live source. Captured HEAD
  `7e35c45b6febe6fc1f75ad4ba67f6d20e8e2c47c` on upstream baseline `1582e1c9`. Held copies:
  `held-mod.ts.txt` `8b53d328b1c75e8593a0c670758fd170f94044598abaa2c7d9a78c9739d04e5a`,
  `held-service.ts.txt` `ca6a196186692ce3f98ab646bee546054e795cd7f150bffe35560ca4470b421f`,
  `held-workers-deno.json.txt` `3dcfff5a1ff00c68c3bc95e4d4729bda0971a856990b546758e902901fdf8db1`.
  Live corrected source remains the different 7-total shape and was not reviewed as this subject.
- Original U1 `plan-eval.md` PASS stays byte-identical
  (`7ecfaef6f105f43b5532bdc34bb3e70ac1a043cfcd10d8b3ad0278f0042546a5`) and is not amended by this
  file.

## Question

Can the exact 22-name workers `./service` facade be an explicit bounded cohesive public-signature
clarification consistent with canonical F-5, or is a concrete compatible ≤20 alternative required?

## Exact workers22 inventory

Own (2): `startWorkersService`, `WorkersServiceOptions`.

`@netscript/plugin/sdk` (1): `PluginServiceContext`.

`@netscript/service` (7): `CorsOptions`, `RunningService`, `RunningServiceAddress`, `ServeOptions`,
`ServiceApp`, `ServiceEnvironment`, `ServiceTlsOptions`.

`@netscript/service/auth` (12): `AuthenticatorPort`, `AuthnOptions`, `AuthnRequest`, `AuthnResult`,
`AuthorizerPort`, `AuthzDecision`, `AuthzOptions`, `AuthzRequest`, `Principal`, `ServiceAuthPolicy`,
`ServiceGuardedAuthPolicy`, `ServicePublicAuthPolicy`.

These 20 are identity re-exports of existing public native owners, not new local abstractions. They
still count. No canonical text grants a type-only discount.

Root-authorized surface remains 7: the 2 own symbols plus `PluginServiceContext`, `CorsOptions`,
`RunningService`, `ServeOptions`, and `ServiceAuthPolicy`. The additional 15 are not authorized.

## Canonical reconciliation

- `docs/architecture/doctrine/02-public-surface.md:136-138`: more than ~20 named re-exports is the
  trigger to split into subpaths. Twenty is a soft design heuristic. The sentence's hard rule is
  skimmability: a reader must recognize each name's role. Skimmability does not raise the fitness
  cap.
- `docs/architecture/doctrine/09-anti-patterns-and-fitness-functions.md:234-244`: F-5 asserts
  exported-symbol count per `mod.ts` is ≤ 20, or the module is split into subpaths. That is the
  measurable clause. Automated F-5 today checks exported `any` / default and does not prove this
  numeric clause. A green script is not 22 compliance.
- `docs/architecture/doctrine/11-plugin-thinness-and-base-seams.md:85-90`: repeats F-5 as public
  surface ≤ 20 per `mod.ts`. A thin plugin fails the surface budget when bloated.
- `docs/architecture/doctrine/09-anti-patterns-and-fitness-functions.md:294-297`: F-15 forbids
  re-export from `npm:` / non-`@netscript` `jsr:` sources. Re-export from `@netscript/service`,
  `@netscript/service/auth`, and `@netscript/plugin/sdk` is not an F-15 violation. F-15 is not an
  F-5 waiver.

Both texts stand. Doctrine 02 explains when to split and requires the list to be skimmable. F-5 and
doctrine 11 still require ≤ 20 on that `mod.ts` unless it is actually split. Twenty-two grouped
identity names may be skimmable. That satisfies only the skimmability sentence. It is not ≤ 20 and
it is not split. Skimmability is necessary and not sufficient.

## Doc-lint facts used

Pinned Deno 2.9.7, source 1582, local workspace resolution. Not published 0.0.8 identity proof.

- Authorized 7 on new `services/mod.ts`: `deno doc --lint` exit 1, 5 `private-type-ref`, 0 missing
  JSDoc. Refs: `RunningService["app"]` → `ServiceApp`; `RunningService["addr"]` →
  `RunningServiceAddress`; `ServeOptions["tls"]` → `ServiceTlsOptions`; `ServiceAuthPolicy` →
  `ServiceGuardedAuthPolicy`; `ServiceAuthPolicy` → `ServicePublicAuthPolicy`.
- Adding those 5 reveals `ServiceApp.fetch` → `ServiceEnvironment`, `ServiceGuardedAuthPolicy.authn`
  → `AuthnOptions`, and `authz` → `AuthzOptions`.
- Next: `AuthnOptions.authenticator` → `AuthenticatorPort`; `AuthzOptions.authorizer` →
  `AuthorizerPort`.
- Next: `AuthenticatorPort.authenticate` → `AuthnRequest` / `AuthnResult`;
  `AuthorizerPort.authorize` → `AuthzRequest` / `AuthzDecision`.
- Final: `AuthnResult` and `AuthzRequest.principal` → `Principal`.
- Iteration at exact 22: `deno doc --lint` exit 0. Experiment only.
- Qualified inline `import type` probe on the 1582 framework config also exit 1 with the same 5
  refs. Inline import types do not avoid the closure.
- Existing `plugin/service` doc-lint failure is unrelated and is not permission to waive workers
  findings.

Every proper prefix of this chain fails doc-lint. No 20-or-fewer export list for this signature is
doc-lint clean. The approved signature is what forces the chain:
`startWorkersService(context: PluginServiceContext, options: WorkersServiceOptions): Promise<RunningService>`
with `WorkersServiceOptions` naming `ServiceAuthPolicy`, `CorsOptions`, and `ServeOptions`.

## Verdict

`FAIL_PLAN`

The exact 22-name workers facade is not an authorized F-5-consistent clarification. It cannot
satisfy canonical F-5 and doctrine 11 without an owner doctrine change or an explicit debt
disposition. This verdict does not accept either. It does not waive doc-lint, forge an F-5 PASS,
invent a type-only exemption, or silently accept debt.

### Required disposition

Owner must choose and record one disposition before any 22-facade source acceptance. Implementers
must not pick one in a slice.

1. Doctrine amendment, preferred if 22 is the intended long-term shape. Change F-5 and doctrine 11
   so the ≤ 20 clause explicitly allows this pattern, or change the doc-lint contract so a public
   signature may name an already-exported `@netscript/*` type without re-exporting its transitive
   closure. Any amendment must say whether identity re-exports count. Until that text exists, 22 is
   not F-5 compliant. This eval does not write that amendment.
2. Explicit architecture-debt entry, only if 22 must ship before that amendment. Required fields:
   owner, target, reason, linked plan, and status. The reason must be the F-5 ≤ 20 miss on
   `plugins/workers/services/mod.ts` (22 exports: 2 own + 20 identity re-exports), not a doc-lint
   waiver and not a general plugin-surface waiver. This eval does not accept that debt and does not
   mark it `DEBT_ACCEPTED`.

Not an available alternative under the current locks: a compatible ≤ 20 `./service` export list that
also exits `deno doc --lint` 0. The closure evidence rules it out. Splitting the extra 15 onto a new
subpath is the doctrine 02 / F-5 remedy for count, but it is a new export subpath, it is not
authorized, and it does not by itself clear `private-type-ref` on `./service` while that
entrypoint's signature still names the unexported closure. Inline import types already failed that
test.

Forbidden as a fake fix: a type-only counting exemption, a doc-lint waiver, a new structural
interface, a local alias, a cast, a suppression, a new dependency, or a runtime / options / auth /
listener change.

### What remains authorized

No change to the original 12 product paths. Live workers `./service` stays the root-authorized
7-total shape until an owner disposition above is recorded and reviewed. That 7-total shape is still
doc-lint RED for the 5 refs above. That RED is not waived and is not a U1 implementation acceptance.
Auth-before-I/O, inert import, native listener identity, port 0, TLS, legacy behavior, 480-line test
cap, retained suites, and post-publish production E2E obligations are unchanged.

Streams closure is not decided here.
