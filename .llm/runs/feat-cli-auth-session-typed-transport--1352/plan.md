# Plan: CLI auth-session typed credential transport

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-cli-auth-session-typed-transport--1352` |
| Branch | `feat/cli-auth-session-typed-transport` |
| Phase | `plan` |
| Target | `packages/cli` auth-session adapter and command composition |
| Archetype | `6 - CLI Tooling` (Keep); SDK boundary is `2 - Universal Library` (Keep) |
| Scope overlays | `none` |

## Archetype

The product change is Archetype 6 because it modifies CLI command/application wiring and its HTTP
port adapter. The SDK is a boundary constraint, not an implementation target: its Archetype 2
discovery, client, contribution, and cache boundaries remain unchanged.

## Current Doctrine Verdict

Keep both `packages/cli` and `packages/sdk`. Preserve the CLI's port/adapter seam and the SDK's
browser-safe public contribution protocol. Do not add a CLI-to-server dependency or reach through
an internal SDK path.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| `A1` | The CLI composes an existing public auth contribution rather than duplicating bearer rules. |
| `A3` | Credential context and the HTTP port contract precede implementation. |
| `A4` | Exact-URL HTTP remains behind `AuthSessionHttpPort`; command code supplies context only. |
| `A7` | Credentials never enter discovery, cache keys, diagnostics, flags, or ambient readers. |

## Goal

Close #1352's sole residual by proving that the CLI's direct auth-session requests accept
application-supplied typed credential context and prepare bearer authorization through
`@netscript/plugin-auth-core/sdk`, without pretending that the public SDK can replace the adapter's
exact-URL transport.

## Scope

- Add an optional typed auth-session request context to `AuthSessionHttpPort`.
- Add an optional application resolver to the auth command dependencies and pass its result to list
  and revoke calls.
- Make `FetchAuthSessionHttp` invoke the public canonical bearer contribution's `prepare` protocol,
  merge its authorization patch with endpoint-owned headers, and preserve exact URLs/methods/bodies.
- Add focused tests for typed context propagation, bearer arrival, absence behavior, exact URLs,
  cleartext guards, non-disclosure, and forbidden imports.
- Add the CLI's explicit package dependency on `@netscript/plugin-auth-core`.

## Non-Scope

- No public SDK transport or discovery extension; that requires a separate reviewed issue.
- No import from `packages/sdk/src/internal/**` or any server-only auth surface.
- No cookie, session, CORS, `__Host-`, environment-token, or implicit-install convenience.
- No changes to `packages/sdk/src/internal/client-contributions/**`, tracing headers, locale
  contribution, or their tests (owned by #1927, #1921, and #1922).
- No repair of the dead localhost default tracked by #1243; supplied URLs remain verbatim.
- No duplication or expansion of #884, #885, #872, or #942.
- No Aspire, Docker, browser, or `e2e:cli` execution.

## Hidden Scope

- Treat the explicit URL as public `SdkClientTransportDescriptor` facts only; it is not an endpoint
  override.
- Model these non-contract endpoints as unmarked optional authentication so no context preserves
  existing unauthenticated behavior, while a supplied credential is guarded and attached.
- Use `responseCache: { mode: 'direct-only' }`; the adapter has no generated cache and no identity
  or credential can become a partition.
- Compare CLI doc-lint after the change with the recorded clean `origin/main` baseline.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| `D1` | Keep `FetchAuthSessionHttp` as exact-URL transport owner. | Public `createServiceClient` is discovery-based and cannot faithfully represent the stream URL. |
| `D2` | Use only `createBearerSdkClientContribution(...).prepare(...)` from the public auth-core SDK subpath. | This is the canonical typed contribution contract and centralizes metadata, secure-transport, resolution, and non-disclosure behavior. |
| `D3` | Application code supplies optional typed context through auth command dependencies on each invocation. | It proves caller ownership without a token flag or ambient state and preserves compatibility. |
| `D4` | Use unmarked=`optional`, context auth=`optional`, and direct-only cache policy. | Explicit endpoints lack procedure contracts; optional preserves absence semantics and direct-only forbids credential-derived cache identity. |
| `D5` | Preserve exact URL construction and leave #1243 untouched. | URL discovery/default repair is a separate ownership slice. |
| `D6` | Do not change any SDK source or export. | Widening SDK transport is explicitly a different issue and review boundary. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Full SDK call vs descriptor-backed adapter | resolved now | `D1` and `D2`: full migration is not publicly expressible; the narrow credential migration is honest. |
| Credential source | resolved now | `D3`: application dependency only; no CLI flag/environment/cookie/session source. |
| Authentication metadata for non-contract URLs | resolved now | `D4`: unmarked optional, never a parallel `policy.public` dialect. |
| Cleartext behavior | resolved now | Canonical contribution guard applies; use HTTPS fixtures or loopback in tests. |
| Public surface/carrier cascade | safe to defer | No package export or docs page moves; verify diff before close. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Calling `prepare` manually could be mistaken for full SDK transport migration. | Name and document the boundary precisely; assert exact URLs remain adapter-owned and make no SDK transport claim. |
| Header merging could overwrite content negotiation/body headers. | Merge through `Headers` and test GET accept plus POST content-type/authorization. |
| A credential could leak in an error. | Test insecure-origin failure against a random credential and assert the message excludes it; inherit canonical non-disclosure tests. |
| Optional resolver could be called unnecessarily or more than once. | Resolve once per command invocation and assert identity/call counts. |
| A server/private import could slip in. | Focused source test plus architecture gate and dependency diff review. |
| Adding dependency changes the lock. | Use the workspace-compatible published version already locked; fail close gate if `deno.lock` hash changes. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| `AP-1` | risk | Avoid a duplicate bearer helper; compose auth-core's public factory. |
| `AP-3` | risk | Keep command policy separate from the exact-URL HTTP adapter. |
| `AP-8` | risk | Do not import SDK internals or server packages. |
| `AP-12` | risk | Do not add token flags or ambient credential lookup. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| `F-3` | yes | `deno task arch:check` and source import scan |
| `F-5` | yes | `deno doc --lint` A/B delta and export diff |
| `F-6` | yes | CLI JSR audit and `deno publish --dry-run` |
| `F-7` | yes | `deno task docs:jsdoc-examples`, unboundName remains at or below 116 |
| `F-10` | yes | Focused auth tests and complete package-owned CLI suite with exact counts |
| `F-19` | yes | Structured check/lint/fmt/test runners scoped to `packages/cli` |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| none | none | The exact-URL limitation is not deepened; a future public transport extension is separate scope. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | Focused tests | structured test runner for `auth-plugin-command_test.ts` | exit 0; exact pass count recorded |
| 2 | CLI full tests | structured test runner rooted at `packages/cli` | exit 0; exact pass count recorded |
| 3 | Check | `run-deno-check.ts --root packages/cli --ext ts,tsx` | exit 0 |
| 4 | Lint | `run-deno-lint.ts --root packages/cli --ext ts,tsx` | exit 0 |
| 5 | Format | `run-deno-fmt.ts --root packages/cli --ext ts,tsx` | exit 0 |
| 6 | Doc A/B | `deno task doc:lint --root packages/cli --pretty` vs pre-change `origin/main` baseline | exit 0; 0 new diagnostics |
| 7 | JSR audit | repo `jsr-audit packages/cli` workflow | exit 0; no new errors |
| 8 | Publish | `deno publish --dry-run` from `packages/cli` | exit 0; stderr listing retained in evidence |
| 9 | JSDoc examples | `deno task docs:jsdoc-examples` | exit 0; unboundName ceiling <=116 |
| 10 | Quality | `deno task quality:gate` | exit 0 |
| 11 | Architecture | `deno task arch:check` | exit 0 |
| 12 | Hygiene | `git diff --check`; lock hash; forbidden paths/import scan | clean; hash unchanged |

## Risks

- If PLAN-EVAL finds that direct public descriptor preparation is not sanctioned, stop and report
  the public SDK extension as coordinator scope; do not implement a workaround.
- If the final audit or gates leave any row outstanding, use `Refs #1352`, state the residual, and
  leave the issue open.

## Dependencies

- Published `@netscript/plugin-auth-core/sdk` exact three-symbol surface from PR #1915.
- Public `@netscript/sdk` contribution descriptor types, used only transitively through the factory.
- Issue #1243 retains ownership of default URL reachability.

## Drift Watch

- Any required SDK/source export change, server/private import, public CLI export, documentation
  carrier move, lockfile change, or regression from exact URL semantics is significant drift and
  pauses the slice.
