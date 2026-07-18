# DP-2 — `@netscript/plugin-deploy-core`: ports, registry, capabilities, conventions

> **Draft — no GitHub mutation.** Canonical design doc of `plan-deploy-plugin--seed`.

Archetype 2 integration core. This is the extraction target of debt
`DEPLOY-ARCHETYPE-7-CORE-SEED` (`arch-debt.md:2011-2063`): the primitives below *already exist*
as target-agnostic modules in `packages/cli/src/kernel/domain/deploy/` and move here with their
tests; net-new elements are marked **NEW**.

## 1. Public surface (subpaths, layer-named per auth-core parity)

| Subpath | Contents |
| --- | --- |
| `.` | Curated barrel: `createDeployRuntime`, the two ports, registry factory, manifest types |
| `./domain` | `DeploymentPlan`, `DeployTargetDescriptor`, `ResourceBinding`, operation result types, error taxonomy |
| `./ports` | `DeployTargetPort` (7-op), `ArtifactEmitterPort`, `ContainerBuildPort`, `OsServicePort` (moved), registry port |
| `./capabilities` | `DeployCapabilityManifest`, capability IDs, `compileCapabilityVerdict` (the rejection compiler) — **NEW** (UR-5 reuse) |
| `./conventions` | activation (health-gated symlink/dir-swap), secrets (env-file reference + redaction), rollback, observability/OTEL, health-gate — moved verbatim from the CLI kernel |
| `./build` | The `deno compile` pipeline (compile-runner/targets/platform/bundler/config/format — moved) |
| `./config` | `DeployTargetBaseSchema` (moved from `@netscript/config`), target schema registry — retires the deploy slice of `config-plugin-specific-schema-debt` |
| `./registry` | `createDeployTargetRegistry` (closed-on-key), `DEFAULT_DEPLOY_TARGETS` relocation |
| `./testing` | In-memory target adapter, fake convention ports, manifest fixture builders (A2 requirement) |

Budget: ≤ 20 exports per subpath (F-5); no oRPC contract in core (the optional plugin contract
lives with the plugin, DP-4), so **no `--allow-slow-types` exception is needed** — core must pass
`deno doc --lint` clean.

## 2. The 7-op target port (moved, then sharpened)

The shipped `DeployTargetPort` (`packages/cli/src/kernel/domain/deploy/deploy-target-port.ts`)
moves as-is in W1; W2 sharpens it in place:

```ts
type DeployOperation = 'plan' | 'up' | 'down' | 'status' | 'logs' | 'rollback' | 'secrets';

interface DeployTargetPort {
  readonly key: DeployTargetKey;                    // 'deno-deploy' | 'compose' | … (open via registry)
  readonly operations: readonly DeployOperation[];  // declared subset (F-DEPLOY-1)
  readonly capabilities: DeployCapabilityManifest;  // §4 — NEW field, backend-truthful
  plan(ctx: DeployOperationContext): Promise<DeployPlanResult>;      // dry-run + artifact emission
  up(ctx): Promise<DeployUpResult>;
  down(ctx): Promise<DeployDownResult>;
  status(ctx): Promise<DeployStatusResult>;
  logs(ctx): Promise<DeployLogsResult>;
  rollback(ctx): Promise<DeployRollbackResult>;     // platform-native or convention-backed; never silent no-op
  secrets(ctx): Promise<DeploySecretsResult>;       // reference/rotation over the secrets convention
}
```

- **Verb vocabulary locked** (resolves the deferred decision at
  `06-archetypes.md:340-346` — plan-gate requires it): the canonical surface is
  **`netscript deploy <target> <op>`** with the 7-op set. The legacy flat verbs
  (`build/install/start/stop/upgrade/uninstall`) remain as **bare-metal-lane aliases** routed to
  the `baremetal` target's ops, marked deprecated in help output for two minor releases before
  removal (migration-map §4). `plan` subsumes "emit": artifact emission is `plan` with an
  `--output-path` (the shipped compose adapter already behaves this way).
- Unsupported ops: **declared subsets**, exactly as shipped. An op absent from `operations` is
  never advertised (backend-truthful, auth-S1 lesson); calling it yields
  `DeployOperationUnsupportedError` — the auth `AuthBackendOperationUnsupportedError` pattern
  (`research/auth-composition-anatomy.md` §4).
- `rollback`/`secrets` graduate from "declared-unsupported everywhere" (#341) to
  convention-backed implementations per adapter card (DP-3); the conventions module already
  ships the target-agnostic halves (`DEPLOY-SECRETS-ROLLBACK-CORE` debt retires here).

## 3. `ArtifactEmitterPort` (NEW) — separated so lifecycle ≠ build

```ts
interface ArtifactEmitterPort {
  readonly formats: readonly ArtifactFormat[];   // 'deno-binary' | 'oci-image' | 'wrangler-worker'
                                                 // | 'vercel-build-output' | 'aspire-publish' | …
  emit(plan: DeploymentPlan, out: EmitTarget): Promise<EmittedArtifactManifest>;
}
```

Separating emission from lifecycle is what lets L-1 hold: *whatever emits, emits behind this
port* — a provider-native emitter, the shared container builder, or (if ever demanded) an
optional Nitro-driven emitter — all replaceable per target without touching `DeployTargetPort`
consumers. `EmittedArtifactManifest` adopts the market lesson (self-describing artifact:
entrypoints, assets, traced deps, migrations, durable resources, schedules, health/shutdown —
`research/prior-run-distillation.md` §5 rule 3).

`ContainerBuildPort` is the OCI specialization implemented by `deploy-container` and consumed by
the cloudflare-containers and aws lanes (R-GRAPH-2's declared exception).

## 4. Capability manifest + rejection compiler (NEW; the heart of honest agnosticism)

```ts
interface DeployCapabilityManifest {
  readonly target: DeployTargetKey;
  readonly tier: 'deno-native' | 'web-standard' | 'node-compat';        // DP-0 §3
  readonly process: 'long-lived' | 'bounded-window' | 'isolate';
  readonly capabilities: Readonly<Record<DeployCapabilityId, 'lossless' | 'partial' | 'unsupported'>>;
  readonly sagas: 'supported' | 'externalized' | 'rejected';
  readonly notes?: Readonly<Record<DeployCapabilityId, string>>;        // honest caveats, surfaced by CLI
}
```

- `DeployCapabilityId` is a **closed vocabulary of deployment-relevant capability IDs**
  (`http-serve`, `static-assets`, `websocket`, `queue-consume`, `kv-atomic`, `cron`,
  `long-running-process`, `exclusive-db-writer`, `offline-sync`, …). IDs *reference* leaf
  semantics; their **definitions and conformance tests live with the leaf packages**
  (R-GRAPH-4). Core imports only the ID types — this is the exact cut that stops the
  `ResourceBindingResolverPort` god-object failure (adversarial F5): core never interprets what
  `kv-atomic` means; it only matches requirements against declarations.
- `compileCapabilityVerdict(appRequirements, manifest)` is the **build-time rejection compiler**
  (UR-5): `unsupported` → build failure with the manifest note; `partial` → warning that must be
  acknowledged in config; never a runtime surprise, never a silent downgrade (L-3). App
  requirements derive from the project's logical graph (`appsettings.json` resource/plugin
  declarations) — the compiler is invoked by `deploy <target> plan` and by scaffold-time target
  selection.
- `sagas` tri-state is verbatim UR-5/sagas-constraint law: `externalized` means a macro-service
  split of the same app model, never downgrade-to-tasks
  (`research/prior-run-distillation.md` §6).
- **Backend-truthful**: the manifest is authored next to the adapter and exercised by the shared
  conformance suite (DP-3 §1); a manifest row the suite cannot demonstrate is a gate failure —
  deploy's version of the auth board's p0 (#872).

## 5. Resource bindings (declarative, opaque to core)

```ts
interface ResourceBinding {
  readonly logicalName: string;      // from the project graph (appsettings)
  readonly kind: LeafBindingKind;    // opaque leaf-owned discriminator: 'kv' | 'queue' | 'database' | …
  readonly requirement: readonly DeployCapabilityId[];   // what the app needs of it
}
```

Deploy transports bindings **by name into artifacts and environment** (env vars, wrangler
bindings blocks, aspire references) — it never resolves them to SDK objects and never validates
leaf semantics (leaf cores do, at their own composition time). The concrete mapping table
(logicalName → provider handle) is target config authored in `deploy.targets.<key>.bindings`,
validated by the adapter's schema member. This replaces rev2's `ResourceBindingResolverPort` and
`ActivationRouterPort` with a declaration + transport contract; event *activation* (queue →
handler wiring on push-model providers) is leaf-adapter territory, gated by the leaf's own
conformance (adversarial F3 honored).

## 6. Conventions, registry, config

- **Conventions** move verbatim: `activation-convention.ts` (retain count, symlink/dir-swap,
  health gate), `secrets-convention.ts` (env-file reference, 0o600, redaction),
  `rollback-convention.ts`, `observability-convention.ts` (OTEL endpoint/protocol/prefix),
  `health-gate.ts`, plus `servy-config.ts` → `deploy-baremetal` (target-specific). R-DEPLOY-3
  stands: adapters delegate, never fork.
- **Registry**: `createDeployTargetRegistry(entries, )` — closed-on-key, duplicate-guarded
  (auth's `createAuthPresetRegistry` pattern), populated only at composition roots (plugin,
  generated project registry, CLI shim). **Multi-target by design** — unlike auth's
  single-active backend, a project registry may hold many targets keyed
  `<targetKey>[@<environment>]` (the auth-inversion named in
  `research/auth-composition-anatomy.md` §9).
- **Config**: `DeployTargetBaseSchema` (the shipped Zod raw shape with
  activation/secrets/otel/health/docker sub-blocks) moves to `./config`; each adapter exports its
  member schema (spreading the base — R-DEPLOY-4); the **target schema registry** composes the
  `deploy.targets` discriminated union at load time, so `@netscript/config` retains only the
  project-loader seam and never names vendors. Environment dimension: `deploy.targets.<key>` gains
  an optional `environments: Record<string, Partial<TargetConfig>>` overlay — the modeled
  replacement for today's opaque `--environment` pass-through (inventory §4 gap).

## 7. Gates and proof

- Full A2 gate set; **F-DEPLOY-1** (AST + registry scan: every registered adapter implements the
  7-op contract or a declared subset) and **F-DEPLOY-2** (import graph + AST: no target-specific
  business logic outside adapter packages; conventions imported from core) flip
  `reviewed` → `gated` in W1 — extended with **R-GRAPH-1** (core imports leaf *types* only; no
  provider SDK, no leaf implementation) as a new import-graph assertion.
- `./testing` ships the in-memory target + fixture builders so the plugin, CLI shim, and
  conformance kit test without live providers (A2 Concept of Done).
- Quality bar: `deno task quality:scan` (no `any`/casts), `arch:check`, `deno doc --lint` clean,
  jsr publish dry-run — per harness pitfall rules.
