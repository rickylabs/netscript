# Plan (revision 2): factory-owned plugin service auth policy — one PR toward #1383

Planning only, written in the resumed native session (Fable 5.1 medium, `matrix-plan-revision.json`,
`revision-dispatch.json`). Baseline merged `main` `6d6b3057f`; branch `feat/plugin-service-auth-policy`;
draft PR #2003 (`status:plan`, `breaking`, milestone 0.0.8) is the review surface. `initial-plan.md` is
preserved and superseded by this file. No code, commit, push, issue, dependency, runtime or release
action is taken or authorized here. Evaluation is coordinator-owned and must come from a different vendor
family and session than this author and the eventual generator.

## Handoff summary

- **One PR:** make `PluginServiceConfig.auth` a required `ServiceAuthPolicy` — guarded `{ authn, authz? }`
  or recorded `{ public: true, reason }` — applied by `createPluginService` after `withContext` and before
  `withRPC`, passing native `AuthnOptions`/`AuthzOptions` through unchanged; add the factory guard tests the
  issue names; have all five first-party services declare an explicit posture (recorded `public` with the
  concrete unfinished-adoption dependency as reason); make `netscript plugin new` emit a guarded connector
  whose `@netscript/*` imports come from the native specifier generator; prove the generated connector with
  an executable, CLI-produced fixture over real HTTP (401 / 403 / 200) inside the local-source `scaffold.plugins`
  suite.
- **Chosen decisions (no owner forks):** D1 object opt-out `{ public: true, reason }` (both spellings are
  permitted by #1382 target 1); D2 generator emits native-pinned specifiers and a justified default
  `timeoutMs`; D3 auth service keeps its session-discovery contract and records `public`; D4 no automatic
  anonymous-prefix union; D5 first-party `public` reasons name the missing guarantees; D6 executable
  generator proof; D7 native negative tests (soundness fixture + JS `deno eval` boundary).
- **Explicitly open after this PR:** first-party guarded adoption (credential propagation, session seeding,
  per-service authorization policy, discovery wiring), #1384, #1382 itself, `access` metadata on the four
  plugin cores, the `scaffold.runtime` "guarded plugin services" gate box, and the eventual owner-approved
  release that makes the guarded generated form resolvable from JSR.
- **RFC posture:** `rfcs/README.md` § "When an RFC is required" lists breaking/public-API changes; the
  ratified seed issue (#1383 target contract 1–2, #1382 target 1, filed from seed PR #1347) is the accepted
  specification this PR implements and the PR already carries `breaking`. This lane does not open an RFC and
  does not ask the owner; it records that a maintainer may still request one under that README rule.

## 1. Source facts (re-verified at `6d6b3057f`)

| # | Fact | Source |
| - | ---- | ------ |
| S1 | `PluginServiceConfig` has no `auth`; fixed chain cors → logger → openapi → docs → database → `use()` → context → `withRPC` → `withHealth` → `withServiceInfo` → raw routes → hooks. | [observed - `packages/plugin/src/service/presentation/create-plugin-service.ts:63-104,137-194`] |
| S2 | Builder ordering is builder-owned: `build()` runs `installAuth()` before `installDeferredRoutes()`; RPC, `/api/openapi.json`, `/api/docs` and raw routes are deferred. | [observed - `packages/service/src/builder/service-builder-impl.ts:447-452,455-471,488-533`] |
| S3 | `AuthnOptions { authenticator, protect?=['/api'], allowAnonymous?=['/health'] }`; a caller-supplied `allowAnonymous` **replaces** the default (native semantics). `AuthzOptions { authorizer, denyByDefault? }`. | [observed - `packages/service/src/auth/auth-middleware.ts:29-32,213-222`; `deno doc --filter AuthnOptions packages/service/src/auth/mod.ts`] |
| S4 | `defineService` accepts `auth?: { authn: AuthnOptions; authz?: AuthzOptions }` and installs it via `withAuthn`/`withAuthz`; #1382 target 1 permits `auth: 'public'` **or** `auth: { public: true, reason: string }` for the opt-out and says both issues share one rule. | [observed - `packages/service/src/presets/define-service.ts:137-142,271-274`; issue #1382 § Target contract 1; issue #1383 § Target contract 2] |
| S5 | Only the auth contract carries `access` metadata; the base `describe` route and the workers/sagas/triggers/streams cores carry none, so a contract authorizer would deny every unmarked procedure there. | [observed - `grep -rn "authentication: '" packages/plugin-*-core/src packages/plugin/src`; `packages/plugin/src/contract-base/domain/base-contract.ts:111-116`; `packages/service/src/auth/contract-authorizer.ts:84-100`] |
| S6 | Landed authenticator: `createAuthServiceAuthenticator({ serviceName, timeoutMs, routerName?, protocol?, allowInsecureTransport? })` (first two required) from `@netscript/plugin-auth/authenticator`. | [observed - `deno doc --filter AuthServiceAuthenticatorOptions packages/plugin-auth-core/src/adapters/mod.ts`; `plugins/auth/deno.json` exports] |
| S7 | First-party factory calls: auth (context now carries `request`), workers, sagas, streams (`serveRpc:false`, catch-all proxy), triggers (`rawRoutes` webhooks `/api/v1/webhooks/:triggerId`, `/api/v1/events`). `plugins/ai` has no service. | [observed - `plugins/{auth,workers,sagas,streams,triggers}/services/src/main.ts`; `plugins/triggers/services/src/raw-trigger-routes.ts:12`] |
| S8 | The generator emits `createPluginService(router, { name, version, openApi })`, a connector `deno.json` importing `@netscript/aspire`, `@netscript/plugin` and the core at **`GENERATED_PLUGIN_VERSION = '0.0.1-alpha.17'`**, a contract with no `access` meta, and only a manifest identity test; registration writes `'./plugins/<name>/mod.ts'` into `netscript.config.ts`. | [observed - `packages/cli/src/public/features/plugins/new/new-plugin-use-case.ts:21,217-218,256-262,380-416,694-707,711-720`; `new-plugin_test.ts:13-37`] |
| S9 | Native version generation is `netscriptJsrSpecifier(pkg, subpath)` = `jsr:@netscript/<pkg>@<NETSCRIPT_RELEASE_VERSION><subpath>`; `JSR_SPECIFIERS` has `plugin-auth-core` but **no `plugin-auth` key**; the workspace mutator already maps `'@netscript/plugin-auth'` through it for the `auth` plugin kind; local-source projects (`packages/cli/deno.json` marker) get **no** exact pins because copied packages are workspace members and pins would shadow them. | [observed - `packages/cli/src/kernel/constants/jsr-specifiers.ts:36-52`; `packages/cli/src/kernel/adapters/plugin/workspace-mutator.ts:125-151,290,406-432`] |
| S10 | The JSR specifier checker enforces versioned / current / real-export rules on literal `jsr:@netscript/*` specifiers in `packages`+`plugins`, but template placeholders such as `${GENERATED_PLUGIN_VERSION}` are deliberately version-neutral, so the generator's alpha pin is **not** validated today. | [observed - `.llm/tools/validation/check-netscript-jsr-specifiers.ts:1-15,30,391-426`; `.llm/tools/netscript-jsr-specifier.ts:10,24-32`; `deps:latest` → `@netscript/plugin` stable `0.0.7`] |
| S11 | `scaffold.runtime` probes plugin APIs without credentials and requires 200 (`expectOk`): workers jobs/tasks/seed/executions, sagas, triggers webhook/events, auth `/api/v1/auth/session`; its auth smoke env is kv-oauth with a fake GitHub provider, so no session can be minted in the suite. `plugin doctor` makes no HTTP calls. | [observed - `packages/cli/e2e/src/application/gates/scaffold/runtime/behavior-gates.ts:162-256`; `probe-plugin-resource.ts:53-95`; `runtime-scripts.ts:128-140`] |
| S12 | The generated Fresh app has no access-token concept; the auth plugin ships the `sdk-client` starter for explicit attachment. | [observed - `grep -rl getAccessToken packages/fresh/src` → none; `plugins/auth/src/adapter/resources/sdk-client.ts`] |
| S13 | Manifest `withDependencies({...})` is what the installer turns into `PluginReferences` and `services__<key>__http__0`; the auth plugin key is `auth`. | [observed - `plugin-reference-reconciler.ts:40-97`; `generators-service-plugin_test.ts:409`] |
| S14 | `plugin-service-context-generated-consumer_test.ts` imports and starts the auth, sagas and workers service mains directly; it is a first-party consumer of every `main.ts` factory call. | [observed - `packages/plugin/src/sdk/runtime/plugin-service-context-generated-consumer_test.ts:5-7,68`] |
| S15 | Native negative-test conventions: `*-soundness_test.ts` files may use `@ts-expect-error` (scanner-exempt); `as unknown as`/`as any`/`as never` and `@ts-*` suppressions elsewhere are quality findings; subprocess `deno eval --config … <source>` tests exist. | [observed - `.llm/tools/quality/scan-code-quality.ts:117-120,162-164,1081,1168`; `packages/plugin-auth-core/tests/contracts/auth-contract-soundness_test.ts:15-36`; `packages/plugin-auth-core/src/sdk/bearer-contribution_test.ts:379-380`] |
| S16 | The auth contract marks `session` `authentication:'required'`, while the documented and gated discovery posture is "unauthenticated `GET /session` → `{authenticated:false}`" (200). | [observed - `packages/plugin-auth-core/src/contracts/v1/auth.contract.ts:412-416`; `docs/site/identity-access/how-to/add-authentication.md:253-262`; `behavior-gates.ts:256`] |
| S17 | e2e suites: `scaffold.plugins` (local-source official plugin scaffold smoke, no Aspire), `scaffold.userland-install`, `scaffold.runtime` (104 gates). Probe scripts run with `--config <repo>/packages/mcp/deno.json` style import resolution. | [observed - `deno task e2e:cli suites`; `behavior-gates.ts:101-112`] |
| S18 | Route-authz tutorial establishes the `<ns>:read` / `<ns>:write` scope vocabulary with `createScopeAuthorizer` and `createContractAuthorizer`. | [observed - `docs/site/tutorials/workspace/05-route-authz.md` § Step 2; `find_guidance` over `docs/site`, 2026-09-08] |
| S19 | `packages/service` own drain budget is 30 000 ms; the MCP telemetry probe uses 1 500 ms; the first external consumer verified sessions with 10 000 ms. | [observed - `packages/service/src/types.ts:175`; `packages/mcp/src/infrastructure/fetch-telemetry-probe.ts:9`; Cockpit `auth-session-reader.ts`] |
| S20 | #1383 boxes 3–4 are ticked; boxes 1, 2, 5–12 open. Existing `packages/plugin` factory tests use `as any` twice (pre-existing). | [observed - live issue body 2026-09-08; `packages/plugin/tests/service/create-plugin-service_test.ts:33,37`] |

## 2. Decisions (chosen; each is a technical choice within accepted issue text)

| ID | Decision | Rationale |
| -- | -------- | --------- |
| D1 | Opt-out spelling is the object form `auth: { public: true, reason: string }`; the union `ServiceAuthPolicy = { authn: AuthnOptions; authz?: AuthzOptions } \| { public: true; reason: string }` is defined once in `@netscript/service/auth` (types only, additive) and consumed by `PluginServiceConfig.auth` (required). | #1382 target 1 permits either spelling; the object carries an auditable reason and one grep (`public: true`) finds every opt-out. Defining the type in `@netscript/service` keeps one vocabulary for #1382 without implementing it (S4); `packages/plugin` already depends on `@netscript/service`, so no new edge. |
| D2 | The generator emits `@netscript/*` connector imports through `netscriptJsrSpecifier()` (adding a `plugin-auth` key to `NetscriptPackage`/`JSR_SPECIFIERS`) and omits exact pins inside local-source projects, mirroring the installer rule (S9). `GENERATED_PLUGIN_VERSION` stays only as the generated package's own version. The guarded template uses `createAuthServiceAuthenticator({ serviceName: 'auth', timeoutMs: 10_000 })` plus `createScopeAuthorizer` rules `GET → '<name>:read'`, otherwise `'<name>:write'`; the manifest declares `withDependencies({ auth: authPlugin })`. | Native version generation is the specifier generator, not a hand pin (S9); the alpha pin bypasses the checker (S10) and would make published-mode generated connectors unresolvable. `serviceName:'auth'` is the reference key the installer wires (S13). `timeoutMs` 10 000 is a bounded per-request budget: one third of the native drain budget and equal to the first consumer's value (S19); it lives in the emitted user-owned file. Scope names follow the tutorial vocabulary (S18); a contract authorizer is not emitted because the generated contract has no `access` meta (S5). |
| D3 | The auth service declares `auth: { public: true, reason: 'GET /session is the published unauthenticated discovery contract (#1383 S16); guarded posture and signout authorization are #1384 / step-4 follow-ups' }`. This declaration certifies nothing about signout. | S16: guarding the auth service now would contradict its own documented contract and gate. |
| D4 | The factory passes `authn`/`authz` to `withAuthn`/`withAuthz` **unchanged**. No union with `DEFAULT_ANONYMOUS_PREFIXES`, no private constants, no parallel guard policy. Generated and first-party guarded configs omit `allowAnonymous` so the native `/health` default holds; docs state that a custom `allowAnonymous` replaces the native default (S3). | Native `AuthnOptions` already gives callers explicit control; a factory-side merge would be a second policy. |
| D5 | Workers, sagas, triggers and streams declare `auth: { public: true, reason }` where the reason names the concrete missing guarantees: (1) callers have no credential to present — the generated app carries no session credential (S12), the runtime suite cannot seed a session (S11); (2) no per-service authorization policy exists — cores lack `access` metadata (S5), webhook and OpenAPI anonymity are undecided per service; (3) no discovery reference to the auth service is declared in their manifests (S13). These are recorded unfinished adoption, not guarded acceptance and not a canary basis. | Correction 5: the boundary is the missing credential propagation / session seeding / authorization policy, not "tests expect 200". |
| D6 | Generated-connector proof is executable and CLI-produced: a `scaffold.plugins` gate group runs `netscript-dev plugin new guarded-fixture`, `generate plugins`, the scoped check, then a probe that starts the native auth service in-process (in-memory kv-oauth, caller-owned `MemoryKvAdapter`), points `services__auth__http__0` at it, builds the generated connector service from the scaffold with `--config <scaffold>/deno.json`, and asserts 401 / 403 / 200 (§ 5). | Correction 6: string search of emitted files does not prove manifest dependency, native discovery, generated imports and factory policy work together. |
| D7 | Missing-`auth` negative tests use native mechanisms only: compile-time `packages/plugin/tests/service/create-plugin-service-soundness_test.ts` with `@ts-expect-error` (scanner-exempt by filename, S15) and a runtime JavaScript boundary via `deno eval` subprocess (no casts, no suppressions, S15). | Correction 7. |
| D8 | Breaking change handling: required `auth` is a compile error for TypeScript callers and a `TypeError` naming the exact opt-out for JavaScript callers; migration note (exact snippet for both postures) in `packages/plugin/README.md` and the reference page; `breaking` label already applied; release notes are written when the owner cuts a release. | rfcs/README and netscript-pr; no release is run or assumed. |

## 3. Exact mutation paths

### 3.1 `packages/service` (types only, additive)

| Path | Change |
| ---- | ------ |
| `packages/service/src/auth/options.ts` | Add `ServiceGuardedAuthPolicy { readonly authn: AuthnOptions; readonly authz?: AuthzOptions }`, `ServicePublicAuthPolicy { readonly public: true; readonly reason: string }`, `ServiceAuthPolicy` union, and `isPublicAuthPolicy(policy): policy is ServicePublicAuthPolicy`. |
| `packages/service/src/auth/mod.ts`, `packages/service/mod.ts` | Export the three types and the guard. `defineService` is **not** changed (#1382 stays open). |
| `docs/site/reference/service/index.md` (or the page `docs:exports-drift` maps for `@netscript/service`) | New symbols rows. |

### 3.2 `packages/plugin` (factory authority)

| Path | Change |
| ---- | ------ |
| `packages/plugin/src/service/presentation/create-plugin-service.ts` | `readonly auth: ServiceAuthPolicy` (required) on `PluginServiceConfig`; runtime check: `auth` missing or neither shape → `TypeError('createPluginService requires an explicit auth policy: pass { authn, authz? } or { public: true, reason: "…" }')`; guarded → `builder.withAuthn(auth.authn)` then `withAuthz(auth.authz)` if present, placed after `withContext` and before `withRPC`; `public` → nothing installed. Update module/function JSDoc chain text and example. |
| `packages/plugin/src/service/mod.ts` | Re-export `ServiceAuthPolicy` family from `@netscript/service` (type re-exports, same pattern as `Principal`). |
| `packages/plugin/tests/service/create-plugin-service-auth_test.ts` (new) | § 5 factory tests. |
| `packages/plugin/tests/service/create-plugin-service-soundness_test.ts` (new) | Compile-time negative (D7). |
| `packages/plugin/tests/service/create-plugin-service_test.ts`, `src/service/presentation/create-plugin-service-rawroute_test.ts`, `src/sdk/runtime/plugin-service-context-generated-consumer_test.ts` | Add an explicit posture to each factory call; assertions unchanged. |
| `packages/plugin/README.md`, `docs/site/reference/plugin/index.md`, `docs/site/explanation/plugin-system.md`, `docs/site/orchestration-runtime/how-to/author-a-plugin.md` | Required posture, both shapes, native `allowAnonymous` semantics, migration snippet. |

### 3.3 First-party services (declaration only, zero runtime change)

`plugins/workers/services/src/main.ts`, `plugins/sagas/services/src/main.ts`, `plugins/triggers/services/src/main.ts`,
`plugins/streams/services/src/main.ts` → D5 reason; `plugins/auth/services/src/main.ts` → D3 reason.

### 3.4 Generator and native specifiers

| Path | Change |
| ---- | ------ |
| `packages/cli/src/kernel/constants/jsr-specifiers.ts` | Add `'plugin-auth'` to `NetscriptPackage` and `JSR_SPECIFIERS`. |
| `packages/cli/src/public/features/plugins/new/new-plugin-use-case.ts` | Connector `deno.json`: `@netscript/*` imports via `JSR_SPECIFIERS` (published mode) or omitted in local-source projects (marker from S9; the mutator's `ensureRootImportsForPluginKind` pattern); add `@netscript/plugin-auth`. Connector `services/src/main.ts` template: guarded posture per D2. Connector `mod.ts` template: `.withDependencies({ auth: authPlugin })` importing `authPlugin` from `@netscript/plugin-auth`. Manifest test template: also asserts the `auth` dependency. |
| `packages/cli/src/public/features/plugins/new/new-plugin_test.ts` | Emitted `deno.json` uses the release specifier for `@netscript/plugin-auth`; local-source emission has no exact pins; emitted main declares a guarded policy (content assertions are a precondition for § 5, not the proof). |
| `packages/cli/e2e/src/domain/cli-surface.ts`, `packages/cli/e2e/src/application/gates/scaffold/plugin-install-gates.ts` (or a new `generated-guarded-plugin-gates.ts`), new probe `packages/cli/e2e/src/application/gates/scaffold/probe-generated-guarded-plugin.ts` | D6 gate group in `scaffold.plugins`. |
| Generated carriers | `gen:agent-docs-prose` → `gen:mcp-export-corpus` → `gen:assets-barrel` → `gen:publish-assets`. |

## 4. Compatibility and migration

| Consumer | Effect | Disposition |
| -------- | ------ | ----------- |
| TypeScript callers of `createPluginService` (5 first-party, S14 test, generated connectors, external) | Compile error until a posture is declared. | In-repo callers updated in this PR; README/reference migration snippet; `breaking` label. |
| JavaScript callers | `TypeError` naming both postures at factory call. | Same snippet. |
| Published JSR consumers | Nothing until an owner-approved release ships `@netscript/plugin` with the required field and `@netscript/plugin-auth/authenticator`; the generated guarded connector's imports resolve only from that release. | Not promised here; local-source verification only (D2/D6). No release is run. |
| eis-chat | No runtime effect (it starts first-party mains through the host context). | Note in PR body. |
| `scaffold.runtime` 104 gates | No change: `public` installs nothing; `generated.plugins-check`/`deno-check` cover the new generator output when a generated plugin is present. | Full run still required (plugin services + generator touched). |
| Auth service | No change (D3). | — |

## 5. Behavioural gates and tests

Factory (`create-plugin-service-auth_test.ts`, in-process `app.request`):
1. `public` posture: existing REST/RPC calls answer as today; `/health` 200.
2. guarded with `createStaticCredentialAuthenticator` + `createScopeAuthorizer`: unauthenticated `POST /api/rpc/v1/<ns>/*` → 401; unauthenticated `GET /api/v1/<ns>/*` → 401; valid credential lacking scope → 403 on both; `/health`, `/health/live`, `/health/ready`, `/` → 200 anonymous; `/api/openapi.json` → 401 (native default) and 200 only when the caller passes `allowAnonymous: ['/health', '/api/openapi.json']` (native replace semantics, D4).
3. reordering: identical config with reversed literal key order and with `rawRoutes` + `serveRpc:true` yields identical results; raw routes under `/api` are guarded.
4. guard-ordering regression: recording authenticator + recording handler; an unauthenticated RPC call records one authenticator call and **no** handler entry.
5. verifier throw → 503 redacted (one case, reuses #2001 contract).
6. runtime negative (D7): `deno eval` JavaScript importing the factory by file URL and calling it without `auth` exits non-zero with the `TypeError` text on stderr.
7. compile-time negative (D7): soundness fixture `@ts-expect-error` on a config without `auth` and on `{ public: true }` without `reason`.

Generator (`new-plugin_test.ts`): specifier and posture emission per § 3.4 (precondition only).

Executable generated-connector proof (`scaffold.plugins`, local-source, no Aspire):
1. `netscript-dev plugin new guarded-fixture --project-root <scaffold>`; 2. `generate plugins`; 3. scoped
`run-deno-check.ts` over the generated workspace; 4. probe: start native auth service in-process with a
caller-owned `MemoryKvAdapter` and in-memory kv-oauth, complete signin/callback to mint a session with scopes
`['guarded-fixture:read']`, set `services__auth__http__0`, build the generated connector's exported service
(`--config <scaffold>/deno.json`), then assert: no bearer → 401 on `POST /api/rpc/v1/guarded-fixture/*` and
`GET /api/v1/guarded-fixture/*`; session bearer with `:read` → 200 on the generated `GET /guarded-fixture`
list route; same bearer on a write route → 403; `/health` 200 without bearer; auth service stopped → 503.
Every listener and adapter is closed in `finally`. This gate is the evidence for boxes 6–9 on generated
output; boxes 7–9 are additionally proven on the factory fixture.

Proof commands (wrapper-sourced):
```text
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/service --root packages/plugin --root plugins --root packages/cli/src/public/features/plugins/new --root packages/cli/src/kernel/constants --ext ts
deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all --unstable-kv packages/service/tests/auth packages/plugin plugins/auth/tests plugins/workers plugins/sagas plugins/triggers plugins/streams packages/cli/src/public/features/plugins/new
deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/service --root packages/plugin --root plugins --ext ts
deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/service --root packages/plugin --root plugins --ext ts
deno task quality:gate
deno task doc:lint --root packages/plugin --pretty && deno task doc:lint --root packages/service --pretty
(cd packages/plugin && deno publish --dry-run --allow-dirty); (cd packages/service && deno publish --dry-run --allow-dirty)
deno task check:netscript-jsr-specifiers
deno task gen:agent-docs-prose && deno task gen:mcp-export-corpus && deno task gen:assets-barrel && deno task gen:publish-assets
deno task docs:exports-drift && deno task check:mcp-export-corpus && deno task check:assets-barrel && deno task check:publish-assets && deno task docs:jsdoc-examples
deno task e2e:cli run scaffold.plugins --cleanup --format pretty        # carries the generated-connector proof
deno task e2e:cli run scaffold.runtime --cleanup --format pretty        # merge-readiness; plugin services and generator touched
```

## 6. Commit slices (each commits with run-dir updates, pushes, comments on #2003)

| # | Proves | Gate | Files |
| - | ------ | ---- | ----- |
| S0 | Baseline counts at `6d6b3057f` | wrapper test run | run dir |
| S1 | `ServiceAuthPolicy` vocabulary exists and is documented | check/test/doc-lint on `packages/service` | § 3.1 |
| S2 | Factory requires and applies the policy; native options pass through | factory tests 1–7, `quality:gate` | § 3.2 |
| S3 | First-party postures declared; runtime unchanged | plugin tests + S14 consumer test | § 3.3 |
| S4 | Generator emits native specifiers and the guarded form | generator tests, `check:netscript-jsr-specifiers` | § 3.4 (generator, constants) |
| S5 | Generated connector works end to end from CLI output | `scaffold.plugins` gate group | § 3.4 (e2e) |
| S6 | Surface carriers consistent; migration documented | drift/corpus/asset checks, publish dry-runs | docs + generated |

## 7. Remaining #1383 scope after this PR (verbatim for the PR body)

Guarded first-party adoption (credential propagation for the generated app and inter-service callers,
runtime-suite session seeding, per-service authorization policy incl. webhook/OpenAPI anonymity, manifest
`auth` dependencies) — boxes 5 (as guarded) and 12; `access` metadata on the four plugin cores; #1384;
#1382 (`defineService` adopts `ServiceAuthPolicy`); published-consumer availability of the guarded generated
connector, which needs an owner-approved release. Box 5's literal text ("configuration or a recorded
opt-out") becomes satisfiable by the declarations here; ticking it is the coordinator's call and must not be
read as guarded acceptance.

## 8. Explicit unknowns

- Whether a maintainer requires an RFC beyond the ratified issue text (rfcs/README rule); recorded, not asked.
- Whether `0.0.1-alpha.17` exists on JSR; irrelevant once D2 lands, noted only as the current latent defect.
- `ScopeAuthorizerOptions.denyByDefault` doc string ("Defaults to false") vs middleware fail-closed default;
  docs-lane item, untouched.
