# #1383 follow-up: factory-owned auth posture — bounded plan for the next single PR

Planning only. Written by the native planning session (Fable 5.1, `matrix-factory-followup.json` plan
route `fable_5_1@medium`). No code, issue, label, PR, commit, dependency or runtime change. Evaluation
must come from a different vendor family and session than this author and than the eventual generator.
No release, canary, tag or publication is authorized by anything below.

## Handoff summary

- **Landed (PR #2002, head `e1430881b`, IMPL-EVAL PASS, `scaffold.runtime` 104/104):** `createAuthServiceAuthenticator`
  in `@netscript/plugin-auth-core/authenticator` (+ thin `@netscript/plugin-auth/authenticator` leaf), native
  request propagation and bearer→`token` lookup on the auth service. #1383 step 3 and acceptance boxes 3–4 are
  implemented; the issue stays open. [observed - `git diff --stat 3330d6f9c..HEAD`; `plugins/auth/services/src/main.ts:85`]
- **Recommended next PR (one PR, "factory-owned auth posture"):** make `PluginServiceConfig.auth` a **required,
  explicit** union — guarded `{ authn, authz? }` or recorded `{ public: true, reason }` — applied by the
  factory in its fixed chain before `withRPC`; add the factory guard tests the issue names; make the five
  first-party services declare their posture explicitly (four non-auth services and the auth service record
  `public` with a reason that names the follow-up, because guarding them now breaks 15 unauthenticated
  `scaffold.runtime` gates and every generated app/eis-chat caller); make `netscript plugin new` emit the
  guarded form; prove adoption with a **third-party fixture plugin** guarded end to end over real HTTP through
  the landed authenticator. This closes #1383 steps 1, 2 and 5 and the guard/negative-test boxes, and leaves
  step 4 (first-party guarded adoption) as the explicit remaining scope, not a silent default.
- **Genuine owner forks (must be answered before implementation):** F1 opt-out spelling (`{ public: true,
  reason }` recommended; #1382 must use the same); F2 whether the generated third-party guarded form may be
  proven only in local-source mode until `@netscript/plugin-auth@>0.0.7` is published (recommended yes);
  F3 whether the auth service's own `/session` keeps its public discovery posture (recommended yes, `me`/`signout`
  stay with #1384).
- **Proof:** scoped wrappers + `quality:gate` + doc-lint/publish dry-run for `packages/plugin`, generator test,
  new factory tests, third-party fixture HTTP test, and the full `deno task e2e:cli run scaffold.runtime
  --cleanup --format pretty` (plugin services and the generator are touched). No live IdP claim.

## 1. Current source facts the plan rests on

| # | Fact | Source |
| - | ---- | ------ |
| A1 | `PluginServiceConfig` has no `auth` field; the factory chain is cors → logger → openapi → docs → database → `use(middleware)` → context → `withRPC` → `withHealth` → `withServiceInfo` → raw routes → hooks. | [observed - `packages/plugin/src/service/presentation/create-plugin-service.ts:63-104,137-194`] |
| A2 | Ordering is **builder-owned**: `build()` calls `installAuth()` before `installDeferredRoutes()`, and RPC, `/api/openapi.json`, `/api/docs` and raw routes are all deferred. So authn/authz always precede route dispatch no matter where `withAuthn` sits in the chain; the factory still fixes the position for readability and for the reordering test. | [observed - `packages/service/src/builder/service-builder-impl.ts:447-452,455-471,488-533`] |
| A3 | `withAuthn(AuthnOptions{ authenticator, protect?=['/api'], allowAnonymous?=['/health'] })`; `withAuthz(AuthzOptions{ authorizer, denyByDefault? })`. `normalizeGuard` **replaces** the defaults when a caller passes `allowAnonymous`, so passing `['/api/openapi.json']` silently drops `/health`. | [observed - `packages/service/src/auth/auth-middleware.ts:29-32,213-222`; `deno doc --filter AuthnOptions packages/service/src/auth/mod.ts`] |
| A4 | Anonymous-prefix paths bypass both authn and authz; contract procedures marked `access.authentication:'none'` bypass both when a `createContractAuthorizer` is installed. | [observed - `auth-middleware.ts:47-52,100-106,194-208`; `contract-authorizer.ts:84-100`] |
| A5 | Only the auth contract carries `access` metadata; workers/sagas/triggers/streams cores and the base `describe` route carry none. A contract authorizer on those services would deny every procedure (`authz.no-matching-rule`) unless a fallback is supplied. | [observed - `grep -rn "authentication: '" packages/plugin-*-core/src packages/plugin/src` → only `plugin-auth-core`; `packages/plugin/src/contract-base/domain/base-contract.ts:111-116`] |
| A6 | Paths under `/api` on a plugin service today: RPC `/api/rpc/v1/<ns>/*`, REST `/api/v1/<ns>/*` incl. `describe`, `/api/openapi.json`, `/api/docs`, triggers webhooks `/api/v1/webhooks/:triggerId` and `/api/v1/events`. Service info is `/`, health is `/health*`. | [observed - `create-plugin-service.ts:175-186`; `service-builder-impl.ts:383-391,425-437`; `plugins/triggers/services/src/main.ts:136,256-260`; `raw-trigger-routes.ts:12`] |
| A7 | First-party factory calls: auth (`context` now includes `request`), workers, sagas, streams (`serveRpc:false`, catch-all proxy), triggers (`rawRoutes`). None declares auth. `plugins/ai` has no service. | [observed - `plugins/{auth,workers,sagas,streams,triggers}/services/src/main.ts`; `ls -d plugins/*/services`] |
| A8 | The generator emits `createPluginService(router, { name, version, openApi })` and a connector `deno.json` whose imports are `@netscript/aspire`, `@netscript/plugin`, the core package and `@std/assert` — no `@netscript/plugin-auth`, no `@netscript/service`; the emitted contract has no `access` meta; the only emitted test is a manifest identity test. | [observed - `packages/cli/src/public/features/plugins/new/new-plugin-use-case.ts:256-262,380-416,694-707,711-720`] |
| A9 | `scaffold.runtime` probes plugin APIs **without credentials** and requires 200: workers jobs/tasks/seed/executions, sagas sagas/instances, triggers webhook/events, auth `/api/v1/auth/session`; the auth smoke env configures kv-oauth with a fake GitHub provider, so no session can be minted in the suite. `plugin doctor` and the MCP endpoint directory make no plugin HTTP calls except the OpenAPI spec probe, whose own error text tells users to add `/api/openapi.json` to `auth.authn.allowAnonymous`. | [observed - `packages/cli/e2e/src/application/gates/scaffold/runtime/behavior-gates.ts:162-256`; `probe-plugin-resource.ts:53-95` (`expectOk`); `runtime-scripts.ts:128-140`; `packages/mcp/src/infrastructure/service-endpoints/fetch-service-endpoint-probe.ts:12,50`] |
| A10 | Manifest `withDependencies({...})` is what the installer turns into `PluginReferences` and hence `services__<key>__http__0` env on the consumer; workers → streams, sagas → workers+streams, triggers → cores, auth → none. A guarded plugin therefore declares `auth` as a manifest dependency to receive discovery. | [observed - `packages/cli/src/kernel/adapters/plugin/plugin-reference-reconciler.ts:40-97`; `plugins/*/src/public/mod.ts` `withDependencies`; `generators-service-plugin_test.ts:409`] |
| A11 | Landed authenticator API: `createAuthServiceAuthenticator({ serviceName, timeoutMs, routerName?, protocol?, allowInsecureTransport? })`, both first two required. | [observed - `deno doc --filter AuthServiceAuthenticatorOptions packages/plugin-auth-core/src/adapters/mod.ts`] |
| A12 | The generated Fresh app has no access-token concept; the auth plugin ships a `sdk-client` starter scaffolder for explicit attachment. A guarded first-party API is therefore unreachable from the generated app until credential plumbing exists (#1382 target 4 territory). | [observed - `grep -rl getAccessToken packages/fresh/src` → none; `plugins/auth/src/adapter/resources/sdk-client.ts`] |
| A13 | eis-chat starts first-party plugin services through the host context (`createPluginServiceContext('workers')` → `createWorkersService`) and does not call `createPluginService` itself; a guarded workers default would break its callers, an explicit `public` declaration inside `main.ts` does not. | [observed - `/home/agent/projects/eis-chat/scripts/windows-singleton/entries/workers-api.ts:1-4`; `services/_shared/plugin-service-context.ts:109`; grep for `createPluginService|withAuthn` → none] |
| A14 | The auth contract marks `session` `authentication:'required'`, yet the published discovery posture is "unauthenticated `GET /session` → `{authenticated:false}`" and the runtime gate `behavior.auth-session` asserts 200 without credentials. Guarding the auth service with its own contract authorizer would contradict both. | [observed - `packages/plugin-auth-core/src/contracts/v1/auth.contract.ts:412-416`; `docs/site/identity-access/how-to/add-authentication.md:253-262`; `behavior-gates.ts:256`] |
| A15 | `PluginServiceContext.env` is the host-captured environment a first-party service may read discovery/timeout values from; no auth-specific host field exists. | [observed - `deno doc --filter PluginServiceContext packages/plugin/src/sdk/mod.ts`] |
| A16 | Doctrine: `packages/plugin` is the factory authority (Archetype 4/5 boundary, "mandated builder order… cannot be expressed incorrectly by a connector"); plugins stay thin over cores. The existing factory test already uses `as any` twice (pre-existing quality debt, not to be widened). | [observed - `create-plugin-service.ts:1-9`; `docs/architecture/doctrine/10-*.md:45,58`; `packages/plugin/tests/service/create-plugin-service_test.ts:33,37`] |
| A17 | `find_guidance` over `docs/site` routes the intent to `tutorials/workspace/05-route-authz` § Step 2 (`createContractAuthorizer` + `createScopeAuthorizer` fallback, `withAuthn` defaults) and `explanation/contracts`; no page documents a plugin-service auth field, confirming a new seam. | [observed - local `createFindGuidanceFlow(new FilesystemDocsCorpus({root:'docs/site'}))`, 2026-09-08] |
| A18 | `ScopeAuthorizerOptions.denyByDefault` JSDoc says "Defaults to `false`" while `services.md` and the authz middleware say fail-closed defaults to `true`. Not touched here; recorded as an unknown for the docs lane. | [observed - `deno doc --filter ScopeAuthorizerOptions packages/service/src/auth/mod.ts`; `docs/site/services-sdk/services.md:413`; `auth-middleware.ts:87`] |

## 2. Reconciliation: what "required guard, explicit opt-out" can honestly mean now

1. **Required at the factory, not at the middleware.** A missing `auth` becomes a compile error (required
   property) and a runtime `TypeError` naming the exact opt-out for JS callers. This is the only place one
   rule can cover first-party, generated third-party, and hand-written connectors (A1, A16).
2. **Guarded posture reuses the service port unchanged:** `auth: { authn: AuthnOptions; authz?: AuthzOptions }`
   is the same shape `defineService` accepts (A3), so #1382 and #1383 share one vocabulary.
3. **Public posture is data, greppable, and reasoned:** `auth: { public: true; reason: string }`. Recommended
   over the bare string `'public'` because every recorded opt-out must say why (F1).
4. **Factory-owned anonymity merge:** when a caller supplies `allowAnonymous`, the factory unions it with
   `DEFAULT_ANONYMOUS_PREFIXES` so `/health` cannot be dropped by accident (A3). The factory does not add
   `/api/openapi.json`, `/api/docs` or `describe` on its own — those are per-service decisions and the MCP
   probe already tells operators the exact knob (A9).
5. **Ordering:** the factory applies `withAuthn`/`withAuthz` immediately after `withContext` and before
   `withRPC` (issue target 1). The builder guarantees it anyway (A2); the factory test locks the observable.
6. **First-party adoption cannot be guarded in this PR without breaking the runtime suite, the generated app
   and eis-chat (A9, A12, A13).** The honest reconciliation is: every first-party service declares
   `auth: { public: true, reason }` now, where each reason names the blocking dependency (credential plumbing
   for the e2e suite and generated app; `me`/`signout` with #1384 for auth). That is not "silently optional":
   it is a required, greppable declaration whose removal is the next PR's job.
7. **Generated third-party services get the guarded form** (issue target 5) because the generator must emit
   *some* posture once the field is required, and the issue's stated intent is guarded (F2 governs proof).

## 3. Recommended next PR — exact mutation paths

### 3.1 `packages/plugin` (Archetype 5 factory authority)

| Path | Change |
| ---- | ------ |
| `packages/plugin/src/service/presentation/create-plugin-service.ts` | Add `PluginServiceAuthConfig` union + `PluginServicePublicPosture { readonly public: true; readonly reason: string }` and `PluginServiceGuardedPosture { readonly authn: AuthnOptions; readonly authz?: AuthzOptions }`; add required `readonly auth: PluginServiceAuthConfig` to `PluginServiceConfig`; runtime validation (`TypeError` with message naming `auth: { public: true, reason: '…' }`); apply after `withContext`, before `withRPC`; union `allowAnonymous` with `DEFAULT_ANONYMOUS_PREFIXES`; update the module and function JSDoc chain description. |
| `packages/plugin/src/service/mod.ts` | Export the three new types. `AuthnOptions`/`AuthzOptions` come from `@netscript/service` (already a dependency; no new edge). |
| `packages/plugin/tests/service/create-plugin-service-auth_test.ts` (new) | Tests in § 5. |
| `packages/plugin/tests/service/create-plugin-service_test.ts`, `src/service/presentation/create-plugin-service-rawroute_test.ts`, `src/sdk/runtime/plugin-service-context-generated-consumer_test.ts` | Add an explicit posture to every existing factory call (declaration only; assertions unchanged). |
| `packages/plugin/README.md`, `docs/site/reference/plugin/index.md`, `docs/site/explanation/plugin-system.md` | Document the required posture, both shapes, the merge rule, and the grep (`public: true`). |

### 3.2 First-party services (explicit posture, no behaviour change)

| Path | Declaration |
| ---- | ----------- |
| `plugins/workers/services/src/main.ts`, `plugins/sagas/services/src/main.ts` | `auth: { public: true, reason: '#1383 step 4: guarded adoption needs e2e/app credential plumbing' }` |
| `plugins/triggers/services/src/main.ts` | same reason; note in code that webhook ingress under `/api/v1/webhooks/` must be listed in `allowAnonymous` when guarded (A6). |
| `plugins/streams/services/src/main.ts` | same reason; proxy catch-all (`serveRpc:false`) is a raw route and will be guarded by prefix when adopted. |
| `plugins/auth/services/src/main.ts` | `public` with a reason citing A14 and #1384 (F3). |

Zero runtime difference: `public` installs no middleware, so every landed HTTP test and runtime gate keeps
its current expectation.

### 3.3 Generator (`netscript plugin new`)

| Path | Change |
| ---- | ------ |
| `packages/cli/src/public/features/plugins/new/new-plugin-use-case.ts` | Connector `services/src/main.ts` template emits the guarded form: `import { createAuthServiceAuthenticator } from '@netscript/plugin-auth/authenticator'`, `auth: { authn: { authenticator: createAuthServiceAuthenticator({ serviceName: 'auth', timeoutMs: <literal> }) } }` with `serviceName: 'auth'` justified by A10 (the reference key the installer wires); connector `deno.json` imports gain `@netscript/plugin-auth` at `GENERATED_PLUGIN_VERSION`; connector manifest gains `.withDependencies({ auth: authPlugin })` so `PluginReferences` and `services__auth__http__0` are wired (A10); emitted manifest test extended to assert the dependency. |
| `packages/cli/src/public/features/plugins/new/new-plugin_test.ts` | Assert the emitted main contains `auth:` with `createAuthServiceAuthenticator`, the emitted `deno.json` lists `@netscript/plugin-auth`, and the manifest declares the auth dependency. |
| Generated carriers | `gen:agent-docs-prose` → `gen:mcp-export-corpus` → `gen:assets-barrel` → `gen:publish-assets` (new exports in `@netscript/plugin`; docs pages change). |

The literal `timeoutMs` in the template is a generator default, not a framework default: it lives in the
emitted user-owned file where the author edits it. Value is an owner choice (F2 bundle); the template must
not read env for it.

### 3.4 Third-party fixture proof (issue "Docs/consumer proof")

`packages/plugin/tests/service/create-plugin-service-third-party-fixture.http_test.ts` (new): a minimal
non-first-party contract + router built with the factory in guarded posture using
`createAuthServiceAuthenticator` against the **native auth service** served in-process with a caller-owned
`MemoryKvAdapter` (same pattern as the landed `session-credentials-http_test.ts`), plus a static-credential
variant for the 403 case. This is the "third-party plugin fixture guarded end to end" the issue asks for.
`packages/plugin` → `plugins/auth` is a test-only relative import (as `bearer-contribution_test.ts` already
does across siblings); it adds no package dependency edge.

### 3.5 Not in this PR (stated remaining #1383 scope)

- Step 4: guarded first-party adoption (needs: e2e credential path for `probe-plugin-resource.ts`, generated
  app credential attachment via the auth `sdk-client` starter, `withDependencies({ auth })` on workers/sagas/
  triggers/streams manifests, per-service `allowAnonymous` for webhooks/openapi, and the auth service's own
  posture with #1384). Acceptance box 5 remains unchecked; box "gate: scaffold.runtime green with guarded
  plugin services" remains unchecked (the suite will be green with *declared* services, which is not the same
  claim and must not be ticked).
- `access` metadata on the four plugin cores (prerequisite for contract authorizers there, A5).
- #1382 `defineService` change and its test replacement (must adopt the same `PluginServiceAuthConfig`
  vocabulary; F1).
- Docs how-to sentence "how to protect a plugin API" can be written after this PR from the fixture; the
  `identity-access/auth.md` narrative update belongs with step 4.

## 4. Compatibility impact

| Consumer | Effect | Mitigation |
| -------- | ------ | ---------- |
| Every `createPluginService` caller (5 first-party, generated connectors, external) | **Breaking**: required `auth` → compile error; JS callers get a `TypeError` at factory call. | Explicit declarations in-repo (3.2/3.3); release note with the exact snippet; `breaking` label. Publication is owner-gated. |
| Generated third-party plugins on published `@netscript/plugin-auth@0.0.7` | The emitted guarded main imports `./authenticator`, which does not exist on JSR until the next owner-approved release. | F2: verification runs in local-source mode (`netscript-dev` copies unpublished packages); `netscript plugin new` on a JSR-backed workspace stays broken until publication and must be documented. |
| eis-chat | None at runtime (A13); type-level only if it ever calls the factory directly. | Note in PR body. |
| `scaffold.runtime` 104 gates | None (public posture installs nothing). | Full run required anyway (plugin services + generator touched). |
| Auth service | None (F3). | — |

## 5. Contract and behavioural tests (named)

Factory (`create-plugin-service-auth_test.ts`), all through `createPluginService(...).build()` and
`app.request` (no listener):
1. omitted `auth` → `TypeError` whose message contains `auth: { public: true, reason:` (JS-level call via `as unknown as` is **not** used; use a `Partial` config through a typed helper with `// quality-allow` only if the scanner requires it — otherwise cast-free via `Object.assign({}, cfg)` typed as the config with `auth` deleted in a `satisfies`-free JS object).
2. `public` posture: `/api/rpc/v1/<ns>/describe`-equivalent REST and RPC calls answer as today (200), `/health` 200.
3. guarded posture with `createStaticCredentialAuthenticator` + `createScopeAuthorizer`: unauthenticated `POST /api/rpc/v1/<ns>/*` → 401; unauthenticated `GET /api/v1/<ns>/*` → 401; valid credential with insufficient scope → 403 on both; `/health`, `/health/live`, `/health/ready`, `/` → 200 without credential; `/api/openapi.json` → 401 unless listed in `allowAnonymous`.
4. `allowAnonymous: ['/api/openapi.json']` keeps `/health` anonymous (merge rule) — the exact footgun in A3.
5. reordering cannot bypass: the same config with fields in reverse literal order and with `rawRoutes` + `serveRpc:true` yields identical 401/403/200 results; raw routes under `/api` are guarded unless anonymous.
6. guard-ordering regression: with an authenticator that records calls and a router that records handler entry, an unauthenticated RPC call records **no** handler entry and one authenticator call (proves authn precedes routing, issue box "a guard test fails if a future change registers RPC before authn").
7. verifier failure → 503 redacted (reuses the #2001 contract; one case).

Generator (`new-plugin_test.ts`): emitted files contain the guarded posture, dependency and import; emitted
sources pass `deno check` in the test's temp workspace against local sources (F2).

Third-party fixture HTTP test (3.4): active native session → 200 with principal reaching the handler;
missing bearer → 401 without any auth-service call; revoked → 401; auth service stopped → 503.

## 6. Native generators and proof commands (in order)

```text
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/plugin --root plugins --root packages/cli/src/public/features/plugins/new --ext ts
deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all --unstable-kv packages/plugin plugins/auth/tests plugins/workers plugins/sagas plugins/triggers plugins/streams packages/cli/src/public/features/plugins/new
deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/plugin --root plugins --ext ts
deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/plugin --root plugins --ext ts
deno task quality:gate
deno task doc:lint --root packages/plugin --pretty
(cd packages/plugin && deno publish --dry-run --allow-dirty)
deno run --allow-read --allow-run --allow-env .llm/tools/fitness/audit-jsr-package.ts --root packages/plugin --text
deno task gen:agent-docs-prose && deno task gen:mcp-export-corpus && deno task gen:assets-barrel && deno task gen:publish-assets
deno task docs:exports-drift && deno task check:mcp-export-corpus && deno task check:assets-barrel && deno task check:publish-assets && deno task docs:jsdoc-examples
deno task e2e:cli run scaffold.runtime --cleanup --format pretty        # required: plugin services + generator touched
deno run -A packages/cli/bin/netscript-dev.ts plugin new <fixture-name>  # inside a local-source scaffold, then deno check of the emitted workspace (F2 proof)
```

Every gate is wrapper-sourced; raw `deno check .` / `deno fmt --check` are not verdicts. The e2e run is
the merge-readiness pass, not an inner-loop command.

## 7. Owner forks (explicit; not decided here)

| Fork | Options | Recommendation and why |
| ---- | ------- | ---------------------- |
| F1 opt-out spelling | `auth: 'public'` string vs `auth: { public: true, reason }` object | Object: a reason is auditable and the same union serves #1382; `grep -rn "public: true"` finds every opt-out. |
| F2 generated guarded form before publication | (a) emit guarded now, prove in local-source mode only; (b) emit explicit `public` until release; (c) defer the generator to a third PR | (a): the required field forces a choice, the issue's target is guarded, and `netscript-dev` local-source scaffolds are the existing verification route; document the JSR-mode limitation. Also pick the template `timeoutMs` literal here. |
| F3 auth service posture | keep `/session` public discovery (public declaration + reason) vs guard with contract authorizer | Keep public now: A14 shows the contract meta and the documented/gated posture disagree; resolving that belongs with #1384 and step 4. |

## 8. Unknowns (not inferred)

- Whether the owner wants the `breaking` label and RFC for the required field before the next release
  (netscript-pr: substantial/breaking changes may need an RFC). Not decided here.
- Whether `describe` should be framework-anonymous. No consumer in this repo calls it over HTTP except the
  factory test; left per-service.
- Whether the four plugin cores will gain `access` metadata (A5) or first-party adoption will use prefix +
  scope rules; step-4 decision.
- `ScopeAuthorizerOptions.denyByDefault` documentation discrepancy (A18).

## 9. Harness placement

Same run dir, new draft PR after plan evaluation; body `Part of #1383` + this remaining-scope list, no closing
keyword; milestone `0.0.8`; labels `type:feat`/`type:fix` per coordinator, `area:plugins`, `area:service`,
`area:cli`, `area:auth`, `priority:p0`, one `status:`. Plan evaluation and implementation evaluation are
resolved by the coordinator from a fresh matrix relative to the actual generator; this session does not
certify anything.
