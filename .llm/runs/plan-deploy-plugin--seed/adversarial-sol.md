# Sol xhigh constructive adversarial review — deploy-plugin seed corpus

The corpus is a strong design baseline and is worth building on: the A5 + A2 + A2 family shape,
wrap-first provider strategy, explicit migration map, and insistence on capability honesty are the
right center of gravity. It is not safe to implement unchanged. Five load-bearing seams are
underspecified or internally contradictory—the ownership of default target composition, the W1
extraction boundary, the installer manifest, CLI bootstrap, and config bootstrap—and several
advertised compatibility and capability claims do not survive the shipped file graph. The amendments
below preserve the concept while making the dependency graph acyclic, the extension mechanisms
generic, and the migration/probe gates capable of proving what the corpus promises.

## SF-1 — [BLOCKER] `DEFAULT_DEPLOY_TARGETS` cannot move into core without creating the dependency inversion R-GRAPH-2/3 forbid

**Evidence.** DP-1 §2 says adapters depend on core and only plugin/project composition roots may
assemble adapters; DP-2 §1 and DP-6 M-2 nevertheless relocate `DEFAULT_DEPLOY_TARGETS` into
`plugin-deploy-core`. The shipped constant is not neutral data: it imports and instantiates Windows,
Linux, Aspire, Deno Deploy, and `DenoProcess` implementations
(`packages/cli/src/kernel/application/registries/deploy-target-registry.ts:4-9`, `:14-68`,
`:70-83`). Moving that constant yields `core -> adapters -> core`, or forces provider
implementations into the core.

**Suggested amendment.** Replace DP-2 §1's registry row and DP-6 M-2 with:

> `plugin-deploy-core/registry` owns only the empty duplicate-rejecting registry implementation,
> registry port, key/error types, and `createDeployTargetRegistry(entries = [])`. Each adapter
> exports a target factory/descriptor. `DEFAULT_DEPLOY_TARGETS` is deleted as a core concept; during
> W1 its compatibility equivalent remains in the CLI composition root, and from W2 onward the plugin
> or generated project registry supplies the ordered entries. Core never imports an adapter.

Make the W1 debt-retirement statement conditional on this externalized composition root being in
place; do not claim the current default constant moved verbatim.

## SF-2 — [BLOCKER] W1 is not a behavior-free move against the actual CLI file graph

**Evidence.** DP-2's opening and DP-6 M-3/M-4 describe existing target-agnostic modules moving
verbatim. The current build use case imports CLI `ResolvedConfig` and CLI pipeline abstractions and
calls itself a Windows artifact flow
(`packages/cli/src/public/features/deploy/build/build-deploy.ts:1-7`, `:63-87`). Preparation
performs `Deno.mkdir`, imports Windows manifest sorting, and consumes the CLI config model
(`packages/cli/src/public/features/deploy/build/prepare-deploy-build.ts:15-20`, `:59-81`). The
compile runner imports CLI output, Windows constants, and Windows V8 profiles
(`packages/cli/src/kernel/adapters/deploy/compile/compile-runner.ts:1-17`). `runtime-overrides.ts`
duplicates leaf job/saga/task vocabulary and explicitly describes `.deploy/windows`
(`packages/cli/src/kernel/domain/deploy/runtime-overrides.ts:1-7`, `:67-77`), so it is not a shared
deploy convention. The same public group directly mounts desktop beside every deploy verb
(`packages/cli/src/public/features/deploy/deploy-group.ts:31-97`); plan §5 currently combines the
desktop split, verb lock, and router rewire in one child.

**Suggested amendment.** Replace W1 with the following ordered, independently gated slices:

1. Move only port/result/error contracts behind compatibility re-exports.
2. Add an empty core registry while leaving concrete default factories in the CLI composition root.
3. Extract a host-owned `deploy` shell that preserves the `desktop` subgroup and existing help;
   lifecycle children remain unchanged.
4. Move demonstrably pure convention policies _with their constants_; leave `runtime-overrides.ts`
   in the bare-metal/leaf owners.
5. Rewire the router through the contracts with no build implementation move.
6. In W2, move the current Windows/Linux build behavior to `deploy-baremetal`; only after
   filesystem/process/output/config ports exist may an adapter-neutral compile emitter graduate to
   core.

Change DP-6 M-4 from “Move” to “Refactor then extract”; keep the full CLI E2E invariant on every
slice rather than on one large W1 issue.

## SF-3 — [BLOCKER] The DP-4 installer manifest sketch is invalid under the protocol it claims to extend

**Evidence.** DP-4 §3 omits required `version`, `displayName`, `description`, and
`peerDependencies`; it represents `requiredPermissions` as booleans although the protocol requires
string arrays (`packages/plugin/src/protocol/manifest.ts:6-14`, `:112-136`, `:138-160`). Its
`provider` omits nearly every required service-oriented field (`manifest.ts:44-80`), and its
`officialSource` omits required service entrypoint/config/port fields (`manifest.ts:82-109`). The
first-party auth manifest demonstrates the actual complete shape
(`plugins/auth/scaffold.plugin.json:1-66`). DP-4 §5 lists only a capability flag as the installer
protocol change, so no listed slice makes the sample parseable.

**Suggested amendment.** Replace DP-4 §3 with a complete manifest and explicitly generalize the
source protocol for tooling-only plugins:

```ts
type PluginManifestOfficialSource =
  | ExistingServiceOfficialSource
  | {
    readonly sourceKind: 'tooling';
    readonly canonicalName: string;
    readonly pluginDir?: string;
  };
```

The deploy manifest must include all required top-level metadata, use permission arrays such as
`read: ['<workspaceRoot>']`, omit the service-shaped `provider`, and declare
`officialSource: { sourceKind: 'tooling', canonicalName: 'deploy', pluginDir: 'deploy' }`. Add
schema parse, official copy/install, and backward-compat fixtures to the host-extension slice. If
the protocol version is bumped, accept v1 service manifests and the new tooling variant
concurrently.

## SF-4 — [BLOCKER] `cli-command` is named as an axis but has no viable discovery-to-startup path or safe deploy collision model

**Evidence.** DP-4 §5 says the generic registry emitter renders a CLI mount and the CLI mounts it at
startup. Today the emitter only groups already-extracted source contributions into generated maps
(`packages/plugin/src/sdk/discovery/registry-emitter.ts:7-18`, `:35-67`), while its extractor only
recognizes `defineJob`, `defineSaga`, and `defineWebhook`
(`packages/plugin/src/sdk/discovery/ast-extractor.ts:4-8`, `:25-34`). Manifest resolution is
asynchronous and occurs after config loading
(`packages/cli/src/public/features/plugins/host/plugin-loader.ts:78-99`), but the public command
registry and command tree are built synchronously with `deploy` already registered
(`packages/cli/src/public/features/root/public-command-tree.ts:47-62`, `:114-124`;
`packages/cli/src/public/composition/cli-command-registry.ts:60-74`). `verifyPlugin` has no CLI or
doctor expectation surface (`packages/plugin/src/diagnostics/verify-plugin.ts:197-224`). The
proposed special exception allowing the deploy contribution to shadow the deploy shim makes a
generic host facility aware of one plugin and leaves ownership/help/error behavior ambiguous.

**Suggested amendment.** Flip OF-3 to a host-owned mount point with plugin-owned children:

> The built-in `deploy` shell remains reserved and owns `desktop`, the absent-plugin install hint,
> and shared help. A contribution declares `{ mount: 'deploy', id, loader, export }`; it never
> shadows a top-level command. CLI bootstrap becomes async: load manifests, validate safe loader
> subpaths, register built-ins, attach contributed children, then call `program()`. Duplicate
> `(mount,id)` pairs fail before parsing and report both plugin owners. No plugin-specific collision
> exception exists.

Manifest loader resolution—not the AST source walker—must feed this registry. Add explicit slices
for the contribution type/builder/merger/verifier, async bootstrap, loader failure isolation,
duplicate/reserved-name rules, help rendering, and plugin-absent behavior. DP-4 §7's
`verify-plugin.ts` gate must be backed by new `PluginExpectations.cliCommands` and
`PluginExpectations.doctorChecks` checks.

## SF-5 — [MAJOR] `plan` cannot simultaneously mean pure preview and artifact emission

**Evidence.** DP-2 §2 calls `plan` “dry-run + artifact emission” and removes `emit`, while DP-2 §3
adds a separate `ArtifactEmitterPort`. The shipped port has distinct `plan` and `emit` operations
(`packages/cli/src/kernel/domain/deploy/deploy-target-port.ts:12-20`, `:106-110`). Their current
semantics already diverge: Deno Deploy `plan` is non-mutating preflight
(`packages/cli/src/kernel/domain/deploy/deno-deploy-target.ts:75-87`), whereas Aspire Compose `plan`
runs publish and writes artifacts, with a separate emit alias
(`packages/cli/src/kernel/adapters/aspire/aspire-compose-deploy-target.ts:90-98`). DP-3 §6 and DP-8
Story 4 depend on a materialized `.vercel/output` consumed by `vercel deploy --prebuilt`; OCI and CI
pipelines likewise need build/attest/push/deploy to be separable.

**Suggested amendment.** Replace LD-3 and DP-2 §2 with an eight-operation lifecycle:

> `plan` is pure with respect to artifact directories and providers: it resolves topology, validates
> capabilities, and returns a serializable `DeploymentPlan`. `emit` materializes an
> `EmittedArtifactManifest` and content-addressed artifacts but does not deploy or push unless the
> artifact format explicitly models a publish phase. `up --prebuilt <manifest>` consumes an existing
> artifact; plain `up` may offer the convenience composition `plan -> emit -> up`.

Record artifact digest, source revision, target variant, emitter version, and provenance so a CI
build job can hand the exact artifact to a later deploy job. Retain `ArtifactEmitterPort`; do not
hide its mutation behind a nominal dry run.

## SF-6 — [MAJOR] The closed flat capability vocabulary couples core to every leaf and mixes three different dimensions

**Evidence.** DP-2 §4 says `DeployCapabilityId` is closed in core while definitions and ID types
live in leaf packages; core must therefore import each participating leaf merely to assemble its
closed union. The examples mix runtime traits (`long-running-process`, `websocket`), leaf semantic
guarantees (`kv-atomic`, `queue-consume`), and topology/workload constraints (`exclusive-db-writer`,
`offline-sync`). DP-2 §5 then puts the same IDs on opaque leaf bindings, despite saying core never
interprets leaf semantics. This cut grows a deploy-core edit/import for each new leaf feature and
cannot say whether a verdict describes the platform, the installed adapter, a backing, or one target
mode.

**Suggested amendment.** Replace the flat closed union with three explicit structures:

```ts
interface CapabilityRef {
  readonly namespace: string;
  readonly name: string;
  readonly major: number;
}
interface BindingRequirement {
  readonly binding: string;
  readonly capability: CapabilityRef;
}
interface WorkloadConstraint {
  readonly kind: 'singleton' | 'long-running' | 'co-locate' | 'offline';
}
```

Core owns only these structural types and a well-known runtime-trait vocabulary; leaf packages
export namespaced requirements and conformance descriptors without core importing them. A verdict
must carry `scope: 'runtime' | 'adapter' | 'binding'`, `level`, and evidence. Versioned namespaced
references allow leaf growth without manifest rot, while the small closed runtime vocabulary keeps
provider manifests comparable. Amend R-GRAPH-1 to “core imports no leaf package; leaves contribute
descriptors through structural contracts.”

## SF-7 — [MAJOR] Several DP-3 manifest rows are unsupported, mode-collapsed, or contradicted by repository evidence

**Evidence.** DP-3 §1 labels Aspire `queue-consume: lossless` from the existence of in-process
listeners, which proves process liveness but not queue delivery/ack/redelivery semantics; it also
changes `exclusive-db-writer` by replica count without defining a target variant. DP-3 §2 says
bare-metal is “everything lossless that the host machine provides,” which is neither an enumerable
manifest nor conformance evidence. DP-3 §3 calls Deno Deploy `kv-atomic: partial` because queues and
replication controls are absent, but those are separate capabilities; NetScript's Deno KV adapter
implements version checks and atomic commit directly
(`packages/kv/adapters/deno-kv.adapter.ts:155-194`). DP-3 §4 says container capabilities are
“inherited” without specifying the input manifest or composition rule. DP-3 §§5/7 put Workers and
Containers, or Lambda and Fargate, in one card even though their process/saga verdicts are
opposites. `lossless | partial | unsupported` also forces unproven/not-installed cases to masquerade
as provider impossibility.

**Suggested amendment.** Make manifests target-variant and composed:

```ts
interface CapabilityVerdict {
  readonly level: 'lossless' | 'partial' | 'unsupported' | 'unverified';
  readonly scope: 'runtime' | 'adapter' | 'binding';
  readonly evidence?: string;
  readonly note?: string;
}
interface DeployCapabilityManifest {
  readonly target: string;
  readonly variant: string; // e.g. workers, containers, lambda, fargate, compose, kubernetes
}
```

Runtime manifests declare only runtime evidence; installed leaf backing manifests supply queue/KV
semantics; the compiler composes them. Remove Aspire's queue and exclusive-writer claims until the
backing/replica conformance cell is present. Replace bare-metal's blanket sentence with explicit
runtime rows. Judge Deno KV atomicity by the atomic conformance suite, not by unrelated queue or
replication gaps. A `lossless` result requires a live-platform cell; an in-memory fake can validate
the harness but cannot certify the provider.

## SF-8 — [MAJOR] The scaffold stories promise macro-service decomposition that no designed contract or board slice performs

**Evidence.** DP-8 Stories 1 and 2 split one graph between Workers/Containers and Lambda/Fargate,
and the cross-story gate says the compiler proposes a macro-service/external-binding solution. DP-2
§4's compiler only compares app requirements with one manifest and returns fail/warn; neither
`DeploymentPlan`, `ResourceBinding`, nor the board defines cells, selectors, cross-cell transport,
ownership of schedules/consumers, or a deterministic partition algorithm. One adapter-level manifest
cannot describe the mixed-compute result.

**Suggested amendment.** Add a pre-W5 topology contract and issue:

```ts
interface DeploymentCell {
  readonly id: string;
  readonly selectors: readonly string[];
  readonly target: string;
  readonly variant: string;
  readonly bindings: readonly string[];
}
interface DeploymentTopologyPlan {
  readonly cells: readonly DeploymentCell[];
  readonly transports: readonly CrossCellTransport[];
}
```

For v1, require cells to be user-declared in `deploy/targets.ts`; the compiler may return
machine-readable `suggestedCells`, but must reject rather than silently partition. Add gates for
single ownership of every service/consumer/schedule, explicit cross-cell transport, and stable plan
output. Until that slice lands, narrow the Cloudflare/AWS stories to one compute variant per target
and describe the other as a manual second target.

## SF-9 — [MAJOR] The compatibility map aliases commands whose observable semantics are not equivalent

**Evidence.** DP-6 M-11 maps `start`, `stop`, `upgrade`, `copy`, and `package-cli` to the seven-op
bare-metal surface even though DP-2 §2 only names aliases for build/install/uninstall. In the
shipped port `up` means install + enable + start and `down` means stop + disable + uninstall
(`packages/cli/src/kernel/domain/deploy/deploy-target-port.ts:110-113`). The existing `start` and
`stop` commands operate on selected already-registered services without installing/uninstalling
(`packages/cli/src/public/features/deploy/start/start-deploy-command.ts:7-14`, `:88-112`;
`packages/cli/src/public/features/deploy/stop/stop-deploy-command.ts:7-13`, `:86-108`). `copy`
deliberately syncs prebuilt artifacts without registration
(`packages/cli/src/public/features/deploy/copy/copy-deploy-command.ts:7-21`); `upgrade` is a
flag-sensitive five-step transaction
(`packages/cli/src/public/features/deploy/upgrade/upgrade-deploy-command.ts:32-75`, `:133-180`);
`package-cli` produces a self-shippable operator binary
(`packages/cli/src/public/features/deploy/package-cli/package-cli-deploy-command.ts:5-25`).

**Suggested amendment.** Flip OF-5 and replace M-11 with:

> Legacy flat commands remain first-class compatibility handlers owned by `deploy-baremetal` through
> the next semver-major release. Only `build -> plan + emit`, `status`, and `logs` may be direct
> aliases. `install`, `start`, `stop`, `copy`, `upgrade`, `package-cli`, and `uninstall` retain
> their current flags and side-effect boundaries behind a `BaremetalCompatibilityCommands` adapter.
> Help may deprecate them, but no minor-release removal date is claimed until an equivalent
> canonical workflow and migration telemetry exist.

Add golden help/exit-code tests and state-transition tests proving that `stop` never uninstalls and
`start` never registers a service.

## SF-10 — [BLOCKER] The target schema registry has a config/plugin bootstrap cycle and would silently erase new target config

**Evidence.** DP-2 §6 and DP-6 M-5 move vendor schemas to adapters and compose them “at load time.”
Today the full config parses `deploy` through a static schema before exposing the `plugins` list
(`packages/config/src/domain/schemas/netscript-config-schema.ts:153-159`); unknown target keys are
stripped by design and tested as such
(`packages/config/tests/schema/netscript_config_test.ts:110-145`). Only after that parsed config
exists does the plugin host resolve manifests and contributions
(`packages/cli/src/public/features/plugins/host/plugin-loader.ts:78-99`). Thus an adapter schema
cannot be discovered before its config has already been discarded. A one-window re-export does not
solve the ordering or preserve `DeployConfig` inference for existing consumers.

**Suggested amendment.** Define an explicit two-phase loader:

1. Bootstrap-parse only project identity, `plugins`, and `deploy.targets` as
   `Record<string, unknown>` without stripping values.
2. Resolve plugin and generated adapter descriptors, including schema loaders.
3. Compose the final target schema registry and parse the entire config.
4. Reject an unrecognized target with `DeployTargetAdapterMissingError`; never silently drop it.

Keep the legacy target types/schemas exported from `@netscript/config` for the compatibility window,
implemented as delegating aliases or a frozen legacy union. Add tests for installed custom target,
missing adapter, malformed adapter config, plugin-loader failure, and all existing target keys. Make
DP-7 depend on the two-phase loader slice rather than treating the loader seam as already present.

## SF-11 — [MAJOR] The `deploy-container` exception is an unnecessary adapter-to-adapter dependency

**Evidence.** R-GRAPH-2 says adapters depend only on core plus one provider, then exempts Cloudflare
and AWS so they may import `deploy-container`; DP-2 §3 simultaneously defines `ContainerBuildPort`
in core. Calling the exported implementation “itself a core-port implementation” does not make an
adapter package part of core. The exception permits container auth, process, registry, and platform
client dependencies to leak transitively into otherwise independent adapters and establishes the
precedent R-GRAPH-2 was meant to forbid.

**Suggested amendment.** Delete the exception. `deploy-cloudflare` and `deploy-aws` accept a
core-owned `ContainerBuildPort` in their constructors/factories. `deploy-container` exports an
implementation/factory; the plugin or generated project registry injects it. Add an import-graph
gate forbidding every `deploy-*` package from importing another `deploy-*` package. If shared OCI
value objects are required, keep them with the port in core, not in an adapter implementation.

## SF-12 — [MAJOR] “Peer install choices” lack a concrete optional-adapter composition and permission mechanism

**Evidence.** DP-4 §§1/3 says the plugin composition root builds a registry from whichever adapter
packages the project installed, while DP-1 R-GRAPH-3 says the plugin is where all adapters meet.
Static imports from the plugin make all adapters mandatory; dynamic imports require package/export
descriptors, error behavior, schema association, and safe loader validation that are not designed.
The plugin manifest also declares one aggregate `withPermissions(DEPLOY_PLUGIN_PERMISSIONS)`, even
though actual permissions vary from local `systemctl` through `wrangler`, Docker, AWS networking,
and filesystem roots. `target add` is asked to add imports/config/assets but no canonical registry
file contract is specified.

**Suggested amendment.** Make the plugin depend only on core. Define an adapter descriptor:

```ts
interface DeployTargetContribution {
  readonly key: string;
  readonly targetLoader: SafePackageExport;
  readonly schemaLoader: SafePackageExport;
  readonly permissions: DeployPermissionProfile;
}
```

`deploy target add` writes one descriptor to the user-owned/generated target registry and installs
that peer; runtime loads only those descriptors. The plugin composes resolved instances, never
imports every official adapter. Doctor reports the exact installed target permission/tool set, and
the CLI launcher computes/prints the required permission profile instead of advertising every
provider permission for every project. Add missing-peer, invalid-export, duplicate-key, uninstall,
and stale-registry tests.

## SF-13 — [MAJOR] “Duplicate-guarded/closed-on-key preserved” is a false repository claim

**Evidence.** DP-2 §6 and DP-6 M-2 describe the shipped registry as closed-on-key and say duplicate
guarding is preserved. The actual method is documented “Register or replace” and unconditionally
calls `Map.set`
(`packages/cli/src/kernel/application/registries/deploy-target-registry.ts:101-104`). This matters
during migration: silently replacing a built-in with a plugin adapter would make the very collision
tests in DP-4 lie.

**Suggested amendment.** Mark duplicate rejection as **NEW**, not moved behavior. Introduce
`DeployTargetCollisionError { key, existingOwner, incomingOwner }`; make `register` reject by
default and expose a separate, composition-root-only `replaceForCompatibility` method only if a
named W1 shim truly needs it. Test constructor duplicates, generated-registry duplicates,
environment-qualified keys, and deterministic entry ordering. Remove the explicit replacement API
after the compatibility shim is gone.

## SF-14 — [MAJOR] The doctor union and `contributesDeployTargets` flag repeat the closed-host edit pattern the plugin system should remove

**Evidence.** DP-4 §5 calls a union that needs one host PR for every plugin “AP-24-safe.” The
current hard-coded union contains only `auth-backend`
(`packages/plugin/src/config/domain/plugin-contributions.ts:11-17`); widening it to `deploy-target`
merely adds the next switch case. Likewise a deploy-specific installer boolean creates a new generic
manifest field for one family. The current axis list is already a central closed vocabulary
(`packages/plugin/src/domain/constants.ts:15-40`), so these one-off discriminants compound host
churn rather than contributing behavior.

**Suggested amendment.** Replace both host changes with data:

```ts
interface DoctorCheckContribution {
  readonly id: string;
  readonly loader: SafePackageExport;
}
interface PluginManifestCapabilities {
  readonly contributionAxes?: readonly ContributionAxis[];
}
```

Doctor loads contributed checks through a duplicate-guarded registry; the installer infers deploy
participation from declared axes/descriptors rather than `contributesDeployTargets`. Reserve closed
unions for host-executed protocols whose cases have genuinely different host semantics, not plugin
identities. Add loader isolation, duplicate ID, and failure-reporting tests.

## SF-15 — [MAJOR] The board hides oversized W1/host work and contains dependency gaps

**Evidence.** Plan §5 puts ports, registry, conventions, build, and config in DP-1 despite their
different ownership and migration hazards; DP-8 combines three host changes despite DP-4 §5 saying
each is its own slice. DP-9's composition root depends only on DP-2/DP-8 even though it must compose
the W2 adapters and schema registry. DP-11's Story-0 E2E invokes `target add` but does not depend on
DP-10, and DP-16 includes the Cloudflare Containers lane without depending on DP-13. DP-13 combines
the OCI engine and five independently authenticated/live-probed platform clients. These are not
commit-sized slices, and the current approximately 20 children omit the migration compatibility gate
entirely.

**Suggested amendment.** Replace the draft board with 28 children (29 items including the epic,
still below 30):

- Split current DP-1 into four children: contracts/re-exports; pure conventions/constants; empty
  registry + CLI compatibility composition; compile-emitter refactor/extraction.
- Split current DP-8 into three: contribution contract/builder/verifier; async CLI bootstrap and
  mount collisions; generic doctor/capability metadata.
- Split current DP-13 into OCI build/push and a thin-platform client tranche.
- Split current DP-18 into AWS-PROBE-HTTP and the gated adapter/scaffold.
- Add one first-class legacy/config compatibility issue carrying SF-9/SF-10 gates.

Correct dependencies: plugin composition depends on extracted adapters + schema loader; Story-0
scaffold E2E depends on the target-add CLI; Cloudflare depends on the OCI slice if Containers remain
in scope; every plugin-mount issue depends on async bootstrap. Each child body must name files,
anti-scope, and the smallest proof command; the expensive full runtime E2E remains a wave exit gate,
not an intermediate loop.

## SF-16 — [MINOR] “Zero app-code diffs for every story” is too broad to be an enforceable scaffold gate

**Evidence.** DP-7 §3 and DP-8's opening/cross-story acceptance make identical app code an absolute
invariant. Cloudflare Workers and Vercel Node/Bun are not Deno processes, and DP-3 itself requires
compatibility probes for `node:` touchpoints and runtime lag. A generated Fetch entry can adapt the
framework boundary, but it cannot make arbitrary application use of `Deno.*`, native addons,
filesystem/process APIs, or runtime-specific dependencies portable. The shipped compile target
extraction accepts general service/plugin/app entrypoints rather than a declared Web-standard
profile (`packages/cli/src/kernel/adapters/deploy/compile/compile-targets.ts:14-22`).

**Suggested amendment.** Replace the gate with:

> A canonical fixture constrained to the declared runtime profile uses the same domain/service
> source across targets; only generated entry modules, config, bindings, artifacts, workflows, and
> backing packages differ. For arbitrary projects, `plan` performs dependency/API compatibility
> analysis and rejects unsupported runtime touchpoints with file-level diagnostics.

Publish the profile contract (`deno-native`, `web-standard`, `node-compat`) and give each adapter a
probe fixture. Treat a provider-specific generated entry as adapter output, not evidence that every
unrestricted application is portable.

## Quick wins

- Fix the stray signature typo `createDeployTargetRegistry(entries, )` in DP-2 §6.
- Reconcile every “7-op” label with the shipped eight canonical literals (`plan` and `emit` are both
  present); if SF-5 is adopted, call the contract eight-op everywhere.
- Use one explicit mapping for config keys (`windows`, `linux`), registry keys (`windows-service`,
  `linux-service`), and the proposed `baremetal` CLI target; the corpus currently treats them as
  interchangeable.
- In Story 0, choose one flow: preinstall the default target, or require
  `deploy target add deno-deploy`; do not state both.
- Change runtime-config wording from “readable without redeploy” to “checked at each CLI/CI
  invocation”; there is no resident deploy service to observe changes mid-operation.
- Add `schemaVersion`, adapter version, upstream tool/version range, probe date, and evidence ID to
  every published capability manifest.
- Distinguish `unsupported`, `unverified`, `adapter-not-installed`, and `credential-unavailable` in
  doctor/capability output; only the first is a provider verdict.
- Require secret-reference tests to prove values never appear in plans, manifests, telemetry,
  events, command arguments, or thrown errors.
- Expand the OF-2 graduation rule: a thin PaaS client graduates from a subpath when auth,
  lifecycle/error semantics, release cadence, or live-gate ownership diverges—not only when it gains
  a large SDK dependency.
