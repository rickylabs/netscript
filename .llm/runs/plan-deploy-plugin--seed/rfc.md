# RFC — NetScript Deploy Plugin Family: `plugin-deploy` core + per-cloud adapters, Deno-native first

| | |
| --- | --- |
| **Status** | **Adversarially hardened draft (r3)** — direction ratified by owner 2026-07-18; package/API design pending owner arbitration of forks OF-1…OF-8 (§8); board **not filed** (numbers are placeholders) |
| **Tracking** | Refs #820 (single-deployment charter) · #327 (Deployment epic) · #823 (Unified epic — re-scope proposal §7) · #824 (unified-runtime seed — **superseded by this RFC**, §7) · #825 (Aspire packaging NuGet — unaffected) · #871 (enterprise-auth board — the composition + board pattern this family mirrors) |
| **Pipeline** | Fable 5 · xhigh generator → GPT-5.6 Sol · xhigh constructive adversarial (**16/16 findings accepted**, r2) → Kimi K3 doc-driven story (**13/13 DX findings accepted**, r3). Triage records in the run dir |
| **Evidence base** | Prior seed run `plan-unified-runtime--seed` (nitro-vs-own analysis, both adversarial rounds); live provider surfaces 2026-07-18 (Cloudflare/Vercel/AWS/Fly/Deno Deploy/thin PaaS/Nitro v3, primary sources); shipped deploy layer inventory; auth-plugin composition anatomy; doctrine A7 + `DEPLOY-ARCHETYPE-7-CORE-SEED` debt; full corpus in `.llm/runs/plan-deploy-plugin--seed/` (this PR) |

---

## Abstract

NetScript's deploy story is rebuilt as a **plugin family** — exactly the way auth composes:

```
plugins/deploy                     @netscript/plugin-deploy         (thin A5 plugin)
packages/plugin-deploy-core        @netscript/plugin-deploy-core    (A2 core: ports, registry,
                                                                     capabilities, conventions)
packages/deploy-aspire | deploy-baremetal | deploy-deno             (A2 adapters — extractions)
packages/deploy-container (+ fly/koyeb/sevalla/coolify/dokploy)     (A2 adapter — shared OCI path)
packages/deploy-cloudflare | deploy-vercel | deploy-aws             (A2 adapters — probe-gated)
```

```
netscript plugin install deploy
netscript deploy target add deno-deploy     # targets are explicit; several compose side by side
netscript deploy deno-deploy plan           # pure: capability verdict, nothing mutated
netscript deploy deno-deploy up             # ship
```

One goal frame governs every target — **"Deno native first, then Node compat where needed"** —
made operational as three declared tiers (Deno-native process / Web-standard isolate /
Node-compat), and one credibility mechanism makes the cloud story honest: every target ships a
**capability manifest** whose verdicts are compiled against the app's requirements at plan time —
build-time rejection with an explanation, never a runtime surprise, never a silent downgrade.
Provider-optimized scaffolds (Cloudflare-first seams, AWS suites, Vercel marketplace, the
container PaaS tier) then make provider-first real without ever forking application code.

## 1. Motivation

The prior unified-runtime seed (#824) ended in an adversarial verdict that killed its own
architecture: a Nitro-hosted "giant deploy package" was rejected as a god-object with a
dependency-cycle risk, unproven provider-family claims, and a board whose canonical bodies could
not survive the pivot. The owner ratified the redirect (2026-07-18): no giant package — use
NetScript at what it is best at, **composability**. A deploy **plugin** with a core and provider
adapters, modeled on the auth family, redefines the whole deploy story:

- the plugin contributes at **every layer** — CLI, scaffolding, streams/telemetry, doctor, and
  (when the frontend contribution axis lands) UI;
- per-cloud adapters make provider-first scaffolding possible (a Cloudflare-optimized project
  ships Workers/DO/KV-first seams from day one, same for AWS suites, Vercel);
- it "defeats" naive cloud-agnosticism while making the credible version real: strict
  NetScript-owned ports + honest per-target capability verdicts + explicit provider choices.

Doctrine had already reserved the seat: Archetype 7 models deploy as an A2 core + A6 router
composite, its F-DEPLOY gates are seeded awaiting the packages, and the shipped CLI kernel
already contains the target port, registry, and activation/secrets/rollback/health conventions
as target-agnostic modules (`DEPLOY-ARCHETYPE-7-CORE-SEED`). **This family is an extraction and
pluginization, not an invention.**

## 2. The ratified decision and its rationale

**Decision.** Deploy ships as the package family above, composed like auth: a provider-agnostic
core owning ports + registry + conventions + the capability compiler; thin per-provider adapters
wrapping each platform's first-class tooling; a thin plugin that wires, declares, contributes,
and re-exports. Laws carried forward from the prior run's surviving ground:

| # | Law |
| --- | --- |
| L-1 | Per target, a provider-native wrapper wins over any generic emitter iff it passes the same conformance suite, exposes every required native surface, and costs less to maintain. Nothing third-party enters the composition contract or leaf ports; whatever emits, emits behind a NetScript-owned port |
| L-2 | Leaf ports (`KvStore`, `MessageQueue`, saga/worker/trigger/stream ports) stay authoritative; provider primitives are capability-scoped backings — each a feasibility question, not a mapping exercise |
| L-3 | Capability manifest + build-time rejection: `unsupported` fails the plan with the note; `partial` warns and must be acknowledged; sagas are `supported \| externalized \| rejected` per target |
| L-4 | One logical composition root; no application-created loopback; app code never forks per provider |
| L-5 | Artifacts drive services through the shipped `ServiceShutdownCoordinator` lifecycle |
| L-6 | The Docker-image long tail (Fly, Koyeb, Sevalla, Coolify, Dokploy, CF Containers) is one shared container path with thin platform clients |
| L-7 | Probe before ownership claims: Cloudflare Workers, Vercel, and AWS adapters are gated on live conformance probes; AWS claims HTTP scope only until event-semantics probes pass |

**Wrap map (selective wrapping, owner point 4):** wrangler (invoked as a tool) + emitted
`wrangler.jsonc`; Vercel **Build Output API v3** (`.vercel/output` → `vercel deploy
--prebuilt`); the built-in **`deno deploy`** CLI (Deno-native flagship); Fly **Machines REST
API** + the four PaaS REST APIs over one owned OCI path; **AWS Lambda Web Adapter** (HTTP
sidecar — scope-limited honestly) + optional **Pulumi Automation API** for IaC; **Aspire-native**
for local/self-host/azure/k8s lanes (`aspire publish|deploy|destroy` — Aspire remains
composer/executor, never the contract). **Rejected:** Serverless Framework v4 (license-gated).
**Nitro:** no dependency — presets are welded to Nitro's build and its Deno preset is Node-built;
kept as a reference corpus with a named L-1-gated re-entry as an optional emitter package if a
target ever proves cheaper that way.

## 3. Public API design (with implementation detail)

### 3.1 The eight-operation target port (core)

The shipped kernel port moves to `plugin-deploy-core` and is sharpened — `plan` is **pure**,
`emit` materializes, `up --prebuilt` consumes:

```ts
type DeployOperation =
  | 'plan' | 'emit' | 'up' | 'down' | 'status' | 'logs' | 'rollback' | 'secrets';

interface DeployTargetPort {
  readonly key: DeployTargetKey;
  readonly operations: readonly DeployOperation[];   // declared subset — never advertise more
  readonly capabilities: DeployCapabilityManifest;   // backend-truthful (§3.2)
  plan(ctx): Promise<DeployPlanResult>;              // pure: topology + capability verdict,
                                                     // serializable DeploymentPlan
  emit(ctx): Promise<EmittedArtifactManifest>;       // content-addressed artifacts + provenance
  up(ctx): Promise<DeployUpResult>;                  // plain up = plan → emit → up;
                                                     // up --prebuilt <manifest> consumes a build
  down(ctx): Promise<DeployDownResult>;
  status(ctx): Promise<DeployStatusResult>;
  logs(ctx): Promise<DeployLogsResult>;
  rollback(ctx): Promise<DeployRollbackResult>;      // platform-native or convention-backed
  secrets(ctx): Promise<DeploySecretsResult>;        // references + rotation; values never serialized
}
```

- CI hand-off contract: `emit` writes `.deploy/<target>[@<env>]/` with
  `artifact-manifest.json` (artifact digest, source revision, target variant, emitter version);
  `up --prebuilt <path-to-manifest>` digest-verifies before pushing.
- Unsupported ops throw `DeployOperationUnsupportedError` (the auth
  `OperationUnsupportedError` pattern); the flagship `deno-deploy` target deliberately declares
  **no `emit`** (the platform builds from source) — the declared-subset mechanism on display.
- Environment grammar: `netscript deploy <target> <op> --env <name>` (registry key
  `<target>@<env>`; config `environments` overlay).
- Emission is a separate `ArtifactEmitterPort` (formats: `deno-binary`, `oci-image`,
  `wrangler-worker`, `vercel-build-output`, `aspire-publish`) so lifecycle consumers never
  depend on build machinery; `ContainerBuildPort` is the core-owned OCI specialization that
  `deploy-container` implements and composition roots **inject** into the cloudflare/aws lanes.

### 3.2 Capability contracts — honest agnosticism, structurally

```ts
interface CapabilityRef { namespace: string; name: string; major: number }  // 'runtime' | '@netscript/kv' | …
interface BindingRequirement { binding: string; capability: CapabilityRef }
interface WorkloadConstraint { kind: 'singleton' | 'long-running' | 'co-locate' | 'offline' }

interface CapabilityVerdict {
  level: 'lossless' | 'partial' | 'unsupported' | 'unverified';
  scope: 'runtime' | 'adapter' | 'binding';
  evidence?: string;   // conformance-suite cell / probe id — a lossless row without one is a bug
  note?: string;       // the honest caveat, rendered by the CLI
}

interface DeployCapabilityManifest {
  schemaVersion: number;
  target: DeployTargetKey;
  variant: string;                       // 'workers' | 'containers' | 'lambda' | 'fargate' | …
  tier: 'deno-native' | 'web-standard' | 'node-compat';
  process: 'long-lived' | 'bounded-window' | 'isolate';
  verdicts: ReadonlyMap<CapabilityRefKey, CapabilityVerdict>;
  sagas: 'supported' | 'externalized' | 'rejected';
  toolVersions?: Record<string, string>; probedAt?: string;
}
```

Core owns only these **structures** plus a small `runtime:*` trait vocabulary; leaf packages
contribute namespaced descriptors **through** them — core imports no leaf package, no provider
SDK. Manifests are per target **variant** (Workers ≠ Containers; Lambda ≠ Fargate). `lossless`
requires a live-platform conformance cell; unproven/not-installed/credential-missing states are
`unverified`-family diagnostics, never provider impossibility. Precedence when surfaces
disagree: live `doctor` > `plan` (recompiles from installed manifests) > `capabilities`
(rendered data). `compileCapabilityVerdict` is the build-time rejection compiler (L-3).

### 3.3 Topology cells — never silently partitioned

```ts
interface DeploymentCell {
  id: string; selectors: readonly string[];          // 'service:<name>' | 'app:<name>' | 'background:<kind>'
  target: DeployTargetKey; variant: string; bindings: readonly string[];
}
interface DeploymentTopologyPlan { cells: DeploymentCell[]; transports: CrossCellTransport[] }
```

Cells are **user-declared** in `deploy/targets.ts`. When an app exceeds a variant's profile
(sagas on an isolate, CAS on Workers KV), `plan` **rejects** and writes machine-readable
`suggested-cells.json`; `deploy cells apply` materializes it into the user-owned file with the
diff shown. Every service/consumer/schedule has exactly one owning cell; cross-cell transport is
explicit.

### 3.4 The plugin, its manifest triad, and three host extensions

Three surfaces are named and homed: **target declarations** (`deploy/targets.ts`, user-owned),
**target settings** (`netscript.config.ts` → `deploy.targets.<key>`), and **descriptors**
(generated registry module, regenerated by `target add/remove`):

```ts
interface DeployTargetContribution {
  key: string;
  targetLoader: SafePackageExport;   // e.g. { pkg: '@netscript/deploy-deno', export: './target' }
  schemaLoader: SafePackageExport;   // the target's config member schema
  permissions: DeployPermissionProfile;  // exact per-target tool/net/fs profile
}
```

The plugin depends **only on core** and composes resolved descriptors — adapters are peer
install choices (`deploy target add <key>`), never static imports. New verbs:
`target add|remove`, `capabilities [<target>] [--json|--preview]` (a bundled published-manifest
preview catalog serves check-then-decide before install), `cells apply`, `doctor` (states:
`unsupported | unverified | adapter-not-installed | credential-unavailable`; reports per-target
permission profiles and orphaned declarations). No resident HTTP service in v1; the plugin also
contributes a `deploy-events` durable stream (versioned audit envelope), telemetry spans with
secret redaction, and a tiny `deploy` runtime-config topic.

Host (`@netscript/plugin` + CLI) gains three **generic** extensions: (1) CLI **mount-children**
contributions (`{mount, id, loader, export}`) + async bootstrap — the built-in `deploy` shell
stays host-owned (reserved mount, `desktop`, help, install hint) and contributions can never
shadow a top-level command; duplicate `(mount,id)` fails before parsing; (2) **doctor checks as
data** (`{id, loader}` registry — replacing the hard-coded literal union); (3) an
installer-protocol `officialSource` variant `{ sourceKind: 'tooling' }` +
`capabilities.contributionAxes` — no deploy-specific field enters the generic protocol.

### 3.5 Config: two-phase loader

Adapter-owned target schemas require a real bootstrap contract: (1) bootstrap-parse project
identity + `plugins` + `deploy.targets` unstripped → (2) resolve plugin/adapter `schemaLoader`s
→ (3) compose the target schema registry → (4) full parse. An unknown target key becomes
`DeployTargetAdapterMissingError` — the **one deliberate behavior change** (today unknown keys
are silently stripped). `@netscript/config` keeps the loader seam + a frozen delegating legacy
union for the window. The bare-metal lane unifies as one target `baremetal` with
`windows | linux` **variants**; legacy config keys map in unchanged.

## 4. What ships when (plan)

| Wave | Content | Exit proof |
| --- | --- | --- |
| **W1** | Core extraction as ordered refactor-then-extract sub-slices: contracts behind compat re-exports; pure conventions with constants; **empty** duplicate-rejecting registry (defaults externalized to the CLI composition root); host-owned `deploy` shell split preserving `desktop`; capability+topology contracts + compiler; two-phase config loader. F-DEPLOY-1/2 flip `reviewed→gated` | `e2e:cli` green after every sub-slice |
| **W2** | `deploy-aspire`, `deploy-baremetal` (receives the build pipeline + the legacy-verb compat handlers), `deploy-deno` extracted; adapter-side config members; compatibility gate (state-transition + help goldens + unknown-target paths) | per-package A2 gates; manifests published |
| **W3** | Host extensions (3 slices) → `plugins/deploy` (manifest triad, descriptor composition, doctor, verify-plugin) → plugin CLI children → scaffolder + Story-0 `scaffold.runtime` E2E → streams/telemetry | `plugin install deploy` → `target add deno-deploy` → `plan` on a generated workspace |
| **W4** | `deploy-container` (OCI build/push + Dockerfile emission) + thin PaaS clients + container scaffold story | live smoke ≥1 managed + ≥1 self-hosted platform |
| **W5** | Probe-gated clouds: CF-PROBE → `deploy-cloudflare` (workers variant) + story; Vercel probe → `deploy-vercel` + story; AWS-PROBE-HTTP → `deploy-aws` (lambda variant, HTTP scope) + story | each adapter ships only behind its passing probe (L-7) |

Milestone proposal (owner fork OF-6): W1–W3 → `0.0.1-beta.13`, W4–W5 → beta.14/stable; the epic
supersedes #824 and re-scopes #823's deploy half. Legacy flat verbs
(`build/install/start/stop/copy/upgrade/package-cli/uninstall`) stay **first-class compat
handlers** with their exact shipped semantics through the next semver-major (their semantics are
not `up`/`down`-equivalent); only `build → plan+emit`, `status`, `logs` alias — pinned to the
`baremetal` target.

## 5. Proposed board (placeholders — filed only after owner ratification)

One umbrella epic (`type:umbrella`, `epic:deploy-plugin`) + **29 children `DPB-1…DPB-29`**, in
the enterprise-auth body template (`Part of #EPIC` → scoping paragraph with anti-scope boundary
→ `- [ ] gate:` acceptance predicates → `Dependencies:` + `Delivery shape:`) with its defects
fixed (single id scheme, every child milestoned, GitHub-native sub-issues). Summary of the DAG:

- **W1 (6):** DPB-1 contracts move (p0) · DPB-2 conventions · DPB-3 empty registry + compat
  composition root (p0) · DPB-4 shell split + router rewire · DPB-5 capability+topology
  contracts + compiler + conformance harness (p0) · DPB-6 two-phase config loader (p0)
- **W2 (5):** DPB-7 baremetal · DPB-8 aspire · DPB-9 deno · DPB-10 config members · DPB-11
  compatibility gate
- **Host (3):** DPB-12 mount-children contract · DPB-13 async bootstrap + collisions · DPB-14
  doctor-as-data + tooling protocol variant
- **W3 (5):** DPB-15 plugin · DPB-16 CLI children (grammar, `cells apply`, `target remove`,
  preview catalog) · DPB-17 scaffolder · DPB-18 Story-0 E2E · DPB-19 streams/telemetry
- **W4 (3):** DPB-20 OCI core · DPB-21 PaaS client tranche · DPB-22 container story
- **W5 (5):** DPB-23 CF-PROBE · DPB-24 deploy-cloudflare + Story 1 · DPB-25 Vercel probe +
  adapter + Story 4 · DPB-26 AWS-PROBE-HTTP · DPB-27 deploy-aws + Story 2
- **Rolling/backlog (2):** DPB-28 docs (target-matrix reference + per-target how-tos replace the
  alpha-minimal page) · DPB-29 deferred RFC: AWS event semantics + leaf backing catalog
  graduation (p2)

Full table with per-child dependencies: `plan.md` §5 (this PR). Issue numbers are assigned at
the supervisor-coordinated filing step — **not by this PR**.

## 6. Migration and supersession map

**Migration (behavior-preserving; full item map M-1…M-18 in `DP-6`):** the shipped 8-op port,
registry, conventions, and compile pipeline are extractions from `packages/cli`; config keys and
every documented verb survive; Aspire lanes change owner, not behavior; scaffolded workflows
keep functioning; desktop packaging stays outside this family (epic #830 boundary). Debt
retired: `DEPLOY-ARCHETYPE-7-CORE-SEED` (conditional on the externalized composition root),
`DEPLOY-SECRETS-ROLLBACK-CORE`, `DEPLOY-BAREMETAL-PUBLIC-WIRING`, the deploy slice of
`config-plugin-specific-schema-debt`, the container half of `cli-deploy-artifacts-missing`
(NetScript finally emits a Dockerfile — as adapter output), `cli-deploy-linux-integration-untested`
(as a live-probe cell).

**Supersession proposals (owner arbitration at filing; no closes by this PR):**

| Issue | Proposal |
| --- | --- |
| #824 unified-runtime seed | **Superseded by this RFC** — close at filing with a successor pointer to the deploy-plugin epic |
| #823 Unified epic | Re-scope: its deploy half is owned by this family; its single-runtime product framing is re-stated against the plugin architecture (owner decision at filing) |
| #451 SDK transport surface | Orthogonal to deploy — KEEP; re-homing decision stays with #823's re-scope |
| #453 desktop realization | KEEP — consumed by epic #830 (desktop graph), not this family |
| #454 single-process realization | Deploy aspect absorbed by the topology/cell + capability model (§3.3); close-or-fold proposal at filing with pointer |
| #455 offline-sync | KEEP — leaf/database capability (`offline` workload constraint names the seam); not deploy's to close |
| #327 Deployment epic | Body updated at filing to point at the new family as its architecture |

## 7. Security & operational posture (summary)

Secrets are references end-to-end — values never in plans, artifact manifests, telemetry, stream
events, argv, or errors (negatively tested). Per-target least-privilege permission profiles,
reported exactly by doctor; no aggregate all-provider permission claim. CI auth OIDC-first where
platforms support it (AWS role-assume, Deno Deploy org tokens), token-based where not
(Cloudflare — documented). Health-gated activation with retain/rollback conventions; audit
stream whose sink can never fail a deploy.

## 8. Open forks for owner arbitration

| Fork | Question | Recommendation | Alternative |
| --- | --- | --- | --- |
| OF-1 | Core package name | `@netscript/plugin-deploy-core` (auth parity) | `@netscript/deploy-core` (kickoff literal) |
| OF-2 | Thin PaaS packaging | Subpaths of `deploy-container`; graduate on SDK/auth/lifecycle divergence | One package per platform now |
| OF-3 | CLI delivery | Host-owned reserved `deploy` shell; plugin contributes children (never shadows) | Fully plugin-owned group (rejected by adversarial SF-4) |
| OF-4 | v1 service surface | None — CLI + manifest is the machine surface; service seam deferred rework-safe | Ship a deploy HTTP service + contracts/v1 now |
| OF-5 | Legacy verbs | First-class compat handlers until next semver-major; only build/status/logs alias | Two-minor-release alias-and-remove (rejected by SF-9) |
| OF-6 | Board/milestone relation | New `epic:deploy-plugin` supersedes #824, re-scopes #823's deploy half; W1–W3 → beta.13, W4–W5 → beta.14/stable | Fold under #823 as-is; or single milestone |
| OF-7 | Nitro | No dependency; reference corpus + L-1-gated re-entry as optional emitter | Commission a `deploy-nitro` emitter in the first waves |
| OF-8 | AWS first-wave scope | HTTP-only until AWS-PROBE-EVENTS passes | Commit the full event surface in W5 |

Open decisions deferred rework-safe: cloud-run re-home timing (W4); `init --deploy <provider>`
sugar (no story depends on it); deploy dashboard service; secrets rotation overlap-window card.

---

<sub>**Provenance.** This PR lands the full planning record under
`.llm/runs/plan-deploy-plugin--seed/`: six-surface research corpus (`research/`), canonical
design docs `DP-0…DP-8` (r3), `plan.md` (locked decisions LD-1…12, the 29-child board table,
risk register, gates), the Sol adversarial trail (`adversarial-brief.md`, `adversarial-sol.md`,
`adversarial-sol-triage.md` — 16/16 accepted), and the Kimi doc-story trail
(`kimi-doc-story-brief.md`, `doc-story-kimi.md` — docs IA + four forecast pages,
`doc-story-kimi-triage.md` — 13/13 accepted; where a forecast page predates a correction, the
corpus is authority). Board numbers here are placeholders — filing is a later
supervisor-coordinated step. Refs #820 #327 #823 #824 #825 — no closing keywords.</sub>
