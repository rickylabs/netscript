# Doc-story pass — deploy plugin family docs forecast

> Stage 3 deliverable of `plan-deploy-plugin--seed` (doc-driven story). Forecasts the public
> deploy documentation as if the plugin family had shipped through pluginization, per the r2
> canonical corpus (DP-0…DP-8 + plan.md). Every behavioral claim in the forecast pages traces to
> the corpus; seams the docs could not explain cleanly are reported as `KF-n` findings at the end.
> Forecast pages follow public-docs hygiene: no internal process, wave, issue-number, probe-id, or
> agent references.

## Docs IA outline

Proposed page tree for the deploy section (under Orchestration), replacing today's two-page
alpha-minimal surface. `★` = fully written below as a forecast page.

- **Deploy** (section index, explanation-leaning) — what a deploy target is, the eight-operation
  lifecycle (`plan`/`emit`/`up`/`down`/`status`/`logs`/`rollback`/`secrets`), capability verdicts
  and tiers at a glance; routes readers to the right how-to. Absorbs the concept half of today's
  `deploy.md`.
- how-to/**Deploy a NetScript workspace** ★ — the getting-started path: install the plugin, add
  the `deno-deploy` target, `plan` → `emit` → `up`, read capability output, split build vs deploy
  in CI with `up --prebuilt`. Replaces today's `deploy.md` (order 101, keeps `oldUrl`).
- how-to/**Deploy to Deno Deploy** — the Deno-native flagship target: config member, preflight,
  `secrets`/`rollback` ops, and the honest platform gaps (no in-platform queues, sagas
  externalized). Refresh of today's `deploy-deno-deploy.md`.
- how-to/**Deploy to Cloudflare Workers** ★ — the `workers` variant: emitted `wrangler.jsonc`,
  isolate-profile caveats, and what `suggestedCells` looks like when an app outgrows the isolate.
- how-to/**Deploy to AWS** — the `lambda` variant (HTTP scope, Deno container image fronted by
  Function URL/API GW), GitHub-OIDC CI auth, and the user-declared `fargate` second cell for
  long-lived work. (Stub — lands with the AWS adapter.)
- how-to/**Deploy to Vercel** — Build Output API emission, Node-default runtime with the
  community Deno runtime as opt-in, bounded-window caveats. (Stub — lands with the Vercel
  adapter.)
- how-to/**Deploy containers to a PaaS** — the shared container path: generated Dockerfile +
  thin platform clients (Fly.io, Koyeb, Sevalla, Coolify, Dokploy); the "everything just works"
  tier for stateful apps. (Stub — lands with the container adapter.)
- how-to/**Deploy to bare metal (Windows/Linux services)** — `deno compile` artifacts,
  Servy/systemd service lifecycle, activation + health-gated rollback conventions; where the
  legacy flat verbs live.
- how-to/**Deploy with Aspire** — the `compose`/`docker`/`kubernetes`/`azure-*` targets, unchanged
  in behavior, now owned by the Aspire adapter; evolves today's `deploy-local-aspire.md` and the
  Aspire sections of `deploy.md`.
- how-to/**Migrate from the built-in deploy commands** ★ — the compat map: which verbs and config
  keys survive verbatim, the one deliberate behavior change (unknown-target config error), and
  where `build`/`start`/`stop`/`upgrade` now live.
- reference/**Deploy target matrix** — every shipped target × variant × tier × process model ×
  declared ops × sagas state × required tool, generated from the capability manifests.
- reference/**`deploy capabilities` and `deploy doctor`** ★ — verdict levels and scopes, the
  manifest JSON surface, doctor diagnostic states, per-target permission profiles.
- reference/**CLI: deploy** — the full command group (eight ops, `target add/remove`,
  `capabilities`, `doctor`, legacy compat verbs) folded into the CLI reference.

---

## Forecast pages

### Page A — how-to: Deploy a NetScript workspace

````markdown
---
layout: layouts/base.vto
title: Deploy a NetScript workspace
templateEngine: [vento, md]
order: 101
oldUrl: /how-to/deploy/
---

# Deploy a NetScript workspace

**Goal:** take the workspace you scaffolded with `netscript init` and run it on a managed
platform — install the deploy plugin, add a target, check what that target can honestly run, and
ship it — using the same commands locally and in CI.

Deployment in NetScript is built from **targets you add explicitly**. A target is an adapter for
one platform: Deno Deploy, Cloudflare Workers, AWS, a container PaaS, or your own bare metal.
Every target declares the operations it supports and a **capability manifest** — a
machine-readable statement of what the platform can and cannot run. The CLI checks your app's
requirements against that manifest when you plan, so an impossible deployment fails before
anything leaves your machine — never silently at runtime.

{{ comp callout { type: "important", title: "What the plugin wires vs. what stays yours" } }}
<strong>Wired:</strong> the <code>netscript deploy</code> command group, per-target adapters,
capability checks at plan time, artifact emission, and starter CI workflows per target.
<strong>Yours:</strong> the cloud account, credentials, quotas, and regions. NetScript shells out
to each platform's own first-class tooling (<code>deno deploy</code>, <code>wrangler</code>,
<code>aspire</code>, <code>docker</code>) — it does not create credentials or hide the platform
from you.
{{ /comp }}

## Before you start

You need a healthy workspace and a platform account.

```bash
deno task check    # type-check apps, services, contracts
deno task lint
deno task test
```

New workspaces ship with the deploy plugin preinstalled. On an existing workspace, install it
once:

```bash
netscript plugin install deploy
```

This walkthrough deploys to **Deno Deploy**, the Deno-native default target. Have your
organization slug and app name ready, and confirm the native CLI resolves:
`deno deploy --help`.

## Step 1 — Add a target

```bash
netscript deploy target add deno-deploy
```

No target is preinstalled — every target is added explicitly, and you can add several side by
side. `target add` installs the target's adapter, registers it, and writes its starter assets:

{{ comp.apiTable({ caption: "What 'deploy target add deno-deploy' lands on disk", rows: [
  { name: "deploy/targets.ts", type: "declarations (you own this file)", desc: "The typed list of deploy targets for this workspace. <code>target add</code> appends; you edit it to declare environments or split an app into cells." },
  { name: "netscript.config.ts", type: "settings", desc: "A <code>deploy.targets['deno-deploy']</code> member holding this target's settings (org, app, entrypoint…)." },
  { name: ".github/workflows/deploy-deno-deploy.yml", type: "CI starter", desc: "A starter workflow using a <code>DENO_DEPLOY_TOKEN</code> organization token." },
  { name: "deno.json", type: "platform config", desc: "The <code>deploy</code> section the native platform reads." }
] }) }}

The config member keeps a repeatable push to one line; every field is optional and any flag wins
over config for that run:

```ts
// netscript.config.ts
export default {
  deploy: {
    targets: {
      "deno-deploy": {
        org: "my-org",          // Deno Deploy organization slug
        app: "my-app",          // application / project name
        entrypoint: "main.ts",  // default "main.ts"
        prod: false,            // default false; true pushes to production
        envFile: ".env.production",
      },
    },
  },
};
```

## Step 2 — Plan (preflight + capability check)

```bash
netscript deploy deno-deploy plan
```

`plan` changes nothing — it touches neither your artifact directories nor the platform. It
resolves what you would deploy, runs the target's preflight checks, and compiles your app's
requirements against the target's capability manifest. The verdict table is the part to read:

```text
target deno-deploy — tier: deno-native · process: bounded-window · sagas: externalized

  runtime:http-serve@1        lossless
  runtime:cron@1              lossless     Deno.cron() is discovered automatically
  @netscript/kv:atomic@1      lossless     binding kv:default — Deno KV backing, atomic ops conform
  @netscript/kv:queues@1      unsupported  Deno KV on this platform exposes no queue primitives
  @netscript/queue:consume@1  unsupported  no platform queue — bind an external MQ over env config
```

(output abridged)

{{ comp callout { type: "note", title: "Reading capability verdicts" } }}
Every row is one capability with a level: <strong>lossless</strong> (works, with live-platform
evidence), <strong>partial</strong> (works with the stated caveat — must be acknowledged in
config), <strong>unsupported</strong> (demonstrated impossibility), or <strong>unverified</strong>
(not yet proven — see the reference for the distinction). Your plan <em>fails</em> only when your
app actually requires an <code>unsupported</code> capability; the rest is rendered so you know the
platform's shape. <code>sagas: externalized</code> means saga workers cannot run on this target —
run them on a long-lived target (containers, bare metal) or over an external transport.
See <a href="/orchestration-runtime/reference/deploy-capabilities/">Reference: deploy capabilities
and deploy doctor</a>.
{{ /comp }}

## Step 3 — Emit the artifact

```bash
netscript deploy deno-deploy emit
```

`emit` materializes the target's deploy artifacts and writes an **artifact manifest** describing
them: the artifact digest, the source revision, the target variant, and the emitter version. This
is the hand-off object between "build" and "deploy" — you will pass it to `up --prebuilt` in CI.

## Step 4 — Up

```bash
netscript deploy deno-deploy up
```

Plain `up` is the convenience form: it runs `plan` → `emit` → `up` in one command. Once deployed,
the remaining operations work as you'd expect:

{{ comp.apiTable({ caption: "netscript deploy deno-deploy <op>", rows: [
  { name: "status", type: "read", desc: "Read deployment state." },
  { name: "logs", type: "read", desc: "Show deployment logs." },
  { name: "rollback", type: "restore", desc: "Instant revision routing back to a previous deployment (platform-native)." },
  { name: "secrets", type: "manage", desc: "Manage environment references. Values are never serialized into artifacts, plans, or logs — only references." },
  { name: "down", type: "delete", desc: "Remove the deployment." }
] }) }}

Not every target declares every operation. The CLI never advertises an operation a target does
not declare, and calling one fails fast with an operation-unsupported error instead of a silent
no-op.

## Split build and deploy in CI

The `plan`/`emit`/`up` split exists so CI can build once and deploy the exact reviewed artifact.
A build job plans and emits; a later deploy job consumes the manifest — nothing is rebuilt, and
the manifest's digest and source revision prove what is being deployed:

```yaml
# .github/workflows/deploy-deno-deploy.yml (abridged — target add writes the full starter)
jobs:
  build:
    steps:
      - run: netscript deploy deno-deploy plan
      - run: netscript deploy deno-deploy emit
      - uses: actions/upload-artifact@v4
        with:
          name: deploy-artifacts
          path: <artifact-dir-printed-by-emit>
  deploy:
    needs: build
    environment: production
    steps:
      - uses: actions/download-artifact@v4
        with: { name: deploy-artifacts }
      - run: netscript deploy deno-deploy up --prebuilt <path-to-artifact-manifest>
        env:
          DENO_DEPLOY_TOKEN: ${{ secrets.DENO_DEPLOY_TOKEN }}
```

{{ comp callout { type: "warning", title: "Honest limits" } }}
<ul>
<li>No deploy target is preinstalled — run <code>deploy target add</code> for each platform, and
commit the generated <code>deploy/targets.ts</code> and workflow files.</li>
<li>Capability rejections happen at <code>plan</code> time. If your graph requires something the
target cannot do — an owned queue consumer on Deno Deploy, say — the plan fails with the verdict
and its note, not with a runtime surprise.</li>
<li>Secrets are references. Values never appear in plans, artifact manifests, telemetry, command
output, or errors; only the environment-variable names are checked.</li>
<li>Cluster/cloud auth, quotas, and regions are operator prerequisites. The CLI shells to the
platform's own tooling; it does not create credentials.</li>
</ul>
{{ /comp }}

## Troubleshooting

{{ comp.apiTable({ caption: "Common failures and what they mean", rows: [
  { name: "deploy group prints an install hint", type: "plugin", desc: "The deploy plugin is not installed in this workspace. Run <code>netscript plugin install deploy</code>." },
  { name: "DeployTargetAdapterMissingError", type: "config", desc: "Your config names a target whose adapter is not installed. Either <code>netscript deploy target add &lt;key&gt;</code> or remove the config member — unknown targets are an error, never silently ignored." },
  { name: "doctor: credential-unavailable", type: "auth", desc: "The environment variables the target expects (names only) are not set. Set them, or log in with the platform CLI." },
  { name: "deno deploy: command not found", type: "PATH", desc: "The native <code>deno deploy</code> CLI is not resolvable. NetScript shells out to it; confirm <code>deno deploy --help</code> works in the same shell." },
  { name: "plan fails on a capability", type: "verdict", desc: "Your app requires an <code>unsupported</code> capability for this target. Read the note; either change the backing, acknowledge a <code>partial</code>, or pick a target whose manifest allows it." }
] }) }}

## Where to go next

{{ comp.featureGrid({ items: [
  {
    title: "Deploy to Cloudflare Workers",
    body: "wrangler config emission, the isolate capability profile, and splitting an app into cells when it outgrows Workers.",
    href: "/orchestration-runtime/how-to/deploy-cloudflare-workers/",
    icon: "◆"
  },
  {
    title: "Reference: capabilities & doctor",
    body: "Verdict levels, the manifest JSON surface, doctor diagnostic states, and per-target permission profiles.",
    href: "/orchestration-runtime/reference/deploy-capabilities/",
    icon: "▣"
  },
  {
    title: "Migrate from the built-in commands",
    body: "Coming from the pre-plugin deploy commands? What survives, the one behavior change, and where the legacy verbs live.",
    href: "/orchestration-runtime/how-to/deploy-migrate/",
    icon: "◎"
  },
  {
    title: "Deploy target matrix",
    body: "Every shipped target by tier, process model, declared operations, and required tooling.",
    href: "/orchestration-runtime/reference/deploy-targets/",
    icon: "▣"
  }
] }) }}
````

### Page B — how-to: Deploy to Cloudflare Workers

````markdown
---
layout: layouts/base.vto
title: Deploy to Cloudflare Workers
templateEngine: [vento, md]
order: 110
---

# Deploy to Cloudflare Workers

**Goal:** ship a NetScript workspace to Cloudflare Workers with an emitted `wrangler.jsonc`, a
generated worker entry that adapts your app's Fetch handler, and capability checks that tell you —
at plan time — whether your app fits the isolate profile.

Your application code does not change for Workers. Services are written against Web-standard
APIs (`Request`/`Response`, streams, crypto); the target emits a thin worker entry that delegates
to your app's fetch boundary. What changes is the **realization**: Workers run an isolate process
model, and the capability manifest is blunt about what that costs.

## Before you start

{{ comp.apiTable({ caption: "What you need before your first deploy", rows: [
  { name: "The deploy plugin + cloudflare target", type: "plugin", desc: "<code>netscript plugin install deploy</code> on existing workspaces (preinstalled on new ones), then <code>netscript deploy target add cloudflare</code>." },
  { name: "A Cloudflare account", type: "account", desc: "Account ID plus an API token with Workers edit scope. There is no OIDC flow on Cloudflare yet — CI uses token secrets (below)." },
  { name: "wrangler", type: "external CLI", desc: "The adapter wraps Cloudflare's <code>wrangler</code> CLI (resolved via <code>npx</code>). <code>deploy doctor</code> verifies it resolves." }
] }) }}

## Step 1 — Add the target

```bash
netscript deploy target add cloudflare
```

This installs the adapter and emits the Cloudflare-specific assets:

{{ comp.apiTable({ caption: "What 'deploy target add cloudflare' lands on disk", rows: [
  { name: "wrangler.jsonc", type: "emitted config", desc: "Entry module, <code>compatibility_date</code>, and bindings blocks generated from your logical resource graph (KV namespaces, queues, D1…). Regenerated on <code>plan</code>/<code>emit</code> — edit the graph, not the file." },
  { name: "worker entry (generated)", type: "entry module", desc: "Adapts your app's <code>fetch</code> handler to the Workers module format. Your service code is untouched." },
  { name: "deploy/targets.ts", type: "declarations", desc: "Gains the <code>cloudflare</code> member; you own and edit this file (cells, environments)." },
  { name: ".github/workflows/deploy-cloudflare.yml", type: "CI starter", desc: "Uses <code>cloudflare/wrangler-action</code> with <code>CLOUDFLARE_API_TOKEN</code> and <code>CLOUDFLARE_ACCOUNT_ID</code> secrets — token-based, since Cloudflare has no OIDC. The scaffold README says so." }
] }) }}

## Step 2 — Know the workers profile

The `workers` variant's manifest reads, in short: **tier web-standard, process isolate**. The
rows that decide whether your app fits:

{{ comp.apiTable({ caption: "Capability caveats — cloudflare (variant: workers)", rows: [
  { name: "runtime:static-assets", type: "lossless", desc: "Workers Static Assets are first-class." },
  { name: "runtime:long-running-process", type: "unsupported", desc: "Isolates are not long-lived processes. Background loops do not belong on this variant." },
  { name: "sagas", type: "rejected", desc: "Saga workers are durable long-lived processes; an isolate cannot host them. A project that uses sagas is rejected at plan time with a cell proposal (below)." },
  { name: "@netscript/kv:atomic", type: "unsupported", desc: "Workers KV has no compare-and-swap. Any consumer that depends on CAS semantics is rejected at plan time — use a different backing for that state." },
  { name: "@netscript/queue:consume", type: "unsupported (v1)", desc: "Cloudflare Queues are push-mode; owned <code>listen()</code>-loop consumption is leaf-backing territory and not claimed yet. The queue itself is still declared by name as a binding." }
] }) }}

These are not fine print — `plan` compiles your graph against exactly these rows and fails the
build on a required `unsupported` capability. An acknowledged `partial` warns; an `unsupported`
requirement rejects.

## Step 3 — Develop with fidelity

```bash
aspire start        # the full graph and backing services, unchanged
npx wrangler dev    # the worker path, against the emitted wrangler.jsonc
```

{{ comp callout { type: "warning", title: "Miniflare is a simulator, not an oracle" } }}
<code>wrangler dev</code> runs your worker in a local simulation of the Workers runtime. It is
the right inner loop, but it is not the platform: before your first real deploy (and after any
binding change), run a smoke against the remote bindings. Treat a green local run as a strong
signal, not a proof.
{{ /comp }}

## Step 4 — Deploy

```bash
netscript deploy cloudflare plan    # emit wrangler config + entry, compile the capability verdict
netscript deploy cloudflare up      # wrangler deploy
```

{{ comp.apiTable({ caption: "netscript deploy cloudflare <op>", rows: [
  { name: "plan", type: "preflight", desc: "Emits <code>wrangler.jsonc</code> + the worker entry and compiles the verdict. Fails on a required <code>unsupported</code> capability." },
  { name: "up", type: "push", desc: "<code>plan</code> → <code>emit</code> → <code>wrangler deploy</code>." },
  { name: "status / logs", type: "read", desc: "Deployment state and live logs (<code>wrangler tail</code>)." },
  { name: "rollback", type: "restore", desc: "<code>wrangler versions rollback</code> — platform-native versioned rollback." },
  { name: "secrets", type: "manage", desc: "References over <code>wrangler secret</code>. Values never appear in plans, artifacts, or output." },
  { name: "down", type: "delete", desc: "Delete the worker." }
] }) }}

## When the app outgrows the isolate

If your graph requires something the isolate profile cannot do — sagas, an exclusive database
writer, owned queue consumption — `plan` does not guess a split. It **rejects**, and returns a
machine-readable `suggestedCells` proposal:

```jsonc
// abridged plan rejection
{
  "target": "cloudflare",
  "variant": "workers",
  "reasons": [
    { "kind": "sagas", "state": "rejected",
      "note": "Saga workers are long-lived; the workers variant runs an isolate process model." },
    { "ref": "runtime:long-running-process@1", "level": "unsupported", "scope": "runtime" }
  ],
  "suggestedCells": [
    { "id": "edge", "target": "cloudflare", "variant": "workers",
      "selectors": ["service:users", "app:dashboard"], "bindings": ["kv:cache"] },
    { "id": "jobs", "target": "cloudflare", "variant": "containers",
      "selectors": ["background:workers", "background:sagas"], "bindings": ["queue:jobs", "db:primary"] }
  ]
}
```

The compiler never partitions your app silently. You decide, then declare the cells yourself in
`deploy/targets.ts`:

```ts
// deploy/targets.ts
export default defineDeployTargets({
  cloudflare: {
    cells: [
      { id: "edge", variant: "workers",
        selectors: ["service:users", "app:dashboard"], bindings: ["kv:cache"] },
      { id: "jobs", variant: "containers",
        selectors: ["background:workers", "background:sagas"], bindings: ["queue:jobs", "db:primary"] },
    ],
  },
});
```

The `containers` cell is a second, separately declared target sharing the generated container
image path from the [container/PaaS recipe](/orchestration-runtime/how-to/deploy-containers/) —
same image, long-lived, so sagas and queue consumers run there losslessly. Every service,
consumer, and schedule has exactly one owning cell; cross-cell communication is explicit.

{{ comp callout { type: "warning", title: "Honest limits" } }}
<ul>
<li>One compute variant per target declaration. Mixed Workers+Containers apps declare cells
explicitly; nothing is auto-partitioned.</li>
<li>Workers KV has no CAS — <code>@netscript/kv:atomic</code> consumers are rejected at plan
time. Put CAS-dependent state on a backing that supports it.</li>
<li>Queue consumption is declared-by-name only in v1; an owned consumer loop is rejected until
the queue leaf backing lands.</li>
<li>CI auth is token-based (<code>CLOUDFLARE_API_TOKEN</code> + <code>CLOUDFLARE_ACCOUNT_ID</code>).
There is no OIDC flow yet.</li>
<li>Miniflare fidelity is limited — smoke against remote bindings before first deploy.</li>
</ul>
{{ /comp }}

## Troubleshooting

{{ comp.apiTable({ caption: "Common failures and what they mean", rows: [
  { name: "doctor: wrangler not found", type: "tool", desc: "The adapter shells out to <code>wrangler</code> (via <code>npx</code>). Confirm <code>npx wrangler --version</code> resolves." },
  { name: "plan rejects on kv:atomic", type: "verdict", desc: "A consumer needs compare-and-swap and Workers KV cannot provide it. Move that state to a CAS-capable backing, or to the containers cell." },
  { name: "plan rejects with suggestedCells", type: "topology", desc: "Your graph exceeds the isolate profile. Declare the proposed cells in <code>deploy/targets.ts</code> (or slim the graph) and re-plan." },
  { name: "401/403 from wrangler-action", type: "auth", desc: "Check <code>CLOUDFLARE_API_TOKEN</code> scope and <code>CLOUDFLARE_ACCOUNT_ID</code>. Token auth only — no OIDC." }
] }) }}

## Where to go next

{{ comp.featureGrid({ items: [
  {
    title: "Deploy a NetScript workspace",
    body: "The getting-started path: targets, plan/emit/up, capability output, CI split.",
    href: "/orchestration-runtime/how-to/deploy/",
    icon: "◆"
  },
  {
    title: "Reference: capabilities & doctor",
    body: "Verdict levels and scopes, the manifest JSON surface, diagnostic states, permission profiles.",
    href: "/orchestration-runtime/reference/deploy-capabilities/",
    icon: "▣"
  },
  {
    title: "Deploy containers to a PaaS",
    body: "The shared container image path the jobs cell uses.",
    href: "/orchestration-runtime/how-to/deploy-containers/",
    icon: "◎"
  }
] }) }}
````

### Page C — reference: `deploy capabilities` and `deploy doctor`

````markdown
---
layout: layouts/base.vto
title: "Reference: deploy capabilities and deploy doctor"
templateEngine: [vento, md]
order: 130
---

# Reference: `deploy capabilities` and `deploy doctor`

The deploy plugin has no HTTP service and no dashboard — its machine-readable surface is the
**capability manifest**, exposed through two commands: `deploy capabilities` renders a target's
manifest; `deploy doctor` validates everything a configured target needs to actually run.

## `netscript deploy capabilities [<target>] [--json]`

With a target argument, prints that target's manifest; without one, prints every configured
target's manifest independently. `--json` emits the manifest as JSON that validates against the
published manifest schema (including `schemaVersion`) — suitable for CI assertions.

```jsonc
// netscript deploy capabilities cloudflare --json   (excerpt)
{
  "schemaVersion": 1,
  "target": "cloudflare",
  "variant": "workers",              // manifests are per target variant — never mode-collapsed
  "tier": "web-standard",            // deno-native | web-standard | node-compat
  "process": "isolate",              // long-lived | bounded-window | isolate
  "sagas": "rejected",               // supported | externalized | rejected
  "verdicts": {
    "runtime:http-serve@1":           { "level": "lossless",    "scope": "runtime" },
    "runtime:static-assets@1":        { "level": "lossless",    "scope": "runtime" },
    "runtime:long-running-process@1": { "level": "unsupported", "scope": "runtime",
      "note": "Workers run an isolate process model, not a long-lived process." },
    "@netscript/kv:atomic@1":         { "level": "unsupported", "scope": "binding",
      "note": "Workers KV has no compare-and-swap; CAS-dependent consumers are rejected at plan time." }
  },
  "toolVersions": { "wrangler": "<pinned range>" },  // upstream tool range the verdicts track
  "probedAt": "2026-07-19"                            // when the live-platform evidence was collected
}
```

### Manifest fields

{{ comp.apiTable({ caption: "DeployCapabilityManifest fields", rows: [
  { name: "schemaVersion", type: "number", desc: "Manifest schema version — assert on it when consuming <code>--json</code>." },
  { name: "target / variant", type: "string", desc: "Registry key and compute variant (<code>workers</code>, <code>containers</code>, <code>lambda</code>, <code>fargate</code>, <code>compose</code>, <code>kubernetes</code>…). Verdicts are per variant." },
  { name: "tier", type: "enum", desc: "<code>deno-native</code> (a Deno process or image), <code>web-standard</code> (web-API code on an isolate runtime), or <code>node-compat</code> (provider runtime is Node; the compat cost is declared)." },
  { name: "process", type: "enum", desc: "<code>long-lived</code>, <code>bounded-window</code>, or <code>isolate</code> — the process model the artifact runs under." },
  { name: "sagas", type: "tri-state", desc: "<code>supported</code> | <code>externalized</code> | <code>rejected</code> — whether saga workers can run on this variant." },
  { name: "verdicts", type: "map", desc: "Per-capability verdicts keyed by namespaced, versioned capability refs (below)." },
  { name: "toolVersions / probedAt", type: "metadata", desc: "The upstream tool range the manifest tracks, and when its live evidence was last collected." }
] }) }}

### Verdict levels, scopes, and the evidence rule

{{ comp.apiTable({ caption: "Capability verdict levels", rows: [
  { name: "lossless", type: "level", desc: "Works as designed. Requires live-platform evidence — an in-memory fake can prove the conformance suite runs, but it never certifies the provider." },
  { name: "partial", type: "level", desc: "Works with the stated caveat. Must be acknowledged in config; <code>plan</code> warns." },
  { name: "unsupported", type: "level", desc: "A demonstrated impossibility. If your app requires it, <code>plan</code> fails with the note — at build time, never at runtime." },
  { name: "unverified", type: "level", desc: "Not yet proven: no live conformance run, or live state could not be checked. <strong>Not</strong> the same as <code>unsupported</code>." }
] }) }}

Each verdict also carries a **scope** saying what it describes:

{{ comp.apiTable({ caption: "Verdict scopes", rows: [
  { name: "runtime", type: "scope", desc: "A trait of the platform runtime itself (HTTP serving, static assets, cron, long-running processes)." },
  { name: "adapter", type: "scope", desc: "A property of the deploy adapter (declared operations, emission behavior)." },
  { name: "binding", type: "scope", desc: "A semantic guarantee of a named logical resource (queue consume/ack semantics, KV atomicity). Composed from the installed leaf backing's manifest — a runtime manifest never claims queue/KV semantics by itself." }
] }) }}

Verdicts may carry `note` (the honest caveat, surfaced by the CLI) and `evidence` (the
conformance cell that produced the verdict). A `lossless` row without its evidence is a bug —
report it.

### Operations are declared subsets

Every target declares the subset of the eight operations it implements. The CLI never advertises
an operation a target does not declare; calling one fails with
`DeployOperationUnsupportedError`. `rollback` is platform-native or convention-backed per target —
never a silent no-op.

## `netscript deploy doctor`

Validates each configured target end to end:

1. the target's adapter package is installed,
2. its registered descriptor resolves,
3. the required external tool is on `PATH` (`wrangler`, `aspire`, `docker`, `deno`…),
4. the expected credential environment variables are present — **names only, never values**,
5. the target's config member parses against its schema,
6. the capability verdict for your project graph.

### Diagnostic states

{{ comp.apiTable({ caption: "Doctor diagnostic states", rows: [
  { name: "adapter-not-installed", type: "state", desc: "Config names a target whose adapter package is missing. Fix: <code>netscript deploy target add &lt;key&gt;</code>, or remove the config member." },
  { name: "credential-unavailable", type: "state", desc: "The credential env vars the target expects are not set, so live state cannot be verified. This is not a platform impossibility — set the variables and re-run." },
  { name: "unverified", type: "state", desc: "A capability is unproven (no live conformance run, or live state unreachable). Distinct from impossible." },
  { name: "unsupported", type: "state", desc: "A demonstrated impossibility for your graph on this target. Fix the backing or the target choice — re-running will not change it." }
] }) }}

{{ comp callout { type: "note", title: "unverified ≠ unsupported" } }}
Doctor and capability output deliberately separate <em>we could not prove it</em> (unverified,
adapter-not-installed, credential-unavailable) from <em>the platform cannot do it</em>
(unsupported). Only the second fails a plan on a required capability. If a verdict looks stale,
re-run doctor with credentials available — <code>probedAt</code> on the manifest tells you when
the evidence was collected.
{{ /comp }}

## Permission profiles

The plugin's own baseline permissions are deliberately small (workspace read/write, registry
network access). Each target then declares the **exact** additional profile its tooling needs —
no target inherits another's permissions, and the plugin never aggregates a union of every
provider's permissions. `deploy doctor` prints the exact profile for your configured targets.

{{ comp.apiTable({ caption: "Per-target permission profiles (shipped adapters)", rows: [
  { name: "deno-deploy", type: "permissions", desc: "<code>--allow-run=deno</code>, <code>--allow-net</code> (platform API), <code>--allow-read</code>." },
  { name: "cloudflare", type: "permissions", desc: "<code>--allow-run=wrangler,npx</code>, <code>--allow-net</code>." },
  { name: "container targets (fly, koyeb, sevalla, coolify, dokploy)", type: "permissions", desc: "<code>--allow-run=docker,podman,flyctl</code>, <code>--allow-net</code> per platform API." },
  { name: "baremetal", type: "permissions", desc: "<code>--allow-run=servy,systemctl,deno</code>, filesystem access on the install base." },
  { name: "aspire targets (compose, docker, kubernetes, azure-*)", type: "permissions", desc: "<code>--allow-run=aspire,docker</code>, read/write on the output directories." }
] }) }}

Other adapters declare their own profiles; doctor reports the installed set exactly.

## Where to go next

{{ comp.featureGrid({ items: [
  {
    title: "Deploy a NetScript workspace",
    body: "The getting-started path that uses these verdicts.",
    href: "/orchestration-runtime/how-to/deploy/",
    icon: "◆"
  },
  {
    title: "Deploy target matrix",
    body: "Every shipped target by tier, process model, declared operations, and required tooling.",
    href: "/orchestration-runtime/reference/deploy-targets/",
    icon: "▣"
  },
  {
    title: "Migrate from the built-in commands",
    body: "The compatibility map for pre-plugin deploy usage.",
    href: "/orchestration-runtime/how-to/deploy-migrate/",
    icon: "◎"
  }
] }) }}
````

### Page D — how-to: Migrate from the built-in deploy commands

````markdown
---
layout: layouts/base.vto
title: Migrate from the built-in deploy commands
templateEngine: [vento, md]
order: 120
---

# Migrate from the built-in deploy commands

**Goal:** if you used NetScript's deploy commands before the deploy plugin existed, know exactly
what changed and what did not. The short version: **your commands and your config keep working.**
Deployment is now owned by a plugin family — a core plus one adapter per platform — and the CLI
group you already type is the same group.

## What changed

- **The behavior owner is a plugin.** The `deploy` shell stays built-in (it owns `deploy
  desktop`, shared help, and the install hint when the plugin is absent); the deploy plugin
  contributes the behavior under it — the target operations, `target add/remove`, `capabilities`,
  and `doctor`. Existing projects keep working without the plugin; installing it is additive.
- **Targets are explicit.** New workspaces ship with the plugin installed but **no deploy
  target** — add each one with `netscript deploy target add <key>`, which installs the adapter,
  registers it, and emits its config member and starter assets.
- **New commands** (from the plugin):

{{ comp.apiTable({ caption: "New deploy commands", rows: [
  { name: "deploy target add <key>", type: "new", desc: "Install a target's adapter, register it, write its config member and scaffold assets (workflow files, platform config)." },
  { name: "deploy target remove <key>", type: "new", desc: "Remove a target registration." },
  { name: "deploy capabilities [<target>] [--json]", type: "new", desc: "Print the capability manifest — what the target can and cannot run for your graph." },
  { name: "deploy doctor", type: "new", desc: "Validate configured targets: adapter installed, tool on PATH, credential env names present, config parses, capability verdict." }
] }) }}

## The one deliberate behavior change: unknown target keys are now an error

Previously, an unrecognized key under `deploy.targets` was **silently ignored** at config load.
It now fails fast with `DeployTargetAdapterMissingError`:

```ts
// netscript.config.ts
export default {
  deploy: {
    targets: {
      "deno-deply": { org: "my-org", app: "my-app" }, // typo: previously ignored, now an error
    },
  },
};
```

{{ comp callout { type: "important", title: "Surfacing misconfiguration is the point" } }}
A config that names a target with no installed adapter is almost always a typo or a missing
install — and silent stripping turned both into confusing no-ops. Fix either way:
<code>netscript deploy target add &lt;key&gt;</code> to install the adapter, or remove the config
member. Every key that parsed before still parses identically; only <em>unknown</em> keys changed
behavior.
{{ /comp }}

## Verbs that keep working, unchanged

Every documented `netscript deploy …` invocation works as before:

- **Managed and Aspire-backed targets** — `deploy deno-deploy|compose|docker|kubernetes|
  azure-aca|azure-app-service|azure-aks|cloud-run <op>` — same commands, same behavior. The
  Aspire lanes are unchanged in behavior; they changed owner (an adapter package), not shape.
- **`deploy desktop`** — unchanged, built-in, and not part of the deploy plugin family.
- **Previously scaffolded CI workflows** keep functioning — they call the same verbs.

## Where `build`, `start`, `stop`, `upgrade`… now live

The legacy flat verbs remain **first-class compatibility handlers**, owned by the bare-metal
adapter and routed through the built-in shell. Their semantics are preserved exactly — they are
*not* aliases of `up`/`down`:

{{ comp.apiTable({ caption: "Legacy flat verbs — status", rows: [
  { name: "build", type: "alias", desc: "Direct alias of <code>plan</code> + <code>emit</code>: compiles the deploy artifacts." },
  { name: "status / logs", type: "alias", desc: "Direct aliases of the canonical read ops." },
  { name: "install / uninstall", type: "compat handler", desc: "Register/remove the OS service, as before." },
  { name: "start / stop", type: "compat handler", desc: "Operate on an already-registered service. <code>stop</code> never uninstalls; <code>start</code> never registers." },
  { name: "copy", type: "compat handler", desc: "Syncs prebuilt artifacts to the host without registering anything." },
  { name: "upgrade", type: "compat handler", desc: "The same multi-step transaction as before, unchanged." },
  { name: "package-cli", type: "compat handler", desc: "Builds the operator binary, unchanged." }
] }) }}

{{ comp callout { type: "note", title: "Deprecation, not removal" } }}
Help output marks the legacy verbs deprecated, but <strong>no removal date is claimed</strong>:
they stay first-class through at least the next semver-major, and only once an equivalent
canonical workflow and migration telemetry exist. State-transition tests prove
<code>stop</code> never uninstalls and <code>start</code> never registers.
{{ /comp }}

## Config: keys survive; one vocabulary map to learn

Existing config keys parse identically: `windows`, `linux`, `docker`, `compose`, `deno-deploy`,
`kubernetes`, `azure-*`, `cloud-run`, including the `environments` overlay. Legacy types stay
exported for the compatibility window.

One naming seam to be aware of — the bare-metal lane has three vocabularies that are *not*
interchangeable:

{{ comp.apiTable({ caption: "Bare-metal vocabulary map", rows: [
  { name: "Config keys", type: "netscript.config.ts", desc: "<code>deploy.targets.windows</code> / <code>deploy.targets.linux</code>." },
  { name: "Registry keys", type: "target registry", desc: "<code>windows-service</code> / <code>linux-service</code> — what <code>deploy capabilities</code> and <code>doctor</code> print." },
  { name: "CLI target", type: "command line", desc: "<code>netscript deploy baremetal &lt;op&gt;</code> — the verb target for the lane." }
] }) }}

## CI workflows

Previously generated workflow files keep running — they invoke the same verbs. New scaffolds get
per-target workflows from the adapters, OIDC-first where the platform supports it (AWS role
assumption, Deno Deploy organization tokens) and token-based where it does not (Cloudflare API
token + account ID).

## Optional adoption checklist

Nothing is required. When you want the new surface:

```bash
netscript plugin install deploy            # additive; existing commands keep working
netscript deploy doctor                    # validate configured targets and credentials
netscript deploy capabilities --json       # machine-readable verdicts for CI assertions
netscript deploy target add <key>          # add another platform side by side
```

Then, at your own pace, move CI release jobs to the build/deploy split (`plan` + `emit` in the
build job, `up --prebuilt` in the deploy job) so what you deploy is exactly what you reviewed.

## Where to go next

{{ comp.featureGrid({ items: [
  {
    title: "Deploy a NetScript workspace",
    body: "The plugin-era getting-started path: target add, plan/emit/up, CI split.",
    href: "/orchestration-runtime/how-to/deploy/",
    icon: "◆"
  },
  {
    title: "Reference: capabilities & doctor",
    body: "Verdict levels, manifest JSON, diagnostic states, permission profiles.",
    href: "/orchestration-runtime/reference/deploy-capabilities/",
    icon: "▣"
  },
  {
    title: "Deploy to bare metal",
    body: "The lane that owns the legacy verbs: services, activation, rollback conventions.",
    href: "/orchestration-runtime/how-to/deploy-baremetal/",
    icon: "◎"
  }
] }) }}
````

---

## DX findings

Every seam the forecast docs could not explain cleanly. Format: claim · why it hurt the page ·
corpus ref.

**KF-1 — Contradiction: does a fresh scaffold ship a default deploy target?**
Hurt: Page A must answer "what do I have right after `netscript init`" in its first section, and
the corpus gives two answers — the compatibility contract says new scaffolds get the plugin
preinstalled *"with the `deno-deploy` default target"*, while the scaffold story and the adapter
card (the r2-adjudicated quick win) say *no target is preinstalled; targets are always added
explicitly*. Page A is written to the r2 answer, but the contradiction blocks any statement about
the out-of-box state until DP-6 is amended.
Ref: DP-6 §3 item 3 vs DP-8 Story 0 / DP-3 §3.

**KF-2 — Two target surfaces with the same name.**
Hurt: `deploy/targets.ts` (typed target/cell *declarations* the user owns) and
`netscript.config.ts` → `deploy.targets.<key>` (per-target *settings*) are both called "targets"
throughout the corpus. Pages A, B, and D each had to coin an awkward distinction ("declarations
vs. settings") to keep users from editing the wrong file; the `DeployTargetContribution`
descriptor's home (registry file vs. leaf file) is also not pinned, so the pages can't say
precisely what `target add` appends where.
Ref: DP-4 §1/§4, DP-8 Story 0, DP-2 §5.

**KF-3 — Bare metal has three vocabularies for one lane.**
Hurt: config keys `windows`/`linux`, registry keys `windows-service`/`linux-service`, and CLI
target `baremetal` are "distinct vocabularies with one explicit mapping table" — but that means
the migration page needs a mapping *table* to answer "what do I type to deploy to my Linux box?"
(`deploy baremetal <op>`), and no page can use one consistent name for the lane.
Ref: DP-2 §6 (key-mapping note), DP-6 M-5/M-11.

**KF-4 — The legacy aliases don't name their target.**
Hurt: "`build → plan + emit`, `status`, and `logs` are direct aliases" — aliases of *which*
target? The shipped verbs are bare-metal-flavored and target-less; in the eight-op world every op
hangs off a target. Page D can document `build` as an alias but cannot write the canonical
replacement command (is it `deploy baremetal plan` + `deploy baremetal emit`?) without guessing.
Ref: DP-2 §2, DP-6 M-11.

**KF-5 — The eight ops are locked; their CLI grammar is not.**
Hurt: no per-op flags or arguments exist anywhere in the corpus — `secrets` (set/list/rotate?
which sub-grammar?), `rollback` (revision selector? `--version`?), `emit` (output-dir flag?),
`down` (confirmation?). The reference page and both how-tos can show the op names but not a
single complete `secrets` or `rollback` invocation, which is exactly what command-first docs need.
Ref: DP-2 §2.

**KF-6 — The `--prebuilt` hand-off contract is too thin to write the CI snippet.**
Hurt: Page A's CI split needs a concrete artifact hand-off, but the corpus never says where
`emit` writes, what the manifest file is called, or whether `--prebuilt` takes a path, a digest,
or a convention. The page ships `<artifact-dir-printed-by-emit>` placeholders — visible seams in
the flagship getting-started flow.
Ref: DP-2 §2/§3.

**KF-7 — `init --deploy <provider>` is used by the stories but still an open decision.**
Hurt: scaffold Stories 1–4 are titled around `netscript init my-app --deploy cloudflare`, yet the
plan lists "init flag vs post-init `target add` only" as an open decision not taken. Page B was
written around the locked flow (`target add`) and cannot document the provider-optimized init
variant the stories promise; the IA's "optimized scaffold" pages have no stable first command.
Ref: DP-8 Stories 1–4 headers vs plan.md §3 (open decisions).

**KF-8 — Environment-qualified targets have no invocation grammar.**
Hurt: the registry is keyed `<targetKey>[@<environment>]` and config carries an `environments`
overlay, but no page can show how to deploy the staging environment of a target — is it
`deploy cloudflare@staging up`, a `--env` flag, or a config-only concept? Multi-environment docs
(the most common real-world case) are unwriteable.
Ref: DP-2 §6.

**KF-9 — `emit` on the flagship target is uncorroborated.**
Hurt: the brief-mandated getting-started flow is `plan → emit → up` on `deno-deploy`, but the
emitter-format vocabulary lists `deno-binary | oci-image | wrangler-worker |
vercel-build-output | aspire-publish` — no Deno Deploy format — and the `deploy-deno` adapter
card's op list omits `emit`. Page A shows `deploy deno-deploy emit` producing a manifest it
cannot describe; either the card gains an emit story or the getting-started page changes shape.
Ref: DP-2 §3, DP-3 §3.

**KF-10 — No capability preview before install.**
Hurt: verdicts come from installed adapters (and binding-scope verdicts from installed leaf
backings), so `deploy capabilities cloudflare` *before* `target add cloudflare` can only report
adapter-not-installed. The docs cannot offer the natural adoption loop — "check what a platform
would give you, then decide" — which is precisely the differentiator the capability story sells.
Ref: DP-2 §4, DP-4 §4.

**KF-11 — `suggestedCells` is a dead-end hand-off.**
Hurt: plan rejections return machine-readable cell proposals, but nothing consumes them: the
user must hand-translate JSON into `deploy/targets.ts` cell declarations with correct selector
syntax (itself unspecified — Page B's `service:users` style is invented for illustration). No
`target add --cell`, no scaffold assist, no `plan --apply-suggestion`. The first Cloudflare
rejection is the moment the docs most need a next command, and there isn't one.
Ref: DP-2 §5, DP-8 Story 1.

**KF-12 — `deploy target remove` semantics are unspecified.**
Hurt: the verb is named (peer install + descriptor + config member + scaffold assets on add;
"uninstall" and "stale registry entry" appear only as failure-mode test names), but its
subtractive behavior — peer package uninstall? config-member pruning? workflow/asset deletion?
`deploy/targets.ts` edits? — is nowhere defined. The migration page can list the command but
cannot document the off-ramp.
Ref: DP-4 §1/§6.

**KF-13 — Three verdict surfaces, no stated precedence.**
Hurt: `plan` renders caveats, `capabilities` renders the manifest, and `doctor` re-renders a
capability verdict for the graph — three places showing overlapping truth with no canonical rule
for which is authoritative when they disagree (e.g. a stale `probedAt` manifest vs. a live doctor
run). The reference page had to invent the guidance ("re-run doctor; check `probedAt`") rather
than cite it.
Ref: DP-2 §2/§4, DP-4 §4/§6, DP-8 acceptance gates.
