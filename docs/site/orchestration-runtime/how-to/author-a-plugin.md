---
layout: layouts/base.vto
title: Author a plugin
templateEngine: [vento, md]
order: 108
oldUrl: /how-to/author-a-plugin/
---

# Author a plugin

This recipe builds a new custom plugin: where it lives, the manifest it exports through
`definePlugin(...)`, the contributions the kernel reads, and the generated registry that makes
them discoverable at runtime. Come here when you need a capability NetScript does not ship. To use
an official plugin instead, [Add a plugin](/orchestration-runtime/how-to/add-a-plugin/) installs
it.

[The plugin system](/explanation/plugin-system/) explains the model behind the design, and the
[plugin reference](/reference/plugin/) lists the generated manifest and contribution types.

## Before you start

Know what your plugin contributes, and read the official plugin closest to your goal before you
write code. If your plugin spans more than one package, study the
[auth plugin](#a-real-multi-package-exemplar-the-auth-plugin).

You need:

- **A workspace** created with `netscript init`. If you have none, start with the
  [tutorials](/tutorials/).
- **The `netscript` CLI on your path**:
  `deno install --global --allow-all --name netscript jsr:@netscript/cli{{ releaseSpecifier }}`.
  Confirm with `netscript --help`.
- **A provider kind**: `worker`, `saga`, `trigger`, `stream` or `plugin`. Utility and
  infrastructure plugins use `stream` or the generic `plugin`.
- **Aspire running** before any `netscript db` command or request to your plugin's endpoints. An
  API service or background processor runs as a resource in the Aspire graph beside Postgres and
  Redis: from the project root, run `cd aspire && aspire start` (dashboard at
  [https://localhost:18888](https://localhost:18888)).

Run every command from the workspace root.

## Step 1 — Scaffold the two-tier skeleton

A NetScript plugin is two packages. A JSR-publishable **core engine package** under
`packages/plugin-<name>-core/` owns the behavior: domain, ports, application logic and contract. A
thin **connector** under `plugins/<name>/` wires that behavior into a host; its `mod.ts` exports
the plugin manifest, and `netscript.config.ts` references it. Change capability in the core package
and integration in the connector.

The greenfield generator emits both packages in one pass:

```sh
netscript plugin new notifier
```

It scaffolds a **proxy** connector by default. The options:

| Option | Effect |
| --- | --- |
| `--feature` | Generate a route-backed feature connector instead of a proxy. |
| `--force` | Overwrite existing files instead of skipping them. |
| `--project-root <path>` | Target a project root other than the current directory. |

The core package's `deno.json` is strict and exports `. ./contracts/v1 ./domain ./ports ./testing`:

```tree
packages/plugin-notifier-core/
├── deno.json                          # strict; exports . ./contracts/v1 ./domain ./ports ./testing
├── mod.ts                             # curated builders + domain type re-exports
├── README.md
├── src/domain/mod.ts                  # domain entities and ids
├── src/ports/mod.ts                   # the engine's ports (the seam adapters implement)
├── src/application/mod.ts             # application orchestration (define<Name>)
├── src/contracts/v1/notifier.contract.ts  # the v1 oRPC contract, extends the base plugin contract
├── src/contracts/v1/mod.ts            # contract barrel
├── src/testing/mod.ts                 # in-memory port doubles for tests
└── tests/contracts/notifier-contract-soundness_test.ts
```

The connector carries only integration. Its `deno.json` exports
`. ./contracts ./services ./aspire ./cli ./scaffold`, and its `contracts/v1.ts` re-exports the
core's `contracts/v1`:

```tree
plugins/notifier/
├── deno.json                 # exports . ./contracts ./services ./aspire ./cli ./scaffold
├── package.json
├── mod.ts                    # ← public manifest: definePlugin(...).build() + an inspect fn
├── README.md
├── contracts/v1.ts           # re-exports @netscript/plugin-notifier-core/contracts/v1
├── adapter.ts                # NetScriptPlugin adapter (install/doctor/info/update/remove)
├── aspire.ts                 # Aspire contribution
├── cli.ts                    # CLI adapter entrypoint
├── scaffold.ts               # scaffold adapter entrypoint
├── verify-plugin.ts          # manifest self-verification
├── scaffold.plugin.json      # manifest descriptor read by the CLI/kernel (kind, capabilities…)
├── scaffold.runtime.json
├── database/notifier.prisma  # (optional) plugin's Prisma models, aggregated at db generate
├── scaffolding/              # item scaffolder + stub the connector emits into userland
├── services/src/             # the plugin's service: context.ts, handlers.ts, main.ts
└── tests/public/manifest_test.ts
```

### Preserve the generated authorization boundary

The generator emits a guarded service, an auth-plugin dependency and required `<name>:read`
scopes. Configure auth and obtain a scoped session before reading. Older CLI releases may not
include this wiring.

Share the generated `PluginContractMount` constant between router assembly and
`createContractAuthorizer(mountPluginContract(contract, mount))`. This aligns REST paths and RPC
keys without changing contract metadata. Missing scopes stay denied, and a public health endpoint
doesn't prove authorized reads. See the
[plugin authentication reference](/reference/plugin/#plugin-service-authentication-posture).

## Step 2 — Write the manifest descriptor (`scaffold.plugin.json`)

`scaffold.plugin.json` is the static descriptor the CLI and kernel read for your plugin's
archetype and runtime needs. Its most important field is `provider.kind`, which tells the framework
what category of contributions to expect. Pick the closest official match:

{{ comp.apiTable({
  caption: "provider.kind by archetype (from the official scaffold.plugin.json files)",
  rows: [
    { name: "worker", type: "background-processor", desc: "Job handlers run by a worker processor. defaultEntrypoint bin/combined.ts, concurrencyEnvVar WORKERS_CONCURRENCY (default 2). The service port is assigned at scaffold time from the high range (49152+)." },
    { name: "saga", type: "background-processor", desc: "Durable message-driven sagas. defaultPermissions ['--unstable-kv','--allow-all'], concurrencyEnvVar SAGA_CONCURRENCY. The service port is assigned at scaffold time from the high range (49152+)." },
    { name: "trigger", type: "ingress", desc: "Webhooks, schedules and file watchers. defaultEntrypoint src/runtime/trigger-processor.ts, concurrencyEnvVar TRIGGER_CONCURRENCY (default 10). The service port is assigned at scaffold time from the high range (49152+)." },
    { name: "stream", type: "utility / plugin", desc: "Infrastructure or utility plugin. requiresDb=false, requiresKv=false, portRangeKey PLUGIN_API: the installer allocates a randomized port from that range (>= 57344) at scaffold time." }
  ]
}) }}

A worker-archetype descriptor looks like this; copy the shape and change the names. Declare
cross-resource wiring in the top-level `linking` block, the shared contract for official and
third-party plugins. Eligibility never depends on `officialSource`.

{{ comp.codeBlock({ filename: "plugins/notifier/scaffold.plugin.json", lang: "json", code: "{\n  \"provider\": {\n    \"kind\": \"worker\",\n    \"category\": \"background-processor\",\n    \"defaultEntrypoint\": \"bin/combined.ts\",\n    \"defaultServiceEntrypoint\": \"services/src/main.ts\",\n    \"defaultRequiresDb\": true,\n    \"defaultRequiresKv\": true,\n    \"concurrencyEnvVar\": \"WORKERS_CONCURRENCY\"\n  },\n  \"linking\": {\n    \"canonicalName\": \"notifier\",\n    \"resourceConfigKey\": \"notifier-api\",\n    \"backgroundConfigKey\": \"notifier\",\n    \"dependencies\": [\"streams-api\"],\n    \"consumers\": {\n      \"services\": [\"catalog\"],\n      \"apps\": [\"dashboard\"]\n    }\n  }\n}" }) }}

| Field | What the kernel reads it for |
| --- | --- |
| `provider.kind` | Which contribution category to scan for. |
| `defaultEntrypoint` | The background processor Aspire starts. |
| `defaultServiceEntrypoint` | The API service Aspire starts, if any. |
| `linking.resourceConfigKey` | The exact plugin API resource identifier. |
| `linking.backgroundConfigKey` | The exact processor identifier, when present. |
| `linking.dependencies` | Producer plugin keys wired into this plugin. |
| `linking.consumers` | Exact service and app names that receive the API reference. |

## Step 3 — Export the manifest from `mod.ts`

`mod.ts` is the plugin's public surface. Like the official plugins, it exports the manifest, built
with the `definePlugin(name, version)` fluent builder from `@netscript/plugin`, plus an `inspect*`
helper. Each `withX(...)` method adds one contribution axis, and `.build()` validates the result
against the manifest schema and freezes it.

{{ comp.codeBlock({ filename: "plugins/notifier/mod.ts", lang: "ts", code: "// Public manifest for the notifier plugin.\n// Mirrors the official plugins: build the manifest with definePlugin(...),\n// then export it alongside an inspect helper.\nimport { definePlugin } from '@netscript/plugin';\n\nexport const NOTIFIER_PLUGIN_ID = 'notifier' as const;\nexport const NOTIFIER_API_DEFAULT_PORT = 8095 as const;\n\nexport const notifierPlugin = definePlugin('@notifier/plugin', '0.1.0')\n  .withDescription('Delivers user notifications via worker jobs.')\n  .withLicense('MIT')\n  .withAuthor('Acme Platform Team')\n  .withDependencies({ streams: true })\n  .withE2e([{ name: 'notifier.smoke', command: 'deno test --allow-all tests/' }])\n  .build();\n\nexport const inspectNotifier = () => ({\n  id: NOTIFIER_PLUGIN_ID,\n  version: notifierPlugin.version,\n  port: NOTIFIER_API_DEFAULT_PORT,\n});\n\nexport default notifierPlugin;" }) }}

| Builder method | Adds |
| --- | --- |
| `.withService(...)` | An oRPC/API service contribution. |
| `.withBackgroundProcessor(...)` | A worker or saga processor entrypoint. |
| `.withStreamTopics([...])` | Durable stream topic schemas. |
| `.withDbSchemas([...])` | Prisma models aggregated at db generate. |
| `.withContractVersions([...])` | Versioned oRPC contracts. |
| `.withRuntimeConfigTopics([...])` | Runtime-config schemas. |
| `.withMigrations([...])` | Database migration contributions. |
| `.withE2e([...])` | Merge-readiness gates. |
| `.withDependencies({...})` | Plugins wired ahead of this one. |
| `.withAspire(modulePath)` | The Aspire contribution module. |
| `.build()` | Returns the immutable, schema-validated manifest. |

{{ comp.codeBlock({ filename: "plugins/notifier/deno.json", lang: "json", code: "{\n  \"name\": \"@notifier/plugin\",\n  \"version\": \"0.1.0\",\n  \"exports\": {\n    \".\": \"./mod.ts\",\n    \"./contracts\": \"./contracts/v1/mod.ts\"\n  },\n  \"imports\": {\n    \"@netscript/plugin\": \"jsr:@netscript/plugin" + releaseSpecifier + "\",\n    \"@netscript/plugin-workers-core\": \"jsr:@netscript/plugin-workers-core" + releaseSpecifier + "\",\n    \"zod\": \"jsr:@zod/zod@4.4.3\"\n  }\n}" }) }}

The manifest is data, not behavior. It declares what the plugin is (name, version, dependencies)
and which contribution axes it owns; the capability lives in the contribution modules you write
next. The [plugin reference](/reference/plugin/) covers the full builder surface.

## Step 4 — Author a contribution

A contribution is a typed module the registry scans and exposes to the runtime. Its shape depends
on `provider.kind`:

{{ comp.apiTable({
  caption: "Contribution authoring API by kind",
  rows: [
    { name: "worker", type: "defineJobHandler", desc: "A job: defineJobHandler(async (ctx) => …) with createSuccessResult/createFailureResult; set the id with Object.assign(handler, { id }). Lives in jobs/." },
    { name: "saga", type: "defineSaga(id)…build()", desc: "Fluent builder: .durability('t1').state<S>({…}).on<Type,Payload>(type, fn).build(); effects via sagaComplete({…}). The durable store is kv or prisma." },
    { name: "trigger", type: "defineWebhook", desc: "defineWebhook(handler, { id, path, verifier, tags }); the handler returns enqueueJob(jobRef, { payload, priority })[]. The service speaks a typed v1 oRPC contract for trigger and event introspection and management; the webhook ingress endpoint stays a raw signature-verifying route." },
    { name: "stream", type: "createDurableStream / defineStreamSchema", desc: "Producer runtime from @netscript/plugin-streams-core; @netscript/plugin-streams carries the service manifest and typed topic definitions. Consumers read HTTP/SSE." }
  ]
}) }}

For a worker-archetype plugin, a contribution is an ordinary job handler, written with the same
API the official workers plugin uses. Put the file in `plugins/notifier/jobs/`. The other tabs show
the trigger and stream archetypes:

{{ comp.tabbedCode({ tabs: [
  {
    label: "plugins/notifier/jobs/send-notification.ts",
    lang: "ts",
    code: "import {\n  createSuccessResult,\n  defineJobHandler,\n} from '@netscript/plugin-workers-core';\nimport { z } from 'zod';\n\nconst PayloadSchema = z.object({ userId: z.string().min(1) });\n\nconst handler = defineJobHandler(async (ctx) => {\n  const { userId } = PayloadSchema.parse(ctx.payload ?? {});\n  // …deliver the notification here…\n  return createSuccessResult({ userId, delivered: true });\n});\n\nexport default Object.assign(handler, { id: 'send-notification' });"
  },
  {
    label: "Trigger archetype (typed contract + raw ingress)",
    lang: "ts",
    code: "import { defineWebhook, enqueueJob } from '@netscript/plugin-triggers-core/builders';\n\n// A webhook contribution: returns an array of enqueueJob effects that\n// bind inbound HTTP to worker jobs. The triggers service serves a typed\n// v1 oRPC contract for trigger/event introspection and management; the\n// webhook ingress route (POST /api/v1/webhooks/:triggerId) stays a raw\n// signature-verifying endpoint by design. enqueueJob is the only live\n// action; a defer action throws and routes to the DLQ.\nexport const inbound = defineWebhook(\n  () => Promise.resolve([\n    enqueueJob(jobRef, { payload: { verbose: false }, priority: 50 }),\n  ]),\n  { id: 'notifier-inbound', path: 'inbound/notify', verifier: 'memory', tags: ['webhook'] },\n);\nexport default inbound;"
  },
  {
    label: "Stream producer (real runtime)",
    lang: "ts",
    code: "import { createDurableStream, defineStreamSchema } from '@netscript/plugin-streams-core';\n\n// The producer runtime is REAL. createDurableStream serves a durable\n// stream (an Aspire service on its assigned port) you can upsert/delete/flush against.\nconst schema = defineStreamSchema({ /* topic entity schema */ });\nconst producer = createDurableStream({\n  streamPath: '/notifier/events',\n  schema,\n  producerId: 'notifier-service',\n});\nproducer.upsert('event', { id: 'evt-1', status: 'sent' });"
  }
] }) }}

{{ comp callout { type: "note", title: "Trigger ingress and stream producers" } }}
<strong>Triggers</strong> serve a typed v1 oRPC contract for trigger and event introspection and management, but the webhook ingress endpoint (<code>POST /api/v1/webhooks/:triggerId</code>) stays a raw route: it verifies an HMAC signature over the raw request bytes, which oRPC's schema parsing can't do, so third-party senders POST to a plain URL. Trigger handlers can <code>enqueueJob</code> immediately or <code>defer</code> a durable one-shot replay until a future timestamp. <strong>Streams</strong> are split: <code>createDurableStream</code> in <code>@netscript/plugin-streams-core</code> is the producer runtime (served as an Aspire service and used by the workers, auth and sagas plugins), and <code>@netscript/plugin-streams</code> carries the manifest and typed topic definitions. Consumers read streams over HTTP/SSE. The <a href="/durable-workflows/streams/#breaking-migration-in-008">0.0.8 migration</a> lists the removed root producer and consumer helpers.
{{ /comp }}

## Step 5 — Register the plugin in `netscript.config.ts`

The kernel loads only the plugins listed in the config, so the connector's `mod.ts` must appear in
the `plugins` array. If you scaffolded through the CLI, this already happened; both wiring commands
add the connector to `netscript.config.ts`:

- `netscript plugin new <name>`, the generator from
  [Step 1](#step-1-scaffold-the-two-tier-skeleton), registers the connector it emits. Its
  `--register` flag defaults to on.
- `netscript plugin install <kind> --name <name> --local-path <path>` installs a plugin workspace
  from a local package directory and registers it.

Open `netscript.config.ts` and confirm the entry `./plugins/<name>/mod.ts` is present. If you
hand-author the connector without the CLI, add the path to the `plugins` array yourself:

{{ comp.codeBlock({ filename: "netscript.config.ts", lang: "ts", code: "import { defineConfig } from '@netscript/config';\n\nexport default defineConfig({\n  name: 'my-app',\n  version: '1.0.0',\n  paths: { services: 'services', apps: 'apps', contracts: 'contracts', plugins: 'plugins' },\n  plugins: [\n    './plugins/streams/mod.ts',\n    './plugins/workers/mod.ts',\n    './plugins/sagas/mod.ts',\n    './plugins/triggers/mod.ts',\n    './plugins/notifier/mod.ts', // ← your custom plugin\n  ],\n});" }) }}

## Step 6 — Generate the registry

The runtime addresses contributions through a generated registry, not your source tree. For a
worker-archetype plugin, the generator scans `plugins/<name>/jobs/` and writes a jobs registry
(for example `.netscript/generated/plugin-<name>/job-registry.ts`) keyed by each handler's `id`.

1. Generate the plugin registry:

   ```sh
   netscript generate plugins
   ```

2. If your plugin contributes runtime configuration schemas, generate those too:

   ```sh
   netscript generate runtime-schemas
   ```

Each contribution is then discoverable by its `id`: a job at
`POST /api/v1/<name>/jobs/{id}/trigger`, a webhook at `POST /api/v1/webhooks/<path>`, and so on.
Regenerate whenever you add, rename or remove a contribution module, then restart `aspire start`
(or let it hot-reload) so the service and its background processor load the new registry.

## Step 7 — Verify it is wired up

1. List the registry and run the health check:

   ```sh
   netscript plugin list      # your plugin should appear in the registry
   netscript plugin doctor    # checks plugin health and reports wiring problems
   ```

2. With Aspire running, exercise a contribution on your plugin's port. For the `notifier` worker
   example on `:8095`:

   ```sh
   curl http://localhost:8095/health
   curl http://localhost:8095/api/v1/notifier/jobs

   curl -X POST http://localhost:8095/api/v1/notifier/jobs/send-notification/trigger \
     -H 'content-type: application/json' \
     -d '{ "payload": { "userId": "user-42" } }'
   ```

The jobs list shows the contribution, and an execution is recorded after you trigger it. Watch it
live under your plugin's resource in the [Aspire dashboard](https://localhost:18888).

## Declare health through metadata

The adapter scaffold declares `doctor.healthEndpoint` for its API diagnostics. The AppHost service
probe uses `HealthCheckPath` in appsettings, defaulting to `/health`. Background Deno children with
`RequiresKv: true` serve the shared `/health` contract; the generator selects them by capability,
including renamed resources.

The unused `declareHealthChecks` contribution hook and its spec types were removed in 0.0.8. Remove
legacy overrides and imports, and keep capability and health endpoint metadata.
[Background child health](/orchestration-runtime/child-health/) defines the states and the
crash-loop threshold.

## A real multi-package exemplar: the auth plugin

When your plugin grows into a core seam, swappable adapters and one service, copy the auth plugin.
It is built from five units:

{{ comp.apiTable({
  caption: "Auth plugin topology (a multi-package plugin)",
  rows: [
    { name: "@netscript/plugin-auth-core", type: "core seam", desc: "Defines AuthBackendPort, domain types, contracts/v1 and stream events. Adapters depend on it; it depends on no adapter." },
    { name: "@netscript/auth-kv-oauth", type: "backend adapter", desc: "Interactive OAuth/OIDC backend, the only backend with an interactive sign-in flow. The default backend." },
    { name: "@netscript/auth-workos", type: "backend adapter", desc: "Non-interactive WorkOS AuthKit backend; signin/callback return unsupported on this backend." },
    { name: "@netscript/auth-better-auth", type: "backend adapter", desc: "Non-interactive better-auth backend; signin/callback return unsupported on this backend." },
    { name: "@netscript/plugin-auth (plugins/auth/)", type: "unifying plugin", desc: "Composes ONE active backend (NETSCRIPT_AUTH_BACKEND, default kv-oauth) into one oRPC service, auth-api." }
  ]
}) }}

The pattern: the core package owns the port (`AuthBackendPort`); each adapter is pure, implementing
the port and declaring no service; and the plugin under `plugins/<name>/` composes one active
adapter into a single service and registry. Adapters stay swappable and the kernel-facing manifest
stays small. [Add authentication](/identity-access/how-to/add-authentication/) walks through the
auth plugin itself.

{{ comp callout { type: "note", title: "Aligned package pins" } }}
CLI scaffolds pin <code>jsr:@netscript/plugin-auth-core{{ releaseSpecifier }}</code> and its siblings at the exact aligned alpha version. Keep generated plugin workspaces on one NetScript release train.
{{ /comp }}

## Production pitfalls

| Symptom | Cause | Fix |
| --- | --- | --- |
| Endpoints return 404 or jobs never run | Aspire isn't running. The plugin's API service and background processor are Aspire resources. | Run `aspire start` from `aspire/`. |
| A new job isn't registered | Stale registry. The runtime reads the generated registry, not your source tree. | Run `netscript generate`, then restart Aspire. |
| Port collision in the Aspire graph | A manually configured port reuses one already allocated. | Let the scaffolder allocate a high-range port (>= 49152) per project, or check `appsettings.json` and the Aspire dashboard for active ports. |
| Edits have no effect | You edited a top-level staging copy. | Author in `plugins/<name>/`, the directory `netscript.config.ts` references. |
| Behavior doesn't match the archetype | The plugin's behavior differs from its declared `provider.kind`. | Match the archetype; [Step 4](#step-4-author-a-contribution) covers trigger and stream behavior. |
| A dependency isn't wired first | The dependency is undeclared. | Declare it with `.withDependencies({...})` on the runtime manifest and in `linking.dependencies` in `scaffold.plugin.json`, so the reconciler and Aspire graph use the same resource keys. |

## Next step

To build a multi-package plugin end to end, follow
[Add authentication](/identity-access/how-to/add-authentication/). The
[plugin reference](/reference/plugin/) documents `definePlugin`, the manifest type and the
contribution shapes.
