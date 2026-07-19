# DP-2 — `@netscript/plugin-deploy-core`: ports, registry, capabilities, conventions

> **Draft — no GitHub mutation.** Canonical design doc of `plan-deploy-plugin--seed`.
> **r2** — amended per Sol adversarial findings SF-1, SF-2, SF-5, SF-6, SF-7, SF-8, SF-9, SF-10,
> SF-13 (`adversarial-sol.md`, triage in `adversarial-sol-triage.md`).

Archetype 2 integration core. This is the extraction target of debt
`DEPLOY-ARCHETYPE-7-CORE-SEED` (`arch-debt.md:2011-2063`) — with the r2 correction (SF-2) that
W1 is a **refactor-then-extract**, not a verbatim move: contracts and demonstrably pure
conventions move first behind compatibility re-exports; the build engine is entangled with CLI
config/output/Windows modules and moves to `deploy-baremetal` in W2, with an adapter-neutral
compile emitter graduating to core only once filesystem/process/output/config ports exist.
`runtime-overrides.ts` duplicates leaf job/saga/task vocabulary and describes `.deploy/windows` —
it stays with its bare-metal/leaf owners and is **not** a shared deploy convention. Net-new
elements are marked **NEW**.

## 1. Public surface (subpaths, layer-named per auth-core parity)

| Subpath | Contents |
| --- | --- |
| `.` | Curated barrel: `createDeployRuntime`, the ports, registry factory, manifest/topology types |
| `./domain` | `DeploymentPlan`, `DeploymentCell` + `DeploymentTopologyPlan` (**NEW**, SF-8), `DeployTargetDescriptor`, `ResourceBinding`, operation result types, error taxonomy (incl. `DeployTargetCollisionError`, `DeployTargetAdapterMissingError`) |
| `./ports` | `DeployTargetPort` (eight-op), `ArtifactEmitterPort`, `ContainerBuildPort`, `OsServicePort` (moved), registry port |
| `./capabilities` | Structural capability contracts (`CapabilityRef`, `BindingRequirement`, `WorkloadConstraint`, `CapabilityVerdict`, `DeployCapabilityManifest`) + the runtime-trait vocabulary + `compileCapabilityVerdict` — **NEW** (UR-5 reuse, restructured per SF-6/SF-7) |
| `./conventions` | activation (health-gated symlink/dir-swap), secrets (env-file reference + redaction), rollback, observability/OTEL, health-gate — the demonstrably pure policies moved *with their constants* (SF-2); `runtime-overrides.ts` excluded |
| `./config` | `DeployTargetBaseSchema` (moved from `@netscript/config`), the target schema registry + **two-phase loader contract** (**NEW**, SF-10) |
| `./registry` | `createDeployTargetRegistry()` — **empty**, duplicate-rejecting (SF-1/SF-13); key/error types; no default target set |
| `./testing` | In-memory target adapter, fake convention ports, manifest fixture builders (A2 requirement) |

Budget: ≤ 20 exports per subpath (F-5); no oRPC contract in core (the optional plugin contract
lives with the plugin, DP-4), so **no `--allow-slow-types` exception is needed** — core must pass
`deno doc --lint` clean.

## 2. The eight-op target port (r2 — SF-5/SF-9)

The shipped port (`packages/cli/src/kernel/domain/deploy/deploy-target-port.ts`) already carries
**eight** canonical operations — `plan` and `emit` are distinct there, and shipped adapters
already diverge on their semantics (Deno Deploy `plan` is non-mutating preflight; Aspire compose
`plan` writes artifacts). r2 locks the eight-op lifecycle with **pure `plan`**:

```ts
type DeployOperation =
  | 'plan' | 'emit' | 'up' | 'down' | 'status' | 'logs' | 'rollback' | 'secrets';

interface DeployTargetPort {
  readonly key: DeployTargetKey;
  readonly operations: readonly DeployOperation[];  // declared subset (F-DEPLOY-1)
  readonly capabilities: DeployCapabilityManifest;  // §4 — NEW field, backend-truthful
  plan(ctx): Promise<DeployPlanResult>;       // PURE (r5, SG-9): writes no workspace-owned
                                              // deployment artifacts, mutates no provider;
                                              // isolated toolchain-inspection subprocesses
                                              // (e.g. --list-steps) are permitted and captured
                                              // to diagnostics. Returns a serializable
                                              // DeploymentPlan embedding its
                                              // CapabilityCheckInput snapshot (SG-4)
  emit(ctx): Promise<EmittedArtifactManifest>; // materializes content-addressed artifacts; does
                                              // not deploy/push unless the format models a
                                              // publish phase explicitly
  up(ctx): Promise<DeployUpResult>;           // plain `up` = convenience plan → emit → up;
                                              // `up --prebuilt <manifest>` consumes an artifact
  down(ctx): Promise<DeployDownResult>;
  status(ctx): Promise<DeployStatusResult>;
  logs(ctx): Promise<DeployLogsResult>;
  rollback(ctx): Promise<DeployRollbackResult>; // platform-native or convention-backed; never a silent no-op
  secrets(ctx): Promise<DeploySecretsResult>;   // reference/rotation over the secrets convention
}
```

- **Verb vocabulary locked** (resolves the deferred decision at `06-archetypes.md:340-346`):
  canonical surface is **`netscript deploy <target> <op>`** with the eight-op set. The
  build/deploy split is CI-real: a build job runs `plan` + `emit` and hands the
  `EmittedArtifactManifest` (artifact digest, source revision, target variant, emitter version,
  provenance) to a later deploy job running `up --prebuilt`. (r3, KF-6) The hand-off contract is
  concrete: `emit` writes to **`.deploy/<target>[@<env>]/`** (the shipped output convention) with
  the manifest at **`.deploy/<target>[@<env>]/artifact-manifest.json`**;
  `up --prebuilt <path-to-manifest>` takes the manifest path and verifies artifact digests
  against it before any push.
- **CLI grammar sketch** (r3, KF-5 — locked at sketch depth; the full grammar is DPB-16
  acceptance scope): global `--env <name>` (KF-8, §6); `emit [--output <dir>]` (defaults to the
  contract path above); `secrets set|list|unset <NAME>` (env-variable names; values never in
  argv — piped or prompted); `rollback [--to <revision>]` (defaults to the previous deployment);
  `down [--yes]` (confirmation required in a TTY).
- **Legacy flat verbs** (r2, SF-9 — semantics are NOT equivalent to `up`/`down`): `build`,
  `install`, `start`, `stop`, `copy`, `upgrade`, `package-cli`, `uninstall` remain **first-class
  compatibility handlers owned by `deploy-baremetal`** through the next semver-major release,
  behind a `BaremetalCompatibilityCommands` adapter that preserves their current flags and
  side-effect boundaries (shipped `start`/`stop` operate on registered services without
  install/uninstall; `copy` syncs prebuilt artifacts without registration; `upgrade` is a
  five-step transaction). Only `build → plan + emit`, `status`, and `logs` are direct aliases —
  (r3, KF-4) **pinned to the `baremetal` target**: `build` ≡ `deploy baremetal plan` + `deploy
  baremetal emit`; `status`/`logs` ≡ `deploy baremetal status`/`logs`.
  Help output may deprecate; **no minor-release removal date is claimed** until an equivalent
  canonical workflow and migration telemetry exist. Golden help/exit-code tests plus
  state-transition tests prove `stop` never uninstalls and `start` never registers.
- Unsupported ops: **declared subsets**, exactly as shipped; an op absent from `operations` is
  never advertised (backend-truthful); calling it yields `DeployOperationUnsupportedError` (the
  auth `AuthBackendOperationUnsupportedError` pattern).
- `rollback`/`secrets` graduate from "declared-unsupported everywhere" (#341) to
  convention-backed implementations per adapter card (DP-3); the target-agnostic halves ship in
  `./conventions` (`DEPLOY-SECRETS-ROLLBACK-CORE` debt retires in W2).

## 3. `ArtifactEmitterPort` — emission separated from lifecycle

```ts
interface ArtifactEmitterPort {
  readonly formats: readonly ArtifactFormat[];   // 'deno-binary' | 'oci-image' | 'wrangler-worker'
                                                 // | 'vercel-build-output' | 'aspire-publish' | …
  emit(plan: DeploymentPlan, out: EmitTarget): Promise<EmittedArtifactManifest>;
}
```

Separating emission from lifecycle is what lets L-1 hold: *whatever emits, emits behind this
port* — replaceable per target without touching `DeployTargetPort` consumers.
`EmittedArtifactManifest` is self-describing (entrypoints, assets, traced deps, migrations,
durable resources, schedules, health/shutdown — the market lesson) **plus provenance** (r2,
SF-5): artifact digest, source revision, target variant, emitter version.

`ContainerBuildPort` is the core-owned OCI specialization; `deploy-container` exports the
implementation and composition roots **inject** it where needed (R-GRAPH-2 r2 — no
adapter-to-adapter import, SF-11).

## 4. Capability contracts (r2 — SF-6/SF-7: structural, scoped, variant-aware)

The r1 design used one flat closed `DeployCapabilityId` union — which would have coupled core to
every leaf (the union must import leaf IDs) and mixed three dimensions (runtime traits, leaf
semantic guarantees, workload constraints). r2 replaces it with structural contracts owned by
core, populated by leaves and adapters without core importing either:

```ts
interface CapabilityRef {          // namespaced + versioned — leaf growth without manifest rot
  readonly namespace: string;      // 'runtime' | '@netscript/kv' | '@netscript/queue' | …
  readonly name: string;           // 'long-running-process' | 'atomic' | 'consume' | …
  readonly major: number;
}
interface BindingRequirement {     // what the app needs of a named logical resource
  readonly binding: string;        // logicalName from the project graph
  readonly capability: CapabilityRef;
}
interface WorkloadConstraint {     // topology/workload dimension, distinct from capabilities
  readonly kind: 'singleton' | 'long-running' | 'co-locate' | 'offline';
}

interface CapabilityVerdict {
  readonly level: 'lossless' | 'partial' | 'unsupported' | 'unverified';
  readonly scope: 'runtime' | 'adapter' | 'binding';   // WHAT the verdict describes
  readonly evidence?: string;                           // conformance-suite cell / probe id
  readonly note?: string;                               // honest caveat, surfaced by CLI
}

interface DeployCapabilityManifest {
  readonly schemaVersion: number;
  readonly target: DeployTargetKey;
  readonly variant: string;            // 'workers' | 'containers' | 'lambda' | 'fargate' |
                                       // 'compose' | 'kubernetes' | … (SF-7: no mode collapse)
  readonly tier: 'deno-native' | 'web-standard' | 'node-compat';
  readonly process: 'long-lived' | 'bounded-window' | 'isolate';
  readonly verdicts: ReadonlyMap<CapabilityRefKey, CapabilityVerdict>;
  readonly sagas: 'supported' | 'externalized' | 'rejected';
  readonly toolVersions?: Readonly<Record<string, string>>;  // upstream tool/version range
  readonly probedAt?: string;                                // evidence date
}
```

- **Core owns only the structures** plus the small well-known `runtime:*` trait vocabulary
  (`http-serve`, `static-assets`, `websocket`, `cron`, `long-running-process`). Leaf packages
  export their namespaced requirement/conformance descriptors; core never imports a leaf
  (R-GRAPH-1 r2). Verdicts about leaf semantics carry `scope: 'binding'` and come from
  **installed leaf backing manifests**, composed with the runtime manifest by the compiler —
  a runtime manifest never claims queue/KV semantics by itself (SF-7).
- **`unverified` is not `unsupported`**: unproven, not-installed, and credential-unavailable
  states are distinguished in doctor/capability output; only a demonstrated impossibility is
  `unsupported`. A `lossless` verdict requires a **live-platform** conformance cell — an
  in-memory fake validates the harness, never certifies the provider.
- `compileCapabilityVerdict(appRequirements, manifests…)` remains the **build-time rejection
  compiler** (UR-5): `unsupported` → build failure with the note; `partial` → warning that must
  be acknowledged in config; never a runtime surprise, never a silent downgrade (L-3). Sagas
  tri-state law unchanged.
- **Verdict-surface precedence** (r3, KF-13): newer live evidence wins. `deploy doctor`'s live
  run supersedes a stale (`probedAt`-old) manifest; `plan` recompiles from the **installed**
  manifests at invocation time and is authoritative for the deploy decision;
  `deploy capabilities` renders published/installed manifest data and is informational.
- **One compiler entrypoint, one snapshot** (r5, SG-4): `compileCapabilityVerdict` is a pure
  function over a versioned `CapabilityCheckInput` snapshot (graph digest, effective
  environment, generated-registry digest, manifest ids/versions/probe dates). Every consumer —
  `plan`, scaffold-time selection, the `netscript-capability-check` Aspire pipeline step —
  invokes this one entrypoint; a consumer holding a prior snapshot either verifies it or
  recompiles and reports supersession. Parity tests assert identical verdict JSON across
  consumers for the same snapshot.
- **Environment normalization** (r5, SG-5): `resolveDeploymentEnvironment(target, requestedEnv)`
  runs before registry/overlay/artifact resolution and yields ONE value used everywhere
  (registry key, overlay merge order base → `environments.<env>` → flags, artifact path,
  manifest field, cache key, events, provider pass-through). Aspire targets normalize omitted
  env to `production`; bare and `@production` registrations are rejected as aliases; non-Aspire
  adapters keep their own declared defaults.

## 5. Topology: cells are declared, never silently partitioned (**NEW**, SF-8)

The mixed-compute stories (Workers + Containers; Lambda + Fargate) need a contract the r1 corpus
lacked:

```ts
interface DeploymentCell {
  readonly id: string;
  readonly selectors: readonly string[];   // which services/consumers/schedules it owns
  readonly target: DeployTargetKey;
  readonly variant: string;
  readonly bindings: readonly string[];
}
interface DeploymentTopologyPlan {
  readonly cells: readonly DeploymentCell[];
  readonly transports: readonly CrossCellTransport[];  // explicit cross-cell communication
}
```

v1 rule: **cells are user-declared** in `deploy/targets.ts` (the user-owned **target
declarations** file — distinct from the config **target settings** member, r3 KF-2). The
compiler may return machine-readable `suggestedCells` when a single-cell verdict fails, but it
**rejects rather than partitions silently**. (r3, KF-11) The rejection is not a dead end: `plan`
writes `suggested-cells.json`, and **`deploy cells apply [<file>]`** materializes it into
`deploy/targets.ts` with the diff shown — an explicit command editing the user-owned file, never
an implicit rewrite. **Selector vocabulary is the logical-graph unit naming**:
`service:<name>` / `app:<name>` / `background:<kind>` (the appsettings unit categories). Gates:
single ownership of every service/consumer/schedule across cells; explicit cross-cell transport;
deterministic plan output. Until the topology slice lands, the Cloudflare/AWS scaffold stories
are narrowed to one compute variant per target (DP-8).

`ResourceBinding` is unchanged in spirit — declarative name+kind transport, leaf semantics never
interpreted by deploy — with requirements now expressed as `BindingRequirement` (namespaced
`CapabilityRef`s, §4).

## 6. Conventions, registry, config (r2 — SF-1/SF-10/SF-13)

- **Conventions**: the demonstrably pure policies (`activation`, `secrets`, `rollback`,
  `observability`, `health-gate`) move *with their constants*; `servy-config.ts` and
  `runtime-overrides.ts` go to `deploy-baremetal`/leaf owners (SF-2). R-DEPLOY-3 stands:
  adapters delegate, never fork.
- **Registry**: `createDeployTargetRegistry(entries = [])` — **empty by construction**; core owns
  only the registry implementation, port, key/error types. **Duplicate rejection is NEW
  behavior** (the shipped registry is register-or-replace — SF-13): `register` rejects with
  `DeployTargetCollisionError { key, existingOwner, incomingOwner }`; a composition-root-only
  `replaceForCompatibility` exists solely for the W1 shim and is removed with it.
  `DEFAULT_DEPLOY_TARGETS` is **deleted as a core concept** (SF-1): during W1 its compatibility
  equivalent stays in the CLI composition root; from W3 the plugin/generated project registry
  supplies entries (as resolved `DeployTargetContribution` descriptors, DP-4 §3). Multi-target
  by design, keyed `<targetKey>[@<environment>]` — (r3, KF-8) invoked as
  **`netscript deploy <target> <op> --env <name>`** (the flag maps to the qualified registry
  key; the config `environments` overlay supplies the values). (r4, DP-9) On Aspire-managed
  targets `--env` **passes through as `aspire --environment <name>`** (case-insensitive; deploy/
  publish default aligned to Aspire's `production`); per-env provisioning state delegates to
  Aspire's deployment state cache; the overlay file remains ours (`appsettings.{env}.json` is
  C#-only — a documented TS gap, not duplication). Aspire-lane ops compose further per DP-9 §2:
  `plan` surfaces `aspire deploy --list-steps`; `secrets` adopts the
  `addParameter({secret:true})` + `Parameters__*` convention; `down` = `aspire destroy`.
- **Config — two-phase loader** (**NEW**, SF-10). Today the full config parses `deploy` through
  a static schema *before* the plugin list is even available, and unknown target keys are
  silently stripped — so "adapters contribute schemas at load time" needs a real bootstrap
  contract:
  1. Bootstrap-parse only project identity, `plugins`, and `deploy.targets` as
     `Record<string, unknown>` — nothing stripped.
  2. Resolve plugin + generated adapter descriptors (including `schemaLoader`s).
  3. Compose the target schema registry; parse the full config.
  4. An unrecognized target key ⇒ `DeployTargetAdapterMissingError` — **never silently dropped**
     (a deliberate, documented behavior change from today's strip-by-design).
  `@netscript/config` keeps the project-loader seam and exports the legacy target types/schemas
  as a frozen delegating union for the compatibility window. Environments overlay
  (`environments: Record<string, Partial<TargetConfig>>`) unchanged from r1. (r3, KF-3 — the
  variant mechanism resolves the r2 three-vocabulary note) The bare-metal lane has **one
  user-facing name**: target **`baremetal`** with variants **`windows` | `linux`** — CLI,
  registry, capabilities, and doctor all say `baremetal`; the legacy config keys `windows`/
  `linux` remain valid target-settings members mapped in by the frozen compat union and
  documented as the historical spelling.

## 7. Gates and proof

- Full A2 gate set; **F-DEPLOY-1** (AST + registry scan: every registered adapter implements the
  eight-op contract or a declared subset) and **F-DEPLOY-2** (import graph + AST: no
  target-specific business logic outside adapter packages; conventions imported from core) flip
  `reviewed` → `gated` in W1 — extended with **R-GRAPH-1 r2** (core imports no leaf package, no
  provider SDK) and the **no `deploy-*` → `deploy-*` import** assertion (SF-11) as import-graph
  gates.
- Registry tests: constructor duplicates, generated-registry duplicates, environment-qualified
  keys, deterministic ordering (SF-13). Loader tests: installed custom target, missing adapter,
  malformed adapter config, plugin-loader failure, all existing target keys (SF-10).
- Secret-reference tests prove values never appear in plans, manifests, telemetry, events,
  command argv, or thrown errors (quick win).
- `./testing` ships the in-memory target + fixture builders so the plugin, CLI shim, and
  conformance kit test without live providers (A2 Concept of Done).
- Quality bar: `deno task quality:scan`, `arch:check`, `deno doc --lint` clean, jsr publish
  dry-run — per harness pitfall rules.
