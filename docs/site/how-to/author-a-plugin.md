---
layout: layouts/base.vto
title: Author a plugin
templateEngine: [vento, md]
prev: { label: "Deploy", href: "/how-to/deploy/" }
next: null
---

# Author a plugin

**Scope.** This recipe shows how to author a *new* custom plugin from scratch — its canonical
location, the manifest it exports, the contribution shape the kernel reads, and the registry that
makes its contributions discoverable at runtime. It is the advanced companion to
[Add a first-party plugin](/how-to/add-a-plugin/), which only *installs* one of the four official
plugins (`workers`, `sagas`, `triggers`, `streams`). If you just want a worker or a saga, install it
there. Come here when you need a capability NetScript does not ship.

A NetScript plugin is a workspace member under **`plugins/<name>/`** whose `mod.ts` exports a plugin
**manifest**. The framework discovers it because `netscript.config.ts` lists `./plugins/<name>/mod.ts`,
and it discovers the plugin's *contributions* (jobs, webhooks, topics, services) through a generated
**registry**. Get those three things right — location, manifest, registry — and the kernel wires the
rest.

{{ comp callout { type: "important", title: "Aspire is the control plane — start it first" } }}
If your plugin contributes an API service or a background processor, those run as resources in the
Aspire graph alongside Postgres and Garnet. Bring orchestration up <strong>before</strong> you run
any <code>netscript db</code> command or exercise your plugin's endpoints: from the project root,
<code>cd aspire &amp;&amp; aspire run</code> (dashboard at
<a href="http://localhost:18888">http://localhost:18888</a>). DB commands require Aspire running
first. See <a href="/explanation/aspire/">the Aspire explanation</a> for the resource graph.
{{ /comp }}

## Before you start

You need an existing workspace and a clear idea of what your plugin *contributes*. The official
plugins are the reference implementations — read one that resembles your goal before you write a
line.

{{ comp.apiTable({
  caption: "Prerequisites",
  rows: [
    { name: "Workspace", type: "netscript init", desc: "An existing project. If you have none, scaffold one first — see the tutorials." },
    { name: "netscript CLI", type: "on PATH", desc: "Installed globally: deno install --global --allow-all --name netscript jsr:@netscript/cli/bin/netscript.ts. Confirm with netscript --help." },
    { name: "A reference plugin", type: "plugins/<name>/", desc: "Install a first-party plugin with --samples and read its mod.ts + scaffold.plugin.json as your template." },
    { name: "Provider kind", type: "worker | saga | trigger | stream | plugin", desc: "Decide which archetype your plugin is. Utility/infra plugins use kind 'stream' or the generic 'plugin'." }
  ]
}) }}

Throughout, run commands from your workspace root.

## Step 1 — Create the plugin directory

The canonical, config-referenced home for every plugin is **`plugins/<name>/`** — that is where
`netscript.config.ts` points and where you author. A scaffold may also leave a slimmer top-level
`<name>/` workspace member that stages a subset of files for a background processor; **`plugins/<name>/`
is the real source of truth.** Edit there.

The fastest way to get a correct skeleton is to install a first-party plugin whose archetype matches
yours, then read and adapt it:

```sh
netscript plugin add worker --samples   # gives you plugins/workers/ to study
```

A minimal hand-authored plugin needs only a `mod.ts` manifest and a `scaffold.plugin.json` manifest
descriptor. A capability-bearing plugin adds contribution modules, a `deno.json`, and (optionally) a
`services/`, `bin/`, `database/`, and `contracts/` tree:

```
plugins/notifier/
├── mod.ts                 # ← public manifest: exports the plugin object + an inspect fn
├── scaffold.plugin.json   # ← manifest descriptor read by the CLI/kernel (provider.kind, ports…)
├── deno.json              # workspace member: name, exports, import map
├── contracts/v1/          # (optional) oRPC contract re-exports, frontend-safe
├── database/notifier.prisma  # (optional) plugin's Prisma models, aggregated at db generate
├── services/src/          # (optional) the plugin's API service (main.ts, router.ts)
└── bin/combined.ts        # (optional) background-processor entrypoint
```

{{ comp callout { type: "note", title: "Two trees, one canonical home" } }}
If you see both <code>plugins/notifier/</code> and a top-level <code>notifier/</code> after a
scaffold, that is expected: the top-level copy is a background-processor staging member.
<code>netscript.config.ts</code> references <strong><code>./plugins/notifier/mod.ts</code></strong>,
and that is the directory you author in.
{{ /comp }}

## Step 2 — Write the manifest descriptor (`scaffold.plugin.json`)

`scaffold.plugin.json` is the static descriptor the CLI and kernel read to understand your plugin's
*archetype* and runtime needs. The single most important field is **`provider.kind`** — it tells the
framework what category of contributions to expect. The official plugins set it as follows, and your
plugin should pick the closest match:

{{ comp.apiTable({
  caption: "provider.kind by archetype (from the official scaffold.plugin.json files)",
  rows: [
    { name: "worker", type: "background-processor", desc: "Job handlers run by a worker processor. defaultEntrypoint bin/combined.ts, concurrencyEnvVar WORKER_CONCURRENCY (default 2), servicePort 8091." },
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
    code: "{\n  \"provider\": {\n    \"kind\": \"worker\",\n    \"category\": \"background-processor\",\n    \"defaultEntrypoint\": \"bin/combined.ts\",\n    \"defaultServiceEntrypoint\": \"services/src/main.ts\",\n    \"defaultRequiresDb\": true,\n    \"defaultRequiresKv\": true,\n    \"concurrencyEnvVar\": \"WORKER_CONCURRENCY\"\n  },\n  \"officialSource\": {\n    \"canonicalName\": \"notifier\",\n    \"servicePort\": 8094,\n    \"dependencies\": [\"streams\"]\n  }\n}"
  },
  {
    label: "What the kernel reads it for",
    lang: "ts",
    code: "// provider.kind          -> which contribution category to scan for\n// defaultEntrypoint       -> the background processor Aspire runs\n// defaultServiceEntrypoint-> the API service Aspire runs (if any)\n// defaultRequiresDb / Kv  -> whether to provision Postgres / Garnet for it\n// concurrencyEnvVar       -> env var that caps processor concurrency\n// officialSource.servicePort -> the HTTP port the service binds\n// officialSource.dependencies -> plugins wired BEFORE this one in the graph"
  }
] }) }}

{{ comp callout { type: "warning", title: "Pick a free port" } }}
The official plugins claim <code>:8091</code> (workers), <code>:8092</code> (sagas),
<code>:8093</code> (triggers), and <code>:4437</code> (streams). Choose a
<strong>different</strong> port for your custom plugin's service (for example <code>:8094</code>) so
it does not collide in the Aspire graph.
{{ /comp }}

## Step 3 — Export the manifest from `mod.ts`

`mod.ts` is the plugin's public surface. It exports the **plugin object** (the manifest the kernel
loads) plus an `inspect*` helper, mirroring the official plugins — for example workers'
`mod.ts` exports `{ workersPlugin, inspectWorkers }`, sagas exports
`{ sagasPlugin, inspectSagas, SAGAS_API_DEFAULT_PORT, SAGAS_PLUGIN_ID }`, and triggers exports
`{ triggersPlugin, inspectTriggers, TRIGGERS_API_DEFAULT_PORT }`. Follow the same convention:

{{ comp.tabbedCode({ tabs: [
  {
    label: "plugins/notifier/mod.ts",
    lang: "ts",
    code: "// Public manifest for the notifier plugin.\n// Mirrors the official plugins: export the plugin object + an inspect helper.\nexport const NOTIFIER_PLUGIN_ID = 'notifier' as const;\nexport const NOTIFIER_PLUGIN_VERSION = '1.0.0' as const;\nexport const NOTIFIER_API_DEFAULT_PORT = 8094 as const;\n\nexport const notifierPlugin = Object.freeze({\n  id: NOTIFIER_PLUGIN_ID,\n  version: NOTIFIER_PLUGIN_VERSION,\n  kind: 'worker',\n  servicePort: NOTIFIER_API_DEFAULT_PORT,\n  dependencies: ['streams'],\n});\n\nexport const inspectNotifier = () => ({\n  id: NOTIFIER_PLUGIN_ID,\n  version: NOTIFIER_PLUGIN_VERSION,\n  port: NOTIFIER_API_DEFAULT_PORT,\n});\n\nexport default notifierPlugin;"
  },
  {
    label: "plugins/notifier/deno.json",
    lang: "json",
    code: "{\n  \"name\": \"@notifier/plugin\",\n  \"version\": \"1.0.0\",\n  \"exports\": {\n    \".\": \"./mod.ts\",\n    \"./contracts\": \"./contracts/v1/mod.ts\"\n  },\n  \"imports\": {\n    \"@netscript/plugin-workers-core\": \"jsr:@netscript/plugin-workers-core\",\n    \"zod\": \"jsr:@zod/zod@4.4.3\"\n  }\n}"
  }
] }) }}

The plugin object is data, not behavior: it declares *what* the plugin is (id, kind, port,
dependencies). The actual capability lives in the contribution modules you write next, which the
registry binds to the kernel.

## Step 4 — Author a contribution

A contribution is a typed module the registry scans and exposes to the runtime. The shape depends on
your `provider.kind`:

{{ comp.apiTable({
  caption: "Contribution authoring API by kind",
  rows: [
    { name: "worker", type: "defineJobHandler", desc: "A job: defineJobHandler(async (ctx) => …) + createSuccessResult/createFailureResult; id via Object.assign(handler, { id }). Lives in jobs/." },
    { name: "saga", type: "defineSaga(id)…build()", desc: "Fluent builder: .durability('t1').state<S>({…}).on<Type,Payload>(type, fn).build(); effects via sagaComplete({…})." },
    { name: "trigger", type: "defineWebhook", desc: "defineWebhook(handler, { id, path, verifier, tags }); handler returns enqueueJob(jobRef, { payload, priority })[]. Raw Hono routes, NOT oRPC." },
    { name: "stream", type: "defineStreamTopic", desc: "defineStreamTopic(name, schema); producer/consumer (defineStreamProducer/Consumer) are stubs — topic-runtime is deferred." }
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
    label: "Trigger archetype (Hono, not oRPC)",
    lang: "ts",
    code: "import { defineWebhook, enqueueJob } from '@netscript/plugin-triggers-core/builders';\n\n// A webhook contribution: returns an array of enqueueJob effects that\n// bind inbound HTTP to worker jobs. The triggers service mounts raw Hono\n// routes — there is no oRPC contract layer here.\nexport const inbound = defineWebhook(\n  () => Promise.resolve([\n    enqueueJob(jobRef, { payload: { verbose: false }, priority: 50 }),\n  ]),\n  { id: 'notifier-inbound', path: 'inbound/notify', verifier: 'memory', tags: ['webhook'] },\n);\nexport default inbound;"
  }
] }) }}

{{ comp callout { type: "warning", title: "Honest edges: triggers are Hono, streams are stubs" } }}
Two reality checks the official plugins make explicit. <strong>Triggers</strong> expose
<strong>raw Hono routes</strong>, not oRPC — the triggers service mounts
<code>app.route('/api/v1/webhooks', …)</code> and dispatches by trigger id; do not expect an oRPC
contract for them. <strong>Streams</strong> producer/consumer handles
(<code>defineStreamProducer</code> / <code>defineStreamConsumer</code>) are
<strong>no-op stubs today</strong> — topic-centric pub/sub is deferred. Author stream
<em>topic schemas</em> with <code>@netscript/plugin-streams-core</code>; don't promise a live runtime
yet.
{{ /comp }}

## Step 5 — Register the plugin in `netscript.config.ts`

The kernel only loads plugins listed in the config. Add your plugin's `mod.ts` to the `plugins`
array — note the entries are **`./plugins/<name>/mod.ts`**, confirming `plugins/<name>/` as the
canonical location:

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
jobs registry (e.g. `.netscript/generated/plugin-<name>/jobs.registry.ts`) keyed by each handler's
`id`. Generate it:

```sh
netscript generate
```

If your plugin contributes runtime configuration schemas, also generate those:

```sh
netscript generate runtime-schemas
```

After generation, your contribution is discoverable by its `id` (a job at
`POST /api/v1/<name>/jobs/{id}/trigger`, a webhook at `POST /api/v1/webhooks/<path>`, and so on).

{{ comp callout { type: "note", title: "Regenerate after every contribution change" } }}
The registry is a build artifact, not a live scan. Any time you add, rename, or remove a
contribution module, re-run <code>netscript generate</code> and restart <code>aspire run</code> (or
let it hot-reload) so the service and its background processor pick up the new registry.
{{ /comp }}

## Step 7 — Verify it is wired up

List the registry and run the health check to confirm the kernel sees your plugin:

```sh
netscript plugin list      # your plugin should appear in the registry
netscript plugin doctor    # checks plugin health and reports wiring problems
```

With Aspire running, your plugin's service is live on the port you chose. Confirm it and exercise a
contribution — for the `notifier` worker example on `:8094`:

```sh
curl http://localhost:8094/health
curl http://localhost:8094/api/v1/notifier/jobs

curl -X POST http://localhost:8094/api/v1/notifier/jobs/send-notification/trigger \
  -H 'content-type: application/json' \
  -d '{ "payload": { "userId": "user-42" } }'
```

You should see the contribution registered in the jobs list and an execution recorded after you
trigger it. Watch it live in the Aspire dashboard at
[http://localhost:18888](http://localhost:18888) under your plugin's resource.

## Production pitfalls

{{ comp callout { type: "warning", title: "Read before you ship a custom plugin" } }}
<ul>
<li><strong>Aspire not running</strong> — a plugin's API service and background processor are Aspire
resources. If endpoints 404 or jobs never execute, <code>aspire run</code> from <code>aspire/</code>
is almost always the cause. DB-backed plugins also need it up before <code>netscript db</code>.</li>
<li><strong>Stale registry</strong> — the runtime reads a generated registry, not your source tree.
Forgetting <code>netscript generate</code> after adding a contribution is the most common "my job
isn't registered" bug. Regenerate, then restart Aspire.</li>
<li><strong>Port collision</strong> — do not reuse <code>:8091</code>/<code>:8092</code>/<code>:8093</code>/<code>:4437</code>.
Set a free <code>servicePort</code> in both <code>scaffold.plugin.json</code> and
<code>mod.ts</code>.</li>
<li><strong>Wrong canonical directory</strong> — author in <code>plugins/&lt;name&gt;/</code>, the
directory <code>netscript.config.ts</code> references. Edits to a top-level staging copy are not the
source of truth.</li>
<li><strong>Mismatched archetype expectations</strong> — a <code>trigger</code> plugin serves raw
Hono routes (no oRPC), and a <code>stream</code> plugin's producer/consumer runtime is stubbed.
Match your plugin's behavior to its declared <code>provider.kind</code>.</li>
<li><strong>Unstated dependencies</strong> — if your plugin needs another plugin wired ahead of it,
declare it in <code>officialSource.dependencies</code> so the Aspire graph orders them correctly.</li>
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
  title: "The plugin model",
  body: "Why plugins are thread-isolated background processors, and how the kernel loads them.",
  href: "/explanation/plugin-model/",
  icon: "◆"
}) }}

{{ comp.card({
  title: "plugin reference",
  body: "The generated @netscript/plugin API — manifest types, contribution shapes, host surface.",
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
