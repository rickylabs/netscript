# Changelog

## 0.0.7

- `agent init` now installs canonical cross-host skills and project guidance together with an
  updated tool bundle that writes atomic reports, surfaces silent check failures, audits public API
  quality, verifies `quality-allow` owners against GitHub (the bundle declares environment and
  network permissions, but environment access is optional and network access is used only when
  resolving a `quality-allow` issue), honors subtree/config lint exclusions, and fails closed when
  Deno processes fewer files than selected.
- Generated workspace `check`, `lint`, and `fmt-check` flows accept `--skip-apphost` so project-only
  quality runs can omit AppHost sources.
- `plugin auth session list` requires an explicit `--stream-url` instead of assuming the legacy
  localhost endpoint and explains how to discover the Aspire streams endpoint.
- Database scaffolds emit only the selected provider's connection helpers, use generated Prisma
  clients in seeds, and project missing rows as defined 404 responses.
- Generated design registries include the complete component manifest and collection membership
  instead of a partial catalog.
- Generated Aspire background registration fails before processor startup when a declared service
  or plugin reference has no resolvable HTTP endpoint.
- The Prisma MySQL adapter exposes the connected adapter contract and classified connection-error
  hook, ships an executable Prisma 7/mysql2 example, stops root-exporting the legacy
  `DenoMySqlClient`, `DenoMySqlConnection`, and `ExecuteResult` types, narrows result column types,
  and deprecates the misleading `verify_identity` TLS selector without changing its legacy runtime
  behavior.
- AI MCP pools isolate per-server startup/stop failures, expose synchronous per-server status and
  ready clients, and propagate cancellation through resource reads, registration discovery, and
  shutdown.
- AI requests can carry application context into tool handlers without forwarding it to providers,
  and request cancellation now reaches tool dispatch.
- SDK cache queries return fetched data when persistence fails, bound telemetry namespace
  cardinality, retain incomplete-topology evidence, honor fresh cached entries under stale-only
  refresh policy, and deduplicate background refresh persistence.
- SDK service clients preserve exact contract errors through `safe()` and `isDefinedError`;
  failures now carry `undefined` rather than `null`, `SafeFailure` splits into literal defined and
  non-defined arms, default `TError` changes from `unknown` to `Error`, `safe()` no longer accepts
  non-Promise thenables, and `baseContract` rejects error codes outside its six declared literals
  (`NOT_FOUND`, `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `RATE_LIMITED`, and
  `SERVICE_UNAVAILABLE`).
- Workers persist and publish job progress through the durable execution state
  (`KvExecutionState.progress()`), and the worker pool drains progress in FIFO order before terminal
  delivery. Installed job registries now carry the complete `netscript.config.ts` job policy,
  `JobConfig` gains the four policy fields the job-definition schema already used, and the root
  `JobDefinition`/`JobBuilder.build()` surface preserves payload and result generics so
  `enqueueJob` rejects a payload that does not match the selected job.
- Service principals are typed and procedure policy is declared on the contract instead of inferred
  at runtime.
- `@netscript/plugin/sdk` publishes `createPluginServiceContext`, third-party plugin factories now
  participate in AST discovery, and `plugin doctor` derives its expected registry sources from the
  same generator selection that writes the registry when a manifest advertises
  `inspectionProtocol: 1`. `createPluginServiceContext` also accepts caller-owned async environment
  and `getAppsettings` resolvers, resolved once at assembly while the DB and KV adapters stay lazy
  and memoized.
- `@netscript/kv` publishes `createLazyKv`, and the scaffolded plugin service template takes its
  lazy KV from `createPluginServiceContext` (`@netscript/plugin/sdk`) instead of emitting a
  per-project copy.
- The SDK ships the typed client-contribution seam from RFC 0001: the public descriptor, helper, and
  error contract; a runtime adapter with closed-shape validation, redacted failures, and cache-safe
  query partitioning; the canonical typed bearer contribution (declared by the auth plugin without
  auto-attaching credentials); `createLocaleSdkClientContribution()`; and a
  `conflictingContributionId` on contribution diagnostics. CLI auth sessions route through the same
  typed bearer preparation.
- SDK HTTP method, cache-group, and dedupe policy are derived from the contract by one resolver; the
  deprecated `port` and `timeout` client options are documented no-ops. `@netscript/contracts`
  defines `NetScriptProcedureMeta`, which propagates through direct, `defineServices`, and
  query-factory clients without erasing contract errors.
- The SDK root and `./presets` entrypoints are browser-safe and no longer register a cache provider
  at import time; Fresh keeps server caching through `defineFreshApp()`, and custom servers must
  call `setCacheProvider(cacheQuery)` explicitly. Browser and shorthand service keys, and the CLI
  deploy prebuild, follow Aspire's Vite identifier normalization so hyphenated resource names
  resolve.
- Fresh exposes awaited chat persistence and background-work registration through
  `toNetScriptChatResponse`, keeps readonly query hydration verified against TanStack Query
  5.102.x, orders the partial-navigation lifecycle through the SSR-safe
  `@netscript/fresh/navigation` surface (superseded responses are drained, native `key` partial
  boundaries render), invokes the captured navigation fetch with the browser receiver, and rejects
  undeclared keys on pattern-inferred route params at the property-access site.
  `@netscript/fresh/vite` now publishes route-manifest derivation (`discoverNetScriptRoutes`,
  `resolveNetScriptRouteManifestOptions`, `writeNetScriptRouteManifestSync`) so the CLI can write
  and compare Fresh-owned manifest output.
  `FormCollectionStrategy` rejects `navigation: 'document'` together with `mode: 'client'` at the
  type level instead of silently dropping the navigation choice.
  The form descriptor's `controlProps()` bag is directly assignable to Preact `input`, `select`,
  and `textarea` elements, and derives `pattern` plus inclusive numeric `min`/`max`/`step` native
  constraints from the Zod 4 schema.
- Saga publish receipts are non-discardable, and saga cascade spans are emitted and correlated
  across planes.
- AI maps typed generation options for OpenAI Responses when a provider is configured with
  `api: 'responses'`, preserves nested `TokenUsage` detail through the TanStack bridge, and moves
  the TanStack AI dependency family to its current stable releases.
- `ui:add page --island` emits a working page, island, and query-loader data screen instead of a
  counter; the shipped skill bundle no longer references the derived `.claude/` mirror and resolves
  to the canonical `.agents/skills/` tree;
  Garnet readiness in scaffolded runtimes is deterministic and its version pins are aligned.
  `netscript deploy <target> emit` is routed, and a fail-fast invariant keeps advertised deploy
  operations from being silently omitted by the command router. The CLI also ships the neutral
  Fresh 2.x resource-slice template family (`packages/cli/src/kernel/assets/resource-slice/`),
  rendered through the pure slice planner with exact core/form/partial/stream option deltas; no
  command wires it yet.
- Aspire moves to the atomic 13.5.3 train with a version-parity gate, re-validates every emitted
  AppHost SDK member and the deploy CLI argv contract against the 13.5 TypeScript API, removes
  runtime literal ports so Aspire owns endpoint allocation (the auth, sagas, and triggers
  default-port constants remain as deprecated compatibility exports), adds listener-readiness health
  checks for database and Redis-compatible backing services, ships typed db-cli-mode resource
  commands with bounded readiness waits and `excludeFromMcp`, validates background reference names
  and emits parseable AppHost source for adversarial inputs, and discovers the telemetry endpoint
  through `resolveTelemetryEndpoint` (explicit value, `NETSCRIPT_TELEMETRY_ENDPOINT`,
  `ASPIRE_DASHBOARD_PORT`, the running AppHost, then the named default). The shipped `aspire` skill
  and `help.md` are re-verified against Aspire CLI 13.5.3 (`aspire agent mcp`, the
  `aspire resources` alias, `healthReports` as an object) with receipt keys linking each
  re-verified command to its smoke evidence.
  The Aspire reference documents the backing-resource readiness contract: `healthStatus` reports
  reachability at the published endpoint, so a container log line is not the readiness authority
  and `Unhealthy` means "not reachable where you will connect", not "not started".
  Scaffolded Aspire helpers gain `createEndpointListenerReadinessCheck`: the postgres listener
  readiness check bounds endpoint allocation with the same deadline as the socket probe and
  reports `ENDPOINT_ALLOCATION_TIMEOUT` instead of waiting indefinitely when the endpoint is never
  allocated.
- The oRPC dependency family moves to 1.15.0 with one resolved copy of each `@orpc/*` package.

## 0.0.6

- `plugin doctor` now treats package-backed plugins as in-process package installations instead of
  requiring conventional local plugin directories.
- Published plugin manifest permissions now contribute to generated service runtime permissions;
  explicit appsettings and contribution-specific permissions retain precedence.
- `plugin list` renders package-backed sources as `package:<configured-specifier>` rather than
  implying or omitting a local workdir.
