# #709 Auth CLI — implementation worklog

## Plan (PLAN-EVAL owner-waived; carried drift D1)

- Baseline: `eac57c5f5ac4c10b9c1cc5b17874ae821b27a20d` on `feat/709-auth-cli`.
- Profile: Archetype 6 CLI/tooling. The change extends the existing public `plugin` vertical with an
  `auth` sub-feature; it does not alter plugin package exports or backend architecture.
- Slice 1: define the auth CLI contract and adapters, wire
  `plugin auth backend/provider/secret/session`, and prove configuration, generated key
  compatibility, stream projection reads, and signout revocation with targeted semantic tests.
- Slice 2: rewrite the authentication how-to around the CLI verbs and add scaffold-runtime E2E gate
  coverage that the beta-9 orchestrator will execute.
- Validation: scoped CLI check/lint/fmt wrappers, targeted CLI/auth tests, and lock-file diff
  inspection. The orchestrator owns `scaffold.runtime`; it must remain explicitly unproven here.
- Risk: durable-stream wire responses may vary by server version. Mitigation: accept the canonical
  JSON state projection shapes and fail with a precise error for non-JSON responses.
- Risk: secrets must not be persisted accidentally. Mitigation: `secret generate` prints only;
  config writes use `.env` with deterministic key reconciliation.
- Deferred: live third-party OAuth, live Aspire startup, and IMPL-EVAL are orchestrator-owned gates.

## Design

- Public commands: `netscript plugin auth backend set|show`, `provider set`, `secret generate`, and
  `session list|revoke`.
- Domain vocabulary: `AuthBackend`, `AuthProviderPreset`, `AuthSecretKind`, `AuthSessionProjection`,
  and constants for the finite backend/preset/secret sets and environment keys.
- Ports: the existing `FileSystemPort` owns workspace config I/O; `AuthSessionHttpPort` owns stream
  reads and signout requests; output remains injected at the command boundary.
- Adapters: `DenoFileSystem` is composed by the existing public dependency root; a Fetch-backed HTTP
  adapter is composed there as the network edge.
- Configuration seam: reconcile auth keys in project-root `.env`; backend `show` falls back to the
  service-supported `appsettings.json` `auth.backend` / `Auth.Backend` forms.
- Provider presets: encode provider endpoint policy as data, with GitHub/Google/Okta plus the
  documented common presets. Custom tenant providers accept `--issuer`; WorkOS/better-auth variants
  map their own credential flags to their boot-time environment names.
- Session semantics: list the `/auth/sessions` durable projection and filter active rows; revoke
  posts `{ sessionId }` to `/api/v1/auth/signout` and reports the returned id.
- Spine abstracts: existing `CliRoot<T>`, `CliCommand<T>`, `UseCase<TInput,TOutput>`,
  `Pipeline<TContext,TResult>`, and `Registry<TKey,TValue>`; this slice adds no abstract or
  registry.
- Layer-2 abstracts: none introduced.
- Vertical feature catalog change: `public/features/plugins/auth/` with one command group and its
  contract/config/session collaborators; existing plugin install/doctor/dispatch features remain
  intact.
- Extension axes: none introduced; auth backends/providers are closed CLI configuration
  vocabularies, not implementation registries in the CLI.
- Constants: backend names, provider preset names, secret kinds, env keys, default service/stream
  URLs.
- Composition: `plugins-group.ts` owns the plugin subcommand list; it receives the new auth
  dependencies from `public-command-dependencies.ts`. No inline command actions are added to
  composition roots.
- Contributor path: add a provider by extending the preset data table and its semantic test; add a
  new auth operation as a sibling collaborator and register it in `auth-plugin-command.ts`.
- Generated outputs: `.env` plus the `Auth` appsettings config seam. Permissions: read/write for
  config, env for existing composition, network for session operations, crypto for secret generation.
- Semantic tests: parse/reconcile env values, instantiate the real backend registry with a generated
  key, mock the HTTP port for active-session listing/revocation, and parser-drive every new verb.

## Evidence

### Slice 1 — auth command contract, config seam, secrets, sessions

| Gate | Result | Evidence |
| --- | --- | --- |
| CLI auth semantic tests | PASS | Targeted `deno test` — 10 passed, 0 failed |
| Existing auth service tests | PASS | Targeted `deno test` — 8 passed, 0 failed |
| CLI scoped check / lint / format | PASS | Wrapper gates — 605 files, 0 findings |
| Auth plugin scoped check / lint / format | PASS | Wrapper gates — 35 files, 0 findings |

What is proven: backend/provider configuration is persisted to `.env` and the host-provided
`Auth.Environment` appsettings seam; a registry constructed with appsettings only selects and boots
`kv-oauth`; doctor reports the active backend; generated base64url key material is accepted by the
real resolver; WorkOS/better-auth variants map to the service's required names; and a session created
by real signin/callback handlers is listed and invalidated through the CLI command.

The GitHub preset is proven against backend-registry composition and the interactive signin/callback
handlers. No live third-party GitHub OAuth exchange was executed.

### Slice 2 — consumer documentation and scaffold-runtime coverage

- Rewrote how-to Steps 2 and 4 so backend/provider/secret CLI verbs are the primary path and direct
  environment exports are explicitly the deployment escape hatch.
- Replaced the scaffold runtime's auth helper-source mutation with parser-level execution of
  `backend set`, `secret generate`, and GitHub `provider set`, plus semantic assertions on the
  resulting appsettings seam.
- Scoped E2E source check / lint / format: **PASS** — 86 files, 0 findings from each wrapper.
- `scaffold.runtime` execution: **UNPROVEN HERE**. The slice brief explicitly reserves this expensive
  gate for the beta-9 orchestrator; this implementation agent did not run it.
- Live provider OAuth: **UNPROVEN**. Backend registry and interactive handler integration are green,
  but no GitHub network round-trip was attempted.

## Drift

- D1 (carried, owner-approved): PLAN-EVAL is waived for this slice; the short plan and design live
  here.
- D2 (implementation): the existing key resolver accepted padded standard base64 only while the issue
  requires base64url. The resolver now normalizes base64url and rejects decoded keys that are not
  exactly 32 bytes.
- D3 (implementation): `.env` alone was insufficient evidence that Aspire passes configuration into
  the plugin service. The CLI also reconciles `Auth.Backend` and `Auth.Environment` in appsettings,
  which the existing plugin service context already supplies to backend composition.

## Orchestrator fix-forward (Tier-A review, Codex lane quota-exhausted)

- CI scaffold-runtime `runtime.auth-smoke-env` failed in 6ms: the gate spawned
  `deno eval --allow-all <script>` and `deno eval` rejects `--allow-all` (eval always runs fully
  permissioned) — reproduced locally verbatim. Dropped the flag; scoped check clean.
- Applied by the beta-9 orchestrator (`09e5ae68`) — Codex lane at provider usage limit (resets 10:34).
