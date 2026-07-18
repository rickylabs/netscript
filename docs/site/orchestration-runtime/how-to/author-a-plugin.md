---
layout: layouts/base.vto
title: Author a plugin
templateEngine: [vento, md]
order: 107
oldUrl: /how-to/author-a-plugin/
---

# Author a plugin

**Scope.** This recipe shows how to author a *new* custom plugin from scratch — its canonical
location, the manifest it exports through `definePlugin(...)`, the contribution shape the kernel
reads, and the generated registry that makes those contributions discoverable at runtime. It is the
advanced companion to [Add a first-party plugin](/how-to/add-a-plugin/), which only *installs* one
of the four official plugins (`workers`, `sagas`, `triggers`, `streams`). If you just want a worker
or a saga, install it there. Come here when you need a capability NetScript does not ship.

A NetScript plugin is **two packages**: a JSR-publishable **core engine** under
`packages/plugin-<name>-core/` that owns the behavior (domain, ports, application, contract), and a
thin **connector** under `plugins/<name>/` whose `mod.ts` exports a plugin **manifest** built with
`definePlugin`. The framework discovers the connector because `netscript.config.ts` lists
`./plugins/<name>/mod.ts`, and it discovers the plugin's *contributions* (jobs, services, stream
topics, DB schemas, e2e gates) through a generated **registry**. Scaffold both tiers with `netscript
plugin new <name>`, get location, manifest, and registry right, and the kernel wires the rest. The
conceptual model behind that split lives in [The plugin system](/explanation/plugin-system/); the
generated manifest and contribution types live in the [plugin reference](/reference/plugin/).

{{ comp callout { type: "important", title: "Aspire is the control plane — start it first" } }}
If your plugin contributes an API service or a background processor, those run as resources in the
Aspire graph alongside Postgres and Redis. Bring orchestration up <strong>before</strong> you run
any <code>netscript db</code> command or exercise your plugin's endpoints: from the project root,
<code>cd aspire &amp;&amp; aspire start</code> (dashboard at
<a href="https://localhost:18888">https://localhost:18888</a>). DB commands require Aspire running
first. See <a href="/explanation/aspire/">the Aspire explanation</a> for the resource graph.
{{ /comp }}

## Before you start

You need an existing workspace and a clear idea of what your plugin *contributes*. The official
plugins are the reference implementations — read one that resembles your goal before you write a
line. The richest real-world exemplar is the **auth plugin**: a multi-package plugin (`plugins/auth/`
plus `@netscript/plugin-auth-core` and three backend adapters) that composes a core seam, swappable
adapters, and a single oRPC service. Study it when your plugin spans more than one package.

{{ comp.apiTable({
  caption: "Prerequisites",
  rows: [
    { name: "Workspace", type: "netscript init", desc: "An existing project. If you have none, scaffold one first — see the tutorials." },
    { name: "netscript CLI", type: "on PATH", desc: "Installed globally: deno install --global --allow-all --name netscript jsr:@netscript/cli. Confirm with netscript --help." },
    { name: "A starting skeleton", type: "netscript plugin new <name>", desc: "Scaffold the two-tier core + connector pair, then adapt it. Read a first-party plugin's mod.ts + scaffold.plugin.json alongside it; the auth plugin is the best multi-package exemplar." },
    { name: "Provider kind", type: "worker | saga | trigger | stream | plugin", desc: "Decide which archetype your plugin is. Utility/infra plugins use kind 'stream' or the generic 'plugin'." }
  ]
}) }}

Throughout, run commands from your workspace root.

## Step 1 — Scaffold the two-tier skeleton

Every NetScript plugin is **two packages, not one**: a JSR-publishable **core engine package** under
`packages/plugin-<name>-core/` that owns the behavior, and a **thin connector** under
`plugins/<name>/` that wires that behavior into a host. The fastest — and doctrine-true — way to get
both trees correct is the greenfield generator:

```sh
netscript plugin new notifier
```

`netscript plugin new <name>` emits the whole pair in one pass. It scaffolds a **proxy** connector
by default; pass `--feature` to generate a route-backed feature connector instead. Its other options
are `--force` (overwrite existing files instead of skipping them) and `--project-root <path>` (target
a project root other than the current directory). The connector under `plugins/<name>/` is the
workspace member
`netscript.config.ts` references; the core package under `packages/plugin-<name>-core/` is where the
domain, ports, application logic, and contract live and is independently publishable to JSR.

The **core engine package** owns the capability. Its `deno.json` is strict and exports
`. ./contracts/v1 ./domain ./ports ./testing`:

```
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

The **thin connector** carries only integration. Its `deno.json` exports
`. ./contracts ./services ./aspire ./cli ./scaffold`, and its `contracts/v1.ts` re-exports the core's
`contracts/v1`:

```
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

{{ comp callout { type: "note", title: "Two tiers: behavior in core, integration in the connector" } }}
The pair the generator emits mirrors the core/connector split every official plugin uses:
<code>packages/plugin-notifier-core/</code> holds the domain, ports, application logic, and the
versioned contract — the parts you would publish and reuse — while <code>plugins/notifier/</code>
holds only the manifest, adapters, and service wiring, re-exporting the core's contract through
<code>contracts/v1.ts</code>. <code>netscript.config.ts</code> references
<strong><code>./plugins/notifier/mod.ts</code></strong>, so the connector is the workspace member you
register; author capability changes in the core package and integration changes in the connector.
{{ /comp }}

## Step 2 — Write the manifest descriptor (`scaffold.plugin.json`)

`scaffold.plugin.json` is the static descriptor the CLI and kernel read to understand your plugin's
*archetype* and runtime needs. The single most important field is **`provider.kind`** — it tells the
framework what category of contributions to expect. The official plugins set it as follows, and your
plugin should pick the closest match:

{{ comp.apiTable({
  caption: "provider.kind by archetype (from the official scaffold.plugin.json files)",
  rows: [
    { name: "worker", type: "background-processor", desc: "Job handlers run by a worker processor. defaultEntrypoint bin/combined.ts, concurrencyEnvVar WORKER_CONCURRENCY (default 2) in current Aspire metadata; runtime entrypoints read WORKERS_CONCURRENCY, servicePort 8091." },
    { name: "saga", type: "background-processor", desc: "Durable message-driven sagas. defaultPermissions ['--unstable-kv','--allow-all'], concurrencyEnvVar SAGA_CONCURRENCY, servicePort 8092." },
    { name: "trigger", type: "ingress", desc: "Webhooks / schedules / file-watchers. defaultEntrypoint src/runtime/trigger-processor.ts, concurrencyEnvVar TRIGGER_CONCURRENCY (default 10), servicePort 8093." },
    { name: "stream", type: "utility / plugin", desc: "Infra/utility plugin. requiresDb=false, requiresKv=false, portRangeKey PLUGIN_API, servicePort 4437." }
  ]
}) }}

A worker-archetype descriptor looks like this — copy the shape and change the names. The
`officialSource` block is what the official plugins carry; for a custom plugin you set
`canonicalName`, `servicePort`, and any `dependencies` your plugin needs wired ahead of it:

{{ comp.tabbedCode({ tabs: [
  {
    label: "scaffold.plugin.json",
    lang: "json",
    code: "{\n  \"provider\": {\n    \"kind\": \"worker\",\n    \"category\": \"background-processor\",\n    \"defaultEntrypoint\": \"bin/combined.ts\",\n    \"defaultServiceEntrypoint\": \"services/src/main.ts\",\n    \"defaultRequiresDb\": true,\n    \"defaultRequiresKv\": true,\n    \"concurrencyEnvVar\": \"WORKER_CONCURRENCY\"\n  },\n  \"officialSource\": {\n    \"canonicalName\": \"notifier\",\n    \"servicePort\": 8095,\n    \"dependencies\": [\"streams\"]\n  }\n}"
  },
  {
    label: "What the kernel reads it for",
    lang: "ts",
    code: "// provider.kind          -> which contribution category to scan for\n// defaultEntrypoint       -> the background processor aspire starts\n// defaultServiceEntrypoint-> the API service aspire starts (if any)\n// defaultRequiresDb / Kv  -> whether to provision Postgres / Redis for it\n// concurrencyEnvVar       -> env var that caps processor concurrency\n// officialSource.servicePort -> the HTTP port the service binds\n// officialSource.dependencies -> plugins wired BEFORE this one in the graph"
  }
] }) }}

{{ comp callout { type: "warning", title: "Pick a free port" } }}
The official plugins claim <code>:8091</code> (workers), <code>:8092</code> (sagas),
<code>:8093</code> (triggers), <code>:8094</code> (<strong>auth</strong>), and <code>:4437</code>
(streams). Choose a <strong>different</strong> port for your custom plugin's service (for example
<code>:8095</code>) so it does not collide in the Aspire graph.
{{ /comp }}

## Step 3 — Export the manifest from `mod.ts`

`mod.ts` is the plugin's public surface. It exports the **manifest** — built with the
`definePlugin(name, version)` fluent builder from `@netscript/plugin` — plus an `inspect*` helper,
mirroring the official plugins. The builder is the doctrine-true way to assemble a manifest: each
`withX(...)` method adds one contribution axis, and `.build()` validates the result against the
manifest schema and freezes it. Follow the same convention the scaffold emits:

{{ comp.tabbedCode({ tabs: [
  {
    label: "plugins/notifier/mod.ts",
    lang: "ts",
    code: "// Public manifest for the notifier plugin.\n// Mirrors the official plugins: build the manifest with definePlugin(...),\n// then export it alongside an inspect helper.\nimport { definePlugin } from '@netscript/plugin';\n\nexport const NOTIFIER_PLUGIN_ID = 'notifier' as const;\nexport const NOTIFIER_API_DEFAULT_PORT = 8095 as const;\n\nexport const notifierPlugin = definePlugin('@notifier/plugin', '0.1.0')\n  .withDescription('Delivers user notifications via worker jobs.')\n  .withLicense('MIT')\n  .withAuthor('Acme Platform Team')\n  .withDependencies({ streams: true })\n  .withE2e([{ name: 'notifier.smoke', command: 'deno test --allow-all tests/' }])\n  .build();\n\nexport const inspectNotifier = () => ({\n  id: NOTIFIER_PLUGIN_ID,\n  version: notifierPlugin.version,\n  port: NOTIFIER_API_DEFAULT_PORT,\n});\n\nexport default notifierPlugin;"
  },
  {
    label: "Contribution axes on the builder",
    lang: "ts",
    code: "// definePlugin(name, version) returns a PluginBuilder. Each axis is one\n// withX(...) call; .build() validates + freezes the manifest.\n//\n//   .withService(...)             -> an oRPC/API service contribution\n//   .withBackgroundProcessor(...) -> a worker/saga processor entrypoint\n//   .withStreamTopics([...])      -> durable stream topic schemas\n//   .withDbSchemas([...])         -> Prisma models aggregated at db generate\n//   .withContractVersions([...])  -> versioned oRPC contracts\n//   .withRuntimeConfigTopics([...]) -> runtime-config schemas\n//   .withMigrations([...])        -> DB migration contributions\n//   .withE2e([...])               -> merge-readiness gates\n//   .withDependencies({...})      -> plugins wired ahead of this one\n//   .withAspire(modulePath)       -> the Aspire contribution module\n//   .build()                      -> immutable, schema-validated manifest"
  },
  {
    label: "plugins/notifier/deno.json",
    lang: "json",
    code: "{\n  \"name\": \"@notifier/plugin\",\n  \"version\": \"0.1.0\",\n  \"exports\": {\n    \".\": \"./mod.ts\",\n    \"./contracts\": \"./contracts/v1/mod.ts\"\n  },\n  \"imports\": {\n    \"@netscript/plugin\": \"jsr:@netscript/plugin\",\n    \"@netscript/plugin-workers-core\": \"jsr:@netscript/plugin-workers-core\",\n    \"zod\": \"jsr:@zod/zod@4.4.3\"\n  }\n}"
  }
] }) }}

The manifest is data, not behavior: it declares *what* the plugin is (name, version, dependencies)
and *which contribution axes* it owns. The actual capability lives in the contribution modules you
write next, which the registry binds to the kernel. See the [plugin reference](/reference/plugin/)
for the full builder surface and the manifest type it produces.

## Step 4 — Author a contribution

A contribution is a typed module the registry scans and exposes to the runtime. The shape depends on
your `provider.kind`:

{{ comp.apiTable({
  caption: "Contribution authoring API by kind",
  rows: [
    { name: "worker", type: "defineJobHandler", desc: "A job: defineJobHandler(async (ctx) => …) + createSuccessResult/createFailureResult; id via Object.assign(handler, { id }). Lives in jobs/." },
    { name: "saga", type: "defineSaga(id)…build()", desc: "Fluent builder: .durability('t1').state<S>({…}).on<Type,Payload>(type, fn).build(); effects via sagaComplete({…}). Durable store is kv | prisma." },
    { name: "trigger", type: "defineWebhook", desc: "defineWebhook(handler, { id, path, verifier, tags }); handler returns enqueueJob(jobRef, { payload, priority })[]. The service speaks a typed v1 oRPC contract for trigger/event introspection and management; the webhook ingress endpoint stays a raw signature-verifying route by design. enqueueJob is live; defer throws + routes to DLQ." },
    { name: "stream", type: "createDurableStream / defineStreamSchema", desc: "Real producer runtime via @netscript/plugin-streams-core. The @netscript/plugin-streams manifest helpers (defineStreamProducer/Consumer) fail loud — they throw StreamUnsupportedOperationError." }
  ]
}) }}

For a worker-archetype plugin, a contribution is an ordinary job handler. This is the exact authoring
API the official workers plugin uses — drop the file in `plugins/notifier/jobs/`:

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
    code: "import { createDurableStream, defineStreamSchema } from '@netscript/plugin-streams-core';\n\n// The producer runtime is REAL. createDurableStream serves a durable\n// stream (an Aspire service on :4437) you can upsert/delete/flush against.\nconst schema = defineStreamSchema({ /* topic entity schema */ });\nconst producer = createDurableStream({\n  streamPath: '/notifier/events',\n  schema,\n  producerId: 'notifier-service',\n});\nproducer.upsert('event', { id: 'evt-1', status: 'sent' });"
  }
] }) }}

{{ comp callout { type: "warning", title: "Edges: trigger ingress is a raw route, stream helpers fail loud" } }}
Two reality checks the official plugins make explicit. <strong>Triggers</strong> serve a
<strong>typed v1 oRPC contract</strong> for trigger/event introspection and management, but the
<strong>webhook ingress endpoint</strong> (<code>POST /api/v1/webhooks/:triggerId</code>) stays a
<strong>raw signature-verifying route</strong> by design — it verifies an HMAC signature over the raw
request bytes, which oRPC's schema parsing cannot do, so third-party senders (with no NetScript
client) POST to that plain URL; the supported action is <code>enqueueJob</code> (live), while
<code>defer</code> is defined-but-unsupported (it <strong>throws</strong> and routes to the DLQ — no
deferred replay). <strong>Streams</strong> are
split: the <strong>producer runtime is real</strong> via
<code>@netscript/plugin-streams-core</code>'s <code>createDurableStream</code> (served as an Aspire
service on <code>:4437</code> and used by the workers, auth, and sagas plugins). Only the
<code>@netscript/plugin-streams</code> manifest helpers
(<code>defineStreamProducer</code> / <code>defineStreamConsumer</code>) are unsupported — they
<strong>fail loud</strong>, throwing <code>StreamUnsupportedOperationError</code>, and redirect you
to the core package. There is no in-process consumer <code>subscribe()</code>; consume over HTTP/SSE.
See <a href="/capabilities/streams/">Streams</a> for the producer-vs-helper split.
{{ /comp }}

## Step 5 — Register the plugin in `netscript.config.ts`

The kernel only loads plugins listed in the config, so the generated connector's `mod.ts` has to
appear in the `plugins` array. **If you scaffolded through the CLI, this already happened.** Both
wiring commands run a workspace mutator that adds the connector to `netscript.config.ts` for you:

- `netscript plugin new <name>` — the greenfield generator from [Step 1](#step-1-scaffold-the-two-tier-skeleton) —
  registers the connector it emits; the `--register` flag defaults to on.
- `netscript plugin install <kind> --name <name> --local-path <path>` — installs a plugin workspace
  from a local package directory and registers it as part of the same install.

After either command, open `netscript.config.ts` and confirm the entry is present — the entries are
**`./plugins/<name>/mod.ts`**, confirming `plugins/<name>/` as the canonical location.

Only reach for the manual edit below if you are hand-authoring the connector without the CLI: add
the `mod.ts` path to the `plugins` array yourself.

{{ comp.tabbedCode({ tabs: [
  {
    label: "netscript.config.ts",
    lang: "ts",
    code: "import { defineConfig } from '@netscript/config';\n\nexport default defineConfig({\n  name: 'my-app',\n  version: '1.0.0',\n  paths: { services: 'services', apps: 'apps', contracts: 'contracts', plugins: 'plugins' },\n  plugins: [\n    './plugins/streams/mod.ts',\n    './plugins/workers/mod.ts',\n    './plugins/sagas/mod.ts',\n    './plugins/triggers/mod.ts',\n    './plugins/notifier/mod.ts', // ← your custom plugin\n  ],\n});"
  }
] }) }}

## Step 6 — Generate the registry

Listing the plugin is not enough — the runtime addresses contributions through a **generated
registry**. For a worker-archetype plugin, the generator scans `plugins/<name>/jobs/` and writes a
jobs registry (e.g. `.netscript/generated/plugin-<name>/job-registry.ts`) keyed by each handler's
`id`. Generate it:

```sh
netscript generate plugins
```

If your plugin contributes runtime configuration schemas, also generate those:

```sh
netscript generate runtime-schemas
```

After generation, your contribution is discoverable by its `id` (a job at
`POST /api/v1/<name>/jobs/{id}/trigger`, a webhook at `POST /api/v1/webhooks/<path>`, and so on).

{{ comp callout { type: "note", title: "Regenerate after every contribution change" } }}
The registry is a build artifact, not a live scan. Any time you add, rename, or remove a
contribution module, re-run <code>netscript generate</code> and restart <code>aspire start</code> (or
let it hot-reload) so the service and its background processor pick up the new registry.
{{ /comp }}

## Step 7 — Verify it is wired up

List the registry and run the health check to confirm the kernel sees your plugin:

```sh
netscript plugin list      # your plugin should appear in the registry
netscript plugin doctor    # checks plugin health and reports wiring problems
```

With Aspire running, your plugin's service is live on the port you chose. Confirm it and exercise a
contribution — for the `notifier` worker example on `:8095`:

```sh
curl http://localhost:8095/health
curl http://localhost:8095/api/v1/notifier/jobs

curl -X POST http://localhost:8095/api/v1/notifier/jobs/send-notification/trigger \
  -H 'content-type: application/json' \
  -d '{ "payload": { "userId": "user-42" } }'
```

You should see the contribution registered in the jobs list and an execution recorded after you
trigger it. Watch it live in the Aspire dashboard at
[https://localhost:18888](https://localhost:18888) under your plugin's resource.

## A real multi-package exemplar: the auth plugin

When your plugin grows beyond a single package — a core seam plus swappable adapters plus one service
— the **auth plugin** is the production reference to copy. It is built from five units:

{{ comp.apiTable({
  caption: "Auth plugin topology (a multi-package plugin)",
  rows: [
    { name: "@netscript/plugin-auth-core", type: "core seam", desc: "Defines AuthBackendPort, domain types, contracts/v1, and stream events. Adapters depend on it; it depends on no adapter." },
    { name: "@netscript/auth-kv-oauth", type: "backend adapter", desc: "Interactive OAuth/OIDC backend (the only backend with an interactive sign-in flow). Default backend." },
    { name: "@netscript/auth-workos", type: "backend adapter", desc: "Non-interactive WorkOS AuthKit backend; signin/callback return unsupported on this backend." },
    { name: "@netscript/auth-better-auth", type: "backend adapter", desc: "Non-interactive better-auth backend; signin/callback return unsupported on this backend." },
    { name: "@netscript/plugin-auth (plugins/auth/)", type: "unifying plugin", desc: "Composes ONE active backend (NETSCRIPT_AUTH_BACKEND, default kv-oauth) into one oRPC service (auth-api on :8094)." }
  ]
}) }}

The pattern to copy: a **core package owns the port** (`AuthBackendPort`), each **adapter is pure**
(implements the port, declares no service), and the **plugin under `plugins/<name>/`** composes one
active adapter into a single service and registry. That keeps adapters swappable and the kernel-facing
manifest small. Build the full thing in [Add authentication](/how-to/add-authentication/) — that page
is the concrete walkthrough for the auth plugin specifically.

{{ comp callout { type: "note", title: "Alpha package pins" } }}
CLI scaffolds pin <code>jsr:@netscript/plugin-auth-core{{ releaseSpecifier }}</code> and siblings
at the exact aligned alpha version. Keep generated plugin workspaces on one NetScript release train.
{{ /comp }}

## Production pitfalls

{{ comp callout { type: "warning", title: "Read before you ship a custom plugin" } }}
<ul>
<li><strong>Aspire not running</strong> — a plugin's API service and background processor are Aspire
resources. If endpoints 404 or jobs never execute, <code>aspire start</code> from <code>aspire/</code>
is almost always the cause. DB-backed plugins also need it up before <code>netscript db</code>.</li>
<li><strong>Stale registry</strong> — the runtime reads a generated registry, not your source tree.
Forgetting <code>netscript generate</code> after adding a contribution is the most common "my job
isn't registered" bug. Regenerate, then restart Aspire.</li>
<li><strong>Port collision</strong> — do not reuse <code>:8091</code>/<code>:8092</code>/<code>:8093</code>/<code>:8094</code>/<code>:4437</code>.
Set a free <code>servicePort</code> in both <code>scaffold.plugin.json</code> and
<code>mod.ts</code>.</li>
<li><strong>Wrong canonical directory</strong> — author in <code>plugins/&lt;name&gt;/</code>, the
directory <code>netscript.config.ts</code> references. Edits to a top-level staging copy are not the
source of truth.</li>
<li><strong>Mismatched archetype expectations</strong> — a <code>trigger</code> plugin serves a typed
v1 oRPC contract for introspection/management while keeping the webhook ingress endpoint a raw
signature-verifying route, and only the <code>enqueueJob</code> action is live; a <code>stream</code>
plugin's real runtime is the <em>producer</em> in <code>@netscript/plugin-streams-core</code>, while
the <code>@netscript/plugin-streams</code> manifest helpers throw
<code>StreamUnsupportedOperationError</code>. Match your plugin's behavior to its declared
<code>provider.kind</code>.</li>
<li><strong>Unstated dependencies</strong> — if your plugin needs another plugin wired ahead of it,
declare it with <code>.withDependencies({...})</code> on the manifest and in
<code>officialSource.dependencies</code> so the Aspire graph orders them correctly.</li>
</ul>
{{ /comp }}

## See also

<div class="ns-card-grid">

{{ comp.card({
  title: "Add a first-party plugin",
  body: "Install one of the four official plugins instead of writing your own.",
  href: "/how-to/add-a-plugin/",
  icon: "+"
}) }}

{{ comp.card({
  title: "Add authentication",
  body: "Build the multi-package auth plugin — the production exemplar for a core seam plus swappable backends.",
  href: "/how-to/add-authentication/",
  icon: "→"
}) }}

{{ comp.card({
  title: "The plugin system",
  body: "Why plugins are thread-isolated background processors, and how the kernel loads them.",
  href: "/explanation/plugin-system/",
  icon: "◆"
}) }}

{{ comp.card({
  title: "plugin reference",
  body: "The generated @netscript/plugin API — definePlugin builder, manifest type, contribution shapes.",
  href: "/reference/plugin/",
  icon: "§"
}) }}

{{ comp.card({
  title: "Aspire orchestration",
  body: "The AppHost resource graph that runs your plugin's service and background processor.",
  href: "/explanation/aspire/",
  icon: "▣"
}) }}

</div>
