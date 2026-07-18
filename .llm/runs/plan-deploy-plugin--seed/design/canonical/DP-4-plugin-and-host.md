# DP-4 — `plugins/deploy` and the plugin-host extensions

> **Draft — no GitHub mutation.** Canonical design doc of `plan-deploy-plugin--seed`.

## 1. The plugin (`@netscript/plugin-deploy`, `plugins/deploy/`) — Archetype 5

Folder shape (doctrine 06:181-198; contribution folders sibling to `src/`):

```
plugins/deploy/
  mod.ts                    # few lines: re-export public surface
  deno.json                 # subpaths: ./public ./plugin ./scaffold ./adapter-cli ./streams ./streams/server
  README.md                 # permissions, target matrix, quick start
  verify-plugin.ts          # asserts declared axes against the host loader
  scaffold.plugin.json      # installer manifest (§3)
  cli.ts                    # createPluginAdapter(deployAdapterPlugin).toCli()
  scaffold.ts               # …​.toScaffold()
  src/
    public/mod.ts           # definePlugin(...) manifest (§2)
    adapter/plugin.ts       # NetScriptPlugin connector (install/doctor seams)
    adapter/resources/      # starter resources: deploy.config barrel + target snippets
    composition/            # composition root: registry assembly from installed adapters
  streams/                  # deploy event stream schema + server producer (§4)
```

Thinness law: every convention lives in `plugin-deploy-core`; the plugin only **wires**
(composition root builds the multi-target registry from the adapters the project installed),
**declares** (manifest, installer JSON, connector), **contributes** (CLI mount, scaffolder,
streams, telemetry, doctor), and **re-exports** (core types). `mod.ts` stays a few lines
(R-PLUGIN-THIN).

## 2. Runtime manifest (`definePlugin`)

```ts
definePlugin('@netscript/plugin-deploy', DEPLOY_PLUGIN_VERSION)
  .withDisplayName('Deploy').withType('utility')
  .withPermissions(DEPLOY_PLUGIN_PERMISSIONS)          // --allow-run=<tool set>, net, read, write
  .withCliCommands([{ group: 'deploy', loader: './adapter-cli' }])   // NEW axis (§5)
  .withStreamTopics([{ name: 'deploy-events', subject: 'deploy' }])
  .withTelemetry([{ name: 'deploy', loader: './src/telemetry' }])
  .withRuntimeConfigTopics([{ name: 'deploy' }])       // rollout flags (pause target, freeze)
  .withMetadata({ tier: 'official' }).build();
// frozen with: contributions.cli.doctorChecks = ['deploy-target']    // NEW union member (§5)
```

**No `withService` in v1** (owner fork OF-4): deploy is CLI/CI-shaped; there is no long-running
HTTP surface, no port, `hasRoutes:false`. The machine-readable surface that replaces a `describe`
route is the **capability manifest**, exposed as `netscript deploy capabilities [<target>]
--json`. If a deploy dashboard/orchestration API is ever wanted, it lands as a later
`withService` + `contracts/v1` addition through the standard base-contract seam
(`...BASE_PLUGIN_CONTRACT_ROUTES` + `satisfies BasePluginContract`) — the seam cost is one
follow-up card, so deferring is rework-safe (plan-gate open-decision sweep).

## 3. Installer manifest (`scaffold.plugin.json`)

Re-derived, not copied from auth (`research/auth-composition-anatomy.md` §9 item 8):

```jsonc
{
  "schemaVersion": 1,
  "name": "@netscript/plugin-deploy",
  "capabilities": { "hasDatabaseMigrations": false, "hasRoutes": false,
                    "hasBackgroundWorkers": false, "contributesDeployTargets": true },  // NEW flag (§5)
  "scaffolder": { "export": "./scaffold",
                  "requiredPermissions": { "net": true, "read": true, "write": true } },
  "provider": { "kind": "deploy", "pluginType": "utility", "infrastructureRequires": [] },
  "officialSource": { "canonicalName": "deploy", "pluginDir": "deploy" }
}
```

No `.prisma`, no service port, no port-range key, no db/kv requirement — the deploy plugin runs
at build/CI time and in the developer loop, not as a resident service.

Peer model: **adapters are peerDependencies-style install choices.** `netscript plugin install
deploy` installs plugin + core; `netscript deploy target add <key>` (new verb, §6) adds the
adapter package import + its config member + scaffold assets for that target. This is the
multi-target inversion of auth's single-active env selection: targets are *added*, not switched.

## 4. Contributions beyond CLI

- **Streams**: `deploy-events` durable stream — versioned envelope
  `deploy.started/succeeded/failed/rolled-back` with target key, environment, artifact digest,
  actor, trace context (W3C propagation like auth's producer). Core deploy success **never
  depends on the stream sink** (audit-provider independence — board-parity lesson 8).
- **Telemetry**: span vocabulary for plan/up/rollback, redaction rules (secrets never in spans —
  the secrets convention's redaction applied at the telemetry seam).
- **Runtime-config topic `deploy`**: operational flags (freeze deploys, pause a target) readable
  without redeploy via `@netscript/runtime-config` — deliberately tiny.
- **Scaffolder**: emits the userland `deploy/` leaf — `deploy/targets.ts` (typed target
  definitions the user owns and edits — the named inversion of auth's never-rewritten barrel)
  plus per-target assets on `target add` (wrangler.jsonc, fly.toml, workflows…; scaffold-stories
  doc). Golden tests per emitter (R-PLUGIN-PARITY).
- **Doctor**: `deploy-target` check — validates each configured target: adapter installed,
  required tool on PATH (`wrangler`, `aspire`, `docker`…), credentials env present (names only,
  never values), config member parses, capability verdict for the project graph.

## 5. Host extensions (`@netscript/plugin` — named, small, reviewed)

Three host changes, each its own slice (they precede W3):

1. **CLI-command contribution axis** (NEW): `CONTRIBUTION_AXES` + `'cli-command'`,
   `CliCommandContribution { group: string; loader: string }`, `PluginCliCommandContribution`
   abstract, `withCliCommands` builder verb. The registry emitter renders a generated CLI mount
   module; `packages/cli` mounts contributed groups after built-ins at startup (declarative
   `CliRoot` composition preserved — R-A6-N5). Collision rule: a contributed group may not
   shadow a built-in group name except the deploy back-compat shim (§6).
2. **Doctor-check union widening**: `cli.doctorChecks` type from `readonly 'auth-backend'[]` to a
   declared union `readonly ('auth-backend' | 'deploy-target')[]` — still closed (typed registry,
   AP-24-safe), one PR whenever a plugin adds a check kind.
3. **Capability flag**: `PluginManifestCapabilities.contributesDeployTargets?: boolean` so the
   installer/registry can reason about deploy plugins statically (parallel to
   `supportsMcpScaffold`).

**Frontend axis is out of scope here** — the parallel seed run (`plan/frontend-contrib`) owns the
`frontend` contribution axis design; this run only asserts the deploy plugin will *use* that axis
when it lands (deploy status surfaces in the dev dashboard) and must not design it.

## 6. CLI delivery and back-compat (owner fork OF-3)

- **W1–W2 (pre-plugin):** `packages/cli` deploy group re-wired over `plugin-deploy-core` +
  extracted adapters. Zero verb changes; `deno task e2e:cli` is the invariant.
- **W3 (plugin-mounted):** the deploy group ships as the plugin's `cli-command` contribution. In
  a scaffolded project the group appears when the plugin is installed. **The framework CLI keeps
  a thin built-in shim**: if the plugin is absent, `netscript deploy` prints the install hint;
  if present, the shim defers to the contributed group. This preserves the documented
  `netscript deploy …` UX for every existing project while making the plugin the owner
  (recommended resolution of OF-3).
- **New verbs** landing with the plugin: `deploy target add|remove <key>` (adapter + config +
  scaffold assets), `deploy capabilities [<target>] --json`, `deploy doctor` (alias of
  `plugin doctor` scoped to deploy). Legacy flat verbs alias to `baremetal` ops with a two-release
  deprecation notice (DP-2 §2).

## 7. Acceptance (plugin Concept of Done, per doctrine 11 parity checklist)

- `verify-plugin.ts` green (axes: cli-command group, stream topic, telemetry, runtime-config
  topic, doctor check).
- Golden test per scaffold emitter; `plugin doctor` covers required-config + tool-missing +
  credential-missing paths; a registered `scaffold.runtime` e2e case exercising
  `plugin install deploy` → `deploy target add deno-deploy` → `deploy deno-deploy plan` on the
  generated workspace.
- Contract-soundness: n/a in v1 (no service contract); the compensating check is a schema test
  that `deploy capabilities --json` output validates against the published
  `DeployCapabilityManifest` schema.
- Quality: `quality:scan`, `arch:check`, `deno doc --lint`, publish dry-run, jsr-audit —
  "thin ≠ thin quality budget".
