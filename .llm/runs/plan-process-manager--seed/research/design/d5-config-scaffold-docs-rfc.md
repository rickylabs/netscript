# D5 — Config Contract + Scaffold + Docs + RFC Skeleton

Stage-D design pack (Tier B, Opus 4.8, drafts only) for `plan-process-manager--seed`. Scope per
`research.md` §C6 D5 row: the typed dependency-ordered process-graph schema (S9), the
`deployTargetBaseShape` extension, the `--no-aspire` resolvers, the pm plugin's own
`scaffold.plugin.json` + `plugin add` UX, the docs plan (S13), and the run's **headline deliverable**
— the RFC epic skeleton + the ISSUE-DRAFT template every pack's slices normalize into at Stage E.

Nothing here is filed. All GitHub artifacts are drafts pending owner ratification at Stage H. Every
non-obvious claim is cited: `file:line` against the worktree
`C:/Dev/repos/netscript-framework/.llm/tmp/wt-process-manager`, a corpus doc §, or a URL.

Binding inputs re-read for this pack: charter.md; research.md §C1–C7 (S9/S13 binding, S12
anti-features, C7 scope guards, OF-1..7); r4 §2/§5c; r2 §2; r3 §1/§4; m1 §1.1.

---

## 0. Design invariants this pack inherits (do not re-litigate)

- **Hybrid architecture (C1):** the supervision engine is a **library** used foreground-attached in
  dev; in production the OS supervisor (systemd/Servy) stays supervisor-of-record and the pm's
  resident piece is a control-plane service, never a parent of the workload. The config contract must
  therefore describe **both** a dev-foreground graph and a compile-to-OS-units graph from one source.
- **Zero new contribution axes (S2):** the plugin composes `.withBackgroundProcessor` (dev engine),
  `.withService` (control plane), `.withTelemetry`, `.withRuntimeConfigTopic`. The config contract is
  not a new axis; it is a schema the core owns.
- **Contract-first (Operating Rule 2):** schema/type contract → implementation → tests. This pack
  produces the contract sketch; D1 owns the engine that consumes it.
- **Concrete argv, never `deno task` indirection (S6):** every process resolves to an
  executable+args tuple; pup's own unfixed descendant-kill bug (Hexagon/pup#33, m4 §3) is the
  cautionary citation.
- **Extend, never re-declare (S9):** the deploy-facing config **spreads `deployTargetBaseShape`**
  (`packages/config/src/domain/schemas/deploy-schema.ts:21-150`) exactly as every shipped target
  member schema does (`WindowsDeployTargetSchema` at :163-173, `LinuxDeployTargetSchema` at
  :204-220). It reuses `WorkerTaskPermissions` vocabulary
  (`packages/plugin-workers-core/src/executor/executor-types.ts:33-41`) and treats
  `ResolvedBackgroundProcessorConfig` (`packages/cli/src/kernel/domain/resolved-config.ts:79-94`) +
  `CompileTarget` (`packages/cli/src/kernel/domain/deploy/compile-target.ts`) as **input sources**,
  not schemas to duplicate.

---

## 1. The process-graph schema (S9)

### 1.1 Where it lives

New contract module in the fat core, versioned `v1`, following the `plugin-workers-core` /
`plugin-dashboard-core` convention and the "contracts in `-core`, extend the base contract in
`@netscript/plugin`" seam (MEMORY: plugin-contract/service base seam):

```
packages/plugin-process-manager-core/src/contracts/v1/
  process-graph.ts        # the ProcessGraph + ProcessSpec Standard-Schema contract (this pack)
  restart-policy.ts       # RestartPolicy sub-schema (S7; D1 owns the state machine)
  start-policy.ts         # StartPolicy sub-schema (S8)
  process-registry.ts     # runtime registry record shape (PID/status/restartCount) — D1/D3 detail
```

Authoring toolchain: **Zod** authored, exported as a **Standard Schema** value (the repo convention —
`deploy-schema.ts` is Zod authored and every plugin config is Zod today; S9 says "typed
Standard-Schema process-graph contract"). This is a deliberate exceed-pup call: pup hand-maintains a
`docs/pup.schema.json` JSON-Schema file and even pulls `zod-to-json-schema` to derive it (m1 §1.1,
§2.5) — NetScript derives JSON Schema (for editor autocomplete on the manifest file) from the Zod
source instead of hand-maintaining it.

### 1.2 The two-layer split (dev graph vs deploy-facing extension)

The single most important structural decision this pack makes: **the process-graph schema is layered,
not monolithic.** A base `ProcessGraphShape` describes *what to supervise* (portable across dev and
prod). A separate deploy-facing target schema **spreads `deployTargetBaseShape` AND embeds/references
the process graph** — it adds only OS-supervision knobs, never re-declaring `mode`/`activation`/
`secrets`/`otel`/`logging`/`health` which the base shape already owns
(`deploy-schema.ts:79-149`).

This mirrors exactly how the shipped lane layers: `deployTargetBaseShape` is the portable core,
`LinuxDeployTargetSchema` spreads it and adds only systemd-specific fields (`systemctlPath`,
`unitPrefix`, `user`, `group`, `runtimeDir` — `deploy-schema.ts:207-219`).

### 1.3 `ProcessSpec` — full typed field sketch (per-process)

Fields below are the design floor: pup's `processes[]` per-process surface (m1 §1.1) as the parity
baseline, pm2's richer restart surface as the ceiling (m2 §4 / S7), reusing existing NetScript
vocabulary wherever it exists. `?` marks optional.

```ts
// packages/plugin-process-manager-core/src/contracts/v1/process-graph.ts (SKETCH)

const ProcessSpecShape = {
  // ── Identity ──────────────────────────────────────────────────────────────
  id: z.string().regex(/^[a-z0-9@._\-]+$/).min(1).max(64),   // pup's exact id pattern, m1 §1.1
  displayName: z.string().optional(),

  // ── Concrete command (S6 — executable+args tuple, NEVER a `deno task` string) ─
  command: z.object({
    exec: z.string(),                 // resolved absolute/relative executable ("deno", "/opt/app/svc")
    args: z.array(z.string()).default([]),
    // resolver provenance (see §2/§3): how this argv was derived, for `pm explain`
    source: z.enum(['manifest', 'scaffold-plugin', 'workspace-task', 'aspire-resource']).optional(),
  }),
  cwd: z.string().optional(),
  env: z.record(z.string(), z.string()).optional(),   // PATH appended, others override — pup semantics
  pidFile: z.string().optional(),

  // ── Permissions (reuse WorkerTaskPermissions vocabulary — r3 §1) ────────────
  // net/read/write/env/run/ffi/import as boolean-or-string-array, matching
  // WorkerTaskPermissions (executor-types.ts:33-41). NOT re-invented.
  permissions: WorkerTaskPermissionsSchema.optional(),

  // ── Start policy (S8 — COMPOSABLE, not pup's pick-one) ──────────────────────
  start: z.object({
    autostart: z.boolean().default(true),
    cron: z.string().optional(),          // cron expr; composes with workers scheduler if D1 verifies fit
    watch: z.object({                     // file-triggered (Deno.watchFs), pup's Watcher shape (m1 §2.4)
      paths: z.array(z.string()),
      exts: z.array(z.string()).optional(),
      debounceMs: z.number().int().optional(),
      skip: z.array(z.string()).optional(),
    }).optional(),
  }).optional(),   // composable: autostart AND watch is legal, unlike pup (m1 §1.2)

  // ── Restart policy (S7 — pm2 floor, `block`/`unblock` kept verbatim m1 §1.6) ─
  restart: z.object({
    mode: z.enum(['always', 'on-failure', 'never']).default('on-failure'),
    backoff: z.object({
      initialMs: z.number().int().default(1000),
      maxMs: z.number().int().default(30000),
      factor: z.number().default(2),               // exp-backoff with cap (pm2 algorithm, m2 §4)
      resetAfterStableMs: z.number().int().default(10000), // stable-uptime resets the curve
    }).optional(),
    window: z.object({                              // windowed budget: N restarts per M ms
      maxRestarts: z.number().int(),
      perMs: z.number().int(),
    }).optional(),
    skipExitCodes: z.array(z.number().int()).optional(),  // pm2 stop_exit_codes
    memoryLimitMb: z.number().int().optional(),           // restart on RSS threshold (documented poll latency, S11)
    blocked: z.boolean().default(false),            // pup block/unblock: pause auto-heal w/o stopping (m1 §1.6)
  }).optional(),

  // ── Health (URL probe / heartbeat; reuses base-shape healthGate shape) ──────
  health: z.object({
    kind: z.enum(['http', 'heartbeat', 'none']).default('none'),
    url: z.string().optional(),           // http probe — Servy healthCheckUrl analog (r3 §6)
    intervalSeconds: z.number().int().optional(),
    maxFailedChecks: z.number().int().optional(),
    // heartbeat is the Windows ceiling (no watchdog socket, S11); http is cross-platform
  }).optional(),

  // ── Resources (Linux-enforced via cgroups; Windows documented-asymmetry S11) ─
  resources: z.object({
    cpu: z.string().optional(),     // e.g. "200%" → systemd CPUQuota; NO Windows cgroup equiv (S11)
    memoryMax: z.string().optional(),   // → systemd MemoryMax; Windows = documented no-op + heartbeat memoryLimitMb
  }).optional(),

  // ── Dependencies (dependency-ordered graph — process-compose/s6-rc, m4 §7.2) ─
  dependsOn: z.array(z.object({
    id: z.string(),
    condition: z.enum(['started', 'healthy', 'completed']).default('started'),
  })).optional(),

  // ── Instances (PLACEHOLDER — clustering deferred per OF-5) ───────────────────
  instances: z.number().int().min(1).max(1).default(1).optional(),
  // v1 accepts only 1. >1 is a validation error in milestone 1 with a message pointing at the
  // later-milestone clustering design (OF-5). Reserving the field now keeps the schema forward-
  // compatible without shipping a fake cluster mode (S12 anti-feature).

  // ── Logging (per-process override of the graph-level logging block) ─────────
  logging: z.object({
    rotationSizeMb: z.number().optional(),
    maxRotations: z.number().int().optional(),
    dateRotation: z.enum(['Daily', 'Weekly', 'Monthly']).optional(),
  }).optional(),   // same shape as deployTargetBaseShape.logging (deploy-schema.ts:79-88)
} as const;
```

`ProcessGraphShape` (the top level, dev-portable):

```ts
const ProcessGraphShape = {
  name: z.string().regex(/^[a-z0-9@._\-]+$/).max(64),   // instance id (pup `name`, m1 §1.1)
  processes: z.array(z.object(ProcessSpecShape)).min(1),
  // graph-level defaults (per-process overrides win)
  logging: /* base logging block, reused from deploy-schema shape */,
  control: z.object({                    // control-plane bind (D2 owns transport detail)
    hostname: z.string().default('127.0.0.1'),
    port: z.number().int().optional(),
    // token auth per pup's model (S4) — token store detail is D2's
  }).optional(),
};
```

### 1.4 The deploy-facing extension (`deploy.targets['process-manager']`)

Registered as a **new** target key `process-manager` in `deploy.targets` (OF-4 recommendation (b) is
*not* chosen for the dead keys; here we add a new key rather than superseding — see §8 RFC + D3 for
the OF-3/OF-4 interplay). It spreads `deployTargetBaseShape` and references the process graph:

```ts
// composed into DeployConfigSchema.targets alongside windows/linux/... (deploy-schema.ts:288-316)
export const ProcessManagerDeployTargetSchema = z.object({
  ...deployTargetBaseShape,          // mode/activation/secrets/otel/logging/health — NEVER re-declared
  // process-manager-specific only:
  graph: z.string().optional(),      // path to the process-graph manifest (default: pm.config.ts)
  controlPlane: z.object({           // the resident control-plane service's own OS-service knobs
    install: z.boolean().default(true),   // register the control plane via OsServicePort
    unitPrefix: z.string().optional(),
  }).optional(),
  supervisor: z.enum(['systemd', 'servy', 'auto']).default('auto'),  // which OsServicePort adapter
});
```

This is the literal S9 requirement satisfied: "deploy-facing config **extends `deployTargetBaseShape`**
(never re-declares mode/activation/secrets/otel); reuses `WorkerTaskPermissions` vocabulary and the
`ResolvedBackgroundProcessorConfig`/`CompileTarget` resolution path as input sources"
(research.md:98). The per-process `activation`/`secrets`/`otel` semantics are the base shape's; the pm
target adds only the graph pointer + control-plane placement.

**Naming note (per S11 asymmetry):** the schema is one contract; per-field JSDoc must state the
Windows/Linux asymmetry inline (`resources.cpu`/`memoryMax` = Linux cgroups only; `health.kind:
'heartbeat'` = the Windows ceiling). This is the "designed-for asymmetry, stated in docs, never
implied parity" posture (S11).

---

## 2. AspireResource[] as an input source (r1's strongest reuse finding)

The Aspire package emits `AspireNSPluginContribution` registrations that the generated AppHost
consumes (r3 §2, `packages/aspire/src/runtime/aspire-ns-plugin-contribution.base.ts`). What plugins
return from `contribute()` is a typed resource list — **the pm consumes that same list as one graph
source**, so when Aspire *is* present the process graph derives for free rather than being
hand-authored.

- Each contributed resource carries the facts a `ProcessSpec` needs: name, entrypoint, port,
  permissions, dependency edges. A `resolveFromAspireResources(resources: AspireResource[])` adapter
  maps each to a `ProcessSpec` with `command.source: 'aspire-resource'`.
- **The `command` `AspireResourceKind` edge (from the D4 / dev-dashboard pack):** the dashboard
  proposal locks a `command` kind addition to `AspireResourceKind` + `addCommand`/`withCommand`
  passthrough (r4 §4.2, dashboard proposal.md:196-204) precisely so "UI action = CLI verb = MCP tool"
  is one seam. The pm's `start/stop/restart` lifecycle actions are the textbook case (r4 §4.2). D5's
  schema records this as a **shared framework dependency edge** (dev-dashboard → Aspire `command`
  kind → process-manager), *not* pm-owned work — the pm registers its lifecycle actions through that
  kind when it lands, rather than building a parallel Aspire-contribution mechanism.
- Precedence: **an explicit pm manifest, when present, is authoritative** and Aspire resources are
  merged in only for processes not already declared (a resource whose `name` matches a manifest
  `id` is skipped — the manifest wins). This keeps the manifest the single source of truth in
  production while letting dev "just work" off Aspire.

Design boundary (from C5): AspireResource[] is **an input to the process graph, not the registry
itself** (research.md:148). The live process registry (PID/status/restart-count) is D1/D3's KV-backed
store (S3), separate from these config-time resolvers.

---

## 3. `--no-aspire` resolvers (the headline scaffold problem)

In `--no-aspire` scaffolds **there is no `appsettings.json` at all** — `plan-init.ts:196` guards the
entire `generateAppsettings(...)` behind `if (!options.noAspire)` (r4 §2.1, r3 §2). So the declarative
process-graph that the Aspire path derives from `appsettings.json`
(`BackgroundProcessors.<name>` → `ResolvedBackgroundProcessorConfig`, r3 §4) simply does not exist.
The pm must **synthesize** the graph. Two ordered resolvers, precedence high→low:

### 3.1 Resolver precedence

1. **Explicit pm manifest** (`pm.config.ts` exporting a `ProcessGraph`, or
   `deploy.targets['process-manager'].graph`). If present, authoritative — resolvers below only fill
   gaps for processes the manifest does not name.
2. **`appsettings.json` when it exists** (Aspire scaffold) — reuse the existing
   `ResolvedBackgroundProcessorConfig` resolution path (`resolved-config.ts:79-94`, resolved by
   `deploy-config-background.ts:91-121`) as an input source. Not re-parsed; consumed.
3. **`scaffold.plugin.json` `officialSource` blocks** (the `--no-aspire` primary source, r4 §2.3).
4. **Workspace `deno.json` task graph** (the app members' own `dev`/`start` tasks).

### 3.2 Resolver over `scaffold.plugin.json` `officialSource`

Every first-party plugin ships an `officialSource` block with exactly the supervisor-relevant facts
(r4 §2.3). Concrete field map, citing the streams example
(`plugins/streams/scaffold.plugin.json:49-66`) and the workers example
(`plugins/workers/scaffold.plugin.json:49-70`):

| `officialSource` field | Source line (streams / workers) | → `ProcessSpec` field |
| --- | --- | --- |
| `serviceEntrypoint` | streams :52 `services/src/main.ts` | `command.exec = deno`, `command.args = [run, <perm flags>, <entrypoint>]` |
| `servicePort` / `backgroundPort` | streams :53-54 (`4437`); workers :56-57 (`8091`) | `env.PORT` + `health.url = http://127.0.0.1:<port>/health` |
| `requiresDb` / `requiresKv` | streams :55-56 (`false`); workers :58-59 (`true`) | gates `--unstable-kv` flag + `dependsOn` a db/kv process |
| `permissions` | streams :57-65; workers :60-68 | `permissions` (mapped from `--allow-*` flags to `WorkerTaskPermissions`) |
| `dependencies` / `pluginReferences` | workers :58 `["streams"]` | `dependsOn: [{id: 'streams', condition: 'healthy'}]` — the dependency-ordered edge (S9, m4 §7.2) |
| provider `backgroundEntrypoint` | workers :54 `workers/runtime.ts` | a **second** `ProcessSpec` for the background processor (workers ships both a service and a bg processor) |
| provider `concurrencyEnvVar` / `defaultConcurrency` | workers :43-44 (`WORKER_CONCURRENCY`,`2`) | `env[concurrencyEnvVar]` = self-fan-out (NOT `instances` — OF-5: ship existing self-fan-out, defer OS-supervised N-instance) |

The `dependencies: ["streams"]` edge on workers (`plugins/workers/scaffold.plugin.json:58`) is the
concrete proof the dependency-ordered graph resolves from existing metadata — it directly yields the
`streams → workers` start order the deploy docs already assert manually
(`docs/site/how-to/deploy.md:340-369`, "honoring the `PluginReferences` start order streams → workers
→ sagas/triggers").

### 3.3 Resolver over the workspace `deno.json` task graph

For app members (the Fresh app itself), there is no `scaffold.plugin.json`. The resolver reads the
workspace root `deno.json` members and each member's `dev`/`start` task, producing a `ProcessSpec`
with `command.source: 'workspace-task'` — but **resolving the task to concrete argv (S6)**, not
emitting a `deno task <name>` indirection. This is the one place the resolver must expand a task
definition into its underlying `deno run ...` invocation so the engine can track/kill the descendant
tree (S6, m4 §3).

### 3.4 Output

All resolvers converge on one in-memory `ProcessGraph` (§1.3). `netscript pm explain` (a CLI verb,
D4) prints the resolved graph with each process's `command.source` provenance so the derivation is
inspectable — the honest answer to "what will you supervise and why."

---

## 4. The pm plugin's own `scaffold.plugin.json` + `plugin add` UX

### 4.1 Manifest shape

Modeled on `plugins/workers/scaffold.plugin.json` (the closest archetype analog — the pm owns a
background processor, r4 §4.1 / r3 verdict). Draft:

```jsonc
{
  "schemaVersion": 1,
  "name": "@netscript/plugin-process-manager",
  "version": "<cut>",                     // milestone-dependent, Stage E
  "displayName": "Process Manager",
  "description": "Bare-metal process supervisor + admin console for NetScript apps.",
  "peerDependencies": { "@netscript/plugin": "<cut>" },
  "capabilities": {
    "hasDatabaseMigrations": false,       // registry is KV-backed (S3), not a DB schema
    "hasRoutes": true,                    // the control-plane oRPC service (D2)
    "hasBackgroundWorkers": true          // the dev-mode supervision engine
  },
  "scaffolder": {
    "export": "./scaffold",
    "requiredPermissions": { "net": [], "read": ["<workspaceRoot>"], "write": ["<workspaceRoot>"] }
  },
  "provider": {
    "kind": "process-manager",
    "displayName": "Process Manager",
    "category": "background-processor",   // matches workers (:26); the pm IS a bg processor
    "portRangeKey": "INFRA_PLUGIN",
    "defaultPermissions": ["--unstable-kv","--allow-net","--allow-env","--allow-read","--allow-write","--allow-run"],
    "defaultServiceEntrypoint": "services/src/main.ts",   // the control-plane oRPC service
    "defaultEntrypoint": "supervisor/runtime.ts",         // the dev-mode engine
    "defaultRequiresKv": true,            // registry (S3)
    "defaultRequiresDb": false,
    "pluginType": "background-processor",
    "supportsConcurrency": false,         // OF-5: no fake cluster mode in v1
    "defaultTelemetry": true,
    "infrastructureRequires": ["kv"]
  },
  "officialSource": {
    "canonicalName": "process-manager",
    "pluginDir": "process-manager",
    "serviceEntrypoint": "services/src/main.ts",
    "backgroundEntrypoint": "supervisor/runtime.ts",
    "serviceConfigKey": "process-manager",
    "requiresKv": true,
    "requiresDb": false,
    "permissions": ["--unstable-kv","--allow-net","--allow-env","--allow-read","--allow-write","--allow-run"]
  }
}
```

`--allow-run` is load-bearing and unique-among-siblings here: the pm spawns child processes (the
supervised workload), which streams/most plugins do not. Workers carries it (`:34`) for the same
reason.

### 4.2 `netscript plugin add process-manager` UX (typesafe glue only — repo law)

Per the USER MANDATE (#157, MEMORY: scaffold-surface-typesafe-codegen): `plugin add` emits **only
typesafe userland glue** (factory/AST), never string templates or file copies. So adding the pm
plugin scaffolds into userland:

1. A typed **`pm.config.ts`** in the workspace root exporting a `ProcessGraph` via a
   `defineProcessGraph(...)` factory (typesafe, autocompleted from the `v1` contract) — pre-seeded by
   running the §3 resolvers **once** at scaffold time so the user sees their actual resolved graph as
   editable starting config, not an empty stub.
2. A workspace **`deno.json` task** wiring (`pm:dev`, `pm:status`) — glue, not copies.
3. Registry entry in the generated `plugins.gen.ts` (the standard plugin-registry codegen).
4. **No** copied supervisor source — the engine lives in `@netscript/plugin-process-manager-core`,
   imported, never vendored (prod/JSR `plugin add` correctness, MEMORY: cli-plugin-copy-two-path).

This is the answer to "what gets scaffolded into userland": a typed config the user owns + task glue,
backed by an imported core. The `plugin new` greenfield-first mandate (MEMORY:
plugin-rearchitecture-v2) applies — the pm is a good candidate to build greenfield-first then conform.

---

## 5. Docs plan (S13)

Ranked per r4 §5c. Every page below is either new content or a same-wave staleness fix; the binding
rule (S13, r4 §1.3/§6) is that the stale `cli-reference.md` Linux "planning-only" claim is fixed in
**the same wave** the pm docs land, never compounded.

| # | Page | Action | One-line scope |
| --- | --- | --- | --- |
| 1 | `docs/site/how-to/deploy.md` | **Rewrite** Step 4 "Drop Aspire" (`:239-242`) + Step 6 "Run a process by hand" (`:340-369`) | Replace the "bring-your-own-supervisor / manual `deno run` per resource" story with "install process-manager and let it supervise the graph"; **name the supervision gap it closes** (today = zero automation beyond `deno task --cwd <m> dev` by hand, r4 §1.1). |
| 2 | `docs/site/cli-reference.md` | **Staleness fix + new section** (`:294-348`) | Fix the false "Linux bare-metal planning-only / only Windows+deno-deploy run" claim (stale vs shipped `SystemdOsServiceAdapter`, r4 §1.3); add the `netscript pm <verb>` surface (OF-1(a)) alongside the corrected systemd/Servy `OsServicePort` commands. |
| 3 | `docs/site/capabilities/process-manager.md` | **New** (parallel to `capabilities/{background-jobs,streams,durable-sagas}.md`) | The capability chapter: config contract, start/restart/health policies, dev vs prod modes, backends, gotchas (Windows asymmetry S11). |
| 4 | `docs/site/reference/process-manager/` | **New dir** (parallel to `reference/{workers,sagas,streams}/`) | Generated CLI/API reference for the plugin's public surface once it ships. |
| 5 | `docs/site/explanation/aspire.md` | **Cross-ref paragraph** | One-paragraph disambiguation: "process-manager = bare-metal process supervisor, distinct from Aspire (dev orchestrator) and `OsServicePort` (host-service registration)" — the equivalent of the E-desktop proposal's own crisp scope statement (r4 §5c item 5). |
| 6 | `docs/site/how-to/supervise-bare-metal-processes.md` | **New how-to** | Task-recipe: declare a graph, run `pm dev` in dev, compile to OS units + install the control plane in prod, tail aggregate logs, block/unblock auto-heal. Stage E decides new-page vs folding into #1 (r4 §5c item 7). |
| 7 | `docs/site/how-to/deploy-local-aspire.md` | **Light cross-link** (`:38-44`) | Repoint the `--no-aspire` hand-off sentence at the new supervise-bare-metal how-to instead of only `deploy.md`'s manual instructions. |

Docs authoring lane per CLAUDE.md: docs-only slices MAY use a Claude workflow (Opus, never Fable),
validated separately by OpenHands — but that is a Stage-E/impl routing decision, not this pack's.

---

## 6. Residual open questions for Stage E

1. **Standard Schema authoring:** Zod-authored-exported-as-Standard-Schema (repo convention) vs a
   native Standard-Schema author. S9 says "Standard-Schema"; every shipped config is Zod. Recommend
   Zod-authored; confirm no publish-surface objection (jsr-audit).
2. **New target key `process-manager` vs superseding dead `linux-service`/`windows-service`
   (OF-3/OF-4).** §1.4 assumes a **new** key. D3 owns the target-key taxonomy + the OF-4 precursor
   slice (finish-wiring the generic router). Stage E must reconcile: does the pm add a key, or does
   `up` on `linux-service`/`windows-service` delegate to the pm daemon (r3 open q)? This changes
   whether §8's schema slice depends on the OF-4 precursor.
3. **Cron start-policy backing (S8):** compose with the workers scheduler primitive vs a minimal
   core-owned cron eval. D1-assigned; the schema field is stable either way.
4. **`instances` placeholder validation:** hard error on `>1` in v1 (chosen) vs silent clamp. Chosen:
   hard error pointing at the OF-5 later-milestone design (no fake cluster, S12).
5. **`pm.config.ts` file name + location** (root vs `.netscript/`) and whether the deploy-facing
   `deploy.targets['process-manager'].graph` pointer and the standalone `pm.config.ts` are the same
   file or two. Recommend one file, referenced from both.
6. **Milestone placement (re-derive at Stage E — beta.5 already cut at baseline `317e4b50`,
   charter.md:57).** Candidate: core+schema+resolvers+CLI+docs at **beta.7**; desktop console soft-dep
   on #E6 at **beta.8**; HA/clustering/#345-overlap tail at **stable**. Not locked here.

---

## 7. Slice decomposition — D5 candidate issues

Candidate sub-issues owned by this pack's domain (schema/resolvers/scaffold/docs). Normalized into the
§8 template at Stage E. Dependency edges reference other packs' slices by pack id (D1/D3/D4) since
final `S<n>` numbering is assigned at Stage E across all packs.

| Slice | Scope | Acceptance sketch | Depends on |
| --- | --- | --- | --- |
| **D5-1 Process-graph contract (`v1`)** | Author `ProcessGraphShape` + `ProcessSpecShape` (§1.3) in `plugin-process-manager-core/src/contracts/v1/`; export as Standard Schema; reuse `WorkerTaskPermissions`; derive JSON Schema for editor autocomplete. | `deno doc` shows the public contract; type-checks; `WorkerTaskPermissions` imported not copied; round-trips a hand-written sample graph. | — (foundational; D1 consumes it) |
| **D5-2 Deploy-facing target schema** | `ProcessManagerDeployTargetSchema` spreading `deployTargetBaseShape`; register `process-manager` key in `DeployConfigSchema.targets` (§1.4). | Schema spreads the base shape (no re-declared mode/activation/secrets/otel — asserted by test); `deploy.targets['process-manager']` validates; config-section-types updated. | D5-1; OF-4 reconciliation (Stage E) |
| **D5-3 `--no-aspire` resolvers** | `resolveFromScaffoldPlugins` + `resolveFromWorkspaceTasks` + precedence merge (§3); `pm explain` provenance output. | Given a `--no-aspire` scaffold with streams+workers, resolves the `streams→workers` ordered graph with concrete argv (S6); `appsettings.json` path reuses `ResolvedBackgroundProcessorConfig` when present. | D5-1; D1 (engine consumes graph) |
| **D5-4 AspireResource[] resolver** | `resolveFromAspireResources` mapping contributed resources → `ProcessSpec`; manifest-wins precedence (§2). | Aspire-present scaffold derives graph without a hand-written manifest; manifest `id` collision skips the resource. | D5-1; D4 (`command` kind edge — shared dep, not owned) |
| **D5-5 pm `scaffold.plugin.json` + `plugin add` glue** | The manifest (§4.1) + typesafe `pm.config.ts` factory + task glue emitted by `plugin add` (§4.2), pre-seeded via D5-3 resolvers. | `plugin add process-manager` emits typed `pm.config.ts` (no copied source, no string templates — #157 law); prod/JSR add path imports core, does not vendor it; e2e scaffold.plugins green. | D5-1, D5-3; D1 (core export) |
| **D5-6 Docs wave** | All 7 pages in §5, incl. the `cli-reference.md` staleness fix in the same wave. | New capability + how-to + reference dir land; `cli-reference.md` no longer says Linux "planning-only"; `deploy.md` Step 4/6 name the closed gap; links check green. | D5-2, D4 (CLI verbs must exist to document) |

---

## 8. RFC epic skeleton (the run's headline deliverable)

Full outline for the epic issue body. Format follows the netscript-pr epic standard (title
`Epic: <name>`, `type:umbrella` + `epic:<slug>`, **no closing keyword**, sub-issue checklist,
`Part of #<parent>`) and the shape of the shipped #400 dashboard epic (which opens with
"Part of #301 … **No closing keyword**", a cross-epic dependency section, an owner-pick-baked-in
section, a slice count, and a critical path).

> **Title:** `Epic: NetScript Process Manager — bare-metal supervisor + admin console (pup/pm2 done right)`
>
> **Labels:** `type:umbrella` · `epic:process-manager` · `area:plugins` · `area:cli` · `area:deps` ·
> `area:telemetry` · `area:docs` · `priority:p1` · `wave:v1` · `rfc` · `status:plan`
> **Milestone:** re-derived at Stage E (candidate `0.0.1-beta.7`; see §6.6). *(one status: at a time)*

### Body outline

```markdown
## Epic — NetScript Process Manager

Part of #327 (Deployment epic, bare-metal lane). **No closing keyword** — this umbrella closes by
hand when its children land.

The bare-metal deployment target of #327: how NetScript apps are run, supervised, and administered on
bare metal. The concept of pup + pm2, rebuilt for 2026 as a first-party NetScript plugin
(`@netscript/plugin-process-manager(-core)`, CLI group `netscript pm`) at the quality bar of
`workers`/`auth`.

### 1. Problem statement
Today `--no-aspire` bare-metal supervision is zero automation beyond `deno task --cwd <m> dev` run by
hand in N terminals (r4 §1.1, no `appsettings.json` at all r4 §2.1). Production restart/liveness is
100% delegated to systemd/Servy with no NetScript-owned aggregate status/logs, no runtime-mutable
process list, no admin console (r2 §1, r3 missing-primitives). This epic fills that gap without
re-importing pm2's god-daemon failure class.

### 2. Prior art (honest verdicts)
- **pup** (MIT, dormant ~19.5mo): excellent concept — declarative `pup.json`, 3 start policies, one
  REST control plane consumed by CLI/plugins/UI alike. Aged code: dax-sh over `Deno.Command`,
  deprecated `@std/io` readLines, god-object `Pup` class, bespoke polling-IPC telemetry, unfixed
  descendant-kill bug. We keep the concept, not the code (m1).
- **pm2** (v7, Node/Bun): rich restart strategies worth matching; its always-on god-daemon caused
  repeated unbounded-RSS (150GB+) and daemon-duplication incidents — a structural warning, not a
  model (m2 §2).
- **Servy / systemd**: NetScript already ships production Servy + systemd adapters behind
  `OsServicePort`; extend (WatchdogSec/Type=notify/hardening/cgroups), don't replace (m3).
- **process-compose / s6-rc / Quadlet**: the generator-to-native-supervisor precedent and the
  dependency-ordered graph model we converge on (m4 §7.2-7.3).

### 3. Architecture (C1 hybrid — one paragraph)
Supervision engine as a **library**: dev mode runs it foreground-attached (`netscript pm dev`, no
daemon); production compiles the declarative process graph into OS-native units (systemd/Servy via the
existing renderers + `OsServicePort`), and the pm's resident piece is a **control-plane service** —
itself one more OS-supervised unit hosting the typed oRPC control plane, never a parent of the
workload. If it dies, the workload keeps running and the OS restarts the control plane. This
structurally eliminates the god-daemon failure mode.

### 4. Scope / non-scope (C7 — binding)
**In:** typed dependency-ordered process-graph contract; dev foreground engine; compile-to-OS-units;
resident control-plane oRPC service; `netscript pm` CLI (pup parity floor); OTEL `netscript.process`
domain; `--no-aspire` resolvers; standalone Deno-Desktop admin console + shared dashboard panel;
`OsServicePort` renderer extensions.
**Out (C7):** re-implementing restart/liveness in production (OS owns it); a deployment/rollout system
(#327 owns it); a monitoring product (OTEL export only); a production load balancer; milestone-1
N-instance clustering (OF-5); macOS/launchd (OF-6). No god-daemon, no SaaS monitoring, no git+SSH
deploy inside the pm, no untyped config, no fake cluster mode (S12).

### 5. Surfaces
- **A) Deno-Desktop admin console** — standalone, packaged via #E6 mechanics (soft dep on desktop
  Tier-4), + a shared `DashboardPanelContribution` panel over the same oRPC contract (OF-2(a), r4 §5).
- **B) Pure CLI** (`netscript pm <verb>`, alias `pm`) — pup/pm2 parity floor, leveraging OTEL/oRPC/
  deploy that NetScript ships for free (OF-1(a), OF-7(a)).

### 6. Owner-forks (ratify at Stage H)
OF-1 CLI taxonomy · OF-2 console delivery · OF-3 #345 re-scope · OF-4 dead-target wiring · OF-5
clustering defer · OF-6 launchd out · OF-7 naming. Supervisor recommendations in research.md §C3.

### 7. Cross-epic dependency edges
- #327 (parent — bare-metal lane placement).
- dev-dashboard #400 → Aspire `command` `AspireResourceKind` kind → pm lifecycle actions (shared
  framework dep, not pm-owned — r4 §4.2).
- desktop Tier-4 #E6 (packaging) / #E1 (in-process link) — soft deps for surface A (r2 §4, r4 §3.2).
- #345 HA/multi-instance overlap — OF-3 re-scope (r2 §4).
- fresh-ui L3 `blocks/` promotion (shared dashboard dep, not pm-owned — r4 §6).

### 8. Milestone sketch
- **M1 (candidate beta.7):** contract + dev engine + resolvers + control plane + CLI + OS-adapter
  extensions + docs wave.
- **M2 (candidate beta.8):** Deno-Desktop console + dashboard panel (soft-dep #E6).
- **M3 (stable):** HA/multi-instance (OF-5), external secret store, hardening, #345 convergence.

### 9. Sub-issues
- [ ] (D1) supervision engine + core package
- [ ] (D2) control plane + oRPC contract + telemetry domain
- [ ] (D3) deploy-lane integration + OS-adapter extensions + OF-4 precursor
- [ ] (D4) CLI + admin console + dashboard panel
- [ ] (D5-1) process-graph contract v1
- [ ] (D5-2) deploy-facing target schema
- [ ] (D5-3) `--no-aspire` resolvers
- [ ] (D5-4) AspireResource[] resolver
- [ ] (D5-5) pm scaffold.plugin.json + plugin add glue
- [ ] (D5-6) docs wave (incl. cli-reference staleness fix)
- [ ] merge-readiness e2e slice
<!-- links to child issues filled at Stage E filing -->

### 10. Design source
`.llm/runs/plan-process-manager--seed/research/design/{d1..d5}-*.md` + `plan.md` (Stage E).
```

---

## 9. ISSUE-DRAFT TEMPLATE (all packs normalize into this at Stage E)

The single skeleton every pack's candidate slice becomes at Stage E. Conforms to netscript-pr:
namespaced labels (exactly one `status:`), milestone from `wave:`, `Part of #<epic>` (never a closing
keyword on a child in *its own* body — the resolving **PR** carries `Closes #<child>`), acceptance
under a gate-recognized heading.

```markdown
Title: [process-manager S<n>] <slice imperative>

Labels: epic:process-manager · type:feat|docs · area:<plugins|cli|deps|telemetry|docs> ·
        priority:p1|p2 · wave:v1|v1-min|defer · status:plan
Milestone: <mapped from wave: — v1/v1-min → 0.0.1-beta.7 candidate; defer → 0.0.1-stable>

## Summary
<1–3 sentences: what this slice builds and why, in the pm epic.>

## Scope
- Archetype / area: <e.g. packages/plugin-process-manager-core contracts/v1>
- Part of #<epic>            <!-- reference only; NO closing keyword on the child here -->
- Depends on: #<sibling slice(s)> · Blocks: #<sibling slice(s)>

## Design source
- `.llm/runs/plan-process-manager--seed/research/design/<pack>.md` §<n>

## Acceptance criteria
- [ ] gate: <verifiable outcome 1 — command/artifact that proves it>
- [ ] gate: <verifiable outcome 2>
- [ ] gate: <type-check / doc-lint / e2e as applicable>
<!-- these live under an "Acceptance criteria" heading so the close-gate (#387) recognizes them;
     each checked box needs linked evidence (command output / run URL / PR comment) before close -->

## Non-scope
- <explicit C7 guard(s) this slice must not cross>

## Drift / Debt
- <DEBT_ACCEPTED rows or "none">
```

Filing rules carried from netscript-pr for Stage E:
- The epic itself gets **no** closing keyword (closes by hand when all children land).
- Each child is resolved by **exactly one PR** whose **body** carries `Closes #<child>`.
- Every open issue carries ≥1 `type:` + ≥1 `area:` + one `status:` + a milestone.
- New issues would normally land `status:triage`; this run files them already-planned, so they carry
  `status:plan` at filing (Stage H), matching #400's own `status:plan` at epic creation.
```
