# Plan: issue #841 typed SDK auto-update seam

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `beta11-cli--orchestrator/slices/g2-841-autoupdate` |
| Branch | `feat/desktop-frontend-841-autoupdate` |
| Phase | `plan` |
| Target | `packages/sdk` — new `@netscript/sdk/auto-update` public subpath |
| Archetype | `4 — Public DSL / Builder`, with integration and runtime gates for this effectful subpath |
| Scope overlays | none; this SDK contract surfaces UI-ready data but does not implement Fresh/browser UI |

## Archetype

`@netscript/sdk` is assigned Archetype 4 by doctrine and currently has a **Keep** verdict. The new
surface wraps an external runtime and configures delayed/interval behavior, so the run also applies
Archetype 2's adapter-boundary expectations and the applicable Archetype 3 runtime checks without
reclassifying or restructuring the package. The caller surface remains one typed start call, not a
new builder hierarchy.

## Current Doctrine Verdict

**Keep — high cohesion already; minor naming review.** This change preserves focused subpaths,
keeps Deno effects in a named adapter, and adds no package-wide restructuring.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| A1 | Public events, options, results, and config are fixed before adapter code. |
| A2 | Consumers call one NetScript function and never branch on moving upstream globals. |
| A6 | The wrapper is justified by policy, telemetry, Windows truthfulness, and an upstream-churn/test seam—not a rename. |
| A7 | URL construction uses `URL`; platform identity uses stable `Deno.build`; telemetry uses the existing NetScript package. |
| A8 | Domain contracts, application orchestration, and Deno/telemetry adapters have one role each. |
| A9 | The package stays Archetype 4 while the new runtime subtype receives its additional gates. |
| A10 | The public function is a small composition root over injected internal adapters; no container. |
| A11 | The named axes are upstream API generation, release channel/target, and native apply capability. |
| A13 | Rollback is a structured telemetry boundary and a typed callback, never a console side effect. |
| A14 | Unit, consumer, docs, publish, quality, and architecture gates preserve the seam. |

## Goal

Publish one stable NetScript API that starts native desktop update checks from typed app release
config, works across both current and proposed Deno desktop namespaces, reports rollbacks through
NetScript telemetry, and truthfully turns a staged Windows update into a manual-installer UX event.

## Scope

- Add the dedicated `@netscript/sdk/auto-update` export.
- Add typed app release config, policy, callback events, release client, and start result.
- Resolve `<base>/<channel>/<os>-<arch>` from `Deno.build` and validate HTTPS trust inputs.
- Feature-detect old top-level and proposed `Deno.desktop` runtime shapes through local structural
  types only.
- No-op with an explicit disabled result under plain `deno run`, missing APIs, or null app version.
- Support launch checks and interval-only delayed start without claiming upstream cancellation.
- Classify Windows `onUpdateReady` as manual apply with the configured installer URL; classify
  supported platforms as automatic-on-relaunch.
- Emit rollback telemetry before invoking the consumer callback.
- Add unit tests, a consumer compile fixture, module/README docs, and JSR evidence.

## Non-Scope

- Native patch generation, manifest serving, installer hosting, or release-server implementation
  (#456).
- Real apply/failed-launch rollback execution on macOS/Linux or Windows manual-path E2E (#457).
- Combined-artifact snapshot updater, journal, or full Windows automatic apply (#834/#825,
  beta.14).
- Fresh UI for the manual update prompt (#843).
- Ambient Deno type augmentation or direct app use of `Deno.autoUpdate`.
- Release publication, tags, canaries, or milestone closure.

## Hidden Scope

- The proposed upstream namespace also renames `desktopVersion` to `appVersion`; both shapes must
  resolve without importing unstable desktop declaration libraries.
- The native API returns `void` and owns its interval, so the wrapper must not promise a stop handle.
- The manual installer URL is a trust input and must be HTTPS and app-config pinned, just like the
  update base URL and Ed25519 public key.
- Adding an export-map subpath requires the package check task, full-export doc lint, publish list,
  and a true self-subpath consumer fixture to remain coherent.
- Existing transitive SDK doc-lint debt must not be misreported as caused or fixed by this slice.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | `@netscript/sdk/auto-update` is the only consumer-facing update entrypoint; the root barrel documents but does not re-export it. | Enforces #841's single-seam lock and avoids worsening root-surface size. |
| D2 | Public entrypoints are `createReleaseClient(config)` and `startAutoUpdate(options)`; the 80% path is the single `startAutoUpdate` call. | Gives #456 a stable URL/config client while keeping app bootstrap concise. |
| D3 | `AutoUpdateReleaseConfig` requires `baseUrl`, `publicKey`, and `manualUpdateUrl`; `channel` defaults to `DEFAULT_RELEASE_CHANNEL` (`stable`). Channel remains a validated non-empty string because the server namespace is intentionally open; only the known default is a constant. | Pins trust in compiled app config, enables Windows UX without trusting unsigned metadata, and avoids inventing unratified channel names. |
| D4 | Release URL is `<baseUrl>/<channel>/<Deno.build.os>-<Deno.build.arch>` with normalized slashes and HTTPS-only validation. | Matches rev 10 channel/arch ordering and upstream `os-arch` guidance. |
| D5 | `AutoUpdatePolicy` is discriminated: launch-enabled may be one-shot or recurring; launch-disabled requires `intervalMs`. | Makes an impossible “never launch and never poll” state unrepresentable. |
| D6 | Launch-enabled invokes upstream immediately (whose current implementation checks after ~1 s). Launch-disabled schedules upstream installation after `intervalMs`, then passes the interval to upstream. The result exposes `started`, `scheduled`, or `disabled`, never a cancellation promise. | Preserves requested semantics without lying about an upstream stop API that does not exist. |
| D7 | A local resolver recognizes current `{ desktopVersion, autoUpdate }` and proposed `{ desktop: { appVersion, autoUpdate } }` shapes from `unknown`; proposed namespace wins when both are valid. Missing/null version or missing callable updater disables the seam. | Isolates churn with no `any`, ambient augmentation, or unsafe double cast. |
| D8 | `onUpdateReady` receives a discriminated event: automatic apply-on-relaunch or manual installer required. Windows maps to manual while upstream #35269 is open. | Gives #843 a complete UX path and states the real platform behavior. |
| D9 | One internal native-apply capability table owns platform classification. Changing Windows to automatic is a one-line capability change plus tests when upstream ships. | Prevents OS checks from leaking across consumer code. |
| D10 | `onRollback` first records a named NetScript telemetry span/event through an internal narrow port, then calls the consumer callback with a typed rollback event. | Meets observability without exposing telemetry implementation as consumer configuration. |
| D11 | The SDK does not fetch or parse `latest.json`; Deno remains responsible for HTTPS fetch, signature/hash verification, patching, staging, and rollback. | Avoids a second update authority and duplicate crypto logic. |
| D12 | All finite statuses, apply modes, telemetry names, and the stable channel default are string constants with derived unions. No text/JSON import attributes or runtime file reads. | Satisfies the JSR incident doctrine and keeps the published graph portable. |
| D13 | Real native apply/rollback proof is referenced to #457 and is never implemented in this PR. | Honors the issue boundary and avoids duplicating the deployment E2E harness. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Additional named release channels/rings | safe to defer | Channel is an open validated server namespace; stable is the only ratified v1 default. Constants can grow when channel policy is ratified. |
| Concrete #456 installer route | safe to defer | `manualUpdateUrl` is config-pinned, so #456 can choose its route without SDK changes. |
| Upstream #35939 merge/release timing | safe to defer | Both old and proposed shapes are supported concurrently. |
| Windows native apply availability | safe to defer | Capability remains false until #35269 is demonstrably fixed and released; then flip with tests. |
| Native updater cancellation | safe to defer | No upstream cancellation API exists; this surface deliberately promises none. |
| Real platform E2E | safe to defer to #457 | This PR supplies unit/consumer proof and leaves actual packaging/apply/rollback to the owning gate. |

No unresolved decision would force rework inside the approved implementation slices.

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Namespace changes again before Deno Desktop stabilizes | One structural resolver file, old/new fixture matrix, no consumer exposure of upstream names. |
| Windows users are told an update will auto-apply | Discriminated manual event, required HTTPS installer URL, capability table pinned false, staged-path unit test. |
| Rollback callback throws or telemetry is unavailable | Telemetry emission and callback are separate boundaries; native upstream already contains callback exceptions. Tests pin ordering and event content. |
| Interval policy overpromises cancellation | No stop handle; docs state upstream owns the interval after start. |
| App config permits unsigned manifests | `publicKey` is required by the NetScript contract and forwarded unchanged; empty values fail validation before upstream call. |
| New surface creates slow types/private refs | Explicit declaration types, full subpath `deno doc --lint`, raw package dry-run, consumer compile fixture. |
| Root quality gates miss SDK due current selective task | Each slice runs focused quality/doctrine commands for `packages/sdk` in addition to the named root `arch:check` gate. |
| Existing transitive SDK doc-lint diagnostic obscures regression | Record baseline one; require the new `./auto-update` entrypoint itself to have zero diagnostics and no increase in combined count. |
| Text-import regression repeats release incident | No imported assets; release preflight/text-import scan included in final JSR gate. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-1 | risk | Keep each contract, adapter, and orchestration file focused and below review thresholds. |
| AP-2 | justified seam | The wrapper adds upstream compatibility, release policy, Windows classification, telemetry, and testability. |
| AP-7 | avoided | One readonly options object and discriminated policy; no positional argument ladder. |
| AP-8 | avoided | Plain internal dependency object, no DI container. |
| AP-9 | avoided | Exactly one Deno adapter and one telemetry adapter; no speculative public port hierarchy. |
| AP-11 | avoided | No module-load update call or cached runtime; resolve dependencies when `startAutoUpdate` is called. |
| AP-12 | bounded edge | Delayed start lives behind an internal scheduler seam in the adapter/application boundary and is fixture-tested. |
| AP-13 | resolved | Rollback emits NetScript telemetry; no published `console.*`. |
| AP-14 | avoided | Upstream Deno types are locally structural, not re-exported. |
| AP-15 | avoided | Caller-domain names only; no `I*`, `Impl`, or upstream implementation vocabulary. |
| AP-19 | addressed | README documents network use, HTTPS endpoints, and that native desktop runtime owns the fetch. |
| AP-22 | sanctioned | `src/auto-update/mod.ts` is a declared export-map entrypoint, not an internal convenience barrel. |
| AP-25 | contained | `Deno.build`, upstream function access, timers, and telemetry calls live in named edge adapters. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| F-1..F-12 | yes where applicable | Focused doctrine report plus manual review; F-9 README permission statement; F-10 test sizes. |
| F-13 | runtime subtype | Policy/no-op/staged-Windows/rollback tests; no false stop/cancellation API. |
| F-14..F-19 | yes | Focused doctrine report, doc/publish audits, and scoped wrapper JSON. |
| Static | yes | Scoped check/lint/fmt wrappers over `packages/sdk`; package tests. |
| Runtime | yes, unit boundary | Old/new runtime fixtures, plain-run no-op, launch/interval scheduling, Windows staged event, telemetry ordering. Real native runtime is #457. |
| Consumer | yes | Compile fixture imports `@netscript/sdk/auto-update` and exercises narrowing/config. |
| JSR | yes | Full export-map doc lint, focused audit helper, raw package dry-run, publish file inspection, no-text-import preflight. |
| Code quality | every slice | `quality:scan` focused on SDK and `arch:check`/focused doctrine check. |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| New SDK auto-update surface | none expected | Must land without new/deepened debt. |
| Pre-existing transitive `plugin-streams-core` private type reference seen through SDK streams | preserve baseline only | Not caused by or expanded in #841; the new subpath must be independently clean. Rescope rather than silently fixing another package. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | Release-client unit | `deno test --allow-all packages/sdk/tests/auto-update/release-client_test.ts` | URL, HTTPS, channel, target, and config validation pass. |
| 2 | Wrapper unit | `deno test --allow-all packages/sdk/tests/auto-update/start-auto-update_test.ts` | Plain-run no-op, both namespaces, policies, key forwarding, Windows manual event, automatic event, and rollback telemetry pass. |
| 3 | SDK test set | `deno test --allow-all packages/sdk/tests/` | All SDK tests pass. |
| 4 | Scoped typecheck | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/sdk --ext ts --pretty` | 0 errors, includes consumer fixture and `--unstable-kv`. |
| 5 | Scoped lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/sdk --ext ts --pretty` | 0 errors. |
| 6 | Scoped format | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/sdk --ext ts --pretty` | 0 format errors. |
| 7 | Quality scan | `deno task quality:scan --root packages/sdk` | No `any`, double casts, blanket ignores, or hardcoded coupling. |
| 8 | Focused doctrine | `deno task arch:check:repo --root packages/sdk` | No new SDK doctrine findings. |
| 9 | Named root architecture gate | `deno task arch:check` | Exit 0; dependency/architecture aggregate remains green. |
| 10 | Doc lint | `deno task doc:lint --root packages/sdk --pretty` plus entrypoint attribution | New `./auto-update` has 0 diagnostics; combined baseline does not increase above 1 unrelated transitive diagnostic. |
| 11 | JSR rubric | `deno run --allow-read --allow-run --allow-env .llm/tools/fitness/audit-jsr-package.ts --root packages/sdk --text` and raw `deno publish --dry-run --allow-dirty` from `packages/sdk` | Publishable, clean file list, no actual slow-type warning. |
| 12 | No text imports | `deno task release:preflight` (non-publishing preflight only) | No text/JSON import-attribute hazards. |
| 13 | Consumer compile | Scoped check evidence for `packages/sdk/tests/type-fixtures/auto-update-consumer_type.ts` importing the public subpath | Public types narrow and compile without upstream globals. |
| 14 | Native E2E boundary | Link #457 in handoff; do not run/build it here | Ownership is explicit, no false E2E claim. |

## Dependencies

- Deno Desktop 2.9 native update behavior and tracked namespace proposal #35939.
- Upstream Windows platform gap #35269.
- `@netscript/telemetry/tracer` already consumed by the SDK.
- #456 release server/installer URL wiring consumes the config contract after G2 lands.
- #843 consumes the manual/automatic event for UX; #457 owns real platform proof.

## Deferred Scope

- Additional curated channel constants, rollout rings, and channel migration policy.
- Full Windows native apply until upstream releases it.
- Snapshot/combined-artifact updates (#834/#825).
- Release server and installer endpoint implementation (#456).
- UI components/prompt (#843).
- Real apply/rollback E2E (#457).

## Drift Watch

- #35939 property names or merge state change.
- #35269 Windows apply support changes.
- #456 establishes a conflicting channel/target or installer URL convention.
- New SDK baseline diagnostics appear before implementation.
- The implementation needs a public cancellation handle or manifest parser not named here; either
  case requires rescope and a new Plan-Gate.

