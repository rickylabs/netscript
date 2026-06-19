---
layout: layouts/base.vto
title: Durable streams
templateEngine: [vento, md]
prev: { label: "Triggers & ingress", href: "/capabilities/triggers/" }
next: { label: "Database & Prisma", href: "/capabilities/database/" }
---

{{ comp.breadcrumb() }}

# Durable streams

NetScript's streams capability is the typed, change-data backbone the other
plugins lean on — workers, sagas, and triggers all declare `streams` as a
dependency. The `streams` plugin lives at `plugins/streams/`, runs a
durable-streams dev service on port **:4437**, and gives you a small,
type-safe authoring surface for describing event topics.

It is also the most honest page in this section. The topic *schema* surface is
real and ships today; the *runtime* — actually publishing and consuming events
through those topics — is still being built. The producer and consumer handles
you get back are deliberate no-op **stubs**, and the topic-centric pub/sub APIs
are deferred. This page draws that line clearly so you build against what
exists, not against an aspiration.

{{ comp callout { type: "warning", title: "Status — alpha, runtime stubbed" } }}
<code>defineStreamTopic(...)</code> is real and type-safe today. But the handles from
<code>defineStreamProducer(...)</code> and <code>defineStreamConsumer(...)</code> are
<strong>no-op stubs</strong> in the scaffolded plugin: <code>publish()</code> resolves without
emitting anything and <code>subscribe()</code> returns an unsubscribe callback that does nothing.
The topic-centric pub/sub runtime is <strong>deferred</strong>. The plugin's own recipe doc says it
plainly: <em>"Topic-centric APIs are deferred. Define entity-oriented stream schemas with
<code>@netscript/plugin-streams-core</code> today."</em> Treat streams as the topic-schema authoring
surface plus the durable-streams dev service on <code>:4437</code> — not a live pub/sub bus yet.
{{ /comp }}

## The intended model

Streams is designed around a familiar three-part shape: you **define a topic**
(a name plus a payload schema), get a **producer** that publishes payloads onto
it, and a **consumer** that subscribes to receive them. The topic definition is
the type contract that locks producer and consumer to the same payload shape —
contracts-first, the same instinct as oRPC services but for event flow instead
of request/response.

```text
defineStreamTopic("orders", schema)   ── the typed contract (REAL today)
        │
        ├── defineStreamProducer(topic).publish(payload)   ── runtime STUB
        │
        └── defineStreamConsumer(topic).subscribe(handler)  ── runtime STUB
```

When the runtime lands, the producer/consumer handles will drive real durable
streams (change-data capture, replayable event logs) through the
`:4437` service. Today, the contract half is what you can build on; the
transport half is stubbed.

## Headline API — what actually exists

The typed topic/producer/consumer helpers are exported from the plugin manifest
root, `@netscript/plugin-streams`. `defineStreamTopic` is the load-bearing one:
it freezes a `{ name, schema }` pair into a `StreamTopicDefinition`. The payload
schema uses [Standard Schema](https://standardschema.dev) (the `~standard`
contract), so it interops with zod and other Standard-Schema validators.

{{ comp.tabbedCode({ tabs: [
  {
    label: "Define a topic (real)",
    lang: "ts",
    code: "// plugins/streams/ — author against the manifest root export.\nimport { defineStreamTopic } from '@netscript/plugin-streams';\nimport { z } from 'zod';\n\n// A topic is a name + a payload schema. This is the typed contract\n// the producer and consumer are locked to. This part is real today.\nexport const ordersTopic = defineStreamTopic('orders', z.object({\n  orderId: z.string().min(1),\n  total: z.number().nonnegative(),\n  placedAt: z.string().datetime(),\n}));\n\n// `ordersTopic` is a frozen { name, schema } StreamTopicDefinition."
  },
  {
    label: "Producer / consumer (STUBS)",
    lang: "ts",
    code: "import {\n  defineStreamProducer,\n  defineStreamConsumer,\n} from '@netscript/plugin-streams';\nimport { ordersTopic } from './orders-topic.ts';\n\n// WARNING: in the scaffolded plugin these handles are no-op stubs.\nconst producer = defineStreamProducer(ordersTopic);\nconst consumer = defineStreamConsumer(ordersTopic);\n\n// publish() resolves but emits NOTHING yet (deferred runtime).\nawait producer.publish({ orderId: 'o-1', total: 42, placedAt: new Date().toISOString() });\n\n// subscribe() returns an unsubscribe fn that does NOTHING yet.\nconst unsubscribe = consumer.subscribe((_payload) => {\n  // never invoked in the current stub runtime\n});\nunsubscribe();"
  },
  {
    label: "Stub source (verbatim)",
    lang: "ts",
    code: "// plugins/streams/src/public/stream-api.ts — the actual stub bodies.\nexport const defineStreamTopic = <TPayload>(\n  name: string,\n  schema: StreamPayloadSchema<TPayload>,\n): StreamTopicDefinition<TPayload> => Object.freeze({ name, schema });\n\n// publish is a no-op; the durable transport is deferred.\nexport const defineStreamProducer = <TPayload>(\n  _topic: StreamTopicDefinition<TPayload>,\n): StreamProducerHandle<TPayload> => Object.freeze({ publish: async (_p) => {} });\n\n// subscribe returns a no-op unsubscribe; consumption is deferred.\nexport const defineStreamConsumer = <TPayload>(\n  _topic: StreamTopicDefinition<TPayload>,\n): StreamConsumerHandle<TPayload> => Object.freeze({ subscribe: (_h) => () => {} });"
  }
] }) }}

{{ comp callout { type: "important", title: "Use entity schemas today" } }}
For event modelling you can ship now, define <strong>entity-oriented stream schemas</strong> with
<code>@netscript/plugin-streams-core</code> rather than wiring topic-centric producers and consumers.
The topic helpers above are the forward-looking contract surface; the core package is where the
schema primitives the plugin builds on live.
{{ /comp }}

## Endpoints & manifest

The streams plugin is registered as a utility/infra plugin — note it requires
**neither a database nor KV** (`requiresDb=false`, `requiresKv=false`), unlike
workers, sagas, and triggers. Its dev service listens on `:4437`.

{{ comp.apiTable({
  title: "Streams plugin — runtime facts",
  columns: ["Property", "Value"],
  rows: [
    ["Plugin location", "<code>plugins/streams/</code>"],
    ["Manifest import", "<code>@netscript/plugin-streams</code> (topic/producer/consumer helpers)"],
    ["Schema primitives", "<code>@netscript/plugin-streams-core</code>"],
    ["Dev service port", "<code>:4437</code> (durable-streams dev service)"],
    ["Service entry", "<code>plugins/streams/services/src/main.ts</code>"],
    ["provider.kind", "<code>stream</code> · category <code>plugin</code> · pluginType <code>utility</code>"],
    ["Requires DB / KV", "<code>false</code> / <code>false</code>"],
    ["Topic API status", "<strong>Real</strong> — <code>defineStreamTopic</code>"],
    ["Producer / consumer status", "<strong>Stub</strong> — <code>publish</code>/<code>subscribe</code> are no-ops; runtime deferred"]
  ]
}) }}

The plugin is referenced from `netscript.config.ts` as
`./plugins/streams/mod.ts`, and its `appsettings.json` `Workdir` is
`plugins/streams`. Because workers, sagas, and triggers each list `streams` in
their `dependencies`, it is installed first in the dependency graph even though
its public runtime is still stubbed.

## Learn · Do · Reference

{{ comp.card({ items: [
  {
    title: "Learn — the plugin model",
    body: "How thread-isolated plugins like streams register contributions and wire into the Aspire resource graph.",
    href: "/explanation/plugin-model/",
    icon: "◆"
  },
  {
    title: "Do — add the streams plugin",
    body: "netscript plugin add stream --samples lands the plugin under plugins/streams/ with topic-schema samples.",
    href: "/how-to/add-a-plugin/",
    icon: "→"
  },
  {
    title: "Reference — @netscript/plugin-streams",
    body: "The full generated API for the manifest, topic helpers, and the four integration sub-path exports.",
    href: "/reference/streams/",
    icon: "≡"
  }
] }) }}

{{ comp callout { type: "tip", title: "Where the topic helpers come from" } }}
The manifest root export <code>@netscript/plugin-streams</code> re-exports
<code>defineStreamTopic</code>, <code>defineStreamProducer</code>, and
<code>defineStreamConsumer</code> alongside <code>streamsPlugin</code> and its contribution types.
See the <a href="/reference/streams/">full reference</a> for every exported symbol and the
<code>cli</code> / <code>scaffolding</code> / <code>e2e</code> / <code>aspire</code> sub-paths.
{{ /comp }}

{{ comp.nextPrev({ prev: { label: "Triggers & ingress", href: "/capabilities/triggers/" }, next: { label: "Database & Prisma", href: "/capabilities/database/" } }) }}
