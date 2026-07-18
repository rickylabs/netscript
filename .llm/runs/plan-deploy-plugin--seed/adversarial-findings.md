# Deploy-plugin seed — constructive adversarial findings

> Reviewer: Codex Sol, xhigh, constructive adversarial lane
> Generator baseline: `f360deca36d64c6adecf441bad21e520cc037d03`
> Review date: 2026-07-19
> Scope: planning artifacts only; no product source, GitHub, merge, or release mutation

## Overall verdict

**PASS — no blocker findings.** This is the advisory adversarial verdict, not the formal
`PLAN-EVAL` verdict. The family direction is worth preserving, but the plan is **not yet ready to
drive implementation unchanged**: the findings below include twelve major corrections and one
minor slicing correction that the integration pass should absorb first.

The generator got several important decisions right:

- `plugin-deploy` + `plugin-deploy-core` + provider adapters is the correct macro-level analogue
  of the auth family. The plugin is a composition/delivery shell, the core owns stable deployment
  semantics, and provider packages wrap volatile provider surfaces.
- Deno-native-first is presented as a tiered, testable claim rather than pretending workerd,
  Lambda, or Vercel Node are Deno runtimes.
- Aspire remains a composer/executor behind a port; Nitro remains outside the application
  composition contract and is retained only as reference evidence or a future emitter.
- Provider primitives remain leaf-owned. SQS semantics, Durable Objects, Workers KV, queues,
  databases, and saga stores must not be swallowed by a deployment god object.
- Cloud adapters are probe-gated, AWS starts HTTP-only, unsupported capabilities reject instead
  of silently degrading, and release work is not mixed into this plan.

Those are the load-bearing parts of Fable's design. The recommendations below refine them rather
than replace them.

## Numbered findings

### 1. **[major] W1 is described as behavior-preserving extraction, but its proposed port is a breaking redesign**

**Dimensions:** architecture, migration, selective wrapping

**Evidence.** DP-2 says the shipped port “moves as-is in W1” and is sharpened in W2, but its
proposed type already removes `emit`, makes every method required, gives methods different result
types, and says `plan` performs “dry-run + artifact emission”
([DP-2:28-57](./design/canonical/DP-2-deploy-core.md)). The shipped contract instead has **eight**
canonical operations including `emit`; every handler is optional; and three legacy operations
remain in the type
([deploy-target-port.ts:12-32](../../../packages/cli/src/kernel/domain/deploy/deploy-target-port.ts),
[deploy-target-port.ts:89-128](../../../packages/cli/src/kernel/domain/deploy/deploy-target-port.ts)).
The doctrine's current Archetype-7 wording also names `plan` **and** `emit` separately. DP-2 then
introduces a dedicated `ArtifactEmitterPort`, which is the right boundary, while simultaneously
making `plan` emit artifacts, which collapses the boundary again.

The current request/handler surface also has no cancellation signal. `logs`, deploy/publish, image
push, and provider tail operations are all long-running I/O and need the A2 cancellation seam at
the stable port, not provider-specific ad hoc process termination later.

**Why it matters.** The first wave cannot be both the behavior-freeze proof and the vocabulary
rewrite. A required-method interface also contradicts declared subsets: a target can claim five
operations yet still be forced to implement all seven. Combining dry-run planning with artifact
I/O makes `plan` harder to make deterministic, cacheable, and safe.

**Recommendation.** Make W1 a literal move of the existing eight-operation/legacy surface and
keep its behavior tests green. In a separately reviewed contract slice:

1. retain `plan` as non-mutating computation/preflight and `emit` as local artifact materialization;
2. model declared operations and handlers with one typed handler map so a key cannot be declared
   without a handler or implemented without being declared;
3. put `AbortSignal` plus structured output/progress sinks in `DeployOperationContext`;
4. deprecate legacy operations independently of the extraction; and
5. decide whether the long-term public vocabulary is seven or eight only after the emitter split
   and compatibility data exist.

This executes the generator's §10 attacks on AP3 and “plan subsumes emit”; the current answer does
not survive either attack.

### 2. **[major] Multi-target adapter installation has no complete activation/registry contract**

**Dimensions:** architecture, contribution story

**Evidence.** DP-1 allows registration either in the plugin composition root or a generated
project registry, while DP-4 says `deploy target add <key>` adds an adapter import, config member,
and assets. The only userland sketch is `deploy/targets.ts`, a configuration object. The plan does
not name the generated module path, export, definition guard, load order, composition call, or
ownership of adding/removing imports. It also does not distinguish executable adapter factories
from user-owned configuration.

Auth is not a complete precedent here: it statically imports known adapters and materializes one
active backend. Deploy needs an arbitrary set of concurrently installed packages. The repository
already has a useful generic `loadGeneratedProjectRegistry()` seam
([generated-project-registry.ts:9-69](../../../packages/plugin/src/cli/application/generated-project-registry.ts)),
but the deploy design never binds its target-add story to it. The shipped registry currently
silently replaces duplicate keys
([deploy-target-registry.ts:85-113](../../../packages/cli/src/kernel/application/registries/deploy-target-registry.ts)),
while DP-1 calls the future registry closed-on-key and duplicate-guarded.

**Why it matters.** As drawn, installing an adapter can leave a package and config on disk without
making the target callable. Silent replacement also lets a later package hijack a target key,
which is especially dangerous for deployment and secrets operations.

**Recommendation.** Specify one static activation pipeline, for example:

- `.netscript/generated/deploy/targets.registry.ts` imports adapter factories and exports frozen,
  typed definitions containing key, factory, config schema pointer, manifest pointer, scaffold
  pointer, and package provenance;
- the contributed CLI group loads that registry through the existing generated-registry loader,
  validates every definition, and constructs the core registry at its composition root;
- `deploy/targets.ts` remains user-owned data only and never imports provider executables;
- duplicate keys fail with both package provenances; no implicit replacement;
- `target add/remove` updates package metadata, generated registry, config, and scaffold assets as
  one recoverable plan, then runs `deno check` and doctor before committing the change; and
- sync/doctor detects stale generated imports and missing packages.

This keeps the good auth topology while defining the multi-target inversion auth does not solve.

### 3. **[major] The container reuse cut violates the plan's own adapter dependency rule and risks a false universal platform port**

**Dimensions:** architecture, selective wrapping

**Evidence.** DP-1 says adapters depend only on core plus their provider, then grants AWS and
Cloudflare a direct dependency on `deploy-container` because it implements `ContainerBuildPort`
([DP-1:65-79](./design/canonical/DP-1-family-architecture.md)). DP-2, however, correctly places
`ContainerBuildPort` in core. A consumer should depend on that port and receive its implementation
from the plugin composition root; depending on the implementing adapter reverses the ports/adapters
cut.

DP-3 also proposes one generic platform lifecycle port — create/deploy service, set env, logs,
status, destroy — for Fly Machines, Koyeb, Sevalla, Coolify, and Dokploy
([DP-3:72-89](./design/canonical/DP-3-adapter-cards.md)). Those providers do share OCI artifacts,
but they do not share resource identity, rollout/rollback, health, auth, environment, state, or
destruction semantics closely enough to justify a provider-neutral lifecycle abstraction before
two real implementations prove it.

**Why it matters.** The direct dependency makes AWS/Cloudflare installation transitively pull a
concrete platform adapter and weakens substitution. The broad REST port is likely to become the
same lowest-common-denominator mapping the prior unified-runtime review rejected.

**Recommendation.** Keep `ContainerBuildPort` and an OCI artifact descriptor in core; inject the
`deploy-container` implementation at the plugin composition root. Let AWS and Cloudflare depend
only on the port. Keep small PaaS clients as `deploy-container` subpaths under OF-2, but have each
implement `DeployTargetPort` directly and share only focused HTTP/auth/pagination/process helpers.
Extract a lifecycle port later only if at least two adapters demonstrate identical invariants,
errors, and state transitions.

### 4. **[major] The capability model centralizes leaf vocabulary and overstates what conformance can prove**

**Dimensions:** architecture, contribution story

**Evidence.** DP-2 makes `DeployCapabilityId` and `LeafBindingKind` closed vocabularies in core,
while saying their meanings and tests live in leaf packages and core imports leaf ID types
([DP-2:85-125](./design/canonical/DP-2-deploy-core.md)). A total
`Record<DeployCapabilityId, verdict>` means adding a leaf capability changes core and every
manifest. That is not leaf ownership; it is a distributed closed enum.

Several sketches already do not fit the declared schema. Bare metal uses
`offline-sync: profile-dependent`, which is not one of `lossless | partial | unsupported`, and
containers “inherit” capabilities from the image/project, so a static target manifest is not the
actual verdict ([DP-3:39-50](./design/canonical/DP-3-adapter-cards.md),
[DP-3:72-86](./design/canonical/DP-3-adapter-cards.md)). The shared suite says an in-memory fake
plus a live probe exercises every row. A fake proves the harness and adapter mapping; it cannot
prove a provider's current queue, KV, rollback, or runtime semantics.

**Why it matters.** This recreates a cross-domain god vocabulary and makes “backend-truthful” a
type-level claim rather than evidence. It also cannot represent a verdict that emerges only after
combining compute, image, environment profile, and selected leaf backings.

**Recommendation.** Split the model:

- core owns a small, versioned placement/artifact/lifecycle vocabulary;
- leaf requirements use namespaced opaque IDs and leaf-owned descriptors/schemas registered as
  data, not imports from every leaf implementation;
- the compiler computes a **composed verdict** from target + artifact + environment profile +
  selected leaf backings;
- each row carries provenance, evidence mode (`static`, `fake`, `local integration`, `live`),
  upstream/tool version, observation date, and expiry; and
- an unprobed provider claim is `unknown`/experimental or unsupported, never promoted by a fake.

Keep the rejection compiler — it is one of the strongest ideas in the seed — but make its inputs
open, compositional, and evidence-bearing.

### 5. **[major] Several per-target operation tables are not truthful against current upstream surfaces**

**Dimensions:** selective wrapping, migration

**Evidence.** Focused local verification on 2026-07-19 produced these current surfaces:

- `deno deploy` version `0.0.9904` exposes deploy/create/env/database/apps/orgs/deployments/logs,
  but `apps` has only list/get and `deployments` has only list. It has no `delete`, `show`, or CLI
  rollback command. The shipped wrapper nevertheless builds `deno deploy delete` and
  `deno deploy show`
  ([deno-deploy-cli.ts:14-16](../../../packages/cli/src/kernel/adapters/deno-deploy/deno-deploy-cli.ts),
  [deno-deploy-cli.ts:70-77](../../../packages/cli/src/kernel/adapters/deno-deploy/deno-deploy-cli.ts));
  DP-3 carries forward `down/status/rollback`. The platform advertises instant rollback, but that
  does not prove a callable CLI transport. See the official
  [Deno Deploy CLI reference](https://docs.deno.com/runtime/reference/cli/deploy/) and
  [application deletion limits](https://docs.deno.com/deploy/reference/apps/).
- Aspire 13.4.6 does expose `publish`, `deploy`, and `destroy`, validating the plan's main wrap.
  But these execute AppHost-registered pipeline steps; destroy fails if the selected compute
  environment did not register one, and `describe` describes a **running AppHost**, not an
  arbitrary deployed environment. See the official
  [Aspire CLI overview](https://aspire.dev/reference/cli/overview/) and
  [`aspire destroy`](https://aspire.dev/reference/cli/commands/aspire-destroy/).
- Vercel now has a first-class `vercel rollback [deployment]` command. DP-3 and Story 4 still say
  “rollback via deployment aliasing”. That is stale and omits plan-tier restrictions and rollback
  state. See [Vercel's rollback guide](https://vercel.com/docs/deployments/rollback-production-deployment).
- Cloudflare's `wrangler rollback` is real, but rollback can be rejected after KV/R2/queue binding
  deletion or a Durable Object lifecycle change. The manifest needs those state caveats, not a
  bare supported verdict. See [Cloudflare rollback limits](https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/).

The existing CLI E2E exercises Deno `plan` and only inspects Compose/Docker help text
([deploy-targets-suite.ts:33-47](../../../packages/cli/e2e/suites/deploy/deploy-targets-suite.ts),
[deploy-targets-suite.ts:100-127](../../../packages/cli/e2e/suites/deploy/deploy-targets-suite.ts));
it cannot catch the nonexistent Deno `show`/`delete` commands.

**Why it matters.** A deployment port is credible only if every advertised operation names an
actual transport and destructive semantics. “The provider supports this in its UI” is not enough
for a CLI adapter.

**Recommendation.** Every adapter card should include an operation evidence table with operation,
exact CLI/API call, required tool version, mutation/destruction semantics, cancellation behavior,
credential mode, expected structured output, and live probe. Omit the operation until that table
passes. Specifically: remove Deno `down/status/rollback` from the advertised CLI subset until an
official stable transport is implemented and probed; map Vercel to `vercel rollback`; make Aspire
ops conditional on registered pipeline steps; and encode Cloudflare's binding/DO rollback limits
as conditional/partial verdicts. Add a W1/W2 repair card for the already-shipped Deno wrapper.

### 6. **[major] The Pulumi Automation API prerequisite claim is factually wrong and hides state ownership**

**Dimensions:** selective wrapping, contribution story

**Evidence.** Provider research says Automation API provides “no CLI/no Pulumi Cloud account”, and
DP-5 repeats the no-account rationale. Pulumi's official documentation says Automation API drives
the Pulumi CLI under the hood and the CLI must be present at runtime
([Automation API](https://www.pulumi.com/docs/iac/concepts/automation-api/)). A Pulumi Cloud account
can be avoided with a DIY backend, but then the user owns state storage, locking, backup, secrets
encryption, access, and availability
([state and backends](https://www.pulumi.com/docs/reference/state/)).

**Why it matters.** The optional AWS IaC lane currently omits a binary prerequisite, Deno process
permission, version compatibility, backend selection, credentials, and an enterprise-critical
state contract.

**Recommendation.** Preserve Pulumi as an optional `./pulumi` candidate, but correct the claim to
“programmatic API over the Pulumi engine/CLI; Pulumi Cloud optional.” Require a pinned/tested CLI
range, doctor check, `--allow-run=pulumi`, noninteractive install policy, explicit backend URL and
secrets provider, state-lock/backup guidance, and a probe that starts from a clean CI host. If the
team will not own that operational contract in W5, keep the IaC subpath as a later RFC and support
existing-infrastructure image deployment first.

### 7. **[major] Proposed host extensions repeat auth's hardcoded seams instead of adding a generic contribution pointer**

**Dimensions:** architecture, contribution story

**Evidence.** DP-4 proposes widening `cli.doctorChecks` from `'auth-backend'` to
`'auth-backend' | 'deploy-target'` and adding `contributesDeployTargets?: boolean`, requiring a host
change for every future check/capability kind
([DP-4:97-116](./design/canonical/DP-4-plugin-and-host.md)). The current literal union is indeed
hardcoded
([plugin-contributions.ts:11-17](../../../packages/plugin/src/config/domain/plugin-contributions.ts)),
but the adapter contract already supports generic named executable `DoctorCheckSpec`s
([adapter/contract.ts:81-121](../../../packages/plugin/src/adapter/contract.ts)). The parallel
frontend plan uses a better pattern: a manifest pointer plus a generated registry, with block
presence acting as the capability.

The CLI collision rule also has one unexplained exception: contributed groups cannot shadow a
built-in group except deploy. That is a special case, not a protocol.

**Why it matters.** Host core becomes a switchboard of first-party plugin names. The boolean can
drift from the actual target contribution, and the deploy exception weakens deterministic CLI
composition for every later plugin.

**Recommendation.** Add a real declarative contribution such as
`deployTargets: { export, contractVersion }` (and `cliCommands: { group, loader, contractVersion }`),
then infer capability from the validated block. Keep executable doctor functions in the plugin
connector or load them through a generic pointer; do not grow a host literal union per plugin.
Define a typed replacement/delegation protocol for the compatibility shim (`replacesBuiltIn`, one
owner, version match, deterministic precedence), or make the built-in shim lazily delegate without
registering a second `deploy` group. Do not encode “except deploy” in the collision algorithm.

### 8. **[major] OF-4 is not rework-safe: the parallel frontend contract requires a resident service the deploy plan rejects**

**Dimensions:** contribution story, architecture

**Evidence.** DP-4 and DP-7 specify no v1 service or HTTP contract and say a future service is a
one-card, rework-safe addition
([DP-4:46-52](./design/canonical/DP-4-plugin-and-host.md),
[DP-7:8-20](./design/canonical/DP-7-contribution-matrix.md)). The parallel `plan/frontend-contrib`
deploy example requires browser procedures `deploy.status`, `deploy.logs`, and `deploy.plan`, live
status/log islands, a plugin API proxy, confirm-gated mutating actions, and adapter-published
islands (`design/examples/deploy.md:15-57` on that branch). `deploy-events` can support audit/history;
it cannot provide live provider status, tail logs, execute plans, or authorize mutations.

**Why it matters.** The two plans currently promise incompatible v1s. Adding a control plane later
is not a mechanical seam: it creates authentication/authorization, audit, rate/timeout,
cancellation, secret redaction, streaming, and destructive-action contracts.

**Recommendation.** Resolve this fork before implementation:

- preferred v1: keep deploy CLI-first and make the frontend contribution explicitly
  **read-only history/capability/audit** from `deploy-events`; remove the live procedures and
  mutation language from the frontend example; create a separate service/control-plane design
  issue with security and streaming gates; or
- if the live console is owner-required in the first deploy release, flip OF-4 now and design the
  smallest versioned query/control service before the frontend or plugin manifests lock.

Either answer is defensible. Calling the current divergence deferred and rework-safe is not.

### 9. **[major] Provider-optimized scaffold stories promise leaf integrations that are explicitly unavailable and contradict “zero app-code diffs”**

**Dimensions:** contribution story, migration

**Evidence.** Story 1 promises Workers-first bindings and Story 2 promises SQS/DynamoDB choices,
but the adapter cards explicitly say `@netscript/kv-cloudflare`, `@netscript/queue-cf`,
`@netscript/queue-sqs`, and DO saga stores do not exist and are outside this family
([DP-3:151-157](./design/canonical/DP-3-adapter-cards.md)). DP-20 is only a deferred RFC, so no board
slice delivers the leaf packages needed for the owner-requested Cloudflare DO/KV/queue or AWS
suite. Falling back to an external URL contract is honest, but it is not a Cloudflare-first DO/KV
or AWS-first SQS/DynamoDB scaffold.

DP-8 simultaneously requires identical app source with zero app-code diffs
([DP-8:91-102](./design/canonical/DP-8-scaffold-stories.md)), while the frontend contribution
example correctly models provider starters as app-owned edge routes and binding wrappers. Those
files are provider-specific source by design.

**Why it matters.** The acceptance text can pass by emitting config while the headline scaffold
story remains unusable, or it can fail permanently waiting for packages the board does not own.

**Recommendation.** Choose and label one of two acceptance levels per provider:

1. **compute-only/external-binding scaffold** — ship now, explicitly exclude DO/KV/SQS/DynamoDB
   integration, and do not call it the full optimized suite; or
2. **provider-first scaffold** — add separately owned leaf-package/probe issues and dependencies
   to the board, with leaf maintainers and conformance gates.

Change the invariant to “zero diffs in provider-neutral domain/application code”; generated,
app-owned edge entries, provider binding adapters, and bootstrap files may differ. Add an
install/remove/switch story proving those provider-owned files compose and can be reversed without
rewriting domain code.

### 10. **[major] W3's install-hint shim breaks the migration contract it claims to preserve**

**Dimensions:** migration, contribution story

**Evidence.** DP-6 says all documented invocations continue unchanged through W3 and existing
projects keep working without the plugin. DP-4 says that at W3 the built-in `deploy` command only
prints an install hint when the plugin is absent
([DP-4:118-131](./design/canonical/DP-4-plugin-and-host.md)). For an existing project that upgrades
the CLI without installing a new plugin, a formerly working deploy command becomes a hint. That is
not additive compatibility.

The “two minor releases” alias window is also not operational for a `0.0.1-beta.*` train: no
first/last release, stable cutoff, or user-visible migration action is named.

**Why it matters.** This is the main user-facing breakage in the proposed extraction/pluginization
sequence, and the compatibility gate as written would not catch an upgrade-in-place project.

**Recommendation.** Keep a functional bundled legacy registry/shim for a precisely named release
window. It must execute current behavior, emit a deprecation plus the exact `plugin install deploy`
and `target add` migration command, and never require the plugin merely to keep an existing target
working. Add upgrade-from-previous-release E2E fixtures. Remove the functional shim only at an
owner-ratified release boundary after docs, telemetry/evidence, and migration tests pass. Express
the window as exact release identifiers or milestones, not “two minors.”

### 11. **[major] The migration map is not complete enough to prove a safe extraction, and it preserves a dangerous fail-open config path**

**Dimensions:** migration, architecture

**Evidence.** M-1…M-18 identify the principal concepts, but not all shipped surfaces that must be
moved, retained, deprecated, or explicitly left in CLI. Missing path-level dispositions include:

- `kernel/constants/deploy.ts`, `presentation/abstracts/deploy-step-command.ts`, and the deploy
  display/exit/runtime/shared/types/upgrade helpers;
- the deploy config loader/resolvers/types and their test variants;
- registry exports in `kernel/extension-points.ts` and constructor/default dependency wiring;
- `packages/cli/e2e/suites/deploy/deploy-targets-suite.ts`, unit tests, fixtures, templates, and
  generated asset mirrors; and
- four shipped tutorials plus the deploy/Aspire reference and how-to pages.

More seriously, current target routing catches **every** config load/validation error and silently
returns `undefined`, then invokes the target with defaults
([run-target-operation.ts:56-71](../../../packages/cli/src/public/features/deploy/target/run-target-operation.ts)).
DP-6's “config parses identically” promise would preserve this fail-open behavior into a tool that
can destroy or mutate production resources. Moving target schemas to installed adapters also has a
bootstrap problem: the loader must discover schema pointers before it can validate the config that
names installed targets.

**Why it matters.** Unmapped files become accidental CLI-private dependencies or dead duplicate
logic. A typo or schema error silently dropping target config can select a default app, environment,
output directory, or destructive target.

**Recommendation.** Replace the conceptual map with a path-level KEEP/MOVE/RE-EXPORT/DEPRECATE/
DELETE manifest plus import-consumer tests. Define a two-phase config bootstrap: load only the
minimal plugin/target registry metadata, load and validate adapter schemas, then parse the complete
deploy config. Config errors must fail closed before `up`, `down`, `rollback`, or `secrets`; include
path/key diagnostics and never substitute defaults after validation failure. Add negative E2E for
invalid config, stale generated registries, duplicate keys, missing schema packages, and the real
Deno status/down transports.

### 12. **[major] The supersession map is not stage-H ready and one draft label is invalid**

**Dimensions:** board sketch, migration

**Evidence.** Current read-only board inspection shows:

- [#824](https://github.com/rickylabs/netscript/issues/824) has an owner redirect from unified
  runtime to this deploy-plugin direction.
- [#823](https://github.com/rickylabs/netscript/issues/823) is still an open Nitro/unified-runtime
  epic; it does not contain a clean “deploy half” that can merely be re-scoped.
- [#451](https://github.com/rickylabs/netscript/issues/451),
  [#453](https://github.com/rickylabs/netscript/issues/453),
  [#454](https://github.com/rickylabs/netscript/issues/454), and
  [#455](https://github.com/rickylabs/netscript/issues/455) remain open after comments rehomed them
  under #823, while this plan explicitly sends desktop packaging to #830 and leaf concerns
  elsewhere.
- [#327](https://github.com/rickylabs/netscript/issues/327) still describes the old Nitro/Pulumi
  deployment epic and needs a non-closing supersession addendum or replacement decision.
- [#349](https://github.com/rickylabs/netscript/issues/349) is closed but retains stale status
  taxonomy; [#825](https://github.com/rickylabs/netscript/issues/825) is a separate Aspire
  packaging concern and should remain explicitly unaffected.

The draft epic uses `area:plugin`, but the checked-in taxonomy defines `area:plugins` and
`area:deploy`, not `area:plugin`
([labels.yml:94-115](../../../.github/labels.yml)). There is no explicit KEEP/FOLD/CLOSE/REHOME
table, closing-keyword policy per child, or ordering for when old umbrellas may close.

**Why it matters.** Filing the draft as-is would create a second deployment board while leaving
old umbrellas and children apparently authoritative. The wrong label also fails the repository's
machine-readable taxonomy.

**Recommendation.** Before any issue mutation, add a reconciliation table with issue, current
scope, disposition, destination, closing authority, and exact non-closing/closing comment text.
Recommended shape: new deploy epic supersedes the deploy direction in #823/#824; #823 and #824
close only after the new board exists and accepted history is linked; #451/#453/#454/#455 are each
audited and rehomed to #830 or their true leaf/foundation owner; #327 receives an explicit
supersession map; #349 taxonomy is reconciled only if policy permits edits to closed issues; #825
is KEEP/unaffected. Use `area:plugins`, `area:deploy`, and `area:cli` as applicable, exactly one
`status:`, and a verified milestone per future issue. No GitHub mutation belongs in this review.

### 13. **[minor] The draft board's first slices are too broad for the stated extraction discipline**

**Dimensions:** board sketch, migration

**Evidence.** DP-1 combines port, registry, conventions, build/compile, config base/schema
registry, a new package, and CLI rewiring behind one dependency. DP-2 then combines capability
contract, compiler, fake suite, and evidence policy. These are multiple independently reviewable
contracts with different consumers and rollback points. The board says “≈21 children” while the
table lists DP-1…DP-20, and several cards combine a probe, adapter, scaffold story, docs, and live
acceptance.

**Why it matters.** Large first slices make “extraction before invention” hard to verify and make
the implementation/evaluator commit protocol noisy.

**Recommendation.** Split W1 into: literal port/registry extraction + compatibility re-exports;
conventions extraction; build/emitter extraction; two-phase config/schema bootstrap; then CLI
rewire. Split each W5 probe from implementation and scaffold story, with implementation blocked on
the probe verdict. Give every issue a file/symbol scope, explicit anti-scope, smallest verdict
command, consumer/import test, docs impact, and exact dependency. Recount the children after the
integration pass.

## Per-dimension verdicts

| Dimension | Verdict | Rationale |
| --- | --- | --- |
| **Architecture** | **PASS WITH MAJOR REVISIONS** | The auth-shaped family and ports/adapters/plugin split are correct. Fix the operation contract, generated activation pipeline, adapter dependency direction, capability ownership, and host contribution protocol before implementation. |
| **Migration** | **PASS WITH MAJOR REVISIONS** | The wave order is good, but W1 is not yet behavior-preserving, W3 breaks plugin-absent projects, the file map is incomplete, current Deno operations are broken/stale, and config fails open. |
| **Contribution story** | **PASS WITH MAJOR REVISIONS** | CLI, scaffold, telemetry, stream, doctor, and frontend ambitions are concrete. The live frontend needs a service decision, and optimized cloud stories need either real leaf dependencies or honest compute-only scope. |
| **Selective wrapping** | **PASS WITH MAJOR REVISIONS** | Preserve Aspire-native, provider CLI/API wrapping, Build Output API, HTTP-only LWA, and no-Nitro-v1. Correct operation-level evidence, Vercel rollback, Pulumi prerequisites/state, and the generic PaaS abstraction. |
| **Board sketch** | **NOT READY TO FILE; NO BLOCKER AT SEED STAGE** | The child themes are credible, but supersession, taxonomy, issue granularity, leaf dependencies, and closure authority must be made exact before the owner authorizes any GitHub mutation. |

## Open-fork recommendations

| Fork | Recommendation | Reason |
| --- | --- | --- |
| **OF-1 — core package name** | Choose `@netscript/plugin-deploy-core`. | Exact auth/doctrine parity communicates that this is plugin-family core, while adapters remain `@netscript/deploy-*`. |
| **OF-2 — thin PaaS packaging** | Keep Fly/Koyeb/Sevalla/Coolify/Dokploy as `deploy-container` subpaths initially, with explicit graduation criteria. | This minimizes JSR surface. Share OCI/build and small utilities, not a premature universal lifecycle port. Graduate when a provider needs a material SDK/dependency, independent release cadence, permission model, or scaffold story. |
| **OF-3 — CLI delivery** | Use a plugin-contributed group plus a **functional** built-in compatibility shim for an exact release window. | Plugin ownership is correct; an install-hint-only shim violates upgrade compatibility. Use a typed delegation/replacement protocol rather than a collision exception. |
| **OF-4 — v1 service** | Keep v1 CLI-first **only if** frontend v1 is reduced to read-only history/capability/audit. Design the live control-plane service separately. | This is the smallest secure first release. If live status/logs/plan/actions are required in v1, flip the fork now and design contracts/auth/cancellation first; it is not rework-safe to defer silently. |
| **OF-5 — deprecation window** | Key deprecation to exact release identifiers/milestones, not “two minor releases.” | The current prerelease train has no meaningful two-minor window. Require upgrade E2E and owner-ratified removal gates. |
| **OF-6 — board/milestones** | Create a new deploy-plugin epic only after an explicit #823/#824/#327/#451/#453/#454/#455/#349/#825 reconciliation table and owner ratification. | The new direction deserves a clean board, but old authority must be folded/closed/rehomed deliberately. W1-W3 and W4-W5 may use beta.13/beta.14/stable only after the exact live milestones and owner intent are confirmed at filing time. |
| **OF-7 — Nitro** | No Nitro dependency in initial waves; retain it as an evidence corpus and optional future `ArtifactEmitterPort` implementation only after L-1 proof. | This preserves Deno-native/Web-standard composition and avoids adopting Nitro's build/runtime contract. Re-entry criteria in DP-5 are sound. |
| **OF-8 — AWS scope** | HTTP-only until AWS-PROBE-EVENTS and the leaf SQS contract pass. | LWA is an HTTP adapter, not an event/ack/visibility-timeout adapter. Keep SQS and other events leaf-owned and unclaimed in W5. |

## Generator attack-list disposition

| §10 attack | Result |
| --- | --- |
| Seven-op port / AP3 | **Did not survive unchanged** — finding 1 requires an operation-handler contract and emitter separation. |
| Cloudflare Miniflare fidelity | **Survives with probe discipline** — keep CF-PROBE; finding 4 prevents fake evidence from promoting live claims. |
| AWS LWA event semantics | **Survives** — OF-8 HTTP-only is correct. |
| Leaf backing ownership | **Architecture survives; delivery does not** — finding 9 requires real leaf cards or compute-only wording. |
| Import graph / adapter registration | **Needs correction** — findings 2 and 3 close the activation and dependency gaps. |
| Migration completeness | **Did not survive** — findings 5, 10, and 11 identify shipped breakage and unmapped surfaces. |
| CLI contribution axis / collision | **Did not survive unchanged** — finding 7 replaces the one-off host exception with a generic protocol. |
| `plan` subsumes `emit` | **Did not survive** — finding 1 keeps computation and artifact I/O distinct. |

## Integration priority

Before formal `PLAN-EVAL`, integrate in this order:

1. lock the W1 compatibility contract and operation/emitter semantics;
2. specify generated adapter activation, duplicate/provenance behavior, and two-phase config load;
3. correct current provider operation evidence and the Pulumi/Vercel claims;
4. resolve the frontend service fork and narrow or dependency-link provider-first scaffolds;
5. replace hardcoded host extensions with declarative contribution pointers;
6. complete the path-level migration and test map; and
7. author the exact board reconciliation/supersession table and re-slice large issues.

No finding requires abandoning the family design. All major findings are correctable in the
generator integration pass, which is why the overall result is **PASS**, not FAIL.
